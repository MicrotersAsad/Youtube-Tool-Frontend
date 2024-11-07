import React, { useState } from 'react';
import Image from 'next/image';
import { FaCloudUploadAlt } from 'react-icons/fa';
import Layout from './layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadLogo = () => {
  const [logo, setLogo] = useState(null);
  const [logoDark, setLogoDark] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewLogoDark, setPreviewLogoDark] = useState(null);
  const [previewFavicon, setPreviewFavicon] = useState(null);
  const [siteTitle, setSiteTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      switch (type) {
        case 'logo':
          setLogo(file);
          setPreviewLogo(previewUrl);
          break;
        case 'logoDark':
          setLogoDark(file);
          setPreviewLogoDark(previewUrl);
          break;
        case 'favicon':
          setFavicon(file);
          setPreviewFavicon(previewUrl);
          break;
        default:
          break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    if (logo) formData.append('logo', logo);
    if (logoDark) formData.append('logoDark', logoDark);
    if (favicon) formData.append('favicon', favicon);
    formData.append('siteTitle', siteTitle);

    try {
      const response = await fetch('/api/general', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Files and title uploaded successfully');
      } else {
        toast.error('Failed to upload files');
      }
    } catch (error) {
      toast.error('An error occurred while uploading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Logo & Favicon</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-semibold">Site Title</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full py-2 px-4 rounded-lg bg-gray-200 border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out"
                placeholder="Enter site title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Logo', state: previewLogo, fileState: setLogo, type: 'logo' },
                { label: 'Logo Dark', state: previewLogoDark, fileState: setLogoDark, type: 'logoDark' },
                { label: 'Favicon', state: previewFavicon, fileState: setFavicon, type: 'favicon' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <label className="mb-2 text-lg font-semibold">{item.label}</label>
                  {item.state ? (
                    <Image src={item.state} alt={`${item.label} Preview`} width={150} height={150} className="rounded-lg" />
                  ) : (
                    <div className="w-36 h-36 text-center bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                      Preview not available
                    </div>
                  )}
                  <div className="relative mt-2">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange(e, item.type)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="text-blue-600 bg-gray-200 p-2 rounded-full"
                    >
                      <FaCloudUploadAlt size={24} />
                    </button>
                  </div>
                  <p className="text-xs mt-1">Supported Files: .png, .jpg, .jpeg.</p>
                </div>
              ))}
            </div>

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

export default UploadLogo;
