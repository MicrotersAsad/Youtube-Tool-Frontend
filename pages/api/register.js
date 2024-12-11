import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../utils/mongodb";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: true,
  },
};

// Function to fetch the secret key dynamically with Authorization
async function fetchSecretKey() {
  try {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = process.env.API_HOST || "localhost:3000";
    
    const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00';
    
    if (!token) {
      throw new Error("Authorization token is missing");
    }

    const response = await fetch(`${protocol}://${host}/api/extensions`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    const result = await response.json();
    if (result.success) {
      const captchaExtension = result.data.find(
        (ext) => ext.key === "google_recaptcha_2" && ext.status === "Enabled"
      );
      return captchaExtension?.config?.secretKey || process.env.GOOGLE_RECAPTCHA_SECRET;
    } else {
      throw new Error("Failed to fetch extensions configuration");
    }
  } catch (error) {
    console.error("Error fetching secret key:", error);
    return process.env.GOOGLE_RECAPTCHA_SECRET; 
  }
}

// Function to validate reCAPTCHA token
async function validateCaptcha(token) {
  const secretKey = await fetchSecretKey();
  if (!secretKey) {
    throw new Error("Missing reCAPTCHA secret key.");
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isLocalhost =
      req.headers.host.includes("localhost") ||
      req.headers.host.includes("127.0.0.1") ||
      req.headers.host.includes("::1");

    if (!isLocalhost) {
      if (!captchaToken) {
        return res.status(400).json({ message: "reCAPTCHA token is missing" });
      }
      const isCaptchaValid = await validateCaptcha(captchaToken);
      if (!isCaptchaValid) {
        return res.status(400).json({ message: "Invalid reCAPTCHA. Please try again." });
      }
    }

    let finalRole = "user";
    if (role === "admin") {
      if (adminAnswer !== "nazmul hasan") {
        return res.status(400).json({ message: "Incorrect answer to the admin question" });
      }
      finalRole = "admin";
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const { db } = await connectToDatabase();

    // Check if email is already registered
    const existingUser = await db.collection("user").findOne({ email });
    if (existingUser) {
      if (existingUser.verified) {
        return res.status(400).json({ message: "Email is already registered and verified." });
      } else {
        return res.status(400).json({ message: "Email is already registered, please verify your email." });
      }
    }

    const result = await db.collection("user").insertOne({
      username,
      email,
      password: hashedPassword,
      profileImage: null,
      verificationToken,
      verified: false, // Initially, the user is not verified
      role: finalRole,
      createdAt: new Date(),
    });

    if (!result.acknowledged) {
      return res.status(500).json({ message: "Failed to register user." });
    }

    // Send verification email
    await sendVerificationEmail(email, username, verificationToken);

    const notificationRef = collection(firestore, "notifications");
    await addDoc(notificationRef, {
      type: "new_user_registration",
      message: `A new user, ${username}, has registered.`,
      recipientUserId: "admin",
      createdAt: new Date(),
      read: false,
    });

    res.status(201).json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
