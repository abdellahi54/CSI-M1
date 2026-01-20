import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOffres, getMyCandidatures, postuler, cancelCandidature, getMyRC, uploadRC, deleteMyRC, downloadRC, getMyProfilEtudiant, updateMyProfilEtudiant } from '../services/api';
import Layout from '../components/Layout';
import './Etudiant.css';

function Etudiant() {
    const { user } = useAuth();
    const [offres, setOffres] = useState([]);
    const [candidatures, setCandidatures] = useState([]);
    const [rcDocument, setRcDocument] = useState(null);
    const [activeTab, setActiveTab] = useState('offres');
    const [selectedOffre, setSelectedOffre] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [lettreMotivation, setLettreMotivation] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profil, setProfil] = useState(null);
    const [profilForm, setProfilForm] = useState({ statut: 'EN_RECHERCHE', visibilite: false });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const offresRes = await getOffres();
            setOffres(offresRes.data);
        } catch (err) {
            console.error('Erreur offres:', err);
        }

        try {
            const candidaturesRes = await getMyCandidatures();
            setCandidatures(candidaturesRes.data);
        } catch (err) {
            console.error('Erreur candidatures:', err);
        }

        try {
            const rcRes = await getMyRC();
            console.log('RC Response:', rcRes.data);
            setRcDocument(rcRes.data);
        } catch (err) {
            console.error('Erreur RC:', err);
        }

        try {
            const profilRes = await getMyProfilEtudiant();
            setProfil(profilRes.data);
            setProfilForm({
                statut: profilRes.data.statut || 'EN_RECHERCHE',
                visibilite: profilRes.data.visibilite || false
            });
        } catch (err) {
            console.error('Erreur profil:', err);
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
            alert('Candidature envoyee !');
        } catch (err) {
            const msg = err.response?.data?.details || err.response?.data?.error || err.message;
            alert('Erreur: ' + msg);
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

    const handleUploadRC = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            await uploadRC(file);
            loadData();
            alert('Attestation RC uploadee !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteRC = async () => {
        if (!confirm('Supprimer votre attestation RC ?')) return;
        try {
            await deleteMyRC();
            loadData();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    const getStatusLabel = (statut) => {
        const labels = {
            'SOUMISE': { text: 'Soumise', class: 'status-pending' },
            'ACCEPTEE ENTREPRISE': { text: 'Acceptee entreprise', class: 'status-valid' },
            'REJETEE ENTREPRISE': { text: 'Rejetee entreprise', class: 'status-rejected' },
            'VALIDEE': { text: 'Validee', class: 'status-valid' },
            'REFUSEE RESPONSABLE': { text: 'Refusee', class: 'status-rejected' },
            'RENONCEE': { text: 'Annulee', class: 'status-cancelled' }
        };
        return labels[statut] || { text: statut, class: '' };
    };

    const alreadyApplied = (offreId) => {
        return candidatures.some(c => c.offre_id === offreId && c.statut !== 'RENONCEE');
    };

    return (
        <Layout title="Espace Etudiant">
            <div className="tabs">
                <button
                    className={activeTab === 'offres' ? 'active' : ''}
                    onClick={() => setActiveTab('offres')}
                >
                    Offres disponibles ({offres.length})
                </button>
                <button
                    className={activeTab === 'candidatures' ? 'active' : ''}
                    onClick={() => setActiveTab('candidatures')}
                >
                    Mes candidatures ({candidatures.length})
                </button>
                <button
                    className={activeTab === 'documents' ? 'active' : ''}
                    onClick={() => setActiveTab('documents')}
                >
                    Mon attestation RC
                </button>
                <button
                    className={activeTab === 'profil' ? 'active' : ''}
                    onClick={() => setActiveTab('profil')}
                >
                    Mon profil
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
                                    <span>Lieu: {offre.pays}</span>
                                    <span>{offre.remuneration} euros/mois</span>
                                </div>
                                <div className="offre-actions">
                                    {alreadyApplied(offre.id) ? (
                                        <span className="already-applied">Deja postule</span>
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
                                            {c.statut === 'SOUMISE' && (
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

            {activeTab === 'documents' && (
                <div className="documents-section">
                    <h2>Attestation Responsabilite Civile</h2>
                    <div className="documents-grid">
                        <div className="document-card">
                            {rcDocument ? (
                                <div className="document-info">
                                    <p><strong>Fichier:</strong> {rcDocument.nom_fichier}</p>
                                    <p className={rcDocument.valide ? 'status-valid' : 'status-pending'}>
                                        <strong>Statut:</strong> {rcDocument.valide ? 'Validee' : 'En attente de validation'}
                                    </p>
                                    <div className="document-actions">
                                        <a href={downloadRC(rcDocument.id)} target="_blank" className="btn-secondary">
                                            Telecharger
                                        </a>
                                        <button className="btn-delete" onClick={handleDeleteRC}>
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="document-upload">
                                    <p>Aucune attestation RC uploadee</p>
                                    <label className="btn-primary upload-btn">
                                        {uploading ? 'Upload...' : 'Uploader mon attestation RC'}
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUploadRC} hidden />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'profil' && (
                <div className="profil-section">
                    <h2>Mon profil</h2>
                    {profil && (
                        <div className="profil-info">
                            <p><strong>Nom:</strong> {profil.nom} {profil.prenom}</p>
                            <p><strong>Email:</strong> {profil.email}</p>
                            <p><strong>Formation:</strong> {profil.formation} - {profil.annee_formation}e annee</p>
                            <p><strong>RC validee:</strong> {profil.responsabilite_civile ? 'Oui' : 'Non'}</p>
                        </div>
                    )}
                    <h3>Modifier mes preferences</h3>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            await updateMyProfilEtudiant(profilForm);
                            alert('Profil mis a jour !');
                            loadData();
                        } catch (err) {
                            alert('Erreur: ' + err.message);
                        }
                    }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Statut de recherche</label>
                                <select
                                    value={profilForm.statut}
                                    onChange={e => setProfilForm({ ...profilForm, statut: e.target.value })}
                                >
                                    <option value="EN_RECHERCHE">En recherche de stage</option>
                                    <option value="EN_STAGE">En stage</option>
                                    <option value="DIPLOME">Diplome</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Visibilite du profil</label>
                                <select
                                    value={profilForm.visibilite ? 'true' : 'false'}
                                    onChange={e => setProfilForm({ ...profilForm, visibilite: e.target.value === 'true' })}
                                >
                                    <option value="true">Visible par les entreprises</option>
                                    <option value="false">Non visible</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary">Enregistrer</button>
                    </form>
                </div>
            )}

            {showModal && selectedOffre && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Postuler chez {selectedOffre.entreprise_nom}</h2>
                        <p><strong>Type:</strong> {selectedOffre.type}</p>
                        <p><strong>Duree:</strong> {selectedOffre.duree} mois</p>
                        <p><strong>Remuneration:</strong> {selectedOffre.remuneration} euros/mois</p>

                        <div className="form-group">
                            <label>Lettre de motivation</label>
                            <textarea
                                value={lettreMotivation}
                                onChange={e => setLettreMotivation(e.target.value)}
                                placeholder="Expliquez pourquoi vous etes interesse par cette offre..."
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
