import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, TextInput, TouchableOpacity, Text, FlatList, Platform, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API = "https://osint-dashboard-backend.onrender.com";

export default function SearchBar({ onSearch, onReset, onSuggestState }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- LOGIQUE AUTOCOMPLÉTION (Identique Dashboard.js) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      // On déclenche à partir de 1 caractère comme sur ton Web
      if (input.trim().length >= 1) {
        fetch(`${API}/search/suggest?value=${encodeURIComponent(input.trim())}`)
          .then(res => {
            if (!res.ok) throw new Error("Erreur réseau");
            return res.json();
          })
          .then(data => {
            // Ton API renvoie un tableau de strings ["Nom1", "Nom2"]
            setSuggestions(data || []);
            const hasData = data && data.length > 0;
            setShowSuggestions(hasData);
            onSuggestState(hasData); // Verrouille les filtres si suggestions
          })
          .catch(err => console.error("Erreur suggestions:", err));
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        onSuggestState(false);
      }
    }, 300); // Le Debounce de 300ms pour Render

    return () => clearTimeout(timer);
  }, [input]);

  const handleSelectSuggestion = (val) => {
    setInput(val);
    setSuggestions([]);
    setShowSuggestions(false);
    onSuggestState(false);
    onSearch(val);
    Keyboard.dismiss(); // Ferme le clavier sur mobile
  };

  const handleClear = () => {
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSuggestState(false);
    onReset();
  };

  const handleSubmit = () => {
    onSearch(input.trim());
    setShowSuggestions(false);
    onSuggestState(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchBox}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={18} color="#666" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Nom, matricule, téléphone..."
            placeholderTextColor="#4b5563"
            value={input}
            onChangeText={setInput}
            onFocus={() => input.length >= 1 && setShowSuggestions(true)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {input.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={18} color="#4b5563" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.btnSearch} onPress={handleSubmit}>
          <Text style={styles.btnText}>GO</Text>
        </TouchableOpacity>
      </View>

      {/* LISTE FLOTTANTE (Z-INDEX ÉLEVÉ) */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.suggestionItem} 
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="time-outline" size={16} color="#4b5563" />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 250 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    zIndex: 5000, // Priorité maximale
    position: 'relative', 
    width: '100%' 
  },
  searchBox: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    marginTop: 5, 
    gap: 10 
  },
  inputContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1e293b', 
    borderRadius: 10, 
    height: 48,
    borderWidth: 1,
    borderColor: '#334155'
  },
  textInput: { 
    flex: 1, 
    color: '#f8fafc', 
    paddingHorizontal: 10, 
    fontSize: 14 
  },
  clearIcon: { 
    padding: 5, 
    marginRight: 5 
  },
  btnSearch: { 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 20, 
    borderRadius: 10, 
    justifyContent: 'center',
    elevation: 2
  },
  btnText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  suggestionsBox: { 
    position: 'absolute', 
    top: 55, 
    left: 15, 
    right: 75, 
    backgroundColor: '#1e293b', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#334155',
    elevation: 10, // Pour Android
    zIndex: 9999, // Pour iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  suggestionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#0f172a' 
  },
  suggestionText: { 
    color: '#cbd5e1', 
    marginLeft: 12, 
    fontSize: 14 
  }
});