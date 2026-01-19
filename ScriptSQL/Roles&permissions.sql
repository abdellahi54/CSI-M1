



/* hada bch nconnecti bih f l'application */
CREATE ROLE app_user LOGIN PASSWORD 'chkoupi';

/* Aucun droit  pour l'application */
REVOKE ALL ON SCHEMA public FROM app_user;


/* 
   RÔLES MÉTIER
   */

/* Étudiant */
CREATE ROLE role_etudiant;

/* Entreprise */
CREATE ROLE role_entreprise;

/* Secrétaire */
CREATE ROLE role_secretaire;

/* Enseignant responsable */
CREATE ROLE role_enseignant;

/* Administrateur  */
CREATE ROLE role_admin;


/* 
  DROITS COMMUNS
   */

/* Autoriser l'accès au schéma */
GRANT USAGE ON SCHEMA csi TO
    role_etudiant,
    role_entreprise,
    role_secretaire,
    role_enseignant,
    role_admin;


/*
   DROITS UTILISATEUR
    */

/* Étudiant : lecture de son compte */
GRANT SELECT ON utilisateur TO role_etudiant;

/* Entreprise : lecture + modification de son compte */
GRANT SELECT, UPDATE ON utilisateur TO role_entreprise;

/* Secrétaire : gestion des comptes étudiants */
GRANT SELECT, INSERT, UPDATE ON utilisateur TO role_secretaire;

/* Enseignant responsable : supervision globale */
GRANT SELECT, INSERT, UPDATE ON utilisateur TO role_enseignant;

/* Administrateur : création des comptes enseignant / secrétaire */
GRANT SELECT, INSERT, UPDATE ON utilisateur TO role_admin;


/*
   DROITS – ETUDIANT
  */

GRANT SELECT, UPDATE ON etudiant TO role_etudiant;
GRANT SELECT, INSERT, UPDATE ON etudiant TO role_secretaire;
GRANT SELECT, INSERT, UPDATE ON etudiant TO role_enseignant;


/* 
    DROITS ENTREPRISE
    */

GRANT SELECT, UPDATE ON entreprise TO role_entreprise;
GRANT SELECT ON entreprise TO role_etudiant;
GRANT SELECT, UPDATE ON entreprise TO role_enseignant;


/*
   DROITS OFFRE
  */

/* Consultation */
GRANT SELECT ON offre TO
    role_etudiant,
    role_entreprise,
    role_enseignant;

/* Dépôt et modification */
GRANT INSERT, UPDATE ON offre TO role_entreprise;

/* Validation / refus */
GRANT UPDATE ON offre TO role_enseignant;


/* 
   DROITS CANDIDATURE
   */

/* Étudiant : déposer et suivre ses candidatures */
GRANT SELECT, INSERT, UPDATE ON candidature TO role_etudiant;

/* Entreprise : accepter / refuser */
GRANT SELECT, UPDATE ON candidature TO role_entreprise;

/* Enseignant : validation finale */
GRANT SELECT, UPDATE ON candidature TO role_enseignant;


/* 
   DROITS DOCUMENT
   */

/* Étudiant : gérer ses documents */
GRANT SELECT, INSERT, UPDATE, DELETE ON responsabiliteCivile TO role_etudiant;

/* Secrétaire : consulter et valider RC */
GRANT SELECT, UPDATE ON responsabiliteCivile TO role_secretaire;

/* Enseignant : consultation et validation déléguée */
GRANT SELECT, UPDATE ON responsabiliteCivile TO role_enseignant;


/* 
   DROITS BAREME_REMUNERATION
   */

/* Consultation */
GRANT SELECT ON bareme_remuneration TO
    role_etudiant,
    role_entreprise,
    role_enseignant;

/* Gestion des barèmes */
GRANT INSERT, UPDATE, DELETE ON bareme_remuneration TO role_enseignant;


/* 
    DROITS ARCHIVES
    */

/* Consultation des archives */
GRANT SELECT ON archive_offre, archive_entreprise TO role_enseignant;

/* Gestion technique des archives (système) */
GRANT INSERT, DELETE ON archive_offre, archive_entreprise TO role_admin;

/* 
    DROITS notification
    */
GRANT SELECT ON notification TO
    role_etudiant,
    role_entreprise,
    role_secretaire,
    role_enseignant;


GRANT SELECT, INSERT, UPDATE, DELETE ON notification TO app_user;

GRANT SELECT, DELETE ON notification TO role_admin;

REVOKE ALL ON notification FROM csi;






/* Le backend peut activer dynamiquement les rôles */
GRANT
    role_etudiant,
    role_entreprise,
    role_secretaire,
    role_enseignant,
    role_admin
TO app_user;
