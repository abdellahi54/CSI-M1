-- =====================================================
-- POLITIQUE DE SÉCURITÉ - GESTION DES STAGES IDMC
-- Script de permissions selon le principe du moindre privilège
-- =====================================================

-- Révoquer tous les privilèges existants pour repartir proprement
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM role_admin, role_etudiant, role_secretaire, role_enseignant, role_entreprise;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM role_admin, role_etudiant, role_secretaire, role_enseignant, role_entreprise;

-- =====================================================
-- RÔLE ADMIN (role_admin) - Administrateur application
-- =====================================================
-- Table: Utilisateur
GRANT SELECT, INSERT, UPDATE, DELETE ON utilisateur TO role_admin;

-- Tables: Secrétaire, Enseignant Responsable
GRANT SELECT, INSERT ON secretaire TO role_admin;
GRANT SELECT, INSERT ON enseignant_responsable TO role_admin;

-- Tables d'archives
GRANT SELECT, INSERT, DELETE ON archive_offre TO role_admin;
GRANT SELECT, INSERT, DELETE ON archive_entreprise TO role_admin;

-- Admin (self)
GRANT SELECT ON admin TO role_admin;

-- Séquences nécessaires pour INSERT
GRANT USAGE, SELECT ON utilisateur_id_seq TO role_admin;

-- =====================================================
-- RÔLE ÉTUDIANT (role_etudiant)
-- =====================================================
-- Table: Utilisateur
GRANT SELECT ON utilisateur TO role_etudiant;

-- Table: Etudiant
GRANT SELECT, UPDATE ON etudiant TO role_etudiant;

-- Table: Entreprise
GRANT SELECT ON entreprise TO role_etudiant;

-- Table: Offre
GRANT SELECT ON offre TO role_etudiant;

-- Table: Candidature
GRANT SELECT, INSERT, UPDATE ON candidature TO role_etudiant;

-- Tables: Enseignant, Secrétaire (consultation)
GRANT SELECT ON enseignant_responsable TO role_etudiant;
GRANT SELECT ON secretaire TO role_etudiant;

-- Table: Document (ResponsabiliteCivile)
GRANT SELECT, INSERT, DELETE ON document TO role_etudiant;

-- Table: Notifications
GRANT SELECT ON notification TO role_etudiant;

-- Séquences nécessaires
GRANT USAGE, SELECT ON candidature_id_seq TO role_etudiant;
GRANT USAGE, SELECT ON document_id_seq TO role_etudiant;

-- =====================================================
-- RÔLE SECRÉTAIRE (role_secretaire)
-- =====================================================
-- Table: Secrétaire
GRANT SELECT, UPDATE ON secretaire TO role_secretaire;

-- Table: Utilisateur
GRANT SELECT, INSERT, UPDATE ON utilisateur TO role_secretaire;

-- Table: Etudiant
GRANT SELECT, INSERT, UPDATE ON etudiant TO role_secretaire;

-- Table: Enseignant Responsable
GRANT SELECT, UPDATE ON enseignant_responsable TO role_secretaire;

-- Table: Document (ResponsabiliteCivile)
GRANT SELECT ON document TO role_secretaire;

-- Table: Notifications
GRANT SELECT ON notification TO role_secretaire;

-- Séquences nécessaires
GRANT USAGE, SELECT ON utilisateur_id_seq TO role_secretaire;

-- =====================================================
-- RÔLE ENSEIGNANT RESPONSABLE (role_enseignant)
-- =====================================================
-- Table: Enseignant_Responsable
GRANT SELECT, UPDATE ON enseignant_responsable TO role_enseignant;

-- Table: Secrétaire
GRANT SELECT, UPDATE ON secretaire TO role_enseignant;

-- Table: Utilisateur
GRANT SELECT, INSERT, UPDATE ON utilisateur TO role_enseignant;

-- Table: Etudiant
GRANT SELECT, INSERT, UPDATE ON etudiant TO role_enseignant;

-- Table: Entreprise
GRANT SELECT, UPDATE ON entreprise TO role_enseignant;

-- Table: Archive Entreprise
GRANT SELECT ON archive_entreprise TO role_enseignant;

-- Table: Offre
GRANT SELECT, UPDATE ON offre TO role_enseignant;

-- Table: Candidature
GRANT SELECT, UPDATE ON candidature TO role_enseignant;

-- Table: Bareme_Remuneration
GRANT SELECT, INSERT, UPDATE, DELETE ON bareme_remuneration TO role_enseignant;

-- Table: Document (ResponsabiliteCivile)
GRANT SELECT ON document TO role_enseignant;

-- Table: Notifications
GRANT SELECT ON notification TO role_enseignant;

-- Séquences nécessaires (pour droits secrétaire si en congé)
GRANT USAGE, SELECT ON utilisateur_id_seq TO role_enseignant;
GRANT USAGE, SELECT ON bareme_remuneration_id_seq TO role_enseignant;

-- =====================================================
-- RÔLE ENTREPRISE (role_entreprise)
-- =====================================================
-- Table: Utilisateur
GRANT SELECT, UPDATE ON utilisateur TO role_entreprise;

-- Table: Entreprise
GRANT SELECT, UPDATE ON entreprise TO role_entreprise;

-- Table: Offre
GRANT SELECT, INSERT, UPDATE ON offre TO role_entreprise;

-- Table: Candidature
GRANT SELECT, UPDATE ON candidature TO role_entreprise;

-- Table: Etudiant
GRANT SELECT ON etudiant TO role_entreprise;

-- Table: Bareme_Remuneration
GRANT SELECT ON bareme_remuneration TO role_entreprise;

-- Table: Notifications
GRANT SELECT ON notification TO role_entreprise;

-- Séquences nécessaires
GRANT USAGE, SELECT ON offre_id_seq TO role_entreprise;

-- =====================================================
-- VÉRIFICATION DES PERMISSIONS
-- =====================================================
-- Exécuter pour vérifier:
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE grantee LIKE 'role_%'
-- ORDER BY grantee, table_name;
