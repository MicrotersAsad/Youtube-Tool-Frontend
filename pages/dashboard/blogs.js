import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Layout from './layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function Blogs() {
  const [quillContent, setQuillContent] = useState('');
  const [existingContents, setExistingContents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [Blogtitle, setBlogtitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);

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
      const response = await fetch('/api/blogs?type=categories');
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
      setExistingContents(data);
      setIsEditing(data.length > 0);
    } catch (error) {
      console.error('Error fetching content:', error.message);
      setError(error.message);
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const id = isEditing ? existingContents[0]._id : '';

      const formData = new FormData();
      formData.append('content', quillContent);
      formData.append('title', title);
      formData.append('description', description);
      if (image) {
        formData.append('image', image);
      }
      formData.append('Blogtitle', Blogtitle);
      formData.append('categories', JSON.stringify([selectedCategory]));

      const response = await fetch(`/api/blogs?category=${selectedCategory}${isEditing ? `&id=${id}` : ''}`, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to post content: ${errorMessage}`);
      }

      setError(null);
      setExistingContents([...existingContents, { content: quillContent, title, description, Blogtitle, categories: [selectedCategory] }]);
      toast.success('Content uploaded successfully!');
    } catch (error) {
      console.error('Error posting content:', error.message);
      setError(error.message);
    }
  }, [quillContent, selectedCategory, isEditing, title, description, Blogtitle, image, existingContents]);

  const handleQuillChange = useCallback((newContent) => {
    setQuillContent(newContent);
  }, []);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'newCategory') {
      setIsNewCategoryModalOpen(true);
    } else {
      setSelectedCategory(value);
    }
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const openNewCategoryModal = () => {
    setIsNewCategoryModalOpen(true);
  };

  const closeNewCategoryModal = () => {
    setIsNewCategoryModalOpen(false);
  };

  const handleSaveNewCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setSelectedCategory(newCategory);
      setNewCategory('');
      closeNewCategoryModal();
    }
  };

  const handleChange = (e) => {
    setNewCategory(e.target.value);
  };

  return (
    <Layout>
      <div className='container p-5'>
        <h2>Content Add For {selectedCategory ? selectedCategory : 'Select a category'}</h2>
        <div className="mb-3 flex items-center">
          <label htmlFor="category" className="mr-2 text-sm font-medium">Select Category:</label>
          <div className="relative">
            <select
              id="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>Select a category</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
              <option value="newCategory">Add New Category</option>
            </select>
          </div>
          <button onClick={openNewCategoryModal} className="ml-2 btn btn-primary">Add New Category</button>
        </div>
        
        {isNewCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-smoke-light">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
              <div className="mb-4">
                <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700">New Category:</label>
                <input
                  type="text"
                  id="newCategory"
                  value={newCategory}
                  onChange={handleChange}
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveNewCategory} className="btn btn-primary mr-2">Save</button>
                <button onClick={closeNewCategoryModal} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {selectedCategory && (
          <>
            <div className="flex flex-wrap -mx-3 mb-6">
              <div className="w-full px-3">
                <label htmlFor="title" className="block text-sm font-medium">Meta Title:</label>
                <input 
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-gray-600 text-xs italic">Recommended length: 60 characters</p>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="block text-sm font-medium">Meta Description:</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              />
              <p className="text-gray-600 text-xs italic">Recommended length: 155-160 characters</p>
            </div>
            <div className="flex flex-wrap -mx-3 mb-6">
              <div className="w-full px-3">
                <label htmlFor="title" className="block text-sm font-medium">Blog Title:</label>
                <input 
                  className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-300 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                  id="Blogtitle"
                  type="text"
                  value={Blogtitle}
                  onChange={(e) => setBlogtitle(e.target.value)}
                />
                <p className="text-gray-600 text-xs italic">Recommended length: 60 characters</p>
              </div>
            </div>
            <div className="mb-5">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Upload Feature Image:</label>
              <input
                type="file"
                id="image"
                onChange={handleImageChange}
                className="mt-1 block w-full text-gray-700"
              />
              <p className="text-gray-600 text-xs italic">Recommended dimension: 1200 x 630</p>
            </div>
            {error && <div className="text-red-500">Error: {error}</div>}
            <QuillWrapper initialContent={quillContent} onChange={handleQuillChange} />
            <button className='btn btn-primary p-2 mt-3' onClick={handleSubmit}>Submit Content</button>
            
          </>
        )}
      </div>
      <ToastContainer />
    </Layout>
  );
}

export default Blogs;
