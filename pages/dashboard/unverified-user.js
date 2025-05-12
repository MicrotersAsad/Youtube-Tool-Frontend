// import { useEffect, useState, useMemo } from 'react';
// import Layout from './layout';
// import { ClipLoader } from 'react-spinners';
// import Skeleton from 'react-loading-skeleton';
// import 'react-loading-skeleton/dist/skeleton.css';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//   FaTrashAlt,
//   FaTimes,
//   FaBan,
//   FaEdit,
//   FaSearch,
//   FaUser,
//   FaEllipsisV,
//   FaEnvelope,
//   FaWrench,
//   FaBell,
// } from 'react-icons/fa';
// import BanModal from '../../components/BanModal';
// import { useUserActions } from '../../contexts/UserActionContext';
// import DeleteModal from '../../components/DeleteModal';
// import EmailModal from '../../components/EmailModal';
// import NotificationModal from '../../components/NotificationModal';
// import EditModal from '../../components/EditModal';

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [emailSubject, setEmailSubject] = useState('');
//   const [emailMessage, setEmailMessage] = useState('');
//   const [dropdownOpen, setDropdownOpen] = useState(null);

//   // Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const usersPerPage = 10;

//   const {
//     setSelectedUser,
//     setShowBanModal,
//     setShowDeleteModal,
//     setShowEmailModal,
//     setShowNotificationModal,
//     setShowEditModal,
//     setEditUser,
//   } = useUserActions();

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No token found');
//       }
//       const response = await fetch('/api/user-list', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch users');
//       }

//       const result = await response.json();

//       if (result.success && Array.isArray(result.data)) {
//         const unverifiedUsers = result.data.filter((user) => !user.verified);
//         setUsers(unverifiedUsers);
//       } else {
//         setUsers([]);
//       }
//       setLoading(false);
//     } catch (error) {
//       setError(error.message);
//       setLoading(false);
//     }
//   };

//   const openBanModal = (user) => {
//     setSelectedUser(user);
//     setShowBanModal(true);
//   };

//   const openDeleteModal = (user) => {
//     setSelectedUser(user);
//     setShowDeleteModal(true);
//   };

//   const openEmailModal = (user) => {
//     setSelectedUser(user);
//     setShowEmailModal(true);
//   };

//   const openNotificationModal = (user) => {
//     setSelectedUser(user);
//     setShowNotificationModal(true);
//   };

//   const openEditModal = (user) => {
//     setSelectedUser(user);
//     setEditUser(user);
//     setShowEditModal(true);
//   };

//   const toggleDropdown = (userId) => {
//     setDropdownOpen((prev) => (prev === userId ? null : userId));
//   };

//   const closeDeleteModal = () => {
//     setSelectedUser(null);
//     setShowDeleteModal(false);
//   };

//   const handleDeleteUser = async () => {
//     if (!selectedUser) return;

//     try {
//       const response = await fetch(`/api/user?id=${selectedUser._id}`, {
//         method: 'DELETE',
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to delete user');
//       }

//       setUsers((prevUsers) => prevUsers.filter((u) => u._id !== selectedUser._id));
//       toast.success('User deleted successfully!');
//     } catch (error) {
//       toast.error('Failed to delete user');
//     } finally {
//       closeDeleteModal();
//     }
//   };

//   const handleSendEmail = async (emails) => {
//     if (!emailSubject.trim() || !emailMessage.trim()) {
//       toast.error('Subject and message cannot be empty');
//       return;
//     }

//     try {
//       const response = await fetch('/api/send-email', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           emails,
//           subject: emailSubject,
//           message: emailMessage,
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(errorText);
//       }

//       toast.success('Email sent successfully!');
//       setShowEmailModal(false);
//     } catch (error) {
//       toast.error('Failed to send email');
//     }
//   };

//   const closeEmailModal = () => {
//     setEmailSubject('');
//     setEmailMessage('');
//     setShowEmailModal(false);
//   };

