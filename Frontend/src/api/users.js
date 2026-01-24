import axios from "axios";
import API_BASE from "../config";



export const API_URL = `${API_BASE}/api/users`;

export const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};


export const getUsers = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
}

