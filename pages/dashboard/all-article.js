// pages/dashboard/all-article.js
import React, { useState, useEffect } from 'react';
import Layout from './layout';
import Link from 'next/link';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Allarticle() {
  const [article, setarticle] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(''); // Single select
  const [selectedLanguage, setSelectedLanguage] = useState(''); // Single select
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [articlePerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [selectedarticle, setSelectedarticle] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetcharticle();
  }, [showDrafts]);

  const fetchCategories = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const fetcharticle = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/youtube');
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      const data = await response.json();
      setarticle(data);
    } catch (error) {
      console.error('Error fetching article:', error.message);
    }
    setLoading(false);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        const response = await fetch(`/api/youtube?id=${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete blog');
        }
        setarticle(article.filter((blog) => blog._id !== id));
        toast.success('Blog deleted successfully!');
      } catch (error) {
        console.error('Error deleting blog:', error.message);
        toast.error('Failed to delete blog');
      }
    }
  };
  
  const getCategoriesArray = (categories) => {
    if (!categories) return [];
    if (Array.isArray(categories)) {
      return categories;
    }
    try {
      return JSON.parse(categories);
    } catch (e) {
      return categories.split(',').map(cat => cat.trim());
    }
  };

  const filteredarticle = article.flatMap((blog) => {
    const translations = blog.translations || {};
    return Object.entries(translations).map(([language, translation]) => {
      const categoryArray = getCategoriesArray(translation.category);
      const categoryMatch = !selectedCategory || selectedCategory === 'All' || categoryArray.includes(selectedCategory);
      const languageMatch = !selectedLanguage || selectedLanguage === 'All' || selectedLanguage === language;
      const searchMatch = !search || translation.title.toLowerCase().includes(search.toLowerCase());
      const draftMatch = showDrafts ? translation.isDraft : !translation.isDraft;
      return categoryMatch && languageMatch && searchMatch && draftMatch ? { ...translation, _id: blog._id, language, languages: Object.keys(translations).join(', ') } : null;
    }).filter(blog => blog !== null);
  });

  const indexOfLastBlog = currentPage * articlePerPage;
  const indexOfFirstBlog = indexOfLastBlog - articlePerPage;
  const currentarticle = filteredarticle.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredarticle.length / articlePerPage);

  const handleClick = (event, pageNumber) => {
    event.preventDefault();
    setCurrentPage(pageNumber);
  };

  const handleSelectBlog = (blogId) => {
    if (selectedarticle.includes(blogId)) {
      setSelectedarticle(selectedarticle.filter(id => id !== blogId));
    } else {
      setSelectedarticle([...selectedarticle, blogId]);
    }
  };

  const handleSelectAllarticle = () => {
    if (selectedarticle.length === currentarticle.length) {
      setSelectedarticle([]);
    } else {
      setSelectedarticle(currentarticle.map(blog => blog._id));
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-5">
        <h2 className="text-3xl font-semibold mb-6">All article</h2>
        <div className="mb-3 flex flex-wrap items-center">
          <input
            type="text"
            placeholder="Search by title"
            value={search}
            onChange={handleSearchChange}
            className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500 mb-3 md:mb-0"
          />
          <div className="relative ml-0 md:ml-3 mb-3 md:mb-0">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="relative ml-0 md:ml-3 mb-3 md:mb-0">
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm leading-tight focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Languages</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="zh-HANT">中国传统的</option>
              <option value="zh-HANS">简体中文</option>
              <option value="nl">Nederlands</option>
              <option value="gu">ગુજરાતી</option>
              <option value="hi">हिंदी</option>
              <option value="it">Italiano</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="pl">Polski</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <div className="relative ml-0 md:ml-3 mb-3 md:mb-0 flex items-center">
            <label className="mr-2">Show Drafts</label>
            <input
              type="checkbox"
              checked={showDrafts}
              onChange={(e) => setShowDrafts(e.target.checked)}
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="loader"></div>
          </div>
        ) : (
          <>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">
                    <input
                      type="checkbox"
                      checked={selectedarticle.length === currentarticle.length}
                      onChange={handleSelectAllarticle}
                    />
                  </th>
                  <th className="py-2 px-4 border-b">Title</th>
                  <th className="py-2 px-4 border-b">Category</th>
                  <th className="py-2 px-4 border-b">Languages</th>
                  <th className="py-2 px-4 border-b">Views</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentarticle.map((blog) => (
                  <tr key={blog._id}>
                    <td className="py-2 px-4 border-b">
                      <input
                        type="checkbox"
                        checked={selectedarticle.includes(blog._id)}
                        onChange={() => handleSelectBlog(blog._id)}
                      />
                    </td>
                    <td className="py-2 px-4 border-b">{blog.title}</td>
                    <td className="py-2 px-4 border-b">
                      {Array.isArray(blog.category) ? blog.category.join(', ') : blog.category}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {blog.languages}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="flex items-center">
                        <FaEye className="mr-1" /> {blog.viewCount}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b flex items-center justify-center">
                      <Link href={`/dashboard/edit-blog?id=${blog._id}`}>
                        <button className="mr-3 text-blue-500 hover:text-blue-700">
                          <FaEdit />
                        </button>
                      </Link>
                      <button onClick={() => handleDelete(blog._id)} className="text-red-500 hover:text-red-700">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-4">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={(event) => handleClick(event, index + 1)}
                  className={`mx-1 px-3 py-1 border rounded ${index + 1 === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 hover:bg-blue-100'}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <ToastContainer />
    </Layout>
  );
}

export default Allarticle;
