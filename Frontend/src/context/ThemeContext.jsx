import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const currentTheme = isAdminPage ? 'dark' : theme;

    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

  }, [theme, isAdminPage]);

  const toggleTheme = () => {
    if (!isAdminPage) {
      setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: isAdminPage ? 'dark' : theme, toggleTheme, isThemeForced: isAdminPage }}>
      {children}
    </ThemeContext.Provider>
  );
};
