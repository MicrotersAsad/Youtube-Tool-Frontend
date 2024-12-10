import { useEffect, useState } from "react";
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
  const [totalUser, setTotalUser] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");

  const usersPerPage = 20;
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
    setFilteredUsers(users.reverse()); // reverse order
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
      
      setTotalUser(result.data)
      const fetchedUsers =
        result.success && Array.isArray(result.data) ? result.data : [];
      setUsers(fetchedUsers.reverse()); //reverse system
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

 

  const handleSearch = (term) => {
    if (term.trim() === "") {
      setFilteredUsers(users.reverse()); // সার্চ ছাড়া পুরো লিস্ট রিভার্স
    } else {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(term.toLowerCase()) ||
          user.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered.reverse()); // সার্চ রেজাল্ট রিভার্স
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };



  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <Layout>
      <div className="min-h-screen">
        <ToastContainer />
        <div className="pt-3 pb-3">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
            {/* Left side heading */}
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left ps-5">
              All Users
            </h2>

            {/* Right side search bar */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden w-full md:w-64">
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

          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div className="flex flex-col space-y-2">
              {Array.from({ length: usersPerPage }).map((_, index) => (
                <Skeleton key={index} height={40} className="mb-2 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white overflow-hidden rounded">
                <thead className="bg-[#071251] text-white ">
                  <tr>
                    <th className="pt-3 pb-3 px-4  text-left text-xs font-bold uppercase tracking-wide">
                      User
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-bold uppercase tracking-wide">
                      Email
                    </th>
                    <th className="py-2 px-4 border-b text-sm">Status</th>
                    <th className="py-2 px-4 border-b text-sm">Payment Info</th>
                    <th className="py-2 px-4 border-b text-sm">Subscription Plan</th>
                    <th className="py-2 px-4 border-b text-sm">Subscription Valid</th>
                    <th className="py-2 px-3 text-left text-xs font-bold uppercase tracking-wide">
                      Join Date
                    </th>
                    <th className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition duration-200 border-b last:border-0"
                    >
                      <td className="py-2 px-3 flex items-center space-x-2 text-sm">
                        <div>
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt="Profile"
                              className="w-6 h-6 rounded-full shadow-sm"
                            />
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-300 text-xs text-gray-500">
                              N/A
                            </div>
                          )}
                        </div>
                        <span className="text-gray-800 font-medium">
                          {user.username}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-600 truncate">
                        {user.email}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
  {user?.verified ? (
    <span className="text-green-500 font-semibold text-sm">Success</span>
  ) : (
    <span className="text-red-500 font-semibold text-sm">False</span>
  )}
</td>

                      <td className="py-2 px-4 border-b">{user?.paymentStatus|| 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{user?.subscriptionPlan|| 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{user?.subscriptionValidUntil|| 'N/A'}</td>
                      <td className="py-2 px-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
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
<div className="flex justify-between items-center mt-4">
<div className="text-xs">
  <span>
    Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
    {Math.min(currentPage * usersPerPage, totalUser.length)} of {totalUser.length} user
  </span>
</div>
          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-6 space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className={`bg-gray-300 px-4 py-2 rounded-md ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={currentPage === 1}
            >
              «
            </button>

            {/* Dynamic Pagination Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
              const startPage = Math.max(1, currentPage - 2); // Ensure at least page 1
              const pageNumber = startPage + index;

              if (pageNumber > totalPages) return null; // Avoid numbers greater than total pages

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNumber
                      ? "bg-red-500 text-white font-bold"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Ellipsis for More Pages */}
            {currentPage + 2 < totalPages && (
              <button
                onClick={() => setCurrentPage(currentPage + 5)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                ...
              </button>
            )}

            {/* Next Button */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className={`bg-gray-300 px-4 py-2 rounded-md ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
          </div>

          {/* Ban User Modal */}
              <EditModal/>
            <BanModal  />
            <DeleteModal/>
            <EmailModal/>
            <NotificationModal/>

        
         

        </div>
      </div>
    </Layout>
  );
};

export default AllUsers;
