import axios from 'axios';

const API_URL = "https://osint-dashboard-backend.onrender.com";

export const searchGlobal = async (value) => {
  const response = await axios.get(`${API_URL}/search/global`, {
    params: { value, page: 0, size: 20 }
  });
  return response.data;
};