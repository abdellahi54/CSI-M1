const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// GET - Créer un compte admin initial (à utiliser une seule fois)
router.get('/create-admin', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Hash du mot de passe "admin123"
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Vérifier si un admin existe déjà
        const existing = await client.query(
            "SELECT id FROM utilisateur WHERE role = 'ADMIN'"
        );

        if (existing.rows.length > 0) {
            return res.json({
                message: 'Un administrateur existe déjà',
                email: 'Connectez-vous avec le compte admin existant'
            });
        }

        // Créer l'admin
        const adminResult = await client.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ('admin@idmc.fr', $1, 'ADMIN')
            RETURNING id
        `, [hashedPassword]);

        const adminId = adminResult.rows[0].id;

        // Créer l'entrée dans la table admin
        await client.query(`
            INSERT INTO admin (id)
            VALUES ($1)
        `, [adminId]);

        await client.query('COMMIT');

        res.json({
            message: 'Administrateur créé !',
            email: 'admin@idmc.fr',
            password: 'admin123',
            info: 'Changez ce mot de passe après la première connexion !'
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur création admin:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
