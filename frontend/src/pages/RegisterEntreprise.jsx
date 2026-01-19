import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Reusing Login CSS for consistency

function RegisterEntreprise() {
    const [formData, setFormData] = useState({
        email: '',
        mot_de_passe: '',
        raison_sociale: '',
        siret: '',
        adresse: '',
        forme_juridique: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post('http://localhost:3000/api/auth/register/entreprise', formData);
            // Redirect to login on success
            navigate('/?registered=true');
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box" style={{ maxWidth: '500px' }}>
                <h1>🏢 Inscription Entreprise</h1>
                <h2>Créez votre compte partenaire</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Raison Sociale</label>
                        <input
                            type="text"
                            name="raison_sociale"
                            value={formData.raison_sociale}
                            onChange={handleChange}
                            required
                            placeholder="Nom de l'entreprise"
                        />
                    </div>

                    <div className="form-group">
                        <label>SIRET</label>
                        <input
                            type="text"
                            name="siret"
                            value={formData.siret}
                            onChange={handleChange}
                            required
                            placeholder="Numéro SIRET"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="contact@entreprise.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            name="mot_de_passe"
                            value={formData.mot_de_passe}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label>Adresse</label>
                        <input
                            type="text"
                            name="adresse"
                            value={formData.adresse}
                            onChange={handleChange}
                            required
                            placeholder="Adresse complète"
                        />
                    </div>

                    <div className="form-group">
                        <label>Forme Juridique</label>
                        <input
                            type="text"
                            name="forme_juridique"
                            value={formData.forme_juridique}
                            onChange={handleChange}
                            required
                            placeholder="SARL, SAS, EURL..."
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Inscription...' : "S'inscrire"}
                    </button>

                    {error && <div className="error-message">{error}</div>}
                </form>

                <div className="login-footer">
                    <p>Déjà un compte ?</p>
                    <Link to="/">Se connecter</Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterEntreprise;
