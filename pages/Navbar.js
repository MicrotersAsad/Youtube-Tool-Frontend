import React, { Fragment, useState } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import logo from '../public/yt icon.png';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import 'flag-icons/css/flag-icons.min.css'; // Import flag-icons CSS

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const availableLanguages = [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'zh-HANT', name: '中国传统的', flag: 'cn' },
  { code: 'zh-HANS', name: '简体中文', flag: 'cn' },
  { code: 'nl', name: 'Nederlands', flag: 'nl' },
  { code: 'gu', name: 'ગુજરાતી', flag: 'in' },
  { code: 'hi', name: 'हिंदी', flag: 'in' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'ja', name: '日本語', flag: 'jp' },
  { code: 'ko', name: '한국어', flag: 'kr' },
  { code: 'pl', name: 'Polski', flag: 'pl' },
  { code: 'pt', name: 'Português', flag: 'pt' },
  { code: 'ru', name: 'Русский', flag: 'ru' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'de', name: 'Deutsch', flag: 'de' },
];

function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation('navbar');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const changeLanguage = async (lang) => {
    if (availableLanguages.find(l => l.code === lang)) {
      setSelectedLanguage(lang);
      await i18n?.changeLanguage(lang);
      router.push(router.pathname, router.asPath, { locale: lang });
    }
  };

  const navigation = [
    { key: "Home", href: '/', dropdown: false },
    {
      key: 'YouTube Tools', href: '#', dropdown: true, children: [
        { key: 'YouTube Tag Extractor', href: '/tools/tag-extractor', icon: '🔍' },
        { key: 'DescriptionGenerator', href: '/tools/description-generator', icon: '📝' },
        { key: 'Titlegenerator', href: '/tools/title-generator', icon: '📝' },
        { key: 'YouTube Title & Description Extractor', href: '/tools/youtube-title-and-description-extractor', icon: '📄' },
        { key: 'YouTube Thumbnails Download', href: '/tools/youtube-thumbnail', icon: '📥' },
        { key: 'YouTube Hashtag Generator', href: '/tools/youtube-hashtag-generator', icon: '#️⃣' },
        { key: 'YouTube Embed Code Generator', href: '/tools/youtube-embed-code-generator', icon: '📋' },
        { key: 'YouTube Channel Banner Downloader', href: '/tools/youtube-channel-banner-downloader', icon: '📥' },
        { key: 'YouTube Channel Logo Downloader', href: '/tools/youtube-channel-logo-downloader', icon: '🎨' },
        { key: 'YouTube Channel Id Finder', href: '/tools/channel-id-finder', icon: '🆔' },
        { key: 'YouTube Video Data Viewer', href: '/tools/video-data-viewer', icon: '👁️' },
        { key: 'YouTube Monetization Checker', href: '/tools/monetization-checker', icon: '💰' },
        { key: 'YouTube Channel Search', href: '/tools/youtube-channel-search', icon: '🔍' },
        { key: 'YouTube Video Summary Generator', href: '/tools/youtube-video-summary-generator', icon: '📝' },
        { key: 'YouTube Trending Videos', href: '/tools/trending-videos', icon: '🔥' },
        { key: 'YouTube Money Calculator', href: '/tools/youtube-money-calculator', icon: '💰' },
        { key: 'YouTube Keyword Research', href: '/tools/keyword-research', icon: '🔍' },
        { key: 'YouTube Comment Picker', href: '/tools/youtube-comment-picker', icon: '🎲' }
      ]
    },
    { key: 'Pricing', href: '/pricing', dropdown: false },
    { key: 'Blog', href: '/blog', dropdown: false },
    { key: 'About Us', href: '/about', dropdown: false },
    { key: 'Contact Us', href: '/contact', dropdown: false },
  ];

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
                        alt="YouTube Tools Logo"
                        height="70"
                        width="150"
                      />
                    </Link>
                  </div>
                  <div className="hidden sm:block sm:ml-6 mx-auto">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        item.dropdown ? (
                          <Menu as="div" key={item.key} className="relative">
                            <Menu.Button className={classNames(
                              router.pathname.startsWith('/tools') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                              'flex items-center px-3 py-2 rounded-md text-sm font-medium'
                            )}>
                              {t(item.key)} <ChevronDownIcon className="ml-2 h-5 w-5" aria-hidden="true" />
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
                              <Menu.Items className="absolute z-10 p-3 w-[52rem] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none grid grid-cols-2 gap-2">
                                {item.children.map((subItem) => (
                                  <Menu.Item key={subItem.key}>
                                    {({ active }) => (
                                      <Link href={subItem.href} className={classNames(active ? 'bg-gray-100' : '', 'flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition')}>
                                        <i className="mr-3 text-blue-500 text-xl">{subItem.icon}</i>
                                        <span className="text-gray-800">{t(subItem.key)}</span>
                                      </Link>
                                    )}
                                  </Menu.Item>
                                ))}
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        ) : (
                          <Link key={item.key} href={item.href} className={classNames(
                            router.pathname === item.href ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                            'px-3 py-2 rounded-md text-sm font-medium'
                          )}>
                            {t(item.key)}
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center lan inset-y-0 right-0 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <div className="relative inline-block text-left mr-4">
                    <Menu as="div" className="relative">
                      <div>
                        <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                          <span className={`fi fi-${availableLanguages.find(l => l.code === selectedLanguage)?.flag}`} />
                          <span className="ml-2">{availableLanguages.find(l => l.code === selectedLanguage)?.name}</span>
                          <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
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
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            {availableLanguages.map(lang => (
                              <Menu.Item key={lang.code}>
                                {({ active }) => (
                                  <button
                                    onClick={() => changeLanguage(lang.code)}
                                    className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm')}
                                  >
                                    <span className={`fi fi-${lang.flag} mr-2`}></span>
                                    {lang.name}
                                  </button>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>

                  {user ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                          <span className="sr-only">Open user menu</span>
                          {user.profileImage ? (
                            <Image
                              src={`data:image/jpeg;base64,${user.profileImage}`}
                              alt="User profile image"
                              className="w-8 h-8 rounded-full"
                              width={32}
                              height={32}
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
                                {t('Profile')}
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <Link href="/dashboard/dashboard" className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                                {t('Dashboard')}
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={logout} className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                                {t('Logout')}
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <Link href="/login">
                      <button className="text-gray-300 bg-red-700 hover:text-red-500 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                        {t('Login')}
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
                    <Menu as="div" key={item.key} className="px-2 py-3 space-y-1">
                      <Menu.Button className="w-full text-left flex items-center text-gray-300 hover:text-red-500 hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium">
                        {t(item.key)} <ChevronDownIcon className="ml-auto h-5 w-5" aria-hidden="true" />
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
                            <Menu.Item key={subItem.key}>
                              {({ active }) => (
                                <Link href={subItem.href} className={classNames(active ? 'text-gray-300 hover:text-red-500 hover:bg-gray-700' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700')}>
                                  <span className="flex items-center">
                                    <i className="mr-3 text-blue-500 text-xl">{subItem.icon}</i>
                                    <span className="ml-2">{t(subItem.key)}</span>
                                  </span>
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <Link key={item.key} href={item.href} className={classNames(
                      router.pathname === item.href ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                      'block px-3 py-2 rounded-md text-base font-medium'
                    )}>
                      {t(item.key)}
                    </Link>
                  )
                ))}
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className={`fi fi-${availableLanguages.find(l => l.code === selectedLanguage)?.flag}`} />
                      <span className="ml-2">{availableLanguages.find(l => l.code === selectedLanguage)?.name}</span>
                      <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
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
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        {availableLanguages.map(lang => (
                          <Menu.Item key={lang.code}>
                            {({ active }) => (
                              <button
                                onClick={() => changeLanguage(lang.code)}
                                className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm')}
                              >
                                <span className={`fi fi-${lang.flag} mr-2`}></span>
                                {lang.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                {user && (
                  <Link href="/dashboard/dashboard" className={classNames(
                    router.pathname === '/dashboard/dashboard' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-red-500 hover:bg-gray-700',
                    'block px-3 py-2 rounded-md text-base font-medium'
                  )}>
                    {t('Dashboard')}
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-center mt-4">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className={`fi fi-${availableLanguages.find(l => l.code === selectedLanguage)?.flag}`} />
                      <span className="ml-2">{availableLanguages.find(l => l.code === selectedLanguage)?.name}</span>
                      <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
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
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        {availableLanguages.map(lang => (
                          <Menu.Item key={lang.code}>
                            {({ active }) => (
                              <button
                                onClick={() => changeLanguage(lang.code)}
                                className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm')}
                              >
                                <span className={`fi fi-${lang.flag} mr-2`}></span>
                                {lang.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                        <span className="sr-only">Open user menu</span>
                        {user.profileImage ? (
                          <Image
                            src={`data:image/jpeg;base64,${user.profileImage}`}
                            alt="User profile image"
                            className="w-8 h-8 rounded-full"
                            width={32}
                            height={32}
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
                              {t('Profile')}
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link href="/dashboard/dashboard" className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                              {t('Dashboard')}
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button onClick={logout} className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}>
                              {t('Logout')}
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <Link href="/login">
                    <button className="text-gray-300 bg-red-700 hover:text-red-500 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                      {t('Login')}
                    </button>
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
