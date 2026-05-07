import axios from 'axios';

// Ton URL Render
const API_URL = "https://osint-dashboard-backend.onrender.com";

export const loginAgent = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: username,
      password: password
    });
    
    // Ton backend renvoie { success: true, token: "...", user: {...} }
    return response.data;
  } catch (error) {
    console.error("Erreur Auth API:", error);
    return { success: false, message: "Erreur de connexion au serveur CIRT" };
  }
};