import React, { useState, useEffect, useRef } from "react";
import Layout from "./layout";
import { FaTimes, FaDownload, FaEnvelope, FaSearch } from "react-icons/fa";
import Skeleton from "react-loading-skeleton"; // Skeleton for loading states
import "react-loading-skeleton/dist/skeleton.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ITEMS_PER_PAGE = 10;

const ExpiredSubs = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch("/api/user-list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const expiredOrders = result.data.filter((user) => {
          return (
            user?.paymentStatus === "success" &&
            new Date(user.subscriptionValidUntil) <= new Date()
          );
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSendEmail = async (email) => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Subject and message cannot be empty");
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      toast.success("Email sent successfully!");
      setShowEmailModal(false);
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const openEmailModal = (user) => {
    setSelectedOrder(user);
    setEmailSubject("Important Update");
    setEmailMessage(
      "Dear User,\n\nWe have an important update for you regarding your expired subscription.\n\nBest regards,\nYtTools"
    );
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setEmailSubject("");
    setEmailMessage("");
    setShowEmailModal(false);
  };

  const getFilteredOrders = () => {
    if (!searchTerm) return orders;
    return orders.filter(
      (order) =>
        order.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const paginatedOrders = getFilteredOrders().slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(getFilteredOrders().length / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white pt-5 pb-5">
          <div className="flex flex-col md:flex-row justify-between items-center ms-4 mb-4 space-y-4 md:space-y-0">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left">
              Expired Subscription
            </h2>

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
                          <strong>Payment Status:</strong>{" "}
                          <span className="text-green-600">
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="mb-2">
                          <strong>Subscription Valid:</strong>{" "}
                          {new Date(
                            order.subscriptionValidUntil
                          ).toLocaleDateString()}
                        </div>
                        <div className="mt-4">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 shadow-xs"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Details
                          </button>
                          <button
                            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition duration-200 text-xs font-semibold shadow flex items-center"
                            onClick={() => openEmailModal(order)}
                          >
                            <FaEnvelope className="mr-2" /> Email
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">
                      No successful orders found.
                    </div>
                  )}
                </div>

                <table className="hidden md:table w-full bg-gray-50 rounded-lg overflow-hidden">
                  <thead className="bg-[#071251] text-white">
                    <tr>
                      <th className="pt-3 pb-3 px-4 text-left text-xs font-semibold">
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
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order) => (
                        <tr
                          key={order._id}
                          className="border-b bg-white hover:bg-blue-50 transition duration-300"
                        >
                          <td className="py-2 px-5 text-gray-700 font-medium">
                            {order.username}
                          </td>
                          <td className="py-2 px-5 text-gray-600">
                            {order.email}
                          </td>
                          <td className="py-2 px-5 text-green-600 font-semibold">
                            {order.paymentStatus}
                          </td>
                          <td className="py-2 px-5 text-blue-600">
                            {new Date(
                              order.subscriptionValidUntil
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-5 flex space-x-3">
                            <button
                              className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition duration-200 shadow-xs"
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </button>
                            <button
                              className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition duration-200 text-xs font-semibold shadow flex items-center"
                              onClick={() => openEmailModal(order)}
                            >
                              <FaEnvelope className="mr-2" /> Email
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

              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
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
                        ? "bg-blue-500 text-white font-bold"
                        : "bg-gray-200 hover:bg-gray-300"
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
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
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
                <strong>Payment Status:</strong>{" "}
                <span className="text-green-600">
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <strong>Subscription Plan:</strong>{" "}
                {selectedOrder.subscriptionPlan}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                <strong>Valid Until:</strong>{" "}
                {new Date(
                  selectedOrder.subscriptionValidUntil
                ).toLocaleDateString()}
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
                    <strong>Currency:</strong>{" "}
                    {selectedOrder.paymentDetails.currency}
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                    <strong>Payment Method:</strong>{" "}
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

        {showEmailModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={closeEmailModal}
              >
                <FaTimes size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-4">Send Email</h2>
              <label>Your Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-xs mb-4"
                placeholder="Enter subject"
              />
              <label>Your Message</label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-xs mb-4"
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
                  {sendingEmail ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExpiredSubs;
