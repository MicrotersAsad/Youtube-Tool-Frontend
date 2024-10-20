import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import PropTypes from 'prop-types'; // Import prop-types

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
          setUser(decoded);
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

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const token = response.data.token;
      const decoded = jwt.decode(token);
      if (decoded) {
        setUser(decoded);
        localStorage.setItem('token', token);
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
      setUser(response.data); // Ensure the response contains the profileImage field
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
  children: PropTypes.node.isRequired, // Add prop type validation for children
};

export const useAuth = () => useContext(AuthContext);
