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
      const response = await fetch('/api/yt-categories');
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
    if (window.confirm('Are you sure you want to delete this youtube?')) {
      try {
        const response = await fetch(`/api/youtube?id=${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete youtube');
        }
        setarticle(article.filter((youtube) => youtube._id !== id));
        toast.success('youtube deleted successfully!');
      } catch (error) {
        console.error('Error deleting youtube:', error.message);
        toast.error('Failed to delete youtube');
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

  const filteredarticle = article.flatMap((youtube) => {
    const translations = youtube.translations || {};
    return Object.entries(translations).map(([language, translation]) => {
      const categoryArray = getCategoriesArray(translation.category);
      const categoryMatch = !selectedCategory || selectedCategory === 'All' || categoryArray.includes(selectedCategory);
      const languageMatch = !selectedLanguage || selectedLanguage === 'All' || selectedLanguage === language;
      const searchMatch = !search || translation.title.toLowerCase().includes(search.toLowerCase());
      const draftMatch = showDrafts ? translation.isDraft : !translation.isDraft;
      return categoryMatch && languageMatch && searchMatch && draftMatch ? { ...translation, _id: youtube._id, language, languages: Object.keys(translations).join(', ') } : null;
    }).filter(youtube => youtube !== null);
  });

  const indexOfLastyoutube = currentPage * articlePerPage;
  const indexOfFirstyoutube = indexOfLastyoutube - articlePerPage;
  const currentarticle = filteredarticle.slice(indexOfFirstyoutube, indexOfLastyoutube);
  const totalPages = Math.ceil(filteredarticle.length / articlePerPage);

  const handleClick = (event, pageNumber) => {
    event.preventDefault();
    setCurrentPage(pageNumber);
  };

  const handleSelectyoutube = (youtubeId) => {
    if (selectedarticle.includes(youtubeId)) {
      setSelectedarticle(selectedarticle.filter(id => id !== youtubeId));
    } else {
      setSelectedarticle([...selectedarticle, youtubeId]);
    }
  };

  const handleSelectAllarticle = () => {
    if (selectedarticle.length === currentarticle.length) {
      setSelectedarticle([]);
    } else {
      setSelectedarticle(currentarticle.map(youtube => youtube._id));
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
                {currentarticle.map((youtube) => (
                  <tr key={youtube._id}>
                    <td className="py-2 px-4 border-b">
                      <input
                        type="checkbox"
                        checked={selectedarticle.includes(youtube._id)}
                        onChange={() => handleSelectyoutube(youtube._id)}
                      />
                    </td>
                    <td className="py-2 px-4 border-b">{youtube.title}</td>
                    <td className="py-2 px-4 border-b">
                      {Array.isArray(youtube.category) ? youtube.category.join(', ') : youtube.category}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {youtube.languages}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className="flex items-center">
                        <FaEye className="mr-1" /> {youtube.viewCount}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b flex items-center justify-center">
                      <Link href={`/dashboard/edit-article?id=${youtube._id}`}>
                        <button className="mr-3 text-blue-500 hover:text-blue-700">
                          <FaEdit />
                        </button>
                      </Link>
                      <button onClick={() => handleDelete(youtube._id)} className="text-red-500 hover:text-red-700">
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
