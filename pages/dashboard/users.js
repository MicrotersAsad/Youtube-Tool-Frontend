import { useEffect, useState } from 'react';
import Layout from './layout';
import { ClipLoader } from 'react-spinners'; // Import ClipLoader from react-spinners

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
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
      setLoading(false); // Stop loading when data is fetched
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
      setLoading(false); // Stop loading on error
    }
  };

  const deleteUser = async (userId) => {
    console.log('Deleting user with ID:', userId);
    try {
      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      console.log('Response status:', response.status);
      const responseBody = await response.text();
      console.log('Response body:', responseBody);

      if (responseBody) {
        const data = JSON.parse(responseBody);
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete user');
        }

        setSuccess('User deleted successfully');
        fetchUsers(); // Refresh the user list
      } else {
        throw new Error('Empty response body');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6 text-center">All Users</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {success && <div className="text-green-500 mb-4">{success}</div>}
          {loading ? ( // Display loading spinner when data is being fetched
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
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                          onClick={() => deleteUser(user._id)}
                        >
                          Delete
                        </button>
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