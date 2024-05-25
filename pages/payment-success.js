import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PaymentSuccess = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (session_id) {
      const fetchSession = async () => {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        setSession(session);
      };

      fetchSession();
    }
  }, [session_id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <h1 className="text-3xl font-semibold text-green-500">Payment Successful</h1>
      {session && (
        <div>
          <p className="mt-4">Thank you for your purchase! Your subscription is now active.</p>
          <p className="mt-4">Customer Email: {session.customer_details.email}</p>
          <p className="mt-4">Subscription ID: {session.subscription}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
