import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSecretaires, getEnseignants, createSecretaire, createEnseignant, deleteSecretaire, deleteEnseignant } from '../services/api';
import Layout from '../components/Layout';
import './Admin.css';

function Admin() {
    const { user } = useAuth();
    const [secretaires, setSecretaires] = useState([]);
    const [enseignants, setEnseignants] = useState([]);
    const [activeTab, setActiveTab] = useState('secretaires');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', droits_secretaire: false });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [secRes, ensRes] = await Promise.all([getSecretaires(), getEnseignants()]);
            setSecretaires(secRes.data);
            setEnseignants(ensRes.data);
        } catch (err) {
            console.error('Erreur chargement:', err);
        }
    };

    const openModal = (type) => {
        setModalType(type);
        setFormData({ nom: '', prenom: '', email: '', mot_de_passe: '', droits_secretaire: false });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (modalType === 'secretaire') {
                await createSecretaire(formData);
            } else {
                await createEnseignant(formData);
            }
            setShowModal(false);
            loadData();
            alert('Compte créé avec succès !');
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm('Supprimer ce compte ?')) return;

        try {
            if (type === 'secretaire') {
                await deleteSecretaire(id);
            } else {
                await deleteEnseignant(id);
            }
            loadData();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    };

    return (
        <Layout title="Administration">
            <div className="admin-tabs">
                <button
                    className={activeTab === 'secretaires' ? 'active' : ''}
                    onClick={() => setActiveTab('secretaires')}
                >
                    Secrétaires ({secretaires.length})
                </button>
                <button
                    className={activeTab === 'enseignants' ? 'active' : ''}
                    onClick={() => setActiveTab('enseignants')}
                >
                    Enseignants ({enseignants.length})
                </button>
            </div>

            <div className="section-header">
                <h2>{activeTab === 'secretaires' ? 'Secrétaires' : 'Enseignants Responsables'}</h2>
                <button className="btn-primary" onClick={() => openModal(activeTab.slice(0, -1))}>
                    + Ajouter
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Email</th>
                            <th>{activeTab === 'secretaires' ? 'En congé' : 'Droits secrétaire'}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(activeTab === 'secretaires' ? secretaires : enseignants).map(item => (
                            <tr key={item.id}>
                                <td>{item.nom}</td>
                                <td>{item.prenom}</td>
                                <td>{item.email}</td>
                                <td>
                                    {activeTab === 'secretaires'
                                        ? (item.en_conge ? 'Oui' : 'Non')
                                        : (item.droits_secretaire ? 'Oui' : 'Non')
                                    }
                                </td>
                                <td>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(activeTab.slice(0, -1), item.id)}
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Ajouter un {modalType}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input
                                        type="text"
                                        value={formData.prenom}
                                        onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mot de passe</label>
                                    <input
                                        type="password"
                                        value={formData.mot_de_passe}
                                        onChange={e => setFormData({ ...formData, mot_de_passe: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            {modalType === 'enseignant' && (
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.droits_secretaire}
                                            onChange={e => setFormData({ ...formData, droits_secretaire: e.target.checked })}
                                        />
                                        Peut remplacer la secrétaire
                                    </label>
                                </div>
                            )}
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

export default Admin;
