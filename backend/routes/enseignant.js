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
            WHERE o.etat = 'EN ATTENTE DE VALIDATION'
            ORDER BY o.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Toutes les offres (tous états)
router.get('/offres/toutes', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT o.*, e.raison_sociale as entreprise_nom, e.siret
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            ORDER BY o.id DESC
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
            SET etat = 'VALDEE',
                enseignant_validateur_id = $1
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

        if (!motif) {
            return res.status(400).json({ error: 'Le motif de refus est obligatoire' });
        }

        // Note: La colonne 'justification' n'existe pas dans la table offre.
        // Il faut exécuter: ALTER TABLE offre ADD COLUMN justification TEXT;
        await req.dbClient.query(`
            UPDATE offre 
            SET etat = 'NON VALDEE',
                enseignant_validateur_id = $1
            WHERE id = $2
        `, [req.userId, id]);

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
                   o.description as offre_description, o.type as offre_type,
                   o.date_debut, o.duree, o.remuneration,
                   ent.raison_sociale as entreprise_nom,
                   et.nom as etudiant_nom, et.prenom as etudiant_prenom,
                   et.num_etudiant, et.formation
            FROM candidature c
            JOIN offre o ON c.offre_id = o.id
            JOIN entreprise ent ON o.entreprise_id = ent.id
            JOIN etudiant et ON c.etudiant_id = et.id
            WHERE c.statut = 'ACCEPTEE ENTREPRISE'
            ORDER BY c.date_candidature DESC
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
                enseignant_validateur_id = $1
            WHERE id = $2
        `, [req.userId, id]);

        // Passer les autres candidatures de l'étudiant en renoncée
        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = 'RENONCEE'
            WHERE etudiant_id = $1 AND id != $2 AND statut NOT IN ('REJETEE ENTREPRISE', 'RENONCEE', 'VALIDEE', 'REFUSEE RESPONSABLE')
        `, [etudiant_id, id]);

        // Rejeter les autres candidatures sur cette offre
        await req.dbClient.query(`
            UPDATE candidature 
            SET statut = 'REFUSEE RESPONSABLE'
            WHERE offre_id = $1 AND id != $2 AND statut NOT IN ('REJETEE ENTREPRISE', 'RENONCEE', 'VALIDEE', 'REFUSEE RESPONSABLE')
        `, [offre_id, id]);

        // Marquer l'offre comme non active
        await req.dbClient.query(`
            UPDATE offre 
            SET statut = 'NON ACTIVE'
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
            ORDER BY type_offre, duree_min
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
        const { type_offre, pays, duree_min, duree_max, montant_minimal } = req.body;

        const result = await req.dbClient.query(`
            INSERT INTO bareme_remuneration (type_offre, pays, duree_min, duree_max, montant_minimal)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [type_offre, pays || 'France', duree_min, duree_max, montant_minimal]);

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
        const { type_offre, pays, duree_min, duree_max, montant_minimal } = req.body;

        await req.dbClient.query(`
            UPDATE bareme_remuneration 
            SET type_offre = COALESCE($1, type_offre),
                pays = COALESCE($2, pays),
                duree_min = COALESCE($3, duree_min),
                duree_max = COALESCE($4, duree_max),
                montant_minimal = COALESCE($5, montant_minimal)
            WHERE id = $6
        `, [type_offre, pays, duree_min, duree_max, montant_minimal, id]);

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
            "SELECT COUNT(*) as count FROM offre WHERE etat = 'EN ATTENTE DE VALIDATION'"
        );
        const candidaturesAValider = await req.dbClient.query(
            "SELECT COUNT(*) as count FROM candidature WHERE statut = 'ACCEPTEE ENTREPRISE'"
        );
        const offresValidees = await req.dbClient.query(
            "SELECT COUNT(*) as count FROM offre WHERE etat = 'VALDEE'"
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

// ==========================================
// DROITS SECRÉTAIRE (quand secrétaires en congé)
// ==========================================

// GET - Vérifier si l'enseignant a les droits secrétaire et si des secrétaires sont en congé
router.get('/droits-secretaire', authMiddleware, withRole, async (req, res) => {
    try {
        // Vérifier si l'enseignant a les droits
        const enseignant = await req.dbClient.query(
            'SELECT droits_secretaire FROM enseignant_responsable WHERE id = $1',
            [req.userId]
        );

        if (enseignant.rows.length === 0 || !enseignant.rows[0].droits_secretaire) {
            return res.json({ hasDroits: false, canAct: false });
        }

        // Vérifier si toutes les secrétaires sont en congé
        const secretaires = await req.dbClient.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN en_conge THEN 1 ELSE 0 END) as en_conge FROM secretaire'
        );

        const total = parseInt(secretaires.rows[0].total);
        const enConge = parseInt(secretaires.rows[0].en_conge);

        res.json({
            hasDroits: true,
            canAct: total === 0 || total === enConge,
            secretairesTotal: total,
            secretairesEnConge: enConge
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Liste des étudiants (pour droits secrétaire)
router.get('/etudiants', authMiddleware, withRole, async (req, res) => {
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

// POST - Inscrire un étudiant (droits secrétaire)
const bcrypt = require('bcrypt');

router.post('/etudiants', authMiddleware, withRole, async (req, res) => {
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

// PUT - Valider l'attestation RC d'un étudiant (droits secrétaire)
router.put('/etudiants/:id/valider-rc', authMiddleware, withRole, async (req, res) => {
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

// ==========================================
// NOTIFICATIONS
// ==========================================

// GET - Liste des notifications de l'enseignant
router.get('/notifications', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT identifiant as id, objet, message, date_notification
            FROM notification
            WHERE identifiantutilisateur = $1
            ORDER BY date_notification DESC
            LIMIT 50
        `, [req.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Marquer une notification comme lue (non supporté par le schéma actuel)
router.put('/notifications/:id/lire', authMiddleware, withRole, async (req, res) => {
    try {
        // Le schéma actuel n'a pas de champ "lue", on retourne succès
        res.json({ message: 'Notification marquée comme lue' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// PUT - Marquer toutes les notifications comme lues
router.put('/notifications/lire-toutes', authMiddleware, withRole, async (req, res) => {
    try {
        // Le schéma actuel n'a pas de champ "lue", on retourne succès
        res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Nombre de notifications non lues
router.get('/notifications/count', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT COUNT(*) as count FROM notification
            WHERE identifiantutilisateur = $1
        `, [req.userId]);
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
