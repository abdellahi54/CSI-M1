const express = require('express');
const router = express.Router();
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Profil de l'entreprise connectée
router.get('/profile', authMiddleware, withRole, async (req, res) => {
    try {
        // Vérification du rôle
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé. Réservé aux entreprises.' });
        }

        const result = await req.dbClient.query(`
            SELECT e.*, u.email
            FROM entreprise e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.id = $1
        `, [req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil entreprise non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur récupération profil:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Modifier le profil de l'entreprise
router.put('/profile', authMiddleware, withRole, async (req, res) => {
    try {
        // Vérification du rôle
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé. Réservé aux entreprises.' });
        }

        const { raison_sociale, adresse, forme_juridique } = req.body;

        // Validation des champs obligatoires
        if (!raison_sociale || !adresse || !forme_juridique) {
            return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
        }

        // Mise à jour du profil
        await req.dbClient.query(`
            UPDATE entreprise
            SET raison_sociale = $1,
                adresse = $2,
                forme_juridique = $3
            WHERE id = $4
        `, [raison_sociale, adresse, forme_juridique, req.userId]);

        res.json({ message: 'Profil mis à jour avec succès' });
    } catch (err) {
        console.error('Erreur mise à jour profil:', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour', details: err.message });
    }
});

// GET - Liste des étudiants disponibles (EN_RECHERCHE)
router.get('/etudiants', authMiddleware, withRole, async (req, res) => {
    try {
        // Vérification du rôle
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé. Réservé aux entreprises.' });
        }

        const result = await req.dbClient.query(`
            SELECT e.id, e.nom, e.prenom, e.formation, e.annee_formation, 
                   e.num_etudiant, u.email
            FROM etudiant e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.statut = 'EN_RECHERCHE'
            ORDER BY e.nom, e.prenom
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur récupération étudiants:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Détails d'un étudiant
router.get('/etudiants/:id', authMiddleware, withRole, async (req, res) => {
    try {
        // Vérification du rôle
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé. Réservé aux entreprises.' });
        }

        const { id } = req.params;

        const result = await req.dbClient.query(`
            SELECT e.id, e.nom, e.prenom, e.formation, e.annee_formation,
                   e.num_etudiant, e.date_naissance, e.responsabilite_civile,
                   u.email
            FROM etudiant e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.id = $1 AND e.statut = 'EN_RECHERCHE'
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé ou non disponible' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur récupération détails étudiant:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
