// Configuration API
const API_URL = 'http://localhost:3000/api';

// Vérifier la connexion
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'SECRETAIRE') {
    window.location.href = 'login.html';
}

// ID de la secrétaire connectée
const SECRETAIRE_ID = user.id;

// Headers d'authentification avec rôle PostgreSQL
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-User-Role': user.role,
        'X-User-Id': user.id.toString()
    };
}

// DOM Elements
const tableEtudiants = document.getElementById('table-etudiants').querySelector('tbody');
const tableAttestations = document.getElementById('table-attestations').querySelector('tbody');
const modal = document.getElementById('modal-etudiant');
const formEtudiant = document.getElementById('form-etudiant');
const btnAddEtudiant = document.getElementById('btn-add-etudiant');
const closeModal = document.querySelector('.close');

// Navigation
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.dataset.section;

        // Update active states
        document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('section-' + section).classList.add('active');
    });
});

// Modal
btnAddEtudiant.addEventListener('click', () => {
    modal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    formEtudiant.reset();
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        formEtudiant.reset();
    }
});

// Charger les étudiants
async function loadEtudiants() {
    try {
        const response = await fetch(`${API_URL}/etudiants`, {
            headers: getAuthHeaders()
        });
        const etudiants = await response.json();

        tableEtudiants.innerHTML = '';
        tableAttestations.innerHTML = '';

        etudiants.forEach(etudiant => {
            // Table principale
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${etudiant.nom}</td>
                <td>${etudiant.prenom}</td>
                <td>${etudiant.num_etudiant}</td>
                <td>${etudiant.formation}</td>
                <td>${etudiant.annee_formation}</td>
                <td class="${etudiant.responsabilite_civile ? 'status-valid' : 'status-pending'}">
                    ${etudiant.responsabilite_civile ? '✅ Validée' : '⏳ En attente'}
                </td>
                <td>
                    <button class="btn-edit" onclick="editEtudiant(${etudiant.id})">✏️</button>
                    <button class="btn-delete" onclick="deleteEtudiant(${etudiant.id})">🗑️</button>
                </td>
            `;
            tableEtudiants.appendChild(row);

            // Table attestations (seulement les non validées)
            if (!etudiant.responsabilite_civile) {
                const rowAttest = document.createElement('tr');
                rowAttest.innerHTML = `
                    <td>${etudiant.nom}</td>
                    <td>${etudiant.prenom}</td>
                    <td>Attestation RC</td>
                    <td class="status-pending">⏳ En attente</td>
                    <td>
                        <button class="btn-validate" onclick="validerRC(${etudiant.id})">✅ Valider</button>
                    </td>
                `;
                tableAttestations.appendChild(rowAttest);
            }
        });

    } catch (err) {
        console.error('Erreur chargement étudiants:', err);
        alert('Erreur lors du chargement des étudiants');
    }
}

// Créer un étudiant
formEtudiant.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        email: document.getElementById('email').value,
        mot_de_passe: document.getElementById('mot_de_passe').value,
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        num_etudiant: document.getElementById('num_etudiant').value,
        date_naissance: document.getElementById('date_naissance').value,
        formation: document.getElementById('formation').value,
        annee_formation: parseInt(document.getElementById('annee_formation').value),
        createur_compte_id: SECRETAIRE_ID
    };

    try {
        const response = await fetch(`${API_URL}/etudiants`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Étudiant créé avec succès !');
            modal.style.display = 'none';
            formEtudiant.reset();
            loadEtudiants();
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (err) {
        console.error('Erreur création:', err);
        alert('Erreur lors de la création');
    }
});

// Valider RC
async function validerRC(id) {
    if (!confirm('Confirmer la validation de l\'attestation RC ?')) return;

    try {
        const response = await fetch(`${API_URL}/etudiants/${id}/valider-rc`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        });

        if (response.ok) {
            alert('Attestation RC validée !');
            loadEtudiants();
        } else {
            alert('Erreur lors de la validation');
        }
    } catch (err) {
        console.error('Erreur validation RC:', err);
    }
}

// Supprimer un étudiant
async function deleteEtudiant(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) return;

    try {
        const response = await fetch(`${API_URL}/etudiants/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Étudiant supprimé');
            loadEtudiants();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (err) {
        console.error('Erreur suppression:', err);
    }
}

// Edit étudiant (à implémenter)
function editEtudiant(id) {
    alert('Fonctionnalité d\'édition à implémenter');
}

// Déconnexion
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Afficher le nom de l'utilisateur
    document.getElementById('user-name').textContent = `${user.prenom} ${user.nom}`;

    // Charger les données
    loadEtudiants();
});
