import React from "react";
import { useUserActions } from "../contexts/UserActionContext";

const EditModal = () => {
  const {
    showEditModal,
    setShowEditModal,
    editUser,
    handleEditChange,
    handleProfileImageChange,
    handleUpdateUser, // Get handleUpdateUser from context
  } = useUserActions();

  if (!showEditModal) return null; // If modal is not shown, return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Edit User</h2>

        {/* Username */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={editUser?.username || ""}
            onChange={handleEditChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter username"
          />
        </div>
        {/* Email */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Email(Read only)
          </label>
          <input
            type="email"
            name="email"
            value={editUser?.email || ""}
            onChange={handleEditChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter email"
            readOnly
          />
        </div>
        {/* Role */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Role(Read only)
          </label>
          <input
            type="text"
            name="role"
            value={editUser?.role || ""}
            onChange={handleEditChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter email"
            readOnly
          />
        </div>

        {/* Profile Image */}
        <div className="mb-4">
          <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
            Profile Image
          </label>
          {editUser?.profileImage && (
            <div className="mb-2">
              <img
                src={editUser?.profileImage}
                alt="Current Profile"
                className="w-16 h-16 object-cover rounded-full mb-2"
              />
            </div>
          )}
          <input
            type="file"
            name="profileImage"
            onChange={handleProfileImageChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </button>

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={handleUpdateUser} // Update the user
          >
            Update User
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
