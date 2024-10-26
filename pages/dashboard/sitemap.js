import React, { useState } from 'react';
import axios from 'axios';
import Layout from './layout';

const Sitemap = () => {
  const [sitemapXML, setSitemapXML] = useState('');
  const [message, setMessage] = useState('');
  const [fetchedXML, setFetchedXML] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/sitemap', { sitemapXML });
      if (response.status === 200) {
        setMessage('Sitemap XML submitted successfully!');
        setFetchedXML(''); // Clear fetched XML when submitting new data
      } else {
        setMessage('An error occurred while submitting the sitemap.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while submitting the sitemap.');
    }
  };

  const handleFetch = async () => {
    try {
      const response = await axios.get('/api/sitemap');
      if (response.status === 200 && response.data.sitemapXML) {
        setFetchedXML(response.data.sitemapXML);
      } else {
        setMessage('Sitemap not found.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while fetching the sitemap.');
    }
  };

  return (
    <Layout>

  
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Sitemap XML</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg w-full max-w-3xl p-6"
      >
        <label htmlFor="sitemap" className="text-lg font-semibold mb-2 block">
          Insert Sitemap XML
        </label>
        <textarea
          id="sitemap"
          rows="15"
          className="w-full p-4 rounded-lg bg-gray-800 text-white"
          value={sitemapXML}
          onChange={(e) => setSitemapXML(e.target.value)}
          placeholder="Paste your Sitemap XML here..."
        ></textarea>
        <button
          type="submit"
          className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Submit
        </button>
        {message && (
          <p className="mt-4 text-center text-lg font-semibold">{message}</p>
        )}
      </form>

      <button
        onClick={handleFetch}
        className="w-full max-w-3xl mt-6 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
      >
        Fetch Sitemap
      </button>

      {fetchedXML && (
        <div className="mt-6 w-full max-w-3xl bg-gray-800 p-4 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-4">Fetched Sitemap XML</h2>
          <pre className="whitespace-pre-wrap">{fetchedXML}</pre>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default Sitemap;
