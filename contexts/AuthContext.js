import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import axios from 'axios';

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

  const login = (token) => {
    try {
      const decoded = jwt.decode(token);
      if (decoded) {
        setUser(decoded);
        localStorage.setItem('token', token);
      } else {
        console.error("Token decoding failed on login");
      }
    } catch (error) {
      console.error("Token verification failed on login:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  const updateUserProfile = async (formData) => {
    try {
      const response = await axios.post('/api/edit-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to update profile:', error.response ? error.response.data : error.message);
      throw new Error('Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
