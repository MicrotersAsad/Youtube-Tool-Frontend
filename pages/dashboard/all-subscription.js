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
        // Filter users with successful payment status
        const premiumUsers = result.data.filter(user => user?.paymentStatus === "success");
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
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            All Successful Orders
          </h2>
          
          {error && (
            <div className="bg-red-100 text-red-600 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10">
              <Skeleton height={30} count={5} className="mb-2" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-blue-400 text-black">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                      Username
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                      Email
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                      Subscription Valid
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                      Details
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
                        <td className="py-4 px-6 whitespace-nowrap text-gray-800 font-medium">
                          {user.username}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-4 px-6 text-green-500 font-semibold">
                          {user.paymentStatus}
                        </td>
                        <td className="py-4 px-6 text-blue-500">
                          {new Date(user.subscriptionValidUntil).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                            onClick={() => openOrderDetails(user)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-5 text-center text-gray-500">
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

      {/* Modal for order details */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto relative">
            <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" onClick={closeOrderDetails}>
              <FaTimes size={24} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Order Details for {selectedOrder.username}</h2>
            <div className="flex flex-col space-y-2">
              <div>
                <strong>Email:</strong> {selectedOrder.email}
              </div>
              <div>
                <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
              </div>
              <div>
                <strong>Subscription Plan:</strong> {selectedOrder.subscriptionPlan}
              </div>
              <div>
                <strong>Subscription Valid Until:</strong> {new Date(selectedOrder.subscriptionValidUntil).toLocaleDateString()}
              </div>
              <div>
                <strong>Role:</strong> {selectedOrder.role}
              </div>
              {/* Payment Details */}
              {selectedOrder.paymentDetails && (
                <>
                  <h3 className="text-lg font-semibold mt-4">Payment Details</h3>
                  <div>
                    <strong>Amount Paid:</strong> ${selectedOrder.paymentDetails.amountPaid}
                  </div>
                  <div>
                    <strong>Currency:</strong> {selectedOrder.paymentDetails.currency}
                  </div>
                  <div>
                    <strong>Payment Method:</strong> {selectedOrder.paymentDetails.paymentMethod}
                  </div>
                  <div>
                    <strong>Stripe Customer ID:</strong> {selectedOrder.stripeCustomerId}
                  </div>
                  <div>
                    <strong>Stripe Session ID:</strong> {selectedOrder.stripeSessionId}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllOrder;
