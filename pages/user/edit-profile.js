import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaEnvelope, FaUserAlt, FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaInfoCircle } from 'react-icons/fa';
import Image from 'next/image';
import axios from 'axios';
import Layout from '../dashboard/layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditProfile = () => {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    profileImage: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (id) {
      console.log(`Received user ID: ${id}`);
      fetchUserData(id);
    } else {
      console.log('No user ID received');
      setLoading(false); // Set loading to false if no ID is received
    }
  }, [id]);

  const fetchUserData = async (userId) => {
    try {
      console.log(`Fetching user data for ID: ${userId}`);
      const response = await axios.get(`/api/users?id=${userId}`);
      console.log('API response:', response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
      setLoading(false);
    }
  };

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
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });
    if (image) {
      formDataToSend.append('profileImage', image);
    }

    try {
      const response = await axios.put(`/api/users?id=${id}`, formDataToSend);
      if (response.status === 200) {
        toast.success('Profile updated successfully');
        router.push('/dashboard');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!id) {
    return <div>No user ID provided</div>;
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                {formData.profileImage ? (
                  <Image
                    src={image ? URL.createObjectURL(image) : formData.profileImage}
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
              <h2 className="text-xl font-semibold mt-4">{formData.username}</h2>
            </div>
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
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Bio</label>
              <div className="relative">
                <FaInfoCircle className="absolute left-3 top-3 text-gray-500" />
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">LinkedIn URL</label>
              <div className="relative">
                <FaLinkedin className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Twitter URL</label>
              <div className="relative">
                <FaTwitter className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Facebook URL</label>
              <div className="relative">
                <FaFacebook className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Instagram URL</label>
              <div className="relative">
                <FaInstagram className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
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
      <ToastContainer />
    </Layout>
  );
};

export default EditProfile;
