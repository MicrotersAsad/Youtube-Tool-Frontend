import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userFetched, setUserFetched] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check token validity (expiration)
  const isTokenExpired = (token) => {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  // Fetch user profile
  const fetchUserProfile = async (decoded) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Token is expired or invalid');
      }
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser({ ...decoded, ...response.data });
      setUserFetched(true);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      setUser(null);
      setUserFetched(false);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth on page load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !userFetched) {
        setLoading(true);
        if (isTokenExpired(token)) {
          console.warn('Token is expired');
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          router.push('/login');
          return;
        }
        try {
          const decoded = jwt.decode(token);
          if (decoded) {
            await fetchUserProfile(decoded);
          } else {
            throw new Error('Token decoding failed');
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          router.push('/login');
        }
      } else {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [userFetched, router]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/login', { email, password });
      const token = response.data.token;
      if (!token) throw new Error('No token received');
      localStorage.setItem('token', token);
      const decoded = jwt.decode(token);
      if (decoded && !isTokenExpired(token)) {
        setUserFetched(false);
        await fetchUserProfile(decoded);
        router.push('/dashboard'); // Redirect to dashboard after login
      } else {
        throw new Error('Invalid or expired token');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setUserFetched(false);
    router.push('/login');
  };

  // Update user profile
  const updateUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Token is expired or invalid');
      }
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser((prevUser) => ({ ...prevUser, ...response.data }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      localStorage.removeItem('token');
      setUser(null);
      setUserFetched(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);