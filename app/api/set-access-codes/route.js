const { NextResponse } = require('next/server');
const { DateTime } = require("luxon");

async function fetchBookingsForCodeSetting() {
    const now = DateTime.now().setZone('Europe/Stockholm');
    const soon = now.plus({ hours: 1 });
  
    console.log("Fetching slots with start time between:", now.toISO(), "and", soon.toISO(), " (Europe/Stockholm)");

    const filter = {
      _and: [
        {
          start_time: {
            _lt: soon.toISO(),
          },
        },
        {
          end_time: {
            _gt: now.toISO(),
          },
        },
      ],
    };
  
    const fields = [
      'start_time',
      'end_time',
      'bookings.door_code', // Access door_code from nested bookings
      'bookings.user.email', // Access user email from nested bookings
      'bookings.id',        // Access booking ID from nested bookings
      'bookings.status'
    ];
  
    const params = new URLSearchParams({
      fields: fields.join(','),
      filter: JSON.stringify(filter),
    });
  
    const url = `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/slots?${params}`;
  
  
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.DIRECTUS_ACCESS_TOKEN}`,
        },
      });
  
      console.log("Directus API Response Status:", res.status);
  
      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`Failed to fetch slots from Directus: ${res.status} ${res.statusText}`);
        console.error("Directus API Error Body:", errorBody);
        return [];
      }
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching slots from Directus:', error);
      return [];
    }
  }
  
async function setSeamAccessCode(deviceId, startsAt, endsAt, code, name, bookingId) {
  try {
    const payload = {
      device_id: deviceId,
      starts_at: startsAt,
      ends_at: endsAt,
      code: code,
      name: name,
    };

    const response = await fetch('https://connect.getseam.com/access_codes/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SEAM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to create Seam access code for ${name} (Booking ID: ${bookingId}): ${response.status} ${response.statusText} - ${errorBody}`);
      return false;
    }

    const data = await response.json();
    console.log(`Successfully created Seam access code ${data.access_code.code} for ${name} (Booking ID: ${bookingId})`);
    return true;
  } catch (error) {
    console.error('Error creating Seam access code:', error);
    return false;
  }
}


async function POST() {
    try {
      const slots = await fetchBookingsForCodeSetting();
      console.log('Fetched slots for code setting:', slots);
  
      for (const slot of slots) {
        const startTime = DateTime.fromISO(slot.start_time, { zone: 'Europe/Stockholm' }).toUTC().toISO();
        const endTime = DateTime.fromISO(slot.end_time, { zone: 'Europe/Stockholm' }).toUTC().toISO();

  
        if (slot.bookings && Array.isArray(slot.bookings)) {
          for (const booking of slot.bookings) {
            if (booking.status === 'cancelled') continue;  //Don't set the code if the booking is cancelled
            const success = await setSeamAccessCode(
              process.env.SEAM_DEVICE_ID || '',
              startTime,
              endTime,
              booking.door_code,
              booking.user.email,
              booking.id
            );
  
            if (!success) {
              console.error(`Failed to set Seam access code for booking ID ${booking.id}`);
            }
          }
        } else {
          console.warn(`No bookings found for slot starting at ${slot.start_time}`);
        }
      }
  
      return NextResponse.json({ message: 'Access codes processed successfully' }, { status: 200 });
    } catch (error) {
      console.error('Error processing access codes:', error);
      return NextResponse.json({ error: 'Failed to process access codes' }, { status: 500 });
    }
  }

module.exports = {
  POST,
};