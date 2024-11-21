import React, { useState, useEffect } from "react"; 
import Link from "next/link"; 
import { collection, query, orderBy, onSnapshot, writeBatch, doc, where } from "firebase/firestore"; 
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
      notificationQuery = query(notificationCollection, where("recipientUserId", "==", "admin"), orderBy("createdAt", "desc"));
    } else {
      notificationQuery = query(notificationCollection, where("recipientUserId", "==", user.id), orderBy("createdAt", "desc"));
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

      setNotifications((prev) => prev.map((n) => ({
        ...n,
        read: true,
      })));

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
 <button className="relative text-white" onClick={toggleNotificationDropdown}>
  <div className="relative">
    <FaBell
      className={`w-6 h-6 ${unreadCount > 0 ? "animate-ring" : ""}`}
    />
    {unreadCount > 0 && (
      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2">
        {unreadCount}
      </span>
    )}
  </div>
</button>



      {showNotificationDropdown && (
        <div className="notification-dropdown">
          <div className="header">
            <h4 className="title">Notifications</h4>
            <button onClick={markAllAsRead} className="mark-read-button">Mark all as read</button>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === "unread" ? "active" : ""}`}
              onClick={() => toggleTab("unread")}
            >
              Unread
            </button>
            <button
              className={`tab ${activeTab === "read" ? "active" : ""}`}
              onClick={() => toggleTab("read")}
            >
              Read
            </button>
          </div>

          <ul className="notifications-list">
            {notifications
              .filter((notification) => (activeTab === "unread" ? notification.read === false : notification.read === true))
              .slice(0, activeTab === "read" ? 3 : notifications.length)
              .map((notification) => (
                <li key={notification.id} className={`text-xs notification-item ${notification.read ? "read" : "unread"}`}>
                  {renderNotificationLink(notification)}
                  <p className="timestamp text-xs">
                    {notification.createdAt?.toDate
                      ? new Date(notification.createdAt.toDate()).toLocaleString()
                      : "Unknown date"}
                  </p>
                </li>
              ))}
            {activeTab === "read" && notifications.filter((n) => n.read).length > 2 && (
              <li className="view-all">
                <Link href="all-notification">
                  <span className="view-all-link">View all notifications</span>
                </Link>
              </li>
            )}
            {notifications.filter((n) => activeTab === "unread" ? n.read === false : n.read === true).length === 0 && (
              <li className="no-notifications">
                {activeTab === "unread" ? "No unread notifications" : "No read notifications"}
              </li>
            )}
          </ul>
        </div>
      )}
      
      <style jsx>{`
        .notification-dropdown {
          position: absolute;
          right: 0;
          width: 380px;
          background-color: white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          z-index: 10;
        }

        .header {
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f1f1;
        }

        .title {
          font-size: 18px;
          font-weight: 600;
        }

        .mark-read-button {
          font-size: 14px;
          color: #007bff;
          cursor: pointer;
          background-color: transparent;
          border: none;
        }

        .tabs {
          display: flex;
          justify-content: space-around;
          border-bottom: 2px solid #007bff;
        }

        .tab {
          padding: 10px;
          cursor: pointer;
          flex: 1;
          text-align: center;
          background-color: #f9f9f9;
          font-weight: 500;
        }

        .tab:hover {
          background-color: #e9e9e9;
        }

        .tab.active {
          background-color: #0f1e73;
          color: white;
          font-weight: 600;
        }

        .notifications-list {
          max-height: 300px;
          overflow-y: auto;
          margin: 10px;
        }

        .notification-item {
          padding: 10px;
          border-bottom: 1px solid #f1f1f1;
        }

        .notification-item.unread {
          background-color: #f0f8ff;
        }

        .notification-item.read {
          background-color: #f8f8f8;
          color: #777;
        }

        .timestamp {
          font-size: 12px;
          color: #777;
        }

        .view-all {
          text-align: center;
          padding: 10px;
        }

        .view-all-link {
          color: #007bff;
          text-decoration: underline;
        }

        .no-notifications {
          text-align: center;
          padding: 15px;
          color: #777;
        }
      `}</style>
    </div>
  );
};

export default Notifications;
