import 'dotenv/config'; 
import AfricasTalking from 'africastalking';

// Load environment variables for Africa's Talking
// Use 'sandbox' for the username if you are testing (Free Tier)
const username = process.env.AT_USERNAME || 'sandbox';
const apiKey = process.env.AT_API_KEY;
// Reusing your existing number variable, but removing 'whatsapp:' prefix if present
const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER ? process.env.ADMIN_WHATSAPP_NUMBER.replace('whatsapp:', '').trim() : undefined;

// Initialize Africa's Talking
const at = AfricasTalking({
    apiKey: apiKey,
    username: username
});
const sms = at.SMS;

/**
 * Normalizes a Kenyan phone number to the international E.164 format.
 * @param {string} phone - The phone number to normalize.
 * @returns {string|null} The normalized phone number or null if input is invalid.
 */
const normalizeKenyanPhoneNumber = (phone) => {
    if (!phone) {
        return null;
    }
    const phoneStr = String(phone).trim();

    if (phoneStr.startsWith('+254')) {
        return phoneStr; // Already in correct format
    }
    if (phoneStr.startsWith('254')) {
        return `+${phoneStr}`; // Add the missing '+'
    }
    if (phoneStr.startsWith('0')) {
        return `+254${phoneStr.substring(1)}`; // Replace the leading '0'
    }
    
    // If the format is unknown, return null to prevent sending an invalid number
    console.warn(`Could not normalize phone number: ${phone}. It might be in an unexpected format.`);
    return null; 
};

/**
 * Sends an SMS notification to the admin using Africa's Talking.
 * Note: This replaces the WhatsApp logic to use the free Sandbox SMS tier.
 * @param {object} order - Object containing order details (id, total, and itemList).
 */
export const sendOrderCreationNotification = async (order) => {
    // 1. Check for credentials
    if (!apiKey || !adminPhoneNumber) {
        console.error("Africa's Talking environment variables are missing (AT_API_KEY or ADMIN_WHATSAPP_NUMBER). Skipping notification.");
        return;
    }

    try {
        // 2. Construct the message (SMS is plain text)
        // Ensure total is a number and items are formatted correctly
        const totalAmount = Number(order.total || 0).toFixed(2);

        console.log("Notification Order Data:", order); // Debug log to see what is passed

        // Robustly find items. 
        // We iterate through possible keys. If we find a non-empty array or a parsable string, we use it.
        // This prevents an empty 'items: []' property from blocking a valid 'cart_items' string.
        let items = [];
        const keysToCheck = ['itemList', 'items', 'cartItems', 'cart_items'];
        
        for (const key of keysToCheck) {
            const val = order[key];
            if (!val) continue;

            if (Array.isArray(val) && val.length > 0) {
                items = val;
                break; 
            }
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        items = parsed;
                        break;
                    }
                } catch (e) { /* ignore */ }
            }
        }

        const itemsSummary = Array.isArray(items) && items.length > 0
            ? items.map(item => `${item.quantity}x ${item.title || item.name || 'Product'}`).join(', ')
            : 'No items listed';

        const message = `New Order #${order.id}\nTotal: KES ${totalAmount}\nItems: ${itemsSummary}`;

        console.log(`Sending Admin SMS via Africa's Talking (User: ${username})...`);
        
        const response = await sms.send({
            to: [adminPhoneNumber],
            message: message
        });
        console.log('SMS sent successfully:', response);
    } catch (error) {
        console.error('Error sending SMS via Africa\'s Talking:', error);
    }
};

/**
 * Sends an SMS confirmation to the Customer.
 * @param {string} userPhoneNumber - The customer's phone number (e.g. +254...).
 * @param {object} order - Order details.
 */
export const sendUserOrderConfirmation = async (userPhoneNumber, order) => {
    const normalizedNumber = normalizeKenyanPhoneNumber(userPhoneNumber);

    if (!apiKey || !normalizedNumber) {
        console.error("Missing API key or invalid user phone number. Skipping user SMS.", { rawPhone: userPhoneNumber, normalized: normalizedNumber });
        return;
    }

    try {
        const totalAmount = Number(order.total || 0).toFixed(2);
        
        let items = [];
        const keysToCheck = ['itemList', 'items', 'cartItems', 'cart_items'];
        
        for (const key of keysToCheck) {
            const val = order[key];
            if (!val) continue;

            if (Array.isArray(val) && val.length > 0) {
                items = val;
                break; 
            }
        }

        const itemsSummary = Array.isArray(items) && items.length > 0
            ? items.map(item => `${item.quantity}x ${item.title || item.name || 'Product'}`).join(', ')
            : 'No items listed';

        const message = `Hi! Your order #${order.id} for KES ${totalAmount} has been received.\nItems: ${itemsSummary}\nIt will be delivered to ${order.delivery_address}. Thanks for shopping with us!`;

        await sms.send({ to: [normalizedNumber], message });
        console.log(`User SMS sent to ${normalizedNumber}`);
    } catch (error) {
        console.error('Error sending User SMS:', error);
    }
};
