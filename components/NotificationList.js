import React, { useEffect, useState } from 'react';
import { firestore } from '../lib/firebase'; // Firestore import
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'; // Firestore modular functions
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.role || !user._id) {
      console.error("User data is missing or incomplete:", user);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(firestore, 'notifications');
    let q;

 

    if (user.role === 'admin') {
      // Admin can see all notifications
      q = query(notificationsRef, orderBy('createdAt', 'desc'));
    } else {
      // User can see only their notifications
      q = query(
        notificationsRef,
        where('recipientUserId', '==', user._id), // Filter for user's notifications
        orderBy('createdAt', 'desc')
      );
    }

    // Fetch notifications from Firestore
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Fetched Notifications:", data);
        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener
  }, [user]);

  // Delete notification method
  const handleDelete = async (notificationId) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await deleteDoc(notificationRef); // Delete notification from Firestore
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId)); // Update state
      console.log(`Notification ${notificationId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting notification:", error.message);
    }
  };

  if (loading) {
    return <p>Loading notifications...</p>;
  }

  if (!notifications.length) {
    return <p>No notifications found.</p>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-center mb-6">Notifications</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Comments</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr key={notification.id} className="border-b">
                <td className="px-4 py-2">
                  <Link href={`tickets/${notification?.ticketId}`}>
                    {notification?.message}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {notification.comments && notification.comments.length > 0 ? (
                    notification.comments.map((comment, index) => (
                      <div key={index}>
                        <strong>{comment.userName}:</strong> {comment.message}
                        <br />
                        <small>
                          {new Date(
                            comment.createdAt.seconds * 1000
                          ).toLocaleString()}
                        </small>
                      </div>
                    ))
                  ) : (
                    <span>No comments available</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {new Date(notification.createdAt.seconds * 1000).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationList;
