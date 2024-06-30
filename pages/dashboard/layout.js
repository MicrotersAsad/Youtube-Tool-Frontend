import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaTachometerAlt,
  FaUsers,
  FaInfoCircle,
  FaLock,
  FaFileAlt,
  FaUser,
  FaChevronDown,
  FaChevronRight,
  FaFolderOpen,
  FaBlog,
  FaPlusCircle,
  FaNotEqual,
  FaAngleRight,
  FaBell,
  FaSearch,
  FaStarHalfAlt,
  FaKey
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentManagementOpen, setContentManagementOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      router.pathname === '/dashboard/categories' ||
      router.pathname === '/dashboard/blogs' ||
      router.pathname === '/dashboard/all-blogs'
    ) {
      setContentManagementOpen(true);
    }
  }, [user, router.pathname]);

  const isActiveRoute = (route) => {
    return router.pathname === route;
  };

  const toggleContentManagement = () => {
    setContentManagementOpen(!contentManagementOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={`fixed inset-0 z-30 bg-black opacity-50 transition-opacity lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-white shadow-lg transition duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-center mt-8">
          <div className="text-2xl font-semibold text-gray-700">Admin Dashboard</div>
        </div>
        <nav className="mt-10">
          <Link href="/dashboard/dashboard" passHref>
            <p
              className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                isActiveRoute('/dashboard/dashboard')
                  ? 'bg-gray-300 text-gray-700'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              <FaTachometerAlt className="mr-3" /> <span className="mx-3">Dashboard</span>
            </p>
          </Link>
          {user && (user.role === 'admin') && (
            <Link href="/dashboard/users" passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/users')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaUsers className="mr-3" /> <span className="mx-3">Users</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <div>
              <div
                onClick={toggleContentManagement}
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  contentManagementOpen
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaFolderOpen className="mr-3" /> <span className="mx-3">Blogs</span>
                <span className="ml-auto">{contentManagementOpen ? <FaChevronDown /> : <FaChevronRight />}</span>
              </div>
              {contentManagementOpen && (
                <div className="ml-6">
                  <Link href="/dashboard/categories" passHref>
                    <p
                      className={`flex items-center mt-2 py-2 px-6 cursor-pointer rounded-md ${
                        isActiveRoute('/dashboard/categories')
                          ? 'bg-gray-300 text-gray-700'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                    >
                      <FaPlusCircle className="mr-3" /> <span className="mx-3">Add Categories</span>
                    </p>
                  </Link>
                  <Link href="/dashboard/blogs" passHref>
                    <p
                      className={`flex items-center mt-2 py-2 px-6 cursor-pointer rounded-md ${
                        isActiveRoute('/dashboard/blogs')
                          ? 'bg-gray-300 text-gray-700'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                    >
                      <FaPlusCircle className="mr-3" /> <span className="mx-3">Add Blog</span>
                    </p>
                  </Link>
                  <Link href="/dashboard/all-blogs" passHref>
                    <p
                      className={`flex items-center mt-2 py-2 px-6 cursor-pointer rounded-md ${
                        isActiveRoute('/dashboard/all-blogs')
                          ? 'bg-gray-300 text-gray-700'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                    >
                      <FaBlog className="mr-3" /> <span className="mx-3">All Blogs</span>
                    </p>
                  </Link>
                </div>
              )}
            </div>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/about" passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/about')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaInfoCircle className="mr-3" /> <span className="mx-3">About</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/privacy" passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/privacy')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaLock className="mr-3" /> <span className="mx-3">Privacy</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/terms" passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/terms')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaFileAlt className="mr-3" /> <span className="mx-3">Terms of Service</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/content" passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/content')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaFileAlt className="mr-3" /> <span className="mx-3">Content</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/notice" passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/notice')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaBell className="mr-3" /> <span className="mx-3">Add Notice</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/review " passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/review')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaStarHalfAlt className="mr-3" /> <span className="mx-3">All Review</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/addYtApi " passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/addYtApi')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaKey className="mr-3" /> <span className="mx-3">Add ytkey</span>
              </p>
            </Link>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <Link href="/dashboard/addopenaiKey " passHref>
              <p
                className={`flex items-center mt-4 py-2 px-6 cursor-pointer rounded-md ${
                  isActiveRoute('/dashboard/addopenaiKey')
                    ? 'bg-gray-300 text-gray-700'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <FaKey className="mr-3" /> <span className="mx-3">Add openaiKey</span>
              </p>
            </Link>
          )}
        </nav>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b-4 border-gray-200">
          <div className="flex items-center">
            <button className="text-gray-500 focus:outline-none lg:hidden" onClick={() => setSidebarOpen(true)}>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-2 rounded-md bg-gray-100 border-transparent focus:border-gray-500 focus:bg-white focus:ring-0 text-sm"
                placeholder="Search"
              />
              <FaSearch className="absolute top-3 right-3 text-gray-400" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
