"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext'; // Adjust path if necessary
import styles from './ThemeToggleButton.module.css'; // We'll create this CSS module

// Optional: If you want to use icons, you might install react-icons
// import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'; // Example with Heroicons
// Or: import { FaSun, FaMoon } from 'react-icons/fa'; // Example with react-icons

export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggleButton}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {/* You can use text or icons here */}
      {theme === 'light' ? (
        // <MoonIcon className={styles.icon} /> /* Example with Heroicons */
        // <FaMoon className={styles.icon} /> /* Example with react-icons */
        <span>🌙 Dark</span> 
      ) : (
        // <SunIcon className={styles.icon} /> /* Example with Heroicons */
        // <FaSun className={styles.icon} /> /* Example with react-icons */
        <span>☀️ Light</span>
      )}
    </button>
  );
};
