import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, Image, 
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store'; // AJOUT DE SECURE_STORE POUR LIRE LE VRAI PIN
import { loginAgent } from '../api/authService';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ onLoginSuccess }) {
  const { is2FAEnabled, isBiometricEnabled } = useTheme();

  const [loginStep, setLoginStep] = useState('CREDENTIALS'); 
  const [savedUser, setSavedUser] = useState(null);
  const [savedToken, setSavedToken] = useState(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs institutionnels.");
      return;
    }

    setIsLoading(true);
    const result = await loginAgent(username, password);
    setIsLoading(false);

    if (result.success) {
      setSavedUser(result.user);
      setSavedToken(result.token);

      if (is2FAEnabled) {
        setLoginStep('2FA');
      } else if (isBiometricEnabled) {
        triggerBiometricAuth(result.user, result.token);
      } else {
        onLoginSuccess(result.user, result.token);
      }
    } else {
      Alert.alert("Échec d'authentification", result.message || "Identifiants invalides");
    }
  };

  // CORRECTION : VÉRIFICATION DYNAMIQUE DU VRAI PIN ENREGISTRÉ DANS LE STOCKAGE SÉCURISÉ
  const handleVerify2FA = async () => {
    if (twoFactorCode.trim().length !== 6) {
      Alert.alert("Erreur", "Le code de sécurité doit contenir 6 chiffres.");
      return;
    }

    try {
      // Lecture du code PIN local défini par l'agent dans les paramètres
      const storedPin = await SecureStore.getItemAsync('secure_2fa_pin');

      if (twoFactorCode === storedPin) { 
        if (isBiometricEnabled) {
          triggerBiometricAuth(savedUser, savedToken);
        } else {
          onLoginSuccess(savedUser, savedToken);
        }
      } else {
        Alert.alert("Code Invalide", "Le code de vérification double facteur saisi est incorrect.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de valider les éléments de sécurité du terminal.");
    }
  };

  const triggerBiometricAuth = async (user, token) => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Validation biométrique de l'agent",
        cancelLabel: "Annuler"
      });

      if (result.success) {
        onLoginSuccess(user, token);
      } else {
        Alert.alert("Refusé", "Vérification biométrique échouée.");
      }
    } else {
      onLoginSuccess(user, token);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginCard}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>

            <Text style={styles.title}>ANTIC OSINT Tool</Text>

            {loginStep === 'CREDENTIALS' ? (
              <View style={styles.form}>
                <Text style={styles.subtitle}>Authentification sécurisée requise pour l'accès au CIRT</Text>
                
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#3b82f6" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="#A0AEC0"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#f6ad55" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                    <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#718096" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.loginBtn, isLoading && { opacity: 0.7 }]} onPress={handleSignIn} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="white" /> : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={20} color="white" />
                      <Text style={styles.loginBtnText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.subtitle}>Double Authentification (2FA) active. Saisissez votre code de validation.</Text>
                
                <Text style={styles.label}>Code OTP de sécurité</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#10b981" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Entrez le code à 6 chiffres"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={twoFactorCode}
                    onChangeText={setTwoFactorCode}
                  />
                </View>

                <TouchableOpacity style={[styles.loginBtn, { backgroundColor: '#10B981' }]} onPress={handleVerify2FA}>
                  <Ionicons name="lock-open-outline" size={20} color="white" />
                  <Text style={styles.loginBtnText}>Confirmer le code</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.securityIndicator}>
              <Ionicons name="lock-closed" size={12} color="#f6ad55" />
              <Text style={styles.securityText}>Secure Connection • Encrypted Data</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 ANTIC - Tous droits réservés</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A202C' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  loginCard: { backgroundColor: 'white', width: '100%', maxWidth: 400, borderRadius: 12, padding: 30, alignItems: 'center', elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: "#22c55e", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  logo: { width: 80, height: 80 },
  title: { color: '#2F855A', fontSize: 22, fontWeight: '600', marginBottom: 10 },
  subtitle: { color: '#718096', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  form: { width: '100%' },
  label: { color: '#2D3748', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2F7', borderRadius: 8, height: 55, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#2D3748', fontSize: 15 },
  eyeIcon: { padding: 5 },
  loginBtn: { backgroundColor: '#10B981', height: 55, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  securityIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  securityText: { color: '#718096', fontSize: 11, marginLeft: 5 },
  footer: { paddingBottom: 20, alignItems: 'center' },
  footerText: { color: '#A0AEC0', fontSize: 11 }
});