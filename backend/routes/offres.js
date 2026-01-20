const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Liste des offres validées (accessibles aux étudiants)
router.get('/', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT o.*, e.raison_sociale as entreprise_nom
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            WHERE o.etat = 'VALDEE'
            ORDER BY o.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Offres en attente de validation (pour enseignant)
router.get('/pending/all', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT o.*, e.raison_sociale as entreprise_nom
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            WHERE o.etat = 'EN ATTENTE DE VALIDATION'
            ORDER BY o.date_creation DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Détails d'une offre (DOIT être après les routes spécifiques)
router.get('/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.dbClient.query(`
            SELECT o.*, e.raison_sociale as entreprise_nom, e.adresse as entreprise_adresse
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            WHERE o.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Offre non trouvée' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Créer une offre (par entreprise)
router.post('/', authMiddleware, withRole, async (req, res) => {
    try {
        // Vérification du rôle
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé. Seules les entreprises peuvent créer des offres.' });
        }

        const {
            type,
            description,
            remuneration,
            pays,
            ville,
            duree,
            date_debut,
            date_expiration
        } = req.body;

        // Validation basique des champs obligatoires
        if (!type || !description || !remuneration || !pays || !duree || !date_debut || !date_expiration) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }

        const result = await req.dbClient.query(`
            INSERT INTO offre (
                entreprise_id, 
                type, 
                description, 
                remuneration, 
                pays, 
                ville,
                duree, 
                date_debut, 
                date_expiration,
                statut, 
                etat
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', 'EN ATTENTE DE VALIDATION')
            RETURNING id
        `, [
            req.userId,
            type,
            description,
            remuneration,
            pays,
            ville,
            duree,
            date_debut,
            date_expiration
        ]);

        res.status(201).json({
            message: 'Offre créée et en attente de validation',
            id: result.rows[0].id
        });

    } catch (err) {
        console.error('Erreur création offre:', err);
        res.status(500).json({ error: 'Erreur lors de la création de l\'offre', details: err.message });
    }
});

// PUT - Valider/Refuser une offre (par enseignant)
router.put('/:id/validate', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { etat, motif_refus } = req.body; // etat = 'VALDEE' ou 'NON VALDEE'

        await req.dbClient.query(`
            UPDATE offre 
            SET etat = $1, 
                enseignant_validateur_id = $2,
                motif_refus = $3,
                date_validation = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [etat, req.userId, motif_refus, id]);

        res.json({ message: `Offre ${etat === 'VALDEE' ? 'validée' : 'refusée'}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur validation offre' });
    }
});

// GET - Offres d'une entreprise
router.get('/entreprise/mine', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT * FROM offre 
            WHERE entreprise_id = $1
            ORDER BY id DESC
        `, [req.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PATCH - Modifier le statut d'une offre (par entreprise uniquement)
router.patch('/:id/statut', authMiddleware, withRole, async (req, res) => {
    try {
        // Vérification du rôle
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé. Seules les entreprises peuvent modifier leurs offres.' });
        }

        const { id } = req.params;
        const { statut } = req.body;

        // Validation du statut (Enum: ACTIVE, NON ACTIVE)
        if (!['ACTIVE', 'NON ACTIVE'].includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide. Doit être ACTIVE ou NON ACTIVE.' });
        }

        // Vérifier que l'offre appartient bien à l'entreprise
        const checkOwner = await req.dbClient.query(
            'SELECT id FROM offre WHERE id = $1 AND entreprise_id = $2',
            [id, req.userId]
        );

        if (checkOwner.rows.length === 0) {
            return res.status(404).json({ error: 'Offre non trouvée ou accès non autorisé' });
        }

        // Mise à jour du statut UNIQUEMENT (ne touche pas à l'état de validation)
        await req.dbClient.query(
            'UPDATE offre SET statut = $1 WHERE id = $2',
            [statut, id]
        );

        res.json({ message: `Statut de l'offre mis à jour vers ${statut}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du statut', details: err.message });
    }
});

module.exports = router;
