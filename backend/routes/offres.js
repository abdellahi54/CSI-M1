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
            WHERE o.etat = 'Validee'
            ORDER BY o.date_creation DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Détails d'une offre
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
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Offres en attente de validation (pour enseignant)
router.get('/pending/all', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT o.*, e.raison_sociale as entreprise_nom
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            WHERE o.etat = 'EnAttenteValidation'
            ORDER BY o.date_creation DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Créer une offre (par entreprise)
router.post('/', authMiddleware, withRole, async (req, res) => {
    try {
        const {
            type, description, remuneration, pays, duree,
            date_debut, niveau_vise, competences
        } = req.body;

        const result = await req.dbClient.query(`
            INSERT INTO offre (
                entreprise_id, type, description, remuneration, pays, 
                duree, date_debut, niveau_vise, competences, etat
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'EnAttenteValidation')
            RETURNING id
        `, [req.userId, type, description, remuneration, pays, duree, date_debut, niveau_vise, competences]);

        res.status(201).json({
            message: 'Offre créée et en attente de validation',
            id: result.rows[0].id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur création offre', details: err.message });
    }
});

// PUT - Valider/Refuser une offre (par enseignant)
router.put('/:id/validate', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { etat, motif_refus } = req.body; // etat = 'Validee' ou 'NonValidee'

        await req.dbClient.query(`
            UPDATE offre 
            SET etat = $1, 
                enseignant_validateur_id = $2,
                motif_refus = $3,
                date_validation = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [etat, req.userId, motif_refus, id]);

        res.json({ message: `Offre ${etat === 'Validee' ? 'validée' : 'refusée'}` });
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
            ORDER BY date_creation DESC
        `, [req.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
