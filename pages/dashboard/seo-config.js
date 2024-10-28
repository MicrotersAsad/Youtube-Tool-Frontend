import React, { useState } from 'react';
import Image from 'next/image';
import { FaCloudUploadAlt } from 'react-icons/fa';
import Layout from './layout';

const SeoConfiguration = () => {
  const [seoImage, setSeoImage] = useState(null);
  const [previewSeoImage, setPreviewSeoImage] = useState(null);
  const [metaKeywords, setMetaKeywords] = useState([]);
  const [metaDescription, setMetaDescription] = useState('');
  const [socialTitle, setSocialTitle] = useState('');
  const [socialDescription, setSocialDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSeoImage(file);
      setPreviewSeoImage(URL.createObjectURL(file));
    }
  };

  const handleKeywordChange = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value) {
        setMetaKeywords([...metaKeywords, value]);
        e.target.value = '';
      }
    }
  };

  const removeKeyword = (index) => {
    setMetaKeywords(metaKeywords.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (seoImage) formData.append('seoImage', seoImage);
    formData.append('metaKeywords', metaKeywords.join(','));
    formData.append('metaDescription', metaDescription);
    formData.append('socialTitle', socialTitle);
    formData.append('socialDescription', socialDescription);

    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert('SEO Configuration saved successfully');
      } else {
        alert('Failed to save SEO Configuration');
      }
    } catch (error) {
      alert('An error occurred while saving SEO Configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">SEO Configuration</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            {/* SEO Image Section */}
            <div className="flex flex-col items-center">
              <label className="mb-2 text-lg font-semibold">SEO Image</label>
              {previewSeoImage ? (
                <Image src={previewSeoImage} alt="SEO Image Preview" width={1180} height={600} className="rounded-lg" />
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
              <p className="text-xs mt-1">Supported Files: .png, .jpg, .jpeg. Image will be resized into 1180x600px</p>
            </div>

            {/* Meta Keywords Section */}
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-semibold">Meta Keywords</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {metaKeywords.map((keyword, index) => (
                  <span key={index} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full flex items-center">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="ml-2 text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type a keyword and press Enter"
                onKeyDown={handleKeywordChange}
                className="w-full py-2 px-4 rounded-lg bg-gray-200 border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out"
              />
            </div>

            {/* Meta Description Section */}
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-semibold">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full py-2 px-4 rounded-lg bg-gray-200 border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out"
                rows="3"
                placeholder="Enter meta description"
                required
              />
            </div>

            {/* Social Title Section */}
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-semibold">Social Title</label>
              <input
                type="text"
                value={socialTitle}
                onChange={(e) => setSocialTitle(e.target.value)}
                className="w-full py-2 px-4 rounded-lg bg-gray-200 border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out"
                placeholder="Enter social title"
                required
              />
            </div>

            {/* Social Description Section */}
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-semibold">Social Description</label>
              <textarea
                value={socialDescription}
                onChange={(e) => setSocialDescription(e.target.value)}
                className="w-full py-2 px-4 rounded-lg bg-gray-200 border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out"
                rows="3"
                placeholder="Enter social description"
                required
              />
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

export default SeoConfiguration;
