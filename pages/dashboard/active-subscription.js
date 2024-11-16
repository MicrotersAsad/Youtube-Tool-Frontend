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
      if (!token) throw new Error('No token found');

      const response = await fetch('/api/user-list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const activeOrders = result.data.filter(
          (user) =>
            user?.paymentStatus === 'success' &&
            new Date(user.subscriptionValidUntil) > new Date()
        );
        setOrders(activeOrders);
      }
      setLoading(false);
    } catch (error) {
      console.error(error.message);
      setError(error.message);
      setLoading(false);
    }
  };

  const openOrderDetails = (order) => setSelectedOrder(order);

  const closeOrderDetails = () => setSelectedOrder(null);

  const downloadPDF = () => {
    if (modalRef.current && html2pdf) {
      const options = {
        margin: 0.5,
        filename: `${selectedOrder.username}_OrderDetails.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };
      html2pdf().set(options).from(modalRef.current).save();
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getFilteredOrders = () => {
    if (!searchQuery) return orders;
    return orders.filter(
      (order) =>
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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Active Subscriptions
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 text-center">
              {error}
            </div>
          )}

          <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
            <div className="relative w-full md:w-1/3">
              <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 py-2 rounded-lg bg-gray-200 border border-gray-300 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Search by username or email..."
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Skeleton height={30} count={5} className="mb-2" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-xs">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="py-2 px-2 text-left text-xs font-semibold">Username</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold">Email</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold">Payment Status</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold">Subscription Valid</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b bg-white hover:bg-gray-100 transition duration-300"
                      >
                        <td className="py-2 px-2 font-medium text-gray-800">{user.username}</td>
                        <td className="py-2 px-2 text-gray-600">{user.email}</td>
                        <td className="py-2 px-2 text-green-500 font-semibold">
                          {user.paymentStatus}
                        </td>
                        <td className="py-2 px-2 text-blue-500">
                          {new Date(user.subscriptionValidUntil).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            className="bg-blue-500 text-white px-2 py-2 rounded-md hover:bg-blue-600 transition"
                            onClick={() => openOrderDetails(user)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-gray-500">
                        No active orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <button
                className="px-2 py-2 bg-gray-300 rounded-l-md disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="px-2 py-2 bg-white border">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="px-2 py-2 bg-gray-300 rounded-r-md disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="bg-white p-8 rounded-lg shadow-lg max-w-3xl max-h-[90vh] overflow-y-auto relative"
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={closeOrderDetails}
            >
              <FaTimes size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center">Order Details</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <strong>Email:</strong> {selectedOrder.email}
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <strong>Subscription Plan:</strong> {selectedOrder.subscriptionPlan}
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <strong>Valid Until:</strong>{' '}
                {new Date(selectedOrder.subscriptionValidUntil).toLocaleDateString()}
              </div>
              {selectedOrder.paymentDetails && (
                <>
                  <h3 className="text-xl font-semibold mt-6">Payment Details</h3>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <strong>Amount Paid:</strong> ${selectedOrder.paymentDetails.amountPaid}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-center mt-6">
              <button
                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition"
                onClick={downloadPDF}
              >
                <FaDownload className="mr-2" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ActiveSubscription;
