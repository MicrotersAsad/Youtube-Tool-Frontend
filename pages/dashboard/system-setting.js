import Link from 'next/link';
import React from 'react';
import { FaUsers, FaUserCheck, FaEnvelope, FaCrown, FaUser,FaUserAlt ,FaFileAlt ,FaTools ,FaStar ,FaSitemap ,FaComment ,FaChartLine ,FaSignInAlt , FaChevronRight, FaCog, FaGlobe, FaRobot, FaBell, FaRemoveFormat, FaCss3, FaPuzzlePiece, FaDollarSign } from 'react-icons/fa';
import Layout from './layout';
const Setting = () => {
    return (
        <Layout>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
  <Link href="logo-icon">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaCog className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">General Setting</h3>
        <p className="text-sm text-gray-500">Configure the fundamental information of the site.</p>
      </div>
    </div>
  </Link>

  <Link href="seo-config">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaGlobe className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">SEO Configuration</h3>
        <p className="text-sm text-gray-500">Configure proper meta title, meta description, meta keywords, etc to make the system SEO-friendly.</p>
      </div>
    </div>
  </Link>

  <Link href="payment-config">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaDollarSign className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Payment Configuration</h3>
        <p className="text-sm text-gray-500">Configure proper Payment Info.</p>
      </div>
    </div>
  </Link>
  <Link href="firebase-push-notification">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaBell className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Firebase Push Notification</h3>
        <p className="text-sm text-gray-500">Control and configure overall notification elements of the system.</p>
      </div>
    </div>
  </Link>
  <Link href="clear-cache">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaRemoveFormat className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Clear System Cache</h3>
        <p className="text-sm text-gray-500">Clear your system cache to ensure optimal performance and remove temporary files.</p>

      </div>
    </div>
  </Link>
  <Link href="custom-css">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaCss3 className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Custom CSS</h3>
        <p className="text-sm text-gray-500">Write custom css here to modify some styles of frontend of the system if you need to.</p>
      </div>
    </div>
  </Link>
  <Link href="maintenance-mode">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaRobot className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Maintenance Mode</h3>
        <p className="text-sm text-gray-500">Enable or disable the maintenance mode of the system when required.</p>
      </div>
    </div>
  </Link>
  <Link href="sitemap_index">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaSitemap className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Sitemap XML</h3>
        <p className="text-sm text-gray-500">Insert the sitemap XML here to enhance SEO performance.</p>
      </div>
    </div>
  </Link>
  <Link href="robots-txt">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaRobot className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Robots txt</h3>
        <p className="text-sm text-gray-500">Insert the robots.txt content here to enhance bot web crawlers and instruct them on how to interact with certain areas of the website.</p>
      </div>
    </div>
  </Link>
  <Link href="extension">
    <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4 h-full">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="p-3 rounded-md border bg-primary">
          <FaPuzzlePiece className="text-white fs-1" />
        </div>
      </div>
      <div className="flex flex-col justify-between ml-4">
        <h3 className="text-black pt-2">Extension</h3>
        <p className="text-sm text-gray-500">Manage extensions of the system here to extend some extra features of the system.</p>
      </div>
    </div>
  </Link>
</div>



      </Layout>
    );
};

export default Setting ;