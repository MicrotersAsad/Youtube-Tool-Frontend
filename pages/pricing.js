import React, { useState } from 'react';
import Modal from 'react-modal';
import { loadStripe } from '@stripe/stripe-js';
import { FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Image from 'next/image';

Modal.setAppElement('#__next'); // Set the app element for accessibility purposes

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const Pricing = () => {
  const { user, login, logout } = useAuth(); // Use Auth Context
  const { t } = useTranslation('pricing'); // Correct namespace
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // Default selected plan is yearly
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Assume user is not logged in initially
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);

  const handlePurchaseClick = () => {
    if (!user) {
      alert(t('Please log in to continue.'));
      // Redirect to login page or show login modal
      window.location.href = '/login'; // Redirect to login page
    } else {
      setIsModalOpen(true);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleContinue = async () => {
    if (selectedPaymentMethod === 'stripe') {
      const stripe = await stripePromise;
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedPlan,
        }),
      });

      const { id, error } = await response.json();

      if (error) {
        console.error(t('Error creating Stripe checkout session:'), error);
        return;
      }

      const result = await stripe.redirectToCheckout({ sessionId: id });
      if (result.error) {
        console.error(result.error.message);
      }
    } else {
      alert(t('Please select a payment method.'));
    }
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
       <Head>
            <title>Pricing</title>
            <meta
              name="description"
              content="Pricing Page"
            />
            <meta
              property="og:url"
              content="https://youtube-tool-frontend.vercel.app/about"
            />
         
            <meta
              property="og:description"
              content={
                "Enhance your YouTube experience with our comprehensive suite of tools designed for creators and viewers alike. Extract video summaries, titles, descriptions, and more. Boost your channel's performance with advanced features and insights"
              }
            />
          
          
            </Head>
      <div className="container mx-auto px-4">
        {/* Features and Pricing Plans */}
        <div className="flex flex-col md:flex-row justify-center items-start md:space-x-8 space-y-8 md:space-y-0">
          {/* Features List */}
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
                {/* Map over your features here */}
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
                  // Add more features as needed
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
          {/* Pricing Plans */}
          <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2">
            <div className="space-y-6">
              <div
                className={`border-2 rounded-lg p-6 ${selectedPlan === 'yearly' ? 'border-red-500' : 'border-gray-300'}`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <div className='flex justify-between items-center'>
                  {selectedPlan === 'yearly' && (
                    <span className="bg-red-500 text-white px-2 py-1 text-xs rounded">{t('MOST POPULAR')}</span>
                  )}
                </div>
                <div className="flex justify-between items-center mb-4">
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
          </div>
        </div>
        {/* Statistics */}
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
        {/* FAQ */}
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
        {/* Contact Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-10 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('Still Have Questions?')}</h2>
            <p className="text-gray-600 mb-4">{t('Reach out to us at contact@ytubetool.com or scan the QR code below.')}</p>
            <Image src="https://via.placeholder.com/150" alt="QR Code" width={100} height={100} className="mx-auto" />
          </div>
        </div>
        {/* Payment Method Modal */}
        <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 float-right">
              {t('Close')}
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
            <button onClick={handleContinue} className="bg-blue-500 text-white px-6 py-2 rounded-lg w-full">
              {t('Continue')}
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['pricing', 'navbar','footer'])),
    },
  };
}

export default Pricing;
