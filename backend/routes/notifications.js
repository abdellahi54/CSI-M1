const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Mes notifications
router.get('/mine', authMiddleware, withRole, async (req, res) => {
    try {
        console.log('Notifications - userId:', req.userId, 'role:', req.userRole);
        const result = await req.dbClient.query(
            `SELECT identifiant as id, objet, message, date_notification
             FROM notification
             WHERE identifiantutilisateur = $1
             ORDER BY date_notification DESC
             LIMIT 50`,
            [req.userId]
        );
        console.log('Notifications trouvees:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Nombre de notifications (toutes car pas de colonne lu)
router.get('/unread-count', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(
            `SELECT COUNT(*) as count
             FROM notification
             WHERE identifiantutilisateur = $1`,
            [req.userId]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Marquer comme lu (ne fait rien car pas de colonne lu)
router.put('/:id/read', authMiddleware, withRole, async (req, res) => {
    res.json({ message: 'OK' });
});

// PUT - Marquer toutes comme lues (ne fait rien car pas de colonne lu)
router.put('/read-all', authMiddleware, withRole, async (req, res) => {
    res.json({ message: 'OK' });
});

// DELETE - Supprimer une notification
router.delete('/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query(
            'DELETE FROM notification WHERE identifiant = $1 AND identifiantutilisateur = $2',
            [id, req.userId]
        );
        res.json({ message: 'Notification supprimee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// Fonction utilitaire pour creer une notification
const createNotification = async (client, userId, objet, message) => {
    try {
        await client.query(
            `INSERT INTO notification (identifiantutilisateur, objet, message)
             VALUES ($1, $2, $3)`,
            [userId, objet, message]
        );
    } catch (err) {
        console.error('Erreur creation notification:', err);
    }
};

module.exports = { router, createNotification };
