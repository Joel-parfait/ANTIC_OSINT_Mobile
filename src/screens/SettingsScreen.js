import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, Switch, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Import du hook de thème

export default function SettingsScreen({ route }) {
  const agent = route?.params?.agent || { name: "Agent CIRT", email: "cirt@antic.cm" };
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // ON RECUPERE LE THEME GLOBAL ET LA FONCTION POUR CHANGER
  const { theme, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.barStyle} />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.textMain }]}>Paramètres</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSub }]}>Configuration du terminal OSINT</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* SECTION PROFIL */}
          <Text style={[styles.sectionTitle, { color: theme.tabActive }]}>PROFIL SÉCURISÉ</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.profileRow}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.tabActive }]}>
                <Text style={styles.avatarText}>
                  {agent.name ? agent.name.substring(0, 2).toUpperCase() : 'AG'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.agentName, { color: theme.textMain }]}>{agent.name}</Text>
                <Text style={[styles.agentRole, { color: theme.textSub }]}>Analyste Cyber - ANTIC</Text>
                <Text style={styles.agentEmail} numberOfLines={1}>{agent.email}</Text>
              </View>
            </View>
          </View>

          {/* SECTION UNIQUE INTERRUPTEUR THEME */}
          <Text style={[styles.sectionTitle, { color: theme.tabActive }]}>INTERFACE VISUELLE</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Ionicons 
                  name={theme.isDark ? "moon" : "sunny"} 
                  size={20} 
                  color={theme.isDark ? '#10b981' : '#3b82f6'} 
                />
                <Text style={[styles.settingText, { color: theme.textMain }]}>
                  {theme.isDark ? "Mode Sombre Activé" : "Mode Clair Activé"}
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#059669' }}
                thumbColor={theme.isDark ? '#10b981' : '#f4f3f4'}
                onValueChange={toggleTheme} // APPEL DE LA FONCTION GLOBALE
                value={theme.isDark}
              />
            </View>
          </View>

          {/* SECTION ALERTE */}
          <Text style={[styles.sectionTitle, { color: theme.tabActive }]}>ALERTES & FLUX</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="notifications-outline" size={20} color="#f59e0b" />
                <Text style={[styles.settingText, { color: theme.textMain }]}>Notifications de fuites</Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#d97706' }}
                thumbColor={notificationsEnabled ? '#f59e0b' : '#f4f3f4'}
                onValueChange={setNotificationsEnabled}
                value={notificationsEnabled}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.btnLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.btnLogoutText}>Fermer la session de l'agent</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 25, marginBottom: 10, letterSpacing: 0.5 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 15 },
  profileRow: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center' },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  profileInfo: { marginLeft: 15, flex: 1 },
  agentName: { fontSize: 15, fontWeight: 'bold' },
  agentRole: { fontSize: 12, marginTop: 2 },
  agentEmail: { color: '#10b981', fontSize: 11, fontWeight: '600', marginTop: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  settingLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 14, fontWeight: '500' },
  btnLogout: { backgroundColor: '#ef4444', height: 48, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 35 },
  btnLogoutText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});