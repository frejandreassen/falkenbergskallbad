'use server'
const sgMail = require('@sendgrid/mail')

const accessTokenParam = `access_token=${encodeURIComponent(process.env.DIRECTUS_ACCESS_TOKEN)}`;
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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
    const authResponse = await fetch("https://webiot.iioote.io/api/auth/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.statusText}`);
    }

    const { token } = await authResponse.json();
    if (!token) {
      throw new Error('Token not found in authentication response');
    }

    cachedToken = token;
    tokenExpirationTime = currentTime + TOKEN_CACHE_DURATION;
    return token;
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

export async function getTemperature() {
  const currentTime = Date.now();
  return '20.0'
  if (cachedTemperature && currentTime < temperatureFetchTime + TEMPERATURE_CACHE_DURATION) {
    return cachedTemperature;
  }

  const device_id = "57dd23f0-d516-11ec-921d-3df07923d1a8";

  try {
    const token = await getAuthToken();
    console.log('fetching temperature from provider...')
    const temperatureResponse = await fetch(`https://webiot.iioote.io/api/plugins/telemetry/DEVICE/${device_id}/values/timeseries?keys=Temperature`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`
      }
    });

    if (!temperatureResponse.ok) {
      throw new Error(`Failed to fetch temperature: ${temperatureResponse.statusText}`);
    }

    const temperatureData = await temperatureResponse.json();
    const currentTemperature = temperatureData?.Temperature?.[0]?.value;

    if (currentTemperature === undefined) {
      throw new Error('Temperature data not found in API response');
    }

    cachedTemperature = currentTemperature;
    temperatureFetchTime = currentTime;
    return currentTemperature;
  } catch (error) {
    console.error('Error fetching temperature:', error);
    if (cachedTemperature !== null) {
      console.warn('Returning last cached temperature due to error');
      return cachedTemperature;
    }
    throw error;
  }
}

export async function getHeader() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/header')
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}

export async function getFooter() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/footer')
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}

export async function createNewMember(memberData) {
  const { firstName, lastName, email } = memberData;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/medlemmar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fornamn: firstName,
        efternamn: lastName,
        email: email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`CMS submission failed: ${errorData}`);
    }

    return response.status;
  } catch (error) {
    console.error('Error creating new member:', error);
    throw error;
  }
}

export async function getSlots() {

  const res = await fetch('https://cms.falkenbergskallbad.se/items/slots?filter={"end_time": {"_gte": "$NOW"}}&access_token=' + process.env.DIRECTUS_ACCESS_TOKEN, {
    cache: 'no-store'
  }
  )
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}

export async function getPriceList() {
  const res = await fetch('https://cms.falkenbergskallbad.se/items/price_list?access_token=' + process.env.DIRECTUS_ACCESS_TOKEN)
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }
  const result = await res.json()
  return result.data
}
export async function getUserCoupons(email) {
  const filterObject = {
    _and: [
      {
        expiry_date: {
          _gte: "$NOW"
        }
      },
      {
        start_date: {
          _lte: "$NOW"
        }
      },
      {
        user: {
          email: {
            _eq: email
          }

        }
      }
    ]
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
    console.error('Error fetching user coupons:', error);
    throw new Error('Failed to fetch user coupons');
  }
}

export async function checkMembership(email) {
  const filterObject = {
    email: {
      _eq: email
    }
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
    console.error('Error checking membership:', error);
    throw new Error('Failed to check membership');
  }
}

async function checkAvailability(order) {
  // Check that slot is still available
  const res = await fetch(`https://cms.falkenbergskallbad.se/items/slots/${order.slotId}?${accessTokenParam}`, {
    cache: 'no-store'  // This disables caching for this request
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const result = await res.json();
  const currentSlot = result.data;

  if (!currentSlot) {
    throw new Error('Slot not found');
  }
  console.log(currentSlot)
  if (currentSlot.available_seats < order.selectedSeats) {
    throw new Error('Not enough seats available');
  }
  return currentSlot
}

async function checkCardCode(order) {
  const res = await fetch(`https://cms.falkenbergskallbad.se/items/coupons/${order.couponId}?${accessTokenParam}`);

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const result = await res.json();
  const coupon = result.data;

  if (!coupon) {
    throw new Error('Coupon not found');
  }

  if (coupon.code !== order.couponCode) {
    throw new Error('Angiven kod är felaktig.');
  }
  return coupon
}

async function addUser(order) {
  //Find user
  const filterObject = {
    email: {
      _eq: order.email
    }
  }
  const filterParam = `filter=${JSON.stringify(filterObject)}`;

  const res = await fetch(`https://cms.falkenbergskallbad.se/users?${filterParam}&${accessTokenParam}`);
  const result = await res.json()
  let user
  console.log(result)
  if (result.data.length < 1) {
    user = await createUser(order)
  } else {
    user = result.data[0]
  }
  return user
}
async function createUser(order) {
  const userData = {
    email: order.email,
    phone: order.phone,
    role: 'd383076b-8b2d-4f22-b325-6a534ed16bad' //id for role Bastubadare
  };

  try {
    const response = await fetch(`https://cms.falkenbergskallbad.se/users?${accessTokenParam}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

function createCode(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Make sure the hash is positive and 6 digits
  const positiveHash = Math.abs(hash);
  const sixDigitCode = positiveHash % 1000000;

  // Pad with leading zeros if necessary
  return String(sixDigitCode).padStart(6, '0');
}

async function createBooking(order, user, slot, transactionId) {
  const door_code = createCode(user.email)
  const bookingData = {
    user: user.id,
    slot: order.slotId,
    booked_seats: order.selectedSeats,
    transaction: transactionId,
    door_code: door_code
  }
  if (order.couponId) bookingData.coupon = order.couponId
  console.log(bookingData)
  try {
    const response = await fetch(`https://cms.falkenbergskallbad.se/items/bookings?${accessTokenParam}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Booking created successfully:', data);

    //Update slot
    const available_seats = slot.available_seats - order.selectedSeats
    const res = await fetch(`https://cms.falkenbergskallbad.se/items/slots/${slot.id}?${accessTokenParam}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ available_seats: available_seats })
    });
    const updatedSlot = await res.json()
    console.log('Slot availability updated successfully:', updatedSlot);

    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

async function useKlippKort(coupon, order) {
  const remaining_uses = coupon.remaining_uses - order.selectedSeats
  const res = await fetch(`https://cms.falkenbergskallbad.se/items/slots/${slot.id}?${accessTokenParam}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ remaining_uses: remaining_uses })
  });
  const data = res.json()
  return data

}
export async function bookUsingCard(order) {
  try {
    const slot = await checkAvailability(order)
    const coupon = await checkCardCode(order)
    const user = await addUser(order)
    await createBooking(order, user, slot)
    if (coupon.type === 'Klippkort') await useKlippKort(coupon, order)
    return { success: true, message: 'Slot successfully booked' };

  } catch (error) {
    // console.error('Error in bookSlot:', error);
    return { success: false, message: error.message };
  }
}
export async function getPayment(paymentRequestId) {
  try {
    const res = await fetch(`https://cms.falkenbergskallbad.se/items/transactions/${paymentRequestId}?${accessTokenParam}`, {
      cache: 'no-store' // This disables caching for this request
    });

    if (res.status === 403) {
      console.log(`Payment request ${paymentRequestId} not found in backend yet`);
      return 'PENDING'; // Treat 403 as a pending state
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (!data || !data.data) {
      throw new Error('Invalid response format');
    }

    const { status } = data.data;

    if (!status) {
      throw new Error('Status not found in response');
    }

    if (['PAID', 'DECLINED', 'ERROR', 'CANCELLED'].includes(status)) {
      return status;
    } else {
      return 'PENDING'; // For any other status, we consider it as pending
    }
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
}
export async function bookUsingSwish(order, paymentRequestId) {
  console.log(paymentRequestId)
  //Get the paymentrequest and make sure its ok
  try {
    const res = await fetch(`https://cms.falkenbergskallbad.se/items/transactions/${paymentRequestId}?${accessTokenParam}`, {
      cache: 'no-store' // This disables caching for this request
    });
    const data = await res.json()
    const payment = data.data
    if (payment.status !== 'PAID') throw new Error('Batalning misslyckades')
    const slot = await checkAvailability(order)
    const user = await addUser(order)
    await createBooking(order, user, slot, payment.id)
    return { success: true, message: 'Slot successfully booked', order, slot, payment}
  } catch (error) {
    // console.error('Error in bookSlot:', error);
    return { success: false, message: error.message };
  }
}