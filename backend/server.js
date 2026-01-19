const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./shared/utils/db');

// Connexion à la base de données
connectDB();

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
const authRoutes = require('./modules/auth/auth.routes');
// const offresRoutes = require('./routes/offres'); 
// const candidaturesRoutes = require('./routes/candidatures');

app.use('/api/auth', authRoutes);
// app.use('/api/offres', offresRoutes);
// app.use('/api/candidatures', candidaturesRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
