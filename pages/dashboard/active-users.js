import { useEffect, useState, useMemo } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEnvelope, FaTrashAlt, FaTimes, FaSearch } from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [pageGroup, setPageGroup] = useState(0);
  const pagesPerGroup = 5;

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
        headers: { 'Authorization': `Bearer ${token}` },
      });
  
      if (!response.ok) throw new Error('Failed to fetch users');
  
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const verifiedUsers = result.data.filter(user => user.verified);
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
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/user?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        setUsers(users.filter((user) => user._id !== id));
        toast.success('User deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };
  const handleSearch = (term) => {
    if (term.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(term.toLowerCase()) ||
          (user.paymentStatus && user.paymentStatus.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const calculateRemainingDays = (date) => {
    const today = new Date();
    const subscriptionDate = new Date(date);
    const differenceInTime = subscriptionDate - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays >= 0 ? differenceInDays : 0;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, subject: emailSubject, message: emailMessage }),
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

  const openEmailModal = (user = null) => {
    setSelectedUser(user ? user.email : null);
    setSendingAll(!user);
    setEmailSubject('Important Update');
    setEmailMessage('Dear User,\n\nWe have an important update for you.\n\nBest regards,\nYtTools');
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setEmailSubject('');
    setEmailMessage('');
    setShowEmailModal(false);
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map((user) => user.email));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (email) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(email)
        ? prevSelectedUsers.filter((userEmail) => userEmail !== email)
        : [...prevSelectedUsers, email]
    );
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
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
                placeholder="Search by email or payment status..."
                className="py-2 pl-10 pr-4 w-72 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
            </div>
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader size={50} color={"#123abc"} loading={loading} />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="pt-3 pb-3 px-4 border-b text-sm">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllUsers}
                      checked={selectedUsers.length === filteredUsers.length}
                    />
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
                  <tr
                    key={user._id}
                    className="hover:bg-gray-100 transition duration-200"
                  >
                    <td className="py-2 px-4 border-b">
                      <input
                        type="checkbox"
                        onChange={() => handleSelectUser(user.email)}
                        checked={selectedUsers.includes(user.email)}
                      />
                    </td>
                    <td className="py-2 px-4 border-b">{user.email}</td>
                    <td className="py-2 px-4 border-b">
                      {user.profileImage ? (
                        <img
                          src={
                            user.profileImage.startsWith('data:image')
                              ? user.profileImage
                              : `${user.profileImage}`
                          }
                          alt="Profile"
                          className="w-16 h-16 rounded-full mx-auto shadow"
                        />
                      ) : (
                        <span className="text-gray-500">No Image</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">{user.paymentStatus || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      {user.subscriptionPlan || 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {user.subscriptionValidUntil
                        ? `${user.subscriptionValidUntil} (${calculateRemainingDays(
                            user.subscriptionValidUntil
                          )} days left)`
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-4 text-center flex space-x-2">
                      {user.role !== 'admin' && (
                        <>
                          <button
                            className="text-red-500 p-2 rounded-full hover:text-red-600 transition duration-200"
                            onClick={() => handleDelete(user._id)}
                          >
                            <FaTrashAlt />
                          </button>
                          <button
                            className="text-green-500  p-2 rounded-full hover:text-green-600 transition duration-200"
                            onClick={() => openEmailModal(user)}
                          >
                            <FaEnvelope />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          )}

        {/* Pagination controls */}
<div className="flex justify-center items-center mt-6 space-x-2">
  {/* Previous Group Button */}
  <button
    onClick={handlePreviousGroup}
    className={`bg-gradient-to-r from-gray-300 to-gray-400 px-4 py-2 rounded-full ${
      pageGroup === 0 ? 'opacity-50 cursor-not-allowed' : ''
    }`}
    disabled={pageGroup === 0}
  >
    «
  </button>

  {/* Dynamic Pagination Numbers */}
  {paginationGroup.map((page) => (
    <button
      key={page}
      onClick={() => handlePageChange(page)}
      className={`px-4 py-2 rounded-full transition duration-200 ${
        currentPage === page
          ? 'bg-red-500 text-white font-bold shadow-md'
          : 'bg-gray-200 hover:bg-gray-300'
      }`}
    >
      {page}
    </button>
  ))}

  {/* Next Group Button */}
  <button
    onClick={handleNextGroup}
    className={`bg-gradient-to-r from-gray-300 to-gray-400 px-4 py-2 rounded-full ${
      (pageGroup + 1) * pagesPerGroup >= totalPages
        ? 'opacity-50 cursor-not-allowed'
        : ''
    }`}
    disabled={(pageGroup + 1) * pagesPerGroup >= totalPages}
  >
    »
  </button>
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
      {showEmailModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center w-100">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
            <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" onClick={closeEmailModal}>
              <FaTimes size={24} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Send Email</h2>
            <label>Your Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
              placeholder="Enter subject"
            />
            <label>Your Message</label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
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
                onClick={() => handleSendEmail(sendingAll ? selectedUsers : [selectedUser])}
                disabled={sendingEmail}
              >
                {sendingEmail ? <ClipLoader size={20} color={"#fff"} /> : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;
