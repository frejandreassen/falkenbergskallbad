'use server'
const request = require('superagent');
const crypto = require('crypto');

// Function to generate a unique ID
const generateUniqueId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Function to get secret from environment variables
const getSecretFile = (secretName) => {
  const secret = process.env[secretName];
  if (!secret) {
    throw new Error(`Secret ${secretName} not found in environment variables`);
  }
  return Buffer.from(secret, 'base64');
};

export async function createPaymentRequest(amount, message) {
  return { id: '123', token: '123' };

  const instructionUUID = generateUniqueId();
  
  const ca = getSecretFile('SWISH_ROOT_CA_PEM');
  const cert = getSecretFile('SWISH_PRIVATE_KEY');
  const data = {
    payeePaymentReference: "0123456789",
    payeeAlias: process.env.SWISH_PAYEE_ALIAS || '1234679304',
    currency: 'SEK',
    callbackUrl: process.env.SWISH_CALLBACK_URL || 'https://slapy.se/api/swish/callback',
    amount: parseInt(amount),
    message,
  };

  try {
    const response = await request
      .put(`https://mss.cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests/${instructionUUID}`)
      .set('Content-Type', 'application/json')
      .send(data)
      .pfx({ pfx: cert, passphrase: process.env.SWISH_CERT_PASSPHRASE || 'swish' })
      .ca(ca);

    const { paymentrequesttoken } = response.headers;
    return { id: instructionUUID, token: paymentrequesttoken };
  } catch (error) {
    console.error('Error creating payment request:', error);
    throw error;
  }
}

export async function getQrCodeFromToken(token) {
  const ca = getSecretFile('swish-root-ca-pem');
  const cert = getSecretFile('swish-cert-p12');
  const data = {
    token,
    size: "300",
    format: "png",
    border: "0"
  };

  try {
    const response = await request
      .post(`https://mpc.getswish.net/qrg-swish/api/v1/commerce`)
      .set('Content-Type', 'application/json')
      .send(data)
      .pfx({ pfx: cert, passphrase: process.env.SWISH_CERT_PASSPHRASE || 'swish' })
      .ca(ca)
      .responseType('arraybuffer');

    return response.body;
  } catch (error) {
    console.error('Error getting QR code:', error);
    throw error;
  }
}

export async function checkPaymentStatus(instructionUUID) {
  const ca = getSecretFile('swish-root-ca-pem');
  const cert = getSecretFile('swish-cert-p12');

  try {
    const statusResponse = await request
      .get(`https://mss.cpc.getswish.net/swish-cpcapi/api/v1/paymentrequests/${instructionUUID}`)
      .set('Content-Type', 'application/json')
      .pfx({ pfx: cert, passphrase: process.env.SWISH_CERT_PASSPHRASE || 'swish' })
      .ca(ca);

    return statusResponse.body;
  } catch (error) {
    console.error('Error checking payment status:', error); 
    throw error;
  }
}

export async function createRefund(originalPaymentReference, amount) {
  const ca = getSecretFile('swish-root-ca-pem');
  const cert = getSecretFile('swish-cert-p12');
  const instructionUUID = generateUniqueId();
  const data = {
    payerAlias: process.env.SWISH_PAYEE_ALIAS || '1234679304',
    currency: 'SEK',
    callbackUrl: process.env.SWISH_REFUND_CALLBACK_URL || 'https://slapy.se/api/swish/refund-callback',
    originalPaymentReference,
    amount
  };

  try {
    const response = await request
      .put(`https://mss.cpc.getswish.net/swish-cpcapi/api/v2/refunds/${instructionUUID}`)
      .set('Content-Type', 'application/json')
      .send(data)
      .pfx({ pfx: cert, passphrase: process.env.SWISH_CERT_PASSPHRASE || 'swish' })
      .ca(ca);

    const { location } = response.headers;
    return { instructionUUID, location };
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
}

