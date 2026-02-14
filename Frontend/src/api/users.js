import axios from "axios";
import API_BASE from "../config";



export const API_URL = `${API_BASE}/api`;

export const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};


export const getUsers = async () => {
    const response = await axios.get(`${API_URL}/users`, getAuthHeaders());
    return response.data;
}

export const updateUserRole = async (userId, newRole) => {
    const response = await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole }, getAuthHeaders());
    return response.data;
}
