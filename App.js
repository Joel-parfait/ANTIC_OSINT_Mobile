import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import SearchScreen from './src/screens/SearchScreen';

export default function App() {
  const [agent, setAgent] = useState(null);
  const [token, setToken] = useState(null);

  const handleLoginSuccess = (userData, userToken) => {
    setAgent(userData);
    setToken(userToken);
  };

  if (!agent) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // On passe les infos de l'agent au Dashboard
  return <SearchScreen agent={agent} />;
}