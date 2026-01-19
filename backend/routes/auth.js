const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// POST - Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        // Récupérer l'utilisateur
        const result = await pool.query(
            'SELECT * FROM utilisateur WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const user = result.rows[0];

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // Récupérer les infos selon le rôle
        let userDetails = { id: user.id, email: user.email, role: user.role };

        if (user.role === 'SECRETAIRE') {
            const secretaire = await pool.query(
                'SELECT nom, prenom, en_conge FROM secretaire WHERE id = $1',
                [user.id]
            );
            if (secretaire.rows.length > 0) {
                userDetails = { ...userDetails, ...secretaire.rows[0] };
            }
        } else if (user.role === 'ENSEIGNANT RESPONSABLE') {
            const enseignant = await pool.query(
                'SELECT nom, prenom, droits_secretaire FROM enseignant_responsable WHERE id = $1',
                [user.id]
            );
            if (enseignant.rows.length > 0) {
                userDetails = { ...userDetails, ...enseignant.rows[0] };
            }
        } else if (user.role === 'ETUDIANT') {
            const etudiant = await pool.query(
                'SELECT nom, prenom, num_etudiant, formation FROM etudiant WHERE id = $1',
                [user.id]
            );
            if (etudiant.rows.length > 0) {
                userDetails = { ...userDetails, ...etudiant.rows[0] };
            }
        } else if (user.role === 'ENTREPRISE') {
            const entreprise = await pool.query(
                'SELECT raison_sociale, siret FROM entreprise WHERE id = $1',
                [user.id]
            );
            if (entreprise.rows.length > 0) {
                userDetails = { ...userDetails, ...entreprise.rows[0] };
            }
        }

        res.json({
            message: 'Connexion réussie',
            user: userDetails
        });

    } catch (err) {
        console.error('Erreur login:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Inscription entreprise
router.post('/register/entreprise', async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            email,
            mot_de_passe,
            raison_sociale,
            siret,
            adresse,
            forme_juridique
        } = req.body;

        await client.query('BEGIN');

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const userResult = await client.query(`
            INSERT INTO utilisateur (email, mot_de_passe, role)
            VALUES ($1, $2, 'ENTREPRISE')
            RETURNING id
        `, [email, hashedPassword]);

        const userId = userResult.rows[0].id;

        // Créer l'entreprise
        await client.query(`
            INSERT INTO entreprise (id, siret, raison_sociale, adresse, forme_juridique)
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, siret, raison_sociale, adresse, forme_juridique]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Entreprise inscrite avec succès',
            id: userId
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erreur inscription:', err);
        res.status(500).json({ error: 'Erreur lors de l\'inscription', details: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
