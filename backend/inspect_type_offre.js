const { pool } = require('./config/db');

async function inspectTypeOffre() {
    try {
        const types = await pool.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'type_offre'");
        console.log('Valid values for type_offre:', types.rows.map(r => r.enumlabel));

        // Check if the bareme_remuneration table is empty or has data
        const baremes = await pool.query("SELECT * FROM bareme_remuneration LIMIT 5");
        console.log('Sample baremes:', baremes.rows);
    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        pool.end();
    }
}

inspectTypeOffre();
