'use client';

import { useState, useEffect } from 'react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  // Initial theme check
  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setIsDark(true);
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nextTheme = !prev ? 'dark' : 'light';
      if (nextTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
      }
      return !prev;
    });
  };

  return (
    <button 
      className={`${styles.toggleBtn} ${!isDark ? styles.light : ''}`} 
      onClick={toggleTheme}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Alternar tema claro/oscuro"
    >
      <div className={styles.iconContainer}>
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}
