
// Simple email sending script
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Get the email configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || ''
  }
});

// Send test email
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Test Sender" <noreply@example.com>',
      to: 'jitender.nankani@blumetra.com',
      subject: 'Test Email from Replit Shell',
      text: 'This is a test email sent from the Replit shell using the SendGrid configuration.',
      html: '<p>This is a test email sent from the Replit shell using the SendGrid configuration.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Execute the function
sendTestEmail()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
