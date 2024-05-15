import React from 'react';
import Layout from './layout';
import ProtectedRoute from '../ProtectedRoute';


const Dashboard = () => {
    return (
        <ProtectedRoute>
   
       <Layout>
        <h1>Hi,Admin Dashbaord</h1>
       </Layout>
                
       </ProtectedRoute>
    );
};

export default Dashboard;