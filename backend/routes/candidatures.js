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
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
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

// POST - Postuler à une offre (triggers SGBD gèrent les règles métier)
router.post('/', authMiddleware, withRole, async (req, res) => {
    try {
        const { offre_id } = req.body;

        const result = await req.dbClient.query(`
            INSERT INTO candidature (etudiant_id, offre_id, statut)
            VALUES ($1, $2, 'SOUMISE')
            RETURNING id
        `, [req.userId, offre_id]);

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
            SET statut = 'RENONCEE'
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

// GET - Candidatures pour les offres de l'entreprise
router.get('/entreprise/mine', authMiddleware, withRole, async (req, res) => {
    try {
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé. Réservé aux entreprises.' });
        }

        const { offre_id } = req.query;

        let query = `
            SELECT c.*, 
                   et.nom as etudiant_nom, et.prenom as etudiant_prenom, 
                   et.formation, et.annee_formation, u.email as etudiant_email,
                   o.description as offre_description, o.type as offre_type
            FROM candidature c
            JOIN offre o ON c.offre_id = o.id
            JOIN etudiant et ON c.etudiant_id = et.id
            JOIN utilisateur u ON et.id = u.id
            WHERE o.entreprise_id = $1
        `;

        const params = [req.userId];

        if (offre_id) {
            query += ' AND c.offre_id = $2';
            params.push(offre_id);
        }

        query += ' ORDER BY c.date_candidature DESC';

        const result = await req.dbClient.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur récupération candidatures:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Accepter une candidature (Entreprise)
router.put('/:id/accept', authMiddleware, withRole, async (req, res) => {
    try {
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        const { id } = req.params;

        const check = await req.dbClient.query(`
            SELECT c.id FROM candidature c
            JOIN offre o ON c.offre_id = o.id
            WHERE c.id = $1 AND o.entreprise_id = $2 AND c.statut = 'SOUMISE'
        `, [id, req.userId]);

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Candidature non trouvée ou déjà traitée' });
        }

        await req.dbClient.query(`
            UPDATE candidature SET statut = 'ACCEPTEE ENTREPRISE' WHERE id = $1
        `, [id]);

        res.json({ message: 'Candidature acceptée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Rejeter une candidature (Entreprise)
router.put('/:id/reject', authMiddleware, withRole, async (req, res) => {
    try {
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        const { id } = req.params;

        const check = await req.dbClient.query(`
            SELECT c.id FROM candidature c
            JOIN offre o ON c.offre_id = o.id
            WHERE c.id = $1 AND o.entreprise_id = $2 AND c.statut = 'SOUMISE'
        `, [id, req.userId]);

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Candidature non trouvée ou déjà traitée' });
        }

        await req.dbClient.query(`
            UPDATE candidature SET statut = 'REJETEE ENTREPRISE' WHERE id = $1
        `, [id]);

        res.json({ message: 'Candidature rejetée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Détails étudiant pour une candidature (Entreprise)
router.get('/:id/student', authMiddleware, withRole, async (req, res) => {
    try {
        if (req.userRole !== 'ENTREPRISE') {
            return res.status(403).json({ error: 'Accès refusé.' });
        }

        const { id } = req.params;

        const result = await req.dbClient.query(`
            SELECT et.*, u.email
            FROM candidature c
            JOIN offre o ON c.offre_id = o.id
            JOIN etudiant et ON c.etudiant_id = et.id
            JOIN utilisateur u ON et.id = u.id
            WHERE c.id = $1 AND o.entreprise_id = $2
        `, [id, req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
