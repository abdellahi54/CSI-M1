import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Créer une instance axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Ajouter les headers d'authentification automatiquement
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        config.headers['X-User-Role'] = user.role;
        config.headers['X-User-Id'] = user.id.toString();
    }
    return config;
});

// Auth
export const login = (email, mot_de_passe) =>
    api.post('/auth/login', { email, mot_de_passe });

export const registerEntreprise = (data) =>
    api.post('/auth/register/entreprise', data);

// Étudiants
export const getEtudiants = () => api.get('/etudiants');
export const getEtudiant = (id) => api.get(`/etudiants/${id}`);
export const createEtudiant = (data) => api.post('/etudiants', data);
export const updateEtudiant = (id, data) => api.put(`/etudiants/${id}`, data);
export const validerRC = (id) => api.put(`/etudiants/${id}/valider-rc`, {});
export const deleteEtudiant = (id) => api.delete(`/etudiants/${id}`);

// Admin
export const getSecretaires = () => api.get('/admin/secretaires');
export const getEnseignants = () => api.get('/admin/enseignants');
export const createSecretaire = (data) => api.post('/admin/secretaires', data);
export const createEnseignant = (data) => api.post('/admin/enseignants', data);
export const deleteSecretaire = (id) => api.delete(`/admin/secretaires/${id}`);
export const deleteEnseignant = (id) => api.delete(`/admin/enseignants/${id}`);

// Offres
export const getOffres = () => api.get('/offres');
export const getOffre = (id) => api.get(`/offres/${id}`);
export const getOffresPending = () => api.get('/offres/pending/all');
export const createOffre = (data) => api.post('/offres', data);
export const validateOffre = (id, data) => api.put(`/offres/${id}/validate`, data);
export const getMyOffres = () => api.get('/offres/entreprise/mine');

// Candidatures
export const getMyCandidatures = () => api.get('/candidatures/etudiant/mine');
export const getCandidaturesForOffre = (offreId) => api.get(`/candidatures/offre/${offreId}`);
export const getCandidaturesPending = () => api.get('/candidatures/pending/all');
export const postuler = (data) => api.post('/candidatures', data);
export const cancelCandidature = (id) => api.put(`/candidatures/${id}/cancel`);
export const entrepriseDecision = (id, decision) => api.put(`/candidatures/${id}/entreprise-decision`, { decision });
export const validateCandidature = (id, data) => api.put(`/candidatures/${id}/validate`, data);

// Test
export const createAdmin = () => api.get('/test/create-admin');

export default api;
