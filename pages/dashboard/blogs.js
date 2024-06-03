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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchContent();
    }
  }, [selectedCategory]);

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

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/blogs?category=${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();
      console.log(data);
      setExistingContents(data);
      console.log(existingContents);
      setIsEditing(data.length > 0);
    } catch (error) {
      console.error('Error fetching content:', error.message);
      setError(error.message);
    }
  };

  

  const handleSubmit = async () => {
    // Check if  fields are empty
    if (!title || !quillContent || !metaDescription || !metaTitle || !image || !description || !selectedCategory) {
      setError('Please fill in all  fields.');
      return;
    }
  
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const id = isEditing ? existingContents[0]._id : '';
  
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
  
      const response = await fetch(`/api/blogs${isEditing ? `?id=${id}` : ''}`, {
        method,
        body: formData,
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }
  
      setError(null);
      setExistingContents([...existingContents, { content: quillContent, title, metaTitle, description, metaDescription,  categories: [selectedCategory], author: user.username, authorProfile: user.profileImage, slug, createdAt: new Date().toISOString(), isDraft: false }]);
      toast.success('Content uploaded successfully!');
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  };
  

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleDraftChange = (e) => {
    setIsDraft(e.target.value === 'Draft');
  };

  useEffect(() => {
    setSlug(title.toLowerCase().split(' ').join('-'));
  }, [title]);

  return (
    <Layout>
      <div className="container mx-auto p-5">
        <h2 className="text-2xl font-bold mb-4">Add Post - {selectedCategory ? selectedCategory : 'Select a category'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="mb-4">
              <label htmlFor="metaTitle" className="block mb-1 font-medium">Meta Title</label>
              <input
                id="metaTitle"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                
              />
            </div>
            <div className="mb-4">
              <label htmlFor="metaDescription" className="block mb-1 font-medium">Meta Description</label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                
              />
            </div>
            <div className="mb-4">
              <label htmlFor="title" className="block mb-1 font-medium">Title*</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                
              />
            </div>
            <div className="mb-4">
              <label htmlFor="slug" className="block mb-1 font-medium">Slug</label>
              <input
                id="slug"
                type="text"
                value={slug}
                readOnly
                className="w-full border border-gray-300 rounded p-2 bg-gray-100"
                
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block mb-1 font-medium">Description*</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                
              />
              <p className="text-gray-600 text-sm">Description max 200 characters</p>
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block mb-1 font-medium">Content*</label>
              <QuillWrapper initialContent={quillContent} onChange={handleQuillChange} />
            </div>
          </div>
          <div>
            <div className="mb-4">
              <label htmlFor="category" className="block mb-1 font-medium">Categories*</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 rounded p-2"
                
              >
                <option value="" disabled>Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="status" className="block mb-1 font-medium">Status*</label>
              <select
                id="status"
                value={isDraft ? 'Draft' : 'Publish'}
                onChange={handleDraftChange}
                className="w-full border border-gray-300 rounded p-2"
                
              >
                <option value="Publish">Publish</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="image" className="block mb-1 font-medium">Image</label>
              <input
                type="file"
                id="image"
                onChange={handleImageChange}
                className="block w-full text-gray-700"
              />
              <p className="text-gray-600 text-sm">Valid image type: jpg/jpeg/png/svg</p>
            </div>
            <button
              className="bg-blue-500 text-white p-2 rounded w-full mb-2"
              onClick={handleSubmit}
            >
              Save & Edit
            </button>
            <button
              className="bg-green-500 text-white p-2 rounded w-full"
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
