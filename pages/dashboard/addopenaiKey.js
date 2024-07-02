import { useState, useEffect } from 'react';
import Layout from './layout';

export default function Tokens() {
  const [tokens, setTokens] = useState([]);
  const [newTokens, setNewTokens] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    const response = await fetch('/api/openaiKey');
    const data = await response.json();
    setTokens(data);
  };

  const handleAddTokens = async () => {
    setLoading(true);
    await fetch('/api/openaiKey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokens: newTokens, usageLimit: 1000 }),
    });
    setNewTokens('');
    fetchTokens();
    setLoading(false);
  };

  const handleDeleteToken = async (id) => {
    const confirmDelete = confirm('Are you sure you want to delete this token?');
    if (confirmDelete) {
      await fetch(`/api/openaiKey?id=${id}`, {
        method: 'DELETE',
      });
      fetchTokens();
    }
  };

  const handleToggleActive = async (id, active) => {
    await fetch('/api/openaiKey', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, active }),
    });
    fetchTokens();
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">API Key Management</h1>
        <div className="mb-4">
          <textarea
            value={newTokens}
            onChange={(e) => setNewTokens(e.target.value)}
            rows="3"
            className="w-full p-2 border rounded"
            placeholder="Add API keys (comma-separated)"
          />
          <button
            onClick={handleAddTokens}
            className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Tokens'}
          </button>
        </div>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">#</th>
              <th className="p-2">API Key</th>
              <th className="p-2">Usage</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <tr key={token._id} className="border-t">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{token.token}</td>
                <td className="p-2">
                  {token.usageCount}/{token.usageLimit}
                </td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(token._id, !token.active)}
                    className={`px-2 py-1 rounded ${token.active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                  >
                    {token.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDeleteToken(token._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
