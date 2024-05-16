import { connectToDatabase } from "../../utils/mongodb";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("user").updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    // console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
