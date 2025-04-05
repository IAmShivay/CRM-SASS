// mailer/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASS,
  },
});
export const sendMail = async (to: string, subject: string, html: string, options: { 
  requestReadReceipt?: boolean, 
  deliveryNotification?: boolean 
} = {}) => {
  try {
    const info = await transporter.sendMail({
      from: `"PRE CRM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      headers: {
        ...(options.requestReadReceipt ? {
          'Disposition-Notification-To': process.env.SMTP_USER || '',
          'X-Confirm-Reading-To': process.env.SMTP_USER || '',
          'Return-Receipt-To': process.env.SMTP_USER || '',
          'Read-Receipt-To': process.env.SMTP_USER || '',
        } : {}),
        ...(options.deliveryNotification ? {
          'X-DSN-Notify': 'SUCCESS,FAILURE,DELAY',
          'Delivery-Status-Notification-Options': 'SUCCESS,FAILURE,DELAY',
        } : {})
      },
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
