import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Users from '../../components/Users';
import Layout from '../../components/Layout';

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
      {user && user.role === 'admin' ? <Users /> : null}
    </Layout>
  );
};

export default UsersPage;
