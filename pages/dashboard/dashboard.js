import React, { useEffect, useState } from 'react';
import Layout from './layout';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import ChartComponent from './ChartComponent';

const Dashboard = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [filter, setFilter] = useState('daily');

  useEffect(() => {
    console.log("User object: ", user); // Debugging
    fetchData(filter);
  }, [user, filter]);

  const fetchData = async (filter) => {
    try {
      const response = await fetch(`/api/user-visits?filter=${filter}`);
      const data = await response.json();
      console.log(`Number of visits (${filter}):`, data.length); // Log the number of visits

      setChartData(processData(data));
      setLabels(getLabels(data));
    } catch (error) {
      console.error('Error fetching user visit data:', error);
    }
  };

  const processData = (data) => {
    return data.map(item => item.value);
  };

  const getLabels = (data) => {
    return data.map(item => item.date);
  };

  const handleFilterChange = (filter) => {
    setFilter(filter);
    fetchData(filter);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <h1 className="text-2xl font-bold">Hi, {user?.username}</h1>
        <div className="mt-4">
          <select
            onChange={(e) => handleFilterChange(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="mt-8">
          <ChartComponent data={chartData} labels={labels} />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Dashboard;
