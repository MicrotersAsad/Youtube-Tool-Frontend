// components/MetaDataForm.js
import React from 'react';

const MetaDataForm = () => {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-semibold mb-6">Meta Data</h1>
      <p className="mb-4 text-gray-600">This information will be displayed on Google and social media</p>
      <form>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="DNS Checker - DNS Check Propagation Tool"
            maxLength={60}
          />
          <p className="mt-1 text-xs text-gray-500">Recommended length: 60 characters</p>
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="Check DNS Propagation worldwide. DNS Checker provides name server propagation check instantly. Changed nameservers so do a DNS lookup and check if DNS and..."
            maxLength={160}
            rows="4"
          ></textarea>
          <p className="mt-1 text-xs text-gray-500">Recommended length: 155 - 160 characters</p>
        </div>
        <div className="mb-4">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Image
          </label>
          <input
            type="text"
            id="image"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="https://static.dnschecker.org/og-images/og-image.png"
          />
          <p className="mt-1 text-xs text-gray-500">Recommended dimension: 1200 x 630</p>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-200"
        >
          Save
        </button>
      </form>
    </div>
  );
};

export default MetaDataForm;
