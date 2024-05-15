import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function EditProfile() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    profileImage: null,
  });
  const [previewImage, setPreviewImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      fetchUserProfile();
    }
  }, [isLoggedIn]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user-profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setFormData({
        username: data.username,
        email: data.email,
        role: data.role,
        profileImage: null, // Initial profile image as null
      });
      setPreviewImage(`data:image/jpeg;base64,${data.profileImage}`);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFormData((prevState) => ({
      ...prevState,
      profileImage: file,
    }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.username);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("role", formData.role);
    if (formData.profileImage) {
      formDataToSend.append("profileImage", formData.profileImage);
    }

    try {
      const response = await fetch('/api/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await response.json();
      setSuccess('Profile updated successfully');
      console.log(result);
    } catch (error) {
      console.error('Profile update failed:', error);
      setError(error.message || 'Profile update failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-600 mb-2">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600 mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-gray-600 mb-2">Role:</label>
            <input
              type="text"
              id="role"
              name="role"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.role}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="mb-4">
            <label htmlFor="profileImage" className="block text-gray-600 mb-2">Profile Image:</label>
            <input
              type="file"
              id="profileImage"
              name="profileImage"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              onChange={handleFileChange}
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full mt-4"
              />
            )}
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {success && <div className="text-green-500 mb-4">{success}</div>}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition duration-200"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
