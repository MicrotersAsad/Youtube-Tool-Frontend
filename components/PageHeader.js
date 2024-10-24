import React from 'react';
import Link from 'next/link';

const PageHeader = ({ title, breadcrumb }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-teal-500 py-10">
      <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{title}</h1>
        <nav className="mt-4">
          <ol className="flex items-center justify-center text-white">
            {breadcrumb.map((item, index) => (
              <li key={index} className="flex items-center">
                {item.link ? (
                  <Link href={item.link}>
                    <p className="breadcrumb-item">{item.label}</p>
                  </Link>
                ) : (
                  <span className="breadcrumb-item">{item.label}</span>
                )}
                {index < breadcrumb.length - 1 && (
                  <svg
                    className="h-5 w-5 mx-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      {/* Add custom styles using styled-jsx */}
      <style jsx>{`
        .breadcrumb-item {
          display: inline-block;
          transition: color 0.3s ease-in-out;
        }
        .breadcrumb-item:hover {
          color: #ffeb3b; /* Change color on hover for better visibility */
        }
      `}</style>
    </div>
  );
};

export default PageHeader;
