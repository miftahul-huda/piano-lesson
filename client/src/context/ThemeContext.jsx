import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'theme-dark';
    });

    useEffect(() => {
        // Remove old theme classes
        document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-ocean');
        // Add current theme class
        document.documentElement.classList.add(theme);
        // Save to localStorage
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
