import { useEffect, useState } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user');
      console.log(response);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      console.log(data);
      setUsers(data);
      console.log(users);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/user?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        setUsers(users.filter((user) => user._id !== id));
        toast.success('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error.message);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleUpdateRole = async (id, role) => {
    const action = role === 'moderator' ? 'make this user a moderator' : 'remove this user as a moderator';
    if (window.confirm(`Are you sure you want to ${action}?`)) {
      try {
        const response = await fetch(`/api/user?id=${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        fetchUsers(); // Refresh the user list after updating role
        toast.success('User role updated successfully!');
      } catch (error) {
        console.error('Error updating role:', error.message);
        toast.error('Failed to update role');
      }
    }
  };

  const handlePaymentInfoUpdate = async (id) => {
    if (!paymentInfo.trim()) {
      toast.error('Payment info cannot be empty');
      return;
    }

    if (window.confirm('Are you sure you want to update the payment info?')) {
      try {
        const response = await fetch(`/api/user?id=${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentInfo }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        fetchUsers(); // Refresh the user list after updating payment info
        toast.success('User payment info updated successfully!');
      } catch (error) {
        console.error('Error updating payment info:', error.message);
        toast.error('Failed to update payment info');
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <ToastContainer />
        <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">All Users</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {success && <div className="text-green-500 mb-4">{success}</div>}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader size={50} color={"#123abc"} loading={loading} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="py-2 px-4 border-b">Username</th>
                    <th className="py-2 px-4 border-b">Email</th>
                    <th className="py-2 px-4 border-b">Role</th>
                    <th className="py-2 px-4 border-b">Profile Image</th>
                    <th className="py-2 px-4 border-b">Payment Info</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">{user.username}</td>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                      <td className="py-2 px-4 border-b">{user.role}</td>
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
                      <td className="py-2 px-4 border-b">{user.paymentInfo || 'N/A'}</td>
                      <td className="py-2 px-4 border-b text-center">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                              onClick={() => handleDelete(user._id)}
                            >
                              Delete
                            </button>
                            {user.role === 'moderator' ? (
                              <button
                                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-200 ml-2"
                                onClick={() => handleUpdateRole(user._id, 'user')}
                              >
                                Remove Moderator
                              </button>
                            ) : (
                              <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 ml-2"
                                onClick={() => handleUpdateRole(user._id, 'moderator')}
                              >
                                Make Moderator
                              </button>
                            )}
                            <button
                              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200 ml-2"
                              onClick={() => {
                                setSelectedUser(user._id);
                                setPaymentInfo(user.paymentInfo || '');
                              }}
                            >
                              Update Payment Info
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
      </div>

      {/* Modal for updating payment info */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-xl font-semibold mb-4">Update Payment Info</h2>
            <input
              type="text"
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
              placeholder="Enter payment info"
            />
            <div className="flex justify-end space-x-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200"
                onClick={() => handlePaymentInfoUpdate(selectedUser)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;
