const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { authMiddleware, withRole } = require('../middleware/auth');

// Configuration de Multer pour l'upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorise. Utilisez PDF, JPEG ou PNG.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// POST - Upload attestation RC (etudiant)
router.post('/rc/upload', authMiddleware, withRole, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier uploade' });
        }

        // Recuperer le nom de l'etudiant
        const etudiantInfo = await req.dbClient.query(
            'SELECT nom, prenom FROM etudiant WHERE id = $1',
            [req.userId]
        );
        const nomEtudiant = etudiantInfo.rows[0] ?
            `${etudiantInfo.rows[0].prenom} ${etudiantInfo.rows[0].nom}` : 'Un etudiant';

        // Verifier si une RC existe deja
        const existing = await req.dbClient.query(
            'SELECT id FROM responsablitecivile WHERE etudiant_id = $1',
            [req.userId]
        );

        if (existing.rows.length > 0) {
            // Mettre a jour le document existant
            await req.dbClient.query(
                `UPDATE responsablitecivile SET nom_fichier = $1 WHERE id = $2`,
                [req.file.filename, existing.rows[0].id]
            );

            // Remettre le statut RC a false car nouveau document
            await req.dbClient.query(
                'UPDATE etudiant SET responsabilite_civile = false WHERE id = $1',
                [req.userId]
            );
        } else {
            // Creer une nouvelle RC
            await req.dbClient.query(
                `INSERT INTO responsablitecivile (etudiant_id, nom_fichier) VALUES ($1, $2)`,
                [req.userId, req.file.filename]
            );
        }

        // Envoyer notification a toutes les secretaires
        try {
            const secretaires = await req.dbClient.query(
                'SELECT id FROM secretaire WHERE en_conge = false'
            );
            for (const sec of secretaires.rows) {
                await req.dbClient.query(
                    `INSERT INTO notification (identifiantutilisateur, objet, message)
                     VALUES ($1, $2, $3)`,
                    [sec.id, 'Nouvelle attestation RC', `${nomEtudiant} a depose une attestation de responsabilite civile a valider.`]
                );
            }
        } catch (notifErr) {
            console.error('Erreur envoi notif secretaires:', notifErr);
        }

        res.status(201).json({ message: 'Attestation RC uploadee', filename: req.file.filename });
    } catch (err) {
        console.error('Erreur upload RC:', err);
        res.status(500).json({ error: 'Erreur upload', details: err.message });
    }
});

// GET - Mon attestation RC (etudiant)
router.get('/rc/mine', authMiddleware, withRole, async (req, res) => {
    try {
        const result = await req.dbClient.query(
            `SELECT rc.id, rc.nom_fichier, e.responsabilite_civile as valide
             FROM responsablitecivile rc
             JOIN etudiant e ON e.id = rc.etudiant_id
             WHERE rc.etudiant_id = $1`,
            [req.userId]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Attestation RC d'un etudiant (secretaire)
router.get('/rc/etudiant/:etudiantId', authMiddleware, withRole, async (req, res) => {
    try {
        const { etudiantId } = req.params;
        const result = await req.dbClient.query(
            `SELECT rc.id, rc.nom_fichier, e.responsabilite_civile as valide
             FROM responsablitecivile rc
             JOIN etudiant e ON e.id = rc.etudiant_id
             WHERE rc.etudiant_id = $1`,
            [etudiantId]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Telecharger un fichier RC (sans auth pour permettre les liens directs)
router.get('/rc/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT nom_fichier FROM responsablitecivile WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document non trouve' });
        }

        const filePath = path.join(__dirname, '../uploads', result.rows[0].nom_fichier);
        res.download(filePath, result.rows[0].nom_fichier);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur telechargement' });
    }
});

// PUT - Valider attestation RC (secretaire)
router.put('/rc/:etudiantId/valider', authMiddleware, withRole, async (req, res) => {
    try {
        const { etudiantId } = req.params;

        await req.dbClient.query(
            'UPDATE etudiant SET responsabilite_civile = true, validateur_rc_id = $1 WHERE id = $2',
            [req.userId, etudiantId]
        );

        // Envoyer une notification a l'etudiant
        await req.dbClient.query(
            `INSERT INTO notification (identifiantutilisateur, objet, message)
             VALUES ($1, $2, $3)`,
            [etudiantId, 'Attestation RC validee', 'Votre attestation de responsabilite civile a ete validee par le secretariat.']
        );

        res.json({ message: 'Attestation RC validee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur validation' });
    }
});

// PUT - Rejeter attestation RC (secretaire)
router.put('/rc/:etudiantId/rejeter', authMiddleware, withRole, async (req, res) => {
    try {
        const { etudiantId } = req.params;
        const { motif } = req.body;

        // Supprimer le document RC
        const rcDoc = await req.dbClient.query(
            'SELECT id, nom_fichier FROM responsablitecivile WHERE etudiant_id = $1',
            [etudiantId]
        );

        if (rcDoc.rows.length > 0) {
            // Supprimer le fichier physique
            const filePath = path.join(__dirname, '../uploads', rcDoc.rows[0].nom_fichier);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            // Supprimer de la base
            await req.dbClient.query('DELETE FROM responsablitecivile WHERE id = $1', [rcDoc.rows[0].id]);
        }

        // Envoyer une notification a l'etudiant
        const message = motif ?
            `Votre attestation RC a ete rejetee. Motif: ${motif}` :
            'Votre attestation RC a ete rejetee. Veuillez en deposer une nouvelle.';

        await req.dbClient.query(
            `INSERT INTO notification (identifiantutilisateur, objet, message)
             VALUES ($1, $2, $3)`,
            [etudiantId, 'Attestation RC rejetee', message]
        );

        res.json({ message: 'Attestation RC rejetee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur rejet' });
    }
});

// DELETE - Supprimer mon attestation RC (etudiant)
router.delete('/rc/mine', authMiddleware, withRole, async (req, res) => {
    try {
        // Recuperer le fichier
        const doc = await req.dbClient.query(
            'SELECT id, nom_fichier FROM responsablitecivile WHERE etudiant_id = $1',
            [req.userId]
        );

        if (doc.rows.length === 0) {
            return res.status(404).json({ error: 'Aucune attestation RC trouvee' });
        }

        // Supprimer le fichier physique
        const filePath = path.join(__dirname, '../uploads', doc.rows[0].nom_fichier);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Supprimer de la base
        await req.dbClient.query('DELETE FROM responsablitecivile WHERE id = $1', [doc.rows[0].id]);

        // Mettre a jour le statut etudiant
        await req.dbClient.query('UPDATE etudiant SET responsabilite_civile = false WHERE id = $1', [req.userId]);

        res.json({ message: 'Attestation RC supprimee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

module.exports = router;
