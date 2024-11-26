import React from 'react';
import { useUserActions } from '../contexts/UserActionContext';

const DeleteModal = () => {
  // কনটেক্সট থেকে প্রয়োজনীয় স্টেট এবং ফাংশনস
  const { showDeleteModal, selectedUser, deleteUser, closeAllModals } = useUserActions();

  if (!showDeleteModal) return null; // যদি মডাল না দেখাতে হয়

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Delete User</h2>
        
        {/* নিশ্চিতকরণ বার্তা */}
        <p className="mb-4">
          Are you sure you want to delete the user <span className="font-bold">{selectedUser?.username}</span>?
        </p>

        <div className="flex justify-end space-x-4">
          {/* Cancel Button */}
          <button 
            className="bg-gray-500 text-white px-4 py-2 rounded-md" 
            onClick={closeAllModals}
          >
            Cancel
          </button>

          {/* Delete Button */}
          <button 
            className="bg-red-500 text-white px-4 py-2 rounded-md" 
            onClick={deleteUser}
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
