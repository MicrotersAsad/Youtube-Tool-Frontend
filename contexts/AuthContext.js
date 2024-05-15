import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded) {
        setUser(decoded);
        console.log("User set in AuthContext: ", decoded); // Debugging
      } else {
        console.log("Token decoding failed");
      }
    } else {
      console.log("Token not found in cookies");
    }
  }, []);

  const login = (token) => {
    const decoded = jwt.decode(token);
    if (decoded) {
      setUser(decoded);
      Cookies.set('token', token);
      console.log("User logged in: ", decoded); // Debugging
    } else {
      console.log("Token decoding failed on login");
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
