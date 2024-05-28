import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Layout from './layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

function EditBlog() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [quillContent, setQuillContent] = useState('');
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [Blogtitle, setBlogtitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchBlogData(id);
    }
  }, [id]);

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

  const fetchBlogData = async (id) => {
    try {
      const response = await fetch(`/api/blogs?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch blog data');
      }
      const data = await response.json();
      setQuillContent(data.content);
      setSelectedCategory(data.categories[0]);
      setTitle(data.title);
      setBlogtitle(data.Blogtitle);
      setDescription(data.description);
      setIsDraft(data.isDraft);
    } catch (error) {
      console.error('Error fetching blog data:', error.message);
      setError(error.message);
    }
  };

  const handleSave = useCallback(async () => {
    try {
      const method = 'PUT';

      const formData = new FormData();
      formData.append('content', quillContent);
      formData.append('title', title);
      formData.append('description', description);
      if (image) {
        formData.append('image', image);
      }
      formData.append('Blogtitle', Blogtitle);
      formData.append('categories', JSON.stringify([selectedCategory]));
      formData.append('author', user.username);
      formData.append('authorProfile', user.profileImage);
      formData.append('createdAt', new Date().toISOString());
      formData.append('isDraft', JSON.stringify(isDraft));

      const response = await fetch(`/api/blogs?id=${id}`, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to update content: ${errorMessage}`);
      }

      setError(null);
      toast.success('Content updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating content:', error.message);
      setError(error.message);
    }
  }, [quillContent, selectedCategory, title, description, Blogtitle, image, user, isDraft, id, router]);

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
    setIsDraft(e.target.checked);
  };

  return (
    <Layout>
      <div className='container p-5'>
        <h2>Edit Blog</h2>
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
              {categories.map((category) => (
                <option key={category._id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <Link href="/categories">
            <button className="ml-2 btn btn-primary">Manage Categories</button>
          </Link>
        </div>
        
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
                <label htmlFor="Blogtitle" className="block text-sm font-medium">Blog Title:</label>
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
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isDraft"
                checked={isDraft}
                onChange={handleDraftChange}
                className="mr-2"
              />
              <label htmlFor="isDraft" className="text-sm font-medium">Save as Draft</label>
            </div>
            {!isDraft && (
              <button className='btn btn-primary p-2 mt-3' onClick={handleSave}>Save Changes</button>
            )}
          </>
        )}
      </div>
      <ToastContainer />
    </Layout>
  );
}

export default EditBlog;
