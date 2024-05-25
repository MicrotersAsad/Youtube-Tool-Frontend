import { connectToDatabase } from "./mongodb";


export const updateUserAccess = async (customerId, hasUnlimitedAccess) => {
  const { db } = await connectToDatabase();

  // Find the user by customer ID (or email, or any other unique identifier)
  const result = await db.collection('user').updateOne(
    { stripeCustomerId: customerId }, // Assuming you store the Stripe customer ID in the user document
    { $set: { hasUnlimitedAccess } }
  );

  if (result.matchedCount === 0) {
    throw new Error('User not found');
  }

  return result;
};
