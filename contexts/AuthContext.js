import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);  // ইউজারের প্রোফাইল স্টেট
  const [userFetched, setUserFetched] = useState(false);  // ইউজার প্রোফাইল ফেচ হয়েছে কিনা সেটা ট্র্যাক করার জন্য ফ্ল্যাগ
  const [loading, setLoading] = useState(true);  // লোডিং স্টেট
  const router = useRouter();

  // `useEffect` - ইউজার প্রোফাইল ফেচ করার জন্য
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !userFetched) {  // যদি টোকেন থাকে এবং ইউজারের প্রোফাইল ফেচ করা না হয়ে থাকে
      setLoading(true);
      const decoded = jwt.decode(token);
      if (decoded) {
        fetchUserProfile(decoded);  // ইউজারের প্রোফাইল ফেচ করা হবে
      } else {
        console.error("Token decoding failed");
        setLoading(false);
      }
    } else {
      setLoading(false);  // টোকেন না থাকলে বা ইউজার ফেচ হয়ে থাকলে লোডিং বন্ধ করা হবে
    }
  }, [userFetched, router]);  // `userFetched` পরিবর্তিত হলে পুনরায় রান হবে

  // ইউজারের প্রোফাইল ফেচ করার ফাংশন
  const fetchUserProfile = async (decoded) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser({ ...decoded, ...response.data });  // ইউজারের প্রোফাইল সেট করা
      setUserFetched(true);  // ইউজারের প্রোফাইল ফেচ হয়েছে, তাই ফ্ল্যাগটি true করা
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);  // API কল শেষে লোডিং বন্ধ
    }
  };

  // লগিন ফাংশন
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const token = response.data.token;
      const decoded = jwt.decode(token);
      if (decoded) {
        localStorage.setItem('token', token);
        setUserFetched(false);  // লগিন হওয়ার পর ফ্ল্যাগটি false করতে হবে, নতুনভাবে প্রোফাইল ফেচ করার জন্য
        fetchUserProfile(decoded);  // লগিন হওয়ার পর ইউজারের প্রোফাইল ফেচ করা
      } else {
        console.error("Token decoding failed on login");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // লগআউট ফাংশন
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  // প্রোফাইল আপডেট ফাংশন
  const updateUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(prevUser => ({ ...prevUser, ...response.data })); // ইউজারের প্রোফাইল আপডেট করা
    } catch (error) {
      console.error('Failed to update profile:', error);
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
