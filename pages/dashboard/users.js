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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
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
        console.log(`Deleting user with ID: ${id}`);
        const response = await fetch(`/api/user?id=${id}`, {
          method: 'DELETE',
        });

        console.log('Delete response status:', response.status);
        console.log('Delete response content-type:', response.headers.get('content-type'));

        if (response.status === 400 || response.status === 404) {
          const errorText = await response.text();
          console.error('Delete error:', errorText);
          throw new Error(errorText);
        }

        const data = await response.json();
        console.log('Delete response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete user');
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
        console.log(`Updating user with ID: ${id} to role: ${role}`);
        const response = await fetch(`/api/user?id=${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        });

        console.log('Update role response status:', response.status);
        console.log('Update role response content-type:', response.headers.get('content-type'));

        if (response.status === 400 || response.status === 404) {
          const errorText = await response.text();
          console.error('Update role error:', errorText);
          throw new Error(errorText);
        }

        const data = await response.json();
        console.log('Update role response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update role');
        }

        fetchUsers(); // Refresh the user list after updating role
        toast.success('User role updated successfully!');
      } catch (error) {
        console.error('Error updating role:', error.message);
        toast.error('Failed to update role');
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
    </Layout>
  );
};

export default Users;
