import React, { useEffect, useState } from 'react';
import Layout from './layout';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';
import ChartComponent from './ChartComponent';
import UserProfile from '../../components/UserProfile';
import { Line, Pie } from 'react-chartjs-2';
import { FaUsers, FaUserCheck, FaEnvelope, FaCrown, FaUserAlt, FaFileAlt, FaTools, FaStar, FaSitemap, FaComment, FaChartLine, FaSignInAlt, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [filter, setFilter] = useState('daily');
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [premiumUsers, setPremiumUsers] = useState(0);
  const [nonPremiumUsers, setNonPremiumUsers] = useState(0);
  const [emailUnverifiedUsers, setEmailUnverifiedUsers] = useState(0);
  const [siteViews, setSiteViews] = useState(0);
  const [blogChartData, setBlogChartData] = useState(null);
  const [browserStats, setBrowserStats] = useState({});
  const [osStats, setOsStats] = useState({});
  const [countryStats, setCountryStats] = useState({});
  const [activeLogin, setActiveLogin] = useState(0);
  const [blogs, setBlogs] = useState([]);
  const [tools, setTools] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [pages, setPages] = useState([]);
  const [comments, setComments] = useState([]);

  const fetchData = async (filter) => {
    try {
      const response = await fetch(`/api/user-visits?filter=${filter}`);
      const data = await response.json();
      setChartData(data.map(item => item.value));
      setLabels(data.map(item => item.date));
    } catch (error) {
      console.error('Error fetching user visits:', error);
    }
  };

  const fetchSiteViews = async (filter) => {
    try {
      const response = await fetch(`/api/get-visit-count?filter=${filter}`);
      const data = await response.json();
      setSiteViews(data.visitCount);
    } catch (error) {
      console.error('Error fetching site views:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchAllData = async () => {
        setLoading(true);
        try {
          const [
            siteViewsResponse,
            userVisitsResponse,
            blogResponse,
            userListResponse,
            loginStatsResponse,
            activeSessionsResponse,
            reviewsResponse,
            pagesResponse,
            commentsResponse
          ] = await Promise.all([
            fetch(`/api/get-visit-count?filter=${filter}`),
            fetch(`/api/user-visits?filter=${filter}`),
            fetch(`/api/blogs?start=${moment().subtract(30, 'days').format('YYYY-MM-DD')}&end=${moment().format('YYYY-MM-DD')}`, {
              headers: {
                'Authorization': `Bearer AZ-fc905a5a5ae08609ba38b046ecc8ef00`, // Add your custom header here
                'Content-Type': 'application/json' // Example of another header, if needed
              }
            }),
            fetch('/api/user-list', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
            fetch('/api/get-login-stats'),
            fetch('/api/active-sessions'),
            fetch('/api/reviews'),
            fetch('/api/pages'),
            fetch('/api/comments/all')
          ]);
  
          const siteViewsData = await siteViewsResponse.json();
          const userVisitsData = await userVisitsResponse.json();
          const blogData = await blogResponse.json();
          const userListData = await userListResponse.json();
          const loginStatsData = await loginStatsResponse.json();
          const activeSessionsData = await activeSessionsResponse.json();
          const reviewsData = await reviewsResponse.json();
          const pagesData = await pagesResponse.json();
          const commentsData = await commentsResponse.json();
  
          setSiteViews(siteViewsData.visitCount);
          setChartData(userVisitsData.map(item => item.value));
          setLabels(userVisitsData.map(item => item.date));
          setBlogChartData({
            labels: blogData.map(item => moment(item.createdAt).format('YYYY-MM-DD')),
            datasets: [{ label: 'Blogs Published', data: blogData.map(() => 1), borderColor: 'rgba(75, 192, 192, 1)', fill: true }]
          });
  
          const premiumUserCount = userListData.data.filter(user => user.paymentStatus === 'success').length;
          setTotalUsers(userListData.data.length);
          setActiveUsers(userListData.data.filter(user => user.verified).length);
          setPremiumUsers(premiumUserCount);
          setNonPremiumUsers(userListData.data.length - premiumUserCount);
          setEmailUnverifiedUsers(userListData.data.filter(user => !user.verified).length);
          setActiveLogin(activeSessionsData.activeUsers);
  
          setBrowserStats({
            labels: loginStatsData.browserStats.map(item => item._id),
            datasets: [{ data: loginStatsData.browserStats.map(item => item.count), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FFA726', '#66BB6A'] }]
          });
          setOsStats({
            labels: loginStatsData.osStats.map(item => item._id),
            datasets: [{ data: loginStatsData.osStats.map(item => item.count), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FFA726', '#66BB6A'] }]
          });
          setCountryStats({
            labels: loginStatsData.countryStats.map(item => item._id),
            datasets: [{ data: loginStatsData.countryStats.map(item => item.count), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FFA726', '#66BB6A'] }]
          });
  
          setBlogs(blogData);
          setTools(reviewsData.length);
          setReviews(reviewsData);
          setPages(pagesData);
          setComments(commentsData);
  
          setLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
        }
      };
      fetchAllData();
    }
  }, [user, filter]);
  

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchData(newFilter);
    fetchSiteViews(newFilter);
  };
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-gray-200 rounded-md">
        <FaUserAlt className="text-gray-500" />
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-gray-200 rounded-md">
        <FaFileAlt className="text-gray-500" />
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-gray-200 rounded-md">
        <FaTools className="text-gray-500" />
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-gray-200 rounded-md">
        <FaStar className="text-gray-500" />
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-gray-200 rounded-md">
        <FaSitemap className="text-gray-500" />
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-gray-200 rounded-md">
        <FaComment className="text-gray-500" />
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-gray-200 rounded-md">
        <FaChartLine className="text-gray-500" />
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
  <div className="flex items-center border rounded-lg bg-white shadow-md hover:shadow-lg transition-all p-4">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-blue-200 rounded-md">
        <FaSignInAlt className="text-blue-500" />
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
       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 chart-container">
          <div className="p-6 border border-teal-500 rounded-lg bg-white">
            <h2 className="text-lg font-semibold text-black mb-4">Login By Browser</h2>
            {!loading && (
              <Pie
                data={browserStats}
                options={{ responsive: true, maintainAspectRatio: true }}
              />
            )}
          </div>
          <div className="p-6 border border-teal-500 rounded-lg bg-white">
            <h2 className="text-lg font-semibold text-black mb-4">Login By OS</h2>
            {!loading && (
              <Pie
                data={osStats}
                options={{ responsive: true, maintainAspectRatio: true }}
              />
            )}
          </div>
          <div className="p-6 border border-teal-500 rounded-lg bg-white">
            <h2 className="text-lg font-semibold text-black mb-4">Login By Country</h2>
            {!loading && (
              <Pie
                data={countryStats}
                options={{ responsive: true, maintainAspectRatio: true }}
              />
            )}
          </div>
        </div>
      </>
    )}
  </Layout>
);
};

export default Dashboard;
