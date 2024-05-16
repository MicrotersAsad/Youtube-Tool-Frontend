import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log("Layout component - User: ", user); // Debugging
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={`fixed inset-0 z-30 bg-black opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-white transition duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-center mt-8">
          <div className="text-2xl font-semibold text-gray-700">Admin Dashboard</div>
        </div>
        <nav className="mt-10">
          <Link href="/dashboard/dashboard">
            <p className="flex items-center mt-4 py-2 px-6 text-gray-700 bg-gray-200">
              <span className="mx-3">Dashboard</span>
            </p>
          </Link>
          {user && user.role === 'admin' && (
            <Link href="/dashboard/users">
              <p className="flex items-center mt-4 py-2 px-6 text-gray-600 hover:bg-gray-200 hover:text-gray-700">
                <span className="mx-3">Users</span>
              </p>
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link href="/dashboard/about">
              <p className="flex items-center mt-4 py-2 px-6 text-gray-600 hover:bg-gray-200 hover:text-gray-700">
                <span className="mx-3">About</span>
              </p>
            </Link>
          )}
         
          {user && (
            <Link href="/user/profile">
              <p className="flex items-center mt-4 py-2 px-6 text-gray-600 hover:bg-gray-200 hover:text-gray-700">
                <span className="mx-3">Change Profile</span>
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
