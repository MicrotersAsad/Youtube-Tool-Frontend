import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../public/yt icon.png";
import {
  FaTachometerAlt,
  FaBlog,
  FaFileAlt,
  FaCogs,
  FaBars,
  FaSearch,
  FaUsers,
  FaSignOutAlt,
  FaCircle,
  FaUser,
  FaGlobe,
  FaWrench,
  FaKey,
  FaInfoCircle,
  FaFirstOrderAlt,
  FaListAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaBell,
} from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { collection, query, orderBy, onSnapshot, writeBatch, doc, where } from "firebase/firestore";
import { firestore } from "../../lib/firebase"; // Firestore setup
import Image from "next/image";

const Layout = React.memo(({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state for search
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState("");
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [searchResults, setSearchResults] = useState([]); // Search results state
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState([]);
  const [openCount, setOpenCount] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);

  const router = useRouter();
  useEffect(() => {
    fetchPendingTickets(); // Fetch pending tickets when the component mounts or updates
    fetchOpenTickets();
  }, []);
  useEffect(() => {
    if (!user) return;
  
    const notificationCollection = collection(firestore, 'notifications');
    let notificationQuery;
  
    // রোল অনুযায়ী নোটিফিকেশন ফিল্টার
    if (user.role === 'admin' || user.role === 'super_admin') {
      // এডমিন বা সুপার এডমিন নোটিফিকেশন ফিল্টার করবে যাতে নিজের মেসেজ বাদ দেওয়া হয়
      notificationQuery = query(
        notificationCollection,
        where('senderUserId', '!=', user.id), // এডমিন তার নিজের মেসেজ বাদ দেবে
        orderBy('createdAt', 'desc')
      );
    } else {
      // সাধারণ ইউজার শুধু তার নিজের নোটিফিকেশন দেখতে পারবে
      notificationQuery = query(
        notificationCollection,
        where('recipientUserId', '==', user.id), // নিজের ইউজার আইডি অনুযায়ী ফিল্টার
        orderBy('createdAt', 'desc')
      );
    }
  
    const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(fetchedNotifications);
  
      // unread নোটিফিকেশনের সংখ্যা আপডেট করা
      const unreadCount = fetchedNotifications.filter((n) => !n.read).length;
      setUnreadCount(unreadCount);
    });
  
    return () => unsubscribe();
  }, [user]);
  
  
  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown((prev) => !prev);
  };
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
  
      if (unreadNotifications.length === 0) return;
  
      const batch = writeBatch(firestore);
  
      unreadNotifications.forEach((notification) => {
        const docRef = doc(firestore, "notifications", notification.id);
        batch.update(docRef, { read: true });
      });
  
      await batch.commit();
  
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
        }))
      );
  
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };
  

  
  
  const fetchPendingTickets = async () => {
    try {
      const response = await fetch("/api/tickets/create");
      const result = await response.json();

      if (result.success) {
        const pendingTickets = result.tickets.filter(
          (ticket) => ticket.status === "pending"
        );

        setPendingCount(pendingTickets); // Set the count of pending tickets
      } else {
        console.error("Failed to fetch tickets:", result.message);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchOpenTickets = async () => {
    try {
      const response = await fetch("/api/tickets/create");
      const result = await response.json();

      if (result.success) {
        const openTickets = result.tickets.filter(
          (ticket) => ticket.status === "open"
        );

        setOpenCount(openTickets); // Set the count of pending tickets
      } else {
        console.error("Failed to fetch tickets:", result.message);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedMenu = localStorage.getItem("activeMenu");
    if (savedMenu) setMenuOpen(savedMenu);
    const savedCollapsed = localStorage.getItem("isCollapsed");
    if (savedCollapsed) setIsCollapsed(savedCollapsed === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("isCollapsed", isCollapsed);
  }, [isCollapsed]);

  const toggleMenu = (menu) => {
    const newMenu = menuOpen === menu ? "" : menu;
    setMenuOpen(newMenu);
    localStorage.setItem("activeMenu", newMenu);
  };

  const isActiveRoute = (route) => router.pathname === route;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getProfileImagePath = (imagePath) => {
    // Check if the imagePath is a base64 string by matching a common base64 pattern
    if (imagePath && imagePath.startsWith("data:image")) {
      return imagePath;
    }

    // Handle other cases as before
    return imagePath
      ? imagePath.startsWith("/uploads/")
        ? imagePath
        : `/uploads/profileImages/${imagePath}`
      : null;
  };
  const data = [
    // Dashboard
    {
      title: "Dashboard",
      link: "dashboard/overview",
      collectionName: "dashboard",
    },

    // Notices
    {
      title: "All Notices",
      link: "/dashboard/all-notice",
      collectionName: "notice",
    },
    {
      title: "Add Notice",
      link: "/dashboard/addnotice",
      collectionName: "notice",
    },

    // Results
    {
      title: "All Results",
      link: "/dashboard/all-result",
      collectionName: "result",
    },
    {
      title: "Add Result",
      link: "/dashboard/add-result",
      collectionName: "result",
    },

    // Gallery
    {
      title: "Photo Gallery",
      link: "/dashboard/photo-gallery",
      collectionName: "gallery",
    },
    {
      title: "Video Gallery",
      link: "/dashboard/video-gallery",
      collectionName: "gallery",
    },

    // Banner Management
    { title: "Banners", link: "/dashboard/banner", collectionName: "banner" },

    // Blog
    {
      title: "Categories",
      link: "/dashboard/categories",
      collectionName: "blog",
    },
    {
      title: "All Posts",
      link: "/dashboard/all-blogs",
      collectionName: "blog",
    },
    { title: "Add Post", link: "/dashboard/blogs", collectionName: "blog" },

    // Pages
    {
      title: "All Pages",
      link: "/dashboard/all-pages",
      collectionName: "pages",
    },
    {
      title: "Add New Page",
      link: "/dashboard/add-page",
      collectionName: "pages",
    },

    // Manage Users
    {
      title: "Admin List",
      link: "/dashboard/admin-list",
      collectionName: "users",
    },
    {
      title: "Add Admin",
      link: "/dashboard/add-admin",
      collectionName: "users",
    },

    // Manage  Api
    {
      title: "Add Youtube Api Key",
      link: "/dashboard/addYtApi",
      collectionName: "program",
    },
    {
      title: "Add OpenAi Api Key",
      link: "/dashboard/addopenaiKey",
      collectionName: "program",
    },

    // About Section
    {
      title: "Governing Body",
      link: "/dashboard/governing",
      collectionName: "about",
    },
    {
      title: "Staff Information",
      link: "/dashboard/staff",
      collectionName: "about",
    },
    {
      title: "Teacher Information",
      link: "/dashboard/teacher",
      collectionName: "about",
    },
    {
      title: "Achievement",
      link: "/dashboard/achievement",
      collectionName: "about",
    },

    // Appearance Section
    {
      title: "Settings",
      link: "/dashboard/setting",
      collectionName: "appearance",
    },
    {
      title: "Footer",
      link: "/dashboard/fotter-management",
      collectionName: "appearance",
    },
    {
      title: "Contact",
      link: "/dashboard/contact",
      collectionName: "appearance",
    },
    {
      title: "All Contact",
      link: "/dashboard/allcontact",
      collectionName: "appearance",
    },
    {
      title: "SMTP",
      link: "/dashboard/emailConfigForm",
      collectionName: "appearance",
    },
    {
      title: "Comments",
      link: "/dashboard/comment",
      collectionName: "appearance",
    },
    { title: "Media", link: "/dashboard/media", collectionName: "appearance" },
    {
      title: "All Menu",
      link: "/dashboard/all-menu",
      collectionName: "appearance",
    },
    {
      title: "Add Menu",
      link: "/dashboard/add-menu",
      collectionName: "appearance",
    },
    {
      title: "Site Backup",
      link: "/dashboard/importExport",
      collectionName: "appearance",
    },
  ];

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      const filteredResults = data.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 sidebar-test">
      {/* Background Overlay for mobile */}
      <div
        className={`fixed inset-0 z-30 bg-black opacity-50 transition-opacity lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 bg-[#071251] text-white shadow-lg ${
          isCollapsed ? "w-24" : "w-72"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-0 h-full flex flex-col`}
        // Removed onMouseEnter and onMouseLeave
      >
        <div className="sticky top-0 bg-[#071251] z-50">
          {/* Logo */}
          <div className="flex items-center text-white justify-center mt-8">
            <Link href="dashboard">
              <Image
                src={logo}
                width={isCollapsed ? 40 : 206}
                height={isCollapsed ? 40 : 80}
                alt="Logo"
              />
            </Link>
          </div>
          {/* Heading - only show when sidebar is not collapsed */}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className=" text-white pb-4 pt-4">
            {/* Dashboard */}
            <div className="mt-2">
              <Link
                href="/dashboard/dashboard"
                passHref
                className={`flex items-center py-2 px-6 text-white text-sm  w-full cursor-pointer ${
                  isActiveRoute("/dashboard/dashboard")
                    ? "bg-[#4634ff] text-white"
                    : "hover:bg-[#1d1e8e] hover:text-white"
                }`}
                style={{ marginLeft: isCollapsed ? "0" : "0" }}
              >
                <FaTachometerAlt className="text-white" />
                {!isCollapsed && <span className="ml-3">Dashboard</span>}
              </Link>
            </div>

            {/* Blog Main Menu Item with 0.3s Transition */}
            {user && (user.role === "admin" || user.role === "super_admin") && (
              <div className="mt-2">
                <p
                  className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                    isActiveRoute("/dashboard/categories") ||
                    isActiveRoute("/dashboard/all-blogs") ||
                    isActiveRoute("/dashboard/authors") ||
                    isActiveRoute("/dashboard/blogs")
                      ? "bg-[#4634ff] text-white"
                      : menuOpen === "blog"
                      ? "bg-[#1d1e8e] text-white"
                      : "hover:bg-[#1d1e8e] hover:text-white"
                  }`}
                  onClick={() => toggleMenu("blog")}
                  style={{ transition: "all 0.3s ease" }}
                >
                  <FaBlog className="mr-3 text-white" />
                  {!isCollapsed && <span>Blog</span>}
                  {!isCollapsed && (
                    <span className="ml-auto">
                      {menuOpen === "blog" ? (
                        <FiChevronUp className="w-6 h-6" />
                      ) : (
                        <FiChevronDown className="w-6 h-6" />
                      )}
                    </span>
                  )}
                </p>

                {/* Submenu */}
                {menuOpen === "blog" && (
                  <div className="ml-6 mt-2 mb-1 overflow-hidden">
                    {[
                      { href: "/dashboard/categories", label: "Categories" },
                      { href: "/dashboard/all-blogs", label: "All Posts" },
                      { href: "/dashboard/blogs", label: "Add Post" },
                      { href: "/dashboard/authors", label: "Add Authors" },
                    ].map(({ href, label }, index) => (
                      <Link href={href} passHref key={index}>
                        <p
                          className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                            isActiveRoute(href)
                              ? "bg-[#1d1e8e] text-white"
                              : "hover:bg-[#1d1e8e] hover:text-white"
                          }`}
                        >
                          <FaCircle className="mr-2 text-xs" />
                          {label}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                {/* Blog */}
                <div className="mt-2">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/yt-categories") ||
                      isActiveRoute("/dashboard/all-article") ||
                      isActiveRoute("/dashboard/article") ||
                      isActiveRoute("/dashboard/create-shortcode")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "blog"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("article")}
                  >
                    <FaBlog className="mr-3 text-white" />
                    {!isCollapsed && <span>Youtube Article</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "article" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transform transition-all duration-700 ease-in-out origin-top ${
                      (menuOpen === "article" ||
                        isActiveRoute("/dashboard/yt-categories") ||
                        isActiveRoute("/dashboard/all-article") ||
                        isActiveRoute("/dashboard/article")) &&
                      !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/yt-categories" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/categories")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Categories
                      </p>
                    </Link>
                    <Link href="/dashboard/all-article" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/all-article")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        All Article
                      </p>
                    </Link>
                    <Link href="/dashboard/article" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/article")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Add Article
                      </p>
                    </Link>
                    <Link href="/dashboard/create-shortcode" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/create-shortcode")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Create Shortcode
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}

            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                {/* Pages */}
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/all-pages") ||
                      isActiveRoute("/dashboard/add-page")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "pages"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("pages")}
                  >
                    <FaFileAlt className="mr-3 text-white" />
                    {!isCollapsed && <span>Pages</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "pages" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transform transition-all duration-700 ease-in-out origin-top ${
                      (menuOpen === "pages" ||
                        isActiveRoute("/dashboard/all-pages") ||
                        isActiveRoute("/dashboard/add-page")) &&
                      !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/all-pages" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/all-pages")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        All Pages
                      </p>
                    </Link>
                    <Link href="/dashboard/add-page" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/add-page")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Add New Page
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}

            {/* Content */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/content") ||
                      isActiveRoute("/dashboard/review")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "pages"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("tools")}
                  >
                    <FaFileAlt className="mr-3 text-white" />
                    {!isCollapsed && <span>Content</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "tools" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transform transition-all duration-700 ease-in-out origin-top ${
                      (menuOpen === "tools" ||
                        isActiveRoute("/dashboard/content")) &&
                      !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/content" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/content")
                            ? "bg-[#1d1e8e] text-white"
                            : "bg-transparent text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Tools Content
                      </p>
                    </Link>
                    <Link href="/dashboard/review" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/review")
                            ? "bg-[#1d1e8e] text-white"
                            : "bg-transparent text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Tools Review
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}

            {/* Manage Users */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/all-user") ||
                      isActiveRoute("/dashboard/active-users") ||
                      isActiveRoute("/dashboard/ban-user") ||
                      isActiveRoute("/dashboard/unverified-user") ||
                      isActiveRoute("/dashboard/premium-user") ||
                      isActiveRoute("/dashboard/non-premium-user")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "users"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("users")}
                  >
                    <FaUsers className="mr-3 text-white" />
                    {!isCollapsed && <span>Manage Users</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "users" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transform transition-all duration-700 ease-in-out origin-top ${
                      (menuOpen === "users" ||
                        isActiveRoute("/dashboard/users")) &&
                      !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/all-user" passHref>
                      <p
                        className={`relative flex  items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/all-user")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        All User
                      </p>
                    </Link>
                    <Link href="/dashboard/active-users" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/active-users")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Active User
                      </p>
                    </Link>
                    <Link href="/dashboard/unverified-user" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/unverified-user")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Unverified User
                      </p>
                    </Link>
                    <Link href="/dashboard/premium-user" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/premium-user")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Premium User
                      </p>
                    </Link>
                    <Link href="/dashboard/non-premium-user" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/non-premium-user")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Non Premium User
                      </p>
                    </Link>
                    <Link href="/dashboard/ban-user" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/ban-user")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Ban User
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
            {/* Manage Subscription */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/all-subscription") ||
                      isActiveRoute("/dashboard/active-subscription") ||
                      isActiveRoute("/dashboard/expired-subscription") ||
                      isActiveRoute("/dashboard/user-logs") ||
                      isActiveRoute("/dashboard/unverified-user") ||
                      isActiveRoute("/dashboard/premium-user") ||
                      isActiveRoute("/dashboard/non-premium-user")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "users"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("all-subscription")}
                  >
                    <FaFirstOrderAlt className="mr-3 text-white" />
                    {!isCollapsed && <span>Manage Subscription</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "all-subscription" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transform transition-all duration-700 ease-in-out origin-top ${
                      (menuOpen === "all-subscription" ||
                        isActiveRoute("/dashboard/all-subscription")) &&
                      !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/all-subscription" passHref>
                      <p
                        className={`relative flex  items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/all-subscription")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        All Subscription
                      </p>
                    </Link>
                    <Link href="/dashboard/active-subscription" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/active-subscription")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Active Subscription
                      </p>
                    </Link>
                    <Link href="/dashboard/expired-subscription" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/expired-subscription")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Expired Subscription
                      </p>
                    </Link>
                    <Link href="#" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/cancel-subscription")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Cancel Subscription
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}

            {/* Support Section */}
            {user && ( // Only render the support section if the user is logged in
              <div className="">
                <p
                  className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                    isActiveRoute("/dashboard/create-ticket") ||
                    isActiveRoute("/dashboard/my-tickets") ||
                    isActiveRoute("/dashboard/pending-tickets") ||
                    isActiveRoute("/dashboard/closed-tickets") ||
                    isActiveRoute("/dashboard/open-tickets") ||
                    isActiveRoute("/dashboard/all-tickets") ||
                    isActiveRoute("/dashboard/")
                      ? "bg-[#4634ff] text-white"
                      : menuOpen === "support"
                      ? "bg-[#1d1e8e] text-white"
                      : "hover:bg-[#1d1e8e] hover:text-white"
                  }`}
                  onClick={() => toggleMenu("support")}
                >
                  <FaListAlt className="mr-3 text-white" />
                  {!isCollapsed && <span>Support</span>}
                  {!isCollapsed && (
                    <span className="ml-auto">
                      {menuOpen === "support" ? (
                        <FiChevronUp className="w-6 h-6" />
                      ) : (
                        <FiChevronDown className="w-6 h-6" />
                      )}
                    </span>
                  )}
                </p>

                {/* Dropdown Content with Smooth Opening and Closing Animation */}
                <div
                  className={`ml-6 mt-2 mb-1 overflow-hidden transition-all duration-700 ease-in-out origin-top ${
                    menuOpen === "support" && !isCollapsed
                      ? "max-h-screen opacity-100 scale-y-100"
                      : "max-h-0 opacity-0 scale-y-0"
                  }`}
                >
                  {/* Role-Based Menu Items */}
                  {user.role === "user" && (
                    <>
                      <Link href="/dashboard/create-ticket" passHref>
                        <p
                          className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                            isActiveRoute("/dashboard/create-ticket")
                              ? "bg-[#1d1e8e] text-white"
                              : "hover:bg-[#1d1e8e] hover:text-white"
                          }`}
                        >
                          <FaCircle className="mr-2 text-xs" />
                          Create New Ticket
                        </p>
                      </Link>
                      <Link href="/dashboard/my-tickets" passHref>
                        <p
                          className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                            isActiveRoute("/dashboard/my-tickets")
                              ? "bg-[#1d1e8e] text-white"
                              : "hover:bg-[#1d1e8e] hover:text-white"
                          }`}
                        >
                          <FaCircle className="mr-2 text-xs" />
                          My Tickets
                        </p>
                      </Link>
                    </>
                  )}

                  {user.role === "admin" && (
                    <>
                      <Link href="/dashboard/pending-tickets" passHref>
                        <p
                          className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                            isActiveRoute("/dashboard/pending-tickets")
                              ? "bg-[#1d1e8e] text-white"
                              : "hover:bg-[#1d1e8e] hover:text-white"
                          }`}
                        >
                          <FaCircle className="mr-2 text-xs" />
                          Pending Ticket
                          <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                            {pendingCount.length}
                          </span>
                        </p>
                      </Link>

                      <Link href="/dashboard/closed-tickets" passHref>
                        <p
                          className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                            isActiveRoute("/dashboard/closed-tickets")
                              ? "bg-[#1d1e8e] text-white"
                              : "hover:bg-[#1d1e8e] hover:text-white"
                          }`}
                        >
                          <FaCircle className="mr-2 text-xs" />
                          Closed Ticket
                        </p>
                      </Link>
                      <Link href="/dashboard/open-tickets" passHref>
                        <p
                          className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                            isActiveRoute("/dashboard/open-tickets")
                              ? "bg-[#1d1e8e] text-white"
                              : "hover:bg-[#1d1e8e] hover:text-white"
                          }`}
                        >
                          <FaCircle className="mr-2 text-xs" />
                          Open Ticket
                          <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                            {openCount.length}
                          </span>
                        </p>
                      </Link>
                      <Link href="/dashboard/all-tickets" passHref>
                        <p
                          className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                            isActiveRoute("/dashboard/all-tickets")
                              ? "bg-[#1d1e8e] text-white"
                              : "hover:bg-[#1d1e8e] hover:text-white"
                          }`}
                        >
                          <FaCircle className="mr-2 text-xs" />
                          All Ticket
                        </p>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Report Section */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/user-log") ||
                      isActiveRoute("/dashboard/addopenaiKey") ||
                      isActiveRoute("/dashboard/")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "report"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("report")}
                  >
                    <FaListAlt className="mr-3 text-white" />
                    {!isCollapsed && <span>Report</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "report" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transition-all duration-700 ease-in-out origin-top ${
                      menuOpen === "report" && !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/user-log" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/user-log")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Login History
                      </p>
                    </Link>
                    <Link href="/dashboard/all-notification" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/all-notification")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        All Notification
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
            {/* API Keys Section */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/addYtApi") ||
                      isActiveRoute("/dashboard/addopenaiKey") ||
                      isActiveRoute("/dashboard/")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "apiKeys"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("apiKeys")}
                  >
                    <FaKey className="mr-3 text-white" />
                    {!isCollapsed && <span>API Keys</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "apiKeys" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transition-all duration-700 ease-in-out origin-top ${
                      menuOpen === "apiKeys" && !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/addYtApi" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/addYtApi")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Add YouTube Key
                      </p>
                    </Link>
                    <Link href="/dashboard/addopenaiKey" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/addopenaiKey")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Add OpenAI Key
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}

            {/* About Section */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/about") ||
                      isActiveRoute("/dashboard/governing") ||
                      isActiveRoute("/dashboard/staff") ||
                      isActiveRoute("/dashboard/teacher") ||
                      isActiveRoute("/dashboard/achievement") ||
                      isActiveRoute("/dashboard/privacy") ||
                      isActiveRoute("/dashboard/refund") ||
                      isActiveRoute("/dashboard/terms") ||
                      isActiveRoute("/dashboard/gdpr") ||
                      isActiveRoute("/dashboard/notice") ||
                      isActiveRoute("/dashboard/ccpa")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "about"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("about")}
                  >
                    <FaInfoCircle className="mr-3 text-white" />{" "}
                    {/* Icon indicating About Section */}
                    {!isCollapsed && <span>About</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "about" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transition-all duration-700 ease-in-out origin-top ${
                      menuOpen === "about" && !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/about" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/about")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        About Us
                      </p>
                    </Link>

                    <Link href="/dashboard/privacy" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/privacy")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Privacy Policy
                      </p>
                    </Link>
                    <Link href="/dashboard/refund" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/refund")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Refund
                      </p>
                    </Link>
                    <Link href="/dashboard/terms" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/terms")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Terms and Conditions
                      </p>
                    </Link>
                    <Link href="/dashboard/gdpr" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/gdpr")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        GDPR Information
                      </p>
                    </Link>
                    <Link href="/dashboard/notice" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/notice")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Notice
                      </p>
                    </Link>
                    <Link href="/dashboard/ccpa" passHref>
                      <p
                        className={`relative flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/ccpa")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        CCPA Compliance
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}

            {/* Appearance */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="">
                  <p
                    className={`flex items-center py-2 text-white text-sm px-6 cursor-pointer ${
                      isActiveRoute("/dashboard/setting") ||
                      isActiveRoute("/dashboard/fotter-management") ||
                      isActiveRoute("/dashboard/contact") ||
                      isActiveRoute("/dashboard/allcontact") ||
                      isActiveRoute("/dashboard/emailConfigForm") ||
                      isActiveRoute("/dashboard/comment") ||
                      isActiveRoute("/dashboard/media") ||
                      isActiveRoute("/dashboard/all-menu") ||
                      isActiveRoute("/dashboard/add-menu") ||
                      isActiveRoute("/dashboard/importExport")
                        ? "bg-[#4634ff] text-white"
                        : menuOpen === "appearance"
                        ? "bg-[#1d1e8e] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    onClick={() => toggleMenu("appearance")}
                  >
                    <FaCogs className="mr-3 text-white" />
                    {!isCollapsed && <span>Appearance</span>}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {menuOpen === "appearance" ? (
                          <FiChevronUp className="w-6 h-6" />
                        ) : (
                          <FiChevronDown className="w-6 h-6" />
                        )}
                      </span>
                    )}
                  </p>

                  {/* Dropdown Content with Smooth Opening and Closing Animation */}
                  <div
                    className={`ml-6 mt-2 mb-1 overflow-hidden transform transition-all duration-700 ease-in-out origin-top ${
                      (menuOpen === "appearance" ||
                        isActiveRoute("/dashboard/report") ||
                        isActiveRoute("/dashboard/allcontact") ||
                        isActiveRoute("/dashboard/emailConfigForm") ||
                        isActiveRoute("/dashboard/comment") ||
                        isActiveRoute("/dashboard/media") ||
                        isActiveRoute("/dashboard/all-menu") ||
                        isActiveRoute("/dashboard/add-menu") ||
                        isActiveRoute("/dashboard/addheader") ||
                        isActiveRoute("/dashboard/importExport")) &&
                      !isCollapsed
                        ? "max-h-screen opacity-100 scale-y-100"
                        : "max-h-0 opacity-0 scale-y-0"
                    }`}
                  >
                    <Link href="/dashboard/report" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/report")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Report
                      </p>
                    </Link>
                    <Link href="/dashboard/contact" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/contact")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Contact
                      </p>
                    </Link>
                    <Link href="/dashboard/allcontact" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/allcontact")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        All Contact
                      </p>
                    </Link>
                    <Link href="/dashboard/emailConfigForm" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/emailConfigForm")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        SMTP
                      </p>
                    </Link>
                    <Link href="/dashboard/comment" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/comment")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Comments
                      </p>
                    </Link>
                    <Link href="/dashboard/media" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/media")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Media
                      </p>
                    </Link>
                    <Link href="/dashboard/all-menu" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/all-menu")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        All Menu
                      </p>
                    </Link>
                    <Link href="/dashboard/add-menu" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/add-menu")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Menu
                      </p>
                    </Link>
                    <Link href="/dashboard/addheader" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/addheader")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Custom Header
                      </p>
                    </Link>
                    <Link href="/dashboard/importExport" passHref>
                      <p
                        className={`relative mt-2 flex items-center text-white text-sm py-2 px-6 cursor-pointer ${
                          isActiveRoute("/dashboard/importExport")
                            ? "bg-[#1d1e8e] text-white"
                            : "hover:bg-[#1d1e8e] hover:text-white"
                        }`}
                      >
                        <FaCircle className="mr-2 text-xs" />
                        Site Backup
                      </p>
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
            {/* Setting */}
            {user && (user.role === "admin" || user.role === "super_admin") ? (
              <>
                <div className="mt-2">
                  <Link
                    href="/dashboard/system-setting"
                    passHref
                    className={`flex items-center py-2 px-6 text-white text-sm  w-full cursor-pointer ${
                      isActiveRoute("/dashboard/system-setting")
                        ? "bg-[#4634ff] text-white"
                        : "hover:bg-[#1d1e8e] hover:text-white"
                    }`}
                    style={{ paddingLeft: isCollapsed ? "24px" : "24px" }} // Conditional padding to adjust based on collapsed state
                  >
                    <FaTachometerAlt className="mr-3 text-white" />
                    {!isCollapsed && <span>System Setting</span>}
                  </Link>
                </div>
              </>
            ) : null}
          </nav>
        </div>
        {/* Bottom Fixed Section */}
        {/* Footer Text */}
        <div
          className="text-center text-white font-bold text-xs"
          style={{
            position: "absolute",
            bottom: "10px",
            width: "100%",
            whiteSpace: "nowrap",
            textAlign: "center",
            transition: "all 0.3s ease",
            opacity: isCollapsed ? "1" : "1",
          }}
        >
          {!isCollapsed ? "Ytubetools V1.0" : "Yt V1.0"}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex h-screen overflow-hidden bg-gray-100 sidebar-test w-full">
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar */}
          <header className="flex justify-between items-center p-3 bg-[#071251] border-b border-gray-200">
            {/* Sidebar Collapse Button for Desktop */}
            <div className="flex items-center space-x-4">
              <button
                className="ml-3 text-white focus:outline-none hidden lg:block"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <FaBars className="w-6 h-6" />
              </button>

              {/* Sidebar toggle for Mobile */}
              <button
                className="text-white focus:outline-none lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <FaBars className="w-6 h-6" />
              </button>

              {/* Search Input for Desktop */}
              <div className="relative hidden lg:block w-64">
                <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-white text-lg" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 py-2 rounded-lg bg-transparent border border-[#4b4ba5] text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out hover:border-[#6a6aff]"
                  placeholder="Search here..."
                />
                {searchResults.length > 0 && (
                  <ul className="absolute z-10 bg-white text-black w-full mt-1 max-h-60 overflow-auto shadow-lg">
                    {searchResults.map((result, index) => (
                      <li key={index} className="p-2 hover:bg-gray-200">
                        <Link href={result.link}>
                          <span className="text-blue-600">
                            {result.title} - <em>{result.collectionName}</em>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Action Icons and Profile */}
            <div className="flex items-center space-x-4">
              {/* Action Icons */}
              <button
                className="flex items-center text-white"
                onClick={() => router.push("/")}
              >
                <FaGlobe className="w-5 h-5" />
              </button>
              {/* Notification Icon */}
              <div className="relative">
      {/* Notification Bell Icon */}
      <button className="relative text-white" onClick={toggleNotificationDropdown}>
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotificationDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-10">
          <div className="p-4 flex justify-between items-center">
            <h4 className="text-lg font-bold">Notifications</h4>
            <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline">
              Mark all as read
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 border-b ${notification.read ? 'bg-gray-100' : 'bg-blue-50'}`}
              >
                <p className="text-sm">{notification.message}</p>
                <small className="text-gray-500">
                  {new Date(notification.createdAt.toDate()).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>



              <button
                className="flex items-center text-white"
                onClick={() => router.push("/dashboard/system-setting")}
              >
                <FaWrench className="w-5 h-5" />
              </button>

              {/* Profile */}
              <div className="relative">
                <div
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className="cursor-pointer flex items-center space-x-2"
                >
                  {user?.profileImage ? (
                    <Image
                      src={user?.profileImage}
                      width={30}
                      height={30}
                      className="rounded-full border"
                      alt="Profile Image"
                      unoptimized
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1d1e8e] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user?.userName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="text-white text-sm font-semibold">
                    {" "}
                    {user?.username}
                  </p>
                  {profileDropdown ? (
                    <FiChevronDown className="text-white" />
                  ) : (
                    <FiChevronUp className="text-white" />
                  )}
                </div>

                {profileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg py-2 z-20">
                    <div className="px-4 py-2 flex items-center">
                      {user?.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt="User profile image"
                          className="w-8 h-8 rounded-full"
                          width={32}
                          height={32}
                          priority
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#1d1e8e] flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-sm">
                            {user?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="font-semibold text-blue-500">
                          {user?.username || "Username"}
                        </p>

                        <div className="flex items-center space-x-2">
                          <p className="text-gray-500 text-sm">
                            {user?.role || "Role"}
                          </p>
                          {user?.verified ? (
                            <FaCheckCircle
                              className="text-green-500"
                              title="Verified"
                            /> // Green checkmark for verified
                          ) : (
                            <FaTimesCircle
                              className="text-red-500"
                              title="Not Verified"
                            /> // Red cross for unverified
                          )}
                        </div>
                      </div>
                    </div>
                    <hr />
                    <Link href="/user/profile" passHref>
                      <button className="flex items-center w-full px-4 py-2 text-gray-800 hover:bg-gray-100">
                        <FaUser className="mr-3" />
                        Profile
                      </button>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
      <style jsx>{`
        .text-sm{
        font-size:1rem!importantm,
        line-height:1.25rem!important
        }
        .py-2{
        padding-top:0.8rem!important,
        padding-bottom:0.8rem!important,
        }
      `}</style>
    </div>
  );
});
export default Layout;
