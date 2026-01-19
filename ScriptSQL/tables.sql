CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL,
    role role_utilisateur NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE etudiant (
    id INTEGER PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    createur_compte_id INTEGER   REFERENCES utilisateur(id),
    validateur_rc_id INTEGER REFERENCES utilisateur(id),
    num_etudiant VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    formation Formation NOT NULL,
    annee_formation INTEGER NOT NULL,
    statut statut_etudiant NOT NULL,
    visibilite BOOLEAN NOT NULL DEFAULT FALSE,
    responsabilite_civile BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE entreprise (
    id INTEGER PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    siret VARCHAR(20) NOT NULL UNIQUE,
    raison_sociale VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    forme_juridique VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation DATE NOT NULL DEFAULT CURRENT_DATE,
    date_derniere_offre DATE
);


CREATE TABLE enseignant_responsable (
    id INTEGER PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    droits_secretaire BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE secretaire (
    id INTEGER PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    en_conge BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE offre (
    id SERIAL PRIMARY KEY,
    entreprise_id INTEGER NOT NULL REFERENCES entreprise(id) ON DELETE CASCADE,
    type type_offre NOT NULL,
    enseignant_validateur_id INTEGER REFERENCES enseignant_responsable(id),
    description TEXT NOT NULL,
    remuneration INTEGER NOT NULL,
    pays VARCHAR(100) NOT NULL,
    ville VARCHAR(100),
    duree INTEGER NOT NULL,
    date_debut DATE NOT NULL,
    date_expiration DATE NOT NULL,
    statut statut_offre NOT NULL,
    etat etat_offre NOT NULL
);


CREATE TABLE candidature (
    id SERIAL PRIMARY KEY,
    enseignant_validateur_id INTEGER REFERENCES enseignant_responsable(id),
    etudiant_id INTEGER NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
    offre_id INTEGER NOT NULL REFERENCES offre(id) ON DELETE CASCADE,
    
    bareme_remuneration_id INTEGER REFERENCES bareme_remuneration(id),
    statut statut_candidature NOT NULL,
    date_candidature TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE responsabiliteCivile (
    id SERIAL PRIMARY KEY,
    etudiant_id INTEGER NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
    nom_fichier VARCHAR(255) NOT NULL,
    --date_depot TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    --valide BOOLEAN suggestion de hakim 
);


CREATE TABLE bareme_remuneration (
    id SERIAL PRIMARY KEY,
    type_offre type_offre NOT NULL,
    pays VARCHAR(100) NOT NULL, 
    duree_min INTEGER NOT NULL,
    duree_max INTEGER NOT NULL,
    montant_minimal INTEGER NOT NULL
);


CREATE TABLE archive_offre (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    date_depot DATE NOT NULL,
    statut statut_offre NOT NULL,
    date_archivage DATE NOT NULL,
    --num_etudiant VARCHAR(50), on garde nom c'est mieux psq num etududiant vas être supprimé
    nom_etudiant VARCHAR(100),
);

CREATE TABLE admin (
    id INTEGER PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
);

CREATE TABLE archive_entreprise (
    id SERIAL PRIMARY KEY,
    siret VARCHAR(20) NOT NULL,
    raison_sociale VARCHAR(255) NOT NULL,
    date_archivage DATE NOT NULL,
);


CREATE TABLE notification (
    identifiant SERIAL PRIMARY KEY,
    identifiantutilisateur INTEGER NOT NULL
        REFERENCES utilisateur(id) ON DELETE CASCADE,
    objet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date_notification DATE NOT NULL DEFAULT CURRENT_DATE
);
