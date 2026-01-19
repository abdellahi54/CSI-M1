CREATE TYPE role_utilisateur AS ENUM (
  'ETUDIANT',
  'ENTREPRISE',
  'ENSEIGNANT RESPONSABLE',
  'SECRETAIRE',
  'ADMIN'
);

CREATE TYPE statut_offre AS ENUM (
  'ACTIVE',
  'NON ACTIVE'
);

CREATE TYPE statut_candidature AS ENUM (
  'SOUMISE',     
  'ANNULEE',
  'ACCEPTEE ENTREPRISE',
  'REJETEE ENTREPRISE',
  'VALIDEE',
  'RENONCEE',
  'REFUSEE RESPONSABLE'
);


CREATE TYPE type_offre AS ENUM (
  'STAGE',
  'ALTERNANCE',
  'CDD'
);

CREATE TYPE statut_etudiant AS ENUM (
  'EN_RECHERCHE',
  'NON_DISPONIBLE'
);

/*CREATE TYPE type_document AS ENUM (
  'RC',
  'CV',
  'LETTRE_MOTIVATION',
  'AUTRE'
);*/

CREATE TYPE etat_offre AS ENUM (
  'VALDEE',
  'NON VALDEE',
  'EN ATTENTE DE VALIDATION'
);

CREATE TYPE Formation AS ENUM (
  'MIAGE',
  'TAL',
  'SCIENCES_COGNITIVES'
);

CREATE TYPE AnneeFormation AS ENUM (
  'L1',
  'L2',
  'L3',
  'M1', 
  'M2'
);

CREATE TYPE Justifications AS ENUM (
  'informations manquantes',
  'rémunération non conforme'
);




