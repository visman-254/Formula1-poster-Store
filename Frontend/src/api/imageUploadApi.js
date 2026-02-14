import axios from 'axios';
import API_BASE from '../config';

const uploadImages = async (formData, token) => {
  const response = await axios.post(
    `${API_BASE}/api/upload/images`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

const listImages = async (token) => {
  const response = await axios.get(
    `${API_BASE}/api/upload/images`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export { uploadImages, listImages };
