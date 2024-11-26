import React from 'react';
import { useUserActions } from '../contexts/UserActionContext';

const NotificationModal = () => {
  // কনটেক্সট থেকে প্রয়োজনীয় স্টেট এবং ফাংশন গ্রহণ করা
  const {
    showNotificationModal,
    sendNotification,
    notificationMessage,
    setNotificationMessage,
    closeAllModals,
  } = useUserActions();

  // যদি মডাল শো না হয়, তবে কিছুই রেন্ডার হবে না
  if (!showNotificationModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Send Notification</h2>

        {/* নোটিফিকেশন মেসেজ ইনপুট */}
        <div className="mb-4">
          <label
            htmlFor="notificationMessage"
            className="block text-sm font-medium text-gray-700"
          >
            Message
          </label>
          <textarea
            id="notificationMessage"
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)} // মেসেজ আপডেট করা
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="4"
            placeholder="Enter your notification message here"
          />
        </div>

        {/* মডাল অ্যাকশন বাটন */}
        <div className="flex justify-end space-x-4">
          {/* Cancel বাটন */}
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
            onClick={closeAllModals} // মডাল বন্ধ করা
          >
            Cancel
          </button>

          {/* Send Notification বাটন */}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={sendNotification} // নোটিফিকেশন পাঠানো
          >
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
