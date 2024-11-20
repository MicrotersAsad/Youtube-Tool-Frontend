import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [sessionDetails, setSessionDetails] = useState(null);
  const { user, login } = useAuth();

  useEffect(() => {
    if (session_id && user) {
      const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
  
        try {
          await axios.post('/api/payment-success', { sessionId: session_id }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Payment status updated.');
  
          const response = await axios.get('/api/user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          login(response.data.token);
          router.push('https://youtube-tool-frontend.vercel.app/');
        } catch (error) {
          console.error('Error:', error);
        }
      };
  
      fetchData();
    }
  }, [session_id, user, login, router]); // সঠিক ডিপেন্ডেন্সি ব্যবহার করুন
  

  return (
    <div>
      <h1>Payment Successful</h1>
      <p>Thank you for your purchase!</p>
      {sessionDetails ? (
        <div>
          <h2>Billing Details</h2>
          <p><strong>Email:</strong> {sessionDetails.customer_email}</p>
          <p><strong>Amount Paid:</strong> ${(sessionDetails.amount_total / 100).toFixed(2)}</p>
          <p><strong>Payment Status:</strong> {sessionDetails.payment_status}</p>
          <h2>Items Purchased</h2>
          <ul>
            {sessionDetails.line_items.data.map(item => (
              <li key={item.id}>
                {item.quantity} x {item.description} - ${(item.amount_total / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading session details...</p>
      )}
    </div>
  );
};

export default PaymentSuccess;
