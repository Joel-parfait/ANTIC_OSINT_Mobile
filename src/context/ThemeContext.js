import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

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
    tabActive: '#3b82f6',
    tabInactive: '#94a3b8'
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(themes.dark);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  
  // Référence interne pour déclencher la déconnexion globale depuis n'importe quel écran
  const [logoutHandler, setLogoutHandler] = useState(null);

  useEffect(() => {
    const loadSecurePreferences = async () => {
      try {
        const stored2FA = await SecureStore.getItemAsync('is2FAEnabled');
        const storedBio = await SecureStore.getItemAsync('isBiometricEnabled');
        
        if (stored2FA !== null) setIs2FAEnabled(stored2FA === 'true');
        if (storedBio !== null) setIsBiometricEnabled(storedBio === 'true');
      } catch (error) {
        console.error("Erreur d'initialisation matérielle :", error);
      }
    };
    loadSecurePreferences();
  }, []);

  const update2FAState = async (value) => {
    setIs2FAEnabled(value);
    await SecureStore.setItemAsync('is2FAEnabled', value ? 'true' : 'false');
  };

  const updateBiometricState = async (value) => {
    setIsBiometricEnabled(value);
    await SecureStore.setItemAsync('isBiometricEnabled', value ? 'true' : 'false');
  };

  const toggleTheme = () => {
    setTheme(prev => prev.isDark ? themes.light : themes.dark);
  };

  // Déclencheur global appelé par SettingsScreen
  const executeGlobalLogout = () => {
    if (logoutHandler) {
      logoutHandler();
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      is2FAEnabled, 
      setIs2FAEnabled: update2FAState, 
      isBiometricEnabled, 
      setIsBiometricEnabled: updateBiometricState,
      registerLogoutHandler: setLogoutHandler,
      logoutAgentGlobal: executeGlobalLogout
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}