import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { ClipLoader } from 'react-spinners';

const BlogSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 9;

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get('/api/blogs');
        setBlogs(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const parseCategories = (categories) => {
    if (Array.isArray(categories)) {
      return categories;
    }
    try {
      return JSON.parse(categories);
    } catch (error) {
      return categories ? categories.split(',') : [];
    }
  };

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = blogs.slice(indexOfFirstBlog, indexOfLastBlog);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    );
  }

  if (blogs.length === 0) {
    return <p>No blogs available.</p>;
  }

  const totalPages = Math.ceil(blogs.length / blogsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <div className="container mx-auto px-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">
          <div>
            {blogs.slice(0, 1).map((blog, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
                <Image
                  src={`${blog.image}`}
                  alt={blog.title}
                  width={600}
                  height={400}
                />
                <div className="p-6">
                  <h3 className="text-3xl font-semibold mb-2">
                    <Link href={`/blog/${blog.slug}`} className="text-blue-500 hover:underline">{blog.title}</Link>
                  </h3>
                  <p className="text-gray-600 mb-4">{blog.description}</p>
                  <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                  <div className="mt-2">
                    {parseCategories(blog.categories).map((category, i) => (
                      <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {blogs.slice(1, 4).map((blog, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col md:flex-row">
                <Image
                  src={`${blog.image}`}
                  alt={blog.title}
                  width={280}
                  height={100}
                  className="object-cover rounded-lg blog-img"
                />
                <div className="p-4">
                  <h4 className="text-lg font-semibold">
                    <Link href={`/blog/${blog.slug}`} className="text-blue-500 hover:underline">{blog.title}</Link>
                  </h4>
                  <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
                  <div className="mt-2">
                    {parseCategories(blog.categories).map((category, i) => (
                      <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogSection;
