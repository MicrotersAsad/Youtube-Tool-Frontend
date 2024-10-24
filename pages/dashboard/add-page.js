import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from './layout'; // Ensure you have this layout component

// Function to decode HTML entities and remove unwanted characters
function decodeHTMLEntities(encodedString) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = encodedString;
  let decodedString = textArea.value;

  // Remove unwanted <br> tags
  decodedString = decodedString.replace(/<br\s*\/?>/gi, '');

  // Remove non-breaking spaces (&nbsp;)
  decodedString = decodedString.replace(/&nbsp;/g, ' ');

  // Clean up HTML comments if there are any (<!-- -->)
  decodedString = decodedString.replace(/<!--.*?-->/g, ''); // Remove HTML comments

  return decodedString;
}

const AddPage = () => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaImage, setMetaImage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setSlug(
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  }, [title]);

  useEffect(() => {
    const initializeLaraberg = () => {
      if (window.Laraberg) {
        window.Laraberg.init('editor', {
          height: '1200px',
          showBlockInserter: true,
          blocks: true,
        
          colors: [
            { name: 'Black', color: '#000000' },
            { name: 'White', color: '#FFFFFF' },
            { name: 'Red', color: '#FF0000' },
            { name: 'Green', color: '#00FF00' },
            { name: 'Blue', color: '#0000FF' },
            { name: 'Yellow', color: '#FFFF00' },
            { name: 'Gray', color: '#808080' },
            { name: 'Light Gray', color: '#D3D3D3' },
            { name: 'Dark Gray', color: '#A9A9A9' },
          ],
        });
      } else {
        console.error('Laraberg is not loaded. Please check if the script is included.');
      }
    };

    // Check if Laraberg is available
    const checkLarabergLoaded = setInterval(() => {
      if (window.Laraberg) {
        initializeLaraberg();
        clearInterval(checkLarabergLoaded);
      }
    }, 100);

    return () => clearInterval(checkLarabergLoaded);
  }, []);

  const handleSave = async () => {
    const contentToSave = document.getElementById('editor').value;

    // Decode content before saving
    const decodedContent = decodeHTMLEntities(contentToSave);

    if (!decodedContent) {
      alert('No content to save!');
      return;
    }

    const formData = new FormData();
    formData.append('name', title);
    formData.append('slug', slug);
    formData.append('content', decodedContent);
    formData.append('metaTitle', metaTitle);
    formData.append('metaDescription', metaDescription);
    if (metaImage) {
      formData.append('metaImage', metaImage);
    }

    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      alert('Page saved successfully!');
      router.push('/all-pages');
    } catch (error) {
      console.error('Error saving content:', error.message, error);
      alert('Failed to save content. Please try again later.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Create New Page</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="pageName" className="block font-medium mb-2">Page Name</label>
            <input
              id="pageName"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter page name"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="slug" className="block font-medium mb-2">Slug (Auto-Generated)</label>
            <input
              id="slug"
              type="text"
              value={slug}
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="content" className="block font-medium mb-2">Content*</label>
            <textarea id="editor" style={{ display: 'block', minHeight: '400px', border: '1px solid #ccc' }}></textarea>
          </div>

          <div className="mb-4">
            <label htmlFor="metaTitle" className="block font-medium mb-2">Meta Title</label>
            <input
              id="metaTitle"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter meta title"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="metaDescription" className="block font-medium mb-2">Meta Description</label>
            <textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter meta description"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="metaImage" className="block font-medium mb-2">Meta Image</label>
            <input
              id="metaImage"
              type="file"
              onChange={(e) => setMetaImage(e.target.files[0])}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
            Create Page
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AddPage;
