import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';

function Search() {
  const router = useRouter();
  const { query } = router.query;
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    }
  }, [query]);

  const fetchSearchResults = async (query) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search?query=${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      const data = await response.json();
      setSearchResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching search results:', error.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-2xl font-semibold mb-4">Search Results for &quot;{query}&quot;</h2>
      {loading ? (
        <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
      ) : (
        <ul>
          {searchResults.map((result) => (
            <li key={result.id} className="mb-4">
              <a href={result.href} className="text-blue-500 hover:underline">
                {result.title}
              </a>
              <p>{result.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Search;
