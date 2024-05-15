import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const StripePaymentForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setIsLoading(false);
      setError(error.message);
      console.error(error);
    } else {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          amount: 500, // Amount in cents (e.g., $5.00)
        }),
      });

      const paymentIntent = await response.json();

      if (paymentIntent.error) {
        setIsLoading(false);
        setError(paymentIntent.error);
        console.error(paymentIntent.error);
      } else {
        setIsLoading(false);
        setPaymentDetails(paymentIntent);
        onSuccess(paymentIntent);
      }
    }
  };

  return (
    <div>
      {paymentDetails ? (
        <div className="p-6 bg-green-100 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Payment Successful!</h2>
          <p className="text-gray-700">Payment ID: {paymentDetails.id}</p>
          <p className="text-gray-700">Amount: ${(paymentDetails.amount / 100).toFixed(2)}</p>
          <p className="text-gray-700">Status: {paymentDetails.status}</p>
          <p className="text-gray-700">Created: {new Date(paymentDetails.created * 1000).toLocaleString()}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardElement options={{ hidePostalCode: true }} />
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg w-full mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Pay'}
          </button>
        </form>
      )}
    </div>
  );
};

export default StripePaymentForm;
