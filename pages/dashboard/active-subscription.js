import React, { useState, useEffect } from "react";
import Layout from "./layout";
import { FaSearch, FaTimes } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import axios from "axios";

const ITEMS_PER_PAGE = 10;

const ActiveSubscription = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      console.log("Fetching orders for page:", page);
      const token = localStorage.getItem("token");
      console.log("Token:", token); // Debug: Log token
      const response = await axios.get(`/api/get-order?page=${page}&limit=${ITEMS_PER_PAGE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API response:", response.data); // Debug: Log full response

      if (response.data.success) {
        const fetchedOrders = response.data.data.orders || [];
        console.log("Fetched orders:", fetchedOrders); // Debug: Log raw orders

        // Filter active subscriptions
        const activeOrders = fetchedOrders
          .filter((order) => {
            try {
              const paymentStatus = order.paymentStatus?.toLowerCase();
              const plan = order.plan?.toLowerCase();
              const isValidStatus = ["paid", "completed"].includes(paymentStatus);
              const isPremiumPlan = ["yearly_premium", "monthly_premium"].includes(plan);
              const isValidDate = order.createdAt && !isNaN(new Date(order.createdAt));
              let isActive = false;
              let validUntil = null;

              if (isValidDate) {
                validUntil = new Date(order.createdAt);
                const durationDays = plan === "yearly_premium" ? 365 : 30;
                validUntil.setDate(validUntil.getDate() + durationDays);
                isActive = validUntil.getTime() > new Date("2025-05-11T00:00:00Z").getTime();
              }

              console.log("Order filter check:", {
                orderId: order.orderId,
                email: order.email,
                paymentStatus,
                plan,
                createdAt: order.createdAt,
                validUntil: validUntil ? validUntil.toISOString() : null,
                currentDate: new Date().toISOString(),
                isValidStatus,
                isPremiumPlan,
                isValidDate,
                isActive,
              });

              return isValidStatus && isPremiumPlan && isValidDate && isActive;
            } catch (filterError) {
              console.error("Error filtering order:", order, filterError);
              return false; // Skip problematic orders
            }
          })
          .reverse();
        console.log("Filtered active orders:", activeOrders);

        setOrders(activeOrders);
        setPagination(
          response.data.data.pagination || {
            currentPage: page,
            totalPages: Math.ceil((response.data.data.totalOrders || 0) / ITEMS_PER_PAGE),
            totalOrders: response.data.data.totalOrders || 0,
            limit: ITEMS_PER_PAGE,
          }
        );
        console.log("Orders fetched:", activeOrders.length);
        if (activeOrders.length === 0) {
          setError("No active premium subscriptions found. Check API data or filter criteria.");
        } else {
          setError("");
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error.response?.data?.message || error.message, error);
      setError(`Failed to load orders: ${error.response?.data?.message || error.message}`);
      toast.error(`Failed to load orders: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.trim());
    setCurrentPage(1);
  };

  const getFilteredOrders = () => {
    if (!searchTerm) return orders;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return orders.filter((order) => order.email?.toLowerCase().includes(lowerSearchTerm));
  };

  const paginatedOrders = getFilteredOrders().slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = pagination.totalPages;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mx-4 md:mx-8 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center md:text-left">
              Active Premium Subscriptions
            </h2>
            <div className="flex border border-gray-300 rounded-md overflow-hidden w-full md:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by Email"
                className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
              />
              <button className="bg-[#071251] p-2 flex items-center justify-center">
                <FaSearch className="text-white" />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 text-center font-semibold shadow-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="px-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="mb-4 bg-white rounded-lg shadow-md p-4 md:hidden"
                >
                  <Skeleton height={20} count={6} className="mb-2" />
                </div>
              ))}
              <div className="hidden md:block overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subscription Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subscription Valid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Details
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="block md:hidden space-y-4">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => (
                      <div
                        key={order.orderId}
                        className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <strong className="text-gray-700">Email:</strong>{" "}
                            {order.email || "N/A"}
                          </div>
                          <div>
                            <strong className="text-gray-700">Subscription Plan:</strong>{" "}
                            {order.plan || "N/A"}
                          </div>
                          <div>
                            <strong className="text-gray-700">Payment Status:</strong>{" "}
                            <span className="text-green-600">
                              {order.paymentStatus || "N/A"}
                            </span>
                          </div>
                          <div>
                            <strong className="text-gray-700">Subscription Valid:</strong>{" "}
                            {order.createdAt
                              ? new Date(
                                  new Date(order.createdAt).setDate(
                                    new Date(order.createdAt).getDate() +
                                      (order.plan?.toLowerCase() === "yearly_premium" ? 365 : 30)
                                  )
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div>
                            <strong className="text-gray-700">Order Created:</strong>{" "}
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div className="mt-4">
                            <button
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 p-4">
                      No active premium subscriptions found.
                    </div>
                  )}
                </div>

                <table className="hidden md:table min-w-full divide-y divide-gray-200 rounded-lg shadow-md">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subscription Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subscription Valid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order, index) => (
                        <tr
                          key={order.orderId}
                          className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition duration-300`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {order.email || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.plan || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {order.paymentStatus || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                            {order.createdAt
                              ? new Date(
                                  new Date(order.createdAt).setDate(
                                    new Date(order.createdAt).getDate() +
                                      (order.plan?.toLowerCase() === "yearly_premium" ? 365 : 30)
                                  )
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="py-5 text-center text-gray-500 font-medium"
                        >
                          No active premium subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } transition duration-200`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    } transition duration-200`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPage === totalPages
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } transition duration-200`}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {selectedOrder && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 mx-4 md:mx-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Subscription Details for {selectedOrder.email || "N/A"}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm md:text-base">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="text-gray-700">Email:</strong>{" "}
                {selectedOrder.email || "N/A"}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="text-gray-700">Payment Status:</strong>{" "}
                <span className="text-green-600">
                  {selectedOrder.paymentStatus || "N/A"}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="text-gray-700">Subscription Plan:</strong>{" "}
                {selectedOrder.plan || "N/A"}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="text-gray-700">Valid Until:</strong>{" "}
                {selectedOrder.createdAt
                  ? new Date(
                      new Date(selectedOrder.createdAt).setDate(
                        new Date(selectedOrder.createdAt).getDate() +
                          (selectedOrder.plan?.toLowerCase() === "yearly_premium" ? 365 : 30)
                      )
                    ).toLocaleDateString()
                  : "N/A"}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="text-gray-700">Amount Paid:</strong> $
                {selectedOrder.amount?.toFixed(2) || "N/A"}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="text-gray-700">Currency:</strong>{" "}
                {(selectedOrder.currency || "N/A").toUpperCase()}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <strong className="text-gray-700">Payment Method:</strong>{" "}
                {selectedOrder.provider || "N/A"}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm break-words">
                <strong className="text-gray-700">Subscription ID:</strong>
                <span className="block mt-1 text-sm text-gray-700 break-all">
                  {selectedOrder.orderId || "N/A"}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm break-words">
                <strong className="text-gray-700">Session ID:</strong>
                <span className="block mt-1 text-sm text-gray-700 break-all">
                  {selectedOrder.sessionId || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ActiveSubscription;