const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
    res.json({ message: 'API Gestion Stages IDMC - OK' });
});

// Import des routes
const etudiantsRoutes = require('./routes/etudiants');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const offresRoutes = require('./routes/offres');
const candidaturesRoutes = require('./routes/candidatures');

// Routes API
app.use('/api/etudiants', etudiantsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/offres', offresRoutes);
app.use('/api/candidatures', candidaturesRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
