import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getEntrepriseProfile, updateEntrepriseProfile } from '../services/api';
import './Entreprise.css';

function EntrepriseDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Profile State
    const [profile, setProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({
        raison_sociale: '',
        adresse: '',
        forme_juridique: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        type: 'STAGE',
        description: '',
        remuneration: 0,
        pays: '',
        ville: '',
        duree: 0,
        date_debut: '',
        date_expiration: ''
    });

    useEffect(() => {
        fetchOffers();
        fetchProfile();
    }, []);

    const fetchOffers = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/offres/entreprise/mine', {
                headers: {
                    'x-user-role': user.role,
                    'x-user-id': user.id
                }
            });
            setOffers(response.data);
        } catch (err) {
            console.error('Erreur chargement offres:', err);
            setError('Impossible de charger vos offres.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await getEntrepriseProfile();
            setProfile(response.data);
            setProfileForm({
                raison_sociale: response.data.raison_sociale,
                adresse: response.data.adresse,
                forme_juridique: response.data.forme_juridique
            });
        } catch (err) {
            console.error('Erreur chargement profil:', err);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await updateEntrepriseProfile(profileForm);
            alert('Profil mis à jour avec succès !');
            setShowProfileModal(false);
            fetchProfile();
        } catch (err) {
            console.error('Erreur mise à jour profil:', err);
            alert(err.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleStatutToggle = async (offerId, currentStatut) => {
        const newStatut = currentStatut === 'ACTIVE' ? 'NON ACTIVE' : 'ACTIVE';
        try {
            await axios.patch(`http://localhost:3000/api/offres/${offerId}/statut`,
                { statut: newStatut },
                {
                    headers: {
                        'x-user-role': user.role,
                        'x-user-id': user.id
                    }
                }
            );
            // Mettre à jour la liste localement
            setOffers(offers.map(o => o.id === offerId ? { ...o, statut: newStatut } : o));
        } catch (err) {
            console.error('Erreur modification statut:', err);
            alert('Erreur lors de la modification du statut');
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/offres', formData, {
                headers: {
                    'x-user-role': user.role,
                    'x-user-id': user.id
                }
            });
            alert('Offre créée avec succès !');
            setShowCreateForm(false);
            fetchOffers(); // Rafraîchir la liste
            // Reset form
            setFormData({
                type: 'STAGE',
                description: '',
                remuneration: 0,
                pays: '',
                ville: '',
                duree: 0,
                date_debut: '',
                date_expiration: ''
            });
        } catch (err) {
            console.error('Erreur création offre:', err);
            alert(err.response?.data?.error || 'Erreur lors de la création');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogout = () => {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            logout();
            navigate('/login');
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="entreprise-dashboard">
            <header className="dashboard-header">
                <h1>👋 Bienvenue, {profile?.raison_sociale || user.email}</h1>
                <div className="header-actions">
                    <button
                        className="profile-btn"
                        onClick={() => setShowProfileModal(true)}
                    >
                        👤 Mon Profil
                    </button>
                    <button
                        className="create-btn"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        {showCreateForm ? 'Annuler' : '+ Créer une offre'}
                    </button>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        🚪 Déconnexion
                    </button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            {showCreateForm && (
                <div className="create-offer-form">
                    <h2>Nouvelle Offre</h2>
                    <form onSubmit={handleCreateSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Type</label>
                                <select name="type" value={formData.type} onChange={handleInputChange}>
                                    <option value="STAGE">Stage</option>
                                    <option value="ALTERNANCE">Alternance</option>
                                    <option value="CDD">CDD</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Pays</label>
                                <input name="pays" value={formData.pays} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Ville</label>
                                <input name="ville" value={formData.ville} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Rémunération (€/mois)</label>
                                <input type="number" name="remuneration" value={formData.remuneration} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Durée (semaines)</label>
                                <input type="number" name="duree" value={formData.duree} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date Début</label>
                                <input type="date" name="date_debut" value={formData.date_debut} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Date Expiration</label>
                                <input type="date" name="date_expiration" value={formData.date_expiration} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="4"></textarea>
                        </div>

                        <button type="submit" className="submit-btn">Publier l'offre</button>
                    </form>
                </div>
            )}

            <div className="offers-list">
                <h2>Vos Offres</h2>
                {offers.length === 0 ? (
                    <p>Aucune offre n'a été postée pour le moment.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description (extrait)</th>
                                <th>Lieu</th>
                                <th>État Validation</th>
                                <th>Statut (Visible)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map((offer) => (
                                <tr key={offer.id}>
                                    <td><span className={`badge ${offer.type.toLowerCase()}`}>{offer.type}</span></td>
                                    <td>{offer.description.substring(0, 50)}...</td>
                                    <td>{offer.ville}, {offer.pays}</td>
                                    <td>
                                        <span className={`status-dot ${offer.etat === 'Validee' ? 'green' : offer.etat === 'Refusee' ? 'red' : 'orange'}`}></span>
                                        {offer.etat}
                                    </td>
                                    <td>
                                        <button
                                            className={`toggle-btn ${offer.statut === 'ACTIVE' ? 'active' : 'inactive'}`}
                                            onClick={() => handleStatutToggle(offer.id, offer.statut)}
                                        >
                                            {offer.statut}
                                        </button>
                                    </td>
                                    <td>
                                        {/* Future: Edit button */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Profil */}
            {showProfileModal && (
                <div className="modal" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Mon Profil Entreprise</h2>

                        {profile && (
                            <div className="profile-info">
                                <p><strong>Email:</strong> {profile.email}</p>
                                <p><strong>SIRET:</strong> {profile.siret}</p>
                                <p><strong>Date de création:</strong> {new Date(profile.date_creation).toLocaleDateString()}</p>
                                <p><strong>Statut:</strong> {profile.active ? '✅ Actif' : '❌ Inactif'}</p>
                            </div>
                        )}

                        <form onSubmit={handleProfileSubmit}>
                            <div className="form-group">
                                <label>Raison Sociale</label>
                                <input
                                    type="text"
                                    value={profileForm.raison_sociale}
                                    onChange={(e) => setProfileForm({ ...profileForm, raison_sociale: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Adresse</label>
                                <textarea
                                    value={profileForm.adresse}
                                    onChange={(e) => setProfileForm({ ...profileForm, adresse: e.target.value })}
                                    required
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Forme Juridique</label>
                                <select
                                    value={profileForm.forme_juridique}
                                    onChange={(e) => setProfileForm({ ...profileForm, forme_juridique: e.target.value })}
                                    required
                                >
                                    <option value="">Sélectionner...</option>
                                    <option value="SARL">SARL</option>
                                    <option value="SAS">SAS</option>
                                    <option value="SA">SA</option>
                                    <option value="EURL">EURL</option>
                                    <option value="SNC">SNC</option>
                                    <option value="Association">Association</option>
                                    <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowProfileModal(false)}>Annuler</button>
                                <button type="submit" className="create-btn" disabled={loading}>
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EntrepriseDashboard;
