const express = require('express');
const router = express.Router();
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Profil entreprise
router.get('/profile', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.*, u.email
            FROM entreprise e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.id = $1
        `, [req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil non trouvé' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Modifier profil entreprise
router.put('/profile', authMiddleware, withRole, async (req, res) => {
    try {
        const { raison_sociale, adresse, telephone, site_web } = req.body;

        await req.dbClient.query(`
            UPDATE entreprise
            SET raison_sociale = COALESCE($1, raison_sociale),
                adresse = COALESCE($2, adresse),
                telephone = COALESCE($3, telephone),
                site_web = COALESCE($4, site_web)
            WHERE id = $5
        `, [raison_sociale, adresse, telephone, site_web, req.userId]);

        res.json({ message: 'Profil mis à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Etudiants visibles pour les entreprises
router.get('/etudiants', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.id, e.nom, e.prenom, e.formation, e.annee_formation, e.statut, u.email
            FROM etudiant e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.visibilite = TRUE
            ORDER BY e.nom, e.prenom
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Détails d'un étudiant visible
router.get('/etudiants/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.dbClient.query(`
            SELECT e.id, e.nom, e.prenom, e.formation, e.annee_formation, e.statut, u.email
            FROM etudiant e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.id = $1 AND e.visibilite = TRUE
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé ou non visible' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
