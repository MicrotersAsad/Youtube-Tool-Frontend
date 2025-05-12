import React, { useState, useEffect } from "react";
import { FaExclamationCircle, FaSearch } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./layout";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const BanUser = () => {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBannedUsers();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, bannedUsers]);

  const fetchBannedUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(`/api/ban-user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch banned users");

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
    if (term.trim() === "") {
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
          {/* Search Bar and Heading */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-0">
              Ban User List
            </h2>
            <div className="flex border border-gray-300 rounded-md overflow-hidden w-full md:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by Username or Email"
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
            <div className="px-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} height={50} className="mb-2 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-[#071251] text-white">
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
                <tbody className="text-sm">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user._id}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-gray-100 transition duration-300 ease-in-out`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                              />
                            ) : (
                              <span className="text-gray-500">No Image</span>
                            )}
                            <span>{user.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4 text-red-500 font-semibold">
                          {user.reason || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-blue-500 font-semibold">
                          {user.banDate ? new Date(user.banDate).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-800 font-medium">
                          {user.bannedBy || "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-5 text-center text-gray-500">
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
    </Layout>
  );
};

export default BanUser;