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

const API = "https://osint-dashboard-backend.onrender.com";
const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(0);
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");

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

  // NOUVELLE FONCTION : EXPORT PHYSIQUE EN FICHIER .JSON
  const handleExportJSON = async (person) => {
    try {
      // Nettoyage du nom de fichier (on enlève les caractères spéciaux potentiels)
      const safeName = (person.fullName || person.name || "DATA").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `ANTIC_REPORT_${safeName}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      const jsonData = JSON.stringify(person, null, 2);

      // Ecriture du fichier en utilisant l'API Legacy importée
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { 
        encoding: 'utf8' 
      });

      // Partage du fichier physique
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter le rapport OSINT',
          UTI: 'public.json' // Pour une meilleure compatibilité iOS
        });
      } else {
        alert("Le partage n'est pas disponible sur cet appareil.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur d'exportation : " + error.message);
    }
  };

  const renderResultItem = ({ item }) => {
    const name = item.fullName || item.name || "Identité NC";
    const profession = item.occupation || item.job || "Profession NC";
    const sex = item.sex || item.gender || "M";
    const country = item.country || "NC";

    return (
      <TouchableOpacity 
        style={styles.resultCard} 
        onPress={() => { setSelectedPerson(item); setModalVisible(true); }}
      >
        <View style={[styles.column, { flex: 1.5 }]}>
          <Text style={styles.mainValue} numberOfLines={1}>{name}</Text>
          <View style={styles.subRow}>
            <Ionicons 
              name={sex.startsWith('F') ? "female" : "male"} 
              size={12} 
              color={sex.startsWith('F') ? "#ec4899" : "#3b82f6"} 
            />
            <Text style={styles.subValue} numberOfLines={1}>{profession}</Text>
          </View>
        </View>

        <View style={[styles.column, { flex: 1.2 }]}>
          <Text style={styles.labelTitle}>NUI: <Text style={styles.labelValue}>{item.nui || item.id || "N/A"}</Text></Text>
          <Text style={styles.labelTitle}>FB: <Text style={styles.labelValue}>{item.fb_id || "N/A"}</Text></Text>
        </View>

        <View style={[styles.column, { flex: 1.8 }]}>
          <Text style={styles.labelValue} numberOfLines={1}>{item.email || "---"}</Text>
          <Text style={styles.phoneValue}>{item.phonenumber || item.phone || ""}</Text>
        </View>

        <View style={[styles.column, { flex: 0.8, alignItems: 'flex-end' }]}>
          <Text style={styles.countryText}>{flag(country) || '🌍'} {country.substring(0, 3).toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.miniLogo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>ANTIC OSINT Tool</Text>
            <Text style={styles.headerSub}>{totalCount.toLocaleString()} cibles identifiées</Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.resetIcon}>
            <Ionicons name="refresh-circle" size={32} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <View style={styles.inputContainer}>
            <Ionicons name="search" size={18} color="#666" style={{marginLeft: 10}} />
            <TextInput
              style={styles.textInput}
              placeholder="Recherche..."
              placeholderTextColor="#444"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => fetchResults(query, 0, false)}
            />
          </View>
          <TouchableOpacity style={styles.btnSearch} onPress={() => fetchResults(query, 0, false)}>
            <Text style={styles.btnText}>GO</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterBar}>
          <View style={styles.pickerBox}>
            <Picker selectedValue={filterField} onValueChange={(val) => { setFilterField(val); setFilterValue(""); }} style={styles.picker} dropdownIconColor="#94a3b8">
              <Picker.Item label="Filtrer..." value="" color="#666" />
              <Picker.Item label="🌍 Pays" value="country" />
              <Picker.Item label="💼 Profession" value="occupation" />
              <Picker.Item label="📍 Adresse" value="address1" />
            </Picker>
          </View>
          <View style={[styles.pickerBox, { flex: 1.2 }]}>
            <Picker selectedValue={filterValue} enabled={filterField !== ""} onValueChange={(val) => { setFilterValue(val); if (val) fetchResults(query, 0, false, filterField, val); }} style={styles.picker} dropdownIconColor="#94a3b8">
              <Picker.Item label={filterField ? "Tendance..." : "---"} value="" color="#666" />
              {dynamicOptions.map((opt, index) => <Picker.Item key={index} label={opt} value={opt} />)}
            </Picker>
          </View>
        </View>

        <View style={styles.countContainer}>
           <Text style={styles.countText}>Affichage : <Text style={styles.countHighlight}>{results.length}</Text> / <Text style={styles.countHighlight}>{totalCount.toLocaleString()}</Text></Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.thText, {flex: 1.5}]}>IDENTITÉ</Text>
          <Text style={[styles.thText, {flex: 1.2}]}>IDS</Text>
          <Text style={[styles.thText, {flex: 1.8}]}>CONTACT</Text>
          <Text style={[styles.thText, {flex: 0.8, textAlign: 'right'}]}>PAYS</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#10b981" size="large" style={{marginTop: 50}} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderResultItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator color="#10b981" style={{marginVertical: 20}} /> : null}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        {/* MODAL RESPONSIVE */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalHeader, { backgroundColor: '#6366f1' }]}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{selectedPerson?.fullName?.substring(0, 2).toUpperCase() || 'AN'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{selectedPerson?.fullName || selectedPerson?.name}</Text>
                  <Text style={styles.modalSub}>{selectedPerson?.occupation || 'Profession NC'}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <InfoGroup title="Personal Information" icon="person">
                  <InfoItem label="FULL NAME" value={selectedPerson?.fullName || selectedPerson?.name} />
                  <InfoItem label="GENDER" value={selectedPerson?.sex || 'M'} />
                  <InfoItem label="MARITAL STATUS" value={selectedPerson?.maritalStatus || 'N/A'} />
                </InfoGroup>

                <InfoGroup title="Contact Details" icon="call">
                  <InfoItem label="EMAIL" value={selectedPerson?.email || 'N/A'} />
                  <InfoItem label="PHONE" value={selectedPerson?.phonenumber || selectedPerson?.phone || 'N/A'} />
                </InfoGroup>

                <InfoGroup title="Investigation Meta" icon="finger-print">
                  <InfoItem label="NUI / ID" value={selectedPerson?.nui || selectedPerson?.id} />
                  <InfoItem label="FB ID" value={selectedPerson?.fb_id || 'N/A'} />
                </InfoGroup>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.btnExport} onPress={() => handleExportJSON(selectedPerson)}>
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.btnExportText}>Save as .JSON</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

// Composants internes pour la propreté et le responsive
const InfoGroup = ({ title, icon, children }) => (
  <View style={styles.infoSection}>
    <Text style={styles.sectionTitle}><Ionicons name={icon} /> {title}</Text>
    {children}
  </View>
);

const InfoItem = ({ label, value }) => (
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoVal} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 5 : 35, paddingBottom: 10 },
  miniLogo: { width: 42, height: 42, borderRadius: 21 },
  headerTextContainer: { marginLeft: 12, flex: 1 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: '#10b981', fontSize: 11, fontWeight: '600' },
  resetIcon: { padding: 5 },
  searchBox: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 5, gap: 10 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 8, height: 48 },
  textInput: { flex: 1, color: 'white', paddingHorizontal: 10 },
  btnSearch: { backgroundColor: '#3b82f6', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 10, gap: 10 },
  pickerBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 8, height: 45, justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  picker: { color: '#f8fafc' },
  countContainer: { paddingHorizontal: 15, marginTop: 10 },
  countText: { color: '#94a3b8', fontSize: 11 },
  countHighlight: { color: '#10b981', fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#334155', marginTop: 10, padding: 10, marginHorizontal: 10, borderRadius: 5 },
  thText: { color: '#cbd5e1', fontSize: 10, fontWeight: 'bold' },
  resultCard: { flexDirection: 'row', backgroundColor: '#1e293b', marginHorizontal: 10, paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  column: { justifyContent: 'center' },
  mainValue: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  subValue: { color: '#94a3b8', fontSize: 10 },
  labelTitle: { color: '#64748b', fontSize: 8, fontWeight: 'bold' },
  labelValue: { color: '#cbd5e1', fontSize: 10 },
  phoneValue: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  countryText: { color: 'white', fontSize: 11, fontWeight: 'bold' },

  // MODAL RESPONSIVE STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContainer: { 
    backgroundColor: '#1e293b', 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    height: height * 0.85, // 85% de la hauteur de l'écran (Responsive)
    width: width, 
    overflow: 'hidden' 
  },
  modalHeader: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  modalBody: { padding: 20 },
  infoSection: { marginBottom: 20 },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  infoBox: { backgroundColor: '#0f172a', padding: 12, borderRadius: 10, marginBottom: 8 },
  infoLabel: { color: '#4b5563', fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  infoVal: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  modalFooter: { padding: 20, flexDirection: 'row', gap: 10, backgroundColor: '#1e293b' },
  btnExport: { flex: 2, backgroundColor: '#8b5cf6', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 50 },
  btnExportText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  btnClose: { flex: 1, backgroundColor: '#334155', borderRadius: 12, justifyContent: 'center', alignItems: 'center', height: 50 },
  btnCloseText: { color: 'white', fontWeight: 'bold' }
});