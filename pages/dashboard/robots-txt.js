import React, { useState, useEffect } from 'react';
import Layout from './layout';
import { toast, ToastContainer } from 'react-toastify'; // Import toast from React Toastify
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS

const RobotsTxt = () => {
  const [content, setContent] = useState('');

  // Fetch existing robots.txt content on component mount
  useEffect(() => {
    const fetchRobotsTxt = async () => {
      try {
        const response = await fetch('/api/robots-txt');
        const data = await response.json();
        if (data.success) {
          setContent(data.content);
        } else {
          toast.error('Failed to fetch Robots.txt content.');
        }
      } catch (error) {
        console.error('Error fetching robots.txt content:', error);
        toast.error('Error fetching Robots.txt content.');
      }
    };

    fetchRobotsTxt();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/robots-txt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Robots.txt updated successfully!');
      } else {
        toast.error('Failed to update Robots.txt');
      }
    } catch (error) {
      console.error('Error updating robots.txt:', error);
      toast.error('An error occurred while updating Robots.txt');
    }
  };

  return (
    <Layout>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Robots TXT</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-lg font-medium">Insert Robots txt</label>
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
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Layout>
  );
};

export default RobotsTxt;
