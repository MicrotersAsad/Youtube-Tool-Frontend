import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const router = useRouter();
  const { session_id, order_id } = router.query;
  const { user, login, loading } = useAuth();

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [orderDetails, setOrderDetails]     = useState(null);
  const [selectedPlan] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('selectedPlan') : null
  );

  useEffect(() => {
    const fetchData = async () => {
      // 1) Wait for auth to finish loading
      if (loading) return;

      // 2) Get and validate JWT
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please log in again.');
        return router.push('/login');
      }

      // 3) Determine provider & sessionId
      let provider, sessionId;
      if (session_id) {
        provider = 'stripe';
        sessionId = session_id;
      } else if (order_id) {
        provider = 'paypal';
        sessionId = order_id;
      } else {
        // fallback from localStorage if you need it
        const fallback = JSON.parse(localStorage.getItem('paymentSession')||'{}');
        if (fallback.orderId) {
          provider = 'paypal';
          sessionId = fallback.orderId;
        } else {
          toast.error('No payment session found.');
          return router.push('/');
        }
      }

      // 4) Call your backend to finalize and record the order
      try {
        const resp = await axios.post(
          '/api/payment-success',
          { provider, sessionId, userId: user?.id, selectedPlan },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrderDetails(resp.data.order);
      } catch (err) {
        toast.error(err.response?.data?.error || err.message);
        return;
      }

      // 5) Fetch the provider-specific payment details
      try {
        if (provider === 'stripe') {
          const stripeResp = await axios.get(
            `/api/stripe-session?session_id=${sessionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPaymentDetails(stripeResp.data);
        } else {
          const ppResp = await axios.get(
            `/api/paypal-order?order_id=${sessionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPaymentDetails(ppResp.data);
        }
      } catch (err) {
        console.warn('Could not fetch details, using order:', err.message);
        setPaymentDetails({
          id: sessionId,
          status: orderDetails?.paymentStatus,
          amount: { value: orderDetails?.amount, currency_code: orderDetails?.currency },
        });
      }

      // 6) Refresh user data
      try {
        const userResp = await axios.get('/api/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        login(userResp.data);
      } catch {
        // non-fatal
      }

      // 7) Finally, redirect home or dashboard
      toast.success('Payment verified! Redirecting...');
      setTimeout(() => {
  router
    .push('/dashboard/dashboard')
    .then(() => window.location.reload());
}, 2000);

    };

    // only run once we have a router query and user loaded
    if ((session_id || order_id) && !loading) {
      fetchData();
    }
  }, [session_id, order_id, loading]);

  return (
    <div className="max-w-7xl mx-auto p-5">
      <Head>
        <title>Payment Successful | Ytubetools</title>
      </Head>
      <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
      {paymentDetails && orderDetails ? (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-2">Order ID: {orderDetails.orderId}</h2>
          <p><strong>Plan:</strong> {orderDetails.plan}</p>
          <p><strong>Status:</strong> {orderDetails.paymentStatus}</p>
          {paymentDetails.line_items?.data ? (
            <>
              <h3 className="mt-4 font-semibold">Items:</h3>
              <ul className="list-disc pl-6">
                {paymentDetails.line_items.data.map(item => (
                  <li key={item.id}>
                    {item.quantity}× {item.description} — ${(item.amount_total/100).toFixed(2)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : (
        <p>Loading payment details…</p>
      )}
    </div>
  );
};

export default PaymentSuccess;
