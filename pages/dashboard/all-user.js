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
} from "react-icons/fa";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [banReason, setBanReason] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGeneralMessageModal, setShowGeneralMessageModal] = useState(false);
  const [generalMessage, setGeneralMessage] = useState("");
  const usersPerPage = 10;
  const [dropdownOpen, setDropdownOpen] = useState(null);
  useEffect(() => {
    fetchUsers();
  }, []);

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
      const fetchedUsers =
        result.success && Array.isArray(result.data) ? result.data : [];
      setUsers(fetchedUsers.reverse()); //reverse system
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSendMessageToUser = async () => {
    if (!generalMessage.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUserId: selectedUser._id, // Send message to the specific user
          type: "direct_message",
          message: generalMessage, // Message content
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      setShowGeneralMessageModal(false);
      setGeneralMessage("");
      toast.success(`Message sent to ${selectedUser.username} successfully!`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
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


  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error("Please provide a reason for banning the user.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/ban-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser._id, reason: banReason }),
      });

      if (!response.ok) throw new Error(await response.text());

      // Send notification to the banned user
      await fetch(`/api/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUserId: selectedUser._id,
          type: "ban_user",
          message: `You have been banned for the following reason: ${banReason}.`,
        }),
      });

      // Update state after ban
      const updatedUsers = users.filter(
        (user) => user._id !== selectedUser._id
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setShowBanModal(false);
      toast.success("User banned successfully and notified!");
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setBanReason("");
    setShowBanModal(true);
    setDropdownOpen(null); // Close dropdown
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setProfileImage(null);
    setDropdownOpen(null); // Close dropdown
  };

  const openSendMessageModal = (user) => {
    setSelectedUser(user);
    setGeneralMessage("");
    setShowGeneralMessageModal(true);
    setDropdownOpen(null); // Close dropdown
  };

  const handleEditChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("userId", editUser._id);
      formData.append("username", editUser.username);
      formData.append("role", editUser.role);
      formData.append("email", editUser.email);

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch(`/api/update-user`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Send notification to the edited user
      await fetch(`/api/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUserId: editUser._id,
          type: "edit_user",
          message: `Your account details have been updated successfully.`,
        }),
      });

      // Update users state after editing user
      const updatedUsers = users.map((user) =>
        user._id === editUser._id
          ? {
              ...editUser,
              profileImage: profileImage
                ? `/uploads/${profileImage.name}`
                : editUser.profileImage,
            }
          : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setEditUser(null);
      toast.success("User updated successfully and notified!");
    } catch (error) {
      toast.error("Failed to update user");
    }
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
                                e.stopPropagation(); // Ensure dropdown doesn't close
                                openEditModal(user);
                              }}
                            >
                              <FaEdit className="mr-2 text-sky-600" /> Edit
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
                                openSendMessageModal(user);
                              }}
                            >
                              <FaEnvelope className="mr-2 text-green-500" /> Send Message
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

          {/* Ban User Modal */}
          {showBanModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
                <button
                  className="absolute top-2 right-2"
                  onClick={() => setShowBanModal(false)}
                >
                  <FaTimes />
                </button>
                <h2 className="text-xl font-semibold mb-4">Ban User</h2>
                <label>Reason for Ban</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
                  placeholder="Enter reason"
                  rows="4"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    className="bg-[#071251] px-4 py-2 rounded-md hover:bg-green-600 text-white transition duration-200"
                    onClick={() => setShowBanModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-500 px-4 py-2 rounded-md hover:bg-red-600 text-white transition duration-200"
                    onClick={handleBanUser}
                  >
                    Ban User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Edit Modal */}
          {editUser && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
                <button
                  className="absolute top-2 right-2"
                  onClick={() => setEditUser(null)}
                >
                  <FaTimes />
                </button>
                <h2 className="text-xl font-semibold mb-4">Edit User</h2>
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editUser.username}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
                  placeholder="Enter username"
                />
                <label>Email</label>
                <input
                  type="text"
                  name="email"
                  value={editUser.email}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
                  placeholder="Enter email"
                />
                <label>Role</label>
                <input
                  type="text"
                  name="role"
                  value={editUser.role}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
                  placeholder="Enter role"
                />
                <label>Profile Image</label>
                <input
                  type="file"
                  name="profileImage"
                  onChange={handleProfileImageChange}
                  className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
                />
                {editUser.profileImage && !profileImage && (
                  <img
                    src={editUser.profileImage}
                    alt="Profile"
                    className="w-16 h-16 rounded-full mb-4"
                  />
                )}
                {profileImage && (
                  <img
                    src={URL.createObjectURL(profileImage)}
                    alt="Profile Preview"
                    className="w-16 h-16 rounded-full mb-4"
                  />
                )}
                <div className="flex justify-end space-x-4">
                  <button
                    className="bg-red-500  px-4 py-2 text-white rounded-md hover:bg-red-600 transition duration-200"
                    onClick={() => setEditUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-green-500 text-white  px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                    onClick={handleUpdateUser}
                  >
                    Update User
                  </button>
                </div>
              </div>
            </div>
          )}
          {showGeneralMessageModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
                <button
                  className="absolute top-2 right-2"
                  onClick={() => setShowGeneralMessageModal(false)}
                >
                  <FaTimes />
                </button>
                <h2 className="text-xl font-semibold mb-4">
                  Send Notification to {selectedUser?.username}
                </h2>
                <textarea
                  value={generalMessage}
                  onChange={(e) => setGeneralMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
                  placeholder="Enter your message here"
                  rows="4"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    className="bg-red-500 px-4 py-2 rounded-md hover:bg-red-600 text-white transition duration-200"
                    onClick={() => setShowGeneralMessageModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-500 px-4 py-2 text-white rounded-md hover:bg-blue-600 transition duration-200"
                    onClick={handleSendMessageToUser}
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllUsers;
