import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEtudiants, createEtudiant, validerRC, deleteEtudiant } from '../services/api';
import Layout from '../components/Layout';
import './Secretaire.css';

function Secretaire() {
    const { user } = useAuth();
    const [etudiants, setEtudiants] = useState([]);
    const [activeTab, setActiveTab] = useState('etudiants');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        nom: '', prenom: '', email: '', mot_de_passe: '',
        num_etudiant: '', date_naissance: '', formation: 'MIAGE', annee_formation: 1
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadEtudiants();
    }, []);

    const loadEtudiants = async () => {
        try {
            const response = await getEtudiants();
            setEtudiants(response.data);
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
            alert('Étudiant créé avec succès !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleValiderRC = async (id) => {
        if (!confirm('Valider l\'attestation RC ?')) return;
        try {
            await validerRC(id);
            loadEtudiants();
            alert('Attestation RC validée !');
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Supprimer cet étudiant ?')) return;
        try {
            await deleteEtudiant(id);
            loadEtudiants();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    const etudiantsSansRC = etudiants.filter(e => !e.responsabilite_civile);

    return (
        <Layout title="Espace Secrétaire">
            <div className="tabs">
                <button
                    className={activeTab === 'etudiants' ? 'active' : ''}
                    onClick={() => setActiveTab('etudiants')}
                >
                    Étudiants ({etudiants.length})
                </button>
                <button
                    className={activeTab === 'attestations' ? 'active' : ''}
                    onClick={() => setActiveTab('attestations')}
                >
                    Attestations RC ({etudiantsSansRC.length})
                </button>
            </div>

            {activeTab === 'etudiants' && (
                <>
                    <div className="section-header">
                        <h2>Gestion des Étudiants</h2>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            + Ajouter un étudiant
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
                                    <th>Année</th>
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
                                        <td>{etudiant.annee_formation}</td>
                                        <td className={etudiant.responsabilite_civile ? 'status-valid' : 'status-pending'}>
                                            {etudiant.responsabilite_civile ? 'Oui' : 'Non'}
                                        </td>
                                        <td>
                                            <button className="btn-delete" onClick={() => handleDelete(etudiant.id)}>
                                                Supprimer
                                            </button>
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
                                    <th>Prénom</th>
                                    <th>N° Étudiant</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {etudiantsSansRC.map(etudiant => (
                                    <tr key={etudiant.id}>
                                        <td>{etudiant.nom}</td>
                                        <td>{etudiant.prenom}</td>
                                        <td>{etudiant.num_etudiant}</td>
                                        <td className="status-pending">En attente</td>
                                        <td>
                                            <button className="btn-validate" onClick={() => handleValiderRC(etudiant.id)}>
                                                Valider
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showModal && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Ajouter un étudiant</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input type="text" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>N° Étudiant</label>
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
                                    <label>Année</label>
                                    <select value={formData.annee_formation} onChange={e => setFormData({ ...formData, annee_formation: parseInt(e.target.value) })}>
                                        <option value="1">1ère année</option>
                                        <option value="2">2ème année</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
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

export default Secretaire;
