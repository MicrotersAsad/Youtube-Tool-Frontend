import React, { useState, useEffect } from 'react';
import Layout from './layout';

const SitemapIndex = () => {
  const [content, setContent] = useState('');

  // Fetch existing sitemap_index.xml content on component mount
  useEffect(() => {
    const fetchSitemapIndex = async () => {
      try {
        const response = await fetch('/api/sitemap-index');
        const data = await response.json();
        if (data.success) {
          setContent(data.content); // Set fetched content to the state
        } else {
          console.error('Error: File not found');
        }
      } catch (error) {
        console.error('Error fetching sitemap_index.xml content:', error);
      }
    };

    fetchSitemapIndex();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/sitemap-index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Sitemap Index updated successfully!');
      } else {
        alert('Failed to update Sitemap Index');
      }
    } catch (error) {
      console.error('Error updating sitemap_index.xml:', error);
      alert('An error occurred while updating Sitemap Index');
    }
  };

  return (
    <Layout>
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Sitemap Index</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 text-lg font-medium">Insert Sitemap Index XML</label>
        <textarea
          className="w-full h-60 p-2 border rounded-md"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md"
        >
          Submit
        </button>
      </form>
    </div>
    </Layout>
  );
};

export default SitemapIndex;