//   const handleSelectAllUsers = (e) => {
//     if (e.target.checked) {
//       setSelectedUsers(users.map((user) => user.email));
//     } else {
//       setSelectedUsers([]);
//     }
//   };

//   const handleSelectUser = (email) => {
//     setSelectedUsers((prevSelectedUsers) => {
//       if (prevSelectedUsers.includes(email)) {
//         return prevSelectedUsers.filter((userEmail) => userEmail !== email);
//       } else {
//         return [...prevSelectedUsers, email];
//       }
//     });
//   };

//   // Pagination Logic
//   const totalPages = Math.ceil(users.length / usersPerPage);
//   const paginatedUsers = useMemo(() => {
//     const start = (currentPage - 1) * usersPerPage;
//     const end = start + usersPerPage;
//     return users.slice(start, end);
//   }, [users, currentPage]);

//   const handlePageChange = (pageNumber) => {
//     if (pageNumber > 0 && pageNumber <= totalPages) {
//       setCurrentPage(pageNumber);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const maxPagesToShow = 5;
//   const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//   const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
//   const pageNumbers = useMemo(() => {
//     return Array.from(
//       { length: endPage - startPage + 1 },
//       (_, i) => startPage + i
//     );
//   }, [startPage, endPage]);

//   return (
//     <Layout>
//       <div className="min-h-screen bg-gray-100 p-4 md:p-8">
//         <ToastContainer />
//         <div className="bg-white pt-3 pb-3 rounded">
//           <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">
//             Unverified Users
//           </h2>
//           {error && <div className="text-red-500 mb-4">{error}</div>}
//           {loading ? (
//             <div className="flex justify-center items-center h-64">
//               <Skeleton count={10} height={40} className="mb-2 w-full" />
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full bg-white">
//                 <thead>
//                   <tr className="bg-[#071251] text-white">
//                     <th className="pt-3 pb-3 px-4 border-b text-sm">
//                       <input
//                         type="checkbox"
//                         onChange={handleSelectAllUsers}
//                         checked={selectedUsers.length === users.length}
//                       />
//                     </th>
//                     <th className="py-2 px-4 border-b text-sm">Email</th>
//                     <th className="py-2 px-4 border-b text-sm">Profile Image</th>
//                     <th className="py-2 px-4 border-b text-sm">Payment Info</th>
//                     <th className="py-2 px-4 border-b text-sm">Subscription Plan</th>
//                     <th className="py-2 px-4 border-b text-sm">Subscription Valid</th>
//                     <th className="py-2 px-4 border-b text-sm">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {paginatedUsers.map((user) => (
//                     <tr key={user._id} className="hover:bg-gray-100">
//                       <td className="py-2 px-4 border-b text-sm">
//                         <input
//                           type="checkbox"
//                           onChange={() => handleSelectUser(user.email)}
//                           checked={selectedUsers.includes(user.email)}
//                         />
//                       </td>
//                       <td className="py-2 px-4 border-b text-sm">{user.email}</td>
//                       <td className="py-2 px-4 border-b text-sm">
//                         {user.profileImage ? (
//                           <img
//                             src={`data:image/jpeg;base64,${user.profileImage}`}
//                             alt="Profile"
//                             className="w-16 h-16 rounded-full mx-auto"
//                           />
//                         ) : (
//                           <span className="text-gray-500">No Image</span>
//                         )}
//                       </td>
//                       <td className="py-2 px-4 border-b text-sm">
//                         {user.paymentStatus || 'N/A'}
//                       </td>
//                       <td className="py-2 px-4 border-b text-sm">
//                         {user.subscriptionPlan || 'N/A'}
//                       </td>
//                       <td className="py-2 px-4 border-b text-sm">
//                         {user.subscriptionValidUntil
//                           ? `${user.subscriptionValidUntil} (${calculateRemainingDays(
//                               user.subscriptionValidUntil
//                             )} days left)`
//                           : 'N/A'}
//                       </td>
//                       <td className="py-2 px-4 relative">
//                         <button
//                           className="text-gray-700 hover:text-gray-900"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             toggleDropdown(user._id);
//                           }}
//                         >
//                           <FaEllipsisV />
//                         </button>

