import { useEffect, useState, useMemo } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaSearch,
  FaTrashAlt,
  FaTimes,
  FaBan,
  FaEdit,
  FaEllipsisV,
  FaEnvelope,
  FaBell,
} from 'react-icons/fa';
import Image from 'next/image';
import BanModal from '../../components/BanModal';
import { useUserActions } from '../../contexts/UserActionContext';
import DeleteModal from '../../components/DeleteModal';
import EmailModal from '../../components/EmailModal';
import NotificationModal from '../../components/NotificationModal';
import EditModal from '../../components/EditModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch('/api/user-list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const verifiedUsers = result.data.filter((user) => user.verified);
        setUsers(verifiedUsers);
        setFilteredUsers(verifiedUsers);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
console.log(users);

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
    if (term.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(term.toLowerCase()) ||
          (user.paymentStatus &&
            user.paymentStatus.toLowerCase().includes(term.toLowerCase()))
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
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional: Scroll to top
    }
  };

  // Generate page numbers for display (show limited pages, e.g., 5 at a time)
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
      <div className="min-h-screen bg-gray-100">
        <ToastContainer />
        <div className="bg-white rounded pt-3 pb-3">
          <div className="flex justify-between items-center mb-4 pt-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 md:p-6">
              Active Users
            </h2>
            <div className="flex border border-gray-300 rounded-md overflow-hidden w-72 md:me-5">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by email or payment status..."
                className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
              />
              <button className="bg-[#071251] p-3 flex items-center justify-center">
                <FaSearch className="text-white" />
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader size={50} color={'#123abc'} loading={loading} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
                <thead className="bg-[#071251] text-white">
                  <tr>
                    <th className="py-2 px-4 border-b text-sm">Email</th>
                    <th className="py-2 px-4 border-b text-sm">Profile Image</th>
                    <th className="py-2 px-4 border-b text-sm">Payment Info</th>
                    <th className="py-2 px-4 border-b text-sm">Subscription Plan</th>
                    <th className="py-2 px-4 border-b text-sm">Subscription Valid</th>
                    <th className="py-2 px-4 border-b text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-100 transition duration-200"
                    >
                      <td className="py-2 px-4 border-b">{user?.email}</td>
                      <td className="py-2 px-4 border-b">
                        {user.profileImage ? (
                          <img
                            src={user?.profileImage}
                            alt={`Profile of ${user.email}`}
                            className="w-12 h-12 rounded-full object-cover shadow-md mx-auto"
                          />
                        ) : (
                          <span className="text-gray-500 italic">No Image</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b">
  {user?.paymentDetails?.paymentStatus ? user?.paymentDetails?.paymentStatus : 'N/A'}
</td>
<td className="py-2 px-4 border-b">
{user?.paymentDetails?.subscriptionPlan ? user?.paymentDetails?.subscriptionPlan : 'N/A'}
</td>
<td className="py-2 px-4 border-b">
  {user?.paymentDetails?.subscriptionValidUntil ? new Date(user?.paymentDetails?.subscriptionValidUntil).toLocaleDateString() : 'N/A'}
</td>

                      <td className="py-2 px-4 relative">
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
                            className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(user);
                              }}
                            >
                              <FaEdit className="mr-2 text-green-500" /> Edit
                            </button>
                            <button
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openBanModal(user);
                              }}
                            >
                              <FaBan className="mr-2 text-red-500" /> Ban
                            </button>
                            <button
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(user);
                              }}
                            >
                              <FaTrashAlt className="mr-2 text-red-600" /> Delete
                            </button>
                            <button
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEmailModal(user);
                              }}
                            >
                              <FaEnvelope className="mr-2 text-green-500" /> Email
                            </button>
                            <button
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 ps-4 pe-4">
            <div className="text-xs">
              <span>
                Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
                {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </span>
            </div>
            <div className="flex justify-center items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className={`px-4 py-2 rounded-md bg-gray-300 text-gray-700 ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-400'
                }`}
                disabled={currentPage === 1}
              >
                «
              </button>

              {/* Page Numbers */}
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
                  >
                    1
                  </button>
                  {startPage > 2 && <span className="px-3 py-1">...</span>}
                </>
              )}

              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === number
                      ? 'bg-[#071251] text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {number}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="px-3 py-1">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className={`px-4 py-2 rounded-md bg-gray-300 text-gray-700 ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-400'
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

export default Users;