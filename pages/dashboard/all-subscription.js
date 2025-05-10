import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './layout';

const AllSubscription = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });
  const [loading, setLoading] = useState(false);

  // Fetch orders for the given page
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      console.log('Fetching orders for page:', page);
      const response = await axios.get(`/api/get-order?page=${page}&limit=10`);
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setPagination(response.data.data.pagination);
        console.log('Orders fetched:', response.data.data.orders.length);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data?.message || error.message);
      toast.error(`Failed to load orders: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete an order
  const handleDelete = async (orderId) => {
    try {
      console.log('Deleting order:', orderId);
      const response = await axios.delete('/api/get-order', {
        data: { orderId },
      });
      if (response.data.success) {
        toast.success('Order deleted successfully');
        fetchOrders(pagination.currentPage); // Refresh current page
      } else {
        throw new Error(response.data.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error.response?.data?.message || error.message);
      toast.error(`Failed to delete order: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders(1);
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  return (
    <Layout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Subscriptions</h1>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-4 rounded">
          <p className="font-bold">No Orders Found</p>
          <p>No orders are available in the system.</p>
        </div>
      ) : (
        <>
          {/* Desktop: Table View */}
          <div className="hidden md:block overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.plan === 'yearly_premium' ? 'Yearly Premium' : order.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.currency.toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{order.provider}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-ellipsis">{order.sessionId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(order.orderId)}
                        className="text-red-600 hover:text-red-800 mr-4"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => toast.info(`View details for order ${order.orderId} (Coming soon)`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card View */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <div key={order.orderId} className="bg-white shadow-md rounded-lg p-4">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-semibold text-gray-700">Order ID:</span> {order.orderId}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Plan:</span> {order.plan === 'yearly_premium' ? 'Yearly Premium' : order.plan}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Amount:</span> ${order.amount.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Currency:</span> {order.currency.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>
                    <span
                      className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span> {order.email}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Provider:</span> {order.provider}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Session ID:</span> {order.sessionId}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">User ID:</span> {order.userId}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Created At:</span> {formatDate(order.createdAt)}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleDelete(order.orderId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => toast.info(`View details for order ${order.orderId} (Coming soon)`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages} (Total Orders: {pagination.totalOrders})
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
    </Layout>
  );
};

export default AllSubscription;