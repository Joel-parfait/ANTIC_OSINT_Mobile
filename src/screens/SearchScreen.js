import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, TextInput, FlatList, Text, TouchableOpacity, 
  SafeAreaView, StatusBar, Platform, ActivityIndicator, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { flag } from 'country-emoji'; // Utilitaire pour tous les drapeaux

const API = "https://osint-dashboard-backend.onrender.com";

export default function SearchScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  
  // États pour la pagination et les filtres
  const [resultSize, setResultSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterField, setFilterField] = useState("");

  // Fonction de recherche principale
  const fetchResults = async (searchValue, page = 0, shouldAppend = false) => {
    if (!searchValue && !filterField) return;
    
    if (page === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const encodedValue = encodeURIComponent(searchValue);
      let url = `${API}/search/global?value=${encodedValue}&page=${page}&size=${resultSize}`;
      
      if (filterField) {
        url += `&filterField=${filterField}`;
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

  // Déclencheur pour le chargement de la page suivante
  const handleLoadMore = () => {
    if (!loadingMore && results.length < totalCount) {
      fetchResults(query, currentPage + 1, true);
    }
  };

  const renderResultItem = ({ item }) => (
    <View style={styles.resultCard}>
      {/* 1. IDENTITÉ */}
      <View style={[styles.column, { flex: 1.5 }]}>
        <Text style={styles.mainValue} numberOfLines={1}>{item.name || item.fullName || "Inconnu"}</Text>
        <View style={styles.subRow}>
          <Ionicons 
            name={item.sex === 'F' || item.sex === 'Female' ? "female" : "male"} 
            size={12} 
            color={item.sex === 'F' || item.sex === 'Female' ? "#ec4899" : "#3b82f6"} 
          />
          <Text style={styles.subValue} numberOfLines={1}>{item.occupation || "Profession NC"}</Text>
        </View>
      </View>

      {/* 2. IDS */}
      <View style={[styles.column, { flex: 1.2 }]}>
        <Text style={styles.labelTitle}>NUI: <Text style={styles.labelValue}>{item.nui || "N/A"}</Text></Text>
        <Text style={styles.labelTitle}>FB: <Text style={styles.labelValue}>{item.fb_id || "N/A"}</Text></Text>
      </View>

      {/* 3. CONTACT & LOC */}
      <View style={[styles.column, { flex: 1.8 }]}>
        <Text style={styles.labelValue} numberOfLines={1}>{item.email || "---"}</Text>
        <Text style={styles.phoneValue}>{item.phonenumber || item.phone || ""}</Text>
        <Text style={styles.locValue} numberOfLines={1}>{item.address1 || "Localisation NC"}</Text>
      </View>

      {/* 4. PAYS (Dynamique avec country-emoji) */}
      <View style={[styles.column, { flex: 0.8, alignItems: 'flex-end' }]}>
        <Text style={styles.countryText}>
          {flag(item.country) || '🌍'} {item.country ? item.country.substring(0, 2).toUpperCase() : 'NC'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Institutionnel */}
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.miniLogo} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>OSINT Intelligence Database</Text>
          <Text style={styles.headerSub}>
            Résultats : {results.length} / {totalCount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Barre de Recherche */}
      <View style={styles.searchBox}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={18} color="#666" style={{marginLeft: 10}} />
          <TextInput
            style={styles.textInput}
            placeholder="Recherche globale..."
            placeholderTextColor="#444"
            onChangeText={setQuery}
            onSubmitEditing={() => fetchResults(query, 0, false)}
          />
        </View>
        <TouchableOpacity style={styles.btnSearch} onPress={() => fetchResults(query, 0, false)}>
          <Text style={styles.btnText}>GO</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres & Taille de Page */}
      <View style={styles.filterBar}>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={filterField}
            onValueChange={(val) => setFilterField(val)}
            style={styles.picker}
            dropdownIconColor="#666"
          >
            <Picker.Item label="Filtrer par..." value="" color="#666" />
            <Picker.Item label="🌍 Pays" value="country" />
            <Picker.Item label="💼 Profession" value="occupation" />
            <Picker.Item label="📍 Adresse" value="address1" />
          </Picker>
        </View>
        <View style={[styles.pickerBox, { flex: 0.4 }]}>
          <Picker
            selectedValue={resultSize}
            onValueChange={(val) => {
              setResultSize(val);
              fetchResults(query, 0, false);
            }}
            style={styles.picker}
          >
            <Picker.Item label="50" value={50} />
            <Picker.Item label="100" value={100} />
            <Picker.Item label="500" value={500} />
          </Picker>
        </View>
      </View>

      {/* Header Table */}
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
          onEndReachedThreshold={0.5} // Charge la suite quand on arrive à 50% de la fin
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#10b981" style={{marginVertical: 20}} /> : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>En attente de requêtes institutionnelles...</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingTop: Platform.OS === 'ios' ? 10 : 35, 
    paddingBottom: 10 
  },
  miniLogo: { width: 42, height: 42, borderRadius: 21 },
  headerTextContainer: { marginLeft: 12 },
  headerTitle: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  headerSub: { color: '#64748b', fontSize: 11 },
  
  searchBox: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 5, gap: 10 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 8, height: 48 },
  textInput: { flex: 1, color: 'white', paddingHorizontal: 10 },
  btnSearch: { backgroundColor: '#3b82f6', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },

  filterBar: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 10, gap: 10 },
  pickerBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 8, height: 42, justifyContent: 'center' },
  picker: { color: '#94a3b8' },

  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#334155', 
    marginTop: 15, 
    padding: 10, 
    marginHorizontal: 10, 
    borderRadius: 5 
  },
  thText: { color: '#cbd5e1', fontSize: 10, fontWeight: 'bold' },

  resultCard: { 
    flexDirection: 'row', 
    backgroundColor: '#1e293b', 
    marginHorizontal: 10, 
    paddingVertical: 12, 
    paddingHorizontal: 10,
    borderBottomWidth: 1, 
    borderBottomColor: '#334155' 
  },
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