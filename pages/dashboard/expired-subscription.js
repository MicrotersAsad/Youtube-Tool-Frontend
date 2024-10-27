import React, { useState, useEffect, useRef } from 'react';
import Layout from './layout';
import { FaTimes, FaDownload, FaEnvelope } from 'react-icons/fa';
import Skeleton from 'react-loading-skeleton'; // Skeleton for loading states
import 'react-loading-skeleton/dist/skeleton.css';
import dynamic from 'next/dynamic';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Dynamically import html2pdf to prevent SSR issues
const html2pdf = typeof window !== "undefined" ? require('html2pdf.js') : null;

const ExpiredSubs = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('/api/user-list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Filter orders that have expired based on subscriptionValidUntil
        const expiredOrders = result.data.filter(user => {
          return user?.paymentStatus === "success" && new Date(user.subscriptionValidUntil) <= new Date();
        });
        setOrders(expiredOrders);
      }
      setLoading(false);
    } catch (error) {
      console.error(error.message);
      setError(error.message);
      setLoading(false);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const downloadPDF = () => {
    if (modalRef.current && html2pdf) {
      const options = {
        margin: 0.5,
        filename: `${selectedOrder.username}_OrderDetails.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(options).from(modalRef.current).save();
    }
  };

  const handleSendEmail = async (email) => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error('Subject and message cannot be empty');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [email],
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast.success('Email sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const openEmailModal = (user) => {
    setSelectedOrder(user);
    setEmailSubject('Important Update');
    setEmailMessage('Dear User,\n\nWe have an important update for you regarding your expired subscription.\n\nBest regards,\nYtTools');
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setEmailSubject('');
    setEmailMessage('');
    setShowEmailModal(false);
  };

  return (
    <Layout>
      <ToastContainer />
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            All Expired Orders
          </h2>

          {error && (
            <div className="bg-red-100 text-red-600 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-gray-500">
              <Skeleton count={5} height={30} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-red-400 text-black">
                  <tr>
                    <th className=" text-left text-sm font-semibold uppercase tracking-wider">
                      Username
                    </th>
                    <th className=" text-left text-sm font-semibold uppercase tracking-wider">
                      Email
                    </th>
                    <th className=" text-left text-sm font-semibold uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className=" text-left text-sm font-semibold uppercase tracking-wider">
                      Subscription Valid Until
                    </th>
                    <th className=" text-left text-sm font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((user) => (
                      <tr
                        key={user._id}
                        className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                      >
                        <td className=" whitespace-nowrap text-gray-800 font-medium">
                          {user.username}
                        </td>
                        <td className=" text-gray-600">
                          {user.email}
                        </td>
                        <td className=" text-red-500 font-semibold">
                          Expired
                        </td>
                        <td className=" text-blue-500">
                          {new Date(user.subscriptionValidUntil).toLocaleDateString()}
                        </td>
                        <td className=" space-x-2">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                            onClick={() => openOrderDetails(user)}
                          >
                            Details
                          </button>
                          <button
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200"
                            onClick={() => openEmailModal(user)}
                          >
                            <FaEnvelope className="inline mr-1" /> Send Email
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-5 text-center text-gray-500">
                        No expired orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for order details */}
      {selectedOrder && !showEmailModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto relative"
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              onClick={closeOrderDetails}
            >
              <FaTimes size={24} />
            </button>
            <h2 className="text-2xl font-semibold mb-4 text-center">Order Details for {selectedOrder.username}</h2>

            <div className="flex flex-col space-y-4">
              <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                <strong>Email:</strong> {selectedOrder.email}
              </div>
              <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                <strong>Payment Status:</strong> Expired
              </div>
              <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                <strong>Subscription Plan:</strong> {selectedOrder.subscriptionPlan}
              </div>
              <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                <strong>Subscription Valid Until:</strong> {new Date(selectedOrder.subscriptionValidUntil).toLocaleDateString()}
              </div>
              <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                <strong>Role:</strong> {selectedOrder.role}
              </div>

              {/* Payment Details */}
              {selectedOrder.paymentDetails && (
                <>
                  <h3 className="text-xl font-semibold mt-6 text-center">Payment Details</h3>
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <strong>Amount Paid:</strong> ${selectedOrder.paymentDetails.amountPaid}
                  </div>
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <strong>Currency:</strong> {selectedOrder.paymentDetails.currency}
                  </div>
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <strong>Payment Method:</strong> {selectedOrder.paymentDetails.paymentMethod}
                  </div>
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <strong>Stripe Customer ID:</strong> {selectedOrder.stripeCustomerId}
                  </div>
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <strong>Stripe Session ID:</strong> {selectedOrder.stripeSessionId}
                  </div>
                </>
              )}
            </div>

            {/* Download Button */}
            <div className="flex justify-center mt-6">
              <button
                className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition duration-200 flex items-center"
                onClick={downloadPDF}
              >
                <FaDownload className="mr-2" /> Download as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for sending email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
            <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" onClick={closeEmailModal}>
              <FaTimes size={24} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Send Email</h2>
            <label>Your Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
              placeholder="Enter subject"
            />
            <label>Your Message</label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
              placeholder="Enter message"
              rows="4"
            />
            <div className="flex justify-end space-x-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200"
                onClick={closeEmailModal}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200"
                onClick={() => handleSendEmail(selectedOrder?.email)}
                disabled={sendingEmail}
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ExpiredSubs;
