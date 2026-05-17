import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, View, TextInput, FlatList, Text, TouchableOpacity, 
  SafeAreaView, StatusBar, Platform, ActivityIndicator, Image, Modal, ScrollView, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { flag } from 'country-emoji';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// IMPORT DU COMPOSANT SÉPARÉ ET DU CONTEXTE GLOBAL
import SearchBar from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';

const API = "https://osint-dashboard-backend.onrender.com";
const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  // --- CONSOMMATION DU THÈME GLOBAL ---
  const { theme } = useTheme();

  // --- ÉTATS DES DONNÉES ---
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  
  // --- ÉTATS NAVIGATION & FILTRES ---
  const [currentPage, setCurrentPage] = useState(0);
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);

  // --- ÉTATS MODAL DÉTAILS ---
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const dynamicOptions = useMemo(() => {
    if (!filterField || results.length === 0) return [];
    const values = results
      .map(item => item[filterField] || item.country || item.occupation || item.sex)
      .filter(val => val && val !== "N/A" && val !== "Inconnu");
    return [...new Set(values)].sort();
  }, [results, filterField]);

  const fetchResults = async (searchValue, page = 0, shouldAppend = false, fField = filterField, fValue = filterValue) => {
    setQuery(searchValue);
    if (!searchValue && !fField) return;
    if (page === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const encodedValue = encodeURIComponent(searchValue);
      let url = `${API}/search/global?value=${encodedValue}&page=${page}&size=50`;
      if (fField && fValue) url += `&filterField=${fField}&filterValue=${encodeURIComponent(fValue)}`;

      const res = await fetch(url);
      const data = await res.json();
      
      if (shouldAppend) setResults(prev => [...prev, ...(data.results || [])]);
      else setResults(data.results || []);
      
      setTotalCount(data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("❌ Erreur API:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleReset = () => {
    setFilterField("");
    setFilterValue("");
    setQuery("");
    setResults([]);
    setTotalCount(0);
  };

  const handleLoadMore = () => {
    if (!loadingMore && results.length < totalCount) {
      fetchResults(query, currentPage + 1, true);
    }
  };

  const handleExportJSON = async (person) => {
    try {
      const safeName = (person.name || person.fullName || "DATA").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `ANTIC_REPORT_${safeName}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      const jsonData = JSON.stringify(person, null, 2);

      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: 'utf8' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter le dossier dossier',
          UTI: 'public.json'
        });
      }
    } catch (error) {
      alert("Erreur d'exportation : " + error.message);
    }
  };

  const renderResultItem = ({ item }) => {
    const name = item.name || item.fullName || "Identité NC";
    const sex = item.sex || "M";
    const country = item.country || "NC";

    return (
      <TouchableOpacity 
        style={[styles.resultCard, { backgroundColor: theme.card, borderBottomColor: theme.border }]} 
        onPress={() => { setSelectedPerson(item); setModalVisible(true); }}
      >
        <View style={[styles.column, { flex: 1.5 }]}>
          <Text style={[styles.mainValue, { color: theme.textMain }]} numberOfLines={1}>{name}</Text>
          <View style={styles.subRow}>
            <Ionicons 
              name={sex.startsWith('F') ? "female" : "male"} 
              size={12} 
              color={sex.startsWith('F') ? "#ec4899" : "#3b82f6"} 
            />
            <Text style={[styles.subValue, { color: theme.textSub }]} numberOfLines={1}>{item.occupation || "Profession NC"}</Text>
          </View>
        </View>

        <View style={[styles.column, { flex: 1.2 }]}>
          <Text style={styles.labelTitle}>NUI: <Text style={[styles.labelValue, { color: theme.textMain }]}>{item.nui || "N/A"}</Text></Text>
          <Text style={styles.labelTitle}>FB: <Text style={[styles.labelValue, { color: theme.textMain }]}>{item.facebookId || item.fb_id || "N/A"}</Text></Text>
        </View>

        <View style={[styles.column, { flex: 1.8 }]}>
          <Text style={[styles.labelValue, { color: theme.textMain }]} numberOfLines={1}>{item.email || "---"}</Text>
          <Text style={styles.phoneValue}>{item.phonenumber || ""}</Text>
        </View>

        <View style={[styles.column, { flex: 0.8, alignItems: 'flex-end' }]}>
          <Text style={[styles.countryText, { color: theme.textMain }]}>{flag(country) || '🌍'} {country.substring(0, 3).toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.barStyle} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.miniLogo} />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.textMain }]}>ANTIC OSINT Tool</Text>
            <Text style={[styles.headerSub, { color: theme.isDark ? '#10b981' : '#059669' }]}>{totalCount.toLocaleString()} cibles identifiées</Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.resetIcon}>
            <Ionicons name="refresh-circle" size={32} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* RECHERCHE */}
        <View style={{ zIndex: 2000 }}>
          <SearchBar 
            onSearch={(q) => { fetchResults(q, 0, false); setIsSuggesting(false); }} 
            onReset={handleReset} 
            onSuggestState={(state) => setIsSuggesting(state)}
          />
        </View>

        {/* FILTRES AVEC VERROUILLAGE PointerEvents */}
        <View 
          style={styles.filterBar} 
          pointerEvents={isSuggesting ? 'none' : 'auto'}
        >
          <View style={[styles.pickerBox, { backgroundColor: theme.card, borderColor: theme.border }, isSuggesting && { opacity: 0.5 }]}>
            <Picker selectedValue={filterField} onValueChange={(val) => { setFilterField(val); setFilterValue(""); }} style={{ color: theme.textMain }} dropdownIconColor={theme.textSub}>
              <Picker.Item label="Filtrer par..." value="" color="#666" />
              <Picker.Item label="🌍 Pays" value="country" color={theme.textMain} />
              <Picker.Item label="💼 Profession" value="occupation" color={theme.textMain} />
              <Picker.Item label="📍 Adresse" value="address1" color={theme.textMain} />
              <Picker.Item label="👤 Sexe" value="sex" color={theme.textMain} />
            </Picker>
          </View>
          <View style={[styles.pickerBox, { flex: 1.2, backgroundColor: theme.card, borderColor: theme.border }, isSuggesting && { opacity: 0.5 }]}>
            <Picker selectedValue={filterValue} enabled={filterField !== ""} onValueChange={(val) => { setFilterValue(val); if (val) fetchResults(query, 0, false, filterField, val); }} style={{ color: theme.textMain }} dropdownIconColor={theme.textSub}>
              <Picker.Item label={filterField ? "Choisir une tendance..." : "---"} value="" color="#666" />
              {dynamicOptions.map((opt, index) => <Picker.Item key={index} label={opt} value={opt} color={theme.textMain} />)}
            </Picker>
          </View>
        </View>

        <View style={styles.countContainer}>
           <Text style={[styles.countText, { color: theme.textSub }]}>Affichage : <Text style={[styles.countHighlight, { color: theme.isDark ? '#10b981' : '#059669' }]}>{results.length}</Text> / <Text style={[styles.countHighlight, { color: theme.isDark ? '#10b981' : '#059669' }]}>{totalCount.toLocaleString()}</Text> résultats</Text>
        </View>

        <View style={[styles.tableHeader, { backgroundColor: theme.isDark ? '#334155' : '#e2e8f0' }]}>
          <Text style={[styles.thText, { color: theme.isDark ? '#cbd5e1' : '#4b5563', flex: 1.5 }]}>IDENTITÉ</Text>
          <Text style={[styles.thText, { color: theme.isDark ? '#cbd5e1' : '#4b5563', flex: 1.2 }]}>IDS</Text>
          <Text style={[styles.thText, { color: theme.isDark ? '#cbd5e1' : '#4b5563', flex: 1.8 }]}>CONTACT</Text>
          <Text style={[styles.thText, { color: theme.isDark ? '#cbd5e1' : '#4b5563', flex: 0.8, textAlign: 'right' }]}>PAYS</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.isDark ? '#10b981' : '#059669'} size="large" style={{marginTop: 50}} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderResultItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.isDark ? '#10b981' : '#059669'} size="large" style={{marginVertical: 20}} /> : null}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        {/* MODAL RESPONSIVE COMPLÈTE */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { backgroundColor: theme.isDark ? '#3b82f6' : '#2563eb' }]}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{selectedPerson?.name?.substring(0, 2).toUpperCase() || 'NC'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{selectedPerson?.name}</Text>
                  <Text style={styles.modalSub}>{selectedPerson?.occupation || 'Profession NC'}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <InfoGroup title="Etat Civil & Identité" icon="person" color={theme.tabActive}>
                  <InfoItem label="NOM COMPLET" value={selectedPerson?.name} theme={theme} />
                  <View style={styles.infoRow}>
                    <InfoItem label="SEXE" value={selectedPerson?.sex} flex={1} theme={theme} />
                    <InfoItem label="STATUT MATRIMONIAL" value={selectedPerson?.maritalstatus} flex={1} theme={theme} />
                  </View>
                  <View style={styles.infoRow}>
                    <InfoItem label="DATE DE NAISSANCE" value={selectedPerson?.dateOfBirth} flex={1} theme={theme} />
                    <InfoItem label="LIEU DE NAISSANCE" value={selectedPerson?.placeofbirth} flex={1} theme={theme} />
                  </View>
                </InfoGroup>

                <InfoGroup title="Coordonnées & Localisation" icon="call" color={theme.tabActive}>
                  <InfoItem label="NUMÉRO DE TÉLÉPHONE" value={selectedPerson?.phonenumber} theme={theme} />
                  <InfoItem label="ADRESSE EMAIL" value={selectedPerson?.email} theme={theme} />
                  <InfoItem label="ADRESSE PRINCIPALE (1)" value={selectedPerson?.address1} theme={theme} />
                  <InfoItem label="ADRESSE SECONDAIRE (2)" value={selectedPerson?.address2} theme={theme} />
                  <InfoItem label="PAYS" value={`${flag(selectedPerson?.country) || '🌍'} ${selectedPerson?.country}`} theme={theme} />
                </InfoGroup>

                <InfoGroup title="Vie Professionnelle" icon="briefcase" color={theme.tabActive}>
                  <InfoItem label="PROFESSION / OCCUPATION" value={selectedPerson?.occupation} theme={theme} />
                  <InfoItem label="LIEU DE TRAVAIL" value={selectedPerson?.placeofwork} theme={theme} />
                </InfoGroup>

                <InfoGroup title="Métadonnées d'Audit" icon="finger-print" color={theme.tabActive}>
                  <InfoItem label="NUI (MATRICULE)" value={selectedPerson?.nui} theme={theme} />
                  <InfoItem label="FACEBOOK ID" value={selectedPerson?.facebookId} theme={theme} />
                  <InfoItem label="DATE DE CRÉATION RECORD" value={selectedPerson?.creationdatetime} theme={theme} />
                  <View style={[styles.rawBox, { backgroundColor: theme.isDark ? '#020617' : '#f8fafc', borderColor: theme.isDark ? '#ef4444' : '#dc2626' }]}>
                    <Text style={styles.infoLabel}>RAW DATA (SOURCE)</Text>
                    <Text style={[styles.rawText, { color: theme.isDark ? '#ef4444' : '#b91c1c' }]}>{selectedPerson?.raw || "Aucune donnée brute"}</Text>
                  </View>
                </InfoGroup>
              </ScrollView>

              <View style={[styles.modalFooter, { backgroundColor: theme.card }]}>
                <TouchableOpacity style={[styles.btnExport, { backgroundColor: theme.tabActive }]} onPress={() => handleExportJSON(selectedPerson)}>
                  <Ionicons name="cloud-download-outline" size={20} color="white" />
                  <Text style={styles.btnExportText}>Générer Rapport (.JSON)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnClose, { backgroundColor: theme.isDark ? '#334155' : '#f1f5f9' }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.btnCloseText, { color: theme.textMain }]}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const InfoGroup = ({ title, icon, color, children }) => (
  <View style={styles.infoSection}>
    <Text style={[styles.sectionTitle, { color: color }]}><Ionicons name={icon} /> {title}</Text>
    {children}
  </View>
);

const InfoItem = ({ label, value, flex, theme }) => (
  <View style={[styles.infoBox, { backgroundColor: theme.isDark ? '#0f172a' : '#f1f5f9' }, flex ? { flex, marginRight: 5 } : {}]}>
    <Text style={[styles.infoLabel, { color: theme.isDark ? '#4b5563' : '#94a3b8' }]}> {label}</Text>
    <Text style={[styles.infoVal, { color: theme.textMain }]} numberOfLines={2}>{value || "Non renseigné"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 5 : 35, paddingBottom: 10 },
  miniLogo: { width: 42, height: 42, borderRadius: 21 },
  headerTextContainer: { marginLeft: 12, flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSub: { fontSize: 11, fontWeight: '600' },
  resetIcon: { padding: 5 },
  filterBar: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 10, gap: 10 },
  pickerBox: { flex: 1, borderRadius: 8, height: 45, justifyContent: 'center', borderWidth: 1 },
  picker: { width: '100%' },
  countContainer: { paddingHorizontal: 15, marginTop: 10 },
  countText: { fontSize: 11 },
  countHighlight: { fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', marginTop: 10, padding: 10, marginHorizontal: 10, borderRadius: 5 },
  thText: { fontSize: 10, fontWeight: 'bold' },
  resultCard: { flexDirection: 'row', marginHorizontal: 10, paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1 },
  column: { justifyContent: 'center' },
  mainValue: { fontSize: 12, fontWeight: 'bold' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  subValue: { fontSize: 10 },
  labelTitle: { color: '#64748b', fontSize: 8, fontWeight: 'bold' },
  labelValue: { fontSize: 10 },
  phoneValue: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  countryText: { fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 25, borderTopRightRadius: 25, height: height * 0.88, width: width, overflow: 'hidden' },
  modalHeader: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  modalBody: { padding: 20 },
  infoSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoBox: { padding: 12, borderRadius: 10, marginBottom: 8, flex: 1 },
  infoLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  infoVal: { fontSize: 13, fontWeight: '500' },
  rawBox: { padding: 15, borderRadius: 10, borderLeftWidth: 3 },
  rawText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  modalFooter: { padding: 20, flexDirection: 'row', gap: 10 },
  btnExport: { flex: 2, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 50 },
  btnExportText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  btnClose: { flex: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', height: 50 },
  btnCloseText: { fontWeight: 'bold' }
});