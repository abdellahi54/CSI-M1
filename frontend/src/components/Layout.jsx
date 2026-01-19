import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout({ children, title }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = {
        'ADMIN': [
            { label: 'Secrétaires', path: '/admin' },
            { label: 'Enseignants', path: '/admin' }
        ],
        'SECRETAIRE': [
            { label: 'Étudiants', path: '/secretaire' },
            { label: 'Attestations RC', path: '/secretaire' }
        ],
        'ENSEIGNANT RESPONSABLE': [
            { label: 'Offres', path: '/enseignant' },
            { label: 'Candidatures', path: '/enseignant' }
        ],
        'ETUDIANT': [
            { label: 'Offres', path: '/etudiant' },
            { label: 'Mes candidatures', path: '/etudiant' }
        ],
        'ENTREPRISE': [
            { label: 'Mes offres', path: '/entreprise' },
            { label: 'Candidatures reçues', path: '/entreprise' }
        ]
    };

    return (
        <div className="layout">
            <header>
                <h1>{title || 'Gestion des Stages IDMC'}</h1>
                <nav>
                    <span className="user-info">
                        {user?.prenom} {user?.nom} ({user?.role})
                    </span>
                    <button onClick={handleLogout}>Déconnexion</button>
                </nav>
            </header>

            <div className="main-container">
                <aside className="sidebar">
                    <h3>Menu</h3>
                    <ul>
                        {menuItems[user?.role]?.map((item, index) => (
                            <li key={index}>
                                <a href={item.path}>{item.label}</a>
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
