const { pool } = require('./config/db');

async function fixPermissions() {
    try {
        console.log('Fixing permissions...');
        await pool.query('GRANT USAGE, SELECT ON SEQUENCE offre_id_seq TO role_entreprise;');
        console.log('Permissions fixed successfully.');
    } catch (err) {
        console.error('Error fixing permissions:', err);
    } finally {
        await pool.end();
    }
}

fixPermissions();
