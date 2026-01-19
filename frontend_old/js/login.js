// Configuration API
const API_URL = 'http://localhost:3000/api';

// Form login
const formLogin = document.getElementById('form-login');
const errorMessage = document.getElementById('error-message');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const data = {
        email: document.getElementById('email').value,
        mot_de_passe: document.getElementById('mot_de_passe').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Stocker les infos utilisateur
            localStorage.setItem('user', JSON.stringify(result.user));

            // Rediriger selon le rôle
            switch (result.user.role) {
                case 'SECRETAIRE':
                    window.location.href = 'secretaire.html';
                    break;
                case 'ENSEIGNANT RESPONSABLE':
                    window.location.href = 'enseignant.html';
                    break;
                case 'ETUDIANT':
                    window.location.href = 'etudiant.html';
                    break;
                case 'ENTREPRISE':
                    window.location.href = 'entreprise.html';
                    break;
                case 'ADMIN':
                    window.location.href = 'admin.html';
                    break;
                default:
                    window.location.href = 'index.html';
            }
        } else {
            errorMessage.textContent = result.error;
        }
    } catch (err) {
        console.error('Erreur:', err);
        errorMessage.textContent = 'Erreur de connexion au serveur';
    }
});

// Vérifier si déjà connecté
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        // Rediriger si déjà connecté
        switch (userData.role) {
            case 'SECRETAIRE':
                window.location.href = 'secretaire.html';
                break;
            case 'ENSEIGNANT RESPONSABLE':
                window.location.href = 'enseignant.html';
                break;
            case 'ETUDIANT':
                window.location.href = 'etudiant.html';
                break;
            case 'ENTREPRISE':
                window.location.href = 'entreprise.html';
                break;
        }
    }
});
