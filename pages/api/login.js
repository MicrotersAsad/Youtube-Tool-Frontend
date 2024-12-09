import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fetch from "node-fetch"; // Node.js environment for fetch
import { connectToDatabase } from "../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password, recaptchaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!process.env.NEXT_PUBLIC_JWT_SECRET || !process.env.IPINFO_API_TOKEN) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    try {
      const { db } = await connectToDatabase();
      const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;

      // Fetch reCAPTCHA secret from the extensions API
      const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const host = req.headers.host;
      const authToken ='AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Authorization token from header
    

      if (!authToken) {
        return res.status(200).json({ message: "Authorization token is required" });
      }

      const extensionsResponse = await fetch(`${protocol}://${host}/api/extensions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const extensionsResult = await extensionsResponse.json();
      if (!extensionsResult.success) {
        return res.status(500).json({ message: "Failed to fetch extensions configuration" });
      }

      const recaptchaExtension = extensionsResult.data.find(
        (ext) => ext.key === "google_recaptcha_2" && ext.status === "Enabled"
      );

      if (!recaptchaExtension || !recaptchaExtension.config.secretKey) {
        return res.status(500).json({ message: "reCAPTCHA is not properly configured" });
      }

      const recaptchaSecret = recaptchaExtension.config.secretKey;

      // Check failed login attempts
      const attemptRecord = await db.collection("failed_logins").findOne({ ipAddress });
      if (attemptRecord && attemptRecord.blockUntil && new Date() < new Date(attemptRecord.blockUntil)) {
        return res.status(429).json({ message: "Too many failed attempts. Try again later." });
      }

      // Check if request is from localhost and skip reCAPTCHA verification if it is
      const isLocalhost = ipAddress === "127.0.0.1" || ipAddress === "::1";
      if (!isLocalhost) {
        // Verify reCAPTCHA for non-localhost requests
        const reCaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
        });
        const reCaptchaData = await reCaptchaResponse.json();

        if (!reCaptchaData.success) {
          return res.status(400).json({ message: "reCAPTCHA verification failed" });
        }
      }

      const user = await db.collection("user").findOne({ email });
      if (!user) {
        await handleFailedAttempt(db, ipAddress);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await handleFailedAttempt(db, ipAddress);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Successful login, reset failed attempts
      await db.collection("failed_logins").deleteOne({ ipAddress });

      // Create the JWT token for the user
      const jwtToken = jwt.sign(
        { id: user._id, email: user.email, username: user.username, role: user.role },
        process.env.NEXT_PUBLIC_JWT_SECRET,
        { expiresIn: "1h" }
      );

      const userAgent = req.headers["user-agent"];
      const browser = userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : "Other";
      const os = userAgent.includes("Windows") ? "Windows" : userAgent.includes("Mac") ? "MacOS" : "Other";

      // IP Location using ipinfo.io
      let country = "Unknown";
      let city = "Unknown";
      if (!isLocalhost) {
        const geoResponse = await fetch(`https://ipinfo.io/${ipAddress}?token=${process.env.IPINFO_API_TOKEN}`);
        const geoData = await geoResponse.json();
        country = geoData.country || "Unknown";
        city = geoData.city || "Unknown";
      } else {
        country = "Localhost";
        city = "Localhost";
      }

      await db.collection("login_logs").insertOne({
        userId: user._id,
        userName: user.username,
        ipAddress,
        browser,
        os,
        city,
        country,
        timestamp: new Date(),
      });

      return res.status(200).json({
        message: "Login successful",
        token: jwtToken, // Send the JWT token as part of the response
        loginInfo: {
          ipAddress,
          browser,
          os,
          city,
          country,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();
      const logs = await db.collection("login_logs").find({}).toArray();
      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      console.error("Error fetching login logs:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}

// Helper function to handle failed attempts
async function handleFailedAttempt(db, ipAddress) {
  const record = await db.collection("failed_logins").findOne({ ipAddress });
  if (record) {
    if (record.attempts >= 2) {
      await db.collection("failed_logins").updateOne(
        { ipAddress },
        { $set: { attempts: record.attempts + 1, blockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
      );
    } else {
      await db.collection("failed_logins").updateOne({ ipAddress }, { $inc: { attempts: 1 } });
    }
  } else {
    await db.collection("failed_logins").insertOne({ ipAddress, attempts: 1 });
  }
}
