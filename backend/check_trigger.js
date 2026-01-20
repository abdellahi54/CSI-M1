const { pool } = require('./config/db');

async function checkTrigger() {
    try {
        // Check current baremes
        const baremes = await pool.query('SELECT * FROM bareme_remuneration');
        console.log('=== Barèmes actuels ===');
        console.log(baremes.rows);

        // Check recent offers
        const offres = await pool.query('SELECT id, type, pays, duree, remuneration, etat FROM offre ORDER BY id DESC LIMIT 3');
        console.log('\n=== Dernières offres ===');
        console.log(offres.rows);

        // Check if trigger exists
        const trigger = await pool.query(`
            SELECT tgname, tgrelid::regclass, proname 
            FROM pg_trigger 
            JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
            WHERE tgname = 'trg_remuneration_legale'
        `);
        console.log('\n=== Information trigger ===');
        console.log(trigger.rows.length > 0 ? trigger.rows : 'Trigger non trouvé!');

        // Check function definition
        const func = await pool.query(`
            SELECT prosrc 
            FROM pg_proc 
            WHERE proname = 'check_remuneration_legale'
        `);
        console.log('\n=== Code de la fonction ===');
        console.log(func.rows.length > 0 ? func.rows[0].prosrc.substring(0, 500) + '...' : 'Fonction non trouvée!');

    } catch (err) {
        console.error('Erreur:', err.message);
    } finally {
        pool.end();
    }
}

checkTrigger();
