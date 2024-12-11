import { useEffect, useState } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {   FaTrashAlt,
  FaTimes,
  FaBan,
  FaEdit,
  FaSearch,
  FaUser,
  FaEllipsisV,
  FaEnvelope,
  FaWrench,
  FaBell, } from 'react-icons/fa';
  import BanModal from "../../components/BanModal";
  import { useUserActions } from "../../contexts/UserActionContext";
  import DeleteModal from "../../components/DeleteModal";
  import EmailModal from "../../components/EmailModal";
  import NotificationModal from "../../components/NotificationModal";
  import EditModal from "../../components/EditModal";
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [totalUser, setTotalUser] = useState(0);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [dropdownOpen, setDropdownOpen] = useState(null);


  const { setSelectedUser, setShowBanModal,setShowDeleteModal,
    setShowEmailModal,setShowNotificationModal,setShowEditModal,setEditUser   } = useUserActions();
useEffect(() => {
  fetchUsers();
}, []);
const openBanModal = (user) => {
  setSelectedUser(user);
  setShowBanModal(true); // Show the ban modal
};
const openDeleteModal = (user) => {
  setSelectedUser(user);
  setShowDeleteModal(true); // Show the ban modal
};
const openEmailModal = (user) => {
  setSelectedUser(user);
  setShowEmailModal(true); // Show the ban modal
};
const openNotificationModal = (user) => {
  setSelectedUser(user);
  setShowNotificationModal(true); // Show the ban modal
};
const openEditModal = (user) => {
  setSelectedUser(user);
  setEditUser(user)
  setShowEditModal(true); // Show the ban modal
};

const toggleDropdown = (userId) => {
  console.log("Previous dropdownOpen:", dropdownOpen);
  setDropdownOpen((prev) => {
    const newState = prev === userId ? null : userId;
    console.log("New dropdownOpen:", newState);
    return newState;
  });
};
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      const response = await fetch('/api/user-list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setTotalUser(result.data)
      if (result.success && Array.isArray(result.data)) {
        const nonPremiumUsers = result.data.filter(
          (user) => user.verified && (!user.paymentStatus || user.paymentStatus !== "success")
        );
        setUsers(nonPremiumUsers);
      } else {
        setUsers([]);
      }
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <ToastContainer />
        <div className="bg-white pt-5 pb-5 rounded">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">Verified Non-Premium Users</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div className="flex flex-col space-y-2">
              {Array.from({ length: usersPerPage }).map((_, index) => (
                <Skeleton key={index} height={40} className="w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg shadow-lg border border-gray-200">
              <thead>
                <tr className="bg-[#071251] text-white">
                  <th className="py-2 px-4 border-b">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllUsers}
                      checked={selectedUsers.length === users.length}
                      aria-label="Select all users"
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Profile Image</th>
                  <th className="py-2 px-4 border-b text-left">Payment Info</th>
                  <th className="py-2 px-4 border-b text-left">Subscription Plan</th>
                  <th className="py-2 px-4 border-b text-left">Subscription Valid</th>
                  <th className="py-2 px-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isExpired =
                    user.subscriptionValidUntil &&
                    new Date(user.subscriptionValidUntil) < new Date();
          
                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 transition duration-200"
                    >
                      <td className="py-2 px-4 border-b">
                        <input
                          type="checkbox"
                          onChange={() => handleSelectUser(user.email)}
                          checked={selectedUsers.includes(user.email)}
                          aria-label={`Select user ${user.email}`}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                      <td className="py-2 px-4 border-b">
                        {user.profileImage ? (
                          <img
                            src={`data:image/jpeg;base64,${user.profileImage}`}
                            alt={`Profile of ${user.email}`}
                            className="w-12 h-12 rounded-full object-cover shadow-md mx-auto"
                          />
                        ) : (
                          <span className="text-gray-500 italic">No Image</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b">{user.paymentStatus || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{user.subscriptionPlan || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">
                        {user.subscriptionValidUntil ? (
                          <span
                            className={`${
                              isExpired
                                ? 'text-red-500 font-semibold'
                                : 'text-gray-700'
                            }`}
                          >
                            {isExpired
                              ? 'Expired'
                              : `${user.subscriptionValidUntil} (${calculateRemainingDays(
                                  user.subscriptionValidUntil
                                )} days left)`}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-2 px-4 relative">
                        <button
                          className="text-gray-700 hover:text-gray-900"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent parent events from triggering
                            toggleDropdown(user._id);
                          }}
                        >
                          <FaEllipsisV />
                        </button>

                        {dropdownOpen === user._id && (
                          <div
                            className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50 elapsis-menu"
                            onClick={(e) => e.stopPropagation()} // Prevent dropdown close on button click
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
                  );
                })}
              </tbody>
            </table>
          </div>
          
          )}
          {/* Pagination controls */}

          <div className="flex justify-between items-center mt-4 ps-4 pe-4">
<div className="text-xs">
  <span>
    Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
    {Math.min(currentPage * usersPerPage, users.length)} of {users.length} user
  </span>
</div>
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className={`bg-gray-300 px-4 py-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentPage === 1}
            >
              «
            </button>
            {[...Array(totalPages).keys()].map((number) => (
              <button
                key={number}
                className={`px-3 py-1 rounded ${currentPage === number + 1 ? 'bg-red-500 text-white' : ''}`}
                onClick={() => handlePageChange(number + 1)}
              >
                {number + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className={`bg-gray-300 px-4 py-2 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Modal for sending email */}
     {/*  User Modal */}
     <EditModal/>
            <BanModal  />
            <DeleteModal/>
            <EmailModal/>
            <NotificationModal/>
    </Layout>
  );
};

const calculateRemainingDays = (targetDate) => {
  const currentDate = new Date();
  const target = new Date(targetDate);
  const timeDifference = target - currentDate;
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
};

export default Users;
