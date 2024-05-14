/* eslint-disable react/no-unescaped-entities */

import { Fragment, useState, useEffect } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import logo from "../public/yt icon.png"
import Image from 'next/image';
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navigation = [
  { name: 'Home', href: '/', current: true },
  { name: 'Tools', href: '#', current: false, dropdown: true, children: [
      { name: 'Tag Generator', href: '/tools/tagGenerator' },
      { name: 'Tag Extractor', href: '/tools/tagExtractor' },
      { name: 'Title & Description Generator', href: '/tools/youtube-title-and-description-generator' },
      { name: 'Title & Description Extractor', href: '/tools/youtube-title-and-description-extractor' },
      { name: 'Youtube Thumbnails Generator', href: '/tools/youtube-thumbnail' },
      { name: 'YouTube Hashtag Generator', href: '/tools/YouTube-Hashtag-Generator' },
      { name: 'YouTube Embed Code Generator', href: '/tools/YouTube-Embed-Code-Generator' },
      { name: 'YouTube Channel Banner Downloader', href: '/tools/YouTube-Channel-Banner-Downloader' },
      { name: 'YouTube Channel Logo Downloader', href: '/tools/YouTube-Channel-Logo-Downloader' }
    ] },
  { name: 'About', href: '/about', current: false },
  { name: 'Privacy & Policy', href: '/privacy', current: false },

];

function Navbar() {
  const { isLoggedIn, login, logout } = useAuth(); // Use the authentication context

  return (
    <>
      {/* Disclosure component for responsive navigation */}
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                {/* Logo */}
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? <XMarkIcon className="block h-6 w-6" aria-hidden="true" /> : <Bars3Icon className="block h-6 w-6" aria-hidden="true" />}
                  </Disclosure.Button>
                </div>
                <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex-shrink-0 flex items-center">
                  <Image 
                    src={logo}
                    alt="GFG logo served with static path of public directory"
                    height="70"
                    width="150"
                /> 
                    {/* Logo */}
                  </div>
                  <div className="hidden sm:block sm:ml-6 mx-auto">
                    <div className="flex space-x-4">
                      {/* Navigation links */}
                      {navigation.map((item) => (
                        item.dropdown ? (
                          <Menu as="div" key={item.name} className="relative">
                            <Menu.Button className="flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
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
                              <Menu.Items className="absolute z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                {item.children.map((subItem) => (
                                  <Menu.Item key={subItem.name}>
                                    {({ active }) => (
                                      <Link href={subItem.href} className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                                        {subItem.name}
                                      </Link>
                                    )}
                                  </Menu.Item>
                                ))}
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        ) : (
                          <Link key={item.name} href={item.href} aria-current={item.current ? 'page' : undefined} className={classNames(
                              item.current ?  'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                              'px-3 py-2 rounded-md text-sm font-medium'
                            )}>
                            {item.name}
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                </div>
                {/* Login/Logout buttons */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  {isLoggedIn ? (
                    // Render Logout button if logged in
                    <button onClick={logout} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium btn btn-danger">
                      Logout
                    </button>
                  ) : (
                    // Render Login button if not logged in
                    <Link href="/login"> {/* Navigate to the login page */}
                      <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium btn btn-success">
                        Login
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {/* Responsive mobile menu */}
            <Disclosure.Panel className="sm:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Mobile menu links */}
                {navigation.map((item) => (
                  item.dropdown ? (
                    <Menu as="div" key={item.name} className="px-2 py-3 space-y-1">
                      <Menu.Button className="w-full text-left flex items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium">
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
                                <Link href={subItem.href} className={classNames(active ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white')}>
                                  {subItem.name}
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <Link key={item.name} href={item.href} className={classNames(
                      item.current ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'block px-3 py-2 rounded-md text-base font-medium'
                    )}>
                      {item.name}
                    </Link>
                  )
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
}

export default Navbar;
