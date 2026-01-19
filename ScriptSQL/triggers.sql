
/* RC obligatoire pour candidater*/

CREATE OR REPLACE FUNCTION check_rc_validee()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM etudiant
        WHERE id = NEW.etudiant_id
          AND responsabilite_civile = TRUE
    ) THEN
        INSERT INTO notification (
            identifiantutilisateur,
            objet,
            message
        )
        VALUES (
            NEW.etudiant_id,
            'Candidature refusée',
            'Votre candidature a été refusée : responsabilité civile non validée.'
        );

        RAISE EXCEPTION
        'RC non validée';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_rc
BEFORE INSERT ON candidature
FOR EACH ROW
EXECUTE FUNCTION check_rc_validee();


/*Refus d’une offre avec notification entreprise*/

CREATE OR REPLACE FUNCTION check_refus_offre()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.etat = 'NON VALDEE' THEN
        INSERT INTO notification (
            identifiantutilisateur,
            objet,
            message
        )
        VALUES (
            NEW.entreprise_id,
            'Offre refusée',
            'Votre offre a été refusée par le responsable pédagogique.'
        );

        IF NEW.justification IS NULL THEN
            RAISE EXCEPTION
            'Justification obligatoire pour un refus';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refus_offre
BEFORE UPDATE ON offre
FOR EACH ROW
EXECUTE FUNCTION check_refus_offre();


CREATE OR REPLACE FUNCTION check_delai_validation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'VALIDEE'
       AND OLD.statut = 'ACCEPTEE ENTREPRISE'
       AND (CURRENT_TIMESTAMP - OLD.date_candidature) > INTERVAL '48 hours'
    THEN
        INSERT INTO notification (
            identifiantutilisateur,
            objet,
            message
        )
        SELECT
            u.id,
            'Délai de validation dépassé',
            'Une candidature a dépassé le délai de validation autorisé de 48 heures.'
        FROM utilisateur u
        WHERE u.role = 'ENSEIGNANT RESPONSABLE';

        INSERT INTO notification (
            identifiantutilisateur,
            objet,
            message
        )
        SELECT
            u.id,
            'Relance validation candidature',
            'Merci de procéder à la validation ou au refus de la candidature concernée.'
        FROM utilisateur u
        WHERE u.role = 'ENSEIGNANT RESPONSABLE';

        RAISE EXCEPTION 'Délai de validation dépassé';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_delai_validation
BEFORE UPDATE ON candidature
FOR EACH ROW
EXECUTE FUNCTION check_delai_validation();


/*Renoncement automatique des autres candidatures*/

