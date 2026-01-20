const express = require('express');
const router = express.Router();
const { pool, getClientWithRole, resetRole } = require('../config/db');
const bcrypt = require('bcrypt');
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Liste tous les étudiants (avec rôle SGBD)
router.get('/', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.*, u.email, u.date_creation
            FROM etudiant e
            JOIN utilisateur u ON e.id = u.id
            ORDER BY e.nom, e.prenom
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Mes informations (etudiant connecte) - DOIT ETRE AVANT /:id
router.get('/me', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.*, u.email
            FROM etudiant e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.id = $1
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

// PUT - Modifier ses propres informations (etudiant connecte) - DOIT ETRE AVANT /:id
router.put('/me', authMiddleware, withRole, async (req, res) => {
    try {
        const { statut, visibilite } = req.body;

        await req.dbClient.query(`
            UPDATE etudiant 
            SET statut = COALESCE($1, statut),
                visibilite = COALESCE($2, visibilite)
            WHERE id = $3
        `, [statut, visibilite, req.userId]);

        res.json({ message: 'Profil mis a jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Récupérer un étudiant par ID
router.get('/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.dbClient.query(`
            SELECT e.*, u.email, u.date_creation
            FROM etudiant e
            JOIN utilisateur u ON e.id = u.id
            WHERE e.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Créer un étudiant (par la secrétaire - utilise role_secretaire)
router.post('/', authMiddleware, withRole, async (req, res) => {
    try {
        const {
            email,
            mot_de_passe,
            num_etudiant,
            nom,
            prenom,
            date_naissance,
            formation,
            annee_formation
        } = req.body;

        await req.dbClient.query('BEGIN');

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const userResult = await req.dbClient.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ($1, $2, 'ETUDIANT')
            RETURNING id
        `, [email, hashedPassword]);

        const userId = userResult.rows[0].id;

        // Créer l'étudiant
        await req.dbClient.query(`
            INSERT INTO etudiant (
                id, createur_compte_id, num_etudiant, nom, prenom, 
                date_naissance, formation, annee_formation, 
                statut, visibilite, responsabilite_civile
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EN_RECHERCHE', false, false)
        `, [userId, req.userId, num_etudiant, nom, prenom, date_naissance, formation, annee_formation]);

        await req.dbClient.query('COMMIT');

        res.status(201).json({
            message: 'Étudiant créé avec succès',
            id: userId
        });
    } catch (err) {
        await req.dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
    }
});

// PUT - Modifier un étudiant
router.put('/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, formation, annee_formation, statut, visibilite } = req.body;

        await req.dbClient.query(`
            UPDATE etudiant 
            SET nom = COALESCE($1, nom),
                prenom = COALESCE($2, prenom),
                formation = COALESCE($3, formation),
                annee_formation = COALESCE($4, annee_formation),
                statut = COALESCE($5, statut),
                visibilite = COALESCE($6, visibilite)
            WHERE id = $7
        `, [nom, prenom, formation, annee_formation, statut, visibilite, id]);

        res.json({ message: 'Étudiant mis à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Valider l'attestation RC d'un étudiant
router.put('/:id/valider-rc', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;

        await req.dbClient.query(`
            UPDATE etudiant 
            SET responsabilite_civile = true,
                validateur_rc_id = $1
            WHERE id = $2
        `, [req.userId, id]);

        res.json({ message: 'Attestation RC validée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// DELETE - Supprimer un étudiant
router.delete('/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM utilisateur WHERE id = $1', [id]);
        res.json({ message: 'Étudiant supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
