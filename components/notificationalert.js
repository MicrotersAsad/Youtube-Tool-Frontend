import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
  where,
} from "firebase/firestore";
import { FaBell } from "react-icons/fa";
import { firestore } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";


const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("unread");

  useEffect(() => {
    if (!user) return;

    const notificationCollection = collection(firestore, "notifications");
    let notificationQuery;

    if (user.role === "admin" || user.role === "super_admin") {
      notificationQuery = query(
        notificationCollection,
        where("recipientUserId", "==", "admin"),
        orderBy("createdAt", "desc")
      );
    } else {
      notificationQuery = query(
        notificationCollection,
        where("recipientUserId", "==", user.id),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(fetchedNotifications);

      // Count unread notifications
      const unreadCount = fetchedNotifications.filter((n) => n.read === false).length;
      setUnreadCount(unreadCount);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown((prev) => !prev);
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => n.read === false);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(firestore);

      unreadNotifications.forEach((notification) => {
        const docRef = doc(firestore, "notifications", notification.id);
        batch.update(docRef, { read: true });
      });

      await batch.commit();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  const renderNotificationLink = (notification) => {
    switch (notification.type) {
      case "new_user_registration":
        return (
          <Link href="all-user">
            <span className="text-blue-600 hover:underline">{notification.message}</span>
          </Link>
        );
      case "ticket_created":
        return (
          <Link href={`tickets/${notification.ticketId}`}>
            <span className="text-blue-600 hover:underline">{notification.message}</span>
          </Link>
        );
      case "comment_added":
        return (
          <Link href={`tickets/${notification.ticketId}`}>
            <span className="text-blue-600 hover:underline">{notification.message}</span>
          </Link>
        );
      case "general_announcement":
        return (
          <Link href="spannnouncements">
            <span className="text-blue-600 hover:underline">{notification.message}</span>
          </Link>
        );
      case "payment_success":
        return (
          <Link href="payment_success">
            <span className="text-blue-600 hover:underline">{notification.message}</span>
          </Link>
        );
      default:
        return <span className="text-gray-800">{notification.message}</span>;
    }
  };

  return (
    <div className="relative">
      <button
        className="relative text-white"
        onClick={toggleNotificationDropdown}
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotificationDropdown && (
       <div className="absolute right-0 mt-2 w-[482px] bg-white shadow-lg rounded-lg z-10">
          <div className="p-4 flex justify-between items-center">
            <h4 className="text-lg font-bold">Notifications</h4>
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="flex justify-around border-b">
            <button
              className={`px-4 py-2 ${
                activeTab === "unread"
                  ? "border-b-2 border-blue-600 font-bold"
                  : "text-gray-600"
              }`}
              onClick={() => toggleTab("unread")}
            >
              Unread
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === "read"
                  ? "border-b-2 border-blue-600 font-bold"
                  : "text-gray-600"
              }`}
              onClick={() => toggleTab("read")}
            >
              Read
            </button>
          </div>

          <ul className="max-h-64 overflow-y-auto">
            {notifications
              .filter((notification) =>
                activeTab === "unread"
                  ? notification.read === false
                  : notification.read === true
              )
              .slice(0, activeTab === "read" ? 2 : notifications.length) // Limit to 4 for read
              .map((notification) => (
                <li
                  key={notification.id}
                  className={`p-4 text-xs border-b ${
                    notification.read ? "bg-gray-100" : "bg-blue-50"
                  }`}
                >
                  {renderNotificationLink(notification)}
                  <p className="text-gray-500 text-xs block">
                    {notification.createdAt?.toDate
                      ? new Date(notification.createdAt.toDate()).toLocaleString()
                      : "Unknown date"}
                  </p>
                </li>
              ))}
            {activeTab === "read" && notifications.filter((n) => n.read).length > 2 && (
              <li className="text-center">
                <Link href="all-notification">
                  <span className="text-blue-600 hover:underline">View all notifications</span>
                </Link>
              </li>
            )}
            {notifications.filter((n) =>
              activeTab === "unread" ? n.read === false : n.read === true
            ).length === 0 && (
              <li className="p-4 text-center text-gray-500">
                {activeTab === "unread"
                  ? "No unread notifications"
                  : "No read notifications"}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;
