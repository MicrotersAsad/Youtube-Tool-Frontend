import { createContext, useContext, useState } from "react";

// Create the context
const AuthContext = createContext(null);

// Export the useContext Hook
export function useAuth() {
    return useContext(AuthContext);
}

// Define a provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (token) => {
        // Here you would typically validate the token and fetch user details
        // Simulate a login by setting the user object
        setUser({ token });
    };

    const logout = () => {
        // Clear the user state
        setUser(null);
    };

    const value = {
        user,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
