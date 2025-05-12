import { useEffect, useState, useMemo, useRef } from "react";
import Layout from "./layout";
import { ClipLoader } from "react-spinners";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaTrashAlt,
  FaBan,
  FaEdit,
  FaSearch,
  FaUser,
  FaEllipsisV,
  FaEnvelope,
  FaBell,
} from "react-icons/fa";
import BanModal from "../../components/BanModal";
import { useUserActions } from "../../contexts/UserActionContext";
import DeleteModal from "../../components/DeleteModal";
import EmailModal from "../../components/EmailModal";
import NotificationModal from "../../components/NotificationModal";
import EditModal from "../../components/EditModal";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const usersPerPage = 20;
  const dropdownRef = useRef(null);

  const {
    setSelectedUser,
    setShowBanModal,
    setShowDeleteModal,
    setShowEmailModal,
    setShowNotificationModal,
    setShowEditModal,
    setEditUser,
  } = useUserActions();

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(`/api/user-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const result = await response.json();
      const fetchedUsers =
        result.success && Array.isArray(result.data) ? result.data : [];
      setUsers(fetchedUsers.reverse()); // Reverse order
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Utility function to calculate subscription validity date
  const calculateSubscriptionValidUntil = (paymentDetails, plan) => {
    console.log("Calculating for paymentDetails:", paymentDetails, "plan:", plan); // Debug log
    if (!paymentDetails?.createdAt || !plan) {
      console.log("Returning N/A due to missing data");
      return "N/A";
    }

    let createdAt;
    try {
      // Try parsing the createdAt as an ISO string or date
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
    setDropdownOpen((prev) => (prev === userId ? null : userId));
  };

  const handleSearch = (term) => {
    if (term.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(term.toLowerCase()) ||
          user.email?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Calculate total pages and paginated users
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Generate page numbers for display
  const maxPagesToShow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  const pageNumbers = useMemo(() => {
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [startPage, endPage]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4">
        <ToastContainer />
        <div className="bg-white rounded-lg shadow-lg pt-3 pb-3">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 pt-4 px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center md:text-left">
              All Users
            </h2>
            <div className="flex border border-gray-300 rounded-md overflow-hidden w-full md:w-64 mt-4 md:mt-0">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by username or email..."
                className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
              />
              <button className="bg-[#071251] p-2 flex items-center justify-center">
                <FaSearch className="text-white" />
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 mb-4 px-6">{error}</div>}
          {loading ? (
            <div className="px-6">
              {Array.from({ length: usersPerPage }).map((_, index) => (
                <Skeleton key={index} height={40} className="mb-2 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto px-6">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-[#071251] text-white">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold">User</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Email</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Payment Info</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Subscription Plan</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Subscription Valid</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Join Date</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => {
                    const validUntil = calculateSubscriptionValidUntil(
                      user?.paymentDetails,
                      user?.subscriptionPlan || user?.plan // Fallback to check both fields
                    );
                    const isNearingExpiration = isSubscriptionNearingExpiration(validUntil);

                    return (
                      <tr
                        key={user._id}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-gray-100 transition duration-200`}
                      >
                        <td className="py-3 px-4 text-sm flex items-center space-x-2">
                          <div>
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt="Profile"
                                className="w-8 h-8 rounded-full shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-xs text-gray-500">
                                N/A
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded">
                            {user.username || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium bg-blue-50 truncate">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              user?.verified
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user?.verified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              user?.paymentDetails?.paymentStatus === "paid"
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
                              (user?.subscriptionPlan || user?.plan)?.includes("yearly")
                                ? "bg-blue-100 text-blue-800"
                                : (user?.subscriptionPlan || user?.plan)?.includes("monthly")
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user?.subscriptionPlan || user?.plan || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`font-medium ${
                              isNearingExpiration ? "text-yellow-600" : "text-gray-700"
                            }`}
                          >
                            {validUntil === "N/A"
                              ? "N/A"
                              : validUntil.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 relative">
                          <button
                            aria-label="Open actions menu"
                            className="text-gray-600 hover:text-gray-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(user._id);
                            }}
                          >
                            <FaEllipsisV />
                          </button>
                          {dropdownOpen === user._id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
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

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-6 px-6">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
              {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </div>
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className={`px-4 py-2 rounded-md bg-gray-200 text-gray-700 text-sm ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-300"
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
                  {endPage < totalPages - 1 && (
                    <span className="px-3 py-1 text-sm">...</span>
                  )}
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

        {/* Modals */}
        <EditModal />
        <BanModal />
        <DeleteModal />
        <EmailModal />
        <NotificationModal />
      </div>
    </Layout>
  );
};

export default AllUsers;