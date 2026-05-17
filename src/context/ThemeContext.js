import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    isDark: true,
    bg: '#0f172a',
    card: '#1e293b',
    textMain: '#ffffff',
    textSub: '#94a3b8',
    border: '#334155',
    barStyle: 'light-content',
    tabActive: '#10b981',
    tabInactive: '#64748b'
  },
  light: {
    isDark: false,
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#0f172a',
    textSub: '#64748b',
    border: '#e2e8f0',
    barStyle: 'dark-content',
    tabActive: '#3b82f6', // Bleu plus visible en mode clair
    tabInactive: '#94a3b8'
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(themes.dark); // Mode sombre par défaut pour l'ANTIC

  const toggleTheme = () => {
    setTheme(prev => prev.isDark ? themes.light : themes.dark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}