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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Pagination logic with reverse
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers
    .slice()
    .reverse() // রিভার্স করে দেখানো হবে
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="pt-6 pb-6 rounded bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center ms-4 mb-4 space-y-4 md:space-y-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left">
          User Login History
          </h2>

          <div className="flex border border-gray-300 rounded-md overflow-hidden md:me-5 w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
               placeholder="Search by username or IP address..."
              className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
            />
            <button className="bg-[#071251] p-2 flex items-center justify-center">
              <FaSearch className="text-white" />
            </button>
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
            <div>
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
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user) => (
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
                            <a
                              href={`http://ipinfo.io/${user.ipAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {user.ipAddress}
                            </a>
                          </td>
                          <td className="text-gray-800 py-3 px-4">
                            <div className="flex flex-col">
                              <span>
                                {user.city || 'Unknown'}, {user.country || 'Unknown'}
                              </span>
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

              {/* Pagination Controls */}
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  disabled={currentPage === 1}
                >
                  « Prev
                </button>
                {(() => {
                  const pageNumbersToShow = 5; // একসাথে ৫টি পেজ দেখানোর জন্য
                  const startPage = Math.max(currentPage - Math.floor(pageNumbersToShow / 2), 1);
                  const endPage = Math.min(startPage + pageNumbersToShow - 1, totalPages);

                  const pageNumbers = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(i);
                  }

                  return pageNumbers.map((number) => (
                    <button
                      key={number}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === number
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => handlePageChange(number)}
                    >
                      {number}
                    </button>
                  ));
                })()}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  disabled={currentPage === totalPages}
                >
                  Next »
                </button>
              </div>
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
