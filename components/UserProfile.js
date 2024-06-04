import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    if (user && user.paymentStatus !== 'success' && !isUpdated) {
      updateUserProfile().then(() => setIsUpdated(true));
    }
  }, [user, updateUserProfile, isUpdated]);

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div>
      <h1>User Profile</h1>
      <p>Email: {user.email}</p>
      <p>Payment Status: {user.paymentStatus}</p>
      {user.paymentStatus === 'success' ? (
        <div>
          <h2>Subscription Details</h2>
          <p><strong>Plan:</strong> {user.subscriptionPlan}</p>
          <p><strong>Amount Paid:</strong> ${user.paymentDetails?.amountPaid}</p>
          <p><strong>Currency:</strong> {user.paymentDetails?.currency}</p>
          <p><strong>Payment Method:</strong> {user.paymentDetails?.paymentMethod}</p>
          <p>Full access granted.</p>
        </div>
      ) : (
        <p>No active subscription. Please subscribe to get full access.</p>
      )}
    </div>
  );
};

export default UserProfile;
