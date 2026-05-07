import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, TextInput, FlatList, Text, TouchableOpacity, 
  SafeAreaView, StatusBar, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Configuration API (utilise ton URL Render en prod)
const API = "https://osint-dashboard-backend.onrender.com";

export default function SearchScreen() {
  // --- ÉTATS DES DONNÉES (Inspirés du Dashboard Web) ---
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [backendStatus, setBackendStatus] = useState("Checking...");

  // --- ÉTATS DE RECHERCHE ET FILTRES ---
  const [query, setQuery] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");

  /* =============================
     VÉRIFICATION SANTÉ BACKEND 
     ============================= */
  useEffect(() => {
    fetch(`${API}/search/health`)
      .then(() => setBackendStatus("LIVE"))
      .catch(() => setBackendStatus("OFFLINE"));
  }, []);

  /* =============================
     MOTEUR DE RECHERCHE RÉEL (Elasticsearch) 
     ============================= */
  const fetchResults = async (searchValue, fField = filterField, fValue = filterValue) => {
    if (!searchValue && !fValue) return;
    
    setLoading(true);
    try {
      const encodedValue = encodeURIComponent(searchValue);
      let url = `${API}/search/global?value=${encodedValue}&page=0&size=50`;
      
      if (fField && fValue) {
        url += `&filterField=${fField}&filterValue=${encodeURIComponent(fValue)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      
      const data = await res.json();
      setResults(data.results || []);
      setTotalCount(data.total || 0);
      setQuery(searchValue);
    } catch (err) {
      console.error("❌ Erreur ANTIC API:", err);
      Alert.alert("Erreur Système", "Impossible de joindre le serveur OSINT.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterField("");
    setFilterValue("");
    setResults([]);
    setTotalCount(0);
  };

  /* =============================
     RENDU DES CARTES D'INVESTIGATION [cite: 112]
     ============================= */
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.resultCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.fullName || item.username || "Identité Inconnue"}</Text>
        <View style={[styles.severityBadge, { backgroundColor: item.role === 'ADMIN' ? '#991b1b' : '#1e293b' }]}>
          <Text style={styles.severityText}>{item.role || 'USER'}</Text>
        </View>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="location-outline" size={14} color="#6366f1" />
        <Text style={styles.cardDetailText}>{item.country || 'Localisation non définie'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="briefcase-outline" size={14} color="#10b981" />
        <Text style={styles.cardDetailText}>{item.occupation || 'Profession classifiée'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        
        {/* Header Institutionnel */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>ANTIC OSINT-Mobile</Text>
            <Text style={styles.agentTag}>CIRT-OPERATIONS-TERRAIN</Text>
          </View>
          <View style={styles.statusBox}>
            <View style={[styles.statusDot, { backgroundColor: backendStatus === "LIVE" ? "#10b981" : "#ef4444" }]} />
            <Text style={styles.statusText}>{backendStatus}</Text>
          </View>
        </View>

        {/* Barre de Recherche Globale [cite: 108] */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#666" style={{marginLeft: 12}} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nom, IP, matricule..."
              placeholderTextColor="#4b5563"
              onSubmitEditing={() => fetchResults(query)}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => fetchResults(query)}>
             {loading ? <ActivityIndicator color="white" /> : <Text style={styles.searchBtnText}>OK</Text>}
          </TouchableOpacity>
        </View>

        {/* Widgets Statistiques (Dynamiques) [cite: 131] */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.statLabel}>RÉSULTATS</Text>
            <Text style={styles.statValue}>{totalCount.toLocaleString()}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.statLabel}>BASE DE DONNÉES</Text>
            <Text style={styles.statValue}>ACTIVE</Text>
          </View>
        </View>

        {/* Liste des résultats Elasticsearch [cite: 99] */}
        <View style={styles.dbHeader}>
          <Text style={styles.dbTitle}>INVESTIGATION RESULTS</Text>
          <TouchableOpacity onPress={clearFilters}>
             <Text style={styles.resetText}>RESET</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyBox}>
                <Ionicons name="finger-print-outline" size={60} color="#171717" />
                <Text style={styles.emptyText}>En attente de requêtes OSINT...</Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 10 : 0 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  agentTag: { color: '#444', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171717', padding: 6, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  searchSection: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#171717', borderRadius: 10, borderWidth: 1, borderColor: '#262626' },
  searchInput: { flex: 1, color: 'white', padding: 12, fontSize: 14 },
  searchBtn: { backgroundColor: '#3b82f6', marginLeft: 10, width: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: 'white', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 20 },
  statBox: { backgroundColor: '#171717', width: '48%', padding: 15, borderRadius: 12, borderLeftWidth: 4 },
  statLabel: { color: '#4b5563', fontSize: 9, fontWeight: 'bold' },
  statValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  dbHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  dbTitle: { color: '#4b5563', fontSize: 11, fontWeight: 'bold' },
  resetText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  resultCard: { backgroundColor: '#171717', padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#262626' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardName: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  severityText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardDetailText: { color: '#9ca3af', fontSize: 13, marginLeft: 8 },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#262626', textAlign: 'center', marginTop: 15, fontWeight: 'bold' }
});