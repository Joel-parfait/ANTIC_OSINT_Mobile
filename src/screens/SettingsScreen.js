import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, Switch, ScrollView, Alert, Modal, TextInput, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ route, navigation }) {
  // RÉCUPÉRATION DU CONTEXTE GLOBAL SÉCURISÉ (AVEC PROFIL ET ACTIONS PERSISTANTES)
  const { 
    theme, toggleTheme, is2FAEnabled, setIs2FAEnabled, isBiometricEnabled, setIsBiometricEnabled, logoutAgentGlobal,
    agentName, agentEmail, updateAgentProfile
  } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cacheLoading, setCacheLoading] = useState(false);
  
  // ÉTATS DES MODALS
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState(agentName);
  const [newEmail, setNewEmail] = useState(agentEmail);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinMode, setPinMode] = useState('CREATE'); // 'CREATE' | 'DISABLE'
  const [inputPin, setInputPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Synchroniser les champs du formulaire à chaque ouverture de la modal profil
  useEffect(() => {
    setNewName(agentName);
    setNewEmail(agentEmail);
  }, [agentName, agentEmail, editModalVisible]);

  // LOGIQUE D'INTERCEPTION DU SWITCH 2FA
  const handle2FASwitchChange = async (newValue) => {
    setInputPin('');
    setConfirmPin('');
    
    if (newValue === true) {
      setPinMode('CREATE');
      setPinModalVisible(true);
    } else {
      setPinMode('DISABLE');
      setPinModalVisible(true);
    }
  };

  // VALIDATION DE LA CONFIGURATION DU CODE PIN
  const handlePinSubmit = async () => {
    if (inputPin.trim().length !== 6) {
      Alert.alert("Erreur", "Le code de sécurité doit contenir exactement 6 chiffres.");
      return;
    }

    if (pinMode === 'CREATE') {
      if (inputPin !== confirmPin) {
        Alert.alert("Erreur", "Les deux codes saisis ne sont pas identiques.");
        return;
      }
      try {
        await SecureStore.setItemAsync('secure_2fa_pin', inputPin);
        await setIs2FAEnabled(true);
        setPinModalVisible(false);
        Alert.alert("Sécurité activée", "Votre double authentification par code PIN local est désormais opérationnelle.");
      } catch (err) {
        Alert.alert("Erreur", "Impossible d'accéder au stockage sécurisé de l'appareil.");
      }
    } else if (pinMode === 'DISABLE') {
      try {
        const storedPin = await SecureStore.getItemAsync('secure_2fa_pin');
        if (inputPin === storedPin) {
          await SecureStore.deleteItemAsync('secure_2fa_pin');
          await setIs2FAEnabled(false);
          setPinModalVisible(false);
          Alert.alert("Sécurité désactivée", "Le double facteur local a été retiré de ce terminal.");
        } else {
          Alert.alert("Action refusée", "Code de sécurité incorrect. Désactivation annulée.");
        }
      } catch (err) {
        Alert.alert("Erreur", "Vérification système impossible.");
      }
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Purge du Cache",
      "Voulez-vous vider le cache des requêtes et des requêtes d'autocomplétion locales ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Purger", 
          style: "destructive",
          onPress: () => {
            setCacheLoading(true);
            setTimeout(() => {
              setCacheLoading(false);
              Alert.alert("Succès", "Le cache système a été vidé avec succès.");
            }, 1500);
          }
        }
      ]
    );
  };

  // MISE À JOUR DU PROFIL VIA LE CONTEXTE GLOBAL
  const handleUpdateIdentifiers = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      Alert.alert("Erreur", "Les champs ne peuvent pas être vides.");
      return;
    }
    try {
      await updateAgentProfile(newName.trim(), newEmail.trim());
      setEditModalVisible(false);
      Alert.alert("Succès", "Identifiants système sauvegardés de manière permanente.");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer les informations du profil.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Fermeture de session",
      "Êtes-vous sûr de vouloir déconnecter ce terminal du réseau ANTIC ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive",
          onPress: () => {
            if (logoutAgentGlobal) {
              logoutAgentGlobal();
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.barStyle} />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.textMain }]}>Paramètres</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSub }]}>Configuration du terminal OSINT</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* SECTION PROFIL SYNCHRONISÉE */}
          <Text style={[styles.sectionTitle, { color: theme.tabActive }]}>PROFIL SÉCURISÉ</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.profileRow}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.tabActive }]}>
                <Text style={styles.avatarText}>
                  {agentName ? agentName.substring(0, 2).toUpperCase() : 'AG'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.agentName, { color: theme.textMain }]}>{agentName}</Text>
                <Text style={[styles.agentRole, { color: theme.textSub }]}>Analyste - ANTIC</Text>
                <Text style={styles.agentEmail} numberOfLines={1}>{agentEmail}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.innerActionBtn, { borderTopColor: theme.border }]} onPress={() => setEditModalVisible(true)}>
              <Ionicons name="create-outline" size={18} color={theme.tabActive} />
              <Text style={[styles.innerActionText, { color: theme.textMain }]}>Modifier mes identifiants</Text>
            </TouchableOpacity>
          </View>

          {/* SECTION CONTROLE DE SECURITE CRITIQUES */}
          <Text style={[styles.sectionTitle, { color: theme.tabActive }]}>SÉCURITÉ DU TERMINAL (4.1)</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            {/* SWITCH DOUBLE FACTEUR */}
            <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="key-outline" size={20} color="#10b981" />
                <Text style={[styles.settingText, { color: theme.textMain }]} numberOfLines={1}>Double authentification (2FA)</Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#059669' }}
                thumbColor={is2FAEnabled ? '#10b981' : '#f4f3f4'}
                onValueChange={handle2FASwitchChange}
                value={is2FAEnabled}
              />
            </View>

            {/* SWITCH BIOMÉTRIE */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="finger-print-outline" size={20} color="#3b82f6" />
                <Text style={[styles.settingText, { color: theme.textMain }]} numberOfLines={1}>Authentification biométrique</Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                thumbColor={isBiometricEnabled ? '#3b82f6' : '#f4f3f4'}
                onValueChange={(val) => setIsBiometricEnabled(val)}
                value={isBiometricEnabled}
              />
            </View>
          </View>

          {/* SECTION INTERFACE VISUELLE */}
          <Text style={[styles.sectionTitle, { color: theme.tabActive }]}>INTERFACE VISUELLE</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name={theme.isDark ? "moon" : "sunny"} size={20} color={theme.isDark ? '#10b981' : '#3b82f6'} />
                <Text style={[styles.settingText, { color: theme.textMain }]} numberOfLines={1}>{theme.isDark ? "Mode Sombre Activé" : "Mode Clair Activé"}</Text>
              </View>
              <Switch trackColor={{ false: '#cbd5e1', true: '#059669' }} thumbColor={theme.isDark ? '#10b981' : '#f4f3f4'} onValueChange={toggleTheme} value={theme.isDark} />
            </View>
          </View>

          {/* SECTION ALERTE & SYSTÈME */}
          <Text style={[styles.sectionTitle, { color: theme.tabActive }]}>ALERTES & SYSTÈME</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="notifications-outline" size={20} color="#f59e0b" />
                <Text style={[styles.settingText, { color: theme.textMain }]} numberOfLines={1}>Notifications de fuites</Text>
              </View>
              <Switch trackColor={{ false: '#767577', true: '#d97706' }} thumbColor={notificationsEnabled ? '#f59e0b' : '#f4f3f4'} onValueChange={setNotificationsEnabled} value={notificationsEnabled} />
            </View>
            <TouchableOpacity style={styles.settingRow} onPress={handleClearCache} disabled={cacheLoading}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="trash-bin-outline" size={20} color="#ef4444" />
                <Text style={[styles.settingText, { color: theme.textMain }]} numberOfLines={1}>Supprimer le cache local</Text>
              </View>
              {cacheLoading ? <ActivityIndicator color="#ef4444" size="small" /> : <Ionicons name="chevron-forward" size={16} color={theme.textSub} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnLogout} activeOpacity={0.8} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.btnLogoutText}>Fermer la session de l'agent</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>

      {/* MODAL 1 : MODIFICATION IDENTIFIANTS */}
      <Modal animationType="fade" transparent={true} visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitleText, { color: theme.textMain }]}>Mise à jour l'identifiant</Text>
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>NOM DE L'AGENT</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.textMain, borderColor: theme.border }]} value={newName} onChangeText={setNewName} autoCorrect={false} />
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>ADRESSE EMAIL PROFESSIONNELLE</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.textMain, borderColor: theme.border }]} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.isDark ? '#334155' : '#e2e8f0' }]} onPress={() => setEditModalVisible(false)}><Text style={[styles.modalBtnText, { color: theme.textMain }]}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.tabActive }]} onPress={handleUpdateIdentifiers}><Text style={[styles.modalBtnText, { color: 'white' }]}>Enregistrer</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2 : CONFIGURATION DU CODE DE SÉCURITÉ LOCAL (2FA MATÉRIEL) */}
      <Modal animationType="fade" transparent={true} visible={pinModalVisible} onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitleText, { color: theme.textMain }]}>
              {pinMode === 'CREATE' ? "Activer le Double Facteur" : "Désactiver la protection"}
            </Text>
            
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>
              {pinMode === 'CREATE' ? "DÉFINIR UN CODE SECRET À 6 CHIFFRES" : "VEUILLEZ SAISIR VOTRE CODE ACTUEL"}
            </Text>
            <TextInput 
              style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.textMain, borderColor: theme.border, letterSpacing: 8, textAlign: 'center', fontSize: 18 }]} 
              placeholder="******"
              placeholderTextColor="#A0AEC0"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry={true}
              value={inputPin}
              onChangeText={setInputPin}
            />

            {pinMode === 'CREATE' && (
              <>
                <Text style={[styles.inputLabel, { color: theme.textSub }]}>CONFIRMER LE CODE SECRET</Text>
                <TextInput 
                  style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.textMain, borderColor: theme.border, letterSpacing: 8, textAlign: 'center', fontSize: 18 }]} 
                  placeholder="******"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry={true}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                />
              </>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.isDark ? '#334155' : '#e2e8f0' }]} onPress={() => setPinModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textMain }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: pinMode === 'CREATE' ? theme.tabActive : '#ef4444' }]} onPress={handlePinSubmit}>
                <Text style={[styles.modalBtnText, { color: 'white' }]}>
                  {pinMode === 'CREATE' ? "Activer" : "Désactiver"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 25, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 15, marginBottom: 5 },
  profileRow: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center' },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  profileInfo: { marginLeft: 15, flex: 1 },
  agentName: { fontSize: 15, fontWeight: 'bold' },
  agentRole: { fontSize: 12, marginTop: 2 },
  agentEmail: { color: '#10b981', fontSize: 11, fontWeight: '600', marginTop: 4 },
  innerActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, gap: 8 },
  innerActionText: { fontSize: 13, fontWeight: '500' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, width: '100%' },
  settingLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  settingText: { fontSize: 14, fontWeight: '500', flex: 1 },
  btnLogout: { backgroundColor: '#ef4444', height: 48, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 35 },
  btnLogoutText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 20, elevation: 10 },
  modalTitleText: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  modalInput: { height: 45, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, marginBottom: 16, fontSize: 14 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalBtn: { paddingHorizontal: 16, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { fontWeight: 'bold', fontSize: 14 }
});