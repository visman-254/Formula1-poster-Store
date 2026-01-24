import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import useIdle from "../hooks/useIdle"; // Import the useIdle hook

import API_BASE from "../config";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

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
      const decoded = jwtDecode(storedToken);
      if (decoded.exp < Date.now() / 1000) {
        logout("Your session has expired. Please log in again.");
      } else {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const login = async ({ username, password }) => {
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
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));

    setToken(token);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const signup = async ({ username, password, email }) => {
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
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));

    setToken(token);
    setUser(loggedInUser);
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

export const useUser = () => useContext(UserContext);
