import React, { useEffect } from 'react';
import Layout from './layout';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';


const Dashboard = () => {
    const { user, logout } = useAuth();

    useEffect(() => {
      console.log("User object: ", user); // Debugging
    }, [user]);
  

    return (
        <ProtectedRoute>
   
       <Layout>
        <h1>Hi,{user?.username}</h1>
       </Layout>
                
       </ProtectedRoute>
    );
};

export default Dashboard;