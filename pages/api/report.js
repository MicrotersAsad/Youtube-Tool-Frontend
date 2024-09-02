// pages/api/report.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userEmail, reportText, toolName, toolUrl } = req.body;

  try {
    // Create a transporter object using SMTP
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or another email service
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER, // Your admin email address
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS, // Your email password
      },
    });

    // Set up the email data
    const mailOptions = {
      from: userEmail, // Sender's email
      to: process.env.NEXT_PUBLIC_EMAIL_USER, // Admin's email address
      subject: `New Report on ${toolName}`,
      text: `User: ${userEmail}\nTool: ${toolName}\nTool URL: ${toolUrl}\n\nReport:\n${reportText}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Report sent successfully' });
  } catch (error) {
    console.error('Error sending report:', error);
    return res.status(500).json({ message: 'Failed to send report' });
  }
}
