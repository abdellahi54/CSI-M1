import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);

            // Redirection selon le rôle
            switch (user.role) {
                case 'ADMIN':
                    navigate('/admin');
                    break;
                case 'SECRETAIRE':
                    navigate('/secretaire');
                    break;
                case 'ENSEIGNANT RESPONSABLE':
                    navigate('/enseignant');
                    break;
                case 'ETUDIANT':
                    navigate('/etudiant');
                    break;
                case 'ENTREPRISE':
                    navigate('/entreprise');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>🎓 Gestion des Stages IDMC</h1>
                <h2>Connexion</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="votre@email.fr"
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>

                    {error && <div className="error-message">{error}</div>}
                </form>

                <div className="login-footer">
                    <p>Vous êtes une entreprise ?</p>
                    <a href="/inscription">Créer un compte</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
