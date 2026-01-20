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
export const getMyProfilEtudiant = () => api.get('/etudiants/me');
export const updateMyProfilEtudiant = (data) => api.put('/etudiants/me', data);
export const createEtudiant = (data) => api.post('/etudiants', data);
export const updateEtudiant = (id, data) => api.put(`/etudiants/${id}`, data);
export const validerRC = (id) => api.put(`/etudiants/${id}/valider-rc`, {});
export const deleteEtudiant = (id) => api.delete(`/etudiants/${id}`);

// Secretaire profil
export const getMyProfilSecretaire = () => api.get('/secretaire/profil');
export const updateMyProfilSecretaire = (data) => api.put('/secretaire/profil', data);

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

// Enseignant - Statistiques
export const getEnseignantStats = () => api.get('/enseignant/stats');

// Enseignant - Profil
export const getEnseignantProfil = () => api.get('/enseignant/profil');
export const updateEnseignantProfil = (data) => api.put('/enseignant/profil', data);

// Enseignant - Offres
// Offres pour enseignant
export const getOffresEnAttente = () => api.get('/enseignant/offres');
export const getToutesLesOffres = () => api.get('/offres/all/offers');
export const getToutesOffres = () => api.get('/enseignant/offres/toutes');
export const validerOffre = (id) => api.put(`/enseignant/offres/${id}/valider`);
export const refuserOffre = (id, motif) => api.put(`/enseignant/offres/${id}/refuser`, { motif });

// Enseignant - Candidatures
export const getCandidaturesAValider = () => api.get('/enseignant/candidatures');
export const validerCandidature = (id) => api.put(`/enseignant/candidatures/${id}/valider`);

// Enseignant - Barèmes
export const getBaremes = () => api.get('/enseignant/baremes');
export const createBareme = (data) => api.post('/enseignant/baremes', data);
export const updateBareme = (id, data) => api.put(`/enseignant/baremes/${id}`, data);
export const deleteBareme = (id) => api.delete(`/enseignant/baremes/${id}`);

// Enseignant - Droits Secrétaire
export const getDroitsSecretaire = () => api.get('/enseignant/droits-secretaire');
export const getEtudiantsEnseignant = () => api.get('/enseignant/etudiants');
export const createEtudiantEnseignant = (data) => api.post('/enseignant/etudiants', data);
export const validerRCEnseignant = (id) => api.put(`/enseignant/etudiants/${id}/valider-rc`);

// Enseignant - Notifications
export const getNotifications = () => api.get('/enseignant/notifications');
export const getNotificationsCount = () => api.get('/enseignant/notifications/count');
export const marquerNotificationLue = (id) => api.put(`/enseignant/notifications/${id}/lire`);
export const marquerToutesNotificationsLues = () => api.put('/enseignant/notifications/lire-toutes');

// Entreprise - Profile
export const getEntrepriseProfile = () => api.get('/entreprise/profile');
export const updateEntrepriseProfile = (data) => api.put('/entreprise/profile', data);
// Documents RC
export const getMyRC = () => api.get('/documents/rc/mine');
export const getRCEtudiant = (etudiantId) => api.get(`/documents/rc/etudiant/${etudiantId}`);
export const uploadRC = (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/documents/rc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const validerRCDocument = (etudiantId) => api.put(`/documents/rc/${etudiantId}/valider`);
export const rejeterRCDocument = (etudiantId, motif) => api.put(`/documents/rc/${etudiantId}/rejeter`, { motif });
export const deleteMyRC = () => api.delete('/documents/rc/mine');
export const downloadRC = (id) => `${API_URL}/documents/rc/download/${id}`;

// Notifications
export const getMyNotifications = () => api.get('/notifications/mine');
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// Entreprise - Etudiants
export const getEtudiantsForEntreprise = () => api.get('/entreprise/etudiants');
export const getEtudiantDetails = (id) => api.get(`/entreprise/etudiants/${id}`);

export default api;
