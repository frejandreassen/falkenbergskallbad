'use server'
const sgMail = require('@sendgrid/mail')
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
  // return '20.0'
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

  export async function sendEmail(email, values){
    const msg = {
      to: email, // Change to your recipient
      from: {
        email:'kontaktformular@falkenbergskallbad.se',
        name: 'Kontaktformulär'
      }, // Change to your verified sender
      subject: 'Meddelande från falkenbergskallbad.se',
      replyTo: values.email,
      html: `
      <html>
        <head>
          <title>Meddelande från falkenebergskallbad.se</title>
        </head>
        <body>
        <p><b>Namn: </b>${values.name}</p>
        <p><b>Email: </b>${values.email}</p>
        <p><b>Email: </b>${values.message}</p>
        </body>
      </html>
    `
    }
    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
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

  export async function getSlots(){
    const res = await fetch('https://cms.falkenbergskallbad.se/items/slots?filter={"end_time": {"_gte": "$NOW"}}')
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.
   
    if (!res.ok) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    const result = await res.json()
    return result.data
  }

  export async function sendMembershipEmail(email, values, paymentInfo){
    const msg = {
      to: values.email,
      cc: email,
      from: {
        email:'noreply@falkenbergskallbad.se',
        name: 'Falkenbergskallbad.se'
      },
      replyTo: email,
      subject: 'Välkommen som ny medlem',
      html: `
        <html>
          <head>
            <title>Välkommen som ny medlem</title>
          </head>
          <body>
          
          Hej ${values.firstName} ${values.lastName},
    
          ${paymentInfo}
          </body>
        </html>
      `
    
    }
    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
  }