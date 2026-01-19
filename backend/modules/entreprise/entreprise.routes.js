const express = require('express');
const router = express.Router();
const entrepriseController = require('./entreprise.controller');
const authenticateToken = require('../auth/auth.middleware');

// Routes protégées par le middleware d'authentification
router.get('/me', authenticateToken, entrepriseController.getProfile);
router.put('/me', authenticateToken, entrepriseController.updateProfile);

module.exports = router;
