const { pool } = require('../../shared/utils/db');

const getEntrepriseByUserId = async (userId) => {
    const query = 'SELECT * FROM entreprise WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

const updateEntreprise = async (userId, data) => {
    const { siret, raison_sociale, adresse, forme_juridique, date_derniere_offre } = data;

    // Construction dynamique de la requête si nécessaire, mais ici on update les champs principaux
    // On suppose que l'utilisateur envoie tous les champs ou on gère les champs partiels.
    // Pour simplifier, on update champs par champs s'ils sont présents ou on fait un update global.
    // Faisons un update ciblé.

    const fields = [];
    const values = [];
    let idx = 1;

    if (siret !== undefined) { fields.push(`siret = $${idx++}`); values.push(siret); }
    if (raison_sociale !== undefined) { fields.push(`raison_sociale = $${idx++}`); values.push(raison_sociale); }
    if (adresse !== undefined) { fields.push(`adresse = $${idx++}`); values.push(adresse); }
    if (forme_juridique !== undefined) { fields.push(`forme_juridique = $${idx++}`); values.push(forme_juridique); }
    if (date_derniere_offre !== undefined) { fields.push(`date_derniere_offre = $${idx++}`); values.push(date_derniere_offre); }

    if (fields.length === 0) return null; // Rien à update

    values.push(userId);
    const query = `UPDATE entreprise SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(query, values);
    return result.rows[0];
};

module.exports = {
    getEntrepriseByUserId,
    updateEntreprise
};