CREATE OR REPLACE FUNCTION auto_renoncement_etudiant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'VALIDEE' THEN
        UPDATE candidature
        SET statut = 'RENONCEE'
        WHERE etudiant_id = NEW.etudiant_id
          AND id <> NEW.id;

        INSERT INTO notification (
            identifiantutilisateur,
            objet,
            message
        )
        VALUES (
            NEW.etudiant_id,
            'Candidatures annulées',
            'Vos autres candidatures ont été annulées suite à une validation.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_renoncement_etudiant
AFTER UPDATE OF statut ON candidature
FOR EACH ROW
EXECUTE FUNCTION auto_renoncement_etudiant();


/*Rejet des autres candidatures sur une offre*/

CREATE OR REPLACE FUNCTION auto_rejet_offre()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'VALIDEE' THEN

        -- Rejet des autres candidatures sur la même offre
        UPDATE candidature
        SET statut = 'REJETEE ENTREPRISE'
        WHERE offre_id = NEW.offre_id
          AND id <> NEW.id;

        -- Notification des étudiants dont la candidature est rejetée
        INSERT INTO notification (
            identifiantutilisateur,
            objet,
            message
        )
        SELECT
            c.etudiant_id,
            'Candidature rejetée',
            'Votre candidature a été rejetée car une autre candidature a été validée pour cette offre.'
        FROM candidature c
        WHERE c.offre_id = NEW.offre_id
          AND c.id <> NEW.id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_rejet_offre
AFTER UPDATE OF statut ON candidature
FOR EACH ROW
EXECUTE FUNCTION auto_rejet_offre();


/* Contrôle de la rémunération légale*/

CREATE OR REPLACE FUNCTION check_remuneration_legale()
RETURNS TRIGGER AS $$
DECLARE
    montant_min INTEGER;
BEGIN
    SELECT montant_minimal
    INTO montant_min
    FROM bareme_remuneration
    WHERE type_offre = NEW.type
      AND pays = NEW.pays
      AND NEW.date_expiration - NEW.date_debut BETWEEN duree_min AND duree_max;

    IF montant_min IS NOT NULL AND NEW.remuneration < montant_min THEN
        INSERT INTO notification (
            identifiantutilisateur,
            objet,
            message
        )
        VALUES (
            NEW.entreprise_id,
            'Rémunération non conforme',
            'La rémunération proposée est inférieure au minimum légal.'
        );

        RAISE EXCEPTION 'Rémunération illégale';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_remuneration_legale
BEFORE INSERT OR UPDATE ON offre
FOR EACH ROW
EXECUTE FUNCTION check_remuneration_legale();



/* Mise à jour date dernière offre*/
CREATE OR REPLACE FUNCTION maj_date_derniere_offre()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE entreprise
    SET date_derniere_offre = CURRENT_DATE
    WHERE id = NEW.entreprise_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maj_date_derniere_offre
AFTER INSERT ON offre
FOR EACH ROW
EXECUTE FUNCTION maj_date_derniere_offre();





/* Archivage annuel des offres */

CREATE OR REPLACE FUNCTION archive_offres_annuelles()
RETURNS VOID AS $$
BEGIN
    INSERT INTO notification (
        identifiantutilisateur,
        objet,
        message
    )
    SELECT
        entreprise_id,
        'Offre archivée',
        'Votre offre a été archivée en fin d’année universitaire.'
    FROM offre;

    INSERT INTO archive_offre (
        description,
        date_depot,
        statut,
        date_archivage,
        num_etudiant,
        nom_etudiant,
        prenom_etudiant
    )
    SELECT
        o.description,
        o.date_debut,
        o.statut,
        CURRENT_DATE,
        e.num_etudiant,
        e.nom,
        e.prenom
    FROM offre o
    LEFT JOIN candidature c ON c.offre_id = o.id AND c.statut = 'VALIDEE'
    LEFT JOIN etudiant e ON e.id = c.etudiant_id;

    DELETE FROM offre;
END;
$$ LANGUAGE plpgsql;


/* Archivage entreprises inactives */

CREATE OR REPLACE FUNCTION archive_entreprises_inactives()
RETURNS VOID AS $$
BEGIN
    INSERT INTO notification (
        identifiantutilisateur,
        objet,
        message
    )
    SELECT
        id,
        'Entreprise archivée',
        'Votre entreprise a été archivée pour inactivité.'
    FROM entreprise
    WHERE date_derniere_offre < CURRENT_DATE - INTERVAL '3 years';

    INSERT INTO archive_entreprise (
        siret,
        raison_sociale,
        adresse,
        forme_juridique,
        date_creation,
        date_archivage,
        motif_archivage
    )
    SELECT
        siret,
        raison_sociale,
        adresse,
        forme_juridique,
        date_creation,
        CURRENT_DATE,
        'Inactivité supérieure à 3 ans'
    FROM entreprise
    WHERE date_derniere_offre < CURRENT_DATE - INTERVAL '3 years';

    DELETE FROM entreprise
    WHERE date_derniere_offre < CURRENT_DATE - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql;


/* delete annuelle des étudiants */

CREATE OR REPLACE FUNCTION delete_tous_les_etudiants()
RETURNS VOID AS $$
BEGIN
    INSERT INTO notification (
        identifiantutilisateur,
        objet,
        message
    )
    SELECT
        id,
        'Fin d’année universitaire',
        'Votre compte étudiant est supprimé suite à la clôture annuelle.'
    FROM etudiant;

    DELETE FROM etudiant;
END;
$$ LANGUAGE plpgsql;

/* delete annuelle des notifications */
CREATE OR REPLACE FUNCTION purge_notifications_annuelles()
RETURNS VOID AS $$
BEGIN
    DELETE FROM notification;
END;
$$ LANGUAGE plpgsql;
