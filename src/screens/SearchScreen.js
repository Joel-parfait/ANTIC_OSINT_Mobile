import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, View, TextInput, FlatList, Text, TouchableOpacity, 
  SafeAreaView, StatusBar, Platform, ActivityIndicator, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { flag } from 'country-emoji';

const API = "https://osint-dashboard-backend.onrender.com";

export default function SearchScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(0);
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const dynamicOptions = useMemo(() => {
    if (!filterField || results.length === 0) return [];
    // On mappe selon les clés réelles détectées dans tes captures
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
      
      if (fField && fValue) {
        url += `&filterField=${fField}&filterValue=${encodeURIComponent(fValue)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (shouldAppend) {
        setResults(prev => [...prev, ...(data.results || [])]);
      } else {
        setResults(data.results || []);
      }
      
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

  const renderResultItem = ({ item }) => {
    // LOGIQUE DE MAPPING ROBUSTE (Évite les "Inconnu")
    const name = item.fullName || item.name || "Identité NC";
    const profession = item.occupation || item.job || "Profession NC";
    const sex = item.sex || item.gender || "M";
    const nui = item.nui || item.id || "N/A";
    const fbid = item.fb_id || item.fbId || "N/A";
    const email = item.email || "---";
    const phone = item.phonenumber || item.phone || "";
    const address = item.address1 || item.location || "Adresse NC";
    const country = item.country || "NC";

    return (
      <View style={styles.resultCard}>
        {/* 1. IDENTITÉ */}
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

        {/* 2. IDS */}
        <View style={[styles.column, { flex: 1.2 }]}>
          <Text style={styles.labelTitle}>NUI: <Text style={styles.labelValue}>{nui}</Text></Text>
          <Text style={styles.labelTitle}>FB: <Text style={styles.labelValue}>{fbid}</Text></Text>
        </View>

        {/* 3. CONTACT & LOC */}
        <View style={[styles.column, { flex: 1.8 }]}>
          <Text style={styles.labelValue} numberOfLines={1}>{email}</Text>
          <Text style={styles.phoneValue}>{phone}</Text>
          <Text style={styles.locValue} numberOfLines={1}>{address}</Text>
        </View>

        {/* 4. PAYS */}
        <View style={[styles.column, { flex: 0.8, alignItems: 'flex-end' }]}>
          <Text style={styles.countryText}>
            {flag(country) || '🌍'} {country.substring(0, 3).toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.miniLogo} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>ANTIC OSINT Tool</Text>
          <Text style={styles.headerSub}>
            {totalCount.toLocaleString()} cibles identifiées
          </Text>
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
            placeholder="Recherche par nom, email, téléphone..."
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
          <Picker
            selectedValue={filterField}
            onValueChange={(val) => {
              setFilterField(val);
              setFilterValue("");
            }}
            style={styles.picker}
            dropdownIconColor="#94a3b8"
          >
            <Picker.Item label="Filtrer par..." value="" color="#666" />
            <Picker.Item label="🌍 Pays" value="country" />
            <Picker.Item label="💼 Profession" value="occupation" />
            <Picker.Item label="📍 Adresse" value="address1" />
            <Picker.Item label="👤 Sexe" value="sex" />
          </Picker>
        </View>

        <View style={[styles.pickerBox, { flex: 1.2 }]}>
          <Picker
            selectedValue={filterValue}
            enabled={filterField !== ""}
            onValueChange={(val) => {
              setFilterValue(val);
              if (val) fetchResults(query, 0, false, filterField, val);
            }}
            style={styles.picker}
            dropdownIconColor="#94a3b8"
          >
            <Picker.Item label={filterField ? "Choisir une tendance..." : "---"} value="" color="#666" />
            {dynamicOptions.map((opt, index) => (
              <Picker.Item key={index} label={opt} value={opt} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.countContainer}>
         <Text style={styles.countText}>
           Affichage : <Text style={styles.countHighlight}>{results.length}</Text> sur <Text style={styles.countHighlight}>{totalCount.toLocaleString()}</Text> résultats
         </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.thText, {flex: 1.5}]}>IDENTITÉ</Text>
        <Text style={[styles.thText, {flex: 1.2}]}>IDS</Text>
        <Text style={[styles.thText, {flex: 1.8}]}>CONTACT / LOC</Text>
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
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune donnée à analyser.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 10 : 35, paddingBottom: 10 },
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
  locValue: { color: '#94a3b8', fontSize: 9 },
  countryText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 100 }
});