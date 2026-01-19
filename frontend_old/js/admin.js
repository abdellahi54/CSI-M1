// Configuration API
const API_URL = 'http://localhost:3000/api';

// Vérifier la connexion admin
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'ADMIN') {
    window.location.href = 'login.html';
}

// Headers d'authentification
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-User-Role': user.role,
        'X-User-Id': user.id.toString()
    };
}

// Navigation
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.dataset.section;

        document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('section-' + section).classList.add('active');
    });
});

// Modals
const modalSecretaire = document.getElementById('modal-secretaire');
const modalEnseignant = document.getElementById('modal-enseignant');

document.getElementById('btn-add-secretaire').addEventListener('click', () => {
    modalSecretaire.style.display = 'block';
});

document.getElementById('btn-add-enseignant').addEventListener('click', () => {
    modalEnseignant.style.display = 'block';
});

function closeModalSecretaire() {
    modalSecretaire.style.display = 'none';
    document.getElementById('form-secretaire').reset();
}

function closeModalEnseignant() {
    modalEnseignant.style.display = 'none';
    document.getElementById('form-enseignant').reset();
}

window.addEventListener('click', (e) => {
    if (e.target === modalSecretaire) closeModalSecretaire();
    if (e.target === modalEnseignant) closeModalEnseignant();
});

// Charger les secrétaires
async function loadSecretaires() {
    try {
        const response = await fetch(`${API_URL}/admin/secretaires`, {
            headers: getAuthHeaders()
        });
        const secretaires = await response.json();

        const tbody = document.querySelector('#table-secretaires tbody');
        tbody.innerHTML = '';

        secretaires.forEach(sec => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sec.nom}</td>
                <td>${sec.prenom}</td>
                <td>${sec.email}</td>
                <td>${sec.en_conge ? '🏖️ Oui' : '✅ Non'}</td>
                <td>
                    <button class="btn-delete" onclick="deleteSecretaire(${sec.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Erreur:', err);
    }
}

// Charger les enseignants
async function loadEnseignants() {
    try {
        const response = await fetch(`${API_URL}/admin/enseignants`, {
            headers: getAuthHeaders()
        });
        const enseignants = await response.json();

        const tbody = document.querySelector('#table-enseignants tbody');
        tbody.innerHTML = '';

        enseignants.forEach(ens => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ens.nom}</td>
                <td>${ens.prenom}</td>
                <td>${ens.email}</td>
                <td>${ens.droits_secretaire ? '✅ Oui' : '❌ Non'}</td>
                <td>
                    <button class="btn-delete" onclick="deleteEnseignant(${ens.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Erreur:', err);
    }
}

// Créer une secrétaire
document.getElementById('form-secretaire').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        nom: document.getElementById('sec-nom').value,
        prenom: document.getElementById('sec-prenom').value,
        email: document.getElementById('sec-email').value,
        mot_de_passe: document.getElementById('sec-password').value
    };

    try {
        const response = await fetch(`${API_URL}/admin/secretaires`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Secrétaire créée !\nEmail: ${result.email}\nMot de passe: ${data.mot_de_passe}`);
            closeModalSecretaire();
            loadSecretaires();
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la création');
    }
});

// Créer un enseignant
document.getElementById('form-enseignant').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        nom: document.getElementById('ens-nom').value,
        prenom: document.getElementById('ens-prenom').value,
        email: document.getElementById('ens-email').value,
        mot_de_passe: document.getElementById('ens-password').value,
        droits_secretaire: document.getElementById('ens-droits').checked
    };

    try {
        const response = await fetch(`${API_URL}/admin/enseignants`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Enseignant créé !\nEmail: ${result.email}\nMot de passe: ${data.mot_de_passe}`);
            closeModalEnseignant();
            loadEnseignants();
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la création');
    }
});

// Supprimer
async function deleteSecretaire(id) {
    if (!confirm('Supprimer cette secrétaire ?')) return;

    try {
        await fetch(`${API_URL}/admin/secretaires/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        loadSecretaires();
    } catch (err) {
        console.error('Erreur:', err);
    }
}

async function deleteEnseignant(id) {
    if (!confirm('Supprimer cet enseignant ?')) return;

    try {
        await fetch(`${API_URL}/admin/enseignants/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        loadEnseignants();
    } catch (err) {
        console.error('Erreur:', err);
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadSecretaires();
    loadEnseignants();
});
