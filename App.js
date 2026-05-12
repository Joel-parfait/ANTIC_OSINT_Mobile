import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Import de tes écrans
import LoginScreen from './src/screens/LoginScreen';
import SearchScreen from './src/screens/SearchScreen';

const Tab = createBottomTabNavigator();

// Composant Placeholder pour les pages que nous allons coder juste après
function Placeholder({ name }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="construct-outline" size={50} color="#64748b" />
      <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>Module {name} en cours...</Text>
    </View>
  );
}

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

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: '#0f172a', 
            borderTopColor: '#1e293b',
            height: 65,
            paddingBottom: 10,
            paddingTop: 5
          },
          tabBarActiveTintColor: '#10b981', // Vert ANTIC
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') iconName = 'grid-outline';
            else if (route.name === 'Analyse') iconName = 'analytics-outline';
            else if (route.name === 'Sources') iconName = 'server-outline';
            else if (route.name === 'Reports') iconName = 'document-lock-outline';
            else if (route.name === 'Settings') iconName = 'shield-checkmark-outline';
            
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
        <Tab.Screen name="Reports" children={() => <Placeholder name="Rapports d'audit" />} />
        <Tab.Screen name="Settings" children={() => <Placeholder name="Paramètres" />} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}