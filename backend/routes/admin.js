const express = require('express');
const router = express.Router();
const { pool, getClientWithRole, resetRole } = require('../config/db');
const bcrypt = require('bcrypt');
const { authMiddleware, withRole } = require('../middleware/auth');

// GET - Liste des secrétaires
router.get('/secretaires', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT s.*, u.email, u.date_creation
            FROM secretaire s
            JOIN utilisateur u ON s.id = u.id
            ORDER BY s.nom, s.prenom
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET - Liste des enseignants responsables
router.get('/enseignants', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.*, u.email, u.date_creation
            FROM enseignant_responsable e
            JOIN utilisateur u ON e.id = u.id
            ORDER BY e.nom, e.prenom
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Créer une secrétaire
router.post('/secretaires', authMiddleware, withRole, async (req, res) => {
    console.log('=== CREATION SECRETAIRE ===');
    console.log('Body:', req.body);
    try {
        const { email, mot_de_passe, nom, prenom } = req.body;

        await req.dbClient.query('BEGIN');

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const userResult = await req.dbClient.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ($1, $2, 'SECRETAIRE')
            RETURNING id
        `, [email, hashedPassword]);

        const userId = userResult.rows[0].id;

        // Créer la secrétaire
        await req.dbClient.query(`
            INSERT INTO secretaire (id, nom, prenom, en_conge)
            VALUES ($1, $2, $3, false)
        `, [userId, nom, prenom]);

        await req.dbClient.query('COMMIT');

        res.status(201).json({
            message: 'Secrétaire créée avec succès',
            id: userId,
            email: email
        });
    } catch (err) {
        await req.dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
    }
});

// POST - Créer un enseignant responsable
router.post('/enseignants', authMiddleware, withRole, async (req, res) => {
    try {
        const { email, mot_de_passe, nom, prenom, droits_secretaire } = req.body;

        await req.dbClient.query('BEGIN');

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const userResult = await req.dbClient.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ($1, $2, 'ENSEIGNANT RESPONSABLE')
            RETURNING id
        `, [email, hashedPassword]);

        const userId = userResult.rows[0].id;

        // Créer l'enseignant
        await req.dbClient.query(`
            INSERT INTO enseignant_responsable (id, nom, prenom, droits_secretaire)
            VALUES ($1, $2, $3, $4)
        `, [userId, nom, prenom, droits_secretaire !== false]);

        await req.dbClient.query('COMMIT');

        res.status(201).json({
            message: 'Enseignant responsable créé avec succès',
            id: userId,
            email: email
        });
    } catch (err) {
        await req.dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
    }
});

// DELETE - Supprimer une secrétaire
router.delete('/secretaires/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM utilisateur WHERE id = $1', [id]);
        res.json({ message: 'Secrétaire supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer un enseignant
router.delete('/enseignants/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM utilisateur WHERE id = $1', [id]);
        res.json({ message: 'Enseignant supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// GESTION ETUDIANTS
// ==========================================

// GET - Liste des etudiants
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

// POST - Creer un etudiant
router.post('/etudiants', authMiddleware, withRole, async (req, res) => {
    try {
        const { email, mot_de_passe, nom, prenom, num_etudiant, date_naissance, formation, annee_formation } = req.body;

        await req.dbClient.query('BEGIN');
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        const userResult = await req.dbClient.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ($1, $2, 'ETUDIANT')
            RETURNING id
        `, [email, hashedPassword]);
        const userId = userResult.rows[0].id;

        await req.dbClient.query(`
            INSERT INTO etudiant (id, num_etudiant, nom, prenom, date_naissance, formation, annee_formation, statut)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'EN_RECHERCHE')
        `, [userId, num_etudiant, nom, prenom, date_naissance, formation, annee_formation]);

        await req.dbClient.query('COMMIT');
        res.status(201).json({ message: 'Etudiant cree', id: userId });
    } catch (err) {
        await req.dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erreur creation', details: err.message });
    }
});

// PUT - Modifier un etudiant
router.put('/etudiants/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, formation, annee_formation } = req.body;
        await req.dbClient.query(`
            UPDATE etudiant SET nom = $1, prenom = $2, formation = $3, annee_formation = $4
            WHERE id = $5
        `, [nom, prenom, formation, annee_formation, id]);
        res.json({ message: 'Etudiant mis a jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur mise a jour' });
    }
});

// DELETE - Supprimer un etudiant
router.delete('/etudiants/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM utilisateur WHERE id = $1', [id]);
        res.json({ message: 'Etudiant supprime' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ==========================================
// GESTION ENTREPRISES
// ==========================================

// GET - Liste des entreprises
router.get('/entreprises', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT e.*, u.email, u.date_creation
            FROM entreprise e
            JOIN utilisateur u ON e.id = u.id
            ORDER BY e.raison_sociale
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Activer/Desactiver entreprise
router.put('/entreprises/:id/toggle-active', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query(`
            UPDATE entreprise SET active = NOT active WHERE id = $1
        `, [id]);
        res.json({ message: 'Statut entreprise mis a jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer entreprise
router.delete('/entreprises/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM utilisateur WHERE id = $1', [id]);
        res.json({ message: 'Entreprise supprimee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ==========================================
// GESTION OFFRES
// ==========================================

// GET - Liste des offres
router.get('/offres', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT o.*, 
                   e.raison_sociale as entreprise,
                   ens.nom as validateur_nom, ens.prenom as validateur_prenom
            FROM offre o
            JOIN entreprise e ON o.entreprise_id = e.id
            LEFT JOIN enseignant_responsable ens ON o.enseignant_validateur_id = ens.id
            ORDER BY o.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Valider une offre
router.put('/offres/:id/valider', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query(`
            UPDATE offre SET etat = 'VALDEE' WHERE id = $1
        `, [id]);
        res.json({ message: 'Offre validee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur validation' });
    }
});

// PUT - Refuser une offre
router.put('/offres/:id/refuser', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query(`
            UPDATE offre SET etat = 'NON VALDEE' WHERE id = $1
        `, [id]);
        res.json({ message: 'Offre refusee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur refus' });
    }
});

// ==========================================
// GESTION CANDIDATURES
// ==========================================

// GET - Liste des candidatures
router.get('/candidatures', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT c.*, 
                   et.nom as etudiant_nom, et.prenom as etudiant_prenom,
                   ent.raison_sociale as entreprise,
                   o.type as offre_type
            FROM candidature c
            JOIN etudiant et ON c.etudiant_id = et.id
            JOIN offre o ON c.offre_id = o.id
            JOIN entreprise ent ON o.entreprise_id = ent.id
            ORDER BY c.date_candidature DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==========================================
// GESTION BAREMES
// ==========================================

// GET - Liste des baremes
router.get('/baremes', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(`
            SELECT * FROM bareme_remuneration ORDER BY type_offre
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Creer un bareme
router.post('/baremes', authMiddleware, withRole, async (req, res) => {
    try {
        const { type_offre, pays, duree_min, duree_max, montant_minimal } = req.body;
        await req.dbClient.query(`
            INSERT INTO bareme_remuneration (type_offre, pays, duree_min, duree_max, montant_minimal)
            VALUES ($1, $2, $3, $4, $5)
        `, [type_offre, pays, duree_min, duree_max, montant_minimal]);
        res.status(201).json({ message: 'Bareme cree' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur creation' });
    }
});

// PUT - Modifier un bareme
router.put('/baremes/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { type_offre, pays, duree_min, duree_max, montant_minimal } = req.body;
        await req.dbClient.query(`
            UPDATE bareme_remuneration
            SET type_offre = $1, pays = $2, duree_min = $3, duree_max = $4, montant_minimal = $5
            WHERE id = $6
        `, [type_offre, pays, duree_min, duree_max, montant_minimal, id]);
        res.json({ message: 'Bareme mis a jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur mise a jour' });
    }
});

// DELETE - Supprimer un bareme
router.delete('/baremes/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        await req.dbClient.query('DELETE FROM bareme_remuneration WHERE id = $1', [id]);
        res.json({ message: 'Bareme supprime' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ==========================================
// MODIFICATIONS UTILISATEURS
// ==========================================

router.put('/secretaires/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, en_conge } = req.body;
        await req.dbClient.query(`
            UPDATE secretaire SET nom = $1, prenom = $2, en_conge = $3 WHERE id = $4
        `, [nom, prenom, en_conge, id]);
        res.json({ message: 'Secretaire mise a jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur mise a jour' });
    }
});

router.put('/enseignants/:id', authMiddleware, withRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, droits_secretaire } = req.body;
        await req.dbClient.query(`
            UPDATE enseignant_responsable SET nom = $1, prenom = $2, droits_secretaire = $3 WHERE id = $4
        `, [nom, prenom, droits_secretaire, id]);
        res.json({ message: 'Enseignant mis a jour' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur mise a jour' });
    }
});

// POST - Archivage de fin d'année
router.post('/archiver', authMiddleware, withRole, async (req, res) => {
    try {
        const { annee } = req.body;

        if (!annee) {
            return res.status(400).json({ error: 'Année universitaire requise' });
        }

        // Appeler la procédure d'archivage
        await req.dbClient.query('SELECT archiver_annee_universitaire($1)', [annee]);

        res.json({ message: `Archivage de l'année ${annee} terminé avec succès` });
    } catch (err) {
        console.error('Erreur archivage:', err);
        res.status(500).json({ error: 'Erreur lors de l\'archivage', details: err.message });
    }
});

// POST - Supprimer tous les étudiants
router.post('/supprimer-etudiants', authMiddleware, withRole, async (req, res) => {
    try {
        await req.dbClient.query('SELECT delete_tous_les_etudiants()');
        res.json({ message: 'Tous les étudiants ont été supprimés' });
    } catch (err) {
        console.error('Erreur suppression étudiants:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression', details: err.message });
    }
});

// POST - Archivage de fin d'année
router.post('/archiver', authMiddleware, withRole, async (req, res) => {
    console.log('=== ARCHIVAGE ===');
    try {
        // Appeler les procédures d'archivage
        await req.dbClient.query('SELECT archive_offre_annuelles()');
        await req.dbClient.query('SELECT archives_entreprises_inactives()');

        res.json({ message: 'Archivage terminé avec succès' });
    } catch (err) {
        console.error('Erreur archivage:', err);
        res.status(500).json({ error: 'Erreur lors de l\'archivage', details: err.message });
    }
});

module.exports = router;
