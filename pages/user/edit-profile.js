import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaUserAlt } from 'react-icons/fa';
import Image from 'next/image';

const UpdateProfileForm = ({ user }) => {
  const { updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    userId: user ? user._id : '',
    username: user ? user.username : '',
    email: user ? user.email : '',
    profileImage: user ? user.profileImage : '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        userId: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        profileImage: file,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formDataToSend = new FormData();
    formDataToSend.append('userId', formData.userId);
    formDataToSend.append('username', formData.username);
    formDataToSend.append('email', formData.email);
    if (formData.profileImage instanceof File) {
      formDataToSend.append('profileImage', formData.profileImage);
    }

    try {
      await updateUserProfile(formDataToSend);
      alert('Profile updated successfully');
      setMessage('Profile updated successfully');
    } catch (error) {
      console.log(error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="relative">
            {formData.profileImage ? (
              <Image
                src={formData.profileImage instanceof File ? URL.createObjectURL(formData.profileImage) : `data:image/jpeg;base64,${formData.profileImage}`}
                alt="Profile"
                className="w-24 h-24 rounded-full"
                width={96}
                height={96}
              />
            ) : (
              <span className="text-gray-500">No Image</span>
            )}
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <h2 className="text-xl font-semibold mt-4">{user.username}</h2>
          <p className="text-gray-600">@{user.username}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {message && <div className="text-green-500 mb-4">{message}</div>}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Your email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">User Name</label>
            <div className="relative">
              <FaUserAlt className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-200">
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfileForm;
