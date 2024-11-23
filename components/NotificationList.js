import React, { useEffect, useState } from 'react';
import { firestore } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { FaSearch } from 'react-icons/fa';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || !user.role || !user._id) {
      console.error("User data is missing or incomplete:", user);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientUserId', '==', user.role === 'admin' ? 'admin' : user._id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(data);
        setFilteredNotifications(data); // Initialize filtered notifications
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDeleteNotification = async (id) => {
    try {
      await deleteDoc(doc(firestore, 'notifications', id));
      setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id));
      setFilteredNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error.message);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = notifications.filter(
      (notification) =>
        (notification.ticketId && notification.ticketId.toLowerCase().includes(term.toLowerCase())) ||
        (notification.message && notification.message.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredNotifications(filtered);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return <p>Loading notifications...</p>;
  }

  if (!filteredNotifications.length) {
    return <p>No notifications found.</p>;
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderNotificationLink = (notification) => {
    switch (notification.type) {
      case 'new_user_registration':
        return <Link href="/dashboard/users">{notification.message}</Link>;
      case 'ticket_created':
      case 'comment_added':
        // Correct URL generation
        return (
          <Link href={`/dashboard/tickets/${notification.ticketId}`}>
            {notification.message}
          </Link>
        );
      case 'general_announcement':
        return <Link href="/dashboard/announcements">{notification.message}</Link>;
      case 'payment_success':
        return <Link href="/dashboard/subscriptions">{notification.message}</Link>;
      default:
        return <span>{notification.message}</span>;
    }
  };
  

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center ms-4 mb-4 space-y-4 md:space-y-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left">
            All Notification
          </h2>

          <div className="flex border border-gray-300 rounded-md overflow-hidden md:me-5 w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="UserName"
              className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
            />
            <button className="bg-[#071251] p-2 flex items-center justify-center">
              <FaSearch className="text-white" />
            </button>
          </div>
        </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Ticket Id</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Date</th>
              {user.role === 'admin' && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedNotifications.map((notification) => (
              <tr key={notification.id} className="border-b">
                <td className="px-4 py-2">
                  {renderNotificationLink(notification)}
                </td>
                <td className="px-4 py-2">{notification.ticketId || 'N/A'}</td>
                <td className="px-4 py-2 capitalize">{notification.type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2">
                  {new Date(notification.createdAt.seconds * 1000).toLocaleString()}
                </td>
                {user.role === 'admin' && (
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex justify-center mt-6 space-x-2">
        <button
          className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NotificationList;
