import React, { useState } from 'react';
import { useUserActions } from '../contexts/UserActionContext';

const EmailModal = () => {
    // কনটেক্সট থেকে প্রয়োজনীয় স্টেট এবং ফাংশন নিন
    const {
        showEmailModal,
        sendEmail,
        emailSubject,
        setEmailSubject,
        emailMessage,
        setEmailMessage,
        closeAllModals,
    } = useUserActions();

    // যদি মডাল বন্ধ থাকে তবে কিছুই রেন্ডার করা হবে না
    if (!showEmailModal) return null;

    // ইমেইল পাঠানোর জন্য ফর্ম সাবমিট হ্যান্ডলারের ফাংশন
    const handleSendEmail = () => {
        sendEmail(); // ইমেইল পাঠানোর ফাংশন কল করা
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Send Email</h2>

                {/* ইমেইল সাবজেক্ট ইনপুট */}
                <div className="mb-4">
                    <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                        id="emailSubject"
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)} // সাবজেক্ট আপডেট করা
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Enter email subject"
                    />
                </div>

                {/* ইমেইল মেসেজ ইনপুট */}
                <div className="mb-4">
                    <label htmlFor="emailMessage" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                        id="emailMessage"
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)} // মেসেজ আপডেট করা
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="4"
                        placeholder="Enter your message here"
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

                    {/* Send Email বাটন */}
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md"
                        onClick={handleSendEmail} // ইমেইল পাঠানো
                    >
                        Send Email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailModal;
