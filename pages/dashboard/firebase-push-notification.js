import { useState, useEffect } from 'react';
import Layout from './layout';

const PushNotificationSettings = () => {
  const [formData, setFormData] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
  });

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/firebase-push-notification');
        if (response.ok) {
          const data = await response.json();
          setFormData(data); // Set existing data into the form
        } else {
          setStatus('No existing configuration found.');
        }
      } catch (error) {
        setStatus('An error occurred while loading existing data.');
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/firebase-push-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setStatus(
          result.message === 'File created'
            ? 'Firebase configuration file created successfully in lib/firebase.js!'
            : 'Firebase configuration file updated successfully in lib/firebase.js!'
        );
      } else {
        setStatus('Failed to create or update Firebase configuration file.');
      }
    } catch (error) {
      setStatus('An error occurred while submitting the form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Push Notification Settings
          </h1>
          <p className="text-sm text-gray-600 text-center mb-8">
            Ensure your system is SSL certified to send push notifications using Firebase.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(formData).map((field) => (
                <div key={field}>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor={field}
                  >
                    {field.replace(/([A-Z])/g, ' $1')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id={field}
                    name={field}
                    value={formData[field]}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : 'Submit'}
            </button>
          </form>
          {status && (
            <p
              className={`mt-4 text-center text-sm font-medium ${
                status.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {status}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PushNotificationSettings;
