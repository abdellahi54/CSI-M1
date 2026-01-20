const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Candidatures d'un étudiant
router.get('/etudiant/mine', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT c.*, o.description as offre_description, o.type as offre_type,
                   e.raison_sociale as entreprise_nom
            FROM candidature c
            JOIN offre o ON c.offre_id = o.id
            JOIN entreprise e ON o.entreprise_id = e.id
            WHERE c.etudiant_id = $1
            ORDER BY c.date_candidature DESC
        `, [req.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Candidatures pour une offre (pour entreprise/enseignant)
router.get('/offre/:offreId', authMiddleware, withRole, async (req, res) => {
    try {
        const { offreId } = req.params;
        const result = await req.dbClient.query(`
            SELECT c.*, et.nom, et.prenom, et.num_etudiant, et.formation,
                   u.email
            FROM candidature c
            JOIN etudiant et ON c.etudiant_id = et.id
            JOIN utilisateur u ON et.id = u.id
            WHERE c.offre_id = $1
            ORDER BY c.date_candidature DESC
        `, [offreId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Candidatures en attente (pour enseignant)
router.get('/pending/all', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT c.*, et.nom, et.prenom, et.num_etudiant, et.formation,
                   o.description as offre_description, o.type as offre_type,
                   e.raison_sociale as entreprise_nom
            FROM candidature c
            JOIN etudiant et ON c.etudiant_id = et.id
            JOIN offre o ON c.offre_id = o.id
            JOIN entreprise e ON o.entreprise_id = e.id
            WHERE c.statut = 'ACCEPTEE ENTREPRISE'
            ORDER BY c.date_candidature DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Postuler à une offre
router.post('/', authMiddleware, withRole, async (req, res) => {
    try {
        const { offre_id, lettre_motivation } = req.body;

        // Vérifier si l'étudiant a déjà postulé
        const existing = await req.dbClient.query(
            'SELECT id FROM candidature WHERE etudiant_id = $1 AND offre_id = $2',
            [req.userId, offre_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Vous avez déjà postulé à cette offre' });
        }

        const result = await req.dbClient.query(`
            INSERT INTO candidature (etudiant_id, offre_id, statut, lettre_motivation)
            VALUES ($1, $2, 'SOUMISE', $3)
            RETURNING id
        `, [req.userId, offre_id, lettre_motivation]);

        res.status(201).json({
            message: 'Candidature soumise avec succès',
            id: result.rows[0].id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur candidature', details: err.message });
    }
});

// PUT - Annuler une candidature (par étudiant)
router.put('/:id/cancel', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;

        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = 'Annulee'
            WHERE id = $1 AND etudiant_id = $2 AND statut = 'SOUMISE'
        `, [id, req.userId]);

        res.json({ message: 'Candidature annulée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur annulation' });
    }
});

// PUT - Accepter/Refuser candidature (par entreprise)
router.put('/:id/entreprise-decision', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { decision } = req.body; // 'ACCEPTEE ENTREPRISE' ou 'REJETEE ENTREPRISE'

        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = $1,
                date_reponse_entreprise = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [decision, id]);

        res.json({ message: `Candidature ${decision === 'ACCEPTEE ENTREPRISE' ? 'acceptée' : 'rejetée'}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur décision' });
    }
});

// PUT - Valider/Refuser candidature (par enseignant)
router.put('/:id/validate', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, motif } = req.body; // 'VALIDEE' ou 'REFUSEE RESPONSABLE'

        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = $1,
                enseignant_validateur_id = $2,
                motif_refus = $3,
                date_validation = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [decision, req.userId, motif, id]);

        res.json({ message: `Candidature ${decision === 'VALIDEE' ? 'validée' : 'refusée'}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur validation' });
    }
});

module.exports = router;
