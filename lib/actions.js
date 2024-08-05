'use server'
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function getTemperature() {
  const username = "api@falkenberg-energi.se";
  const password = process.env.BADTEMP_PASSWORD;
  const device_id = "57dd23f0-d516-11ec-921d-3df07923d1a8";

  // Login to get the auth token
  const authResponse = await fetch("https://webiot.iioote.io/api/auth/login", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const { token } = await authResponse.json();

  if (!token) {
    console.error('Authentication failed');
    return;
  }

  // Fetch the current temperature
  const temperatureResponse = await fetch(`https://webiot.iioote.io/api/plugins/telemetry/DEVICE/${device_id}/values/timeseries?keys=Temperature`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${token}`
    }
  });

  const temperatureData = await temperatureResponse.json();
  // console.log('Parsed JSON:', temperatureData);
  const currentTemperature = temperatureData?.Temperature?.[0]?.value || 0;

  // console.log(`Current Temperature: ${currentTemperature}°`);
  return currentTemperature;
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