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

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Use your email provider
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER, // Your email
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS, // Your email password
      },
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}&email=${email}`;

    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>If you did not request this, please ignore this email.</p>`,
    });

    res.status(200).json({ message: "Reset link sent to your email." });
  } catch (error) {
    console.error("Error sending reset token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
