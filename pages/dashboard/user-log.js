import React, { useState, useEffect } from 'react';
import { FaExclamationCircle, FaSearch } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './layout';
import { formatDistanceToNow } from 'date-fns';

const UserLog = () => {
  const [logUsers, setlogUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchlogUsers();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, logUsers]);

  const fetchlogUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`/api/login`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch login users');

      const result = await response.json();
      setlogUsers(result.success && Array.isArray(result.data) ? result.data : []);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    if (term.trim() === '') {
      setFilteredUsers(logUsers);
    } else {
      const filtered = logUsers.filter((user) =>
        user.userName.toLowerCase().includes(term.toLowerCase()) ||
        user.ipAddress.includes(term)
      );
      setFilteredUsers(filtered);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className=" p-6 rounded-lg shadow-lg bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            User Login History
          </h2>
          <div className="flex justify-end mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by username or IP address..."
                className="py-2 pl-10 pr-4 w-72 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
            </div>
          </div>
          {error && (
            <div className="bg-red-100 text-red-600 p-4 rounded-md mb-4 flex items-center">
              <FaExclamationCircle className="mr-2" />
              <span>{error}</span>
            </div>
          )}
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-normal uppercase tracking-wider">
                      User
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-normal uppercase tracking-wider">
                      Login At
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-normal uppercase tracking-wider">
                      IP
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-normal uppercase tracking-wider">
                      Location (City | Country)
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-normal uppercase tracking-wider">
                      Browser | OS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="bg-white border-b transition duration-300 ease-in-out hover:bg-blue-50"
                      >
                        <td className="text-gray-900 font-medium py-3 px-4">
                          <div className="flex flex-col items-start">
                            <span className="font-normal">{user.userName}</span>
                            <span className="text-blue-600 text-sm">@{user.userName}</span>
                          </div>
                        </td>
                        <td className="text-gray-800 py-3 px-4">
                          {new Date(user.timestamp).toLocaleDateString()}{' '}
                          {new Date(user.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                          <br />
                          <span className="text-gray-500 text-sm">
                            {formatDistanceToNow(new Date(user.timestamp), { addSuffix: true })}
                          </span>
                        </td>
                        <td className="text-blue-600 font-normal py-3 px-4">
                          <a href={`http://ipinfo.io/${user.ipAddress}`} target="_blank" rel="noopener noreferrer">
                            {user.ipAddress}
                          </a>
                        </td>
                        <td className="text-gray-800 py-3 px-4">
                          <div className="flex flex-col">
                            <span>{user.city || 'Unknown'}, {user.country || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="text-gray-800 py-3 px-4">
                          <div className="flex flex-col items-start">
                            <span className="font-normal">{user.browser}</span>
                            <span className="text-gray-500">{user.os}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-5 text-center text-gray-500">
                        No log users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
          margin-top: 1.5rem;
          overflow: hidden;
        }

        thead {
          position: sticky;
          top: 0;
          z-index: 1;
        }

        td,
        th {
          padding: 1rem;
          word-break: break-word;
        }

        @media (max-width: 768px) {
          thead {
            display: none;
          }

          tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.5rem;
            background: #ffffff;
          }

          td {
            display: flex;
            justify-content: space-between;
            font-weight: 500;
            border-bottom: 1px solid #e2e8f0;
            padding: 0.75rem 1rem;
          }

          td::before {
            content: attr(data-label);
            flex: 0 0 50%;
            font-weight: bold;
            text-transform: uppercase;
            padding-right: 0.5rem;
            color: #4a5568;
          }

          td:last-child {
            border-bottom: none;
          }
        }

        tbody tr:hover {
          background-color: #edf2f7;
        }

        th {
          background: linear-gradient(to right, #3b82f6, #2563eb);
          color: white;
          padding: 1rem;
          font-size: 0.85rem;
          text-transform: uppercase;
          font-weight: 600;
        }
      `}</style>
    </Layout>
  );
};

export default UserLog;
