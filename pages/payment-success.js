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
      const token = localStorage.getItem('token');
      if (token) {
        axios.post('/api/payment-success', { sessionId: session_id }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          console.log('Payment status updated to success:', response.data);
          // Fetch the updated user data
          return axios.get('/api/user', { headers: { 'Authorization': `Bearer ${token}` } });
        })
        .then(response => {
          login(response.data.token); // Assuming the updated token is returned
          router.push('https://youtube-tool-frontend.vercel.app/');
        })
        .catch(error => {
          console.error('Failed to update payment status:', error);
        });

        axios.post('/api/get-session-details', { sessionId: session_id })
          .then(response => {
            setSessionDetails(response.data);
          })
          .catch(error => {
            console.error('Error fetching session details:', error);
          });
      } else {
        console.error('No token found in local storage');
      }
    }
  }, [session_id, user, login, router]);

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
