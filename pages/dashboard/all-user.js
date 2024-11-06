
import { useEffect, useState } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTrashAlt, FaTimes, FaBan, FaEdit, FaSearch } from 'react-icons/fa';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [banReason, setBanReason] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setFilteredUsers(users);
    handleSearch(searchTerm);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`/api/user-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const result = await response.json();
      setUsers(result.success && Array.isArray(result.data) ? result.data : []);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    if (term.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(term.toLowerCase()) ||
          user.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error('Please provide a reason for banning the user.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ban-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser._id, reason: banReason }),
      });

      if (!response.ok) throw new Error(await response.text());

      // Update state after ban
      const updatedUsers = users.filter((user) => user._id !== selectedUser._id);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setShowBanModal(false);
      toast.success('User banned successfully!');
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setBanReason('');
    setShowBanModal(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setProfileImage(null);
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
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('userId', editUser._id);
      formData.append('username', editUser.username);
      formData.append('role', editUser.role);
      formData.append('email', editUser.email);

      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await fetch(`/api/update-user`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Update users state after editing user
      const updatedUsers = users.map((user) =>
        user._id === editUser._id
          ? { ...editUser, profileImage: profileImage ? `/uploads/${profileImage.name}` : editUser.profileImage }
          : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setEditUser(null);
      toast.success('User updated successfully!');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <ToastContainer />
        <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">All Users</h2>

          {/* Search Bar */}
          <div className="flex justify-end mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by username or email..."
                className="py-2 pl-10 pr-4 w-72 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
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
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b">User</th>
                    <th className="py-2 px-4 border-b">Email</th>
                    <th className="py-2 px-4 border-b">Join Date</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">
                        <div className="flex items-center">
                          <div>
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt="Profile"
                                className="w-8 h-8 rounded-full mx-auto"
                              />
                            ) : (
                              <span className="text-gray-500">No Image</span>
                            )}
                          </div>
                          <div className="ps-2">{user.username}</div>
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                      <td className="py-2 px-4 border-b">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-4 text-center">
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200 ml-2"
                          onClick={() => openBanModal(user)}
                        >
                          <FaBan />
                        </button>
                        <button
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 ml-2"
                          onClick={() => openEditModal(user)}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className={`bg-gray-300 px-4 py-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentPage === 1}
            >
              «
            </button>
            {[...Array(totalPages).keys()].map((number) => (
              <button
                key={number}
                className={`px-3 py-1 rounded ${currentPage === number + 1 ? 'bg-red-500 text-white' : ''}`}
                onClick={() => setCurrentPage(number + 1)}
              >
                {number + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className={`bg-gray-300 px-4 py-2 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>

          {/* Ban User Modal */}
          {showBanModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
                <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" onClick={() => setShowBanModal(false)}>
                  <FaTimes size={24} />
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
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200"
                    onClick={() => setShowBanModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
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
                <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" onClick={() => setEditUser(null)}>
                  <FaTimes size={24} />
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
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200"
                    onClick={() => setEditUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                    onClick={handleUpdateUser}
                  >
                    Update User
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
