import React, { useState, useEffect } from 'react';
import { FaExclamationCircle, FaSearch } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './layout';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const BanUser = () => {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBannedUsers();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, bannedUsers]);

  const fetchBannedUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`/api/ban-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch banned users');

      const result = await response.json();
      setBannedUsers(result.success && Array.isArray(result.data) ? result.data : []);
      setFilteredUsers(result.success && Array.isArray(result.data) ? result.data : []);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    if (term.trim() === '') {
      setFilteredUsers(bannedUsers);
    } else {
      const filtered = bannedUsers.filter(
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            Banned Users List
          </h2>
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

          {error && (
            <div className="bg-red-100 text-red-600 p-4 rounded-md mb-4 flex items-center">
              <FaExclamationCircle className="mr-2" />
              <span>{error}</span>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} height={50} className="mb-2 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                <thead className="bg-gradient-to-r from-red-500 to-red-700 text-white">
                  <tr>
                    
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">
                      User
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Email
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Reason for Ban
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Ban Date
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Banned By
                    </th>
                  </tr>
                </thead>
                <tbody className='text-sm'>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                      >
                        <td className=" whitespace-nowrap">
                          <span className='text-center'>
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                            />
                          ) : (
                            <span className="text-gray-500">No Image</span>
                          )}
                          </span>
                           {user.username}
                        </td>
                     
                        <td className=" text-gray-600">{user.email}</td>
                        <td className=" text-red-500 font-semibold">
                          {user.reason}
                        </td>
                        <td className=" text-blue-500 font-semibold">
                          {new Date(user.banDate).toLocaleDateString()}
                        </td>
                        <td className=" text-gray-800 font-medium">
                          {user.bannedBy}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-5 text-center text-gray-500">
                        No banned users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Styling for responsiveness */}
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

        td, th {
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
          background: linear-gradient(to right, #e53e3e, #b91c1c);
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

export default BanUser;
