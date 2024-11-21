import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "./layout";

const EditProfile = () => {
  const { user } = useAuth(); // Get the logged-in user's information
  const router = useRouter();

  const [editUser, setEditUser] = useState({
    username: "",
    email: "",
    role: "",
    profileImage: "",
  });
  const [profileImage, setProfileImage] = useState(null); // For new profile image
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    // Fetch the current user details
    if (user) {
      setEditUser({
        username: user.username || "",
        email: user.email || "",
        role: user.role || "",
        profileImage: user.profileImage || "",
      });
    } 
  }, [user]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("userId", user._id);
      formData.append("username", editUser.username);
      formData.append("role", editUser.role);

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch(`/api/update-user`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Notify user of success
      toast.success("Profile updated successfully!");

      // Redirect or reload data
      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
          <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={editUser.username}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
                placeholder="Enter username"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email (Read Only)</label>
              <input
                type="email"
                name="email"
                value={editUser.email}
                readOnly
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm bg-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Role (Read Only)</label>
              <input
                type="text"
                name="role"
                value={editUser.role}
                readOnly
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
                placeholder="Enter role"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Profile Image</label>
              <input
                type="file"
                onChange={handleProfileImageChange}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
              />
              {editUser.profileImage && !profileImage && (
                <img
                  src={editUser.profileImage}
                  alt="Current Profile"
                  className="w-16 h-16 rounded-full mt-4"
                />
              )}
              {profileImage && (
                <img
                  src={URL.createObjectURL(profileImage)}
                  alt="New Profile Preview"
                  className="w-16 h-16 rounded-full mt-4"
                />
              )}
            </div>
            <div className="flex justify-end space-x-4 mt-6">
             
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                onClick={handleUpdateUser}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </Layout>
  );
};

export default EditProfile;
