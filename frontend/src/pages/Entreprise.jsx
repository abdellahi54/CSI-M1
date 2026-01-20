import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getEntrepriseProfile, updateEntrepriseProfile, getEtudiantsForEntreprise, getEtudiantDetails, getEntrepriseCandidatures, acceptCandidature, rejectCandidature, getCandidatureStudent, updateOffre } from '../services/api';
import Layout from '../components/Layout';
import './Entreprise.css';

function EntrepriseDashboard() {
    const { user } = useAuth();
    const [offers, setOffers] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Profile State
    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({
        raison_sociale: '',
        adresse: '',
        forme_juridique: ''
    });

    // Tab State
    const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'students' | 'candidatures'

    // Students State
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);

    // Candidatures State
    const [candidatures, setCandidatures] = useState([]);
    const [selectedOffre, setSelectedOffre] = useState('all');

    // Edit Offer State
    const [editingOffer, setEditingOffer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

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
        fetchStudents();
        fetchCandidatures();
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

    const fetchStudents = async () => {
        try {
            const response = await getEtudiantsForEntreprise();
            setStudents(response.data);
        } catch (err) {
            console.error('Erreur chargement étudiants:', err);
        }
    };

    const handleViewStudent = async (studentId) => {
        try {
            const response = await getEtudiantDetails(studentId);
            setSelectedStudent(response.data);
            setShowStudentModal(true);
        } catch (err) {
            console.error('Erreur chargement détails étudiant:', err);
            alert('Impossible de charger les détails de l\'étudiant');
        }
    };

    const fetchCandidatures = async (offreId = null) => {
        try {
            const response = await getEntrepriseCandidatures(offreId);
            setCandidatures(response.data);
        } catch (err) {
            console.error('Erreur chargement candidatures:', err);
        }
    };

    const handleFilterChange = (e) => {
        const offreId = e.target.value;
        setSelectedOffre(offreId);
        fetchCandidatures(offreId === 'all' ? null : offreId);
    };

    const handleAcceptCandidature = async (id) => {
        if (!confirm('Accepter cette candidature ?')) return;
        try {
            await acceptCandidature(id);
            alert('Candidature acceptée !');
            fetchCandidatures(selectedOffre === 'all' ? null : selectedOffre);
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur');
        }
    };

    const handleRejectCandidature = async (id) => {
        if (!confirm('Rejeter cette candidature ?')) return;
        try {
            await rejectCandidature(id);
            alert('Candidature rejetée');
            fetchCandidatures(selectedOffre === 'all' ? null : selectedOffre);
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur');
        }
    };

    const handleViewCandidatureStudent = async (candidatureId) => {
        try {
            const response = await getCandidatureStudent(candidatureId);
            setSelectedStudent(response.data);
            setShowStudentModal(true);
        } catch (err) {
            alert('Impossible de charger les détails');
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

    const openEditModal = (offer) => {
        setEditingOffer({
            id: offer.id,
            description: offer.description,
            remuneration: offer.remuneration,
            pays: offer.pays,
            ville: offer.ville,
            duree: offer.duree,
            date_debut: offer.date_debut?.split('T')[0] || '',
            date_expiration: offer.date_expiration?.split('T')[0] || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateOffre(editingOffer.id, editingOffer);
            alert('Offre modifiee avec succes !');
            setShowEditModal(false);
            setEditingOffer(null);
            fetchOffers();
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur lors de la modification');
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <Layout title="Espace Entreprise">
            <div className="tabs">
                <button
                    className={activeTab === 'offers' ? 'active' : ''}
                    onClick={() => setActiveTab('offers')}
                >
                    Mes Offres ({offers.length})
                </button>
                <button
                    className={activeTab === 'students' ? 'active' : ''}
                    onClick={() => setActiveTab('students')}
                >
                    Etudiants ({students.length})
                </button>
                <button
                    className={activeTab === 'candidatures' ? 'active' : ''}
                    onClick={() => setActiveTab('candidatures')}
                >
                    Candidatures ({candidatures.length})
                </button>
                <button
                    className={activeTab === 'profil' ? 'active' : ''}
                    onClick={() => setActiveTab('profil')}
                >
                    Mon profil
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Offers Tab */}
            {activeTab === 'offers' && (
                <>
                    <div className="section-header">
                        <h2>Gestion des Offres</h2>
                        <button className="btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                            {showCreateForm ? 'Annuler' : '+ Creer une offre'}
                        </button>
                    </div>

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

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Lieu</th>
                                    <th>Etat Validation</th>
                                    <th>Statut</th>
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
                                            <span className={offer.etat === 'Validee' ? 'status-valid' : offer.etat === 'Refusee' ? 'status-reject' : 'status-pending'}>
                                                {offer.etat}
                                            </span>
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
                                            {offer.etat !== 'Validee' && (
                                                <button className="btn-view" onClick={() => openEditModal(offer)}>
                                                    Modifier
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="students-list">
                    <h2>Étudiants en Recherche</h2>
                    {students.length === 0 ? (
                        <p>Aucun étudiant disponible pour le moment.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Formation</th>
                                    <th>Année</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td>{student.nom}</td>
                                        <td>{student.prenom}</td>
                                        <td>
                                            <span className={`badge-formation ${student.formation?.toLowerCase()}`}>
                                                {student.formation}
                                            </span>
                                        </td>
                                        <td>M{student.annee_formation}</td>
                                        <td>{student.email}</td>
                                        <td>
                                            <button
                                                className="btn-view"
                                                onClick={() => handleViewStudent(student.id)}
                                            >
                                                Voir Profil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Candidatures Tab */}
            {activeTab === 'candidatures' && (
                <div className="candidatures-section">
                    <div className="candidatures-header">
                        <h2>Gestion des Candidatures</h2>
                        <div className="filter-group">
                            <label>Filtrer par offre:</label>
                            <select value={selectedOffre} onChange={handleFilterChange}>
                                <option value="all">Toutes les offres</option>
                                {offers.map(offer => (
                                    <option key={offer.id} value={offer.id}>
                                        {offer.type} - {offer.description.substring(0, 30)}...
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {candidatures.length === 0 ? (
                        <p>Aucune candidature pour le moment.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Étudiant</th>
                                    <th>Formation</th>
                                    <th>Offre</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidatures.map((cand) => (
                                    <tr key={cand.id}>
                                        <td>
                                            <button className="link-btn" onClick={() => handleViewCandidatureStudent(cand.id)}>
                                                {cand.etudiant_nom} {cand.etudiant_prenom}
                                            </button>
                                        </td>
                                        <td>
                                            <span className={`badge-formation ${cand.formation?.toLowerCase()}`}>
                                                {cand.formation} M{cand.annee_formation}
                                            </span>
                                        </td>
                                        <td>{cand.offre_type}</td>
                                        <td>{new Date(cand.date_candidature).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${cand.statut.toLowerCase().replace(/ /g, '-')}`}>
                                                {cand.statut}
                                            </span>
                                        </td>
                                        <td>
                                            {cand.statut === 'SOUMISE' ? (
                                                <>
                                                    <button className="btn-validate" onClick={() => handleAcceptCandidature(cand.id)}>
                                                        Accepter
                                                    </button>
                                                    <button className="btn-reject" onClick={() => handleRejectCandidature(cand.id)}>
                                                        Rejeter
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="small-text">Traitée</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Profil Tab */}
            {activeTab === 'profil' && (
                <div className="profil-section">
                    <h2>Mon profil</h2>
                    {profile && (
                        <div className="profil-info">
                            <p><strong>Email:</strong> {profile.email}</p>
                            <p><strong>SIRET:</strong> {profile.siret}</p>
                            <p><strong>Date de creation:</strong> {new Date(profile.date_creation).toLocaleDateString()}</p>
                            <p><strong>Statut:</strong> {profile.active ? 'Actif' : 'Inactif'}</p>
                        </div>
                    )}
                    <h3>Modifier mes informations</h3>
                    <form onSubmit={handleProfileSubmit}>
                        <div className="form-row">
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
                                <label>Forme Juridique</label>
                                <select
                                    value={profileForm.forme_juridique}
                                    onChange={(e) => setProfileForm({ ...profileForm, forme_juridique: e.target.value })}
                                    required
                                >
                                    <option value="">Selectionner...</option>
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
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </form>
                </div>
            )}

            {/* Modal Étudiant Détails */}
            {showStudentModal && selectedStudent && (
                <div className="modal" onClick={() => setShowStudentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Profil Étudiant</h2>

                        <div className="profile-info">
                            <p><strong>Nom:</strong> {selectedStudent.nom}</p>
                            <p><strong>Prénom:</strong> {selectedStudent.prenom}</p>
                            <p><strong>Email:</strong> {selectedStudent.email}</p>
                            <p><strong>N° Étudiant:</strong> {selectedStudent.num_etudiant}</p>
                            <p><strong>Date de naissance:</strong> {new Date(selectedStudent.date_naissance).toLocaleDateString()}</p>
                            <p><strong>Formation:</strong> <span className={`badge-formation ${selectedStudent.formation?.toLowerCase()}`}>{selectedStudent.formation}</span></p>
                            <p><strong>Année:</strong> M{selectedStudent.annee_formation}</p>
                            <p><strong>RC:</strong> {selectedStudent.responsabilite_civile ? '✅ Validée' : '⏳ En attente'}</p>
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowStudentModal(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edition Offre */}
            {showEditModal && editingOffer && (
                <div className="modal" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Modifier l'offre</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={editingOffer.description}
                                    onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                                    required
                                    rows="4"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Pays</label>
                                    <input
                                        type="text"
                                        value={editingOffer.pays}
                                        onChange={(e) => setEditingOffer({ ...editingOffer, pays: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ville</label>
                                    <input
                                        type="text"
                                        value={editingOffer.ville}
                                        onChange={(e) => setEditingOffer({ ...editingOffer, ville: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Remuneration (euros/mois)</label>
                                    <input
                                        type="number"
                                        value={editingOffer.remuneration}
                                        onChange={(e) => setEditingOffer({ ...editingOffer, remuneration: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Duree (semaines)</label>
                                    <input
                                        type="number"
                                        value={editingOffer.duree}
                                        onChange={(e) => setEditingOffer({ ...editingOffer, duree: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date Debut</label>
                                    <input
                                        type="date"
                                        value={editingOffer.date_debut}
                                        onChange={(e) => setEditingOffer({ ...editingOffer, date_debut: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date Expiration</label>
                                    <input
                                        type="date"
                                        value={editingOffer.date_expiration}
                                        onChange={(e) => setEditingOffer({ ...editingOffer, date_expiration: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEditModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default EntrepriseDashboard;
