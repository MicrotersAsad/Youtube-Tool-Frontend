import React, { useState } from 'react';
import Modal from 'react-modal';
import { FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

Modal.setAppElement('#__next'); // This ensures that the app element is set for accessibility

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // Default selected plan is yearly
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Assume user is logged in for this example
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);

  const handlePurchaseClick = () => {
    if (!isLoggedIn) {
      alert('Please log in to continue.');
      // Redirect to login page or show login modal
    } else {
      setIsModalOpen(true);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    if (method === 'stripe') {
      // Set your Stripe Payment Link here
      const successUrl = `${window.location.origin}/payment-success?payment_intent={CHECKOUT_SESSION_ID}`;
      if (selectedPlan === 'yearly') {
        setPaymentLink(`https://buy.stripe.com/test_4gw3dp1se6iV4rm288?success_url=${successUrl}`);
      } else {
        setPaymentLink(`https://buy.stripe.com/test_28odRT6jx8pJ2ti7su?success_url=${successUrl}`);
      }
    }
  };

  const handleContinue = () => {
    if (selectedPaymentMethod === 'stripe' && paymentLink) {
      window.location.href = paymentLink;
    } else {
      alert('Please select a payment method.');
    }
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-5">
      <div className="container mx-auto px-4">
        {/* Features and Pricing Plans */}
        <div className="flex flex-col md:flex-row justify-center items-start md:space-x-8 space-y-8 md:space-y-0">
          {/* Features List */}
          <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Features */}
              <div>
                <h3 className="text-xl font-semibold mb-2">Free Features</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Ads Free</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Tag Generator</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Thumbnail Generator</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Video Player</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Comment Picker</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Title and Description Generator</span>
                    <FaTimes className="text-red-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Keyword Explorer</span>
                    <FaTimes className="text-red-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Money Calculator</span>
                    <FaTimes className="text-red-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Video Ideas Generator</span>
                    <FaTimes className="text-red-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Video Stats</span>
                    <FaTimes className="text-red-500" />
                  </li>
                </ul>
              </div>
              {/* Pro Features */}
              <div>
                <h3 className="text-xl font-semibold mb-2">Pro Features</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Youtube Title and Description Generator</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Keyword Explorer</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Money Calculator</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Video Ideas Generator</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Video Stats</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Hashtag Finder</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Tag Extractor</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Trends</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Description Generator</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Shorts Downloader</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Thumbnail Downloader</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Channel Logo Downloader</span>
                    <FaCheck className="text-green-500" />
                  </li>
                  <li className="flex justify-between">
                    <span>Youtube Channel ID Finder</span>
                    <FaCheck className="text-green-500" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* Pricing Plans */}
          <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2">
            <div className="space-y-6">
              <div
                className={`border-2 rounded-lg p-6 ${selectedPlan === 'yearly' ? 'border-red-500' : 'border-gray-300'}`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Yearly Unlimited Plan</h3>
                  {selectedPlan === 'yearly' && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded">MOST POPULAR</span>
                  )}
                </div>
                <div className="text-4xl font-bold text-red-500 mb-4">$5.00</div>
                <p className="text-gray-600 mb-4">Per month, charged yearly at $60.00</p>
                <button
                  className={`px-6 py-2 rounded-lg w-full ${selectedPlan === 'yearly' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                  onClick={handlePurchaseClick}
                >
                  Purchase
                </button>
              </div>
              <div
                className={`border-2 rounded-lg p-6 ${selectedPlan === 'monthly' ? 'border-red-500' : 'border-gray-300'}`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Monthly Unlimited Plan</h3>
                </div>
                <div className="text-4xl font-bold text-gray-600 mb-4">$8.00</div>
                <p className="text-gray-600 mb-4">Per month, cancel anytime</p>
                <button
                  className={`px-6 py-2 rounded-lg w-full ${selectedPlan === 'monthly' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                  onClick={handlePurchaseClick}
                >
                  Purchase
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
              <p className="text-gray-600">Registered Users</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">42,000+</h3>
              <p className="text-gray-600">Happy Users</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold">12,000+</h3>
              <p className="text-gray-600">Premium Users</p>
            </div>
          </div>
        </div>
        {/* FAQ */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-10">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { question: 'Can I cancel my plan anytime?', answer: 'Yes, you can cancel your plan at any time from your account settings.' },
              { question: 'What payment methods do you offer?', answer: 'We accept all major credit cards and PayPal.' },
              { question: 'How can I switch/change my plan?', answer: 'You can switch or change your plan from the billing section in your account settings.' },
              { question: 'Can I purchase only one tool?', answer: 'Currently, we only offer the entire suite of tools as part of our plans.' },
              { question: 'Do you offer discounts for yearly plans?', answer: 'Yes, we offer a significant discount for yearly plans as compared to monthly plans.' },
              { question: 'How can I cancel my plan?', answer: 'You can cancel your plan from the account settings. Your access will remain until the end of the billing period.' },
              { question: 'How can I switch to annual billing?', answer: 'You can switch to annual billing from the billing section in your account settings.' },
              { question: 'What is your refund policy?', answer: 'We offer a 30-day money-back guarantee if you\'re not satisfied with our service.' },
              { question: 'Can I use YTubeTool for free?', answer: 'Yes, we offer a free plan with limited features. You can upgrade anytime to access premium features.' },
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
            <h2 className="text-2xl font-semibold mb-4">Still Have Questions?</h2>
            <p className="text-gray-600 mb-4">Reach out to us at contact@ytubetool.com or scan the QR code below.</p>
            <img src="https://via.placeholder.com/150" alt="QR Code" className="mx-auto" />
          </div>
        </div>
      </div>
      {/* Payment Method Modal */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h2 className="text-2xl mb-4">Choose a payment method</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              className={`p-4 border rounded-lg ${selectedPaymentMethod === 'paypal' ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}
              onClick={() => handlePaymentMethodSelect('paypal')}
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">✔</span> <span>PayPal</span>
              </div>
            </button>
            <button
              className={`p-4 border rounded-lg ${selectedPaymentMethod === 'stripe' ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}
              onClick={() => handlePaymentMethodSelect('stripe')}
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">✔</span> <span>Stripe</span>
              </div>
            </button>
          </div>
          <button onClick={handleContinue} className="bg-blue-500 text-white px-6 py-2 rounded-lg w-full">
            Continue
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Pricing;