//                         {dropdownOpen === user._id && (
//                           <div
//                             className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
//                             onClick={(e) => e.stopPropagation()}
//                           >
//                             <button
//                               className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 openEditModal(user);
//                               }}
//                             >
//                               <FaEdit className="mr-2 text-green-500" /> Edit
//                             </button>
//                             <button
//                               className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 openBanModal(user);
//                               }}
//                             >
//                               <FaBan className="mr-2 text-red-500" /> Ban
//                             </button>
//                             <button
//                               className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 openDeleteModal(user);
//                               }}
//                             >
//                               <FaTrashAlt className="mr-2 text-red-600" /> Delete
//                             </button>
//                             <button
//                               className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 openEmailModal(user);
//                               }}
//                             >
//                               <FaEnvelope className="mr-2 text-green-500" /> Email
//                             </button>
//                             <button
//                               className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left text-sm"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 openNotificationModal(user);
//                               }}
//                             >
//                               <FaBell className="mr-2 text-blue-500" /> Notification
//                             </button>
//                           </div>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//           {/* Pagination controls */}
//           <div className="flex justify-between items-center mt-4 ps-4 pe-4">
//             <div className="text-xs">
//               <span>
//                 Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
//                 {Math.min(currentPage * usersPerPage, users.length)} of{' '}
//                 {users.length} users
//               </span>
//             </div>
//             <div className="flex justify-center items-center space-x-2">
//               {/* Previous Button */}
//               <button
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 className={`px-4 py-2 rounded-md bg-gray-300 text-gray-700 ${
//                   currentPage === 1
//                     ? 'opacity-50 cursor-not-allowed'
//                     : 'hover:bg-gray-400'
//                 }`}
//                 disabled={currentPage === 1}
//               >
//                 «
//               </button>

//               {/* Page Numbers */}
//               {startPage > 1 && (
//                 <>
//                   <button
//                     onClick={() => handlePageChange(1)}
//                     className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
//                   >
//                     1
//                   </button>
//                   {startPage > 2 && <span className="px-3 py-1">...</span>}
//                 </>
//               )}

//               {pageNumbers.map((number) => (
//                 <button
//                   key={number}
//                   onClick={() => handlePageChange(number)}
//                   className={`px-3 py-1 rounded-md ${
//                     currentPage === number
//                       ? 'bg-[#071251] text-white'
//                       : 'bg-gray-100 hover:bg-gray-200'
//                   }`}
//                 >
//                   {number}
//                 </button>
//               ))}

//               {endPage < totalPages && (
//                 <>
//                   {endPage < totalPages - 1 && (
//                     <span className="px-3 py-1">...</span>
//                   )}
//                   <button
//                     onClick={() => handlePageChange(totalPages)}
//                     className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
//                   >
//                     {totalPages}
//                   </button>
//                 </>
//               )}

//               {/* Next Button */}
//               <button
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 className={`px-4 py-2 rounded-md bg-gray-300 text-gray-700 ${
//                   currentPage === totalPages
//                     ? 'opacity-50 cursor-not-allowed'
//                     : 'hover:bg-gray-400'
//                 }`}
//                 disabled={currentPage === totalPages}
//               >
//                 »
//               </button>
//             </div>
//           </div>
//         </div>
//         {selectedUsers.length > 0 && (
//           <div className="flex justify-center mt-4">
//             <button
//               className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
//               onClick={() => openEmailModal()}
//             >
//               Send Email to Selected Users
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       <EditModal />
//       <BanModal />
//       <DeleteModal />
//       <EmailModal />
//       <NotificationModal />
//     </Layout>
//   );
// };

// export default Users;