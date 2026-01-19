const express = require('express');
const router = express.Router();
const { pool, getClientWithRole, resetRole } = require('../config/db');
const { authMiddleware, withRole } = require('../middleware/auth');

// ==========================================
// GESTION DES OFFRES
// ==========================================

// GET - Liste des offres en attente de validation
router.get('/offres', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT o.*, e.raison_sociale as entreprise_nom, e.siret
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            WHERE o.statut = 'EN_ATTENTE'
            ORDER BY o.date_depot DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Toutes les offres (toutes statuts)
router.get('/offres/toutes', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT o.*, e.raison_sociale as entreprise_nom, e.siret
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            ORDER BY o.date_depot DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Valider une offre
router.put('/offres/:id/valider', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;

        await req.dbClient.query(`
            UPDATE offre 
            SET statut = 'VALIDEE',
                validateur_id = $1,
                date_validation = NOW()
            WHERE id = $2
        `, [req.userId, id]);

        res.json({ message: 'Offre validée avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Refuser une offre
router.put('/offres/:id/refuser', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { motif } = req.body;

        await req.dbClient.query(`
            UPDATE offre 
            SET statut = 'REFUSEE',
                validateur_id = $1,
                date_validation = NOW(),
                motif_refus = $2
            WHERE id = $3
        `, [req.userId, motif, id]);

        // TODO: Envoyer une notification à l'entreprise

        res.json({ message: 'Offre refusée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// ==========================================
// GESTION DES CANDIDATURES
// ==========================================

// GET - Liste des candidatures acceptées par l'entreprise, en attente de validation finale
router.get('/candidatures', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT c.*, 
                   o.titre as offre_titre, o.type as offre_type,
                   o.date_debut, o.duree, o.remuneration,
                   ent.raison_sociale as entreprise_nom,
                   et.nom as etudiant_nom, et.prenom as etudiant_prenom,
                   et.num_etudiant, et.formation,
                   c.date_acceptation_entreprise
            FROM candidature c
            JOIN offre o ON c.offre_id = o.id
            JOIN entreprise ent ON o.entreprise_id = ent.id
            JOIN etudiant et ON c.etudiant_id = et.id
            WHERE c.statut = 'ACCEPTEE_ENTREPRISE'
            ORDER BY c.date_acceptation_entreprise ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Valider une candidature (affectation finale)
router.put('/candidatures/:id/valider', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;

        await req.dbClient.query('BEGIN');

        // Récupérer les infos de la candidature
        const candResult = await req.dbClient.query(
            'SELECT etudiant_id, offre_id FROM candidature WHERE id = $1',
            [id]
        );

        if (candResult.rows.length === 0) {
            await req.dbClient.query('ROLLBACK');
            return res.status(404).json({ error: 'Candidature non trouvée' });
        }

        const { etudiant_id, offre_id } = candResult.rows[0];

        // Valider cette candidature
        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = 'VALIDEE',
                validateur_id = $1,
                date_validation = NOW()
            WHERE id = $2
        `, [req.userId, id]);

        // Passer les autres candidatures de l'étudiant en renoncement
        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = 'RENONCEMENT'
            WHERE etudiant_id = $1 AND id != $2 AND statut NOT IN ('REJETEE', 'RENONCEMENT', 'VALIDEE')
        `, [etudiant_id, id]);

        // Rejeter les autres candidatures sur cette offre
        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = 'REJETEE'
            WHERE offre_id = $1 AND id != $2 AND statut NOT IN ('REJETEE', 'RENONCEMENT', 'VALIDEE')
        `, [offre_id, id]);

        // Marquer l'offre comme pourvue
        await req.dbClient.query(`
            UPDATE offre 
            SET statut = 'POURVUE'
            WHERE id = $1
        `, [offre_id]);

        await req.dbClient.query('COMMIT');

        res.json({ message: 'Candidature validée. L\'étudiant est affecté à l\'offre.' });
    } catch (err) {
        await req.dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// ==========================================
// GESTION DES BARÈMES DE RÉMUNÉRATION
// ==========================================

// GET - Liste des barèmes
router.get('/baremes', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT * FROM bareme_remuneration
            ORDER BY type_contrat, duree_min
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Créer un barème
router.post('/baremes', authMiddleware, withRole, async (req, res) => {
    try {
        const { type_contrat, pays, duree_min, duree_max, montant_min, description } = req.body;

        const result = await req.dbClient.query(`
            INSERT INTO bareme_remuneration (type_contrat, pays, duree_min, duree_max, montant_min, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [type_contrat, pays || 'France', duree_min, duree_max, montant_min, description]);

        res.status(201).json({
            message: 'Barème créé avec succès',
            id: result.rows[0].id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
    }
});

// PUT - Modifier un barème
router.put('/baremes/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { type_contrat, pays, duree_min, duree_max, montant_min, description } = req.body;

        await req.dbClient.query(`
            UPDATE bareme_remuneration 
            SET type_contrat = COALESCE($1, type_contrat),
                pays = COALESCE($2, pays),
                duree_min = COALESCE($3, duree_min),
                duree_max = COALESCE($4, duree_max),
                montant_min = COALESCE($5, montant_min),
                description = COALESCE($6, description)
            WHERE id = $7
        `, [type_contrat, pays, duree_min, duree_max, montant_min, description, id]);

        res.json({ message: 'Barème mis à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// DELETE - Supprimer un barème
router.delete('/baremes/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM bareme_remuneration WHERE id = $1', [id]);
        res.json({ message: 'Barème supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// ==========================================
// PROFIL ENSEIGNANT
// ==========================================

// GET - Profil de l'enseignant connecté
router.get('/profil', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.*, u.email
            FROM enseignant_responsable e
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

// PUT - Modifier le profil
router.put('/profil', authMiddleware, withRole, async (req, res) => {
    try {
        const { nom, prenom } = req.body;

        await req.dbClient.query(`
            UPDATE enseignant_responsable 
            SET nom = COALESCE($1, nom),
                prenom = COALESCE($2, prenom)
            WHERE id = $3
        `, [nom, prenom, req.userId]);

        res.json({ message: 'Profil mis à jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// ==========================================
// STATISTIQUES DASHBOARD
// ==========================================

// GET - Statistiques pour le dashboard
router.get('/stats', authMiddleware, withRole, async (req, res) => {
    try {
        const offresEnAttente = await req.dbClient.query(
            "SELECT COUNT(*) as count FROM offre WHERE statut = 'EN_ATTENTE'"
        );
        const candidaturesAValider = await req.dbClient.query(
            "SELECT COUNT(*) as count FROM candidature WHERE statut = 'ACCEPTEE_ENTREPRISE'"
        );
        const offresValidees = await req.dbClient.query(
            "SELECT COUNT(*) as count FROM offre WHERE statut = 'VALIDEE'"
        );
        const affectationsValidees = await req.dbClient.query(
            "SELECT COUNT(*) as count FROM candidature WHERE statut = 'VALIDEE'"
        );

        res.json({
            offresEnAttente: parseInt(offresEnAttente.rows[0].count),
            candidaturesAValider: parseInt(candidaturesAValider.rows[0].count),
            offresValidees: parseInt(offresValidees.rows[0].count),
            affectationsValidees: parseInt(affectationsValidees.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
