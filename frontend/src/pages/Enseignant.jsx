import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getOffresEnAttente,
    validerOffre,
    refuserOffre,
    getCandidaturesAValider,
    validerCandidature,
    getBaremes,
    createBareme,
    updateBareme,
    deleteBareme,
    getEnseignantStats,
    getEnseignantProfil,
    updateEnseignantProfil,
    getDroitsSecretaire,
    getEtudiantsEnseignant,
    createEtudiantEnseignant,
    validerRCEnseignant,
    getNotifications,
    getNotificationsCount,
    marquerNotificationLue,
    marquerToutesNotificationsLues
} from '../services/api';
import Layout from '../components/Layout';
import './Enseignant.css';

function Enseignant() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [offres, setOffres] = useState([]);
    const [candidatures, setCandidatures] = useState([]);
    const [baremes, setBaremes] = useState([]);
    const [stats, setStats] = useState({});
    const [profil, setProfil] = useState({});
    const [loading, setLoading] = useState(false);

    // Droits secrétaire
    const [droitsSecretaire, setDroitsSecretaire] = useState({ hasDroits: false, canAct: false });
    const [etudiants, setEtudiants] = useState([]);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [notifCount, setNotifCount] = useState(0);

    // Modals
    const [showRefusModal, setShowRefusModal] = useState(false);
    const [selectedOffre, setSelectedOffre] = useState(null);
    const [motifRefus, setMotifRefus] = useState('');

    const [showBaremeModal, setShowBaremeModal] = useState(false);
    const [baremeEditId, setBaremeEditId] = useState(null);
    const [baremeForm, setBaremeForm] = useState({
        type_contrat: 'STAGE',
        pays: 'France',
        duree_min: 0,
        duree_max: 0,
        montant_min: 0,
        description: ''
    });

    const [showProfilModal, setShowProfilModal] = useState(false);
    const [profilForm, setProfilForm] = useState({ nom: '', prenom: '' });

    const [showEtudiantModal, setShowEtudiantModal] = useState(false);
    const [etudiantForm, setEtudiantForm] = useState({
        nom: '', prenom: '', email: '', mot_de_passe: '',
        num_etudiant: '', date_naissance: '', formation: 'MIAGE', annee_formation: 1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [offresRes, candRes, baremesRes, statsRes, profilRes, droitsRes, notifRes, notifCountRes] = await Promise.all([
                getOffresEnAttente(),
                getCandidaturesAValider(),
                getBaremes(),
                getEnseignantStats(),
                getEnseignantProfil(),
                getDroitsSecretaire(),
                getNotifications(),
                getNotificationsCount()
            ]);
            setOffres(offresRes.data);
            setCandidatures(candRes.data);
            setBaremes(baremesRes.data);
            setStats(statsRes.data);
            setProfil(profilRes.data);
            setProfilForm({ nom: profilRes.data.nom, prenom: profilRes.data.prenom });
            setDroitsSecretaire(droitsRes.data);
            setNotifications(notifRes.data);
            setNotifCount(notifCountRes.data.count);

            // Charger les étudiants si droits secrétaire
            if (droitsRes.data.hasDroits) {
                const etudRes = await getEtudiantsEnseignant();
                setEtudiants(etudRes.data);
            }
        } catch (err) {
            console.error('Erreur chargement:', err);
        }
    };

    // ==================== OFFRES ====================
    const handleValiderOffre = async (id) => {
        if (!confirm('Valider cette offre ?')) return;
        try {
            setLoading(true);
            await validerOffre(id);
            loadData();
            alert('Offre validée !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const openRefusModal = (offre) => {
        setSelectedOffre(offre);
        setMotifRefus('');
        setShowRefusModal(true);
    };

    const handleRefuserOffre = async () => {
        if (!motifRefus.trim()) {
            alert('Veuillez indiquer un motif de refus');
            return;
        }
        try {
            setLoading(true);
            await refuserOffre(selectedOffre.id, motifRefus);
            setShowRefusModal(false);
            loadData();
            alert('Offre refusée');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ==================== CANDIDATURES ====================
    const handleValiderCandidature = async (id) => {
        if (!confirm('Valider cette affectation ? Les autres candidatures seront automatiquement rejetées.')) return;
        try {
            setLoading(true);
            await validerCandidature(id);
            loadData();
            alert('Affectation validée !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ==================== BARÈMES ====================
    const openBaremeModal = (bareme = null) => {
        if (bareme) {
            setBaremeEditId(bareme.id);
            setBaremeForm({
                type_contrat: bareme.type_contrat,
                pays: bareme.pays,
                duree_min: bareme.duree_min,
                duree_max: bareme.duree_max,
                montant_min: bareme.montant_min,
                description: bareme.description || ''
            });
        } else {
            setBaremeEditId(null);
            setBaremeForm({
                type_contrat: 'STAGE',
                pays: 'France',
                duree_min: 0,
                duree_max: 0,
                montant_min: 0,
                description: ''
            });
        }
        setShowBaremeModal(true);
    };

    const handleBaremeSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (baremeEditId) {
                await updateBareme(baremeEditId, baremeForm);
                alert('Barème modifié !');
            } else {
                await createBareme(baremeForm);
                alert('Barème créé !');
            }
            setShowBaremeModal(false);
            loadData();
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBareme = async (id) => {
        if (!confirm('Supprimer ce barème ?')) return;
        try {
            await deleteBareme(id);
            loadData();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    // ==================== PROFIL ====================
    const handleProfilSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await updateEnseignantProfil(profilForm);
            setShowProfilModal(false);
            loadData();
            alert('Profil mis à jour !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ==================== DROITS SECRÉTAIRE ====================
    const handleCreateEtudiant = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await createEtudiantEnseignant(etudiantForm);
            setShowEtudiantModal(false);
            setEtudiantForm({
                nom: '', prenom: '', email: '', mot_de_passe: '',
                num_etudiant: '', date_naissance: '', formation: 'MIAGE', annee_formation: 1
            });
            loadData();
            alert('Étudiant créé !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleValiderRC = async (id) => {
        if (!confirm('Valider l\'attestation RC ?')) return;
        try {
            await validerRCEnseignant(id);
            loadData();
            alert('Attestation RC validée !');
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    // ==================== NOTIFICATIONS ====================
    const handleMarquerLue = async (id) => {
        try {
            await marquerNotificationLue(id);
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarquerToutesLues = async () => {
        try {
            await marquerToutesNotificationsLues();
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const etudiantsSansRC = etudiants.filter(e => !e.responsabilite_civile);

    // ==================== RENDER ====================
    return (
        <Layout title="Espace Enseignant Responsable">
            <div className="enseignant-tabs">
                <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                    📊 Dashboard
                </button>
                <button className={activeTab === 'offres' ? 'active' : ''} onClick={() => setActiveTab('offres')}>
                    📋 Offres ({offres.length})
                </button>
                <button className={activeTab === 'candidatures' ? 'active' : ''} onClick={() => setActiveTab('candidatures')}>
                    👥 Candidatures ({candidatures.length})
                </button>
                <button className={activeTab === 'baremes' ? 'active' : ''} onClick={() => setActiveTab('baremes')}>
                    💰 Barèmes ({baremes.length})
                </button>
                {droitsSecretaire.hasDroits && (
                    <button className={activeTab === 'secretaire' ? 'active' : ''} onClick={() => setActiveTab('secretaire')}>
                        👩‍💼 Droits Secrétaire
                    </button>
                )}
                <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
                    🔔 Notifications {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
                </button>
                <button className={activeTab === 'profil' ? 'active' : ''} onClick={() => setActiveTab('profil')}>
                    👤 Mon Profil
                </button>
            </div>

            {/* ==================== DASHBOARD ==================== */}
            {activeTab === 'dashboard' && (
                <div className="dashboard">
                    <h2>Tableau de bord</h2>
                    <div className="stats-grid">
                        <div className="stat-card warning">
                            <div className="stat-number">{stats.offresEnAttente || 0}</div>
                            <div className="stat-label">Offres en attente</div>
                        </div>
                        <div className="stat-card danger">
                            <div className="stat-number">{stats.candidaturesAValider || 0}</div>
                            <div className="stat-label">Candidatures à valider</div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-number">{stats.offresValidees || 0}</div>
                            <div className="stat-label">Offres validées</div>
                        </div>
                        <div className="stat-card info">
                            <div className="stat-number">{stats.affectationsValidees || 0}</div>
                            <div className="stat-label">Affectations finales</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== OFFRES ==================== */}
            {activeTab === 'offres' && (
                <>
                    <div className="section-header">
                        <h2>Offres en attente de validation</h2>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Entreprise</th>
                                    <th>Titre</th>
                                    <th>Type</th>
                                    <th>Rémunération</th>
                                    <th>Durée</th>
                                    <th>Date dépôt</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offres.length === 0 ? (
                                    <tr><td colSpan="7" className="empty">Aucune offre en attente</td></tr>
                                ) : (
                                    offres.map(offre => (
                                        <tr key={offre.id}>
                                            <td>{offre.entreprise_nom}</td>
                                            <td>{offre.titre}</td>
                                            <td><span className={`badge ${offre.type?.toLowerCase()}`}>{offre.type}</span></td>
                                            <td>{offre.remuneration}€/mois</td>
                                            <td>{offre.duree} mois</td>
                                            <td>{new Date(offre.date_depot).toLocaleDateString()}</td>
                                            <td className="actions">
                                                <button className="btn-validate" onClick={() => handleValiderOffre(offre.id)} disabled={loading}>
                                                    ✅ Valider
                                                </button>
                                                <button className="btn-refuse" onClick={() => openRefusModal(offre)} disabled={loading}>
                                                    ❌ Refuser
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ==================== CANDIDATURES ==================== */}
            {activeTab === 'candidatures' && (
                <>
                    <div className="section-header">
                        <h2>Candidatures à valider (acceptées par l'entreprise)</h2>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Étudiant</th>
                                    <th>N° Étudiant</th>
                                    <th>Formation</th>
                                    <th>Offre</th>
                                    <th>Entreprise</th>
                                    <th>Type</th>
                                    <th>Acceptée le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidatures.length === 0 ? (
                                    <tr><td colSpan="8" className="empty">Aucune candidature en attente</td></tr>
                                ) : (
                                    candidatures.map(cand => (
                                        <tr key={cand.id}>
                                            <td>{cand.etudiant_prenom} {cand.etudiant_nom}</td>
                                            <td>{cand.num_etudiant}</td>
                                            <td>{cand.formation}</td>
                                            <td>{cand.offre_titre}</td>
                                            <td>{cand.entreprise_nom}</td>
                                            <td><span className={`badge ${cand.offre_type?.toLowerCase()}`}>{cand.offre_type}</span></td>
                                            <td>{cand.date_acceptation_entreprise ? new Date(cand.date_acceptation_entreprise).toLocaleDateString() : '-'}</td>
                                            <td className="actions">
                                                <button className="btn-validate" onClick={() => handleValiderCandidature(cand.id)} disabled={loading}>
                                                    ✅ Valider
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ==================== BARÈMES ==================== */}
            {activeTab === 'baremes' && (
                <>
                    <div className="section-header">
                        <h2>Barèmes de rémunération légale</h2>
                        <button className="btn-primary" onClick={() => openBaremeModal()}>
                            + Ajouter un barème
                        </button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type de contrat</th>
                                    <th>Pays</th>
                                    <th>Durée min (mois)</th>
                                    <th>Durée max (mois)</th>
                                    <th>Montant min (€/mois)</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {baremes.length === 0 ? (
                                    <tr><td colSpan="7" className="empty">Aucun barème défini</td></tr>
                                ) : (
                                    baremes.map(bareme => (
                                        <tr key={bareme.id}>
                                            <td><span className={`badge ${bareme.type_contrat?.toLowerCase()}`}>{bareme.type_contrat}</span></td>
                                            <td>{bareme.pays}</td>
                                            <td>{bareme.duree_min}</td>
                                            <td>{bareme.duree_max}</td>
                                            <td>{bareme.montant_min}€</td>
                                            <td>{bareme.description || '-'}</td>
                                            <td className="actions">
                                                <button className="btn-edit" onClick={() => openBaremeModal(bareme)}>✏️</button>
                                                <button className="btn-delete" onClick={() => handleDeleteBareme(bareme.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ==================== DROITS SECRÉTAIRE ==================== */}
            {activeTab === 'secretaire' && droitsSecretaire.hasDroits && (
                <>
                    <div className="section-header">
                        <h2>Fonctions Secrétaire</h2>
                        {droitsSecretaire.canAct ? (
                            <span className="status-active">✅ Toutes les secrétaires sont en congé - Vous pouvez agir</span>
                        ) : (
                            <span className="status-inactive">⏸️ Des secrétaires sont disponibles ({droitsSecretaire.secretairesTotal - droitsSecretaire.secretairesEnConge} actives)</span>
                        )}
                    </div>

                    {droitsSecretaire.canAct ? (
                        <>
                            <div className="sub-tabs">
                                <h3>👨‍🎓 Étudiants</h3>
                                <button className="btn-primary" onClick={() => setShowEtudiantModal(true)}>
                                    + Inscrire un étudiant
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Prénom</th>
                                            <th>N° Étudiant</th>
                                            <th>Formation</th>
                                            <th>RC</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {etudiants.map(etudiant => (
                                            <tr key={etudiant.id}>
                                                <td>{etudiant.nom}</td>
                                                <td>{etudiant.prenom}</td>
                                                <td>{etudiant.num_etudiant}</td>
                                                <td>{etudiant.formation}</td>
                                                <td>{etudiant.responsabilite_civile ? '✅' : '⏳'}</td>
                                                <td>
                                                    {!etudiant.responsabilite_civile && (
                                                        <button className="btn-validate" onClick={() => handleValiderRC(etudiant.id)}>
                                                            ✅ Valider RC
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="info-box">
                            <p>Vous avez les droits secrétaire mais vous ne pouvez les exercer que lorsque toutes les secrétaires sont en congé.</p>
                        </div>
                    )}
                </>
            )}

            {/* ==================== NOTIFICATIONS ==================== */}
            {activeTab === 'notifications' && (
                <>
                    <div className="section-header">
                        <h2>Mes Notifications</h2>
                        {notifCount > 0 && (
                            <button className="btn-primary" onClick={handleMarquerToutesLues}>
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div className="empty-state">Aucune notification</div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className={`notification-item ${notif.lue ? 'read' : 'unread'}`}>
                                    <div className="notif-content">
                                        <p className="notif-message">{notif.message}</p>
                                        <span className="notif-date">{new Date(notif.date_creation).toLocaleString()}</span>
                                    </div>
                                    {!notif.lue && (
                                        <button className="btn-small" onClick={() => handleMarquerLue(notif.id)}>✓</button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* ==================== PROFIL ==================== */}
            {activeTab === 'profil' && (
                <div className="profil-section">
                    <h2>Mon Profil</h2>
                    <div className="profil-card">
                        <div className="profil-info">
                            <p><strong>Nom :</strong> {profil.nom}</p>
                            <p><strong>Prénom :</strong> {profil.prenom}</p>
                            <p><strong>Email :</strong> {profil.email}</p>
                            <p><strong>Droits secrétaire :</strong> {profil.droits_secretaire ? '✅ Oui' : '❌ Non'}</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowProfilModal(true)}>
                            ✏️ Modifier mes informations
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== MODAL REFUS ==================== */}
            {showRefusModal && (
                <div className="modal" onClick={() => setShowRefusModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Refuser l'offre</h2>
                        <p><strong>Offre :</strong> {selectedOffre?.titre}</p>
                        <p><strong>Entreprise :</strong> {selectedOffre?.entreprise_nom}</p>
                        <div className="form-group">
                            <label>Motif du refus *</label>
                            <select value={motifRefus} onChange={e => setMotifRefus(e.target.value)}>
                                <option value="">-- Sélectionner un motif --</option>
                                <option value="Rémunération insuffisante">Rémunération insuffisante</option>
                                <option value="Durée non conforme">Durée non conforme</option>
                                <option value="Description incomplète">Description incomplète</option>
                                <option value="Missions non adaptées au niveau d'étude">Missions non adaptées au niveau d'étude</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowRefusModal(false)}>Annuler</button>
                            <button className="btn-refuse" onClick={handleRefuserOffre} disabled={loading}>
                                {loading ? 'Envoi...' : 'Refuser l\'offre'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MODAL BARÈME ==================== */}
            {showBaremeModal && (
                <div className="modal" onClick={() => setShowBaremeModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{baremeEditId ? 'Modifier le barème' : 'Ajouter un barème'}</h2>
                        <form onSubmit={handleBaremeSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type de contrat</label>
                                    <select value={baremeForm.type_contrat} onChange={e => setBaremeForm({ ...baremeForm, type_contrat: e.target.value })}>
                                        <option value="STAGE">Stage</option>
                                        <option value="ALTERNANCE">Alternance</option>
                                        <option value="CDD">CDD</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Pays</label>
                                    <input type="text" value={baremeForm.pays} onChange={e => setBaremeForm({ ...baremeForm, pays: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Durée min (mois)</label>
                                    <input type="number" value={baremeForm.duree_min} onChange={e => setBaremeForm({ ...baremeForm, duree_min: parseInt(e.target.value) })} required />
                                </div>
                                <div className="form-group">
                                    <label>Durée max (mois)</label>
                                    <input type="number" value={baremeForm.duree_max} onChange={e => setBaremeForm({ ...baremeForm, duree_max: parseInt(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Montant min (€/mois)</label>
                                    <input type="number" step="0.01" value={baremeForm.montant_min} onChange={e => setBaremeForm({ ...baremeForm, montant_min: parseFloat(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={baremeForm.description} onChange={e => setBaremeForm({ ...baremeForm, description: e.target.value })} rows="3" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowBaremeModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Enregistrement...' : (baremeEditId ? 'Modifier' : 'Créer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== MODAL PROFIL ==================== */}
            {showProfilModal && (
                <div className="modal" onClick={() => setShowProfilModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Modifier mon profil</h2>
                        <form onSubmit={handleProfilSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input type="text" value={profilForm.nom} onChange={e => setProfilForm({ ...profilForm, nom: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input type="text" value={profilForm.prenom} onChange={e => setProfilForm({ ...profilForm, prenom: e.target.value })} required />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowProfilModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== MODAL ÉTUDIANT ==================== */}
            {showEtudiantModal && (
                <div className="modal" onClick={() => setShowEtudiantModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Inscrire un étudiant</h2>
                        <form onSubmit={handleCreateEtudiant}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input type="text" value={etudiantForm.nom} onChange={e => setEtudiantForm({ ...etudiantForm, nom: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input type="text" value={etudiantForm.prenom} onChange={e => setEtudiantForm({ ...etudiantForm, prenom: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={etudiantForm.email} onChange={e => setEtudiantForm({ ...etudiantForm, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>N° Étudiant</label>
                                    <input type="text" value={etudiantForm.num_etudiant} onChange={e => setEtudiantForm({ ...etudiantForm, num_etudiant: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date de naissance</label>
                                    <input type="date" value={etudiantForm.date_naissance} onChange={e => setEtudiantForm({ ...etudiantForm, date_naissance: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Mot de passe</label>
                                    <input type="password" value={etudiantForm.mot_de_passe} onChange={e => setEtudiantForm({ ...etudiantForm, mot_de_passe: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Formation</label>
                                    <select value={etudiantForm.formation} onChange={e => setEtudiantForm({ ...etudiantForm, formation: e.target.value })}>
                                        <option value="MIAGE">MIAGE</option>
                                        <option value="TAL">TAL</option>
                                        <option value="SCIENCES_COGNITIVES">Sciences Cognitives</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Année</label>
                                    <select value={etudiantForm.annee_formation} onChange={e => setEtudiantForm({ ...etudiantForm, annee_formation: parseInt(e.target.value) })}>
                                        <option value="1">1ère année</option>
                                        <option value="2">2ème année</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEtudiantModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Création...' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default Enseignant;
