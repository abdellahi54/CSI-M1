// Middleware pour vérifier l'authentification et définir le rôle PostgreSQL
const { getClientWithRole, resetRole } = require('../config/db');

// Middleware d'authentification
function authMiddleware(req, res, next) {
    // Récupérer le rôle depuis le header (envoyé par le frontend)
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];

    if (!userRole || !userId) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    req.userRole = userRole;
    req.userId = parseInt(userId);
    next();
}

// Middleware pour obtenir une connexion avec le rôle PostgreSQL
async function withRole(req, res, next) {
    try {
        const client = await getClientWithRole(req.userRole);
        req.dbClient = client;

        // Libérer la connexion après la réponse
        res.on('finish', async () => {
            await resetRole(req.dbClient);
        });

        next();
    } catch (err) {
        console.error('Erreur activation rôle:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

module.exports = { authMiddleware, withRole };
