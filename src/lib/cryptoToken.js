import * as crypto from "crypto";

// Function to generate API token
export const generateOpenApiToken = () => {
  const SECRET_KEY = import.meta.env.VITE_PUBLIC_CRYPTO_SECRET_KEY;
  // Create payload
  const payload = {
    iat: Math.floor(Date.now() / 1000), // Issued at
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expires in 1 hour
    iss: "dauth-admin-portal", // Issuer identifier
  };

  // Convert payload to base64
  const payloadBase64 = new TextEncoder().encode(JSON.stringify(payload)).toString("base64");

  // Generate signature using HMAC-SHA256
  const signature = crypto
    .createHmac("sha256", SECRET_KEY || "")
    .update(payloadBase64)
    .digest("hex");

  // Return token in format: payload.signature
  return `${payloadBase64}.${signature}`;
};
