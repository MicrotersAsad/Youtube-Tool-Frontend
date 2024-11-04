import { useState } from 'react';

function Home() {
  const [urls, setUrls] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    // URL গুলোকে লাইনে ভেঙে আলাদা করুন
    const urlList = urls.split('\n').map((url) => url.trim()).filter(Boolean);

    // প্রতিটি URL স্ক্র্যাপ করে ডেটা টেক্সট ফাইলে সংগ্রহ করা
    let content = 'Scraped Data:\n\n';
    for (let url of urlList) {
      try {
        const response = await fetch('/api/hello', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        content += `URL: ${url}\nData: ${JSON.stringify(data, null, 2)}\n\n`;
      } catch (error) {
        content += `URL: ${url}\nError: Failed to fetch data\n\n`;
      }
    }

    setFileContent(content);
    setLoading(false);
  };

  // ফাইল ডাউনলোড করার জন্য
  const downloadFile = () => {
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scraped_data.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>URL Scraper</h1>
      <form onSubmit={submitHandler}>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="Enter URLs (one per line)"
          rows="10"
          cols="50"
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Scraping...' : 'Scrape Data'}
        </button>
      </form>
      {fileContent && (
        <button onClick={downloadFile}>Download Text File</button>
      )}
    </div>
  );
}

export default Home;
