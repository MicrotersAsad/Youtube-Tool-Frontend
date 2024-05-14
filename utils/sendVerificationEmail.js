// utils/sendVerificationEmail.js
import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email, username, token) {
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.NEXT_PUBLIC_EMAIL_USER,
      pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: process.env.NEXT_PUBLIC_EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    text: `Hello ${username},\n\nPlease verify your email by verify?token=${token}\n\nThank you!`,
  };

  await transporter.sendMail(mailOptions);
}
