const jwt = require('jsonwebtoken');
const authService = require('./auth.service');
require('dotenv').config();

const { pool } = require('../../shared/utils/db');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        // 1. Vérifier si l'utilisateur existe
        const user = await authService.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // 2. Vérifier le mot de passe
        const isMatch = await authService.verifyPassword(mot_de_passe, user.mot_de_passe);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // 3. Générer le token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'secret_temporaire_a_changer',
            { expiresIn: '24h' }
        );

        // 4. Répondre avec le token et les infos utilisateur (sans le mdp)
        const { mot_de_passe: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Connexion réussie',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Erreur Login:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
};

const registerEntreprise = async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, mot_de_passe, siret, raison_sociale, adresse, forme_juridique } = req.body;

        // Validation basique
        if (!email || !mot_de_passe || !siret || !raison_sociale) {
            return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await authService.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }

        await client.query('BEGIN');

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Créer l'utilisateur
        const newUser = await authService.createUser(client, email, hashedPassword, 'ENTREPRISE');

        // Créer le profil entreprise
        const newEntreprise = await authService.createEntreprise(client, newUser.id, {
            siret,
            raison_sociale,
            adresse,
            forme_juridique
        });

        await client.query('COMMIT');

        // Générer le token
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role, email: newUser.email },
            process.env.JWT_SECRET || 'secret_temporaire_a_changer',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Inscription réussie',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            },
            entreprise: newEntreprise
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur Register Entreprise:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription', error: error.message });
    } finally {
        client.release();
    }
};

module.exports = {
    login,
    registerEntreprise
};
