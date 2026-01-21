import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getSecretaires, getEnseignants, createSecretaire, createEnseignant, updateSecretaire,
    updateEnseignant, deleteSecretaire, deleteEnseignant,
    adminGetEtudiants, adminCreateEtudiant, adminUpdateEtudiant, adminDeleteEtudiant,
    adminGetEntreprises, adminToggleEntreprise, adminDeleteEntreprise,
    adminGetOffres, adminValidateOffre, adminRefuseOffre,
    adminGetCandidatures,
    adminGetBaremes, adminCreateBareme, adminUpdateBareme, adminDeleteBareme
} from '../services/api';
import Layout from '../components/Layout';
import './Admin.css';

function Admin() {
    const { user } = useAuth();

    // Data States
    const [secretaires, setSecretaires] = useState([]);
    const [enseignants, setEnseignants] = useState([]);
    const [etudiants, setEtudiants] = useState([]);
    const [entreprises, setEntreprises] = useState([]);
    const [offres, setOffres] = useState([]);
    const [candidatures, setCandidatures] = useState([]);
    const [baremes, setBaremes] = useState([]);

    const [activeTab, setActiveTab] = useState('secretaires');
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // secretaire, enseignant, etudiant, bareme
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Forms
    const [userForm, setUserForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', droits_secretaire: false, en_conge: false });
    const [etudiantForm, setEtudiantForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', num_etudiant: '', date_naissance: '', formation: 'MIAGE', annee_formation: 1 });
    const [baremeForm, setBaremeForm] = useState({ type_offre: 'STAGE', pays: 'France', duree_min: 0, duree_max: 0, montant_minimal: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [secRes, ensRes, etuRes, entRes, offRes, candRes, barRes] = await Promise.all([
                getSecretaires(), getEnseignants(), adminGetEtudiants(), adminGetEntreprises(),
                adminGetOffres(), adminGetCandidatures(), adminGetBaremes()
            ]);

            setSecretaires(secRes.data);
            setEnseignants(ensRes.data);
            setEtudiants(etuRes.data);
            setEntreprises(entRes.data);
            setOffres(offRes.data);
            setCandidatures(candRes.data);
            setBaremes(barRes.data);
        } catch (err) {
            console.error('Erreur chargement:', err);
            alert('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setEditMode(!!item);
        setEditId(item?.id || null);

        if (type === 'secretaire' || type === 'enseignant') {
            setUserForm(item ? { ...item } : { nom: '', prenom: '', email: '', mot_de_passe: '', droits_secretaire: false, en_conge: false });
        } else if (type === 'etudiant') {
            setEtudiantForm(item ? { ...item, mot_de_passe: '' } : { nom: '', prenom: '', email: '', mot_de_passe: '', num_etudiant: '', date_naissance: '', formation: 'MIAGE', annee_formation: 1 });
        } else if (type === 'bareme') {
            setBaremeForm(item ? { ...item } : { type_offre: 'STAGE', pays: 'France', duree_min: 0, duree_max: 0, montant_minimal: 0 });
        }
        setShowModal(true);
    };

    const handleDelete = async (type, id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
        try {
            if (type === 'secretaire') await deleteSecretaire(id);
            if (type === 'enseignant') await deleteEnseignant(id);
            if (type === 'etudiant') await adminDeleteEtudiant(id);
            if (type === 'entreprise') await adminDeleteEntreprise(id);
            if (type === 'bareme') await adminDeleteBareme(id);
            loadData();
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleToggleEntreprise = async (id) => {
        try {
            await adminToggleEntreprise(id);
            loadData();
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleValidateOffre = async (id, validate) => {
        if (!confirm(validate ? 'Valider cette offre ?' : 'Refuser cette offre ?')) return;
        try {
            if (validate) await adminValidateOffre(id);
            else await adminRefuseOffre(id);
            loadData();
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (modalType === 'secretaire') {
                if (editMode) await updateSecretaire(editId, userForm);
                else await createSecretaire(userForm);
            } else if (modalType === 'enseignant') {
                if (editMode) await updateEnseignant(editId, userForm);
                else await createEnseignant(userForm);
            } else if (modalType === 'etudiant') {
                if (editMode) await adminUpdateEtudiant(editId, etudiantForm);
                else await adminCreateEtudiant(etudiantForm);
            } else if (modalType === 'bareme') {
                if (editMode) await adminUpdateBareme(editId, baremeForm);
                else await adminCreateBareme(baremeForm);
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Administration">
            <div className="admin-tabs">
                <button className={activeTab === 'secretaires' ? 'active' : ''} onClick={() => setActiveTab('secretaires')}>Secrétaires ({secretaires.length})</button>
                <button className={activeTab === 'enseignants' ? 'active' : ''} onClick={() => setActiveTab('enseignants')}>Enseignants ({enseignants.length})</button>
                <button className={activeTab === 'etudiants' ? 'active' : ''} onClick={() => setActiveTab('etudiants')}>Étudiants ({etudiants.length})</button>
                <button className={activeTab === 'entreprises' ? 'active' : ''} onClick={() => setActiveTab('entreprises')}>Entreprises ({entreprises.length})</button>
                <button className={activeTab === 'offres' ? 'active' : ''} onClick={() => setActiveTab('offres')}>Offres ({offres.length})</button>
                <button className={activeTab === 'candidatures' ? 'active' : ''} onClick={() => setActiveTab('candidatures')}>Candidatures ({candidatures.length})</button>
                <button className={activeTab === 'baremes' ? 'active' : ''} onClick={() => setActiveTab('baremes')}>Barèmes ({baremes.length})</button>
            </div>

            <div className="section-header">
                <h2>Gestion {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                {activeTab !== 'offres' && activeTab !== 'candidatures' && activeTab !== 'entreprises' && (
                    <button className="btn-primary" onClick={() => openModal(activeTab.slice(0, -1))}>
                        + Ajouter {activeTab.slice(0, -1)}
                    </button>
                )}
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        {activeTab === 'secretaires' && <tr><th>Nom</th><th>Prénom</th><th>Email</th><th>En congé</th><th>Actions</th></tr>}
                        {activeTab === 'enseignants' && <tr><th>Nom</th><th>Prénom</th><th>Email</th><th>Droits Sec.</th><th>Actions</th></tr>}
                        {activeTab === 'etudiants' && <tr><th>Num</th><th>Nom</th><th>Prénom</th><th>Formation</th><th>Année</th><th>Actions</th></tr>}
                        {activeTab === 'entreprises' && <tr><th>Raison Sociale</th><th>Siret</th><th>Email</th><th>Active</th><th>Actions</th></tr>}
                        {activeTab === 'offres' && <tr><th>Titre</th><th>Entreprise</th><th>Type</th><th>État</th><th>Validateur</th><th>Actions</th></tr>}
                        {activeTab === 'candidatures' && <tr><th>Étudiant</th><th>Offre</th><th>Entreprise</th><th>Date</th><th>Statut</th></tr>}
                        {activeTab === 'baremes' && <tr><th>Type</th><th>Pays</th><th>Durée</th><th>Min.</th><th>Actions</th></tr>}
                    </thead>
                    <tbody>
                        {activeTab === 'secretaires' && secretaires.map(item => (
                            <tr key={item.id}>
                                <td>{item.nom}</td><td>{item.prenom}</td><td>{item.email}</td>
                                <td>{item.en_conge ? 'Oui' : 'Non'}</td>
                                <td className="actions">
                                    <button className="btn-edit" onClick={() => openModal('secretaire', item)}>Mod.</button>
                                    <button className="btn-delete" onClick={() => handleDelete('secretaire', item.id)}>Sup.</button>
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'enseignants' && enseignants.map(item => (
                            <tr key={item.id}>
                                <td>{item.nom}</td><td>{item.prenom}</td><td>{item.email}</td>
                                <td>{item.droits_secretaire ? 'Oui' : 'Non'}</td>
                                <td className="actions">
                                    <button className="btn-edit" onClick={() => openModal('enseignant', item)}>Mod.</button>
                                    <button className="btn-delete" onClick={() => handleDelete('enseignant', item.id)}>Sup.</button>
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'etudiants' && etudiants.map(item => (
                            <tr key={item.id}>
                                <td>{item.num_etudiant}</td><td>{item.nom}</td><td>{item.prenom}</td><td>{item.formation}</td><td>{item.annee_formation}</td>
                                <td className="actions">
                                    <button className="btn-edit" onClick={() => openModal('etudiant', item)}>Mod.</button>
                                    <button className="btn-delete" onClick={() => handleDelete('etudiant', item.id)}>Sup.</button>
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'entreprises' && entreprises.map(item => (
                            <tr key={item.id}>
                                <td>{item.raison_sociale}</td><td>{item.siret}</td><td>{item.email}</td>
                                <td>
                                    <button className={`btn-status ${item.active ? 'active' : 'inactive'}`} onClick={() => handleToggleEntreprise(item.id)}>
                                        {item.active ? 'Active' : 'Inac.'}
                                    </button>
                                </td>
                                <td className="actions">
                                    <button className="btn-delete" onClick={() => handleDelete('entreprise', item.id)}>Sup.</button>
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'offres' && offres.map(item => (
                            <tr key={item.id}>
                                <td>{item.description.substring(0, 30)}...</td><td>{item.entreprise}</td><td>{item.type}</td>
                                <td><span className={`status-badge ${item.etat.toLowerCase().replace(/ /g, '-')}`}>{item.etat}</span></td>
                                <td>{item.validateur_nom ? `${item.validateur_nom} ${item.validateur_prenom}` : '-'}</td>
                                <td className="actions">
                                    {item.etat === 'EN ATTENTE DE VALIDATION' && (
                                        <>
                                            <button className="btn-validate" onClick={() => handleValidateOffre(item.id, true)}>Valider</button>
                                            <button className="btn-reject" onClick={() => handleValidateOffre(item.id, false)}>Refuser</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {activeTab === 'candidatures' && candidatures.map(item => (
                            <tr key={item.id}>
                                <td>{item.etudiant_nom} {item.etudiant_prenom}</td>
                                <td>{item.offre_type} - {item.entreprise}</td>
                                <td>{item.entreprise}</td>
                                <td>{new Date(item.date_candidature).toLocaleDateString()}</td>
                                <td><span className={`status-badge ${item.statut.toLowerCase().replace(/ /g, '-')}`}>{item.statut}</span></td>
                            </tr>
                        ))}
                        {activeTab === 'baremes' && baremes.map(item => (
                            <tr key={item.id}>
                                <td>{item.type_offre}</td><td>{item.pays}</td>
                                <td>{item.duree_min}-{item.duree_max} mois</td><td>{item.montant_minimal}€</td>
                                <td className="actions">
                                    <button className="btn-edit" onClick={() => openModal('bareme', item)}>Mod.</button>
                                    <button className="btn-delete" onClick={() => handleDelete('bareme', item.id)}>Sup.</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editMode ? 'Modifier' : 'Ajouter'} {modalType}</h2>
                        <form onSubmit={handleSubmit}>
                            {/* Secrétaire & Enseignant Form */}
                            {(modalType === 'secretaire' || modalType === 'enseignant') && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Nom</label>
                                            <input type="text" value={userForm.nom} onChange={e => setUserForm({ ...userForm, nom: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Prénom</label>
                                            <input type="text" value={userForm.prenom} onChange={e => setUserForm({ ...userForm, prenom: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        {!editMode && (
                                            <>
                                                <div className="form-group">
                                                    <label>Email</label>
                                                    <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                                                </div>
                                                <div className="form-group">
                                                    <label>Mot de passe</label>
                                                    <input type="password" value={userForm.mot_de_passe} onChange={e => setUserForm({ ...userForm, mot_de_passe: e.target.value })} required />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {modalType === 'secretaire' && (
                                        <div className="form-group checkbox">
                                            <label>
                                                <input type="checkbox" checked={userForm.en_conge} onChange={e => setUserForm({ ...userForm, en_conge: e.target.checked })} />
                                                En congé
                                            </label>
                                        </div>
                                    )}
                                    {modalType === 'enseignant' && (
                                        <div className="form-group checkbox">
                                            <label>
                                                <input type="checkbox" checked={userForm.droits_secretaire} onChange={e => setUserForm({ ...userForm, droits_secretaire: e.target.checked })} />
                                                Peut remplacer la secrétaire
                                            </label>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Etudiant Form */}
                            {modalType === 'etudiant' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Numéro Étudiant</label>
                                            <input type="text" value={etudiantForm.num_etudiant} onChange={e => setEtudiantForm({ ...etudiantForm, num_etudiant: e.target.value })} required disabled={editMode} />
                                        </div>
                                        <div className="form-group">
                                            <label>Date Naissance</label>
                                            <input type="date" value={etudiantForm.date_naissance ? etudiantForm.date_naissance.substring(0, 10) : ''} onChange={e => setEtudiantForm({ ...etudiantForm, date_naissance: e.target.value })} required disabled={editMode} />
                                        </div>
                                    </div>
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
                                    {!editMode && (
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Email</label>
                                                <input type="email" value={etudiantForm.email} onChange={e => setEtudiantForm({ ...etudiantForm, email: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Mot de passe</label>
                                                <input type="password" value={etudiantForm.mot_de_passe} onChange={e => setEtudiantForm({ ...etudiantForm, mot_de_passe: e.target.value })} required />
                                            </div>
                                        </div>
                                    )}
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
                                                <option value="1">L1</option>
                                                <option value="2">L2</option>
                                                <option value="2">L3</option>
                                                <option value="4">M1</option>
                                                <option value="5">M2</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Bareme Form */}
                            {modalType === 'bareme' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Type Offre</label>
                                            <select value={baremeForm.type_offre} onChange={e => setBaremeForm({ ...baremeForm, type_offre: e.target.value })}>
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
                                            <label>Durée Min (mois)</label>
                                            <input type="number" value={baremeForm.duree_min} onChange={e => setBaremeForm({ ...baremeForm, duree_min: parseInt(e.target.value) })} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Durée Max (mois)</label>
                                            <input type="number" value={baremeForm.duree_max} onChange={e => setBaremeForm({ ...baremeForm, duree_max: parseInt(e.target.value) })} required />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Montant Mensuel Min (€)</label>
                                        <input type="number" value={baremeForm.montant_minimal} onChange={e => setBaremeForm({ ...baremeForm, montant_minimal: parseInt(e.target.value) })} required />
                                    </div>
                                </>
                            )}

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Enregistrement...' : (editMode ? 'Modifier' : 'Créer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default Admin;
