const { pool } = require('./config/db');

async function checkBaremes() {
    try {
        const baremes = await pool.query('SELECT * FROM bareme_remuneration');
        console.log('Barèmes actuels:', baremes.rows);

        if (baremes.rows.length === 0) {
            console.log('\n⚠️ Aucun barème défini! Le trigger ne peut pas vérifier la rémunération.');
            console.log('Créez un barème via l\'interface enseignant ou avec cette requête:');
            console.log("INSERT INTO bareme_remuneration (type_offre, pays, duree_min, duree_max, montant_minimal) VALUES ('STAGE', 'France', 8, 24, 600);");
            console.log('(duree_min et duree_max sont en SEMAINES)');
        } else {
            console.log('\n📝 Note: duree_min et duree_max doivent être en SEMAINES');
            console.log('Exemple: duree_min=8, duree_max=24 = stage de 2 à 6 mois');
        }
    } catch (err) {
        console.error('Erreur:', err.message);
    } finally {
        pool.end();
    }
}

checkBaremes();
