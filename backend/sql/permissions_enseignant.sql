-- =====================================================
-- SCRIPT SQL : Permissions pour l'Enseignant Responsable
-- Exécuter ce script dans PostgreSQL (pgAdmin ou psql)
-- =====================================================

-- Permissions sur les tables pour role_enseignant
GRANT SELECT, UPDATE ON enseignant_responsable TO role_enseignant;
GRANT SELECT ON utilisateur TO role_enseignant;
GRANT SELECT, INSERT, UPDATE ON offre TO role_enseignant;
GRANT SELECT, UPDATE ON candidature TO role_enseignant;
GRANT SELECT, INSERT, UPDATE, DELETE ON bareme_remuneration TO role_enseignant;
GRANT SELECT ON entreprise TO role_enseignant;
GRANT SELECT ON etudiant TO role_enseignant;
GRANT SELECT ON secretaire TO role_enseignant;

-- Si la table notification existe
GRANT SELECT, INSERT, UPDATE ON notification TO role_enseignant;

-- Permissions supplémentaires pour les droits secrétaire
-- (quand l'enseignant remplace la secrétaire en congé)
GRANT INSERT, UPDATE ON etudiant TO role_enseignant;
GRANT INSERT ON utilisateur TO role_enseignant;

-- Permissions sur les séquences (pour les INSERT avec auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO role_enseignant;

-- Message de confirmation
SELECT 'Permissions accordées au role_enseignant' AS resultat;
