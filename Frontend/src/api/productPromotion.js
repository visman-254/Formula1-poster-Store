import axios from "axios";
import API_BASE from "../config";

export const API_URL = `${API_BASE}/api/productpromotion`;

/* ============================
   AUTH HEADER
============================ */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

/* ============================
   USER – ACTIVE PROMOTIONS
============================ */
export const getPromotions = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

/* ============================
   ADMIN – ALL PROMOTIONS
============================ */
export const getFullPromotions = async () => {
  const response = await axios.get(`${API_URL}/all`, getAuthHeaders());
  return response.data;
};

/* ============================
   CREATE PROMOTION (IMAGE ONLY)
============================ */
export const createPromotion = async (promotionData) => {
  // Use FormData for file upload
  const formData = new FormData();

  // 'image' must match: upload.single("image")
  formData.append('image', promotionData.image);

  const res = await axios.post(API_URL, formData, getAuthHeaders());
  return res.data;
};

/* ============================
   DELETE PROMOTION
============================ */
export const deletePromotion = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  return res.data;
};

/* ============================
   TOGGLE PROMOTION STATUS
============================ */
export const togglePromotionStatus = async (id, status) => {
  const res = await axios.put(
    `${API_URL}/${id}/status`,
    { status },
    getAuthHeaders()
  );
  return res.data;
};
