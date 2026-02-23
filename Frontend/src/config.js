let API_BASE;

if (import.meta.env.MODE === "production") {
  API_BASE = "https://api.pannamusic.co.ke";
} else {
  API_BASE = "http://localhost:5000";
}

export default API_BASE;




