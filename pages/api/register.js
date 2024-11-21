import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../utils/mongodb";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "../../lib/firebase"; // Firestore setup
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: true, // Enable body parser to parse JSON requests
  },
};

// Function to validate reCAPTCHA token
async function validateCaptcha(token) {
  const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET; // Set this in your environment variables
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `secret=${secretKey}&response=${token}`,
  });

  const data = await response.json();
  return data.success;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { username, email, password, role, adminAnswer, captchaToken } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Skip reCAPTCHA validation for localhost
    const isLocalhost =
      req.headers.host.includes("localhost") ||
      req.headers.host.includes("127.0.0.1") ||
      req.headers.host.includes("::1");

    if (!isLocalhost) {
      // Validate reCAPTCHA token only for production
      if (!captchaToken) {
        return res.status(400).json({ message: "reCAPTCHA token is missing" });
      }
      const isCaptchaValid = await validateCaptcha(captchaToken);
      if (!isCaptchaValid) {
        return res.status(400).json({ message: "Invalid reCAPTCHA. Please try again." });
      }
    }

    // Validate role and admin answer if role is admin
    let finalRole = "user";
    if (role === "admin") {
      if (adminAnswer !== "nazmul hasan") {
        return res.status(400).json({ message: "Incorrect answer to the admin question" });
      }
      finalRole = "admin";
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a verification token
    const verificationToken = uuidv4();

    // Connect to the database
    const { db } = await connectToDatabase();

    // Check if the email is already registered
    const existingUser = await db.collection("user").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Insert user data into the database
    const result = await db.collection("user").insertOne({
      username,
      email,
      password: hashedPassword,
      profileImage: null, // No profile image needed
      verificationToken,
      verified: false,
      role: finalRole, // User role
      createdAt: new Date(),
    });

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Failed to register user." });
    }

    // Send verification email
    await sendVerificationEmail(email, username, verificationToken);

    // Notify admin of the new user registration
    const notificationRef = collection(firestore, "notifications");
    await addDoc(notificationRef, {
      type: "new_user_registration",
      message: `A new user, ${username}, has registered.`,
      recipientUserId: "admin", // Admin ID or identifier
      createdAt: new Date(),
      read: false,
    });

    res.status(201).json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
