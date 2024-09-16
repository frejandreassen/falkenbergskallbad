'use server'

const https = require('https');
const axios = require('axios');
const crypto = require('crypto');
const swishUrl = process.env.SWISH_API_BASE_URL;

function generateSwishId() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

async function getQrCodeFromToken(token) {
  const ca = Buffer.from(process.env.SWISH_ROOT_CA_PEM, 'base64').toString('utf-8');
  const cert = Buffer.from(process.env.SWISH_PUBLIC_PEM, 'base64').toString('utf-8');
  const key = Buffer.from(process.env.SWISH_PRIVATE_KEY, 'base64').toString('utf-8');

  const agent = new https.Agent({
    cert,
    key,
    ca
  });

  const data = {
    token,
    size: "300",
    format: "png",
    border: "0"
  };

  try {
    const response = await axios.post(
      'https://mpc.getswish.net/qrg-swish/api/v1/commerce',
      data,
      {
        httpsAgent: agent,
        headers: { 'Content-Type': 'application/json' },
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting QR code:', error);
    throw error;
  }
}

export async function createPaymentRequest(amount, message) {
  console.log('Creating payment request:', { amount, message });
  const instructionId = generateSwishId();
  const cert = Buffer.from(process.env.SWISH_PUBLIC_PEM, 'base64').toString('utf-8');
  const key = Buffer.from(process.env.SWISH_PRIVATE_KEY, 'base64').toString('utf-8');
  const ca = Buffer.from(process.env.SWISH_ROOT_CA_PEM, 'base64').toString('utf-8');

  const agent = new https.Agent({
    cert,
    key,
    ca
  });

  const client = axios.create({
    httpsAgent: agent
  });

  const payeeAlias = process.env.SWISH_ALIAS;
  const formattedAmount = parseFloat(amount).toFixed(2);
  if (isNaN(formattedAmount) || formattedAmount <= 0) {
    throw new Error('Invalid amount: Must be a positive number');
  }
  const truncatedMessage = message.substring(0, 50);

  const data = {
    payeeAlias,
    currency: 'SEK',
    callbackUrl: process.env.SWISH_CALLBACK_URL,
    amount: formattedAmount,
    message: truncatedMessage,
  };

  try {
    console.log('Sending request to Swish API:', {
      url: `${swishUrl}/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
      data
    });

    const response = await client.put(
      `${swishUrl}/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
      data
    );

    const { paymentrequesttoken } = response.headers;
    console.log('Payment request created successfully:', { id: instructionId, token: paymentrequesttoken });

    // Generate QR code
    const qrCode = await getQrCodeFromToken(paymentrequesttoken);
    const qrCodeBase64 = Buffer.from(qrCode).toString('base64');

    return { id: instructionId, token: paymentrequesttoken, qrCode: qrCodeBase64 };
  } catch (error) {
    console.error('Error creating payment request:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response data'
    });
    if (error.response && error.response.status === 422) {
      const errorDetails = error.response.data ? JSON.stringify(error.response.data) : 'No error details available';
      throw new Error(`Failed to create payment request: ${errorDetails}`);
    } else {
      throw new Error(`Failed to create payment request: ${error.message}`);
    }
  }
}