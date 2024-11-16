"use server";
const { DateTime } = require("luxon");
const sgMail = require("@sendgrid/mail");
import { addHours, isBefore } from "date-fns";
const accessTokenParam = `access_token=${encodeURIComponent(process.env.DIRECTUS_ACCESS_TOKEN)}`;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { createRefund, createPaymentRequest } = require("./swish");
let cachedToken = null;
let tokenExpirationTime = 0;
let cachedTemperature = null;
let temperatureFetchTime = 0;

const TOKEN_CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
const TEMPERATURE_CACHE_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds

async function getAuthToken() {
  const currentTime = Date.now();
  if (cachedToken && currentTime < tokenExpirationTime) {
    return cachedToken;
  }

  const username = "api@falkenberg-energi.se";
  const password = process.env.BADTEMP_PASSWORD;

  try {
    const authResponse = await fetch(
      "https://webiot.iioote.io/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      },
    );

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.statusText}`);
    }

    const { token } = await authResponse.json();
    if (!token) {
      throw new Error("Token not found in authentication response");
    }

    cachedToken = token;
    tokenExpirationTime = currentTime + TOKEN_CACHE_DURATION;
    return token;
  } catch (error) {
    console.error("Error during authentication:", error);
    throw error;
  }
}

export async function getTemperature() {
  const currentTime = Date.now();
  if (process.env.MOCK_TEMPERATURE === "true") return "30.0";
  if (
    cachedTemperature &&
    currentTime < temperatureFetchTime + TEMPERATURE_CACHE_DURATION
  ) {
    return cachedTemperature;
  }

  const device_id = "57dd23f0-d516-11ec-921d-3df07923d1a8";

  try {
    const token = await getAuthToken();
    console.log("fetching temperature from provider...");
    const temperatureResponse = await fetch(
      `https://webiot.iioote.io/api/plugins/telemetry/DEVICE/${device_id}/values/timeseries?keys=Temperature`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Authorization": `Bearer ${token}`,
        },
      },
    );

    if (!temperatureResponse.ok) {
      throw new Error(
        `Failed to fetch temperature: ${temperatureResponse.statusText}`,
      );
    }

    const temperatureData = await temperatureResponse.json();
    const currentTemperature = temperatureData?.Temperature?.[0]?.value;

    if (currentTemperature === undefined) {
      throw new Error("Temperature data not found in API response");
    }

    cachedTemperature = currentTemperature;
    temperatureFetchTime = currentTime;
    return currentTemperature;
  } catch (error) {
    console.error("Error fetching temperature:", error);
    if (cachedTemperature !== null) {
      console.warn("Returning last cached temperature due to error");
      return cachedTemperature;
    }
    throw error;
  }
}

export async function getHeader() {
  const res = await fetch("https://cms.falkenbergskallbad.se/items/header");
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }
  const result = await res.json();
  return result.data;
}

export async function getFooter() {
  const res = await fetch("https://cms.falkenbergskallbad.se/items/footer");
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }
  const result = await res.json();
  return result.data;
}

export async function createNewMember(memberData) {
  const { firstName, lastName, email } = memberData;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/medlemmar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fornamn: firstName,
          efternamn: lastName,
          email: email,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`CMS submission failed: ${errorData}`);
    }

    return response.status;
  } catch (error) {
    console.error("Error creating new member:", error);
    throw error;
  }
}

export async function getSlots() {
  const res = await fetch(
    'https://cms.falkenbergskallbad.se/items/slots?filter={"end_time": {"_gte": "$NOW"}}&access_token=' +
      process.env.DIRECTUS_ACCESS_TOKEN,
    {
      cache: "no-store",
    },
  );
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }
  const result = await res.json();
  return result.data;
}

export async function getPriceList() {
  const res = await fetch(
    "https://cms.falkenbergskallbad.se/items/price_list?access_token=" +
      process.env.DIRECTUS_ACCESS_TOKEN,
  );
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }
  const result = await res.json();
  return result.data;
}
export async function getUserCoupons(email) {
  const filterObject = {
    _and: [
      {
        expiry_date: {
          _gte: "$NOW",
        },
      },
      {
        start_date: {
          _lte: "$NOW",
        },
      },
      {
        remaining_uses: {
          _gt: 0,
        },
      },
      {
        user: {
          email: {
            _eq: email,
          },
        },
      },
    ],
  };

  const filterParam = `filter=${JSON.stringify(filterObject)}`;

  const url = `https://cms.falkenbergskallbad.se/items/coupons?${filterParam}&${accessTokenParam}`;
  // console.log(url)

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    throw new Error("Failed to fetch user coupons");
  }
}

