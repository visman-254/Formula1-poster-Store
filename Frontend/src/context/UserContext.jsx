// src/context/UserContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import useIdle from "../hooks/useIdle";

import API_BASE from "../config";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout function
  const logout = (message) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);

    if (message) sessionStorage.setItem("expiredMessage", message);
    navigate("/login");
  };

  // Set up the idle timer
  useIdle(900000, () => {
    // 15 minutes
    if (user) {
      logout("Your session has expired due to inactivity.");
    }
  });

  // Load from localStorage on start
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp < Date.now() / 1000) {
          logout("Your session has expired. Please log in again.");
        } else {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Auto-redirect cashier to POS page
          if (parsedUser.role === 'cashier' && window.location.pathname !== '/pos' && window.location.pathname !== '/login') {
            window.location.href = '/pos';
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        logout("Invalid session. Please log in again.");
      }
    }
    setLoading(false);
  }, []);

  const login = async ({ username, password }) => {
    try {
      const response = await axios.post(`${API_BASE}/api/login`, {
        username,
        password,
      });
      const { token, user } = response.data;

      const loggedInUser = {
        id: user.id,
        username: user.username,
        role: user.role || "user",
        email: user.email,
        name: user.name || user.username,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      setToken(token);
      setUser(loggedInUser);

      // Redirect based on role
      if (loggedInUser.role === 'cashier') {
        window.location.href = '/pos';
      } else if (loggedInUser.role === 'admin') {
        // Admin always goes to the admin dashboard
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/admin';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
      } else {
        // Regular user
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
      }

      return { success: true, user: loggedInUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const signup = async ({ username, password, email }) => {
    try {
      const response = await axios.post(`${API_BASE}/api/signup`, {
        username,
        password,
        email,
      });
      const { token, user } = response.data;

      const loggedInUser = {
        id: user.id,
        username: user.username,
        role: user.role || "user",
        email: user.email,
        name: user.name || user.username,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      setToken(token);
      setUser(loggedInUser);

      // After signup, regular users go to home
      window.location.href = '/';

      return { success: true, user: loggedInUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API_BASE}/api/forgot-password`, {
        email,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "An error occurred",
      };
    }
  };

  const resetUserPassword = async (token, password) => {
    try {
      const response = await axios.post(`${API_BASE}/api/reset-password`, {
        token,
        newPassword: password,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "An error occurred",
      };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        forgotPassword,
        resetUserPassword,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};