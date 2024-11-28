import React, { useState, useEffect } from 'react';
import Layout from './layout';
import Link from 'next/link';
import { FaEdit, FaTrash, FaEye,FaSearch  } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function Allarticle() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
    fetchArticles(currentPage);
  }, [showDrafts]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/yt-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();

      const formattedCategories = data.map((category) => {
        const translation = category.translations.en || {}; // Adjust for the desired language
        return {
          _id: category._id,
          name: translation.name || 'Unnamed Category',
          slug: translation.slug || '',
          description: translation.description || '',
        };
      });
      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (page = 1) => {
    setLoading(true);
    try {
      // Retrieve the token from localStorage, cookies, or headers
      const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Example token
  
      if (!token) {
        console.error('Authorization token is missing.');
        // Handle the missing token (e.g., show an error, redirect to login page, etc.)
        return;
      }
  
      // Make the API request with the Authorization header
      const response = await fetch(`/api/youtube?page=${page}&limit=${articlesPerPage}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) throw new Error('Failed to fetch articles');
  
      const responseData = await response.json();
      if (Array.isArray(responseData.data)) {
        setArticles(responseData.data);
        setTotalPages(responseData.meta.totalPages);
      } else {
        setArticles([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching articles:', error.message);
      setArticles([]);
      setTotalPages(1);
    }
    setLoading(false);
  };
  

  const getCategoriesArray = (categories) => {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories;
    try {
      return JSON.parse(categories);
    } catch {
      return String(categories)
        .split(',')
        .map((cat) => cat.trim());
    }
  };

  const filteredArticles = Array.isArray(articles)
    ? articles.flatMap((article) => {
        const translations = article.translations || {};
        return Object.entries(translations).map(([language, translation]) => {
          const categoryArray = getCategoriesArray(translation.category);
          const categoryMatch =
            !selectedCategory || selectedCategory === 'All' || categoryArray.includes(selectedCategory);
          const languageMatch =
            !selectedLanguage || selectedLanguage === 'All' || selectedLanguage === language;
          const searchMatch =
            !search || (translation.title && translation.title.toLowerCase().includes(search.toLowerCase()));
          const draftMatch = showDrafts ? translation.isDraft : !translation.isDraft;

          return categoryMatch && languageMatch && searchMatch && draftMatch
            ? {
                ...translation,
                _id: article._id,
                language,
                author: article.author,
                createdAt: article.createdAt,
                developer: article.developer,
                editor: article.editor,
              }
            : null;
        });
      }).filter((article) => article !== null)
    : [];

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        // Retrieve the token from localStorage, cookies, or headers
        const token = 'AZ-fc905a5a5ae08609ba38b046ecc8ef00'; // Example token
  
        if (!token) {
          console.error('Authorization token is missing.');
          toast.error('You are not authorized to delete this article.');
          return;
        }
  
        const response = await fetch(`/api/youtube?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the Bearer token in the header
          },
        });
  
        if (!response.ok) throw new Error('Failed to delete article');
  
        // Update the UI by removing the deleted article from the list
        setArticles(articles.filter((article) => article._id !== id));
  
        // Show success message
        toast.success('Article deleted successfully!');
      } catch (error) {
        console.error('Error deleting article:', error.message);
        toast.error('Failed to delete article');
      }
    }
  };
  

  const handleSelectAllArticles = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map((article) => article._id));
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    fetchArticles(pageNumber);
  };

  const renderPaginationButtons = () => {
    const totalPagesToShow = 5;
    const startPage = Math.max(currentPage - Math.floor(totalPagesToShow / 2), 1);
    const endPage = Math.min(startPage + totalPagesToShow - 1, totalPages);

    const buttons = [];
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 border rounded ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'bg-white text-blue-500 hover:bg-blue-100'
          }`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <Layout>
      <div className="container mx-auto p-5">
      <div className="flex flex-col md:flex-row justify-between items-center ms-4 mb-4 space-y-4 md:space-y-0">
  {/* Left side heading */}
  <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left">
    All Article
  </h2>

  {/* Right side search bar */}
  <div className="flex border border-gray-300 rounded-md overflow-hidden md:me-5 w-full md:w-64">
    <input
      type="text"
      value={search}
      onChange={handleSearchChange}
      placeholder="Title"
      className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
    />
    <button className="bg-[#071251] p-2 flex items-center justify-center">
      <FaSearch className="text-white" />
    </button>
  </div>
</div>
        <div className="mb-3 flex flex-wrap items-center">
         
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
          <Skeleton count={5} height={20} />
        ) : (
          <>
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-[#071251] text-white">
                <tr>
                  <th className="py-2 px-4 border-b">
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === filteredArticles.length}
                      onChange={handleSelectAllArticles}
                    />
                  </th>
                  <th className="py-2 px-4 border-b">Title</th>
                  <th className="py-2 px-4 border-b">Category</th>
                  <th className="py-2 px-4 border-b">Language</th>
                  <th className="py-2 px-4 border-b">View</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article._id}>
                    <td className="py-2 px-4 border-b">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article._id)}
                        onChange={() => handleSelectAllArticles(article._id)}
                      />
                    </td>
                    <td className="py-2 px-4 border-b">{article.title}</td>
                    <td className="py-2 px-4 border-b">{article.category || 'Uncategorized'}</td>
                    <td className="py-2 px-4 border-b">{article.language}</td>
                    <td className="py-2 px-4 border-b">
                      <Link
                        target="_blank"
                        href={`/youtube/${article.slug}`}
                        className="flex items-center"
                      >
                        <FaEye className="mr-1" />
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <Link href={`/dashboard/edit-article?id=${article._id}`}>
                        <FaEdit className="ml-3 text-blue-500 hover:text-blue-700" />
                      </Link>
                      <button
                        onClick={() => handleDelete(article._id)}
                        className="ml-3 text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-4">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="mx-1 px-3 py-1 border rounded bg-white text-blue-500 hover:bg-blue-100"
                >
                  Previous
                </button>
              )}
              {renderPaginationButtons()}
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="mx-1 px-3 py-1 border rounded bg-white text-blue-500 hover:bg-blue-100"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
        <ToastContainer />
      </div>
    </Layout>
  );
}

export default Allarticle;
