import { useState } from 'react';
import Layout from './layout';

const ClearCachePage = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null); // To manage which FAQ is open

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index); // Toggle the clicked FAQ
  };

  const clearCache = async () => {
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/clear-cache', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.message);
      } else {
        const error = await response.json();
        setStatus(error.message || 'Failed to clear cache');
      }
    } catch (error) {
      setStatus('An error occurred while clearing the cache');
    } finally {
      setLoading(false);
    }
  };

  const faqItems = [
    {
      question: '1. If updates are not visible:',
      answer: 'After making changes to code or content, if the updates do not appear on the site, clear the cache.',
    },
    {
      question: '2. To fix an issue:',
      answer: 'If a bug or issue seems to be caused by the cache, clearing it might resolve the problem.',
    },
    {
      question: '3. If the site feels slow:',
      answer: 'Clearing the cache can help improve site performance if cached data is causing slow loading.',
    },
    {
      question: '4. During development:',
      answer: 'Developers can clear the cache to ensure they are working with the latest code and data after making changes.',
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl flex flex-col items-center justify-center bg-gray-100 px-4">
        <h1 className="text-3xl font-bold mb-6">Clear System Cache</h1>

      <div className='row'>
        <div className='col-md-6'>
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
          <ul className="space-y-4">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✔</span> Compiled views will be cleared
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✔</span> Application cache will be cleared
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✔</span> Route cache will be cleared
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✔</span> Configuration cache will be cleared
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✔</span> Compiled services and packages will be removed
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✔</span> Caches will be cleared
            </li>
          </ul>

          <button
            onClick={clearCache}
            disabled={loading}
            className={`mt-6 w-full py-3 rounded-lg text-white font-semibold ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Clearing...' : 'Click to clear'}
          </button>
        </div>

        {status && <p className="mt-4 text-center text-gray-700">{status}</p>}
        </div>
        <div className='col-md-6'>
   {/* Collapsible FAQ Section */}
   <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg mt-10">
          <h2 className="text-xl font-bold mb-4">FAQ: When should you clear the cache?</h2>
          <div>
            {faqItems.map((item, index) => (
              <div key={index} className="mb-4 border-b">
                <button
                  className="w-full text-left font-semibold text-gray-800 focus:outline-none flex justify-between items-center py-2"
                  onClick={() => toggleFAQ(index)}
                >
                  {item.question}
                  <span className="text-gray-500">{openFAQ === index ? '-' : '+'}</span>
                </button>
                {openFAQ === index && (
                  <p className="text-gray-700 mt-2 ml-4">{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

     
      </div>
    </Layout>
  );
};

export default ClearCachePage;
