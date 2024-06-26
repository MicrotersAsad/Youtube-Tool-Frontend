// /components/KeywordSearch.js

import { useState } from 'react';
import { FaCopy } from 'react-icons/fa';
import ClipLoader from 'react-spinners/ClipLoader';

const KeywordSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchKeywordData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/getKeywordData?keyword=${keyword}&country=${country}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error: ${res.status} ${errorText}`);
      }
      const result = await res.json();
      setData(result.slice(0, 15)); // Limit to top 15 results
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
      console.error(err); // Log the error to the console
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Keyword copied to clipboard!');
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-5">
      <div className="mb-4 center w-full sm:w-2/3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter a keyword"
          className="p-2 m-2 border border-gray-300 rounded mr-2"
        />
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Enter a country code"
          className="p-2 m-2 border md:mt-2 border-gray-300 rounded mr-2"
        />
        <button onClick={fetchKeywordData} className="p-2 sm:mt-3 bg-red-500 text-white rounded">
          Search
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center">
          <ClipLoader color="#3b82f6" loading={loading} size={50} />
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {data && !loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Keyword</th>
                <th className="px-4 py-2 border-b">CPC</th>
                <th className="px-4 py-2 border-b">Volume</th>
                <th className="px-4 py-2 border-b">Competition</th>
                <th className="px-4 py-2 border-b">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b flex items-center">
                    {item.text}
                    <FaCopy
                      className="ml-2 cursor-pointer text-blue-500"
                      onClick={() => copyToClipboard(item.text)}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">{item.cpc}</td>
                  <td className="px-4 py-2 border-b">{item.vol}</td>
                  <td className="px-4 py-2 border-b">{item.competition}</td>
                  <td className="px-4 py-2 border-b">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KeywordSearch;
