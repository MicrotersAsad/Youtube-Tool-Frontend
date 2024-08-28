import { useState } from 'react';
import axios from 'axios';
import Layout from './layout';

export default function EmailConfigForm() {
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [fromName, setFromName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/update-email-config', {
        smtpHost,
        smtpPort,
        user,
        pass,
        fromName,
      });
      alert('Email configuration updated successfully');
    } catch (error) {
      console.error('Error updating email configuration:', error);
      alert('Failed to update email configuration');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Update Email Configuration</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">SMTP Host:</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., smtp.gmail.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">SMTP Port:</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 587"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email User:</label>
              <input
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your email"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email Password:</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your email password"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">From Name:</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Your Company Name"
                required
              />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="bg-blue-500 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Configuration
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
