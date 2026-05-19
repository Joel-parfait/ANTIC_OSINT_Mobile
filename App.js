import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// IMPORT DU SYSTEME DE THEME GLOBAL
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Import de tes écrans
import LoginScreen from './src/screens/LoginScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function Placeholder({ name }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="construct-outline" size={50} color={theme.textSub} />
      <Text style={{ color: theme.textMain, marginTop: 10, fontSize: 16 }}>Module {name} en cours...</Text>
    </View>
  );
}

function NavigationApp({ agent, handleLogOutGlobal }) {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: theme.card, 
            borderTopColor: theme.border,
            height: 65,
            paddingBottom: 10,
            paddingTop: 5
          },
          tabBarActiveTintColor: theme.tabActive, 
          tabBarInactiveTintColor: theme.tabInactive,
          tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') iconName = 'grid-outline';
            else if (route.name === 'Analyse') iconName = 'analytics-outline';
            else if (route.name === 'Sources') iconName = 'server-outline';
            else if (route.name === 'Rapports') iconName = 'document-lock-outline';
            else if (route.name === 'Paramètres') iconName = 'shield-checkmark-outline';
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={SearchScreen} 
          initialParams={{ agent: agent }} 
        />
        <Tab.Screen name="Analyse" children={() => <Placeholder name="Statistiques" />} />
        <Tab.Screen name="Sources" children={() => <Placeholder name="Sources de données" />} />
        <Tab.Screen name="Rapports" children={() => <Placeholder name="Rapports d'audit" />} />
        
        {/* RECONNEXION PROPRE SANS INTERFÉRENCE AVEC L'HISTORIQUE DE NAVIGATION */}
        <Tab.Screen 
          name="Paramètres"
          component={SettingsScreen}
          initialParams={{ agent: agent }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// COMPOSANT INTERNE POUR LE FLUX D'AUTHENTIFICATION
function AppContent({ agent, setAgent, setToken }) {
  const handleLoginSuccess = (userData, userToken) => {
    setAgent(userData);
    setToken(userToken);
  };

  const handleLogOutGlobal = () => {
    setAgent(null);
    setToken(null);
  };

  if (!agent) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <NavigationApp agent={agent} handleLogOutGlobal={handleLogOutGlobal} />;
}

export default function App() {
  const [agent, setAgent] = useState(null);
  const [token, setToken] = useState(null);

  return (
    <ThemeProvider>
      <AppContent 
        agent={agent} 
        setAgent={setAgent} 
        setToken={setToken} 
      />
    </ThemeProvider>
  );
}