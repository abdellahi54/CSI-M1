const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Mon profil secretaire
router.get('/profil', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT s.*, u.email
            FROM secretaire s
            JOIN utilisateur u ON s.id = u.id
            WHERE s.id = $1
        `, [req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil non trouve' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Modifier mon profil secretaire
router.put('/profil', authMiddleware, withRole, async (req, res) => {
    try {
        const { nom, prenom, en_conge } = req.body;

        await req.dbClient.query(`
            UPDATE secretaire 
            SET nom = COALESCE($1, nom),
                prenom = COALESCE($2, prenom),
                en_conge = COALESCE($3, en_conge)
            WHERE id = $4
        `, [nom, prenom, en_conge, req.userId]);

        res.json({ message: 'Profil mis a jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
