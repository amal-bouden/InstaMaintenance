import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si le token expire → redirige vers /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  return api.post("/auth/login", form);
};

// --- Machines ---
export const getMachines = () => api.get("/machines");

// --- Interventions ---
export const getInterventions  = ()       => api.get("/interventions");
export const creerIntervention = (data)   => api.post("/interventions", data);
export const prendreEnCharge   = (id)     => api.patch(`/interventions/${id}/prendre-en-charge`);
export const cloturerIntervention = (id, data) => api.patch(`/interventions/${id}/cloturer`, data);

// --- Users (admin) ---
export const getUsers    = ()     => api.get("/users");
export const creerUser   = (data) => api.post("/users", data);

export default api;
export const getStatsMTTR      = () => api.get("/stats/mttr");
export const getStatsCouts     = () => api.get("/stats/couts");
export const getStatsHistorique = () => api.get("/stats/historique");