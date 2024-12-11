import { connectToDatabase } from "../../utils/mongodb";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, verificationCode } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const { db } = await connectToDatabase();

      // Check if the email exists in the database
      const user = await db.collection("user").findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      // Check if verificationCode is provided
      if (verificationCode) {
        // Handle verification process
        if (user.verificationToken === verificationCode) {
          // If the token matches, update the user as verified
          await db.collection("user").updateOne(
            { email },
            { $set: { verified: true, verificationToken: null } } // Set user as verified and remove the token
          );

          return res.status(200).json({ message: "Email successfully verified" });
        } else {
          return res.status(400).json({ message: "Invalid verification code" });
        }
      } else {
        // Send verification email process if no verificationCode provided
        if (user.verified) {
          return res.status(400).json({ message: "Email is already verified" });
        }

        // Generate a new verification token
        const verificationToken = uuidv4();

        // Update the user with the new verification token
        await db.collection("user").updateOne(
          { email },
          { $set: { verificationToken } }
        );

        // Send the verification email with the new token
        await sendVerificationEmail(email, user.username, verificationToken);

        return res.status(200).json({ message: "A new verification email has been sent" });
      }
    } catch (error) {
      console.error("Error handling verification:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
