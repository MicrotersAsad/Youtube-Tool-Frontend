import crypto from "crypto";
import nodemailer from "nodemailer";
import { connectToDatabase } from "../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const { db } = await connectToDatabase();

    // Find user by email
    const user = await db.collection("user").findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a unique token and expiration time
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = Date.now() + 3600000; // 1 hour from now

    // Save the token and expiration in the database
    await db.collection("user").updateOne(
      { email },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        },
      }
    );

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Use your email provider
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER, // Your email
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS, // Your email password
      },
    });

    // Generate the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_API_BASE_UR}/reset-password?token=${resetToken}&email=${email}`;

    // Email HTML template
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
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #ef4444;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            text-align: center;
          }
          .content h2 {
            font-size: 20px;
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
            background-color: #ef4444;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
          }
          .footer {
            background: #f4f4f4;
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            YtTools - Password Reset
          </div>
          <div class="content">
            <h2>Forgot your password?</h2>
            <p>No worries! Click the button below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email or contact support.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} YtTools Inc. All Rights Reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: emailHTML,
    });

    res.status(200).json({ message: "Reset link sent to your email." });
  } catch (error) {
    console.error("Error sending reset token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
