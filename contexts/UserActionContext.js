import { createContext, useContext, useState } from "react";
import { toast } from "react-toastify";

const UserActionContext = createContext();

export const UserActionProvider = ({ children }) => {
  const [users, setUsers] = useState([]); // Ensure `users` is defined here
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Add this line
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // For updating user details
  const [editUser, setEditUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null); // Profile image state

  const fetchWrapper = async (url, options) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle user data changes in the edit form
  const handleEditChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  // Handle profile image change
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file); // Update profile image state
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    try {
      await fetchWrapper(`/api/user?id=${selectedUser._id}`, { method: "DELETE" });
      toast.success("User deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete user.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const banUser = async () => {
    if (!banReason.trim()) {
      toast.error("Please provide a reason for banning.");
      return;
    }
    try {
      await fetchWrapper(`/api/ban-user`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedUser._id, reason: banReason }),
      });
      toast.success("User banned successfully!");
    } catch (error) {
      toast.error("Failed to ban user.");
    } finally {
      setShowBanModal(false);
    }
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Subject and message cannot be empty.");
      return;
    }
    try {
      await fetchWrapper(`/api/send-email`, {
        method: "POST",
        body: JSON.stringify({
          emails: [selectedUser.email],
          subject: emailSubject,
          message: emailMessage,
        }),
      });
      toast.success("Email sent successfully!");
    } catch (error) {
      toast.error("Failed to send email.");
    } finally {
      setShowEmailModal(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    try {
      await fetchWrapper(`/api/send-notification`, {
        method: "POST",
        body: JSON.stringify({
          recipientUserId: selectedUser._id,
          message: notificationMessage,
          type: "notification",
        }),
      });
      toast.success("Notification sent successfully!");
    } catch (error) {
      toast.error("Failed to send notification.");
    } finally {
      setShowNotificationModal(false);
    }
  };

  // Update user function
  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("userId", editUser._id);
      formData.append("username", editUser.username);
      formData.append("role", editUser.role);
      formData.append("email", editUser.email);

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

      // Notify user about successful update
      await fetch(`/api/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUserId: editUser._id,
          type: "edit_user",
          message: `Your account details have been updated successfully.`,
        }),
      });

      // Update the user in the list after successful update
      const updatedUsers = users.map((user) =>
        user._id === editUser._id
          ? {
              ...editUser,
              profileImage: profileImage
                ? `/uploads/${profileImage.name}`
                : user.profileImage, // Update profile image if exists
            }
          : user
      );

      setUsers(updatedUsers); // Update the users state with the updated data
      setEditUser(null); // Reset editUser state after updating
      toast.success("User updated successfully and notified!");

    } catch (error) {
      toast.error("Failed to update user");
      console.error("Error updating user:", error);
    }
  };
  

  const closeAllModals = () => {
    setShowBanModal(false);
    setShowDeleteModal(false);
    setShowEmailModal(false);
    setShowNotificationModal(false);
    setShowEditModal(false); // Close the EditModal when resetting
    setSelectedUser(null);
    setEditUser(null); // Reset editUser
  };

  return (
    <UserActionContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
        showBanModal,
        setShowBanModal,
        showDeleteModal,
        setShowDeleteModal,
        showEmailModal,
        setShowEmailModal,
        showNotificationModal,
        setShowNotificationModal,
        showEditModal, // Expose the showEditModal state
        setShowEditModal, // Expose setShowEditModal function
        deleteUser,
        banUser,
        sendEmail,
        sendNotification,
        handleUpdateUser, // expose the handleUpdateUser function
        handleEditChange, // expose handleEditChange function
        handleProfileImageChange, // expose handleProfileImageChange function
        banReason,
        setBanReason,
        emailSubject,
        setEmailSubject,
        emailMessage,
        setEmailMessage,
        notificationMessage,
        setNotificationMessage,
        closeAllModals,
        loading,
        editUser,
        setEditUser, // expose setEditUser for user details update
        profileImage, // expose profileImage
      }}
    >
      {children}
    </UserActionContext.Provider>
  );
};

export const useUserActions = () => useContext(UserActionContext);
