import axios from "axios";
import API_BASE from "../config";

export const API_URL = `${API_BASE}/api/products`;

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getCategories = async () => {
  const response = await axios.get(`${API_URL}/categories`, getAuthHeaders());
  return response.data;
};
