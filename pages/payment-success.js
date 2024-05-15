import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const PaymentSuccess = () => {
  const router = useRouter();
  const { payment_intent } = router.query; // Get payment intent ID from query parameters
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (payment_intent) {
      // Fetch payment details from your backend
      fetch(`/api/get-payment-intent?payment_intent=${payment_intent}`)
        .then((response) => response.json())
        .then((data) => {
          setPaymentDetails(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching payment details:', error);
          setError('Failed to fetch payment details');
          setLoading(false);
        });
    }
  }, [payment_intent]);

  const handleDownloadReceipt = () => {
    if (paymentDetails) {
      const receiptData = `
        Payment ID: ${paymentDetails.id}
        Amount: ${(paymentDetails.amount / 100).toFixed(2)} USD
        Status: ${paymentDetails.status}
        Created: ${new Date(paymentDetails.created * 1000).toLocaleString()}
      `;
      const blob = new Blob([receiptData], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'receipt.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {paymentDetails && (
        <div className="p-6 bg-green-100 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Payment Successful!</h2>
          <p className="text-gray-700">Payment ID: {paymentDetails.id}</p>
          <p className="text-gray-700">Amount: ${(paymentDetails.amount / 100).toFixed(2)} USD</p>
          <p className="text-gray-700">Status: {paymentDetails.status}</p>
          <p className="text-gray-700">Created: {new Date(paymentDetails.created * 1000).toLocaleString()}</p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-lg w-full mt-4"
            onClick={handleDownloadReceipt}
          >
            Download Receipt
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
