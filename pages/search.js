import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const Search = () => {
  const router = useRouter();
  const { query } = router.query;
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query) {
      // Fetch search results from your API or service
      fetch(`/api/search?query=${query}`)
        .then(response => response.json())
        .then(data => setResults(data.results))
        .catch(error => console.error('Error fetching search results:', error));
    }
  }, [query]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Search Results for &quot;{query}&quot;</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => (
          <div key={result.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">{result.title}</h2>
            <p>{result.description}</p>
            <Link href={result.href}>
              <span className="text-blue-500">Read more</span>
            </Link>
          </div>
        ))}
        {results.length === 0 && <p>No results found.</p>}
      </div>
    </div>
  );
};

export default Search;
