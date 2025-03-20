"use server";

const https = require("https");
const axios = require("axios");
const crypto = require("crypto");
const swishUrl = process.env.SWISH_API_BASE_URL;

const cert = Buffer.from(process.env.SWISH_PUBLIC_PEM, "base64").toString(
  "utf-8",
);
const key = Buffer.from(process.env.SWISH_PRIVATE_KEY, "base64").toString(
  "utf-8",
);
const geoTrustCert = Buffer.from(process.env.GEOTRUST_TLS_RSA_CA_G1, "base64").toString(
  "utf-8",
);
const digiCertRootCert = Buffer.from(process.env.DIGICERT_GLOBAL_ROOT_G2, "base64").toString(
  "utf-8",
);

const agent = new https.Agent({
  cert,
  key,
  ca: [geoTrustCert, digiCertRootCert],
});

const client = axios.create({
  httpsAgent: agent,
});

function generateSwishId() {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

async function getQrCodeFromToken(token) {
  const data = {
    token,
    size: "300",
    format: "png",
    border: "0",
  };

  try {
    //Use other client for qr code. (Axios has issues, with conflicting certificates uses in createPaymentRequest)
    const response = await fetch(
      "https://mpc.getswish.net/qrg-swish/api/v1/commerce",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error getting QR code:", error);
    throw error;
  }
}

export async function createPaymentRequest(amount, message) {
  console.log("Creating payment request:", { amount, message });
  const instructionId = generateSwishId();

  const payeeAlias = process.env.SWISH_ALIAS;
  const formattedAmount = parseFloat(amount).toFixed(2);
  if (isNaN(formattedAmount) || formattedAmount <= 0) {
    throw new Error("Invalid amount: Must be a positive number");
  }
  const truncatedMessage = message.substring(0, 50);

  const data = {
    payeeAlias,
    currency: "SEK",
    callbackUrl: process.env.SWISH_CALLBACK_URL,
    amount: formattedAmount,
    message: truncatedMessage,
  };

  try {
    console.log("Sending request to Swish API:", {
      url: `${swishUrl}/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
      data,
    });

    const response = await client.put(
      `${swishUrl}/swish-cpcapi/api/v2/paymentrequests/${instructionId}`,
      data,
    );

    const { paymentrequesttoken } = response.headers;
    console.log("Payment request created successfully:", {
      id: instructionId,
      token: paymentrequesttoken,
    });

    // Generate QR code
    const qrCode = await getQrCodeFromToken(paymentrequesttoken);
    const qrCodeBase64 = Buffer.from(qrCode).toString("base64");

    return {
      id: instructionId,
      token: paymentrequesttoken,
      qrCode: qrCodeBase64,
    };
  } catch (error) {
    console.error("Error creating payment request:", {
      message: error.message,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
          }
        : "No response data",
    });
    if (error.response && error.response.status === 422) {
      const errorDetails = error.response.data
        ? JSON.stringify(error.response.data)
        : "No error details available";
      throw new Error(`Failed to create payment request: ${errorDetails}`);
    } else {
      throw new Error(`Failed to create payment request: ${error.message}`);
    }
  }
}
export async function createRefund(originalPaymentReference, amount) {
  console.log("Creating refund:", { originalPaymentReference, amount });
  const instructionUUID = generateSwishId();
  const formattedAmount = parseFloat(amount).toFixed(2);
  const data = {
    payerAlias: process.env.SWISH_ALIAS,
    currency: "SEK",
    callbackUrl: process.env.SWISH_CALLBACK_URL,
    originalPaymentReference,
    amount: formattedAmount,
    message: "Återbetalning avbokning Bastu Falkenbergs Kallbad",
  };

  try {
    const response = await client.put(
      `${swishUrl}/swish-cpcapi/api/v2/refunds/${instructionUUID}`,
      data,
    );

    if (response.status === 201) {
      const { location } = response.headers;

      return { instructionUUID, location };
    }
  } catch (error) {
    console.error("Error creating refund:", {
      message: error.message,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
          }
        : "No response data",
    });
    if (error.response && error.response.status === 422) {
      const errorDetails = error.response.data
        ? JSON.stringify(error.response.data)
        : "No error details available";
      throw new Error(`Failed to create refund: ${errorDetails}`);
    } else {
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }
}