export async function checkMembership(email) {
  const filterObject = {
    email: {
      _eq: email,
    },
  };
  const filterParam = `filter=${JSON.stringify(filterObject)}`;
  const url = `https://cms.falkenbergskallbad.se/items/medlemmar?${filterParam}&access_token=${process.env.DIRECTUS_ACCESS_TOKEN}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
    }
    const result = await res.json();

    // If the result data array has any items, a member was found
    return result.data.length > 0;
  } catch (error) {
    console.error("Error checking membership:", error);
    throw new Error("Failed to check membership");
  }
}

async function checkAvailability(order) {
  // Check that slot is still available
  const res = await fetch(
    `https://cms.falkenbergskallbad.se/items/slots/${order.slotId}?${accessTokenParam}`,
    {
      cache: "no-store", // This disables caching for this request
    },
  );

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const result = await res.json();
  const currentSlot = result.data;

  if (!currentSlot) {
    throw new Error("Slot not found");
  }

  if (currentSlot.available_seats < order.selectedSeats) {
    throw new Error("Not enough seats available");
  }
  return currentSlot;
}

async function checkCard(order) {
  const res = await fetch(
    `https://cms.falkenbergskallbad.se/items/coupons/${order.couponId}?${accessTokenParam}`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const result = await res.json();
  const coupon = result.data;

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  if (coupon.code !== order.couponCode) {
    throw new Error("Angiven kod är felaktig.");
  }

  if (coupon.expiry_date < new Date()) {
    throw new Error("Kortet har passerat utgångsdatumet");
  }

  if (coupon.remaining_uses < order.selectedSeats) {
    throw new Error("Ej tillräckligt med användningar");
  }
  return coupon;
}

async function addUser(order) {
  //Find user
  const filterObject = {
    email: {
      _eq: order.email,
    },
  };
  const filterParam = `filter=${JSON.stringify(filterObject)}`;

  const res = await fetch(
    `https://cms.falkenbergskallbad.se/users?${filterParam}&${accessTokenParam}`,
  );
  const result = await res.json();
  let user;

  if (result.data.length < 1) {
    user = await createUser(order);
  } else {
    user = result.data[0];
  }
  return user;
}
async function createUser(order) {
  const userData = {
    email: order.email,
    phone: order.phone,
    role: "d383076b-8b2d-4f22-b325-6a534ed16bad", //id for role Bastubadare
  };

  try {
    const response = await fetch(
      `https://cms.falkenbergskallbad.se/users?${accessTokenParam}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("User created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}
async function createCode(email, slot) {
  try {
    // Convert start and end times to UTC
    const startTime = DateTime.fromISO(slot.start_time).toUTC().toISO();
    const endTime = DateTime.fromISO(slot.end_time).toUTC().toISO();

    const payload = {
      device_id: process.env.SEAM_DEVICE_ID,
      starts_at: startTime,
      ends_at: endTime,
      name: email,
      preferred_code_length: 6,
    };

    console.log("Creating code: ", payload);

    const response = await fetch(
      "https://connect.getseam.com/access_codes/create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SEAM_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorBody}`,
      );
    }

    const data = await response.json();
    if (!data.access_code || !data.access_code.code) {
      throw new Error("Invalid response format from Seam API");
    }

    console.log("Access code created successfully:", data.access_code.code);
    return data.access_code.code;
  } catch (error) {
    console.error("Error creating access code:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

async function createBooking(order, user, slot, transactionId) {
  try {
    const door_code = await createCode(user.email, slot);
    const bookingData = {
      user: user.id,
      slot: order.slotId,
      booked_seats: order.selectedSeats,
      transaction: transactionId,
      door_code: door_code,
    };
    if (order.couponId) bookingData.coupon = order.couponId;

    const response = await fetch(
      `https://cms.falkenbergskallbad.se/items/bookings?${accessTokenParam}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Booking created successfully:", data);

    //Update slot
    await updateSlotAvailability(slot.id, order.selectedSeats);

    return data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}

async function useKlippKort(coupon, order) {
  const remaining_uses = coupon.remaining_uses - order.selectedSeats;
  const res = await fetch(
    `https://cms.falkenbergskallbad.se/items/coupons/${coupon.id}?${accessTokenParam}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ remaining_uses: remaining_uses }),
    },
  );
  const data = res.json();
  return data;
}
export async function bookUsingCard(order) {
  try {
    const slot = await checkAvailability(order);
    const coupon = await checkCard(order);
    const user = await addUser(order);
    await createBooking(order, user, slot);
    if (coupon.type === "Klippkort") await useKlippKort(coupon, order);
    return { success: true, message: "Slot successfully booked" };
  } catch (error) {
    // console.error('Error in bookSlot:', error);
    return { success: false, message: error.message };
  }
}
export async function getPayment(paymentRequestId) {
  try {
    const res = await fetch(
      `https://cms.falkenbergskallbad.se/items/transactions/${paymentRequestId}?${accessTokenParam}`,
    );

    if (res.status === 403) {
      console.log(
        `Payment request ${paymentRequestId} not found in backend yet`,
      );
      return { status: "PENDING" }; // Treat 403 as a pending state
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (!data || !data.data) {
      throw new Error("Invalid response format");
    }

    const payment = data.data;
    const { status } = payment;

    if (!status) {
      throw new Error("Status not found in response");
    }

    if (["PAID", "DECLINED", "ERROR", "CANCELLED"].includes(status)) {
      return payment;
    } else {
      return { status: "PENDING" }; // For any other status, we consider it as pending
    }
  } catch (error) {
    console.error("Error fetching payment status:", error);
    throw error;
  }
}
export async function createTransaction(order, message) {
  console.log("Creating transaction for order");
  const newPaymentRequest = await createPaymentRequest(
    order.totalPrice,
    message,
  );
  const res = await fetch(
    `https://cms.falkenbergskallbad.se/items/transactions?${accessTokenParam}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: newPaymentRequest.id,
        order,
        status: "PENDING",
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const data = await res.json();
  console.log("Transaction created successfully:", data.data);
  return newPaymentRequest;
}

export async function bookUsingSwish(order, paymentRequestId) {
  //Get the paymentrequest and make sure its ok
  try {
    const res = await fetch(
      `https://cms.falkenbergskallbad.se/items/transactions/${paymentRequestId}?${accessTokenParam}`,
    );
    const data = await res.json();
    const payment = data.data;
    if (payment.status !== "PAID") throw new Error("Betalning misslyckades");
    const slot = await checkAvailability(order);
    const user = await addUser(order);
    const booking = await createBooking(order, user, slot, payment.id);
    const result = {
      success: true,
      message: "Slot successfully booked",
      ...booking.data,
    };
    console.log("Booking result:", result);
    return result;
  } catch (error) {
    // console.error('Error in bookSlot:', error);
    return { success: false, message: error.message };
  }
}

export async function findBookingByUUID(uuid) {
  try {
    const filterObject = {
      uuid: {
        _eq: uuid,
      },
    };
    const filterParam = encodeURIComponent(JSON.stringify(filterObject));

    const url = `https://cms.falkenbergskallbad.se/items/bookings?${accessTokenParam}&filter=${filterParam}&fields=*,coupon.*,transaction.*,user.*,slot.*`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch booking: ${res.status} ${res.statusText}`,
      );
    }

    const result = await res.json();

    if (result.data && result.data.length > 0) {
      return result.data[0]; // Return the first (and should be only) matching booking
    } else {
      throw new Error("No booking found with the given UUID");
    }
  } catch (error) {
    console.error("Error finding booking by UUID:", error);
    throw new Error("Failed to find booking details");
  }
}

export async function findBookingByPaymentRequest(paymentRequestId) {
  console.log("Finding booking by payment request ID:", paymentRequestId);
  try {
    const filterObject = {
      transaction: {
        _eq: paymentRequestId,
      },
    };
    const filterParam = encodeURIComponent(JSON.stringify(filterObject));
    const url = `https://cms.falkenbergskallbad.se/items/bookings?${accessTokenParam}&filter=${filterParam}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch booking: ${res.status} ${res.statusText}`,
      );
    }

    const result = await res.json();
    if (result.data && result.data.length > 0) {
      return result.data[0]; // Return the first (and should be only) matching booking
    } else {
      return null; // No booking found with the given payment request ID
    }
  } catch (error) {
    console.error("Error finding booking by payment request ID:", error);
    throw new Error("Failed to find booking details");
  }
}

export async function cancelBooking(id) {
  try {
    // First, fetch the booking details including slot information
    const fetchUrl = `https://cms.falkenbergskallbad.se/items/bookings/${id}?fields=*,slot.*,transaction.*,coupon.*&${accessTokenParam}`;
    const fetchResponse = await fetch(fetchUrl);
    if (!fetchResponse.ok) {
      throw new Error(
        `Failed to fetch booking details: ${fetchResponse.status} ${fetchResponse.statusText}`,
      );
    }
    const bookingDetails = await fetchResponse.json();

    // Check if cancellation is allowed (more than 24 hours before start time)
    const startTime = new Date(bookingDetails.data.slot.start_time);
    const cancellationDeadline = addHours(new Date(), 24);
    if (isBefore(cancellationDeadline, startTime)) {
      // Cancellation is allowed, proceed with cancellation
      const cancelUrl = `https://cms.falkenbergskallbad.se/items/bookings/${id}?${accessTokenParam}`;
      const cancelResponse = await fetch(cancelUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });
      if (!cancelResponse.ok) {
        throw new Error(
          `Failed to cancel booking: ${cancelResponse.status} ${cancelResponse.statusText}`,
        );
      }
      const result = await cancelResponse.json();

      // If the booking used a coupon, we should refund the uses
      if (result.data.coupon) {
        console.log(result.data.coupon);
        await refundCouponUses(result.data.coupon, result.data.booked_seats);
      }
      // If the booking used swish, we should refund the payment
      if (bookingDetails.data.transaction) {
        await createRefund(
          bookingDetails.data.transaction.paymentReference,
          bookingDetails.data.transaction.amount,
        );
      }

      // Update the slot's available seats
      await updateSlotAvailability(result.data.slot, -result.data.booked_seats);
      return { success: true, message: "Avbokning lyckades" };
    } else {
      // Cancellation is not allowed
      return {
        success: false,
        message:
          "Avbokning är ej tillåten eftersom det är mindre än 24 timmar till starttiden",
      };
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return { success: false, message: error.message };
  }
}

async function refundCouponUses(couponId, usesToRefund) {
  try {
    // First, fetch the current coupon data
    const fetchUrl = `https://cms.falkenbergskallbad.se/items/coupons/${couponId}?${accessTokenParam}`;
    const fetchResponse = await fetch(fetchUrl);
    if (!fetchResponse.ok) {
      throw new Error(
        `Failed to fetch coupon details: ${fetchResponse.status} ${fetchResponse.statusText}`,
      );
    }
    const couponDetails = await fetchResponse.json();

    // Calculate the new remaining uses
    const currentRemainingUses = couponDetails.data.remaining_uses;
    const newRemainingUses = currentRemainingUses + usesToRefund;

    // Update the coupon with the new remaining uses
    const updateUrl = `https://cms.falkenbergskallbad.se/items/coupons/${couponId}?${accessTokenParam}`;
    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        remaining_uses: newRemainingUses,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(
        `Failed to update coupon: ${updateResponse.status} ${updateResponse.statusText}`,
      );
    }

    const updatedCoupon = await updateResponse.json();
    console.log("Coupon uses refunded successfully:", updatedCoupon);
    return updatedCoupon;
  } catch (error) {
    console.error("Error refunding coupon uses:", error);
    throw error;
  }
}
async function updateSlotAvailability(slotId, changeInSeats) {
  const baseUrl = `https://cms.falkenbergskallbad.se/items/slots/${slotId}`;

  try {
    // First, read the current slot data
    const readResponse = await fetch(`${baseUrl}?${accessTokenParam}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!readResponse.ok) {
      throw new Error(
        `Failed to read slot data: ${readResponse.status} ${readResponse.statusText}`,
      );
    }

    const currentSlotData = await readResponse.json();
    const currentAvailableSeats = currentSlotData.data.available_seats;

    // Calculate new available seats
    const newAvailableSeats = Math.max(
      currentAvailableSeats - changeInSeats,
      0,
    );

    // Update the slot with new available seats
    const updateResponse = await fetch(`${baseUrl}?${accessTokenParam}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        available_seats: newAvailableSeats,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(
        `Failed to update slot availability: ${updateResponse.status} ${updateResponse.statusText}`,
      );
    }

    const updatedSlot = await updateResponse.json();
    console.log("Slot availability updated successfully:", updatedSlot);
    return updatedSlot;
  } catch (error) {
    console.error("Error updating slot availability:", error);
    throw error;
  }
}

export async function createCoupon(order, paymentId) {
  try {
    //First upsert user
    const user = await addUser(order);

    const type =
      order.selectedProduct === "Årskort" ? "Periodkort" : "Klippkort";
    const totalUses =
      type === "Periodkort"
        ? 1000
        : getIntegerFromString(order.selectedProduct);
    const couponData = {
      user: user.id,
      type: type,
      transaction: paymentId,
      start_date: order.startDate,
      expiry_date: order.expiryDate,
      remaining_uses: totalUses,
      total_uses: totalUses,
      code: String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
    };
    const response = await fetch(
      `https://cms.falkenbergskallbad.se/items/coupons?${accessTokenParam}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(couponData),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Coupon created successfully:", data);

    const result = {
      success: true,
      message: "Coupon successfully created",
      ...data,
    };
    return result;
  } catch (error) {
    console.error("Error creating coupon:", error);
    throw error;
  }
}

function getIntegerFromString(str) {
  const match = str.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return null; // or any default value you prefer
}
