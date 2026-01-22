import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSecretaire, createEnseignant } from '../services/api';
import axios from 'axios';
import Layout from '../components/Layout';
import './Admin.css';

function Admin() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Formulaires
    const [enseignantForm, setEnseignantForm] = useState({
        nom: '', prenom: '', email: '', mot_de_passe: ''
    });

    const [secretaireForm, setSecretaireForm] = useState({
        nom: '', prenom: '', email: '', mot_de_passe: ''
    });

    const handleCreateEnseignant = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await createEnseignant(enseignantForm);
            setMessage('Compte enseignant responsable cree avec succes !');
            setEnseignantForm({ nom: '', prenom: '', email: '', mot_de_passe: '' });
        } catch (err) {
            setMessage('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSecretaire = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await createSecretaire(secretaireForm);
            setMessage('Compte secretaire cree avec succes !');
            setSecretaireForm({ nom: '', prenom: '', email: '', mot_de_passe: '' });
        } catch (err) {
            setMessage('Erreur: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleArchivage = async () => {
        if (!confirm('ATTENTION: Cette action va archiver toutes les offres et les entreprises inactives. Cette action est IRREVERSIBLE. Continuer ?')) {
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            await axios.post('http://localhost:3000/api/admin/archiver',
                {},
                {
                    headers: {
                        'X-User-Role': user.role,
                        'X-User-Id': user.id.toString()
                    }
                }
            );
            setMessage('Archivage termine avec succes !');
        } catch (err) {
            setMessage('Erreur archivage: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Administration">
            <div className="admin-page">
                <h1>Panneau d'Administration</h1>

                {message && (
                    <div className={`message ${message.includes('Erreur') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                <div className="admin-cards">
                    {/* Formulaire Enseignant Responsable */}
                    <div className="admin-card">
                        <h2>Creer un compte Enseignant Responsable</h2>
                        <form onSubmit={handleCreateEnseignant}>
                            <div className="form-group">
                                <label>Nom</label>
                                <input
                                    type="text"
                                    value={enseignantForm.nom}
                                    onChange={e => setEnseignantForm({ ...enseignantForm, nom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Prenom</label>
                                <input
                                    type="text"
                                    value={enseignantForm.prenom}
                                    onChange={e => setEnseignantForm({ ...enseignantForm, prenom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={enseignantForm.email}
                                    onChange={e => setEnseignantForm({ ...enseignantForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    value={enseignantForm.mot_de_passe}
                                    onChange={e => setEnseignantForm({ ...enseignantForm, mot_de_passe: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Creation...' : 'Creer le compte'}
                            </button>
                        </form>
                    </div>

                    {/* Formulaire Secretaire */}
                    <div className="admin-card">
                        <h2>Creer un compte Secretaire</h2>
                        <form onSubmit={handleCreateSecretaire}>
                            <div className="form-group">
                                <label>Nom</label>
                                <input
                                    type="text"
                                    value={secretaireForm.nom}
                                    onChange={e => setSecretaireForm({ ...secretaireForm, nom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Prenom</label>
                                <input
                                    type="text"
                                    value={secretaireForm.prenom}
                                    onChange={e => setSecretaireForm({ ...secretaireForm, prenom: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={secretaireForm.email}
                                    onChange={e => setSecretaireForm({ ...secretaireForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    value={secretaireForm.mot_de_passe}
                                    onChange={e => setSecretaireForm({ ...secretaireForm, mot_de_passe: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Creation...' : 'Creer le compte'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Section Archivage */}
                <div className="admin-section archivage">
                    <h2>Archivage de fin d'annee</h2>
                    <p>Cette action archive toutes les offres et les entreprises inactives.</p>
                    <button
                        className="btn-danger"
                        onClick={handleArchivage}
                        disabled={loading}
                    >
                        {loading ? 'Archivage en cours...' : 'Lancer l\'archivage'}
                    </button>
                </div>

                {/* Section Suppression Étudiants */}
                <div className="admin-section archivage">
                    <h2>Suppression des etudiants</h2>
                    <p>Cette action supprime tous les comptes etudiants de l'application.</p>
                    <button
                        className="btn-danger"
                        onClick={async () => {
                            if (!confirm('ATTENTION: Cette action va supprimer TOUS les etudiants. Continuer ?')) return;
                            setLoading(true);
                            setMessage('');
                            try {
                                await axios.post('http://localhost:3000/api/admin/supprimer-etudiants', {}, {
                                    headers: { 'X-User-Role': user.role, 'X-User-Id': user.id.toString() }
                                });
                                setMessage('Tous les etudiants ont ete supprimes !');
                            } catch (err) {
                                setMessage('Erreur: ' + (err.response?.data?.error || err.message));
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Suppression...' : 'Supprimer tous les etudiants'}
                    </button>
                </div>
            </div>
        </Layout>
    );
}

export default Admin;
