import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

// Explicitly point to the .env file location
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// DEBUG: This will show in your terminal if the variables are actually loading
console.log("Checking Email Config:", {
  user: process.env.EMAIL_USER ? "LOADED" : "MISSING",
  pass: process.env.EMAIL_PASS ? "LOADED" : "MISSING"
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false 
  }
});

export const sendPreorderNotificationEmail = async (preorder) => {
  const mailOptions = {
    from: `"Panna Music Admin" <${process.env.EMAIL_USER}>`, 
    to: "sales2@pannamusic.co.ke",
    subject: `🔔 New Preorder: ${preorder.device.substring(0, 20)}...`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="background: #333; color: #fff; padding: 10px;">New Pre-order Received</h2>
        <p><strong>Customer Name:</strong> ${preorder.name}</p>
        <p><strong>Customer Phone:</strong> ${preorder.phone}</p>
        <p><strong>Device:</strong> ${preorder.device}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Admin notification sent to salestest!", info.messageId);
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
};