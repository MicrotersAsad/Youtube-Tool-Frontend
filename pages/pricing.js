import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '../contexts/AuthContext';

// Ensure Modal is accessible for screen readers
Modal.setAppElement('#__next');

const Pricing = () => {
  const { user, loading } = useAuth(); // Get user and loading state from useAuth
  const { t } = useTranslation('pricing');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debug user object
  useEffect(() => {
    console.log('User from useAuth:', user);
  }, [user]);

  // Prevent rendering until auth is loaded
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('Loading...')}</div>;
  }

  // Handle purchase button click
  const handlePurchaseClick = () => {
    if (!user || !user.id) { // Remove user.uid check
      console.log('User not logged in or missing ID, redirecting to login');
      toast.error(t('Please log in to continue.'));
      setTimeout(() => (window.location.href = '/login'), 2000);
      return;
    }
    setIsModalOpen(true);
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePayPalOrderCreate = async () => {
    const userId = user.id; // Use user.id directly
    console.log('Sending PayPal Order Request:', { selectedPlan, userId });
  
    if (!selectedPlan || !userId) {
      const errorMessage = !selectedPlan ? 'Selected plan is missing' : 'User ID is missing';
      console.error(errorMessage);
      toast.error(t(errorMessage));
      throw new Error(errorMessage);
    }
  
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error('Authentication token not found');
      }
  
      const response = await fetch('/api/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.trim()}`,
        },
        body: JSON.stringify({
          selectedPlan,
          userId,
        }),
      });
  
      const { id, error } = await response.json();
      if (error) {
        throw new Error(error);
      }
      return id;
    } catch (error) {
      console.error('PayPal Order Creation Failed:', error.message);
      toast.error(t('Error creating PayPal order: ') + error.message);
      throw error;
    }
  };

  // Handle PayPal approval
  const handlePayPalApprove = async (data, actions) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/capture-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')?.trim()}`,
        },
        body: JSON.stringify({
          orderID: data.orderID,
          userId: user?.id || user?.uid,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success(t('Payment successful! Your plan has been activated.'));
      setTimeout(() => (window.location.href = '/dashboard'), 3000);
    } catch (error) {
      console.error('PayPal Approval Failed:', error.message);
      toast.error(t('Error capturing PayPal payment: ') + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Stripe or other payment methods (placeholder)
  const handleContinue = () => {
    // Implement Stripe logic here if needed
    toast.info(t('Stripe payment is not implemented yet.'));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">{t('Pricing Plans')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`border-2 rounded-lg p-6 ${selectedPlan === 'yearly' ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <h2 className="text-xl font-semibold">{t('Yearly Plan')}</h2>
            <p className="text-2xl font-bold mt-2">$60/year</p>
            <p className="mt-2 text-gray-600">{t('Best value for long-term use.')}</p>
            <button
              onClick={handlePurchaseClick}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
              {t('Purchase')}
            </button>
          </div>
          <div
            className={`border-2 rounded-lg p-6 ${selectedPlan === 'monthly' ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <h2 className="text-xl font-semibold">{t('Monthly Plan')}</h2>
            <p className="text-2xl font-bold mt-2">$8/month</p>
            <p className="mt-2 text-gray-600">{t('Flexible option for short-term use.')}</p>
            <button
              onClick={handlePurchaseClick}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
              {t('Purchase')}
            </button>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="flex items-center justify-center min-h-screen"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 float-right"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl mb-4">{t('Choose a payment method')}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                className={`p-4 border rounded-lg ${selectedPaymentMethod === 'paypal' ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}
                onClick={() => handlePaymentMethodSelect('paypal')}
              >
                <div className="flex items-center justify-center">
                  <span className="mr-2">✔</span> <span>{t('PayPal')}</span>
                </div>
              </button>
              <button
                className={`p-4 border rounded-lg ${selectedPaymentMethod === 'stripe' ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}
                onClick={() => handlePaymentMethodSelect('stripe')}
              >
                <div className="flex items-center justify-center">
                  <span className="mr-2">✔</span> <span>{t('Stripe')}</span>
                </div>
              </button>
            </div>
            {selectedPaymentMethod === 'paypal' ? (
              process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                <PayPalScriptProvider
                  options={{
                    'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
                    currency: 'USD',
                  }}
                  onError={(err) => {
                    console.error('PayPal Script Load Error:', err);
                    toast.error(t('Failed to load PayPal. Please try again.'));
                  }}
                >
                  {isLoading ? (
                    <div>{t('Loading PayPal...')}</div>
                  ) : (
                    <PayPalButtons
                      createOrder={handlePayPalOrderCreate}
                      onApprove={handlePayPalApprove}
                      onError={(err) => {
                        console.error('PayPal Button Error:', err);
                        toast.error(t('PayPal payment error: ') + err.message);
                      }}
                      style={{ layout: 'vertical' }}
                    />
                  )}
                </PayPalScriptProvider>
              ) : (
                <div className="text-red-500">{t('PayPal Client ID is missing. Please contact support.')}</div>
              )
            ) : selectedPaymentMethod === 'stripe' ? (
              <button
                onClick={handleContinue}
                className={`bg-blue-500 text-white px-6 py-2 rounded-lg w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? t('Processing...') : t('Continue')}
              </button>
            ) : null}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Pricing;