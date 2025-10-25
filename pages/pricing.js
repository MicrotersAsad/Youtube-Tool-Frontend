import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { loadStripe } from '@stripe/stripe-js';
import { FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'react-toastify';

// Set the app element for accessibility
Modal.setAppElement('#__next');

/**
 * Pricing page component for displaying plans and handling payments.
 * @returns {JSX.Element} The pricing page UI.
 */
const Pricing = () => {
  const { user, login, logout } = useAuth();
  const { t } = useTranslation('pricing');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingDays, setRemainingDays] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({
    stripePublishableKey: null,
    paypalClientId: null,
  });

  const VALID_PAYMENT_STATUSES = ['COMPLETED', 'paid', 'completed'];

  // Initialize Stripe
  const stripePromise = paymentConfig.stripePublishableKey
    ? loadStripe(paymentConfig.stripePublishableKey)
    : null;

  /**
   * Fetches payment configuration from the server.
   */
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      const token = 'fc905a5a5ae08609ba38b046ecc8ef00'; // Consider storing in env or secure storage
      try {
        const res = await fetch('/api/paymentConfig', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const { data } = await res.json();
        if (!data?.paypal?.PAYPAL_CLIENT_ID) {
          throw new Error('PayPal Client ID is missing');
        }

        setPaymentConfig({
          stripePublishableKey: data.stripe?.STRIPE_PUBLISHABLE_KEY || null,
          paypalClientId: data.paypal?.PAYPAL_CLIENT_ID || null,
        });
      } catch (error) {
        console.error('Payment Config Fetch Error:', error.message);
        toast.error(t('Failed to load payment configuration. Please try again later.'));
      }
    };

    fetchPaymentConfig();
  }, [t]);

  /**
   * Determines if the user is on a free or expired plan.
   */
  const isFreePlan = user && (
    user.plan === 'free' ||
    !VALID_PAYMENT_STATUSES.includes(user.paymentDetails?.paymentStatus) ||
    (user.paymentDetails?.createdAt &&
      (() => {
        const createdAt = new Date(user.paymentDetails.createdAt);
        const validityDays = user.plan === 'yearly_premium' ? 365 : user.plan === 'monthly_premium' ? 30 : 0;
        const validUntil = new Date(createdAt.setDate(createdAt.getDate() + validityDays));
        return validUntil < new Date();
      })())
  );

  /**
   * Logs user data and calculates remaining subscription days.
   */
  useEffect(() => {
    console.debug('User:', { id: user?.id, plan: user?.plan, paymentStatus: user?.paymentDetails?.paymentStatus });
    console.debug('isFreePlan:', isFreePlan);

    if (user && VALID_PAYMENT_STATUSES.includes(user.paymentDetails?.paymentStatus)) {
      const updateRemainingDays = () => {
        if (!user.paymentDetails?.createdAt) {
          setRemainingDays(0);
          return;
        }
        const createdAt = new Date(user.paymentDetails.createdAt);
        if (isNaN(createdAt.getTime())) {
          setRemainingDays(0);
          return;
        }
        const validityDays = user.plan === 'yearly_premium' ? 365 : user.plan === 'monthly_premium' ? 30 : 0;
        if (validityDays === 0) {
          setRemainingDays(0);
          return;
        }
        const validUntil = new Date(createdAt.setDate(createdAt.getDate() + validityDays));
        const diffTime = validUntil - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setRemainingDays(diffDays > 0 ? diffDays : 0);
      };

      updateRemainingDays();
      const intervalId = setInterval(updateRemainingDays, 86400000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  /**
   * Validates JWT token expiration.
   * @param {string} token - The JWT token.
   * @returns {boolean} True if valid, false otherwise.
   */
  const validateToken = (token) => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch (error) {
      console.error('Token validation error:', error.message);
      return false;
    }
  };

  /**
   * Handles purchase button click.
   */
  const handlePurchaseClick = () => {
    if (!user) {
      toast.error(t('Please log in to continue.'));
      setTimeout(() => (window.location.href = '/login'), 2000);
      return;
    }
    if (!user.id || !user.email) {
      toast.error(t('User data incomplete. Please log in again.'));
      setTimeout(() => (window.location.href = '/login'), 2000);
      return;
    }
    if (!paymentConfig.stripePublishableKey && !paymentConfig.paypalClientId) {
      toast.error(t('Payment methods unavailable. Please contact support.'));
      return;
    }
    setIsModalOpen(true);
  };

  /**
   * Handles payment method selection.
   * @param {string} method - The payment method ('stripe' or 'paypal').
   */
  const handlePaymentMethodSelect = (method) => {
    if (method === 'stripe' && !paymentConfig.stripePublishableKey) {
      toast.error(t('Stripe is unavailable at the moment. Please choose another method.'));
      return;
    }
    if (method === 'paypal' && !paymentConfig.paypalClientId) {
      toast.error(t('PayPal is unavailable at the moment. Please choose another method.'));
      return;
    }
    setSelectedPaymentMethod(method);
  };

  /**
   * Creates a PayPal order.
   * @returns {Promise<string>} The PayPal order ID.
   */
  const handlePayPalOrderCreate = async () => {
    if (!selectedPlan || !user?.id) {
      const errorMessage = !selectedPlan ? 'Selected plan is missing' : 'User ID is missing';
      console.error('Order Creation Error:', errorMessage);
      toast.error(t(errorMessage));
      throw new Error(errorMessage);
    }

    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      console.debug('Creating PayPal Order:', { selectedPlan, userId: user.id });

      const response = await fetch('/api/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.trim()}`,
        },
        body: JSON.stringify({
          selectedPlan,
          userId: user.id,
        }),
      });

      const { id, error } = await response.json();
      if (error) {
        throw new Error(error);
      }
      console.debug('PayPal Order Created:', { orderId: id });
      return id;
    } catch (error) {
      console.error('PayPal Order Creation Failed:', error.message);
      toast.error(t('Error creating PayPal order: ') + error.message);
      throw error;
    }
  };

  /**
   * Handles PayPal order approval and capture.
   * @param {Object} data - PayPal approval data.
   * @param {Object} actions - PayPal actions.
   */
  const handlePayPalApprove = async (data, actions) => {
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);

    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error(t('Authentication token not found. Please log in again.'));
      }

      console.debug('Capturing PayPal Order:', { orderID: data.orderID, userId: user.id, selectedPlan });

      // Retry logic for transient errors
      const maxRetries = 3;
      let attempt = 0;
      let captureResponse;
      while (attempt < maxRetries) {
        try {
          const response = await fetch('/api/capture-paypal-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken.trim()}`,
            },
            body: JSON.stringify({
              orderID: data.orderID,
              userId: user.id,
              selectedPlan,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t('Failed to capture PayPal order'));
          }

          captureResponse = await response.json();
          break; // Success, exit retry loop
        } catch (error) {
          attempt++;
          if (attempt === maxRetries) {
            throw error; // Max retries reached
          }
          console.warn(`Retry ${attempt}/${maxRetries} for PayPal capture:`, error.message);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      console.debug('Capture PayPal Order Response:', captureResponse);

      // Handle already processed orders
      if (captureResponse.message === 'Order already processed') {
        toast.info(t('Order already processed. Redirecting to success page...'));
      } else if (captureResponse.error) {
        throw new Error(captureResponse.error);
      } else if (!captureResponse.order || !captureResponse.order.orderId) {
        throw new Error(t('Order details missing in response'));
      }

      // Store payment session
      const paymentSession = {
        orderId: captureResponse.order.orderId,
        plan: captureResponse.order.plan,
        amount: captureResponse.order.amount,
        provider: captureResponse.order.provider,
        sessionId: captureResponse.order.sessionId,
        timestamp: Date.now(),
        paymentStatus: 'completed',
      };
      localStorage.setItem('paymentSession', JSON.stringify(paymentSession));

      toast.success(t('Payment successful! Redirecting to success page...'));

      // Redirect to success page
      const { order } = captureResponse;
      const queryParams = new URLSearchParams({
        order_id: order.orderId,
        plan: order.plan,
        amount: order.amount.toString(),
        provider: order.provider,
        sessionId: order.sessionId,
        paymentStatus: 'completed',
      }).toString();
      setTimeout(() => {
        window.location.href = `/success?${queryParams}`;
      }, 3000);
    } catch (error) {
      console.error('PayPal Approval Failed:', error.message, error.stack);
      toast.error(t('Error capturing PayPal payment: ') + error.message);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  /**
   * Handles Stripe checkout continuation.
   */
  const handleContinue = async () => {
    if (!selectedPaymentMethod) {
      toast.error(t('Please select a payment method.'));
      return;
    }

    if (selectedPaymentMethod === 'stripe') {
      if (!stripePromise) {
        toast.error(t('Stripe is unavailable at the moment. Please try again later.'));
        return;
      }

      setIsLoading(true);
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          throw new Error(t('Authentication token not found. Please log in again.'));
        }

        if (!validateToken(authToken)) {
          toast.error(t('Session expired. Please log in again.'));
          localStorage.removeItem('token');
          setTimeout(() => (window.location.href = '/login'), 2000);
          throw new Error(t('Token expired'));
        }

        localStorage.setItem('selectedPlan', selectedPlan);

        const stripe = await stripePromise;
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken.trim()}`,
          },
          body: JSON.stringify({
            selectedPlan,
            userId: user.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('Failed to create Stripe checkout session'));
        }

        const { id, error } = await response.json();
        if (error) {
          throw new Error(error);
        }

        const result = await stripe.redirectToCheckout({ sessionId: id });
        if (result.error) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        console.error('Stripe Checkout Failed:', error.message);
        toast.error(t('Error processing Stripe checkout: ') + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Toggles FAQ section.
   * @param {number} index - The FAQ index.
   */
  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <Head>
        <title>Pricing | Ytubetools</title>
        <meta
          name="description"
          content="Explore our affordable pricing plans at Ytubetools. Choose the right plan to access powerful YouTube tools designed for creators and viewers, enhancing your channel's growth and engagement."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://ytubetools.com/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ytubetools.com/pricing" />
        <meta property="og:title" content="Pricing | Ytubetools" />
        <meta
          property="og:description"
          content="Discover Ytubetools’ pricing options. Choose the perfect plan to unlock exclusive YouTube tools and features tailored for creators. Boost your channel’s performance with powerful insights and tools."
        />
        <meta property="og:image" content="https://ytubetools.com/static/images/pricing-og-image.jpg" />
        <meta property="og:image:secure_url" content="https://ytubetools.com/static/images/pricing-og-image.jpg" />
        <meta property="og:site_name" content="Ytubetools" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:domain" content="ytubetools.com" />
        <meta property="twitter:url" content="https://ytubetools.com/pricing" />
        <meta name="twitter:title" content="Pricing | Ytubetools" />
        <meta
          name="twitter:description"
          content="Check out Ytubetools’ pricing plans. Select a plan that fits your needs to gain access to tools and insights that will help elevate your YouTube channel."
        />
        <meta name="twitter:image" content="https://ytubetools.com/static/images/pricing-twitter-image.jpg" />
        <meta name="twitter:site" content="@ytubetools" />
        <meta name="twitter:image:alt" content="Ytubetools Pricing Plans" />
      </Head>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center items-start md:space-x-8 space-y-8 md:space-y-0">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full">
            <h2 className="text-2xl font-semibold mb-4">{t('Features')}</h2>
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">{t('Feature')}</th>
                  <th scope="col" className="px-6 py-3">{t('Free Features')}</th>
                  <th scope="col" className="px-6 py-3">{t('Pro Features')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: t('YouTube Title and Description Generator'), free: false, pro: true },
                  { name: t('YouTube Keyword Explorer'), free: false, pro: true },
                  { name: t('YouTube Money Calculator'), free: false, pro: true },
                  { name: t('YouTube Video Ideas Generator'), free: false, pro: true },
                  { name: t('YouTube Video Stats'), free: false, pro: true },
                  { name: t('Ads Free'), free: true, pro: true },
                  { name: t('YouTube Tag Generator'), free: true, pro: true },
                  { name: t('YouTube Thumbnail Generator'), free: true, pro: true },
                  { name: t('YouTube Video Player'), free: true, pro: true },
                  { name: t('YouTube Comment Picker'), free: true, pro: true },
                ].map((feature, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">{feature.name}</td>
                    <td className="px-6 py-4">{feature.free ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />}</td>
                    <td className="px-6 py-4">{feature.pro ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2">
            {user && !isFreePlan ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800">{t('Your Active Subscription')}</h3>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <p className="text-lg text-gray-700">
                    <strong>{t('Plan')}:</strong>{' '}
                    {user.plan === 'yearly_premium' ? t('Yearly Premium') : t('Monthly Premium')}
                  </p>
                  <p className="text-lg text-gray-700">
                    <strong>{t('Status')}:</strong>{' '}
                    <span className="font-semibold text-green-500">{t('Active')}</span>
                  </p>
                  <p className="text-lg text-gray-700">
                    <strong>{t('Remaining Days')}:</strong>{' '}
                    {remainingDays !== null ? `${remainingDays} ${t('Days')}` : t('Calculating...')}
                  </p>
                  <p className="text-lg text-gray-700">
                    <strong>{t('Valid Until')}:</strong>{' '}
                    {user.paymentDetails.createdAt
                      ? (() => {
                          const validUntil = new Date(user.paymentDetails.createdAt);
                          const validityDays = user.plan === 'yearly_premium' ? 365 : 30;
                          validUntil.setDate(validUntil.getDate() + validityDays);
                          return validUntil.toLocaleDateString();
                        })()
                      : 'N/A'}
                  </p>
                  <button
                    onClick={() => (window.location.href = '/user-profile')}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                  >
                    {t('Manage Subscription')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div
                  className={`border-2 rounded-lg p-6 ${selectedPlan === 'yearly' ? 'border-red-500' : 'border-gray-300'}`}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  <div className="flex justify-between items-center mb-4">
                    {selectedPlan === 'yearly' && (
                      <span className="bg-red-500 text-white px-2 py-1 text-xs rounded">{t('MOST POPULAR')}</span>
                    )}
                    <h3 className="text-xl font-semibold">{t('Yearly Unlimited Plan')}</h3>
                  </div>
                  <div className="text-4xl font-bold text-red-500 mb-4">$60.00</div>
                  <p className="text-gray-600 mb-4">{t('Per year')}</p>
                  <button
                    className={`px-6 py-2 rounded-lg w-full ${selectedPlan === 'yearly' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                    onClick={handlePurchaseClick}
                  >
                    {t('Purchase')}
                  </button>
                </div>
                <div
                  className={`border-2 rounded-lg p-6 ${selectedPlan === 'monthly' ? 'border-red-500' : 'border-gray-300'}`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{t('Monthly Unlimited Plan')}</h3>
                  </div>
                  <div className="text-4xl font-bold text-gray-600 mb-4">$8.00</div>
                  <p className="text-gray-600 mb-4">{t('Per month')}</p>
                  <button
                    className={`px-6 py-2 rounded-lg w-full ${selectedPlan === 'monthly' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                    onClick={handlePurchaseClick}
                  >
                    {t('Purchase')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg mt-10 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold">1,20,000+</h3>
              <p className="text-gray-600">{t('Registered Users')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">42,000+</h3>
              <p className="text-gray-600">{t('Happy Users')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">12,000+</h3>
              <p className="text-gray-600">{t('Premium Users')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg mt-10">
          <h2 className="text-2xl font-semibold mb-4">{t('Frequently Asked Questions')}</h2>
          <div className="space-y-4">
            {[
              { question: t('Can I cancel my plan anytime?'), answer: t('Yes, you can cancel your plan at any time from your account settings.') },
              { question: t('What payment methods do you offer?'), answer: t('We accept all major credit cards and PayPal.') },
              { question: t('How can I switch/change my plan?'), answer: t('You can switch or change your plan from the billing section in your account settings.') },
              { question: t('Can I purchase only one tool?'), answer: t('Currently, we only offer the entire suite of tools as part of our plans.') },
              { question: t('Do you offer discounts for yearly plans?'), answer: t('Yes, we offer a significant discount for yearly plans as compared to monthly plans.') },
              { question: t('How can I cancel my plan?'), answer: t('You can cancel your plan from the account settings. Your access will remain until the end of the billing period.') },
              { question: t('How can I switch to annual billing?'), answer: t('You can switch to annual billing from the billing section in your account settings.') },
              { question: t('What is your refund policy?'), answer: t('We offer a 30-day money-back guarantee if you are not satisfied with our service.') },
              { question: t('Can I use YTubeTool for free?'), answer: t('Yes, we offer a free plan with limited features. You can upgrade anytime to access premium features.') },
            ].map((faq, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleFAQ(index)}>
                  <h3 className="font-semibold">{faq.question}</h3>
                  {openFAQ === index ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {openFAQ === index && <p className="text-gray-600 mt-2">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg mt-10 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('Still Have Questions?')}</h2>
            <p className="text-gray-600 mb-4">{t('Reach out to us at contact@ytubetool.com or scan the QR code below.')}</p>
          </div>
        </div>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="flex items-center justify-center min-h-screen"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 float-right">
              <FaTimes />
            </button>
            <h2 className="text-2xl mb-4">{t('Choose a payment method')}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {paymentConfig.paypalClientId && (
                <button
                  className={`p-4 border rounded-lg ${selectedPaymentMethod === 'paypal' ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}
                  onClick={() => handlePaymentMethodSelect('paypal')}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">✔</span> <span>{t('PayPal')}</span>
                  </div>
                </button>
              )}
              {paymentConfig.stripePublishableKey && (
                <button
                  className={`p-4 border rounded-lg ${selectedPaymentMethod === 'stripe' ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}
                  onClick={() => handlePaymentMethodSelect('stripe')}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">✔</span> <span>{t('Stripe')}</span>
                  </div>
                </button>
              )}
            </div>
            {selectedPaymentMethod === 'paypal' && paymentConfig.paypalClientId ? (
              <PayPalScriptProvider
                options={{
                  'client-id': paymentConfig.paypalClientId,
                  currency: 'USD',
                }}
                onError={(err) => {
                  console.error('PayPal Script Load Error:', err);
                  toast.error(t('Failed to load PayPal. Please check your credentials or try again later.'));
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
                    disabled={isLoading}
                  />
                )}
              </PayPalScriptProvider>
            ) : selectedPaymentMethod === 'stripe' && paymentConfig.stripePublishableKey ? (
              <button
                onClick={handleContinue}
                className={`bg-blue-500 text-white px-6 py-2 rounded-lg w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? t('Processing...') : t('Continue with Stripe')}
              </button>
            ) : (
              <div className="text-red-500">{t('Please select a payment method.')}</div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

/**
 * Server-side props for internationalization.
 * @param {Object} context - Next.js context.
 * @returns {Object} Props with translations.
 */
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['pricing', 'navbar', 'footer'])),
    },
  };
}

export default Pricing;