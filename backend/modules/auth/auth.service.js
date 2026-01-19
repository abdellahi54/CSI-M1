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
    verifyPassword
};
