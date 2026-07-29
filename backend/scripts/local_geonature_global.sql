-- Base geonature_global MINIMALE pour le développement local.
-- Généré depuis les définitions des tables étrangères du dump ancrage :
-- en production, ancrage lit ses utilisateurs via postgres_fdw sur cette base.
-- Ne contient que le schéma utilisateurs, sans les données GeoNature.

CREATE SCHEMA IF NOT EXISTS utilisateurs;

CREATE TABLE IF NOT EXISTS utilisateurs.bib_organismes (
id_organisme integer PRIMARY KEY,
    uuid_organisme uuid NOT NULL,
    nom_organisme character varying(500) NOT NULL,
    adresse_organisme character varying(128),
    cp_organisme character varying(5),
    ville_organisme character varying(100),
    tel_organisme character varying(14),
    fax_organisme character varying(14),
    email_organisme character varying(100),
    url_organisme character varying(255),
    url_logo character varying(255),
    id_parent integer,
    additional_data jsonb,
    meta_create_date timestamp without time zone,
    meta_update_date timestamp without time zone
);

CREATE TABLE IF NOT EXISTS utilisateurs.cor_profil_for_app (
id_profil integer NOT NULL,
    id_application integer NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateurs.cor_role_app_profil (
id_role integer NOT NULL,
    id_application integer NOT NULL,
    id_profil integer NOT NULL,
    is_default_group_for_app boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateurs.cor_role_liste (
id_role integer NOT NULL,
    id_liste integer NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateurs.cor_role_provider (
id_role integer NOT NULL,
    id_provider integer NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateurs.cor_role_token (
id_role integer NOT NULL,
    token text
);

CREATE TABLE IF NOT EXISTS utilisateurs.cor_roles (
id_role_groupe integer NOT NULL,
    id_role_utilisateur integer NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateurs.t_applications (
id_application integer PRIMARY KEY,
    code_application character varying(20) NOT NULL,
    nom_application character varying(50) NOT NULL,
    desc_application text,
    id_parent integer
);

CREATE TABLE IF NOT EXISTS utilisateurs.t_listes (
id_liste integer PRIMARY KEY,
    code_liste character varying(20) NOT NULL,
    nom_liste character varying(50) NOT NULL,
    desc_liste text
);

CREATE TABLE IF NOT EXISTS utilisateurs.t_profils (
id_profil integer PRIMARY KEY,
    code_profil integer,
    nom_profil character varying(255),
    desc_profil text
);

CREATE TABLE IF NOT EXISTS utilisateurs.t_providers (
id_provider integer PRIMARY KEY,
    name character varying NOT NULL,
    url character varying
);

CREATE TABLE IF NOT EXISTS utilisateurs.t_roles (
groupe boolean NOT NULL,
    id_role integer PRIMARY KEY,
    uuid_role uuid NOT NULL,
    identifiant character varying(100),
    nom_role character varying(50),
    prenom_role character varying(50),
    desc_role text,
    pass character varying(100),
    pass_plus text,
    email character varying(250),
    id_organisme integer,
    remarques text,
    active boolean,
    champs_addi jsonb,
    date_insert timestamp without time zone,
    date_update timestamp without time zone
);

CREATE TABLE IF NOT EXISTS utilisateurs.temp_users (
id_temp_user integer NOT NULL,
    token_role text,
    organisme character varying(250),
    id_application integer NOT NULL,
    confirmation_url character varying(250),
    groupe boolean NOT NULL,
    identifiant character varying(100),
    nom_role character varying(50),
    prenom_role character varying(50),
    desc_role text,
    pass_md5 text,
    password text,
    email character varying(250),
    id_organisme integer,
    remarques text,
    champs_addi jsonb,
    date_insert timestamp without time zone,
    date_update timestamp without time zone
);

CREATE TABLE IF NOT EXISTS utilisateurs.v_id_organisme_seq (
a bigint
);

CREATE TABLE IF NOT EXISTS utilisateurs.v_roleslist_forall_applications (
groupe boolean,
    active boolean,
    id_role integer,
    identifiant character varying(100),
    nom_role character varying(50),
    prenom_role character varying(50),
    desc_role text,
    pass character varying(100),
    pass_plus text,
    email character varying(250),
    id_organisme integer,
    organisme character varying(500),
    id_unite integer,
    remarques text,
    date_insert timestamp without time zone,
    date_update timestamp without time zone,
    id_droit_max integer,
    id_application integer
);

CREATE TABLE IF NOT EXISTS utilisateurs.v_roleslist_with_unique_id (
unique_id bigint,
    id_role integer,
    id_application integer,
    id_droit_max integer
);

CREATE TABLE IF NOT EXISTS utilisateurs.v_userslist_forall_applications (
groupe boolean,
    active boolean,
    id_role integer,
    identifiant character varying(100),
    nom_role character varying(50),
    prenom_role character varying(50),
    desc_role text,
    pass character varying(100),
    pass_plus text,
    email character varying(250),
    id_organisme integer,
    organisme character varying(500),
    id_unite integer,
    remarques text,
    date_insert timestamp without time zone,
    date_update timestamp without time zone,
    id_droit_max integer,
    id_application integer
);

CREATE TABLE IF NOT EXISTS utilisateurs.v_userslist_forall_menu (
groupe boolean,
    id_role integer,
    uuid_role uuid,
    identifiant character varying(100),
    nom_role character varying(50),
    prenom_role character varying(50),
    nom_complet text,
    desc_role text,
    pass character varying(100),
    pass_plus text,
    email character varying(250),
    id_organisme integer,
    organisme character varying(500),
    id_unite integer,
    remarques text,
    date_insert timestamp without time zone,
    date_update timestamp without time zone,
    id_menu integer
);
