import axios from "axios";
import API_BASE from "../config";


export const API_URL = `${API_BASE}/api/lowstock`


export const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const getLowStockProducts = async () => {
    try {
        const response = await axios.get(API_URL, getAuthHeaders());
        return response.data;
    } catch (error) {
        
        console.error("Error fetching low stock products:", error);
        
        
        throw error; 
    }
}