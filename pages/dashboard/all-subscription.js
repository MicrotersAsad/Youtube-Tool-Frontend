import React, { useState, useEffect } from 'react';
import Layout from './layout';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaSearch } from 'react-icons/fa';

const AllOrder = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const itemsPerPage = 10; // Number of items per page

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [orders, searchTerm]);

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
        const premiumUsers = result.data
          .filter((user) => user?.paymentStatus === 'success')
          .reverse(); // Reverse order to show latest orders first
        setOrders(premiumUsers);
        setFilteredOrders(premiumUsers);
      }
      setLoading(false);
    } catch (error) {
      console.error(error.message);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    const filtered = term
      ? orders.filter(
          (order) =>
            order.username.toLowerCase().includes(term.toLowerCase()) ||
            order.email.toLowerCase().includes(term.toLowerCase())
        )
      : orders;
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to the first page on search
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);



  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white pt-5 pb-5">
        {/* Search Bar */}
<div className="flex flex-col md:flex-row justify-between items-center ms-4 mb-4 space-y-4 md:space-y-0">
  {/* Left side heading */}
  <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left">
    All Subscription
  </h2>

  {/* Right side search bar */}
  <div className="flex border border-gray-300 rounded-md overflow-hidden md:me-5 w-full md:w-64">
    <input
      type="text"
      value={searchTerm}
      onChange={handleSearchChange}
      placeholder="UserName"
      className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
    />
    <button className="bg-[#071251] p-2 flex items-center justify-center">
      <FaSearch className="text-white" />
    </button>
  </div>
</div>



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
            <>
              <div className="overflow-x-auto">
               {/* Responsive Table */}
               <div className="block md:hidden">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-white shadow-md rounded-lg mb-4 border border-gray-200 p-4"
                      >
                        <div className="mb-2">
                          <strong>Username:</strong> {order.username}
                        </div>
                        <div className="mb-2">
                          <strong>Email:</strong> {order.email}
                        </div>
                        <div className="mb-2">
                          <strong>Payment Status:</strong>{' '}
                          <span className="text-green-600">{order.paymentStatus}</span>
                        </div>
                        <div className="mb-2">
                          <strong>Subscription Valid:</strong>{' '}
                          {new Date(order.subscriptionValidUntil).toLocaleDateString()}
                        </div>
                        <div className="mt-4">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 shadow-xs"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">No successful orders found.</div>
                  )}
                </div>

                {/* Desktop Table */}
                <table className="hidden md:table w-full bg-gray-50 rounded-lg overflow-hidden">
                  <thead className="bg-[#071251] text-white">
                    <tr className=''>
                      <th className="pt-3 pb-3 px-4 text-left text-xs font-semibold">Username</th>
                      <th className="py-2 px-5 text-left text-xs font-semibold">Email</th>
                      <th className="py-2 px-5 text-left text-xs font-semibold">Payment Status</th>
                      <th className="py-2 px-5 text-left text-xs font-semibold">
                        Subscription Valid
                      </th>
                      <th className="py-2 px-5 text-left text-xs font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order) => (
                        <tr
                          key={order._id}
                          className="border-b bg-white hover:bg-blue-50 transition duration-300"
                        >
                          <td className="py-2 px-5 text-gray-700 font-medium">{order.username}</td>
                          <td className="py-2 px-5 text-gray-600">{order.email}</td>
                          <td className="py-2 px-5 text-green-600 font-semibold">
                            {order.paymentStatus}
                          </td>
                          <td className="py-2 px-5 text-blue-600">
                            {new Date(order.subscriptionValidUntil).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-5">
                            <button
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 shadow-xs"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-5 text-center text-gray-500 font-medium">
                          No successful orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              {/* Pagination Controls */}
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === index + 1
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {selectedOrder && (
          <div className="mt-10 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Order Details for {selectedOrder.username}
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm md:text-base">
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <strong>Email:</strong> {selectedOrder.email}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <strong>Payment Status:</strong>{' '}
                <span className="text-green-600">{selectedOrder.paymentStatus}</span>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <strong>Subscription Plan:</strong> {selectedOrder.subscriptionPlan}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <strong>Valid Until:</strong>{' '}
                {new Date(selectedOrder.subscriptionValidUntil).toLocaleDateString()}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <strong>Role:</strong> {selectedOrder.role}
              </div>
              {selectedOrder.paymentDetails && (
                <>
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <strong>Amount Paid:</strong> $
                    {selectedOrder.paymentDetails.amountPaid}
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <strong>Currency:</strong> {selectedOrder.paymentDetails.currency}
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <strong>Payment Method:</strong>{' '}
                    {selectedOrder.paymentDetails.paymentMethod}
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm break-words">
  <strong>Stripe Customer ID:</strong>
  <span className="block mt-1 text-sm text-gray-700 break-all">
    {selectedOrder.stripeCustomerId}
  </span>
</div>
<div className="bg-gray-100 p-4 rounded-lg shadow-sm break-words">
  <strong>Stripe Session ID:</strong>
  <span className="block mt-1 text-sm text-gray-700 break-all">
    {selectedOrder.stripeSessionId}
  </span>
</div>

                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllOrder;
