// Configuration API
const API_URL = 'http://localhost:3000';

// Test de connexion à l'API
async function testAPI() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log('API Status:', data);
    } catch (error) {
        console.log('API non disponible');
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    testAPI();
});
