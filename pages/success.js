// pages/success.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export async function getServerSideProps({ query }) {
  const { session_id, token, orderId, PayerID, error } = query; // Support both Stripe and PayPal parameters

  // Check for error from payment provider redirect
  if (error) {
    return {
      props: { paymentId: null, error },
    };
  }

  // Prioritize orderId (PayPal) or token (PayPal), fall back to session_id (Stripe)
  const paymentId = orderId || token || session_id || null;

  if (!paymentId) {
    return {
      props: { paymentId: null, error: 'No payment identifier provided' },
    };
  }

  return {
    props: { paymentId, error: null },
  };
}

const Success = ({ paymentId, error }) => {
  const { t } = useTranslation('pricing');
  const router = useRouter();

  useEffect(() => {
    if (error) {
      toast.error(t(error));
      return;
    }

    if (paymentId) {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        toast.error(t('Authentication token not found. Please log in again.'));
        setTimeout(() => router.push('/login'), 2000); // Redirect to login if no token
        return;
      }

      let isMounted = true;

      fetch('/api/payment-success', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }), // Use generic paymentId for both Stripe and PayPal
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.message === 'Payment status updated to success' && isMounted) {
            toast.success(t('Payment successful! Your plan has been activated.'));
            setTimeout(() => {
              if (isMounted) router.push('/dashboard');
            }, 3000);
          } else {
            toast.error(t(data.error || 'Failed to update payment status'));
          }
        })
        .catch((err) => {
          console.error('Error updating payment status:', err);
          toast.error(t(err.message || 'Failed to update payment status'));
        });

      return () => {
        isMounted = false;
      };
    }
  }, [paymentId, error, router, t]);

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">{t(error)}</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-semibold">{t('Processing your payment...')}</h1>
    </div>
  );
};

export default Success;