const express = require('express');
const router = express.Router();
const { pool, getClientWithRole, resetRole } = require('../config/db');
const bcrypt = require('bcrypt');
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Liste des secrétaires
router.get('/secretaires', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT s.*, u.email, u.date_creation
            FROM secretaire s
            JOIN utilisateur u ON s.id = u.id
            ORDER BY s.nom, s.prenom
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Liste des enseignants responsables
router.get('/enseignants', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.*, u.email, u.date_creation
            FROM enseignant_responsable e
            JOIN utilisateur u ON e.id = u.id
            ORDER BY e.nom, e.prenom
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Créer une secrétaire
router.post('/secretaires', authMiddleware, withRole, async (req, res) => {
    try {
        const { email, mot_de_passe, nom, prenom } = req.body;

        await req.dbClient.query('BEGIN');

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const userResult = await req.dbClient.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ($1, $2, 'SECRETAIRE')
            RETURNING id
        `, [email, hashedPassword]);

        const userId = userResult.rows[0].id;

        // Créer la secrétaire
        await req.dbClient.query(`
            INSERT INTO secretaire (id, nom, prenom, en_conge)
            VALUES ($1, $2, $3, false)
        `, [userId, nom, prenom]);

        await req.dbClient.query('COMMIT');

        res.status(201).json({
            message: 'Secrétaire créée avec succès',
            id: userId,
            email: email
        });
    } catch (err) {
        await req.dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
    }
});

// POST - Créer un enseignant responsable
router.post('/enseignants', authMiddleware, withRole, async (req, res) => {
    try {
        const { email, mot_de_passe, nom, prenom, droits_secretaire } = req.body;

        await req.dbClient.query('BEGIN');

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const userResult = await req.dbClient.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ($1, $2, 'ENSEIGNANT RESPONSABLE')
            RETURNING id
        `, [email, hashedPassword]);

        const userId = userResult.rows[0].id;

        // Créer l'enseignant
        await req.dbClient.query(`
            INSERT INTO enseignant_responsable (id, nom, prenom, droits_secretaire)
            VALUES ($1, $2, $3, $4)
        `, [userId, nom, prenom, droits_secretaire !== false]);

        await req.dbClient.query('COMMIT');

        res.status(201).json({
            message: 'Enseignant responsable créé avec succès',
            id: userId,
            email: email
        });
    } catch (err) {
        await req.dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
    }
});

// DELETE - Supprimer une secrétaire
router.delete('/secretaires/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM utilisateur WHERE id = $1', [id]);
        res.json({ message: 'Secrétaire supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer un enseignant
router.delete('/enseignants/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM utilisateur WHERE id = $1', [id]);
        res.json({ message: 'Enseignant supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
