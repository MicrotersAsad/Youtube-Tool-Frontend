import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../layout';
import Image from 'next/image';

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

const EditPage = () => {
  const [pageData, setPageData] = useState({
    name: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    content: '',
  });

  const [metaImage, setMetaImage] = useState(null);
  const [existingMetaImage, setExistingMetaImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editorInitialized, setEditorInitialized] = useState(false);
  const router = useRouter();
  const { slug } = router.query;

  // Fetch existing page data when the component loads
  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetch(`/api/pages?slug=${slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            // Decode the content to ensure it's properly formatted for the editor
            data.content = decodeHTMLEntities(data.content);
            setPageData(data);
            setExistingMetaImage(data.metaImage || '');
          } else {
            console.error("No data found for the given slug.");
          }
        })
        .catch((error) => console.error('Error fetching page:', error))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  // Initialize Laraberg and load content
  useEffect(() => {
    const initializeLaraberg = () => {
      if (window.Laraberg && window.wp) {
        // Initialize Laraberg editor
        window.Laraberg.init('LarabergId', {
          height: '600px',
          showBlockInserter: true,
          
        });

        // Inject existing content directly into the editor
        const editorElement = document.getElementById('LarabergId');
        if (editorElement) {
          setTimeout(() => {
            editorElement.innerHTML = pageData.content || ''; // Inject content
            setEditorInitialized(true);
          }, 1000);
        }
      }
    };

    // Only initialize Laraberg if it hasn't been initialized yet
    if (!editorInitialized) {
      initializeLaraberg();
    }
  }, [pageData.content, editorInitialized]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editorInitialized) {
      alert('Editor is not fully initialized yet. Please wait and try again.');
      return;
    }

    try {
      const editorContentElement = document.getElementById('LarabergId');
      const contentToUpdate = editorContentElement.innerHTML; // Directly getting content from HTML

      const updatedPageData = {
        ...pageData,
        content: contentToUpdate,
      };

      const formData = new FormData();
      formData.append('id', pageData._id);
      formData.append('name', updatedPageData.name);
      formData.append('slug', updatedPageData.slug);
      formData.append('content', updatedPageData.content);
      formData.append('metaTitle', updatedPageData.metaTitle);
      formData.append('metaDescription', updatedPageData.metaDescription);

      if (metaImage) {
        formData.append('metaImage', metaImage);
      } else {
        formData.append('existingMetaImage', existingMetaImage);
      }

      setLoading(true);
      const response = await fetch(`/api/pages`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        alert('Page updated successfully');
        router.push('/all-pages');
      } else {
        const errorText = await response.text();
        console.error('Failed to update page:', errorText);
        alert('Failed to update page. Please try again later.');
      }
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Failed to update page. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    setMetaImage(e.target.files[0]);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Edit Page</h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label>Page Name</label>
                <input
                  type="text"
                  value={pageData.name}
                  onChange={(e) => setPageData({ ...pageData, name: e.target.value })}
                  required
                  className="w-full p-2 border"
                />
              </div>
              <div className="mb-4">
                <label>Slug</label>
                <input
                  type="text"
                  value={pageData.slug}
                  onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                  required
                  className="w-full p-2 border"
                />
              </div>

              {/* Laraberg Editor for Content */}
              <div className="mb-6">
                <label htmlFor="content" className="block font-medium mb-2">
                  Content*
                </label>
                <textarea id="LarabergId" hidden defaultValue={pageData.content}></textarea>
              </div>

              <div className="mb-4">
                <label>Meta Title</label>
                <input
                  type="text"
                  value={pageData.metaTitle}
                  onChange={(e) =>
                    setPageData({ ...pageData, metaTitle: e.target.value })
                  }
                  required
                  className="w-full p-2 border"
                />
              </div>
              <div className="mb-4">
                <label>Meta Description</label>
                <textarea
                  value={pageData.metaDescription}
                  onChange={(e) =>
                    setPageData({ ...pageData, metaDescription: e.target.value })
                  }
                  required
                  className="w-full p-2 border"
                />
              </div>

              {/* Meta Image Upload */}
              <div className="mb-4">
                <label>Meta Image</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="w-full p-2 border"
                />
                {existingMetaImage && (
                  <div className="mt-4">
                    <p>Existing Image:</p>
                    <Image width={40} height={40} src={existingMetaImage} alt="Existing Meta" className="w-48 h-auto" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded"
                disabled={loading}
              >
                Update Page
              </button>
            </form>
          </>
        )}
      </div>
    </Layout>
  );
};

export default EditPage;
