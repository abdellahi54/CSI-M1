import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOffres, getMyCandidatures, postuler, cancelCandidature } from '../services/api';
import Layout from '../components/Layout';
import './Etudiant.css';

function Etudiant() {
    const { user } = useAuth();
    const [offres, setOffres] = useState([]);
    const [candidatures, setCandidatures] = useState([]);
    const [activeTab, setActiveTab] = useState('offres');
    const [selectedOffre, setSelectedOffre] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [lettreMotivation, setLettreMotivation] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [offresRes, candidaturesRes] = await Promise.all([
                getOffres(),
                getMyCandidatures()
            ]);
            setOffres(offresRes.data);
            setCandidatures(candidaturesRes.data);
        } catch (err) {
            console.error('Erreur:', err);
        }
    };

    const handlePostuler = (offre) => {
        setSelectedOffre(offre);
        setLettreMotivation('');
        setShowModal(true);
    };

    const submitCandidature = async () => {
        setLoading(true);
        try {
            await postuler({ offre_id: selectedOffre.id, lettre_motivation: lettreMotivation });
            setShowModal(false);
            loadData();
            alert('Candidature envoyée !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Annuler cette candidature ?')) return;
        try {
            await cancelCandidature(id);
            loadData();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    const getStatusLabel = (statut) => {
        const labels = {
            'Soumise': { text: '📤 Soumise', class: 'status-pending' },
            'AccepteeEntreprise': { text: '✅ Acceptée entreprise', class: 'status-valid' },
            'RejeteeEntreprise': { text: '❌ Rejetée entreprise', class: 'status-rejected' },
            'Validee': { text: '🎉 Validée', class: 'status-valid' },
            'RefuseeResponsable': { text: '❌ Refusée', class: 'status-rejected' },
            'Annulee': { text: '🚫 Annulée', class: 'status-cancelled' }
        };
        return labels[statut] || { text: statut, class: '' };
    };

    const alreadyApplied = (offreId) => {
        return candidatures.some(c => c.offre_id === offreId && c.statut !== 'Annulee');
    };

    return (
        <Layout title="Espace Étudiant">
            <div className="tabs">
                <button
                    className={activeTab === 'offres' ? 'active' : ''}
                    onClick={() => setActiveTab('offres')}
                >
                    🔍 Offres disponibles ({offres.length})
                </button>
                <button
                    className={activeTab === 'candidatures' ? 'active' : ''}
                    onClick={() => setActiveTab('candidatures')}
                >
                    📝 Mes candidatures ({candidatures.length})
                </button>
            </div>

            {activeTab === 'offres' && (
                <div className="offres-grid">
                    {offres.length === 0 ? (
                        <p className="no-data">Aucune offre disponible pour le moment</p>
                    ) : (
                        offres.map(offre => (
                            <div key={offre.id} className="offre-card">
                                <div className="offre-header">
                                    <span className={`offre-type ${offre.type?.toLowerCase()}`}>
                                        {offre.type}
                                    </span>
                                    <span className="offre-duree">{offre.duree} mois</span>
                                </div>
                                <h3>{offre.entreprise_nom}</h3>
                                <p className="offre-description">{offre.description?.substring(0, 150)}...</p>
                                <div className="offre-details">
                                    <span>📍 {offre.pays}</span>
                                    <span>💰 {offre.remuneration}€/mois</span>
                                </div>
                                <div className="offre-actions">
                                    {alreadyApplied(offre.id) ? (
                                        <span className="already-applied">✅ Déjà postulé</span>
                                    ) : (
                                        <button className="btn-primary" onClick={() => handlePostuler(offre)}>
                                            Postuler
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'candidatures' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Entreprise</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidatures.map(c => {
                                const status = getStatusLabel(c.statut);
                                return (
                                    <tr key={c.id}>
                                        <td>{c.entreprise_nom}</td>
                                        <td>{c.offre_type}</td>
                                        <td>{new Date(c.date_candidature).toLocaleDateString()}</td>
                                        <td className={status.class}>{status.text}</td>
                                        <td>
                                            {c.statut === 'Soumise' && (
                                                <button className="btn-cancel" onClick={() => handleCancel(c.id)}>
                                                    Annuler
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && selectedOffre && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Postuler chez {selectedOffre.entreprise_nom}</h2>
                        <p><strong>Type:</strong> {selectedOffre.type}</p>
                        <p><strong>Durée:</strong> {selectedOffre.duree} mois</p>
                        <p><strong>Rémunération:</strong> {selectedOffre.remuneration}€/mois</p>

                        <div className="form-group">
                            <label>Lettre de motivation</label>
                            <textarea
                                value={lettreMotivation}
                                onChange={e => setLettreMotivation(e.target.value)}
                                placeholder="Expliquez pourquoi vous êtes intéressé par cette offre..."
                                rows={6}
                            />
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => setShowModal(false)}>Annuler</button>
                            <button className="btn-primary" onClick={submitCandidature} disabled={loading}>
                                {loading ? 'Envoi...' : 'Envoyer ma candidature'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default Etudiant;
