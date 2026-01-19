import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Entreprise.css';

function EntrepriseDashboard() {
    const { user, token } = useAuth();
    const [offers, setOffers] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="entreprise-dashboard">
            <header className="dashboard-header">
                <h1>👋 Bienvenue, {user.email}</h1>
                <button
                    className="create-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? 'Annuler' : '+ Créer une offre'}
                </button>
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
        </div>
    );
}

export default EntrepriseDashboard;
