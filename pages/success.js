import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const router = useRouter();
  const { session_id, order_id } = router.query;
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const { user, login, loading } = useAuth();
  const [selectedPlan] = useState(typeof window !== 'undefined' ? localStorage.getItem('selectedPlan') : null);

  useEffect(() => {
    console.log('PaymentSuccess useEffect:', { user, selectedPlan, session_id, order_id, loading });

    const fetchData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? 'Present' : 'Missing');

        // Wait for user loading to complete
        if (loading) {
          console.log('Waiting for user data to load...');
          return;
        }

        // Get payment session from localStorage as fallback
        let fallbackSession = null;
        if (!session_id && !order_id) {
          const paymentSession = localStorage.getItem('paymentSession');
          if (paymentSession) {
            fallbackSession = JSON.parse(paymentSession);
            console.log('Using fallback payment session:', fallbackSession);
          } else {
            console.warn('No session_id, order_id, or paymentSession available');
            toast.error('Payment details unavailable. Please contact support.');
            setTimeout(() => router.push('/login'), 2000);
            return;
          }
        }

        // Handle missing selectedPlan
        if (!selectedPlan) {
          console.warn('Missing selectedPlan:', { selectedPlan });
          toast.warn('Plan details unavailable. Contact support if this persists.');
          return;
        }

        // Map selectedPlan to database plan
        const planConfig = {
          yearly: { plan: 'yearly_premium', amount: 60.0, currency: 'usd' },
          monthly: { plan: 'monthly_premium', amount: 8.0, currency: 'usd' },
        }[selectedPlan];

        if (!planConfig) {
          throw new Error(`Invalid plan: ${selectedPlan}`);
        }

        let provider, sessionId;
        if (session_id) {
          provider = 'stripe';
          sessionId = session_id;
        } else if (order_id || (fallbackSession && fallbackSession.orderId)) {
          provider = 'paypal';
          sessionId = order_id || fallbackSession.orderId;
        } else {
          throw new Error('No valid session ID or order ID provided');
        }

        // Call payment-success to verify payment and create order
        const response = await axios.post(
          '/api/payment-success',
          {
            provider,
            sessionId,
            userId: user?.id || 'anonymous',
            selectedPlan,
          },
          {
            headers: token ? { Authorization: `Bearer ${token.trim()}` } : {},
          }
        );
        console.log('Payment success response:', response.data);
        setOrderDetails(response.data.order);

        // Fetch payment details for display
        if (provider === 'stripe') {
          const sessionResponse = await axios.get(`/api/stripe-session?session_id=${sessionId}`, {
            headers: token ? { Authorization: `Bearer ${token.trim()}` } : {},
          });
          setPaymentDetails(sessionResponse.data);
        } else if (provider === 'paypal') {
          try {
            const paypalResponse = await axios.get(`/api/paypal-order?order_id=${sessionId}`, {
              headers: token ? { Authorization: `Bearer ${token.trim()}` } : {},
            });
            setPaymentDetails(paypalResponse.data);
          } catch (error) {
            console.error('Failed to fetch PayPal order details:', error.message);
            // Fallback to order details if PayPal API fails
            setPaymentDetails({
              id: sessionId,
              status: orderDetails?.paymentStatus || 'completed',
              amount: { value: orderDetails?.amount || planConfig.amount, currency_code: planConfig.currency },
            });
          }
        }

        // Fetch updated user data if token is available
        if (token) {
          try {
            const userResponse = await axios.get('/api/user', {
              headers: { Authorization: `Bearer ${token.trim()}` },
              timeout: 5000,
            });
            login(userResponse.data);
          } catch (userError) {
            console.warn('Failed to fetch updated user data:', userError.message);
            toast.warn('Unable to update user data. Please log in again.');
          }
        }

        // Redirect to user profile
        toast.success('Payment verified! Redirecting to profile...');
        setTimeout(() => router.push('/dashboard'), 3000);
      } catch (error) {
        console.error('Error in fetchData:', error.response?.data?.error || error.message);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('token');
          setTimeout(() => router.push('/login'), 2000);
        } else {
          toast.error(`Error: ${error.response?.data?.error || error.message}`);
        }
      }
    };

    fetchData();
  }, [session_id, order_id, user, selectedPlan, login, router, loading]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        <title>Payment Successful | Ytubetools</title>
        <meta name="description" content="Your payment was successful. Thank you for your purchase!" />
      </Head>
      <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
      <p className="text-gray-600 mb-4">Thank you for your purchase!</p>
      {paymentDetails && orderDetails ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Billing Details</h2>
          <p><strong>Email:</strong> {orderDetails.email || 'N/A'}</p>
       
          <p><strong>Payment Status:</strong> {orderDetails.paymentStatus || paymentDetails.status}</p>
          <p><strong>Plan:</strong> {orderDetails.plan === 'yearly_premium' ? 'Yearly Premium' : 'Monthly Premium'}</p>
          <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
          {paymentDetails.line_items ? (
            <>
              <h2 className="text-xl font-semibold mt-4">Items Purchased</h2>
              <ul>
                {paymentDetails.line_items.data.map((item) => (
                  <li key={item.id}>
                    {item.quantity} x {item.description} - ${(item.amount_total / 100).toFixed(2)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : (
        <p>Loading payment details...</p>
      )}
    </div>
  );
};

export default PaymentSuccess;