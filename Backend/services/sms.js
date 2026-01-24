import 'dotenv/config'; 
import twilio from 'twilio';

// Load environment variables for Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const adminSmsNumber = process.env.ADMIN_SMS_NUMBER;

// The Twilio Client is initialized only once
let client = null; 

const initializeTwilioClient = () => {
    if (!accountSid || !authToken || !twilioPhoneNumber) {
        console.error('Twilio environment variables are missing. Skipping SMS notification.');
        return false;
    }
    
    if (!client) {
        try {
            client = twilio(accountSid, authToken); 
            console.log("Twilio client initialized for SMS messaging.");
        } catch (e) {
            console.error("Failed to initialize Twilio client:", e.message);
            return false;
        }
    }
    return true;
};

/**
 * Sends an SMS message.
 * @param {string} to - The recipient's phone number.
 * @param {string} body - The message to send.
 */
const sendSms = async (to, body) => {
    if (!initializeTwilioClient()) return;

    try {
        const message = await client.messages.create({
            body: body,
            from: twilioPhoneNumber,
            to: to
        });
        console.log(`SMS sent successfully to ${to}. SID: ${message.sid}`);
    } catch (error) {
        console.error(`Error sending SMS to ${to}:`, error.message);
    }
};

/**
 * Sends an SMS to the admin when a new order is created.
 * @param {object} order - Object containing order details (id, total, itemList).
 */
export const sendNewOrderSmsToAdmin = async (order) => {
    if (!adminSmsNumber) {
        console.error('ADMIN_SMS_NUMBER environment variable is not set. Skipping admin SMS notification.');
        return;
    }
    const message = `New order received!\nOrder ID: ${order.id}\nTotal: KES ${order.total.toFixed(2)}\nItems:\n${order.itemList}`;
    await sendSms(adminSmsNumber, message);
};

/**
 * Sends an SMS to the user who created the order.
 * @param {string} userPhoneNumber - The user's phone number.
 * @param {object} order - Object containing order details (id, total, itemList).
 */
export const sendNewOrderSmsToUser = async (userPhoneNumber, order) => {
    if (!userPhoneNumber) {
        console.error('User phone number is not available. Skipping user SMS notification.');
        return;
    }
    const message = `Your order #${order.id} has been received.\nTotal: KES ${order.total.toFixed(2)}\nWe will notify you once it's shipped.`;
    await sendSms(userPhoneNumber, message);
};
