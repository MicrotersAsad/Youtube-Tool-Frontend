import React, { useEffect, useState } from 'react';
import Layout from './layout';
import { useAuth } from '../../contexts/AuthContext';
import ChartComponent from './ChartComponent';
import UserProfile from '../../components/UserProfile';
import { FaUsers, FaUserCheck, FaEnvelope, FaCrown, FaUser, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link';
import moment from 'moment'; // Import moment.js
import { Line } from 'react-chartjs-2';

const Dashboard = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [filter, setFilter] = useState('daily');
  const [siteViews, setSiteViews] = useState(0);
  const [blogs, setBlogs] = useState([]);
  const [blogChartData, setBlogChartData] = useState(null); // Initialize as null for conditional rendering
  const [tools, setTools] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [pages, setPages] = useState([]);
  const [comments, setComments] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [premiumUsers, setPremiumUsers] = useState(0);
  const [nonPremiumUsers, setNonPremiumUsers] = useState(0);
  const [emailUnverifiedUsers, setEmailUnverifiedUsers] = useState(0);
  const [mobileUnverifiedUsers, setMobileUnverifiedUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeLogin, setActiveLogin] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD'),
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData(filter);
      fetchSiteViews(filter);
      fetchUsers(); // Fetch user statistics on load
      fetchBlog(); // Fetch blogs on load
      fetchTools(); // Fetch tools on load
      fetchReviews(); // Fetch tools review on load
      fetchPage(); // Fetch tools page on load
      fetchComments(); // Fetch comment page on load
      fetchTotalSiteViews();
      fetchActiveUsers();
      fetchBlogChartData(); // Move this here to fetch blog chart data
    }  
  }, [user, filter]);

  const fetchActiveUsers = async () => {
    try {
      const response = await fetch('/api/active-sessions');
      const data = await response.json();
      setActiveLogin(data.activeUsers);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const fetchData = async (filter) => {
    try {
      const response = await fetch(`/api/user-visits?filter=${filter}`);
      const data = await response.json();
      console.log(`Number of visits (${filter}):`, data.length);
      setChartData(data.map(item => item.value));
      setLabels(data.map(item => item.date));
    } catch (error) {
      console.error('Error fetching user visit data:', error);
    }
  };

  const fetchTotalSiteViews = async () => {
    try {
      const response = await fetch(`/api/get-visit-count?filter=total`);
      const data = await response.json();
      setTotalVisits(data.totalCount); // Set total visits count
    } catch (error) {
      console.error('Error fetching total site visit count:', error);
    }
  };

  const fetchSiteViews = async (filter) => {
    try {
      const response = await fetch(`/api/get-visit-count?filter=${filter}`);
      const data = await response.json();
      setSiteViews(data.visitCount);
    } catch (error) {
      console.error('Error fetching site visit count:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('/api/user-list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const verifiedUsers = result.data.filter(user => user.verified);
        const emailUnverifiedUsers = result.data.filter(user => !user.verified);
        const premiumUsers = verifiedUsers.filter(user => user?.paymentStatus === "success");
        const nonPremiumUsers = verifiedUsers.filter(user => !user.paymentStatus || user.paymentStatus !== "success");

        setTotalUsers(result.data.length || 0);
        setActiveUsers(verifiedUsers.length || 0);
        setPremiumUsers(premiumUsers.length || 0);
        setNonPremiumUsers(nonPremiumUsers.length || 0);
        setEmailUnverifiedUsers(emailUnverifiedUsers.length || 0);
        setMobileUnverifiedUsers(result.data.filter(user => !user.mobileVerified).length || 0);
      } else {
        setTotalUsers(0);
        setActiveUsers(0);
        setEmailUnverifiedUsers(0);
        setMobileUnverifiedUsers(0);
        setPremiumUsers(0);
        setNonPremiumUsers(0);
      }
      setLoading(false);
    } catch (error) {
      console.error(error.message);
      setLoading(false);
    }
  };

  // Fetch blog data
  const fetchBlog = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blogs');
      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      console.error('Error fetching blogs:', error.message);
    }
    setLoading(false);
  };

  // Fetch tools data
  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content');
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();
      setTools(data.length || 0); // Ensure tools is a count
    } catch (error) {
      console.error('Error fetching content:', error.message);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
    }
  };

  const fetchPage = async () => {
    try {
      const response = await fetch('/api/pages');
      const data = await response.json();
      setPages(data);
    } catch (error) {
      console.error('Error fetching pages:', error.message);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/comments/all'); // Use fetch instead of axios for consistency
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      setComments([]); // Set comments to an empty array if there's an error
    }
  };

  const handleFilterChange = (filter) => {
    setFilter(filter);
    fetchData(filter);
    fetchSiteViews(filter);
  };

  const fetchBlogChartData = async () => {
    try {
      const response = await fetch(`/api/blogs?start=${dateRange.start}&end=${dateRange.end}`);
      const data = await response.json();

      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of blogs');
      }

      const blogCountByDate = data.reduce((acc, item) => {
        const formattedDate = moment(item.createdAt).format('YYYY-MM-DD');
        acc[formattedDate] = (acc[formattedDate] || 0) + 1;
        return acc;
      }, {});

      const labels = Object.keys(blogCountByDate);
      const chartData = Object.values(blogCountByDate);

      setBlogChartData({
        labels: labels.length > 0 ? labels : ["No Data"],
        datasets: [
          {
            label: 'Blogs Published',
            data: chartData.length > 0 ? chartData : [0],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching blog chart data:', error);
      setBlogChartData(null); // Set to null if there was an error
    }
  };

  useEffect(() => {
    fetchBlogChartData();
  }, [dateRange]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold">Hi, {user?.username}</h1>
      {user?.role !== 'admin' && <UserProfile />}
      {user?.role === 'admin' && (
        <>
          {/* User Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Link href="all-user">
              <div className="flex items-center border rounded-lg border-purple-300 bg-purple-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-200 rounded-md">
                    <FaUsers className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Total Users</p>
                    <h3 className="text-2xl font-bold">{totalUsers}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="active-users">
              <div className="flex items-center border rounded-lg border-green-300 bg-green-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-200 rounded-md">
                    <FaUserCheck className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Email Verified Users</p>
                    <h3 className="text-2xl font-bold">{activeUsers}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="unverified-user">
              <div className="flex items-center border rounded-lg border-red-300 bg-red-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-200 rounded-md">
                    <FaEnvelope className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Email Unverified Users</p>
                    <h3 className="text-2xl font-bold">{emailUnverifiedUsers}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="premium-user">
              <div className="flex items-center border rounded-lg border-yellow-300 bg-yellow-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-200 rounded-md">
                    <FaCrown className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Premium Users</p>
                    <h3 className="text-2xl font-bold">{premiumUsers}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="non-premium-user">
              <div className="flex items-center border rounded-lg border-gray-300 bg-gray-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-200 rounded-md">
                    <FaUser className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Non-Premium Users</p>
                    <h3 className="text-2xl font-bold">{nonPremiumUsers}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="all-blog">
              <div className="flex items-center border rounded-lg border-gray-300 bg-gray-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-200 rounded-md">
                    <FaUser className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Total Blogs</p>
                    <h3 className="text-2xl font-bold">{blogs.length}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="content">
              <div className="flex items-center border rounded-lg border-gray-300 bg-gray-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-200 rounded-md">
                    <FaUser className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Total Tools</p>
                    <h3 className="text-2xl font-bold">{tools.totalCount}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="content">
              <div className="flex items-center border rounded-lg border-gray-300 bg-gray-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-200 rounded-md">
                    <FaUser className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Total Reviews</p>
                    <h3 className="text-2xl font-bold">{reviews.length}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="all-pages">
              <div className="flex items-center border rounded-lg border-gray-300 bg-gray-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-200 rounded-md">
                    <FaUser className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">All Pages</p>
                    <h3 className="text-2xl font-bold">{pages.length}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="comment">
              <div className="flex items-center border rounded-lg border-gray-300 bg-gray-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-200 rounded-md">
                    <FaUser className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">All Comments</p>
                    <h3 className="text-2xl font-bold">{comments.length}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="comment">
              <div className="flex items-center border rounded-lg border-gray-300 bg-gray-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-200 rounded-md">
                    <FaUser className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Total Visits</p>
                    <h3 className="text-2xl font-bold">{siteViews}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>

            <Link href="comment">
              <div className="flex items-center border rounded-lg border-blue-300 bg-blue-100 shadow-md hover:shadow-lg transition-all p-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-200 rounded-md">
                    <FaUser className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">Total Logins</p>
                    <h3 className="text-2xl font-bold">{activeLogin}</h3>
                  </div>
                </div>
                <FaChevronRight className="text-gray-500 ml-auto" />
              </div>
            </Link>
          </div>

          {/* Filter and Chart Section */}
         
          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="p-6 border border-teal-500 rounded-lg bg-white">
              <h2 className="text-lg font-semibold text-black mb-4">Blog Report</h2>
              {blogChartData ? (
                <Line data={blogChartData} />
              ) : (
                <p>No data available</p>
              )}
            </div>
            <div className="p-6 border border-teal-500 rounded-lg bg-white">
           
            <select
              onChange={(e) => handleFilterChange(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>


            <ChartComponent data={chartData} labels={labels} />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold">Total {filter.charAt(0).toUpperCase() + filter.slice(1)} Site Views: {siteViews}</h2>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
