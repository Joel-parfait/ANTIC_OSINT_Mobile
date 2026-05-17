import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, TextInput, TouchableOpacity, Text, FlatList, Platform, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // IMPORT DU HOOK GLOBAL

const API = "https://osint-dashboard-backend.onrender.com";

export default function SearchBar({ onSearch, onReset, onSuggestState }) {
  const { theme } = useTheme(); // RECUPERATION DU THEME
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- LOGIQUE AUTOCOMPLÉTION (Identique Dashboard.js) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim().length >= 1) {
        fetch(`${API}/search/suggest?value=${encodeURIComponent(input.trim())}`)
          .then(res => {
            if (!res.ok) throw new Error("Erreur réseau");
            return res.json();
          })
          .then(data => {
            setSuggestions(data || []);
            const hasData = data && data.length > 0;
            setShowSuggestions(hasData);
            onSuggestState(hasData);
          })
          .catch(err => console.error("Erreur suggestions:", err));
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        onSuggestState(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  const handleSelectSuggestion = (val) => {
    setInput(val);
    setSuggestions([]);
    setShowSuggestions(false);
    onSuggestState(false);
    onSearch(val);
    Keyboard.dismiss();
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
        {/* DESIGN RENDU RESPONSIVE ET INTERIEUR FLUIDE SELON LE THEME */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9', 
            borderColor: theme.isDark ? '#334155' : '#cbd5e1' 
          }
        ]}>
          <Ionicons 
            name="search" 
            size={18} 
            color={theme.isDark ? '#666' : '#94a3b8'} 
            style={{ marginLeft: 12 }} 
          />
          <TextInput
            style={[styles.textInput, { color: theme.textMain }]}
            placeholder="Nom, matricule, téléphone..."
            placeholderTextColor={theme.isDark ? '#4b5563' : '#94a3b8'}
            value={input}
            onChangeText={setInput}
            onFocus={() => input.length >= 1 && setShowSuggestions(true)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {input.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearIcon}>
              <Ionicons 
                name="close-circle" 
                size={18} 
                color={theme.isDark ? '#4b5563' : '#94a3b8'} 
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.btnSearch, { backgroundColor: theme.tabActive }]} onPress={handleSubmit}>
          <Text style={styles.btnText}>GO</Text>
        </TouchableOpacity>
      </View>

      {/* BOX DES SUGGESTIONS DYNAMIQUE ET DESIGN NET COULEUR CLAIRE/SOMBRE */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[
          styles.suggestionsBox, 
          { backgroundColor: theme.card, borderColor: theme.border }
        ]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.suggestionItem, { borderBottomColor: theme.isDark ? '#0f172a' : '#f1f5f9' }]} 
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="time-outline" size={16} color={theme.textSub} />
                <Text style={[styles.suggestionText, { color: theme.textMain }]}>{item}</Text>
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
    zIndex: 5000, 
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
    borderRadius: 10, 
    height: 48,
    borderWidth: 1
  },
  textInput: { 
    flex: 1, 
    paddingHorizontal: 10, 
    fontSize: 14 
  },
  clearIcon: { 
    padding: 5, 
    marginRight: 5 
  },
  btnSearch: { 
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
    borderRadius: 10, 
    borderWidth: 1, 
    elevation: 10, 
    zIndex: 9999, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  suggestionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1 
  },
  suggestionText: { 
    marginLeft: 12, 
    fontSize: 14 
  }
});