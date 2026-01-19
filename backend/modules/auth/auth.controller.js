const jwt = require('jsonwebtoken');
const authService = require('./auth.service');
require('dotenv').config();

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

module.exports = {
    login
};
