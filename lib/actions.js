'use server'
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

function jsonToHTML(data) {
  let html = '<h3>Kontaktformulär</h3>';
  html += '<table style="width: 100%; border-collapse: collapse;">';
  
  Object.keys(data).forEach(key => {
    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key.charAt(0).toUpperCase() + key.slice(1)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data[key]}</td>
      </tr>
    `;
  });
}
function jsonToPlainText(data) {
  let plainText = "Kontaktformulär:\n\n";
  Object.keys(data).forEach(key => {
    plainText += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${data[key]}\n`;
  });
  return plainText;
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