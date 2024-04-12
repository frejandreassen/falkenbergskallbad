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
      html: jsonToHTML(values),
      text: jsonToPlainText(values)
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