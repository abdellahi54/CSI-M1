const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('PostgreSQL Connecté avec succès');
    } catch (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
        process.exit(1); // Arrêt du processus en cas d'échec critique
    }
};

module.exports = { pool, connectDB };
