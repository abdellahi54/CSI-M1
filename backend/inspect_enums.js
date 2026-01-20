const { pool } = require('./config/db');

async function inspectEnums() {
    try {
        const etats = await pool.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'etat_offre'");
        console.log('Valid values for etat_offre:', etats.rows.map(r => r.enumlabel));

        const statuts = await pool.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'statut_candidature'");
        console.log('Valid values for statut_candidature:', statuts.rows.map(r => r.enumlabel));
    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        pool.end();
    }
}

inspectEnums();
