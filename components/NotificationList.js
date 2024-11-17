import React, { useEffect, useState } from 'react';
import { firestore } from '../lib/firebase'; // Firestore ইম্পোর্ট করুন
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'; // মডুলার ফাংশনগুলো ইম্পোর্ট করুন

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // "notifications" কোলেকশনের রেফারেন্স তৈরি করুন
    const notificationsRef = collection(firestore, 'notifications');
    console.log(notificationsRef);
    
    // কুয়েরি তৈরি করে ডেটা সাজান
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));
    console.log();
    

    // Real-time ডেটা শোনার জন্য onSnapshot ব্যবহার করুন
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(updatedNotifications);
    });

    // Clean up listener
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <p>{notification.message}</p>
            <small>
              {new Date(notification.createdAt.seconds * 1000).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationList;
