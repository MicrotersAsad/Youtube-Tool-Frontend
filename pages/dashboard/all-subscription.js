import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./layout";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AllSubscription = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Fetch orders for the given page
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      console.log("Fetching orders for page:", page);
      const response = await axios.get(`/api/get-order?page=${page}&limit=10`);
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalOrders: 0,
          limit: 10,
        });
        console.log("Orders fetched:", response.data.data.orders?.length || 0);
      } else {
        throw new Error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error(
        "Error fetching orders:",
        error.response?.data?.message || error.message
      );
      toast.error(
        `Failed to load orders: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete action
  const confirmDelete = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      console.log("Deleting order:", orderToDelete);
      const response = await axios.delete("/api/get-order", {
        data: { orderId: orderToDelete },
      });
      if (response.data.success) {
        toast.success("Order deleted successfully");
        fetchOrders(pagination.currentPage); // Refresh current page
        setShowDeleteModal(false);
      } else {
        throw new Error(response.data.message || "Failed to delete order");
      }
    } catch (error) {
      console.error(
        "Error deleting order:",
        error.response?.data?.message || error.message
      );
      toast.error(
        `Failed to delete order: ${error.response?.data?.message || error.message}`
      );
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
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    } catch (e) {
      return "N/A";
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4 border-gray-200">
            All Subscriptions
          </h1>

          {loading ? (
            <div className="px-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="mb-4 bg-white rounded-lg shadow-md p-4 md:hidden"
                >
                  <Skeleton height={20} count={10} className="mb-2" />
                </div>
              ))}
              <div className="hidden md:block overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Session ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton height={20} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-6 rounded-lg shadow-md">
              <p className="text-lg font-semibold">No Orders Found</p>
              <p className="text-gray-600">No subscriptions are available in the system.</p>
            </div>
          ) : (
            <>
              {/* Desktop: Table View */}
              <div className="hidden md:block overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Session ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order, index) => (
                      <tr
                        key={order.orderId}
                        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition duration-300`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.orderId || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.plan === "yearly_premium"
                            ? "Yearly Premium"
                            : order.plan || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.amount?.toFixed(2) || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(order.currency || "N/A").toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.paymentStatus || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {order.provider || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-ellipsis">
                          {order.sessionId || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.userId || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => confirmDelete(order.orderId)}
                            className="text-red-600 hover:text-red-800 mr-4"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() =>
                              toast.info(`View details for order ${order.orderId} (Coming soon)`)
                            }
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
                  <div
                    key={order.orderId}
                    className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
                  >
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="font-semibold text-gray-700">Order ID:</span>{" "}
                        {order.orderId || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Plan:</span>{" "}
                        {order.plan === "yearly_premium"
                          ? "Yearly Premium"
                          : order.plan || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Amount:</span>{" "}
                        ${order.amount?.toFixed(2) || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Currency:</span>{" "}
                        {(order.currency || "N/A").toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Status:</span>
                        <span
                          className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.paymentStatus || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Email:</span>{" "}
                        {order.email || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Provider:</span>{" "}
                        {order.provider || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Session ID:</span>{" "}
                        {order.sessionId || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">User ID:</span>{" "}
                        {order.userId || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Created At:</span>{" "}
                        {formatDate(order.createdAt)}
                      </div>
                      <div className="flex space-x-4 mt-2">
                        <button
                          onClick={() => confirmDelete(order.orderId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() =>
                            toast.info(`View details for order ${order.orderId} (Coming soon)`)
                          }
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
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200"
                >
                  Previous
                </button>
                <span className="text-gray-700 text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages} (Total Orders:{" "}
                  {pagination.totalOrders})
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Confirm Deletion
                </h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete order {orderToDelete}? This action cannot be
                  undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </div>
      </div>
    </Layout>
  );
};

export default AllSubscription;