import React, { useState, useEffect, useRef } from 'react';
import Layout from './layout';
import { FaTimes, FaDownload, FaSearch } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Dynamically import html2pdf to prevent SSR issues
const html2pdf = typeof window !== "undefined" ? require('html2pdf.js') : null;

const ITEMS_PER_PAGE = 10;

const ActiveSubscription = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
        // Filter orders that are still active based on subscriptionValidUntil
        const activeOrders = result.data.filter(user => {
          return user?.paymentStatus === "success" && new Date(user.subscriptionValidUntil) > new Date();
        });
        setOrders(activeOrders);
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const getFilteredOrders = () => {
    if (!searchQuery) return orders;
    return orders.filter(order =>
      order.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const paginatedOrders = getFilteredOrders().slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(getFilteredOrders().length / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            All Active Orders
          </h2>

          {error && (
            <div className="bg-red-100 text-red-600 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="mb-6 flex justify-between items-center">
            <div className="relative w-64">
              <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 py-2 rounded-lg bg-gray-200 border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out"
                placeholder="Search by username or email..."
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <Skeleton height={30} count={5} className="mb-2" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-blue-400 text-black">
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
                      Subscription Valid
                    </th>
                    <th className=" text-left text-sm font-semibold uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((user) => (
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
                        <td className=" text-green-500 font-semibold">
                          {user.paymentStatus}
                        </td>
                        <td className=" text-blue-500">
                          {new Date(user.subscriptionValidUntil).toLocaleDateString()}
                        </td>
                        <td className="">
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
                        No active orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <button
                className="bg-gray-300 px-4 py-2 rounded-l-md disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-white border-t border-b">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="bg-gray-300 px-4 py-2 rounded-r-md disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for order details */}
      {selectedOrder && (
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
                <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
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
    </Layout>
  );
};

export default ActiveSubscription;
