import { useEffect } from 'react';
import { useRouter } from 'next/router';

import Layout from './layout';

import { useAuth } from '../../contexts/AuthContext';
import AllUsers from './all-user';


const UsersPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("UsersPage component - User: ", user); // ডিবাগging
    if (!user) {
      router.push('/login'); // Redirect to login if not logged in
    } else if (user.role !== 'admin') {
      router.push('/dashboard'); // Redirect if not admin
    }
  }, [user]);

  return (
    <Layout>
      {user && user.role === 'admin' ? <AllUsers /> : null}
    </Layout>
  );
};

export default UsersPage;
