import axios from "axios";
import API_BASE from "../config";

export const API_URL = `${API_BASE}/api/heroslide`;


export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  }


  export const getHeroSlides = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  }

export const getFullHeroSlides = async () => {
  const response = await axios.get(`${API_URL}/all`, getAuthHeaders());
  return response.data;
}

export const createHeroSlide = async (heroSlideData) => {
  // CRITICAL FIX: Use FormData for file uploads
  const formData = new FormData();
  formData.append('title', heroSlideData.title);
  formData.append('description', heroSlideData.description);
  // 'image' must match the key used in your multer middleware: upload.single("image")
  formData.append('image', heroSlideData.image); 

  // Include auth headers. Axios automatically sets the 'Content-Type' to 'multipart/form-data'
  // when the data is a FormData object.
  const res = await axios.post(API_URL, formData, getAuthHeaders());
  return res.data;

}


export const deleteHeroSlide = async (id) => {
    const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  return res.data;
}


export const toggleHeroSlideStatus = async (id, status) => {
  const res = await axios.put(`${API_URL}/${id}/status`, { status }, getAuthHeaders());
  return res.data;
}