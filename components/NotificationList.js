import React, { useEffect, useState } from 'react';
import { firestore } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
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
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <p>Loading notifications...</p>;
  }

  if (!notifications.length) {
    return <p>No notifications found.</p>;
  }

  const renderNotificationLink = (notification) => {
    switch (notification.type) {
      case 'new_user_registration':
        return <Link href="all-user">{notification.message}</Link>;
      case 'ticket_created':
        return <Link href={`/tickets/${notification.ticketId}`}>{notification.message}</Link>;
      case 'comment_added':
        return <Link href={`/tickets/${notification.ticketId}`}>{notification.message}</Link>;
      case 'general_announcement':
        return <Link href="/announcements">{notification.message}</Link>;
      default:
        return <span>{notification.message}</span>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-center mb-6">Notifications</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr key={notification.id} className="border-b">
                <td className="px-4 py-2">
                  {renderNotificationLink(notification)}
                </td>
                <td className="px-4 py-2 capitalize">{notification.type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2">
                  {new Date(notification.createdAt.seconds * 1000).toLocaleString()}
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
