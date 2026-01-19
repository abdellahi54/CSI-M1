const entrepriseService = require('./entreprise.service');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const entreprise = await entrepriseService.getEntrepriseByUserId(userId);

        if (!entreprise) {
            return res.status(404).json({ message: 'Profil entreprise non trouvé' });
        }

        res.json(entreprise);
    } catch (error) {
        console.error('Erreur getProfile:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedEntreprise = await entrepriseService.updateEntreprise(userId, req.body);

        if (!updatedEntreprise) {
            return res.status(404).json({ message: 'Impossible de mettre à jour le profil' });
        }

        res.json(updatedEntreprise);
    } catch (error) {
        console.error('Erreur updateProfile:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
