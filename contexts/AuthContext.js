import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded) {
          // Fetch the full user profile on page load to get profileImage and other data
          fetchUserProfile(decoded);
        } else {
          console.error("Token decoding failed");
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  }, [router]);

  const fetchUserProfile = async (decoded) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser({ ...decoded, ...response.data }); // Merge decoded token data with API response
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const token = response.data.token;
      const decoded = jwt.decode(token);
      if (decoded) {
        localStorage.setItem('token', token);
        fetchUserProfile(decoded); // Fetch full profile with profileImage after login
      } else {
        console.error("Token decoding failed on login");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  const updateUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(prevUser => ({ ...prevUser, ...response.data })); // Update only user data, keeping token data intact
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
