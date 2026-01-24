// services/mpesa.js
import axios from "axios";

export const getAccessToken = async (consumerKey, consumerSecret) => {
 
    const url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  return response.data.access_token;
};

export const initiateSTKPush = async ({
  shortcode,
  passkey,
  amount,
  phoneNumber,
  token,
  callbackUrl 
}) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

  const stkUrl = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl || process.env.MPESA_CALLBACK_URL,
    AccountReference: "OrderPayment",
    TransactionDesc: "Payment for order",
  };

  console.log("Using callback url:", callbackUrl || process.env.MPESA_CALLBACK_URL);
  const response = await axios.post(stkUrl, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // return raw response data (which should include MerchantRequestID and CheckoutRequestID)
  return response.data;
};



export const pendingPayment = async (checkoutRequestID) => {

    const [rows] = await db.execute(
      `SELECT * FROM mpesa_transactions WHERE checkout_id = ? LIMIT 1`,
      [checkoutRequestID]
    );
    return rows[0];
    
}