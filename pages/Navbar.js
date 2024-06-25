import { Fragment, useEffect, useState } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import logo from "../public/yt icon.png";
import Image from 'next/image';
import {
  FaTags, FaSearch, FaPenAlt, FaFileAlt, FaImage, FaHashtag, FaCode, FaFlag, FaIdCard, FaVideo, FaDollarSign,
  FaBook,
  FaLink
} from 'react-icons/fa';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navigation = [
  { name: 'Home', href: '/', dropdown: false },
  {
    name: 'Youtube Tools', href: '#', dropdown: true, children: [
      { name: 'Tag Generator', href: '/tools/tagGenerator', icon: <FaTags /> },
      { name: 'Tag Extractor', href: '/tools/tagExtractor', icon: <FaSearch /> },
      { name: 'Title & Description Generator', href: '/tools/youtube-title-and-description-generator', icon: <FaPenAlt /> },
      { name: 'Title & Description Extractor', href: '/tools/youtube-title-and-description-extractor', icon: <FaFileAlt /> },
      { name: 'Youtube Thumbnails Generator', href: '/tools/youtube-thumbnail', icon: <FaImage /> },
      { name: 'YouTube Hashtag Generator', href: '/tools/YouTube-Hashtag-Generator', icon: <FaHashtag /> },
      { name: 'YouTube Embed Code Generator', href: '/tools/YouTube-Embed-Code-Generator', icon: <FaCode /> },
      { name: 'YouTube Channel Banner Downloader', href: '/tools/YouTube-Channel-Banner-Downloader', icon: <FaFlag /> },
      { name: 'YouTube Channel Logo Downloader', href: '/tools/YouTube-Channel-Logo-Downloader', icon: <FaIdCard /> },
      { name: 'Channel Id Finder', href: '/tools/channel-id-finder', icon: <FaIdCard /> },
      { name: 'Video data viewer', href: '/tools/video-data-viewer', icon: <FaVideo /> },
      { name: 'Monetization Checker', href: '/tools/monetization-checker', icon: <FaDollarSign /> },
      { name: 'YouTube Channel Details Finder', href: '/tools/YouTube-Channel-Details-Finder', icon: <FaSearch /> },
      { name: 'YouTube Video Summary Generator', href: '/tools/YouTube-Video-Summary-Generator', icon: <FaBook /> },
      { name: 'Case Converter', href: '/tools/case-converter', icon: <FaLink /> }
    ]
  },
  { name: 'Pricing', href: '/pricing', dropdown: false },
  { name: 'Blog', href: '/blog', dropdown: false },
  { name: 'About Us', href: '/about', dropdown: false },
  { name: 'Contact Us', href: '/contact', dropdown: false },
];

function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery) {
      // Fetch search results from your API
      fetch(`/api/search?query=${searchQuery}`)
        .then(response => response.json())
        .then(data => setSearchResults(data.results))
        .catch(error => console.error('Error fetching search results:', error));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.push(`/search?query=${searchQuery}`);
  };

  return (
    <>
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? <XMarkIcon className="block h-6 w-6" aria-hidden="true" /> : <Bars3Icon className="block h-6 w-6" aria-hidden="true" />}
                  </Disclosure.Button>
                </div>
                <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href='/'>
                      <Image 
                        src={logo}
                        alt="GFG logo served with static path of public directory"
                        height="70"
                        width="150"
                      />
                    </Link>
                  </div>
                  <div className="hidden sm:block sm:ml-6 mx-auto">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        item.dropdown ? (
                          <Menu as="div" key={item.name} className="relative">
                            <Menu.Button className={classNames(
                              router.pathname.startsWith('/tools') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                              'flex items-center px-3 py-2 rounded-md text-sm font-medium'
                            )}>
                              {item.name} <ChevronDownIcon className="ml-2 h-5 w-5" aria-hidden="true"/>
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-200"
                              enterFrom="opacity-0 translate-y-1"
                              enterTo="opacity-100 translate-y-0"
                              leave="transition ease-in duration-150"
                              leaveFrom="opacity-100 translate-y-0"
                              leaveTo="opacity-0 translate-y-1"
                            >
                              <Menu.Items className="absolute z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                {item.children.map((subItem) => (
                                  <Menu.Item key={subItem.name}>
                                    {({ active }) => (
                                      <Link href={subItem.href} className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 border hover:text-red-500')}>
                                        <span className="flex items-center">
                                          {subItem.icon}
                                          <span className="ml-2">{subItem.name}</span>
                                        </span>
                                      </Link>
                                    )}
                                  </Menu.Item>
                                ))}
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        ) : (
                          <Link key={item.name} href={item.href} className={classNames(
                            router.pathname === item.href ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                            'px-3 py-2 rounded-md text-sm font-medium'
                          )}>
                            {item.name}
                          </Link>
                        )
                      ))}
                      {user && (
                        <Link href="/dashboard/dashboard" className={classNames(
                          router.pathname === '/dashboard/dashboard' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                          'px-3 py-2 rounded-md text-sm font-medium'
                        )}>
                          Dashboard
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <form onSubmit={handleSearchSubmit} className="hidden sm:block relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="px-3 py-2 rounded-md bg-gray-700 text-black border-transparent focus:border-gray-500 focus:bg-white focus:ring-0 text-sm"
                    />
                    {searchQuery && searchResults.length > 0 && (
                      <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                        {searchResults.map(result => (
                          <Link key={result.id} href={result.href}>
                            <span className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{result.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </form>
                  {user ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                          <span className="sr-only">Open user menu</span>
                          {user.profileImage ? (
                            <Image
                              src={`data:image/jpeg;base64,${user.profileImage}`}
                              alt="Profile"
                              className="w-8 h-8 rounded-full"
                              width={50}
                              height={50}
                            />
                          ) : (
                            <span className="text-gray-500">No Image</span>
                          )}
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Menu.Items className="origin-top-right absolute z-10 right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link href="/user/profile" className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                                Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <Link href="/dashboard/dashboard" className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                                Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={logout} className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                                Logout
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <Link href="/login">
                      <button className="text-gray-300 bg-red-700 hover:text-red-500 hover:bg-gray-700 px-3 py-2 ms-3 rounded-md text-sm font-medium">
                        Login
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <Disclosure.Panel className="sm:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  item.dropdown ? (
                    <Menu as="div" key={item.name} className="px-2 py-3 space-y-1">
                      <Menu.Button className="w-full text-left flex items-center text-gray-300 hover:text-red-500 hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium">
                        {item.name} <ChevronDownIcon className="ml-auto h-5 w-5" aria-hidden="true"/>
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Menu.Items className="flex flex-col pl-4 space-y-1">
                          {item.children.map((subItem) => (
                            <Menu.Item key={subItem.name}>
                              {({ active }) => (
                                <Link href={subItem.href} className={classNames(active ? 'text-gray-300 hover:text-red-500 hover:bg-gray-700' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700')}>
                                  <span className="flex items-center">
                                    {subItem.icon}
                                    <span className="ml-2">{subItem.name}</span>
                                  </span>
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <Link key={item.name} href={item.href} className={classNames(
                      router.pathname === item.href ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                      'block px-3 py-2 rounded-md text-base font-medium'
                    )}>
                      {item.name}
                    </Link>
                  )
                ))}
                {user && (
                  <Link href="/dashboard/dashboard" className={classNames(
                    router.pathname === '/dashboard/dashboard' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                    'block px-3 py-2 rounded-md text-base font-medium'
                  )}>
                    Dashboard
                  </Link>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
}

export default Navbar;
