const { pool } = require('./config/db');

async function inspectTable() {
    try {
        const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bareme_remuneration'");
        console.log('Columns for bareme_remuneration:', cols.rows);
    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        pool.end();
    }
}

inspectTable();
