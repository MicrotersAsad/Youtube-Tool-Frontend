// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import Image from 'next/image';
// import Link from 'next/link';
// import { ClipLoader } from 'react-spinners'; // Import ClipLoader from react-spinners

// const BlogSection = () => {
//   const [blogs, setBlogs] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchBlogs = async () => {
//       try {
//         const response = await axios.get('/api/blogs');
//         console.log(response.data);
//         setBlogs(response.data);
//         setLoading(false); // Stop loading after data is fetched
//       } catch (error) {
//         console.error('Error fetching blogs:', error);
//         setLoading(false); // Stop loading even if there is an error
//       }
//     };

//     fetchBlogs();
//   }, []);

//   const parseCategories = (categories) => {
//     if (Array.isArray(categories)) {
//       return categories;
//     }
//     try {
//       return JSON.parse(categories);
//     } catch (error) {
//       return categories ? categories.split(',') : [];
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <ClipLoader size={50} color={"#123abc"} loading={loading} />
//       </div>
//     ); // Display loader while fetching data
//   }

//   if (blogs.length === 0) {
//     return <p>No blogs available.</p>; // Show a message if no blogs are available
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
//       <div className="container mx-auto px-4 p-5">
      // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">
      //     <div >
      //       {blogs.slice(0, 1).map((blog, index) => (
      //         <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
      //           <Image
      //             src={`data:image/jpeg;base64,${blog.image}`}
      //             alt={blog.Blogtitle}
      //             width={600}
      //             height={400}
      //           />
      //           <div className="p-6">
      //             <h3 className="text-3xl font-semibold mb-2">
      //               <Link href={`/blog/${blog._id}`} className="text-blue-500 hover:underline">{blog.Blogtitle}</Link>
      //             </h3>
      //             <p className="text-gray-600 mb-4">{blog.description}</p>
      //             <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
      //             <div className="mt-2">
      //               {parseCategories(blog.categories).map((category, i) => (
      //                 <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
      //               ))}
      //             </div>
      //           </div>
      //         </div>
      //       ))}
      //     </div>
      //     <div className="space-y-4">
      //       {blogs.slice(1, 4).map((blog, index) => (
      //         <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col md:flex-row">
      //           <Image
      //             src={`data:image/jpeg;base64,${blog.image}`}
      //             alt={blog.Blogtitle}
      //             width={280}
      //             height={100}
      //             className="object-cover rounded-lg blog-img"
      //           />
      //           <div className="p-4">
      //             <h4 className="text-lg font-semibold">
      //               <Link href={`/blog/${blog._id}`} className="text-blue-500 hover:underline">{blog.Blogtitle}</Link>
      //             </h4>
      //             <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
      //             <div className="mt-2">
      //               {parseCategories(blog.categories).map((category, i) => (
      //                 <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
      //               ))}
      //             </div>
      //           </div>
      //         </div>
      //       ))}
      //     </div>
      //   </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
//           {blogs.slice(4).map((blog, index) => (
//             <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
//               <Image
//                 src={`data:image/jpeg;base64,${blog.image}`}
//                 alt={blog.Blogtitle}
//                 width={600}
//                 height={400}
//               />
//               <div className="p-4">
//                 <h4 className="text-lg font-semibold">
//                   <Link href={`/blog/${blog._id}`} className="text-blue-500 hover:underline">{blog.Blogtitle}</Link>
//                 </h4>
//                 <p className="text-gray-500 text-sm">By {blog.author} · {new Date(blog.createdAt).toLocaleDateString()}</p>
//                 <div className="mt-2">
//                   {parseCategories(blog.categories).map((category, i) => (
//                     <span key={i} className="text-sm bg-gray-200 text-gray-700 rounded-full px-2 py-1 mr-2">{category}</span>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BlogSection;


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { ClipLoader } from 'react-spinners'; // Import ClipLoader from react-spinners

const BlogSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 9;

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get('/api/blogs');
        console.log(response.data);
        setBlogs(response.data);
        setLoading(false); // Stop loading after data is fetched
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setLoading(false); // Stop loading even if there is an error
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

  // Calculate the blogs to be displayed on the current page
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = blogs.slice(indexOfFirstBlog, indexOfLastBlog);

  // Handle pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader size={50} color={"#123abc"} loading={loading} />
      </div>
    ); // Display loader while fetching data
  }

  if (blogs.length === 0) {
    return <p>No blogs available.</p>; // Show a message if no blogs are available
  }

  const totalPages = Math.ceil(blogs.length / blogsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <div className="container mx-auto px-4 p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">
          <div >
            {blogs.slice(0, 1).map((blog, index) => (
              <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
                <Image
                  src={`data:image/jpeg;base64,${blog.image}`}
                  alt={blog.Blogtitle}
                  width={600}
                  height={400}
                />
                <div className="p-6">
                  <h3 className="text-3xl font-semibold mb-2">
                    <Link href={`/blog/${blog._id}`} className="text-blue-500 hover:underline">{blog.Blogtitle}</Link>
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
                  src={`data:image/jpeg;base64,${blog.image}`}
                  alt={blog.Blogtitle}
                  width={280}
                  height={100}
                  className="object-cover rounded-lg blog-img"
                />
                <div className="p-4">
                  <h4 className="text-lg font-semibold">
                    <Link href={`/blog/${blog._id}`} className="text-blue-500 hover:underline">{blog.Blogtitle}</Link>
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
        {/* Header Section */}
      <div className="bg-blue-50 py-16 mt-10 mb-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-800">YtubeTools your conversion rates with cold emailing</h1>
          <div className="mt-6">
            <input 
              type="email" 
              placeholder="Enter your work email" 
              className="p-3 border border-gray-300 rounded-l-md"
            />
            <button 
              className="p-3 bg-blue-500 text-white rounded-r-md hover:bg-blue-600">
              Sign up for free
            </button>
          </div>
        </div>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {currentBlogs.slice(4).map((blog, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg overflow-hidden">
              <Image
                src={`data:image/jpeg;base64,${blog.image}`}
                alt={blog.Blogtitle}
                width={600}
                height={400}
              />
              <div className="p-4">
                <h4 className="text-lg font-semibold">
                  <Link href={`/blog/${blog._id}`} className="text-blue-500 hover:underline">{blog.Blogtitle}</Link>
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
        <div className="flex justify-center mt-6">
          <ul className="inline-flex items-center -space-x-px">
            {Array.from({ length: totalPages }, (_, index) => (
              <li key={index}>
                <button
                  onClick={() => paginate(index + 1)}
                  className={`px-3 py-2 ml-0 leading-tight ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                >
                  {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlogSection;
