import { useEffect, useState, useMemo } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {  FaTrashAlt,
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
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [pageGroup, setPageGroup] = useState(0);
  const pagesPerGroup = 5;
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
      
      if (result.success && Array.isArray(result.data)) {
        const unverifiedUsers = result.data.filter(user => !user.verified);
        setUsers(unverifiedUsers);
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

  const paginationGroup = useMemo(() => {
    const start = pageGroup * pagesPerGroup;
    return Array.from({ length: pagesPerGroup }, (_, i) => start + i + 1).filter(page => page <= totalPages);
  }, [pageGroup, totalPages]);

  const handleNextGroup = () => {
    if ((pageGroup + 1) * pagesPerGroup < totalPages) {
      setPageGroup(pageGroup + 1);
    }
  };

  const handlePreviousGroup = () => {
    if (pageGroup > 0) {
      setPageGroup(pageGroup - 1);
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // const handleDelete = async (id) => {
  //   if (window.confirm('Are you sure you want to delete this user?')) {
  //     try {
  //       const token = localStorage.getItem('token');
  //       const response = await fetch(`/api/user?id=${id}`, {
  //         method: 'DELETE',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //         },
  //       });

  //       if (!response.ok) {
  //         const errorText = await response.text();
  //         throw new Error(errorText);
  //       }

  //       setUsers(users.filter((user) => user._id !== id));
  //       toast.success('User deleted successfully!');
  //     } catch (error) {
  //       toast.error('Failed to delete user');
  //     }
  //   }
  // };
    // Handle delete modal actions
   
    const closeDeleteModal = () => {
      setSelectedUser(null);
      setShowDeleteModal(false);
    };
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/user?id=${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== selectedUser._id));
      toast.success('User deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      closeDeleteModal();
    }
  };

  const handleSendEmail = async (emails) => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error('Subject and message cannot be empty');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast.success('Email sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

 

  const closeEmailModal = () => {
    setEmailSubject('');
    setEmailMessage('');
    setShowEmailModal(false);
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
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <ToastContainer />
        <div className="bg-white pt-3 pb-3 rounded">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">Unverified Users</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Skeleton count={10} height={40} className="mb-2 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-[#071251] text-white">
                    <th className="pt-3 pb-3 px-4 border-b text-sm">
                      <input type="checkbox" onChange={handleSelectAllUsers} checked={selectedUsers.length === users.length} />
                    </th>
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
                    <tr key={user._id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b text-sm">
                        <input type="checkbox" onChange={() => handleSelectUser(user.email)} checked={selectedUsers.includes(user.email)} />
                      </td>
                      <td className="py-2 px-4 border-b text-sm">{user.email}</td>
                      <td className="py-2 px-4 border-b text-sm">
                        {user.profileImage ? (
                          <img
                            src={`data:image/jpeg;base64,${user.profileImage}`}
                            alt="Profile"
                            className="w-16 h-16 rounded-full mx-auto"
                          />
                        ) : (
                          <span className="text-gray-500">No Image</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b text-sm">{user.paymentStatus || 'N/A'}</td>
                      <td className="py-2 px-4 border-b text-sm">{user.subscriptionPlan || 'N/A'}</td>
                      <td className="py-2 px-4 border-b text-sm">
                        {user.subscriptionValidUntil
                          ? `${user.subscriptionValidUntil} (${calculateRemainingDays(user.subscriptionValidUntil)} days left)`
                          : 'N/A'}
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
                  ))}
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
        
 {/*  User Modal */}
 <EditModal/>
            <BanModal  />
            <DeleteModal/>
            <EmailModal/>
            <NotificationModal/>
    </Layout>
  );
};

export default Users;
