import { useEffect, useState, useMemo } from "react";
import Layout from "./layout";
import { ClipLoader } from "react-spinners";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaTrashAlt,
  FaTimes,
  FaBan,
  FaEdit,
  FaSearch,
  FaUser,
  FaEllipsisV,
  FaEnvelope,
  FaWrench,
  FaBell,
} from "react-icons/fa";
import EditModal from "../../components/EditModal";
import BanModal from "../../components/BanModal";
import DeleteModal from "../../components/DeleteModal";
import EmailModal from "../../components/EmailModal";
import NotificationModal from "../../components/NotificationModal";
import { useUserActions } from "../../contexts/UserActionContext";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const usersPerPage = 10;

  const {
    setSelectedUser,
    setShowBanModal,
    setShowDeleteModal,
    setShowEmailModal,
    setShowNotificationModal,
    setShowEditModal,
    setEditUser,
  } = useUserActions();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
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
        const premiumUsers = result.data.filter(
          (user) =>
            user?.paymentDetails?.paymentStatus === "paid" ||
            user?.paymentDetails?.paymentStatus === "completed"
        );
        setUsers(premiumUsers);
      } else {
        setUsers([]);
      }
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Utility function to calculate subscription validity date
  const calculateSubscriptionValidUntil = (paymentDetails, plan) => {
    console.log("Calculating for paymentDetails:", paymentDetails, "plan:", plan);
    if (!paymentDetails?.createdAt || !plan) {
      console.log("Returning N/A due to missing data");
      return "N/A";
    }

    let createdAt;
    try {
      createdAt = new Date(paymentDetails.createdAt);
      if (isNaN(createdAt.getTime())) {
        console.log("Invalid date format, attempting MM/DD/YYYY");
        const [month, day, year] = paymentDetails.createdAt.split("/");
        createdAt = new Date(`${year}-${month}-${day}`);
      }
    } catch (e) {
      console.log("Date parsing failed:", e);
      return "N/A";
    }

    if (isNaN(createdAt.getTime())) {
      console.log("Invalid date after parsing");
      return "N/A";
    }

    let validUntil;
    if (plan.toLowerCase().includes("yearly")) {
      validUntil = new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else if (plan.toLowerCase().includes("monthly")) {
      validUntil = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      console.log("Plan does not match yearly or monthly");
      return "N/A";
    }

    return validUntil;
  };

  // Utility function to check if subscription is nearing expiration (within 30 days)
  const isSubscriptionNearingExpiration = (validUntil) => {
    if (validUntil === "N/A") return false;
    const today = new Date();
    const diffInDays = (validUntil - today) / (1000 * 60 * 60 * 24);
    return diffInDays <= 30 && diffInDays >= 0;
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openEmailModal = (user) => {
    setSelectedUser(user);
    setShowEmailModal(true);
  };

  const openNotificationModal = (user) => {
    setSelectedUser(user);
    setShowNotificationModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser(user);
    setShowEditModal(true);
  };

  const toggleDropdown = (userId) => {
    console.log("Previous dropdownOpen:", dropdownOpen);
    setDropdownOpen((prev) => {
      const newState = prev === userId ? null : userId;
      console.log("New dropdownOpen:", newState);
      return newState;
    });
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((user) => user.email));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (email) => {
    setSelectedUsers((prevSelectedUsers) => {
      if (prevSelectedUsers.includes(email)) {
        return prevSelectedUsers.filter((userEmail) => userEmail !== email);
      } else {
        return [...prevSelectedUsers, email];
      }
    });
  };

  // Pagination Logic
  const totalPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    return users.slice(start, end);
  }, [users, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const maxPagesToShow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  const pageNumbers = useMemo(() => {
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [startPage, endPage]);

  const calculateRemainingDays = (validUntil) => {
    if (validUntil === "N/A") return 0;
    const currentDate = new Date();
    const target = new Date(validUntil);
    const timeDifference = target - currentDate;
    const days = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4">
        <ToastContainer />
        <div className="bg-white pt-5 pb-5 rounded-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">
            Premium Users
          </h2>
          {error && <div className="text-red-500 mb-4 px-4">{error}</div>}
          {loading ? (
            <div className="px-4">
              {Array.from({ length: usersPerPage }).map((_, index) => (
                <Skeleton key={index} height={40} className="mb-2 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-[#071251] text-white">
                    <th className="py-3 px-4 text-sm">
                      <input
                        type="checkbox"
                        onChange={handleSelectAllUsers}
                        checked={selectedUsers.length === users.length}
                        aria-label="Select all users"
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Email</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Profile Image</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Payment Info</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Subscription Plan</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Subscription Valid</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => {
                    const paymentDetails = user.paymentDetails || {};
                    const plan = user.paymentDetails?.subscriptionPlan || user.plan;
                    const validUntil = calculateSubscriptionValidUntil(paymentDetails, plan);
                    const remainingDays = calculateRemainingDays(validUntil);
                    const isNearingExpiration = isSubscriptionNearingExpiration(validUntil);
                    const isExpired = remainingDays === 0 && validUntil !== "N/A";

                    return (
                      <tr
                        key={user._id}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-gray-100 transition duration-200`}
                      >
                        <td className="py-3 px-4 text-sm">
                          <input
                            type="checkbox"
                            onChange={() => handleSelectUser(user.email)}
                            checked={selectedUsers.includes(user.email)}
                            aria-label={`Select user ${user.email}`}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={`Profile of ${user.email}`}
                              className="w-12 h-12 rounded-full object-cover shadow-md mx-auto"
                            />
                          ) : (
                            <span className="text-gray-500 italic">No Image</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              user?.paymentDetails?.paymentStatus === "paid" ||
                              user?.paymentDetails?.paymentStatus === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user?.paymentDetails?.paymentStatus || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              (user.paymentDetails?.subscriptionPlan || user.plan)?.toLowerCase().includes("yearly")
                                ? "bg-blue-100 text-blue-800"
                                : (user.paymentDetails?.subscriptionPlan || user.plan)?.toLowerCase().includes("monthly")
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.paymentDetails?.subscriptionPlan || user.plan || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`font-medium ${
                              isExpired
                                ? "text-red-500 font-semibold"
                                : isNearingExpiration
                                ? "text-yellow-600"
                                : "text-gray-700"
                            }`}
                          >
                            {validUntil === "N/A"
                              ? "N/A"
                              : isExpired
                              ? "Expired"
                              : `${validUntil.toLocaleDateString()} (${remainingDays} days left)`}
                          </span>
                        </td>
                        <td className="py-3 px-4 relative">
                          <button
                            className="text-gray-700 hover:text-gray-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(user._id);
                            }}
                          >
                            <FaEllipsisV />
                          </button>
                          {dropdownOpen === user._id && (
                            <div
                              className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 elapsis-menu"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(user);
                                }}
                              >
                                <FaEdit className="mr-2 text-green-500" /> Edit
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBanModal(user);
                                }}
                              >
                                <FaBan className="mr-2 text-red-500" /> Ban
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(user);
                                }}
                              >
                                <FaTrashAlt className="mr-2 text-red-600" /> Delete
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEmailModal(user);
                                }}
                              >
                                <FaEnvelope className="mr-2 text-green-500" /> Email
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openNotificationModal(user);
                                }}
                              >
                                <FaBell className="mr-2 text-blue-500" /> Notification
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-6 px-4">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
              {Math.min(currentPage * usersPerPage, users.length)} of {users.length}{" "}
              {users.length === 1 ? "user" : "users"}
            </div>
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className={`px-4 py-2 rounded-md bg-gray-200 text-gray-700 text-sm ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"
                }`}
                disabled={currentPage === 1}
              >
                «
              </button>
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                  >
                    1
                  </button>
                  {startPage > 2 && <span className="px-3 py-1 text-sm">...</span>}
                </>
              )}
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === number
                      ? "bg-[#071251] text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {number}
                </button>
              ))}
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && <span className="px-3 py-1 text-sm">...</span>}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className={`px-4 py-2 rounded-md bg-gray-200 text-gray-700 text-sm ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-300"
                }`}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        </div>
        {selectedUsers.length > 0 && (
          <div className="flex justify-center mt-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
              onClick={() => openEmailModal()}
            >
              Send Email to Selected Users
            </button>
          </div>
        )}
      </div>
      {/* User Modal */}
      <EditModal />
      <BanModal />
      <DeleteModal />
      <EmailModal />
      <NotificationModal />
    </Layout>
  );
};

const calculateRemainingDays = (validUntil) => {
  if (validUntil === "N/A") return 0;
  const currentDate = new Date();
  const target = new Date(validUntil);
  const timeDifference = target - currentDate;
  const days = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : 0;
};

export default Users;