



/* Un email doit être unique (authentification, sécurité) */
ALTER TABLE utilisateur
ADD CONSTRAINT uq_utilisateur_email UNIQUE (email);




/* Année de formation cohérente */
ALTER TABLE etudiant
ADD CONSTRAINT chk_annee_formation
CHECK (annee_formation >= 1 AND annee_formation <= 5);

/* La date de naissance ne peut pas être dans le futur */
ALTER TABLE etudiant
ADD CONSTRAINT chk_date_naissance
CHECK (date_naissance < CURRENT_DATE);




/* Le SIRET doit contenir exactement 14 chiffres (règle légale) */
ALTER TABLE entreprise
ADD CONSTRAINT chk_siret_format
CHECK (siret ~ '^[0-9]{14}$');




/* Une offre doit expirer après sa date de début */
ALTER TABLE offre
ADD CONSTRAINT chk_dates_offre
CHECK (date_expiration > date_debut);

/* La rémunération proposée doit être strictement positive */
ALTER TABLE offre
ADD CONSTRAINT chk_remuneration_positive
CHECK (remuneration > 0);

/* Les offres en alternance doivent obligatoirement être en France */
ALTER TABLE offre
ADD CONSTRAINT chk_alternance_france
CHECK (
    NOT (type = 'ALTERNANCE' AND pays <> 'France')
);




/* Un étudiant ne peut candidater qu'une seule fois à une même offre */
ALTER TABLE candidature
ADD CONSTRAINT uq_candidature_unique
UNIQUE (etudiant_id, offre_id);

/* Une justification est obligatoire en cas de renoncement ou de refus par l’enseignant responsable */
ALTER TABLE candidature
ADD CONSTRAINT chk_justification_obligatoire
CHECK (
    statut NOT IN ('RENONCEE', 'REFUSEE RESPONSABLE')
    OR justification IS NOT NULL
);




/* Un étudiant ne peut avoir qu’un seul document de type RC (remplaçable si nécessaire) */
ALTER TABLE document
ADD CONSTRAINT uq_rc_unique
UNIQUE (etudiant_id, type)
DEFERRABLE INITIALLY DEFERRED;




/* La durée minimale doit être inférieure à la durée maximale */
ALTER TABLE bareme_remuneration
ADD CONSTRAINT chk_duree_bareme
CHECK (duree_min < duree_max);

/* Le montant minimal doit être strictement positif */
ALTER TABLE bareme_remuneration
ADD CONSTRAINT chk_montant_bareme
CHECK (montant_minimal > 0);

/* Un barème est unique pour un type d’offre, un pays
   et une plage de durée donnée */
ALTER TABLE bareme_remuneration
ADD CONSTRAINT uq_bareme_unique
UNIQUE (type_offre, pays, duree_min, duree_max);




/* Une offre ne peut pas être archivée avant sa création */
ALTER TABLE archive_offre
ADD CONSTRAINT chk_dates_archive_offre
CHECK (date_archivage >= date_depot);




/* Une entreprise ne peut pas être archivée avant sa création */
ALTER TABLE archive_entreprise
ADD CONSTRAINT chk_dates_archive_entreprise
CHECK (date_archivage >= date_creation);
