import axios from "axios";
import API_BASE from "./config";

const api = axios.create({
  baseURL: API_BASE, // all requests will use this base
});

export default api;
