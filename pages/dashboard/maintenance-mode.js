import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Layout from './layout';
import { FaCloudUploadAlt } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// Dynamically import the QuillWrapper component with SSR disabled
const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

const MaintenanceMode = () => {
  const [status, setStatus] = useState('disabled');
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [description, setDescription] = useState(''); // Ensure description is initialized to an empty string
  const [loading, setLoading] = useState(false);
  const [quillContent, setQuillContent] = useState(''); // Ensure quillContent is initialized to an empty string

  // Fetch existing maintenance data
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        const response = await fetch('/api/maintenance');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStatus(data.status || 'disabled');
            setDescription(String(data.description || '')); // Ensure description is a string
            setQuillContent(String(data.description || '')); // Ensure quillContent is a string
            if (data.imageUrl) {
              setPreviewImage(data.imageUrl);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
      }
    };

    fetchMaintenanceData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleStatusToggle = () => {
    setStatus((prevStatus) => (prevStatus === 'enabled' ? 'disabled' : 'enabled'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('status', status);
    formData.append('description', quillContent);
    if (image) formData.append('image', image);

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert('Maintenance settings saved successfully');
      } else {
        alert('Failed to save maintenance settings');
      }
    } catch (error) {
      alert('An error occurred while saving maintenance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Maintenance Mode</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">

            {/* Status Toggle Section */}
            <div className="flex justify-between items-center">
              <label className="mb-2 text-lg font-semibold">Status</label>
              <button
                type="button"
                onClick={handleStatusToggle}
                className={`py-2 px-4 rounded-lg text-white text-lg transition duration-200 ${status === 'enabled' ? 'bg-green-500' : 'bg-red-500'}`}
              >
                {status === 'enabled' ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Image Section */}
            <div className="flex flex-col items-center">
              <label className="mb-2 text-lg font-semibold">Image</label>
              {previewImage ? (
                <Image src={previewImage} alt="Maintenance Image Preview" width={660} height={325} className="rounded-lg" />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  Preview not available
                </div>
              )}
              <div className="relative mt-2">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  className="text-blue-600 bg-gray-200 p-2 rounded-full"
                >
                  <FaCloudUploadAlt size={24} />
                </button>
              </div>
              <p className="text-xs mt-1">Supported Files: .png, .jpg, .jpeg. Image will be resized into 660x325px</p>
            </div>

            {/* Description Section */}
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-semibold">Description</label>
              <QuillWrapper initialContent={String(quillContent)} onChange={handleQuillChange} /> {/* Ensure quillContent is a string */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`mt-4 w-full py-3 text-white text-lg rounded-lg transition duration-200 ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default MaintenanceMode;
