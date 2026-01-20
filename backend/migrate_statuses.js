const { pool } = require('./config/db');

async function migrate() {
    console.log('Starting migration...');
    try {
        // Update Offre etat
        await pool.query("UPDATE offre SET etat = 'VALIDEE' WHERE etat = 'Validee' OR etat = 'VALDEE'");
        await pool.query("UPDATE offre SET etat = 'EN_ATTENTE_VALIDATION' WHERE etat = 'EnAttenteValidation' OR etat = 'EN ATTENTE DE VALIDATION'");
        await pool.query("UPDATE offre SET etat = 'NON_VALIDEE' WHERE etat = 'NonValidee' OR etat = 'NON VALDEE'");

        // Update Candidature statut
        await pool.query("UPDATE candidature SET statut = 'ACCEPTEE_ENTREPRISE' WHERE statut = 'AccepteeEntreprise' OR statut = 'ACCEPTEE ENTREPRISE'");
        await pool.query("UPDATE candidature SET statut = 'SOUMISE' WHERE statut = 'Soumise'");
        await pool.query("UPDATE candidature SET statut = 'VALIDEE' WHERE statut = 'Validee' OR statut = 'VALIDEE'");
        await pool.query("UPDATE candidature SET statut = 'REFUSEE_RESPONSABLE' WHERE statut = 'RefuseeResponsable' OR statut = 'REFUSEE RESPONSABLE'");
        await pool.query("UPDATE candidature SET statut = 'REJETEE_ENTREPRISE' WHERE statut = 'RejeteeEntreprise'");

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
