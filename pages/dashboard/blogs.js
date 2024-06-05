import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Layout from './layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';

const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function Blogs() {
  const { user } = useAuth();
  const [quillContent, setQuillContent] = useState('');
  const [existingContents, setExistingContents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [slug, setSlug] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const [isSlugEditable, setIsSlugEditable] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch content whenever a category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchContent();
    }
  }, [selectedCategory]);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }
  };

  // Fetch content based on selected category
  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/blogs?category=${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();
      setExistingContents(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error fetching content:', error.message);
      setError(error.message);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!title || !quillContent || !metaDescription || !metaTitle || !description || !selectedCategory) {
      setError('Please fill in all the fields.');
      return;
    }

    try {
      const method = 'POST';

      const formData = new FormData();
      formData.append('content', quillContent);
      formData.append('title', title);
      formData.append('metaTitle', metaTitle);
      formData.append('description', description);
      formData.append('metaDescription', metaDescription);
      if (image) {
        formData.append('image', image);
      }
      formData.append('categories', JSON.stringify([selectedCategory]));
      formData.append('author', user.username);
      formData.append('authorProfile', user.profileImage);
      formData.append('slug', slug);
      formData.append('createdAt', new Date().toISOString());
      formData.append('isDraft', JSON.stringify(false));

      const response = await fetch('/api/blogs', {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }

      setError(null);
      fetchContent(); // Refresh the content list after posting
      toast.success('Content uploaded successfully!');
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  };

  // Handle Quill editor content change
  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  // Handle category change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Handle image change
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  // Handle draft status change
  const handleDraftChange = (e) => {
    setIsDraft(e.target.value === 'Draft');
  };

  // Generate slug from title without question marks or symbols
  useEffect(() => {
    if (!isSlugEditable) {
      const generateSlug = (str) => {
        // Remove question marks and symbols
        const cleanedTitle = str.replace(/[^\w\s]/gi, '');
        return cleanedTitle.toLowerCase().split(' ').join('-');
      };

      setSlug(generateSlug(title));
    }
  }, [title, isSlugEditable]);

  // Handle slug change
  const handleSlugChange = (e) => {
    setSlug(e.target.value);
  };

  return (
    <Layout>
      <div className="container mx-auto p-5">
        <h2 className="text-3xl font-semibold mb-6">Add Post - {selectedCategory ? selectedCategory : 'Select a category'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="mb-6">
              <label htmlFor="metaTitle" className="block mb-2 text-lg font-medium">Meta Title</label>
              <input
                id="metaTitle"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="metaDescription" className="block mb-2 text-lg font-medium">Meta Description</label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="title" className="block mb-2 text-lg font-medium">Title*</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="slug" className="block mb-2 text-lg font-medium">Slug</label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                readOnly={!isSlugEditable}
                className={`w-full border border-gray-300 rounded-lg p-3 ${!isSlugEditable ? 'bg-gray-100' : 'bg-white'} shadow-sm`}
              />
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="editSlug"
                  checked={isSlugEditable}
                  onChange={(e) => setIsSlugEditable(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="editSlug" className="text-gray-700">Edit Slug</label>
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="description" className="block mb-2 text-lg font-medium">Description*</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
              />
              <p className="text-gray-600 text-sm mt-1">Description max 200 characters</p>
            </div>
            <div className="mb-6">
              <label htmlFor="content" className="block mb-2 text-lg font-medium">Content*</label>
              <div className="border border-gray-300 rounded-lg shadow-sm p-3">
                <QuillWrapper initialContent={quillContent} onChange={handleQuillChange} />
              </div>
            </div>
          </div>
          <div>
            <div className="mb-6">
              <label htmlFor="category" className="block mb-2 text-lg font-medium">Categories*</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="status" className="block mb-2 text-lg font-medium">Status*</label>
              <select
                id="status"
                value={isDraft ? 'Draft' : 'Publish'}
                onChange={handleDraftChange}
                className="w-full border border-gray-300 rounded-lg p-3 shadow-sm"
              >
                <option value="Publish">Publish</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="image" className="block mb-2 text-lg font-medium">Image</label>
              <input
                type="file"
                id="image"
                onChange={handleImageChange}
                className="block w-full text-gray-700"
              />
              <p className="text-gray-600 text-sm mt-1">Valid image type: jpg/jpeg/png/svg</p>
            </div>
            <button
              className="bg-blue-500 text-white p-3 rounded-lg w-full mb-4 shadow-md"
              onClick={handleSubmit}
            >
              Save & Edit
            </button>
            <button
              className="bg-green-500 text-white p-3 rounded-lg w-full shadow-md"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </Layout>
  );
}

export default Blogs;
