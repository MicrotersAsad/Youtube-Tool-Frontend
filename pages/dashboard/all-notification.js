import React from 'react';
import NotificationList from '../../components/NotificationList';
import Layout from './layout';
import { useAuth } from '../../contexts/AuthContext';

const Allnotification = () => {
    const { user } = useAuth(); // Context থেকে user ডেটা
    return (
        <Layout>
            <NotificationList  user={user}/>
        </Layout>
    );
};

export default Allnotification;