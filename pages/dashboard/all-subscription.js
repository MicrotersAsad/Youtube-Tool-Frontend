import React, { useState, useEffect } from 'react';
import Layout from './layout';
import { FaTimes } from 'react-icons/fa';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const AllOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

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
        const premiumUsers = result.data.filter(
          (user) => user?.paymentStatus === 'success'
        );
        setOrders(premiumUsers);
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6 md:p-10">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            All Successful Orders
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4 text-center font-semibold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10">
              <Skeleton height={30} count={5} className="mb-2" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-50 rounded-lg overflow-hidden">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="py-2 px-5 text-left text-xs font-semibold">
                      Username
                    </th>
                    <th className="py-2 px-5 text-left text-xs font-semibold">
                      Email
                    </th>
                    <th className="py-2 px-5 text-left text-xs font-semibold">
                      Payment Status
                    </th>
                    <th className="py-2 px-5 text-left text-xs font-semibold">
                      Subscription Valid
                    </th>
                    <th className="py-2 px-5 text-left text-xs font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b bg-white hover:bg-blue-50 transition duration-300"
                      >
                        <td className="py-2 px-5 text-gray-700 font-medium">
                          {user.username}
                        </td>
                        <td className="py-2 px-5 text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-2 px-5 text-green-600 font-semibold">
                          {user.paymentStatus}
                        </td>
                        <td className="py-2 px-5 text-blue-600">
                          {new Date(user.subscriptionValidUntil).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-5">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 shadow-xs"
                            onClick={() => openOrderDetails(user)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-5 text-center text-gray-500 font-medium"
                      >
                        No successful orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={closeOrderDetails}
            >
              <FaTimes size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">
              Order Details for {selectedOrder.username}
            </h2>
            <div className="space-y-4">
              <div>
                <strong>Email:</strong> {selectedOrder.email}
              </div>
              <div>
                <strong>Payment Status:</strong>{' '}
                <span className="text-green-600">{selectedOrder.paymentStatus}</span>
              </div>
              <div>
                <strong>Subscription Plan:</strong> {selectedOrder.subscriptionPlan}
              </div>
              <div>
                <strong>Valid Until:</strong>{' '}
                {new Date(selectedOrder.subscriptionValidUntil).toLocaleDateString()}
              </div>
              <div>
                <strong>Role:</strong> {selectedOrder.role}
              </div>
              {selectedOrder.paymentDetails && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
                  <div>
                    <strong>Amount Paid:</strong> $
                    {selectedOrder.paymentDetails.amountPaid}
                  </div>
                  <div>
                    <strong>Currency:</strong>{' '}
                    {selectedOrder.paymentDetails.currency}
                  </div>
                  <div>
                    <strong>Payment Method:</strong>{' '}
                    {selectedOrder.paymentDetails.paymentMethod}
                  </div>
                  <div>
                    <strong>Stripe Customer ID:</strong>{' '}
                    {selectedOrder.paymentDetails.stripeCustomerId}
                  </div>
                  <div>
                    <strong>Stripe Session ID:</strong>{' '}
                    {selectedOrder.paymentDetails.stripeSessionId}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllOrder;
