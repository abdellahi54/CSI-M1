const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Test de connexion
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erreur de connexion à PostgreSQL:', err.stack);
    } else {
        console.log('Connecté à PostgreSQL');
        release();
    }
});

// Mapping rôle utilisateur -> rôle PostgreSQL
const ROLE_MAPPING = {
    'ETUDIANT': 'role_etudiant',
    'ENTREPRISE': 'role_entreprise',
    'SECRETAIRE': 'role_secretaire',
    'ENSEIGNANT RESPONSABLE': 'role_enseignant',
    'ADMIN': 'role_admin'
};

// Fonction pour obtenir une connexion avec le bon rôle PostgreSQL
async function getClientWithRole(userRole) {
    const client = await pool.connect();
    const pgRole = ROLE_MAPPING[userRole];

    if (pgRole) {
        await client.query(`SET ROLE ${pgRole}`);
        console.log(`Rôle PostgreSQL activé: ${pgRole}`);
    }

    return client;
}

// Fonction pour réinitialiser le rôle
async function resetRole(client) {
    await client.query('RESET ROLE');
    client.release();
}

module.exports = { pool, getClientWithRole, resetRole, ROLE_MAPPING };
