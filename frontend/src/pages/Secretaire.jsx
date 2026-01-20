import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEtudiants, createEtudiant, deleteEtudiant, getRCEtudiant, downloadRC, validerRCDocument, rejeterRCDocument, getMyProfilSecretaire, updateMyProfilSecretaire } from '../services/api';
import Layout from '../components/Layout';
import './Secretaire.css';

function Secretaire() {
    const { user } = useAuth();
    const [etudiants, setEtudiants] = useState([]);
    const [etudiantsRC, setEtudiantsRC] = useState({});
    const [activeTab, setActiveTab] = useState('etudiants');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        nom: '', prenom: '', email: '', mot_de_passe: '',
        num_etudiant: '', date_naissance: '', formation: 'MIAGE', annee_formation: 1
    });
    const [loading, setLoading] = useState(false);
    const [profil, setProfil] = useState(null);
    const [profilForm, setProfilForm] = useState({ nom: '', prenom: '', en_conge: false });

    useEffect(() => {
        loadEtudiants();
    }, []);

    const loadEtudiants = async () => {
        try {
            const response = await getEtudiants();
            setEtudiants(response.data);

            // Charger les documents RC pour chaque etudiant
            const rcData = {};
            for (const etudiant of response.data) {
                try {
                    const rcRes = await getRCEtudiant(etudiant.id);
                    if (rcRes.data) {
                        rcData[etudiant.id] = rcRes.data;
                    }
                } catch (err) {
                    // Pas de RC pour cet etudiant
                }
            }
            setEtudiantsRC(rcData);

            // Charger le profil de la secretaire
            try {
                const profilRes = await getMyProfilSecretaire();
                setProfil(profilRes.data);
                setProfilForm({
                    nom: profilRes.data.nom || '',
                    prenom: profilRes.data.prenom || '',
                    en_conge: profilRes.data.en_conge || false
                });
            } catch (err) {
                console.error('Erreur profil:', err);
            }
        } catch (err) {
            console.error('Erreur:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createEtudiant(formData);
            setShowModal(false);
            setFormData({
                nom: '', prenom: '', email: '', mot_de_passe: '',
                num_etudiant: '', date_naissance: '', formation: 'MIAGE', annee_formation: 1
            });
            loadEtudiants();
            alert('Etudiant cree avec succes !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleValiderRC = async (etudiantId) => {
        if (!confirm('Valider l\'attestation RC ?')) return;
        try {
            await validerRCDocument(etudiantId);
            loadEtudiants();
            alert('Attestation RC validee !');
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    const handleRejeterRC = async (etudiantId) => {
        const motif = prompt('Motif du rejet (optionnel):');
        if (motif === null) return;
        try {
            await rejeterRCDocument(etudiantId, motif);
            loadEtudiants();
            alert('Attestation RC rejetee');
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Supprimer cet etudiant ?')) return;
        try {
            await deleteEtudiant(id);
            loadEtudiants();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    // Etudiants qui ont uploade une RC mais pas encore validee
    const etudiantsAvecRCNonValidee = etudiants.filter(e =>
        etudiantsRC[e.id] && !e.responsabilite_civile
    );

    return (
        <Layout title="Espace Secretaire">
            <div className="tabs">
                <button
                    className={activeTab === 'etudiants' ? 'active' : ''}
                    onClick={() => setActiveTab('etudiants')}
                >
                    Etudiants ({etudiants.length})
                </button>
                <button
                    className={activeTab === 'attestations' ? 'active' : ''}
                    onClick={() => setActiveTab('attestations')}
                >
                    Attestations RC a valider ({etudiantsAvecRCNonValidee.length})
                </button>
                <button
                    className={activeTab === 'profil' ? 'active' : ''}
                    onClick={() => setActiveTab('profil')}
                >
                    Mon profil
                </button>
            </div>

            {activeTab === 'etudiants' && (
                <>
                    <div className="section-header">
                        <h2>Gestion des Etudiants</h2>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            + Ajouter un etudiant
                        </button>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Prenom</th>
                                    <th>N Etudiant</th>
                                    <th>Formation</th>
                                    <th>Annee</th>
                                    <th>RC</th>
                                    <th>Document RC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {etudiants.map(etudiant => (
                                    <tr key={etudiant.id}>
                                        <td>{etudiant.nom}</td>
                                        <td>{etudiant.prenom}</td>
                                        <td>{etudiant.num_etudiant}</td>
                                        <td>{etudiant.formation}</td>
                                        <td>{etudiant.annee_formation}</td>
                                        <td className={etudiant.responsabilite_civile ? 'status-valid' : 'status-pending'}>
                                            {etudiant.responsabilite_civile ? 'Validee' : 'Non validee'}
                                        </td>
                                        <td>
                                            {etudiantsRC[etudiant.id] ? (
                                                <a href={downloadRC(etudiantsRC[etudiant.id].id)} target="_blank" className="btn-link">
                                                    Voir document
                                                </a>
                                            ) : (
                                                <span className="no-doc">Aucun</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'attestations' && (
                <>
                    <div className="section-header">
                        <h2>Validation des Attestations RC</h2>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Prenom</th>
                                    <th>N Etudiant</th>
                                    <th>Document</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {etudiantsAvecRCNonValidee.map(etudiant => (
                                    <tr key={etudiant.id}>
                                        <td>{etudiant.nom}</td>
                                        <td>{etudiant.prenom}</td>
                                        <td>{etudiant.num_etudiant}</td>
                                        <td>
                                            <a href={downloadRC(etudiantsRC[etudiant.id].id)} target="_blank" className="btn-link">
                                                Telecharger le document
                                            </a>
                                        </td>
                                        <td>
                                            <button className="btn-validate" onClick={() => handleValiderRC(etudiant.id)}>
                                                Valider
                                            </button>
                                            <button className="btn-reject" onClick={() => handleRejeterRC(etudiant.id)}>
                                                Rejeter
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {etudiantsAvecRCNonValidee.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', opacity: 0.7 }}>
                                            Aucune attestation en attente de validation
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'profil' && (
                <div className="profil-section">
                    <h2>Mon profil</h2>
                    {profil && (
                        <div className="profil-info">
                            <p><strong>Email:</strong> {profil.email}</p>
                        </div>
                    )}
                    <h3>Modifier mes informations</h3>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            await updateMyProfilSecretaire(profilForm);
                            alert('Profil mis a jour !');
                            loadEtudiants();
                        } catch (err) {
                            alert('Erreur: ' + err.message);
                        }
                    }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nom</label>
                                <input
                                    type="text"
                                    value={profilForm.nom}
                                    onChange={e => setProfilForm({ ...profilForm, nom: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Prenom</label>
                                <input
                                    type="text"
                                    value={profilForm.prenom}
                                    onChange={e => setProfilForm({ ...profilForm, prenom: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Statut de conge</label>
                                <select
                                    value={profilForm.en_conge ? 'true' : 'false'}
                                    onChange={e => setProfilForm({ ...profilForm, en_conge: e.target.value === 'true' })}
                                >
                                    <option value="false">En activite</option>
                                    <option value="true">En conge</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary">Enregistrer</button>
                    </form>
                </div>
            )}

            {showModal && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Ajouter un etudiant</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Prenom</label>
                                    <input type="text" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>N Etudiant</label>
                                    <input type="text" value={formData.num_etudiant} onChange={e => setFormData({ ...formData, num_etudiant: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date de naissance</label>
                                    <input type="date" value={formData.date_naissance} onChange={e => setFormData({ ...formData, date_naissance: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Mot de passe</label>
                                    <input type="password" value={formData.mot_de_passe} onChange={e => setFormData({ ...formData, mot_de_passe: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Formation</label>
                                    <select value={formData.formation} onChange={e => setFormData({ ...formData, formation: e.target.value })}>
                                        <option value="MIAGE">MIAGE</option>
                                        <option value="TAL">TAL</option>
                                        <option value="SCIENCES_COGNITIVES">Sciences Cognitives</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Annee</label>
                                    <select value={formData.annee_formation} onChange={e => setFormData({ ...formData, annee_formation: parseInt(e.target.value) })}>
                                        <option value="1">1ere annee</option>
                                        <option value="2">2eme annee</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Creation...' : 'Creer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default Secretaire;
