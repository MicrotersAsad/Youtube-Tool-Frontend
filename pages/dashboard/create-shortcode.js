import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './layout';
import { FaCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CreateShortCode = () => {
  const [selectedTool, setSelectedTool] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortcodes, setShortcodes] = useState([]);

  useEffect(() => {
    // Fetch all shortcodes to display in a table
    fetchShortcodes();
  }, []);

  const fetchShortcodes = async () => {
    try {
      const response = await axios.get('/api/shortcodes-tools');
      setShortcodes(response.data);
    } catch (error) {
      console.error('Error fetching shortcodes:', error);
      toast.error('Failed to fetch shortcodes. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedTool || !shortcode) {
      alert('Please select a tool and enter a shortcode');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/shortcodes-tools', {
        shortcode,
        componentName: selectedTool,
      });

      toast.success('Shortcode saved successfully!');
      setSelectedTool('');
      setShortcode('');
      fetchShortcodes(); // Refresh the shortcode list after adding
    } catch (error) {
      console.error('Error saving shortcode:', error);
      if (error.response && error.response.status === 400) {
        toast.success(error.response.data.message);
      } else {
        toast.error('An error occurred while saving the shortcode. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Shortcode copied to clipboard!');
      },
      (err) => {
        toast.error('Failed to copy shortcode. Please try again.');
      }
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
        <marquee className="text-red-600">
          N:B: This Shortcode Only Works for Blog Posts
        </marquee>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Assign Shortcode to Tool</h2>

        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-2">Select Tool:</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            <option value="">Select a tool</option>
            <option value="name-generator">YouTube Name Generator</option>
            <option value="youtube-earning-calculator">YouTube Earning  Calculator</option>
           
            {/* Add more tools as needed */}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-600 text-sm mb-2">Shortcode:</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-md"
            type="text"
            placeholder="Enter shortcode"
            value={shortcode}
            onChange={(e) => setShortcode(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full bg-blue-600 text-white p-2 rounded-md transition-all ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {loading ? 'Saving...' : 'Save Shortcode'}
        </button>

        <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4">Existing Shortcodes</h3>
        <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">Tool Name</th>
              <th className="border px-4 py-2">Shortcode</th>
              <th className="border px-4 py-2">Copy</th>
            </tr>
          </thead>
          <tbody>
            {shortcodes.map((item) => (
              <tr key={item._id}>
                <td className="border px-4 py-2">{item.componentName}</td>
                <td className="border px-4 py-2">[{item.shortcode}]</td>
                <td className="border px-4 py-2 text-center">
                  <button
                    onClick={() => handleCopy(`[${item.shortcode}]`)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <FaCopy className="inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .container {
          max-width: 700px;
          margin-top: 2rem;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </Layout>
  );
};

export default CreateShortCode;
