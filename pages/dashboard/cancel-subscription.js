import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Head from 'next/head';

const CancelSubscription = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    if (!user) {
      toast.error('Please log in to cancel your subscription.');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Subscription canceled successfully! You have been downgraded to the free plan.');
      setTimeout(() => router.push('/pricing'), 3000);
    } catch (error) {
      console.error('Cancel Subscription Failed:', error.message);
      toast.error(`Error canceling subscription: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        <title>Cancel Subscription | Ytubetools</title>
        <meta
          name="description"
          content="Cancel your Ytubetools subscription. Downgrade to the free plan and manage your account settings."
        />
      </Head>
      <h1 className="text-3xl font-bold mb-4">Cancel Subscription</h1>
      <p className="text-gray-600 mb-4">
        Are you sure you want to cancel your subscription? You will lose access to premium features and be downgraded to
        the free plan.
      </p>
      <button
        onClick={handleCancel}
        className={`bg-red-500 text-white px-6 py-2 rounded-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Cancel Subscription'}
      </button>
    </div>
  );
};

export default CancelSubscription;