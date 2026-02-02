let API_BASE;

if (import.meta.env.MODE === "production") {
  API_BASE = "https://formula1-poster-store-1.onrender.com";
} else {
  API_BASE = "http://localhost:5000";
}

export default API_BASE;




