import { connectToDatabase } from "../../utils/mongodb";
import crypto from "crypto";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

    // Update user's reset token and expiry in the database
    await db.collection("user").updateOne(
      { email },
      { $set: { resetPasswordToken: token, resetPasswordExpires: tokenExpiry } }
    );

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER,
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
      },
    });

    // Password reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // HTML email template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #ff0001;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            text-align: center;
          }
          .content h1 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #333;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 30px;
            color: #555;
          }
          .content .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #ff0001;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
          }
          .footer {
            background-color: #f9f9f9;
            color: #777;
            text-align: center;
            padding: 10px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>YTubeTools</h1>
          </div>
          <div class="content">
            <h1>Forgot your password?</h1>
            <p>It happens to the best of us. Click the button below to reset your password. The link will expire in 1 hour.</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>If you didn’t request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} YTubeTools Inc. All Rights Reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      to: email,
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      subject: "Password Reset Request",
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);

    // Respond success
    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
