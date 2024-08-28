import { useEffect, useState } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEnvelope, FaTrashAlt, FaTimes } from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]); // Ensure users is initialized as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]); // Add this line
  const [paymentInfo, setPaymentInfo] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingAll, setSendingAll] = useState(false); // To differentiate between single and multiple email sends
  const [sendingEmail, setSendingEmail] = useState(false); // To track email sending status

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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
      console.log(result);
      if (result.success && Array.isArray(result.data)) {
        // Filter out only verified users
        const verifiedUsers = result.data.filter(user => user.verified);
        setUsers(verifiedUsers);
      } else {
        setUsers([]);
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

    setSendingEmail(true); // Start loading
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
      setSendingEmail(false); // End loading
    }
  };

  const openEmailModal = (user = null) => {
    if (user) {
      setSelectedUser(user.email);
      setSendingAll(false);
    } else {
      setSendingAll(true);
    }
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
        <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">All Users</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader size={50} color={"#123abc"} loading={loading} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="py-2 px-4 border-b">
                      <input type="checkbox" onChange={handleSelectAllUsers} checked={selectedUsers.length === users.length} />
                    </th>
                    <th className="py-2 px-4 border-b">Email</th>
                    <th className="py-2 px-4 border-b">Profile Image</th>
                    <th className="py-2 px-4 border-b">Payment Info</th>
                    <th className="py-2 px-4 border-b">Subscription Plan</th>
                    <th className="py-2 px-4 border-b">Subscription Valid</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">
                        <input type="checkbox" onChange={() => handleSelectUser(user.email)} checked={selectedUsers.includes(user.email)} />
                      </td>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                      <td className="py-2 px-4 border-b">
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
                      <td className="py-2 px-4 border-b">{user.paymentStatus || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{user.subscriptionPlan || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">
                        {user.subscriptionValidUntil
                          ? `${user.subscriptionValidUntil} (${calculateRemainingDays(user.subscriptionValidUntil)} days left)`
                          : 'N/A'}
                      </td>
                      <td className="py-2 px-4 mt-3 text-center d-flex">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                              onClick={() => handleDelete(user._id)}
                            >
                              <FaTrashAlt/>
                            </button>
                           
                            <button
                              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 ml-2"
                              onClick={() => openEmailModal(user)}
                            >
                             <FaEnvelope/>
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
                onClick={() => handleSendEmail(sendingAll ? selectedUsers : [selectedUser])} // Send to all selected users or single user based on the context
                disabled={sendingEmail} // Disable the button when sending email
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
