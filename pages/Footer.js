/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import React from 'react';

const Footer = () => {
    return (
        <div>
            <footer className="bg-gray-900 text-white py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
      {/* <!-- Solutions Column --> */}
      <div>
        <h5 className="text-sm font-semibold uppercase">Solutions</h5>
        <ul className="mt-4 space-y-2">
          <li><a href="#" className="text-gray-300 hover:text-white">Marketing</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">Analytics</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">Commerce</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">Insights</a></li>
        </ul>
      </div>
      {/* <!-- Support Column --> */}
      <div>
        <h5 className="text-sm font-semibold uppercase">Support</h5>
        <ul className="mt-4 space-y-2">
          <li><a href="#" className="text-gray-300 hover:text-white">Pricing</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">Documentation</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">Guides</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">API Status</a></li>
        </ul>
      </div>
      {/* <!-- Company Column --> */}
      <div>
        <h5 className="text-sm font-semibold uppercase">Company</h5>
        <ul className="mt-4 space-y-2">
          <li><Link href="#" className="text-gray-300 hover:text-white">About</Link></li>
          <li><Link href="#" className="text-gray-300 hover:text-white">Blog</Link></li>
          <li><Link href="#" className="text-gray-300 hover:text-white">Jobs</Link></li>
          <li><Link href="/terms" className="text-gray-300 hover:text-white">Terms & Service</Link></li>
          <li><Link href="#" className="text-gray-300 hover:text-white">Partners</Link></li>
        </ul>
      </div>
      {/* <!-- Legal Column --> */}
      <div>
        <h5 className="text-sm font-semibold uppercase">Legal</h5>
        <ul className="mt-4 space-y-2">
          <li><a href="#" className="text-gray-300 hover:text-white">Claim</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">Privacy</a></li>
          <li><a href="#" className="text-gray-300 hover:text-white">Terms</a></li>
        </ul>
      </div>
      {/* <!-- Newsletter Column --> */}
      <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
  <h5 className="text-sm font-semibold uppercase">Subscribe to our newsletter</h5>
  <p className="mt-2 text-gray-400">The latest news, articles, and resources, sent to your inbox weekly.</p>
  <form action="#" method="POST" className="mt-4">
    <div className="flex flex-col mt-1 space-y-2">
      <input type="email" name="email" className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-3 pt-3 pb-3 sm:text-sm border-gray-300 rounded-md" placeholder="Enter your email"/>
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Subscribe</button>
    </div>
  </form>
</div>

    </div>
    <div className="mt-12 border-t border-gray-700 pt-8">
      <p className="text-base text-gray-400 xl:text-center">&copy; 2024 Microters, Inc. All rights reserved.</p>
    </div>
  </div>
</footer>

        </div>
    );
};

export default Footer;