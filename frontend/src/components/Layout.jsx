import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/api';
import './Layout.css';

function Layout({ children, title }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotifications();
            // Rafraichir toutes les 30 secondes
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const [notifRes, countRes] = await Promise.all([
                getMyNotifications(),
                getUnreadCount()
            ]);
            setNotifications(notifRes.data);
            setUnreadCount(countRes.data.count);
        } catch (err) {
            console.error('Erreur notifications:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const menuItems = {
        'ADMIN': [
            { label: 'Secretaires', path: '/admin' },
            { label: 'Enseignants', path: '/admin' }
        ],
        'SECRETAIRE': [
            { label: 'Etudiants', path: '/secretaire' },
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
            { label: 'Candidatures recues', path: '/entreprise' }
        ]
    };

    return (
        <div className="layout">
            <header>
                <h1>{title || 'Gestion des Stages IDMC'}</h1>
                <nav>
                    <div className="notification-container">
                        <button
                            className="notification-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            Notifications
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <h4>Notifications</h4>
                                    {unreadCount > 0 && (
                                        <button onClick={handleMarkAllAsRead}>
                                            Tout marquer comme lu
                                        </button>
                                    )}
                                </div>
                                <div className="notification-list">
                                    {notifications.length === 0 ? (
                                        <p className="no-notifications">Aucune notification</p>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`notification-item ${!notif.lu ? 'unread' : ''}`}
                                                onClick={() => handleMarkAsRead(notif.id)}
                                            >
                                                <strong>{notif.objet}</strong>
                                                <p>{notif.message}</p>
                                                <span className="notification-date">
                                                    {new Date(notif.date_notification).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <span className="user-info">
                        {user?.prenom} {user?.nom} ({user?.role})
                    </span>
                    <button onClick={handleLogout}>Deconnexion</button>
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
