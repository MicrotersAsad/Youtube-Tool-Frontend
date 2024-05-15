import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || (role && user.role !== role)) {
      router.push('/login');
    }
  }, [user, role, router]);

  if (!user || (role && user.role !== role)) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
