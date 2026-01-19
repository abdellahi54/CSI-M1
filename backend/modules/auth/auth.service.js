const { pool } = require('../../shared/utils/db');
const bcrypt = require('bcrypt');

/**
 * Trouve un utilisateur par son email.
 * @param {string} email 
 * @returns {Promise<Object|null>} Utilisateur ou null
 */
const findUserByEmail = async (email) => {
    const query = 'SELECT * FROM utilisateur WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
};

/**
 * Vérifie si le mot de passe est correct.
 * @param {string} plainPassword - Mot de passe en clair
 * @param {string} hashedPassword - Hash stocké en BDD
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
    findUserByEmail,
    verifyPassword,
    createUser: async (client, email, hashedPassword, role) => {
        const query = 'INSERT INTO utilisateur (email, mot_de_passe, role) VALUES ($1, $2, $3) RETURNING *';
        const result = await client.query(query, [email, hashedPassword, role]);
        return result.rows[0];
    },
    createEntreprise: async (client, userId, data) => {
        const query = `
            INSERT INTO entreprise (id, siret, raison_sociale, adresse, forme_juridique)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [userId, data.siret, data.raison_sociale, data.adresse, data.forme_juridique];
        const result = await client.query(query, values);
        return result.rows[0];
    }
};
