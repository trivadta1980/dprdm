--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: approval_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.approval_status AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.approval_status OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    last_used_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer
);


ALTER TABLE public.api_keys OWNER TO neondb_owner;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_keys_id_seq OWNER TO neondb_owner;

--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: crosswalk_mappings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.crosswalk_mappings (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    source_system_id integer NOT NULL,
    target_system_id integer NOT NULL,
    mapping_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    approval_status public.approval_status DEFAULT 'DRAFT'::public.approval_status NOT NULL,
    approved_by integer,
    approved_at timestamp without time zone,
    change_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by text,
    last_modified_by text
);


ALTER TABLE public.crosswalk_mappings OWNER TO neondb_owner;

--
-- Name: crosswalk_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.crosswalk_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crosswalk_mappings_id_seq OWNER TO neondb_owner;

--
-- Name: crosswalk_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.crosswalk_mappings_id_seq OWNED BY public.crosswalk_mappings.id;


--
-- Name: missing_mappings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.missing_mappings (
    id integer NOT NULL,
    crosswalk_id integer NOT NULL,
    source_value text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    last_requested_at timestamp with time zone DEFAULT now() NOT NULL,
    request_count integer DEFAULT 1 NOT NULL,
    request_user_id integer,
    request_context text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.missing_mappings OWNER TO neondb_owner;

--
-- Name: missing_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.missing_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.missing_mappings_id_seq OWNER TO neondb_owner;

--
-- Name: missing_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.missing_mappings_id_seq OWNED BY public.missing_mappings.id;


--
-- Name: reference_data_sets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reference_data_sets (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    type_id integer NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reference_data_sets OWNER TO neondb_owner;

--
-- Name: reference_data_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reference_data_sets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reference_data_sets_id_seq OWNER TO neondb_owner;

--
-- Name: reference_data_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reference_data_sets_id_seq OWNED BY public.reference_data_sets.id;


--
-- Name: reference_data_type_schemas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reference_data_type_schemas (
    id integer NOT NULL,
    reference_data_type_id integer NOT NULL,
    name text NOT NULL,
    data_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reference_data_type_schemas OWNER TO neondb_owner;

--
-- Name: reference_data_type_schemas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reference_data_type_schemas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reference_data_type_schemas_id_seq OWNER TO neondb_owner;

--
-- Name: reference_data_type_schemas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reference_data_type_schemas_id_seq OWNED BY public.reference_data_type_schemas.id;


--
-- Name: reference_data_types; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reference_data_types (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reference_data_types OWNER TO neondb_owner;

--
-- Name: reference_data_types_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reference_data_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reference_data_types_id_seq OWNER TO neondb_owner;

--
-- Name: reference_data_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reference_data_types_id_seq OWNED BY public.reference_data_types.id;


--
-- Name: relationship_attribute_definitions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.relationship_attribute_definitions (
    id integer NOT NULL,
    relationship_type_id integer NOT NULL,
    name text NOT NULL,
    data_type text NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.relationship_attribute_definitions OWNER TO neondb_owner;

--
-- Name: relationship_attribute_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.relationship_attribute_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relationship_attribute_definitions_id_seq OWNER TO neondb_owner;

--
-- Name: relationship_attribute_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.relationship_attribute_definitions_id_seq OWNED BY public.relationship_attribute_definitions.id;


--
-- Name: relationship_attribute_values; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.relationship_attribute_values (
    id integer NOT NULL,
    relationship_value_id integer NOT NULL,
    attribute_definition_id integer NOT NULL,
    value text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.relationship_attribute_values OWNER TO neondb_owner;

--
-- Name: relationship_attribute_values_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.relationship_attribute_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relationship_attribute_values_id_seq OWNER TO neondb_owner;

--
-- Name: relationship_attribute_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.relationship_attribute_values_id_seq OWNED BY public.relationship_attribute_values.id;


--
-- Name: relationship_value_approvals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.relationship_value_approvals (
    id integer NOT NULL,
    relationship_value_id integer NOT NULL,
    requester_id integer NOT NULL,
    approver_id integer,
    status public.approval_status NOT NULL,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    actioned_at timestamp without time zone,
    comments text,
    change_details jsonb NOT NULL,
    notification_sent boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.relationship_value_approvals OWNER TO neondb_owner;

--
-- Name: relationship_value_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.relationship_value_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relationship_value_approvals_id_seq OWNER TO neondb_owner;

--
-- Name: relationship_value_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.relationship_value_approvals_id_seq OWNED BY public.relationship_value_approvals.id;


--
-- Name: relationship_values; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.relationship_values (
    id integer NOT NULL,
    relationship_id integer NOT NULL,
    source_instance_id text NOT NULL,
    target_instance_id text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    approval_status public.approval_status DEFAULT 'DRAFT'::public.approval_status NOT NULL,
    last_approved_version jsonb,
    last_modified_by integer,
    approved_by integer,
    approved_at timestamp without time zone,
    change_history jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.relationship_values OWNER TO neondb_owner;

--
-- Name: relationship_values_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.relationship_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relationship_values_id_seq OWNER TO neondb_owner;

--
-- Name: relationship_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.relationship_values_id_seq OWNED BY public.relationship_values.id;


--
-- Name: relationships; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.relationships (
    id integer NOT NULL,
    source_dataset_id integer NOT NULL,
    target_dataset_id integer NOT NULL,
    relationship_type text NOT NULL,
    cardinality text NOT NULL,
    source_field text NOT NULL,
    target_field text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    relationship_name text NOT NULL
);


ALTER TABLE public.relationships OWNER TO neondb_owner;

--
-- Name: relationships_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.relationships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relationships_id_seq OWNER TO neondb_owner;

--
-- Name: relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.relationships_id_seq OWNED BY public.relationships.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    route_permissions text[],
    routes text[]
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    role_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    reset_token text,
    reset_token_expiry timestamp without time zone,
    require_password_change boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users_role_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_role_id_seq OWNER TO neondb_owner;

--
-- Name: users_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_role_id_seq OWNED BY public.users.role_id;


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: crosswalk_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crosswalk_mappings ALTER COLUMN id SET DEFAULT nextval('public.crosswalk_mappings_id_seq'::regclass);


--
-- Name: missing_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.missing_mappings ALTER COLUMN id SET DEFAULT nextval('public.missing_mappings_id_seq'::regclass);


--
-- Name: reference_data_sets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_sets ALTER COLUMN id SET DEFAULT nextval('public.reference_data_sets_id_seq'::regclass);


--
-- Name: reference_data_type_schemas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_type_schemas ALTER COLUMN id SET DEFAULT nextval('public.reference_data_type_schemas_id_seq'::regclass);


--
-- Name: reference_data_types id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_types ALTER COLUMN id SET DEFAULT nextval('public.reference_data_types_id_seq'::regclass);


--
-- Name: relationship_attribute_definitions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationship_attribute_definitions ALTER COLUMN id SET DEFAULT nextval('public.relationship_attribute_definitions_id_seq'::regclass);


--
-- Name: relationship_attribute_values id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationship_attribute_values ALTER COLUMN id SET DEFAULT nextval('public.relationship_attribute_values_id_seq'::regclass);


--
-- Name: relationship_value_approvals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationship_value_approvals ALTER COLUMN id SET DEFAULT nextval('public.relationship_value_approvals_id_seq'::regclass);


--
-- Name: relationship_values id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationship_values ALTER COLUMN id SET DEFAULT nextval('public.relationship_values_id_seq'::regclass);


--
-- Name: relationships id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationships ALTER COLUMN id SET DEFAULT nextval('public.relationships_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_keys (id, key, name, description, created_at, updated_at, expires_at, last_used_at, is_active, created_by) FROM stdin;
3	d10f5a831c68b3cf016d1921c8d1c6b7bac261cb35535d34c5d4525e5f36627d	KeyforDemo		2025-03-29 16:09:04.307	2025-03-29 16:09:04.307	2025-04-30 07:00:00	2025-04-22 09:45:59.436	t	1
\.


--
-- Data for Name: crosswalk_mappings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.crosswalk_mappings (id, name, description, source_system_id, target_system_id, mapping_data, created_at, updated_at, approval_status, approved_by, approved_at, change_history, created_by, last_modified_by) FROM stdin;
19	SFDC Country to Enterprise Country	SFDC Country to Enterprise Country	5	1	{"mappings": [{"status": "APPROVED", "confidence": 0.7, "sourceValue": "Australia1", "targetValue": "Australia"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Brazil1", "targetValue": "Brazil"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Canada1", "targetValue": "Canada"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Brazil1", "targetValue": "Denmark"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Egypt1", "targetValue": "Brazil"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "France1", "targetValue": "France"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Germany1", "targetValue": "Germany"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Hungary1", "targetValue": "Hungary"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Indonesia1", "targetValue": "Indonesia"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Japan1", "targetValue": "Japan"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "India1", "targetValue": "India"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Dub", "targetValue": "dub"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Phoenix", "targetValue": "phoenix"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "SFO1", "targetValue": "test"}, {"status": "APPROVED", "confidence": 0.65, "sourceValue": "Dub", "targetValue": "test"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Phoenix", "targetValue": "test"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Phoenix", "targetValue": "Egypt"}], "sourceAttribute": "Country", "targetAttribute": "Country"}	2025-03-23 03:00:24.731411	2025-04-17 00:15:18.106	DRAFT	\N	\N	[{"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-14T01:28:40.107Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-15T18:41:25.364Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-15T18:42:02.492Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-17T00:15:18.106Z", "prevStatus": "PENDING"}]	\N	\N
2	Enterprise Cities - SFDC Cities	Map Enterprise Cities to SFDC Cities	7	6	{"mappings": [{"status": "APPROVED", "confidence": 0.575, "sourceValue": "SFO2", "targetValue": "San Francisco1"}, {"status": "APPROVED", "confidence": 0.9, "sourceValue": "Dub", "targetValue": "San Francisco1"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "SFO1", "targetValue": "SFO1"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Phoenix", "targetValue": "Phoenix"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Los Angeles", "targetValue": "Los Angeles"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "San Diego", "targetValue": "San Francisco1"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Las Vegas", "targetValue": "Dublin1"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "San Diego", "targetValue": "Dublin1"}, {"status": "APPROVED", "confidence": 0.75, "sourceValue": "Las Vegas", "targetValue": "test"}], "sourceAttribute": "City", "targetAttribute": "City"}	2025-02-28 00:33:01.046616	2025-04-22 09:39:53.866	DRAFT	\N	\N	[{"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-14T23:29:23.555Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-14T23:59:00.871Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-15T00:02:32.368Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-15T00:27:08.884Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-15T00:56:04.121Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-16T09:49:02.895Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-16T10:44:19.736Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-16T22:51:51.859Z", "prevStatus": "PENDING"}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-22T09:39:53.866Z", "prevStatus": "PENDING"}]	\N	\N
39	Inventory Source to Normalized CW	Thi sis a cross walk to retunr normalized values for inventory status	58	59	{"mappings": [{"status": "APPROVED", "confidence": 0.7, "sourceValue": "Available", "targetValue": "Available"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Expired", "targetValue": "Expired"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Quarantine", "targetValue": "Quarantined"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Receiving Quarantine", "targetValue": "Quarantined"}, {"status": "APPROVED", "confidence": 0.7, "sourceValue": "Returns", "targetValue": "Returned"}, {"status": "PENDING", "confidence": 0.75, "sourceValue": "Released", "targetValue": "Expired"}], "sourceAttribute": "InventoryStatusValue", "targetAttribute": "InventoryStatusValue"}	2025-04-17 20:47:01.306527	2025-04-17 20:50:17.755	PENDING	\N	\N	[{"userId": 1, "comment": "Initial submission", "newStatus": "PENDING", "timestamp": "2025-04-17T20:47:01.303Z", "prevStatus": null}, {"userId": 17, "comment": "Approved mappings", "newStatus": "APPROVED", "timestamp": "2025-04-17T20:47:18.248Z", "prevStatus": "PENDING"}]	\N	\N
\.


--
-- Data for Name: missing_mappings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.missing_mappings (id, crosswalk_id, source_value, requested_at, last_requested_at, request_count, request_user_id, request_context, created_at, updated_at) FROM stdin;
56	39	Interim Hold	2025-04-17 20:48:37.493+00	2025-04-17 20:48:37.493+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.493+00	2025-04-17 20:48:37.493+00
57	39	Pending Destruction	2025-04-17 20:48:37.6+00	2025-04-17 20:48:37.6+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.6+00	2025-04-17 20:48:37.6+00
58	39	Process Approved	2025-04-17 20:48:37.603+00	2025-04-17 20:48:37.603+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.603+00	2025-04-17 20:48:37.603+00
17	19	Phoenix	2025-04-14 22:07:52.774+00	2025-04-14 22:07:52.774+00	1	1	Transformation demo - CSV upload for SFDC Country to Enterprise Country	2025-04-14 22:07:52.774+00	2025-04-14 22:07:52.774+00
60	39	Reject	2025-04-17 20:48:37.607+00	2025-04-17 20:48:37.607+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.607+00	2025-04-17 20:48:37.607+00
27	2	Las Vegas	2025-04-16 08:33:41.133+00	2025-04-16 08:33:41.133+00	1	1	Transformation demo - CSV upload for Enterprise Cities - SFDC Cities	2025-04-16 08:33:41.133+00	2025-04-16 08:33:41.133+00
49	39	Approved	2025-04-17 20:48:37.305+00	2025-04-17 20:48:37.305+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.305+00	2025-04-17 20:48:37.305+00
50	39	Audited	2025-04-17 20:48:37.346+00	2025-04-17 20:48:37.346+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.346+00	2025-04-17 20:48:37.346+00
51	39	Awaiting Release	2025-04-17 20:48:37.377+00	2025-04-17 20:48:37.377+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.377+00	2025-04-17 20:48:37.378+00
52	39	Customer Hold	2025-04-17 20:48:37.38+00	2025-04-17 20:48:37.38+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.38+00	2025-04-17 20:48:37.38+00
53	39	GMP Approved	2025-04-17 20:48:37.445+00	2025-04-17 20:48:37.445+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.445+00	2025-04-17 20:48:37.445+00
54	39	NMR Material	2025-04-17 20:48:37.46+00	2025-04-17 20:48:37.46+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.46+00	2025-04-17 20:48:37.46+00
55	39	Pending Audit	2025-04-17 20:48:37.465+00	2025-04-17 20:48:37.465+00	1	1	Transformation demo - CSV upload for Inventory Source to Normalized CW	2025-04-17 20:48:37.465+00	2025-04-17 20:48:37.465+00
\.


--
-- Data for Name: reference_data_sets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reference_data_sets (id, name, description, type_id, data, created_at, updated_at) FROM stdin;
64	bhaviktestdataset2		42	{}	2025-04-23 19:48:11.355206	2025-04-23 19:48:11.355206
5	SFDC Countries	Countries from SFDC	1	{"instance_1": {"Country": "Australia1", "_history": [{"changes": [{"field": "Country_Code", "newValue": "AUS12", "oldValue": "AUS1"}], "timestamp": "2025-03-03T08:57:32.104Z"}], "Country_Code": "AUS12"}, "instance_2": {"Country": "Brazil1", "Country_Code": "BRA1"}, "instance_3": {"Country": "Canada1", "Country_Code": "CAN1"}, "instance_4": {"Country": "Denmark1", "Country_Code": "DNK1"}, "instance_5": {"Country": "Egypt1", "Country_Code": "EGY1"}, "instance_6": {"Country": "France1", "Country_Code": "FRA1"}, "instance_7": {"Country": "Germany1", "Country_Code": "DEU1"}, "instance_8": {"Country": "Hungary1", "Country_Code": "HUN1"}, "instance_9": {"Country": "Indonesia1", "Country_Code": "IDN1"}, "instance_10": {"Country": "Japan1", "Country_Code": "JPN1"}, "instance_11": {"Country": "India1", "_history": [{"changes": [{"field": "Country", "newValue": "India1", "oldValue": ""}, {"field": "Country_Code", "newValue": "IN1", "oldValue": ""}], "timestamp": "2025-02-23T20:07:50.273Z"}], "Country_Code": "IN1"}, "instance_12": {"status": "APPROVED", "Country": "Spain", "_history": [{"changes": [{"field": "Country", "newValue": "Spain", "oldValue": ""}, {"field": "Country_Code", "newValue": "ESP", "oldValue": ""}], "timestamp": "2025-03-12T04:45:19.229Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T21:19:30.858Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T21:19:38.833Z"}], "createdAt": "2025-03-12T04:45:19.229Z", "createdBy": "test_script", "Country_Code": "ESP", "lastModifiedAt": "2025-03-13T21:19:38.833Z", "lastModifiedBy": "jnankani"}, "instance_13": {"status": "DRAFT", "Country": "Spain", "_history": [{"changes": [{"field": "Country", "newValue": "Spain", "oldValue": ""}, {"field": "Country_Code", "newValue": "ESP", "oldValue": ""}], "timestamp": "2025-03-12T04:48:08.677Z"}], "createdAt": "2025-03-12T04:48:08.677Z", "createdBy": "test_script", "Country_Code": "ESP", "lastModifiedAt": "2025-03-12T04:48:08.677Z", "lastModifiedBy": "test_script"}}	2025-02-22 19:55:44.619774	2025-03-13 21:19:38.899
1	Enterprise Countries	This is a list of countries that are managed in the enterprise	1	{"instance_1": {"Country": "Australia", "Country_Code": "AUS"}, "instance_2": {"Country": "Brazil", "Country_Code": "BRA"}, "instance_3": {"Country": "Canada", "Country_Code": "CAN"}, "instance_4": {"Country": "Denmark", "Country_Code": "DNK"}, "instance_5": {"Country": "Egypt", "Country_Code": "EGY"}, "instance_6": {"Country": "France", "Country_Code": "FRA"}, "instance_7": {"Country": "Germany", "Country_Code": "DEU"}, "instance_8": {"Country": "Hungary", "Country_Code": "HUN"}, "instance_9": {"Country": "Indonesia", "Country_Code": "IDN"}, "instance_10": {"Country": "Japan", "Country_Code": "JPN"}, "instance_11": {"Country": "India", "_history": [{"changes": [{"field": "Country", "newValue": "India", "oldValue": ""}, {"field": "Country_Code", "newValue": "IN", "oldValue": ""}], "timestamp": "2025-02-23T20:08:08.831Z"}], "Country_Code": "IN"}}	2025-02-19 00:53:46.956551	2025-02-23 20:08:09.268
59	Inventory Normalized Status Data		41	{"instance_1": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVN001", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Available", "oldValue": ""}], "timestamp": "2025-04-17T20:41:23.788Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:41:42.143Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:42:06.207Z"}, {"changes": [{"field": "InventoryStatusValue", "newValue": "Available1", "oldValue": "Available"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-17T20:42:23.403Z"}, {"changes": [{"field": "InventoryStatusValue", "newValue": "Available", "oldValue": "Available1"}], "timestamp": "2025-04-17T20:42:35.072Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:42:40.800Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:42:50.692Z"}], "createdAt": "2025-04-17T20:41:23.788Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:42:50.692Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVN001", "InventoryStatusValue": "Available"}, "instance_2": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVN002", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Expired", "oldValue": ""}], "timestamp": "2025-04-17T20:41:23.788Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:41:42.143Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:42:06.309Z"}], "createdAt": "2025-04-17T20:41:23.788Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:42:06.309Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVN002", "InventoryStatusValue": "Expired"}, "instance_3": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVN003", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Quarantined", "oldValue": ""}], "timestamp": "2025-04-17T20:41:23.788Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:41:42.143Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:42:06.416Z"}], "createdAt": "2025-04-17T20:41:23.788Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:42:06.416Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVN003", "InventoryStatusValue": "Quarantined"}, "instance_4": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVN004", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Returned", "oldValue": ""}], "timestamp": "2025-04-17T20:41:23.788Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:41:42.143Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:42:06.515Z"}], "createdAt": "2025-04-17T20:41:23.788Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:42:06.515Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVN004", "InventoryStatusValue": "Returned"}}	2025-04-17 20:40:51.444229	2025-04-17 20:42:50.698
7	SFDC Cities	Cities in SFDC	5	{"instance_1": {"City": "SFO2", "status": "APPROVED", "_history": [{"changes": [{"field": "City", "newValue": "SFO1", "oldValue": "SFO"}], "timestamp": "2025-04-02T18:29:36.746Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-14T01:30:15.265Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-14T01:30:43.099Z"}, {"changes": [{"field": "City", "newValue": "SFO2", "oldValue": "SFO1"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-14T01:31:00.788Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-14T01:31:22.206Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-14T01:31:30.167Z"}], "City_Code": "SFDC_SFO", "createdAt": "2025-04-02T18:29:36.746Z", "createdBy": "system", "lastModifiedAt": "2025-04-14T01:31:30.167Z", "lastModifiedBy": "jnankani"}, "instance_2": {"City": "Dub", "City_Code": "SDFC_DUB"}}	2025-02-28 00:29:56.243979	2025-04-14 01:31:30.208
6	Enterprise Cities	Enterprise Cities	5	{"instance_1": {"City": "San Francisco1", "status": "APPROVED", "_history": [{"changes": [{"field": "City_Code", "newValue": "SFO1", "oldValue": "SFO"}], "timestamp": "2025-02-25T21:36:40.611Z"}, {"changes": [{"field": "City", "newValue": "San Francisco1", "oldValue": "San Francisco"}], "timestamp": "2025-03-30T21:23:41.199Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-30T21:23:49.086Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-30T21:24:00.578Z"}], "City_Code": "SFO1", "createdAt": "2025-03-30T21:23:41.199Z", "createdBy": "system", "lastModifiedAt": "2025-03-30T21:24:00.578Z", "lastModifiedBy": "jnankani"}, "instance_2": {"City": "Dublin1", "status": "APPROVED", "_history": [{"changes": [{"field": "City", "newValue": "Dublin1", "oldValue": "Dublin"}], "timestamp": "2025-03-30T21:23:45.256Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-30T21:23:49.086Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-30T21:24:00.679Z"}], "City_Code": "DUB", "createdAt": "2025-03-30T21:23:45.256Z", "createdBy": "system", "lastModifiedAt": "2025-03-30T21:24:00.679Z", "lastModifiedBy": "jnankani"}}	2025-02-25 21:34:57.287301	2025-03-30 21:24:00.683
11	Enterprise Sites	These are Enterprise Sites	8	{"instance_1": {"status": "APPROVED", "Site_ID": "SITE_0001", "_history": [{"changes": [{"field": "Site_Name", "newValue": "3rd Party Commercial Distribution Facility (Supplier of EU Released Commercial Drug Product) - JITU", "oldValue": "3rd Party Commercial Distribution Facility (Supplier of EU Released Commercial Drug Product)"}], "timestamp": "2025-03-23T21:11:06.419Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-23T22:07:45.894Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-24T18:32:25.284Z"}], "Site_Name": "3rd Party Commercial Distribution Facility (Supplier of EU Released Commercial Drug Product) - JITU", "Site_Type": "API", "createdAt": "2025-03-23T21:11:06.419Z", "createdBy": "system", "lastModifiedAt": "2025-03-24T18:32:25.284Z", "lastModifiedBy": "jnankani"}, "instance_2": {"Site_ID": "SITE_0002", "Site_Name": "Acnos (Interim Distribution Facility) - Global", "Site_Type": "API"}, "instance_3": {"Site_ID": "SITE_0003", "Site_Name": "Catalent Pharma Solutions Inc. - Madison, WI US", "Site_Type": "API"}, "instance_4": {"Site_ID": "SITE_0004", "Site_Name": "BioReliance - Glasgow UK", "Site_Type": "API"}, "instance_5": {"Site_ID": "SITE_0005", "Site_Name": "BioReliance - Rockville MD US", "Site_Type": "API"}, "instance_6": {"Site_ID": "SITE_0006", "Site_Name": "Signma-Aldrich Manufacturing LLC - St. Louis, MO US", "Site_Type": "API"}, "instance_7": {"Site_ID": "SITE_0007", "Site_Name": "Fujifilm Diosynth Biotechnoligies College Station, TX", "Site_Type": "API"}, "instance_8": {"Site_ID": "SITE_0008", "Site_Name": "Seripharm SAS Novasep - Le Mans FR", "Site_Type": "API"}, "instance_9": {"Site_ID": "SITE_0009", "Site_Name": "Fujifilm Diosynth Biotechnoligies, England", "Site_Type": "API"}, "instance_10": {"Site_ID": "SITE_0010", "Site_Name": "SAFC Inc. - Verona, WI US", "Site_Type": "API"}, "instance_11": {"Site_ID": "SITE_0011", "Site_Name": "Boston Analytial Inc. - Salem, NH US", "Site_Type": "API"}, "instance_12": {"Site_ID": "SITE_0012", "Site_Name": "SAFC Inc. - Madison, WI US", "Site_Type": "API"}, "instance_13": {"Site_ID": "SITE_0013", "Site_Name": "Eurofins BioPharma, Columbia , USA", "Site_Type": "API"}, "instance_14": {"Site_ID": "SITE_0014", "Site_Name": "Eurofins Lancaster Laboratories, Inc. - Lancaster, PA US", "Site_Type": "API"}, "instance_15": {"Site_ID": "SITE_0015", "Site_Name": "Zymeworks Inc.", "Site_Type": "API"}, "instance_16": {"Site_ID": "SITE_0016", "Site_Name": "Ampac Fine Chemicals LLC", "Site_Type": "API"}, "instance_17": {"Site_ID": "SITE_0017", "Site_Name": "Patheon Inc. - Mississauga ON CA", "Site_Type": "DP"}, "instance_18": {"Site_ID": "SITE_0018", "Site_Name": "Baxter Oncology GmbH - Westfalen DE", "Site_Type": "API"}, "instance_19": {"Site_ID": "SITE_0019", "Site_Name": "Signma-Aldrich Manufacturing LLC - St. Louis, MO US", "Site_Type": "DP"}, "instance_20": {"Site_ID": "SITE_0020", "Site_Name": "Eurofins Lancaster Laboratories, Inc. - Lancaster, PA US", "Site_Type": "DP"}, "instance_21": {"Site_ID": "SITE_0021", "Site_Name": "Bristol-Myers Squibb Holdings Pharma, Ltd.", "Site_Type": "API"}, "instance_22": {"Site_ID": "SITE_0022", "Site_Name": "Bristol-Myers Squibb Holdings Pharma, Ltd. Liability Company", "Site_Type": "DP"}, "instance_23": {"Site_ID": "SITE_0023", "Site_Name": "Catalent CTS Llc - Kansas City MO US", "Site_Type": "API"}, "instance_24": {"Site_ID": "SITE_0024", "Site_Name": "Catalent CTS Llc - Kansas City MO US", "Site_Type": "DP"}, "instance_25": {"Site_ID": "SITE_0025", "Site_Name": "Eurofins Advinus Limited Bagalore, India", "Site_Type": "API"}, "instance_26": {"Site_ID": "SITE_0026", "Site_Name": "Quotient Sciences LLC - Boothwyn PA US", "Site_Type": "DP"}, "instance_27": {"Site_ID": "SITE_0027", "Site_Name": "Recipharm Pharmaservices Pvt Ltd - Bengaluru IN", "Site_Type": "DP"}, "instance_28": {"Site_ID": "SITE_0028", "Site_Name": "Quotient Sciences LLC - Garnet Valley PA US", "Site_Type": "DP"}, "instance_29": {"Site_ID": "SITE_0029", "Site_Name": "F.Hoffmann La Roche Ltd - Grezacherstrass Basel CH", "Site_Type": "API"}, "instance_30": {"Site_ID": "SITE_0030", "Site_Name": "F.Hoffmann La Roche Ltd. - Kaiseraugst CH", "Site_Type": "DP"}, "instance_31": {"Site_ID": "SITE_0031", "Site_Name": "Roche Diagonistics GmbH - Mannheim DE", "Site_Type": "DP"}, "instance_32": {"Site_ID": "SITE_0032", "Site_Name": "Lonza Bend Inc - Bend OR US", "Site_Type": "API"}, "instance_33": {"Site_ID": "SITE_0033", "Site_Name": "Lonza Bend Inc - Bend OR US", "Site_Type": "DP"}, "instance_34": {"Site_ID": "SITE_0034", "Site_Name": "Merck Serano S.A. Succurasale de Corsier-sur-Vevey", "Site_Type": "API"}, "instance_35": {"Site_ID": "SITE_0035", "Site_Name": "Merck Serano S.A. Succurasale d'Aubonne", "Site_Type": "DP"}, "instance_36": {"Site_ID": "SITE_0036", "Site_Name": "NextPharma - Scotland, UK", "Site_Type": "API"}, "instance_37": {"Site_ID": "SITE_0037", "Site_Name": "NextPharma - Scotland, UK", "Site_Type": "DP"}, "instance_38": {"Site_ID": "SITE_0038", "Site_Name": "Pharmaron Tianjin Process Development and Manufacturing Co. LTD.", "Site_Type": "API"}, "instance_39": {"Site_ID": "SITE_0039", "Site_Name": "Patheon Development Service Inc.", "Site_Type": "DP"}, "instance_40": {"Site_ID": "SITE_0040", "Site_Name": "Piramal Healthcare LTD - Aurora CA", "Site_Type": "API"}, "instance_41": {"Site_ID": "SITE_0041", "Site_Name": "Samsung BioLogics Company Ltd - Incheon City KR", "Site_Type": "API"}, "instance_42": {"Site_ID": "SITE_0042", "Site_Name": "Baxter Pharmaceutical Solutions - Bloomington IN US", "Site_Type": "DP"}, "instance_43": {"Site_ID": "SITE_0043", "Site_Name": "Baxter Oncology GmbH - Westfalen DE", "Site_Type": "DP"}, "instance_44": {"Site_ID": "SITE_0044", "Site_Name": "WUXI STA - Shanghai, CN", "Site_Type": "API"}, "instance_45": {"Site_ID": "SITE_0045", "Site_Name": "Pharmaron Ningbo Technology Development Co Ltd - Hangzhou CN", "Site_Type": "DP"}, "instance_46": {"Site_ID": "SITE_0046", "Site_Name": "3rd Party Commercial Distribution Facility - Acnos Brazil Source", "Site_Type": "DP"}, "instance_47": {"Site_ID": "SITE_0047", "Site_Name": "Acnos (Interim Distribution Facility) - Brazil Source", "Site_Type": "DP"}, "instance_48": {"Site_ID": "SITE_0048", "Site_Name": "3rd Party Commercial Distribution Facility - Acnos EU Source", "Site_Type": "DP"}, "instance_49": {"Site_ID": "SITE_0049", "Site_Name": "Acnos (Interim Distribution Facility) - EU Source", "Site_Type": "DP"}, "instance_50": {"Site_ID": "SITE_0050", "Site_Name": "3rd Party Commercial Distribution Facility - Acnos Global Source", "Site_Type": "DP"}, "instance_51": {"Site_ID": "SITE_0051", "Site_Name": "Acnos (Interim Distribution Facility) - Global", "Site_Type": "DP"}, "instance_52": {"Site_ID": "SITE_0052", "Site_Name": "3rd Party Commercial Distribution Facility - Acnos India Source", "Site_Type": "DP"}, "instance_53": {"Site_ID": "SITE_0053", "Site_Name": "Acnos (Interim Distribution Facility) - India Source", "Site_Type": "DP"}, "instance_54": {"Site_ID": "SITE_0054", "Site_Name": "3rd Party Commercial Distribution Facility - Acnos Mexico Source", "Site_Type": "DP"}, "instance_55": {"Site_ID": "SITE_0055", "Site_Name": "Acnos (Interim Distribution Facility) - Mexico Source", "Site_Type": "DP"}, "instance_56": {"Site_ID": "SITE_0056", "Site_Name": "3rd Party Commercial Distribution Facility - Acnos US Source", "Site_Type": "DP"}, "instance_57": {"Site_ID": "SITE_0057", "Site_Name": "Acnos (Interim Distribution Facility) - US Source", "Site_Type": "DP"}, "instance_58": {"Site_ID": "SITE_0058", "Site_Name": "3rd Party Commercial Distribution Facility - FCS Brazil Source", "Site_Type": "DP"}, "instance_59": {"Site_ID": "SITE_0059", "Site_Name": "3rd Party Commercial Distribution Facility - FCS EU Source", "Site_Type": "DP"}, "instance_60": {"Site_ID": "SITE_0060", "Site_Name": "Fisher Clinical Services (Interim Distribution Facility) - EU Source", "Site_Type": "DP"}, "instance_61": {"Site_ID": "SITE_0061", "Site_Name": "3rd Party Commercial Distribution Facility - FCS Global Source", "Site_Type": "DP"}, "instance_62": {"Site_ID": "SITE_0062", "Site_Name": "Fisher Clinical Services (Interim Distribution Facility) - Global Source", "Site_Type": "DP"}, "instance_63": {"Site_ID": "SITE_0063", "Site_Name": "3rd Party Commercial Distribution Facility - FCS India Source", "Site_Type": "DP"}, "instance_64": {"Site_ID": "SITE_0064", "Site_Name": "3rd Party Commercial Distribution Facility - FCS Mexico Source", "Site_Type": "DP"}, "instance_65": {"Site_ID": "SITE_0065", "Site_Name": "3rd Party Commercial Distribution Facility - FCS US Source", "Site_Type": "DP"}, "instance_66": {"Site_ID": "SITE_0066", "Site_Name": "Fisher Clinical Services (Interim Distribution Facility) - US Source", "Site_Type": "DP"}, "instance_67": {"Site_ID": "SITE_0067", "Site_Name": "Eurofins BioPharma, Columbia , USA", "Site_Type": "DP"}, "instance_68": {"Site_ID": "SITE_0068", "Site_Name": "Yourway Transport BioPharma Services - Allentown PA US", "Site_Type": "DP"}, "instance_69": {"Site_ID": "SITE_0069", "Site_Name": "PCI Pharma Services - West Chester OH US", "Site_Type": "DP"}, "instance_70": {"Site_ID": "SITE_0070", "Site_Name": "Almac Clinical Services - Craigavon UK", "Site_Type": "DP"}, "instance_71": {"Site_ID": "SITE_0071", "Site_Name": "Lonza Bend Inc - Tampa FL US", "Site_Type": "DP"}, "instance_72": {"Site_ID": "SITE_0072", "Site_Name": "PCI Pharma Services - Burlington ON CA", "Site_Type": "DP"}, "instance_73": {"Site_ID": "SITE_0073", "Site_Name": "Aurigene Discovery Technologies Limited - Bengaluru IN", "Site_Type": "DP"}, "instance_74": {"Site_ID": "SITE_0074", "Site_Name": "Genetech Inc -  South San Francisco CA US", "Site_Type": "DP"}, "instance_75": {"Site_ID": "SITE_0075", "Site_Name": "PCI Pharma Services GmbH - GroBbeeren DE", "Site_Type": "PL"}, "instance_76": {"Site_ID": "SITE_0076", "Site_Name": "Acnos (Interim Distribution Facility) - US Source", "Site_Type": "API"}, "instance_77": {"Site_ID": "SITE_0077", "Site_Name": "Fisher Clinical Services - Allentown PA US", "Site_Type": "PL"}, "instance_78": {"Site_ID": "SITE_0078", "Site_Name": "Fisher Clinical Services (Interim Distribution Facility) - Global Source", "Site_Type": "PL"}, "instance_79": {"Site_ID": "SITE_0079", "Site_Name": "Fisher Clinical Services - Rheinfelden DE", "Site_Type": "PL"}, "instance_80": {"Site_ID": "SITE_0080", "Site_Name": "Fisher Clinical Services - Basel Steinbuehlweg CH", "Site_Type": "PL"}, "instance_81": {"Site_ID": "SITE_0081", "Site_Name": "Fisher Clinical Services - Horsham UK", "Site_Type": "PL"}, "instance_82": {"Site_ID": "SITE_0082", "Site_Name": "Almac Clinical Services - Craigavon UK", "Site_Type": "PL"}, "instance_83": {"Site_ID": "SITE_0083", "Site_Name": "Biotec Services International Ltd dba PCI Pharma Services - Bridgend UK", "Site_Type": "PL"}, "instance_84": {"Site_ID": "SITE_0084", "Site_Name": "PCI Pharma Services - West Chester OH US", "Site_Type": "PL"}, "instance_85": {"Site_ID": "SITE_0085", "Site_Name": "PCI Pharma Services - Rockford IL US", "Site_Type": "PL"}, "instance_86": {"Site_ID": "SITE_0086", "Site_Name": "Almac Clinical Services - Souderton US", "Site_Type": "PL"}, "instance_87": {"Site_ID": "SITE_0087", "Site_Name": "PCI Pharma Services - San Diego CA US", "Site_Type": "PL"}, "instance_88": {"Site_ID": "SITE_0088", "Site_Name": "Catalent CTS Llc - Kansas City MO US", "Site_Type": "PL"}, "instance_89": {"Site_ID": "SITE_0089", "Site_Name": "PCI Pharma Services - Burlington ON CA", "Site_Type": "PL"}, "instance_90": {"Site_ID": "SITE_0090", "Site_Name": "Fisher Clinical Services - Rheinfelden DE", "Site_Type": "DP"}, "instance_91": {"Site_ID": "SITE_0091", "Site_Name": "Almac Clinical Services - Dundalk IE", "Site_Type": "PL"}, "instance_92": {"Site_ID": "SITE_0092", "Site_Name": "Parexel Depot - Suzhou CN", "Site_Type": "PL"}, "instance_93": {"Site_ID": "SITE_0093", "Site_Name": "Yourway Transport BioPharma Services - Allentown PA US", "Site_Type": "PL"}, "instance_94": {"Site_ID": "SITE_0094", "Site_Name": "PCI Pharma Services - West Chester OH US", "Site_Type": "SD"}, "instance_95": {"Site_ID": "SITE_0095", "Site_Name": "Almac Clinical Services - Craigavon UK", "Site_Type": "SD"}, "instance_96": {"Site_ID": "SITE_0096", "Site_Name": "Tamro - Vantaa FI", "Site_Type": "SD"}, "instance_97": {"Site_ID": "SITE_0097", "Site_Name": "World Courier - Buenos Aires AR", "Site_Type": "SD"}, "instance_98": {"Site_ID": "SITE_0098", "Site_Name": "World Courier - Mexico City MX", "Site_Type": "SD"}, "instance_99": {"Site_ID": "SITE_0099", "Site_Name": "Almac Pharmceutical Services Pte. Ltd. - Singapore", "Site_Type": "SD"}, "instance_100": {"Site_ID": "SITE_0100", "Site_Name": "World Courier - Sao Paulo BR", "Site_Type": "SD"}, "instance_101": {"Site_ID": "SITE_0101", "Site_Name": "World Courier - Santiago CL", "Site_Type": "SD"}, "instance_102": {"Site_ID": "SITE_0102", "Site_Name": "World Courier - Moskva RU", "Site_Type": "SD"}, "instance_103": {"Site_ID": "SITE_0103", "Site_Name": "Trialog Clinical Trials Ltd - Modiin IL", "Site_Type": "SD"}, "instance_104": {"Site_ID": "SITE_0104", "Site_Name": "Almac Clinical Services - Souderton US", "Site_Type": "SD"}, "instance_105": {"Site_ID": "SITE_0105", "Site_Name": "ABC Pharmalogistics, LTD - Tbilisi GE", "Site_Type": "SD"}, "instance_106": {"Site_ID": "SITE_0106", "Site_Name": "IMP Logistics  - Kyiv UA", "Site_Type": "SD"}, "instance_107": {"Site_ID": "SITE_0107", "Site_Name": "Almac Clinical Services - Dundalk IE", "Site_Type": "SD"}, "instance_108": {"Site_ID": "SITE_0108", "Site_Name": "Zuellig Pharma - Phillippines", "Site_Type": "SD"}, "instance_109": {"Site_ID": "SITE_0109", "Site_Name": "World Courier - Tokyo JP", "Site_Type": "SD"}, "instance_110": {"Site_ID": "SITE_0110", "Site_Name": "Almac Pharmceutical Services Pte. Ltd. - Singapore", "Site_Type": "PL"}, "instance_111": {"Site_ID": "SITE_0111", "Site_Name": "PCI Pharma Services - San Diego CA US", "Site_Type": "SD"}, "instance_112": {"Site_ID": "SITE_0112", "Site_Name": "PCI Pharma Services - Rockford IL US", "Site_Type": "SD"}, "instance_113": {"Site_ID": "SITE_0113", "Site_Name": "PCI Pharma Services GmbH - GroBbeeren DE", "Site_Type": "SD"}, "instance_114": {"Site_ID": "SITE_0114", "Site_Name": "PCI Pharma Services - Melbourne AU", "Site_Type": "SD"}, "instance_115": {"Site_ID": "SITE_0115", "Site_Name": "Biotec Services International Ltd dba PCI Pharma Services - Bridgend UK", "Site_Type": "SD"}, "instance_116": {"Site_ID": "SITE_0116", "Site_Name": "Catalent Germany Schorndorf GmbH - Schorndorf DE", "Site_Type": "SD"}, "instance_117": {"Site_ID": "SITE_0117", "Site_Name": "World Courier - Australia", "Site_Type": "SD"}, "instance_118": {"Site_ID": "SITE_0118", "Site_Name": "Catalent CTS Llc - Kansas City MO US", "Site_Type": "SD"}, "instance_119": {"Site_ID": "SITE_0119", "Site_Name": "Catalent Pharma Solutions Singapore", "Site_Type": "SD"}, "instance_120": {"Site_ID": "SITE_0120", "Site_Name": "Fisher Clinical Services - Colombia", "Site_Type": "SD"}, "instance_121": {"Site_ID": "SITE_0121", "Site_Name": "Fisher Clinical Services - Brazil", "Site_Type": "SD"}, "instance_122": {"Site_ID": "SITE_0122", "Site_Name": "Fisher Clinical Services - Argentina", "Site_Type": "SD"}, "instance_123": {"Site_ID": "SITE_0123", "Site_Name": "Fisher Clinical Services - Allentown PA US", "Site_Type": "SD"}, "instance_124": {"Site_ID": "SITE_0124", "Site_Name": "Fisher Clinical Services - Chile", "Site_Type": "SD"}, "instance_125": {"Site_ID": "SITE_0125", "Site_Name": "Fisher Clinical Services - Horsham UK", "Site_Type": "SD"}, "instance_126": {"Site_ID": "SITE_0126", "Site_Name": "Cryosite - New South Wales AU", "Site_Type": "SD"}, "instance_127": {"Site_ID": "SITE_0127", "Site_Name": "Fisher Clinical Services - Singapore", "Site_Type": "SD"}, "instance_128": {"Site_ID": "SITE_0128", "Site_Name": "Fisher Clinical Services - Turkey", "Site_Type": "SD"}, "instance_129": {"Site_ID": "SITE_0129", "Site_Name": "Fisher Clinical Services - Rheinfelden DE", "Site_Type": "SD"}, "instance_130": {"Site_ID": "SITE_0130", "Site_Name": "Fisher Clinical Services - Mexico", "Site_Type": "SD"}, "instance_131": {"Site_ID": "SITE_0131", "Site_Name": "Fisher Clinical Service - Russia", "Site_Type": "SD"}, "instance_132": {"Site_ID": "SITE_0132", "Site_Name": "Fisher Clinical Services - Weil am Rhein DE", "Site_Type": "SD"}, "instance_133": {"Site_ID": "SITE_0133", "Site_Name": "Fisher Clinical Services - India", "Site_Type": "SD"}, "instance_134": {"Site_ID": "SITE_0134", "Site_Name": "Fisher Clinical Services - Basel Steinbuehlweg CH", "Site_Type": "SD"}, "instance_135": {"Site_ID": "SITE_0135", "Site_Name": "Paraxel International - Quakertown, PA", "Site_Type": "SD"}, "instance_136": {"Site_ID": "SITE_0136", "Site_Name": "PCI Pharma Services - Burlington ON CA", "Site_Type": "SD"}, "instance_137": {"Site_ID": "SITE_0137", "Site_Name": "Clinigen Clinical Supplies Management GmbH AM Kronberger Hang 3 Schwalback a. Ts. Germany", "Site_Type": "SD"}, "instance_138": {"Site_ID": "SITE_0138", "Site_Name": "World Courier - Singapore", "Site_Type": "SD"}, "instance_139": {"Site_ID": "SITE_0139", "Site_Name": "IMP Logistics Russia", "Site_Type": "SD"}, "instance_140": {"Site_ID": "SITE_0140", "Site_Name": "Avinex - Kyiv UA", "Site_Type": "SD"}, "instance_141": {"Site_ID": "SITE_0141", "Site_Name": "World Courier - Bogota CO", "Site_Type": "SD"}, "instance_142": {"Site_ID": "SITE_0142", "Site_Name": "Zuellig - China", "Site_Type": "SD"}, "instance_143": {"Site_ID": "SITE_0143", "Site_Name": "Quotient Sciences LLC - Boothwyn PA US", "Site_Type": "PL"}, "instance_144": {"Site_ID": "SITE_0144", "Site_Name": "Quotient Sciences LLC - Garnet Valley PA US", "Site_Type": "PL"}, "instance_145": {"Site_ID": "SITE_0145", "Site_Name": "Recipharm Pharmaservices Pvt Ltd - Bengaluru IN", "Site_Type": "PL"}, "instance_146": {"Site_ID": "SITE_0146", "Site_Name": "Sites in Georgia", "Site_Type": "Sites"}, "instance_147": {"Site_ID": "SITE_0147", "Site_Name": "Sites in France", "Site_Type": "Sites"}, "instance_148": {"Site_ID": "SITE_0148", "Site_Name": "Sites in Czechia", "Site_Type": "Sites"}, "instance_149": {"Site_ID": "SITE_0149", "Site_Name": "Sites in Bulgaria", "Site_Type": "Sites"}, "instance_150": {"Site_ID": "SITE_0150", "Site_Name": "Sites in Poland", "Site_Type": "Sites"}, "instance_151": {"Site_ID": "SITE_0151", "Site_Name": "Sites in Germany", "Site_Type": "Sites"}, "instance_152": {"Site_ID": "SITE_0152", "Site_Name": "Sites in Norway", "Site_Type": "Sites"}, "instance_153": {"Site_ID": "SITE_0153", "Site_Name": "Sites in Hungary", "Site_Type": "Sites"}, "instance_154": {"Site_ID": "SITE_0154", "Site_Name": "Sites in Austria", "Site_Type": "Sites"}, "instance_155": {"Site_ID": "SITE_0155", "Site_Name": "Sites in Denmark", "Site_Type": "Sites"}, "instance_156": {"Site_ID": "SITE_0156", "Site_Name": "Sites in Ireland", "Site_Type": "Sites"}, "instance_157": {"Site_ID": "SITE_0157", "Site_Name": "Sites in Netherlands", "Site_Type": "Sites"}, "instance_158": {"Site_ID": "SITE_0158", "Site_Name": "Sites in Italy", "Site_Type": "Sites"}, "instance_159": {"Site_ID": "SITE_0159", "Site_Name": "Sites in Belgium", "Site_Type": "Sites"}, "instance_160": {"Site_ID": "SITE_0160", "Site_Name": "Sites in United Kingdom of Great Britain and Northern Ireland", "Site_Type": "Sites"}, "instance_161": {"Site_ID": "SITE_0161", "Site_Name": "Sites in Portugal", "Site_Type": "Sites"}, "instance_162": {"Site_ID": "SITE_0162", "Site_Name": "Sites in Slovakia", "Site_Type": "Sites"}, "instance_163": {"Site_ID": "SITE_0163", "Site_Name": "Sites in Turkey", "Site_Type": "Sites"}, "instance_164": {"Site_ID": "SITE_0164", "Site_Name": "Sites in Switzerland", "Site_Type": "Sites"}, "instance_165": {"Site_ID": "SITE_0165", "Site_Name": "Sites in Sweden", "Site_Type": "Sites"}, "instance_166": {"Site_ID": "SITE_0166", "Site_Name": "Sites in Spain", "Site_Type": "Sites"}, "instance_167": {"Site_ID": "SITE_0167", "Site_Name": "Sites in Canada", "Site_Type": "Sites"}, "instance_168": {"Site_ID": "SITE_0168", "Site_Name": "Sites in United States of America", "Site_Type": "Sites"}, "instance_169": {"Site_ID": "SITE_0169", "Site_Name": "Sites in Republic of Korea", "Site_Type": "Sites"}, "instance_170": {"Site_ID": "SITE_0170", "Site_Name": "Sites in Hong Kong", "Site_Type": "Sites"}, "instance_171": {"Site_ID": "SITE_0171", "Site_Name": "Sites in Australia", "Site_Type": "Sites"}, "instance_172": {"Site_ID": "SITE_0172", "Site_Name": "Sites in Singapore", "Site_Type": "Sites"}, "instance_173": {"Site_ID": "SITE_0173", "Site_Name": "Sites in Taiwan", "Site_Type": "Sites"}, "instance_174": {"Site_ID": "SITE_0174", "Site_Name": "Sites in New Zealand", "Site_Type": "Sites"}, "instance_175": {"Site_ID": "SITE_0175", "Site_Name": "Sites in Ukraine", "Site_Type": "Sites"}, "instance_176": {"Site_ID": "SITE_0176", "Site_Name": "Sites in Croatia", "Site_Type": "Sites"}, "instance_177": {"Site_ID": "SITE_0177", "Site_Name": "Sites in Romania", "Site_Type": "Sites"}, "instance_178": {"Site_ID": "SITE_0178", "Site_Name": "EORTC HGUS, ATLANTIS", "Site_Type": "Sites"}, "instance_179": {"Site_ID": "SITE_0179", "Site_Name": "Sites in Russian Federation", "Site_Type": "Sites"}, "instance_180": {"Site_ID": "SITE_0180", "Site_Name": "Sites in Argentina", "Site_Type": "Sites"}, "instance_181": {"Site_ID": "SITE_0181", "Site_Name": "Sites in Brazil", "Site_Type": "Sites"}, "instance_182": {"Site_ID": "SITE_0182", "Site_Name": "Sites in Chile", "Site_Type": "Sites"}, "instance_183": {"Site_ID": "SITE_0183", "Site_Name": "Sites in Colombia", "Site_Type": "Sites"}, "instance_184": {"Site_ID": "SITE_0184", "Site_Name": "Sites in India", "Site_Type": "Sites"}, "instance_185": {"Site_ID": "SITE_0185", "Site_Name": "Sites in Mexico", "Site_Type": "Sites"}, "instance_186": {"Site_ID": "SITE_0186", "Site_Name": "Sites in Finland", "Site_Type": "Sites"}, "instance_187": {"Site_ID": "SITE_0187", "Site_Name": "Sites in Greece", "Site_Type": "Sites"}, "instance_188": {"Site_ID": "SITE_0188", "Site_Name": "Sites in Thailand", "Site_Type": "Sites"}, "instance_189": {"Site_ID": "SITE_0189", "Site_Name": "Sites in Malaysia", "Site_Type": "Sites"}, "instance_190": {"Site_ID": "SITE_0190", "Site_Name": "Sitess for IST, CETP", "Site_Type": "Sites"}, "instance_191": {"Site_ID": "SITE_0191", "Site_Name": "Sites in Israel", "Site_Type": "Sites"}, "instance_192": {"Site_ID": "SITE_0192", "Site_Name": "Sites in Japan", "Site_Type": "Sites"}, "instance_193": {"Site_ID": "SITE_0193", "Site_Name": "Sitess in China", "Site_Type": "Sites"}, "instance_194": {"Site_ID": "SITE_0194", "Site_Name": "Sites in Philippines", "Site_Type": "Sites"}, "instance_195": {"status": "APPROVED", "Site_ID": "SITE1111111", "_history": [{"changes": [{"field": "Site_ID", "newValue": "SITE1111111", "oldValue": ""}, {"field": "Site_Name", "newValue": "SITE1111111", "oldValue": ""}, {"field": "Site_Type", "newValue": "API", "oldValue": ""}], "timestamp": "2025-03-13T20:01:17.865Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T20:12:05.210Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T20:14:42.681Z"}], "Site_Name": "SITE1111111", "Site_Type": "API", "createdAt": "2025-03-13T20:01:17.865Z", "createdBy": "jnankani", "lastModifiedAt": "2025-03-13T20:14:42.681Z", "lastModifiedBy": "jnankani"}}	2025-03-07 01:05:47.743019	2025-03-24 18:32:25.289
61	Enterprise Currency Dataset	Test	43	{"instance_1": {"Code": "RS", "status": "APPROVED", "_history": [{"changes": [{"field": "Code", "newValue": "RS", "oldValue": ""}, {"field": "Description", "newValue": "Rupees", "oldValue": ""}], "timestamp": "2025-04-22T09:21:02.043Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-22T09:21:54.217Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-22T09:22:56.738Z"}, {"changes": [{"field": "Description", "newValue": "Rupees1", "oldValue": "Rupees"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-22T09:25:02.275Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-22T09:25:56.242Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-22T09:26:05.807Z"}], "createdAt": "2025-04-22T09:21:02.043Z", "createdBy": "admin", "Description": "Rupees1", "lastModifiedAt": "2025-04-22T09:26:05.807Z", "lastModifiedBy": "jnankani"}, "instance_2": {"Code": "USD", "status": "APPROVED", "_history": [{"changes": [{"field": "Code", "newValue": "USD", "oldValue": ""}, {"field": "Description", "newValue": "Dollar", "oldValue": ""}], "timestamp": "2025-04-22T09:21:02.043Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-22T09:21:54.217Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-22T09:22:57.052Z"}], "createdAt": "2025-04-22T09:21:02.043Z", "createdBy": "admin", "Description": "Dollar", "lastModifiedAt": "2025-04-22T09:22:57.052Z", "lastModifiedBy": "jnankani"}}	2025-04-22 09:19:18.98779	2025-04-22 09:26:05.812
62	test dataset		42	{"instance_1": {"test1": "test1", "test2": "test22", "test3": "test3", "status": "APPROVED", "_history": [{"changes": [{"field": "test1", "newValue": "test1", "oldValue": ""}, {"field": "test2", "newValue": "test2", "oldValue": ""}, {"field": "test3", "newValue": "test3", "oldValue": ""}], "timestamp": "2025-04-22T18:19:57.247Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-22T18:20:03.045Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-22T18:20:15.892Z"}, {"changes": [{"field": "test2", "newValue": "test22", "oldValue": "test2"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-22T18:33:13.328Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-22T18:33:36.663Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-22T18:33:48.662Z"}], "createdAt": "2025-04-22T18:19:57.247Z", "createdBy": "admin", "lastModifiedAt": "2025-04-22T18:33:48.662Z", "lastModifiedBy": "jnankani"}}	2025-04-22 18:19:39.977746	2025-04-22 18:33:48.666
58	Inventory Source Status Data		41	{"instance_1": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS001", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Approved", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:08.548Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:08.548Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS001", "InventoryStatusValue": "Approved"}, "instance_2": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS002", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Audited", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:08.654Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:08.654Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS002", "InventoryStatusValue": "Audited"}, "instance_3": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS003", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Available", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:08.756Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:08.756Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS003", "InventoryStatusValue": "Available"}, "instance_4": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS004", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Awaiting Release", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:08.859Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:08.859Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS004", "InventoryStatusValue": "Awaiting Release"}, "instance_5": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS005", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Customer Hold", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:08.961Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:08.961Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS005", "InventoryStatusValue": "Customer Hold"}, "instance_6": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS006", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Expired", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.063Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.063Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS006", "InventoryStatusValue": "Expired"}, "instance_7": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS007", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "GMP Approved", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.166Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.166Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS007", "InventoryStatusValue": "GMP Approved"}, "instance_8": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS008", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Interim Hold", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.279Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.279Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS008", "InventoryStatusValue": "Interim Hold"}, "instance_9": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS009", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "NMR Material", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.383Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.383Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS009", "InventoryStatusValue": "NMR Material"}, "instance_10": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS010", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Pending Audit", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.486Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.486Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS010", "InventoryStatusValue": "Pending Audit"}, "instance_11": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS011", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Pending Destruction", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.589Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.589Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS011", "InventoryStatusValue": "Pending Destruction"}, "instance_12": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS012", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Process Approved", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.698Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.698Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS012", "InventoryStatusValue": "Process Approved"}, "instance_13": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS013", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Quarantine", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.802Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.802Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS013", "InventoryStatusValue": "Quarantine"}, "instance_14": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS014", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Receiving Quarantine", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:09.906Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:09.906Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS014", "InventoryStatusValue": "Receiving Quarantine"}, "instance_15": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS015", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Reject", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:10.007Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:10.007Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS015", "InventoryStatusValue": "Reject"}, "instance_16": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS016", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Released", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:10.109Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:10.109Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS016", "InventoryStatusValue": "Released"}, "instance_17": {"status": "APPROVED", "_history": [{"changes": [{"field": "InventoryStatusCode", "newValue": "INVS017", "oldValue": ""}, {"field": "InventoryStatusValue", "newValue": "Returns", "oldValue": ""}], "timestamp": "2025-04-17T20:44:50.027Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-17T20:44:57.411Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-17T20:45:10.216Z"}], "createdAt": "2025-04-17T20:44:50.027Z", "createdBy": "admin", "lastModifiedAt": "2025-04-17T20:45:10.216Z", "lastModifiedBy": "jnankani", "InventoryStatusCode": "INVS017", "InventoryStatusValue": "Returns"}}	2025-04-17 20:39:46.1157	2025-04-17 20:45:10.22
60	testrefer	ttttt	42	{"instance_1": {"test1": "a", "test2": "a1", "test3": "a", "status": "DRAFT", "_history": [{"changes": [{"field": "test1", "newValue": "a", "oldValue": ""}, {"field": "test2", "newValue": "a", "oldValue": ""}, {"field": "test3", "newValue": "a", "oldValue": ""}], "timestamp": "2025-04-22T02:29:10.069Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-22T02:29:23.451Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-22T02:30:03.286Z"}, {"changes": [{"field": "test2", "newValue": "a1", "oldValue": "a"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-22T02:30:34.068Z"}], "createdAt": "2025-04-22T02:29:10.069Z", "createdBy": "admin", "lastModifiedAt": "2025-04-22T02:30:34.068Z", "lastModifiedBy": "jnankani"}, "instance_2": {"test1": "b", "test2": "b", "test3": "b", "status": "APPROVED", "_history": [{"changes": [{"field": "test1", "newValue": "b", "oldValue": ""}, {"field": "test2", "newValue": "b", "oldValue": ""}, {"field": "test3", "newValue": "b", "oldValue": ""}], "timestamp": "2025-04-22T02:29:10.069Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-22T02:29:23.451Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-22T02:30:03.733Z"}], "createdAt": "2025-04-22T02:29:10.069Z", "createdBy": "admin", "lastModifiedAt": "2025-04-22T02:30:03.733Z", "lastModifiedBy": "jnankani"}}	2025-04-22 02:27:40.970579	2025-04-22 02:30:34.528
63	bhaviktestdataset	Testing part of RBAC	42	{}	2025-04-23 19:42:42.1601	2025-04-23 19:47:52.029
4	States	States	4	{"instance_1": {"State": "California", "status": "APPROVED", "_history": [{"changes": [{"field": "State", "newValue": "California", "oldValue": ""}, {"field": "State_Code", "newValue": "CAL", "oldValue": ""}], "timestamp": "2025-03-12T07:04:07.267Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1", "oldValue": "CAL"}], "timestamp": "2025-03-12T15:59:51.425Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-12T22:00:08.217Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T18:00:13.974Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL12", "oldValue": "CAL1"}], "timestamp": "2025-03-13T18:00:48.258Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL123", "oldValue": "CAL12"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-13T18:03:19.667Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T18:03:29.371Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T18:04:01.566Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234", "oldValue": "CAL123"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-13T18:06:27.816Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T18:06:44.780Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T18:07:05.545Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjj", "oldValue": "CAL1234"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:21:44.186Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:21:49.099Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:22:28.815Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjj", "oldValue": "CAL1234jjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:23:29.584Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:23:35.617Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:30:00.470Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhh", "oldValue": "CAL1234jjjjjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:30:29.019Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:30:36.461Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:32:59.380Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjj", "oldValue": "CAL1234jjjjjjhh"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:40:20.648Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:40:38.617Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:41:03.269Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkk", "oldValue": "CAL1234jjjjjjhhjjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:51:30.082Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:51:36.637Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:52:31.142Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh", "oldValue": "CAL1234jjjjjjhhjjjkkk"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T21:07:56.054Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T21:08:07.911Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T21:08:35.109Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T21:44:25.516Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T21:44:31.354Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T21:44:41.491Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1AAAAA", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:35:26.298Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:35:59.614Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:36:45.030Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1BBBB", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1AAAAA"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:37:31.822Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:37:45.876Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:42:06.280Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1DDD", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1BBBB"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:42:31.112Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:43:00.984Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:43:27.250Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1EEEE", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1DDD"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T00:24:00.617Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T00:24:07.339Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T00:30:35.109Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1FFF", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1EEEE"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T01:15:40.820Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T01:15:48.024Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T01:15:59.300Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGG", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1FFF"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T02:02:22.274Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T02:02:42.886Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T02:05:09.967Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHH", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGG"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T17:19:59.614Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T17:20:23.616Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T17:21:23.434Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyy", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHH"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T18:32:32.432Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T18:32:39.914Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T18:33:09.345Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyyaaa", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyy"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T20:39:10.897Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T20:39:26.079Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T20:39:53.013Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyybbb", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyyaaa"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T20:44:25.676Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T20:44:48.826Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T20:55:38.641Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyykkk", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyybbb"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T21:01:11.575Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T21:01:27.631Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T21:01:42.652Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyyllll", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyykkk"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T21:05:12.637Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T21:05:26.999Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T21:05:46.048Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHmmmm", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHyyyllll"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T21:13:34.089Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T21:13:53.142Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T21:23:20.371Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHmmmm111", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHmmmm"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-14T15:57:29.072Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-14T15:57:42.144Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-14T15:58:06.418Z"}, {"changes": [{"field": "State_Code", "newValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHmmmmjjjj", "oldValue": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHmmmm111"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-14T16:37:04.452Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-14T16:37:16.170Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-14T16:37:29.685Z"}], "createdAt": "2025-03-12T07:04:07.267Z", "createdBy": "admin", "State_Code": "CAL1234jjjjjjhhjjjkkkhhh1GGGHHmmmmjjjj", "lastModifiedAt": "2025-04-14T16:37:29.685Z", "lastModifiedBy": "jnankani"}, "instance_2": {"State": "Texas", "status": "APPROVED", "_history": [{"changes": [{"field": "State", "newValue": "Texas", "oldValue": ""}, {"field": "State_Code", "newValue": "TX", "oldValue": ""}], "timestamp": "2025-03-12T07:04:07.267Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T18:03:38.791Z"}, {"changes": [{"field": "State_Code", "newValue": "TX888", "oldValue": "TX"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-13T18:06:36.485Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T18:06:49.207Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T18:07:08.538Z"}, {"changes": [{"field": "State_Code", "newValue": "TX888kjjj", "oldValue": "TX888"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:21:22.657Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:21:35.649Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:22:29.249Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjj", "oldValue": "TX888kjjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:23:40.616Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:23:48.888Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:31:08.806Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjj", "oldValue": "jjjjTX888kjjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:31:44.809Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:31:49.985Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:33:19.103Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhh", "oldValue": "jjjjTX888kjjjjjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:40:33.212Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:40:42.980Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:40:57.147Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkk", "oldValue": "jjjjTX888kjjjjjjhhh"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:51:41.964Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:51:48.255Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:52:35.153Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjj", "oldValue": "jjjjTX888kjjjjjjhhhkkkk"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T21:08:01.032Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T21:08:10.739Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T21:08:38.801Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjjAAAAAA", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:35:34.868Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:36:05.960Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:36:45.440Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjjBBBB", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjjAAAAAA"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:37:40.209Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:37:52.618Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:38:16.866Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjjCCC", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjjBBBB"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:41:30.746Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:41:37.101Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:42:06.868Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjjDDD", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjjCCC"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:42:39.117Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:43:05.413Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:43:27.836Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjJJJ", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjjDDD"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T02:02:36.585Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T02:02:47.128Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T02:05:10.474Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHH", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjJJJ"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T17:20:08.624Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T17:20:27.945Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T17:21:23.935Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHHbbb", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjHH"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T20:39:18.292Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T20:39:26.079Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T20:39:53.917Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHHsss", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjHHbbb"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T20:44:35.504Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T20:44:48.826Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T20:55:39.544Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHHllll", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjHHsss"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T21:01:19.332Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T21:01:27.631Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T21:01:43.573Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHHmmm", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjHHllll"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T21:05:19.191Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T21:05:26.999Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T21:05:46.982Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHnnn", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjHHmmm"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-12T21:13:42.280Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-12T21:13:53.142Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-12T21:23:21.288Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHnnnfff", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjHnnn"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-14T15:57:37.026Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-14T15:57:42.144Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-14T15:58:06.960Z"}, {"changes": [{"field": "State_Code", "newValue": "jjjjTX888kjjjjjjhhhkkkkjjHnnnhhhh", "oldValue": "jjjjTX888kjjjjjjhhhkkkkjjHnnnfff"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-04-14T16:37:10.618Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-04-14T16:37:16.170Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-04-14T16:37:30.246Z"}], "createdAt": "2025-03-12T07:04:07.267Z", "createdBy": "admin", "State_Code": "jjjjTX888kjjjjjjhhhkkkkjjHnnnhhhh", "lastModifiedAt": "2025-04-14T16:37:30.246Z", "lastModifiedBy": "jnankani"}, "instance_3": {"State": "Florida", "status": "APPROVED", "_history": [{"changes": [{"field": "State", "newValue": "Florida", "oldValue": ""}, {"field": "State_Code", "newValue": "FL", "oldValue": ""}], "timestamp": "2025-03-13T19:50:00.230Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T19:50:32.085Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T19:52:02.137Z"}, {"changes": [{"field": "State_Code", "newValue": "FL1", "oldValue": "FL"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-13T19:53:31.154Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T21:37:18.914Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T21:37:57.606Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2", "oldValue": "FL1"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-13T21:38:31.602Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T21:39:04.731Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T04:35:13.795Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e", "oldValue": "FL2"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T04:35:39.310Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T04:35:46.689Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T19:51:29.352Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3", "oldValue": "FL2e"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T19:52:22.121Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T19:55:44.376Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T19:58:08.505Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj", "oldValue": "FL2e3"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:01:58.635Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:02:06.106Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:02:27.293Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333", "oldValue": "FL2e3jj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:18:42.436Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:18:55.064Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:20:03.440Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuu", "oldValue": "FL2e3jj333"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:20:50.933Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:21:04.999Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:22:29.017Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjj", "oldValue": "FL2e3jj333uuu"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:24:00.604Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:24:06.575Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:30:00.894Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjjhhh", "oldValue": "FL2e3jj333uuujjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:30:43.743Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:30:49.135Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:31:08.396Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjjhhhhhh", "oldValue": "FL2e3jj333uuujjjhhh"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:31:57.784Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:32:03.502Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:32:59.812Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjjhhhhhhkkk", "oldValue": "FL2e3jj333uuujjjhhhhhh"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:51:54.886Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:51:59.823Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:52:24.543Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjjhhhhhhkkkBBBB", "oldValue": "FL2e3jj333uuujjjhhhhhhkkk"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:37:59.405Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:38:04.855Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:38:17.270Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjjhhhhhhkkkCCC", "oldValue": "FL2e3jj333uuujjjhhhhhhkkkBBBB"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:41:43.575Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:41:49.384Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:42:07.438Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjjhhhhhhkkkDDD", "oldValue": "FL2e3jj333uuujjjhhhhhhkkkCCC"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:42:46.799Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:43:09.722Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:43:28.393Z"}, {"changes": [{"field": "State_Code", "newValue": "FL2e3jj333uuujjjhhhhhhkkkHHH", "oldValue": "FL2e3jj333uuujjjhhhhhhkkkDDD"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-19T17:20:16.023Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-19T17:20:33.083Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-19T17:21:29.088Z"}], "createdAt": "2025-03-13T19:50:00.230Z", "createdBy": "jnankani", "State_Code": "FL2e3jj333uuujjjhhhhhhkkkHHH", "lastModifiedAt": "2025-03-19T17:21:29.088Z", "lastModifiedBy": "jnankani"}, "instance_4": {"State": "Nevada", "status": "APPROVED", "_history": [{"changes": [{"field": "State", "newValue": "Nevada", "oldValue": ""}, {"field": "State_Code", "newValue": "NV", "oldValue": ""}], "timestamp": "2025-03-13T19:56:01.165Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T19:56:25.739Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-13T21:16:14.399Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkk", "oldValue": "NV"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-13T21:37:06.494Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-13T21:37:24.232Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T19:54:43.903Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkh", "oldValue": "NVkk"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T19:55:53.034Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T19:56:02.255Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T19:56:28.297Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkhkk", "oldValue": "NVkkh"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T19:57:37.150Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T19:57:44.617Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:18:23.225Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkhkk333", "oldValue": "NVkkhkk"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:18:49.176Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:19:00.151Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:20:03.645Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkhkk3339999", "oldValue": "NVkkhkk333"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:20:59.402Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:21:10.358Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:22:06.162Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkhkk3339999jjj", "oldValue": "NVkkhkk3339999"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:24:14.891Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:24:23.143Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:24:38.281Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkhkk3339999jjjhhh", "oldValue": "NVkkhkk3339999jjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:29:19.175Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:29:26.869Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:29:43.473Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkhkk3339999jjjhhhjjj", "oldValue": "NVkkhkk3339999jjjhhh"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-14T20:32:15.632Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-14T20:32:22.157Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-14T20:33:19.512Z"}, {"changes": [{"field": "State_Code", "newValue": "NVkkhkk3339999jjjhhhjjDDDD", "oldValue": "NVkkhkk3339999jjjhhhjjj"}, {"field": "status", "newValue": "DRAFT", "oldValue": "APPROVED"}], "timestamp": "2025-03-18T17:42:55.899Z"}, {"changes": [{"field": "status", "newValue": "PENDING_APPROVAL", "oldValue": "DRAFT"}], "timestamp": "2025-03-18T17:43:13.572Z"}, {"changes": [{"field": "status", "newValue": "APPROVED", "oldValue": "PENDING_APPROVAL"}], "timestamp": "2025-03-18T17:43:28.964Z"}], "createdAt": "2025-03-13T19:56:01.165Z", "createdBy": "jnankani", "State_Code": "NVkkhkk3339999jjjhhhjjDDDD", "lastModifiedAt": "2025-03-18T17:43:28.964Z", "lastModifiedBy": "jnankani"}}	2025-02-19 23:10:50.487246	2025-04-14 16:37:30.277
\.


--
-- Data for Name: reference_data_type_schemas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reference_data_type_schemas (id, reference_data_type_id, name, data_type, created_at) FROM stdin;
10	4	State	String	2025-02-19 23:10:18.494832
11	4	State_Code	String	2025-02-19 23:10:18.494832
12	5	City_Code	String	2025-02-25 21:34:12.767833
13	5	City	String	2025-02-25 21:34:12.767833
32	1	Country	String	2025-03-06 00:58:06.867126
33	1	Country_Code	String	2025-03-06 00:58:06.867126
34	1	Contry_Description	string	2025-03-06 00:58:06.867126
44	8	Site_ID	string	2025-03-07 01:04:48.648959
45	8	Site_Name	string	2025-03-07 01:04:48.648959
46	8	Site_Type	string	2025-03-07 01:04:48.648959
158	41	InventoryStatusCode	string	2025-04-17 20:39:19.53428
159	41	InventoryStatusValue	string	2025-04-17 20:39:19.53428
167	43	Code	string	2025-04-22 09:18:16.819799
168	43	Description	string	2025-04-22 09:18:16.819799
169	44	email-test	string	2025-04-22 17:33:11.222779
170	42	test1	string	2025-04-23 19:43:45.333247
171	42	test2	number	2025-04-23 19:43:45.333247
172	42	test3	string	2025-04-23 19:43:45.333247
173	42	test4	string	2025-04-23 19:43:45.333247
\.


--
-- Data for Name: reference_data_types; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reference_data_types (id, name, description, created_at, updated_at) FROM stdin;
4	State	States in the Enterprise	2025-02-19 23:10:18.494832	2025-02-19 23:10:18.494832
5	Cities	All the citiies	2025-02-25 21:34:12.767833	2025-02-25 21:34:12.767833
1	Country	Countries	2025-02-18 23:25:28.976737	2025-03-06 00:58:06.903
8	Site	Site reference data type	2025-03-05 23:40:45.245554	2025-03-07 01:04:48.684
41	Inventory Status Type	This is the status of the inventory	2025-04-17 20:39:19.53428	2025-04-17 20:39:19.53428
43	Currency	This is reference data type for currency	2025-04-22 09:17:53.32215	2025-04-22 09:18:16.821
44	test email	Email types	2025-04-22 17:33:11.222779	2025-04-22 17:33:11.222779
42	test	tersr	2025-04-22 02:26:55.222302	2025-04-23 19:43:45.362
\.


--
-- Data for Name: relationship_attribute_definitions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.relationship_attribute_definitions (id, relationship_type_id, name, data_type, is_required, description, created_at, updated_at) FROM stdin;
1	1	Attribute1	string	f	Attribute 1	2025-03-07 20:42:16.98886	2025-03-07 20:42:16.98886
2	1	Attribute2	number	f	Attribute 2	2025-03-07 20:42:31.468978	2025-03-07 20:42:31.468978
3	2	Attribute 3	string	f	Attribute 3	2025-03-07 20:46:27.30157	2025-03-07 20:46:27.30157
4	3	protocol	string	f	protocol	2025-03-08 01:43:21.453864	2025-03-08 01:43:21.453864
5	3	product	string	f	product	2025-03-08 01:44:00.824189	2025-03-08 01:44:00.824189
6	3	manufacturer	string	f	manufacturer	2025-03-08 01:44:55.119518	2025-03-08 01:44:55.119518
7	3	is_primary	string	f	is_primary	2025-03-08 01:45:15.418572	2025-03-08 01:45:15.418572
8	3	MAH	string	f	MAH	2025-03-08 01:45:34.236023	2025-03-08 01:45:34.236023
9	3	comment	string	f	comment	2025-03-08 01:45:55.78291	2025-03-08 01:45:55.78291
27	29	TestAttribute	string	f	Test Attribute for relationship	2025-04-22 09:29:26.220411	2025-04-22 09:29:26.220411
\.


--
-- Data for Name: relationship_attribute_values; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.relationship_attribute_values (id, relationship_value_id, attribute_definition_id, value, created_at, updated_at) FROM stdin;
1	6	1	Test Attribute 1	2025-03-07 23:52:16.988057	2025-03-07 23:52:16.988057
2	6	2	Test Attribute 2	2025-03-07 23:52:17.061844	2025-03-07 23:52:17.061844
3	7	1	Test Attribute 11	2025-03-07 23:52:17.19631	2025-03-07 23:52:17.19631
4	7	2	Test Attribute 22	2025-03-07 23:52:17.263241	2025-03-07 23:52:17.263241
12795	2141	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:53:03.430965	2025-03-11 01:53:03.430965
12796	2141	5	31f520fac457a753e5cebbd3f35354d4	2025-03-11 01:53:03.505103	2025-03-11 01:53:03.505103
12797	2141	6	null	2025-03-11 01:53:03.571328	2025-03-11 01:53:03.571328
12798	2141	7	TRUE	2025-03-11 01:53:03.637678	2025-03-11 01:53:03.637678
12799	2141	8	null	2025-03-11 01:53:03.704083	2025-03-11 01:53:03.704083
12800	2141	9	null	2025-03-11 01:53:03.770326	2025-03-11 01:53:03.770326
12801	2142	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:03.902285	2025-03-11 01:53:03.902285
12802	2142	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:03.968932	2025-03-11 01:53:03.968932
12803	2142	6	null	2025-03-11 01:53:04.035746	2025-03-11 01:53:04.035746
12804	2142	7	FALSE	2025-03-11 01:53:04.101281	2025-03-11 01:53:04.101281
12805	2142	8	null	2025-03-11 01:53:04.173551	2025-03-11 01:53:04.173551
12806	2142	9	null	2025-03-11 01:53:04.239925	2025-03-11 01:53:04.239925
12807	2143	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:04.371888	2025-03-11 01:53:04.371888
12808	2143	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:04.438362	2025-03-11 01:53:04.438362
12809	2143	6	null	2025-03-11 01:53:04.504352	2025-03-11 01:53:04.504352
12810	2143	7	FALSE	2025-03-11 01:53:04.570465	2025-03-11 01:53:04.570465
12811	2143	8	null	2025-03-11 01:53:04.636527	2025-03-11 01:53:04.636527
12812	2143	9	null	2025-03-11 01:53:04.702745	2025-03-11 01:53:04.702745
12813	2144	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:04.835429	2025-03-11 01:53:04.835429
12814	2144	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:04.900964	2025-03-11 01:53:04.900964
12815	2144	6	null	2025-03-11 01:53:04.966647	2025-03-11 01:53:04.966647
12816	2144	7	TRUE	2025-03-11 01:53:05.032578	2025-03-11 01:53:05.032578
12817	2144	8	null	2025-03-11 01:53:05.098576	2025-03-11 01:53:05.098576
12818	2144	9	null	2025-03-11 01:53:05.164728	2025-03-11 01:53:05.164728
12819	2145	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:05.297197	2025-03-11 01:53:05.297197
12820	2145	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:05.36327	2025-03-11 01:53:05.36327
12821	2145	6	null	2025-03-11 01:53:05.429217	2025-03-11 01:53:05.429217
12822	2145	7	TRUE	2025-03-11 01:53:05.495354	2025-03-11 01:53:05.495354
12823	2145	8	null	2025-03-11 01:53:05.563007	2025-03-11 01:53:05.563007
12824	2145	9	null	2025-03-11 01:53:05.62918	2025-03-11 01:53:05.62918
12825	2146	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:05.761213	2025-03-11 01:53:05.761213
12826	2146	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:53:05.826321	2025-03-11 01:53:05.826321
12827	2146	6	null	2025-03-11 01:53:05.893321	2025-03-11 01:53:05.893321
12828	2146	7	TRUE	2025-03-11 01:53:05.959109	2025-03-11 01:53:05.959109
12829	2146	8	null	2025-03-11 01:53:06.025099	2025-03-11 01:53:06.025099
12830	2146	9	null	2025-03-11 01:53:06.091082	2025-03-11 01:53:06.091082
12831	2147	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:06.224793	2025-03-11 01:53:06.224793
12832	2147	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:53:06.291	2025-03-11 01:53:06.291
12833	2147	6	null	2025-03-11 01:53:06.356883	2025-03-11 01:53:06.356883
12834	2147	7	TRUE	2025-03-11 01:53:06.423525	2025-03-11 01:53:06.423525
12835	2147	8	null	2025-03-11 01:53:06.490204	2025-03-11 01:53:06.490204
12836	2147	9	null	2025-03-11 01:53:06.556419	2025-03-11 01:53:06.556419
12837	2148	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:06.68962	2025-03-11 01:53:06.68962
12838	2148	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:06.757821	2025-03-11 01:53:06.757821
12839	2148	6	null	2025-03-11 01:53:06.824872	2025-03-11 01:53:06.824872
12840	2148	7	TRUE	2025-03-11 01:53:06.890882	2025-03-11 01:53:06.890882
12841	2148	8	null	2025-03-11 01:53:06.95722	2025-03-11 01:53:06.95722
12842	2148	9	null	2025-03-11 01:53:07.023492	2025-03-11 01:53:07.023492
12843	2149	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:07.155871	2025-03-11 01:53:07.155871
12844	2149	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:07.221745	2025-03-11 01:53:07.221745
12845	2149	6	null	2025-03-11 01:53:07.287662	2025-03-11 01:53:07.287662
12846	2149	7	FALSE	2025-03-11 01:53:07.353948	2025-03-11 01:53:07.353948
12847	2149	8	null	2025-03-11 01:53:07.419956	2025-03-11 01:53:07.419956
12848	2149	9	null	2025-03-11 01:53:07.485795	2025-03-11 01:53:07.485795
12849	2150	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:07.620717	2025-03-11 01:53:07.620717
12850	2150	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:07.687557	2025-03-11 01:53:07.687557
12851	2150	6	null	2025-03-11 01:53:07.754048	2025-03-11 01:53:07.754048
12852	2150	7	FALSE	2025-03-11 01:53:07.820176	2025-03-11 01:53:07.820176
12853	2150	8	null	2025-03-11 01:53:07.886392	2025-03-11 01:53:07.886392
12854	2150	9	null	2025-03-11 01:53:07.953021	2025-03-11 01:53:07.953021
12855	2151	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:08.084335	2025-03-11 01:53:08.084335
12856	2151	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:53:08.149432	2025-03-11 01:53:08.149432
12857	2151	6	null	2025-03-11 01:53:08.217473	2025-03-11 01:53:08.217473
12858	2151	7	FALSE	2025-03-11 01:53:08.284036	2025-03-11 01:53:08.284036
12859	2151	8	null	2025-03-11 01:53:08.350808	2025-03-11 01:53:08.350808
12860	2151	9	null	2025-03-11 01:53:08.416685	2025-03-11 01:53:08.416685
12861	2152	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:08.550463	2025-03-11 01:53:08.550463
12862	2152	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:08.616327	2025-03-11 01:53:08.616327
12863	2152	6	null	2025-03-11 01:53:08.686217	2025-03-11 01:53:08.686217
12864	2152	7	FALSE	2025-03-11 01:53:08.752888	2025-03-11 01:53:08.752888
12865	2152	8	null	2025-03-11 01:53:08.818949	2025-03-11 01:53:08.818949
12866	2152	9	null	2025-03-11 01:53:08.884777	2025-03-11 01:53:08.884777
12867	2153	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:09.021025	2025-03-11 01:53:09.021025
12868	2153	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:53:09.086567	2025-03-11 01:53:09.086567
12869	2153	6	null	2025-03-11 01:53:09.152152	2025-03-11 01:53:09.152152
12870	2153	7	TRUE	2025-03-11 01:53:09.218586	2025-03-11 01:53:09.218586
12871	2153	8	null	2025-03-11 01:53:09.284778	2025-03-11 01:53:09.284778
12872	2153	9	null	2025-03-11 01:53:09.350686	2025-03-11 01:53:09.350686
12873	2154	4	66aba5325027ecf2e633272fd33574f8	2025-03-11 01:53:09.486062	2025-03-11 01:53:09.486062
12874	2154	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:09.555878	2025-03-11 01:53:09.555878
12875	2154	6	null	2025-03-11 01:53:09.621908	2025-03-11 01:53:09.621908
12876	2154	7	FALSE	2025-03-11 01:53:09.687395	2025-03-11 01:53:09.687395
12877	2154	8	null	2025-03-11 01:53:09.752427	2025-03-11 01:53:09.752427
12878	2154	9	null	2025-03-11 01:53:09.818653	2025-03-11 01:53:09.818653
12879	2155	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:09.961493	2025-03-11 01:53:09.961493
12880	2155	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:10.02757	2025-03-11 01:53:10.02757
12881	2155	6	null	2025-03-11 01:53:10.094412	2025-03-11 01:53:10.094412
12882	2155	7	TRUE	2025-03-11 01:53:10.160533	2025-03-11 01:53:10.160533
12883	2155	8	null	2025-03-11 01:53:10.226766	2025-03-11 01:53:10.226766
12884	2155	9	null	2025-03-11 01:53:10.292654	2025-03-11 01:53:10.292654
12885	2156	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:10.425631	2025-03-11 01:53:10.425631
12886	2156	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:10.491849	2025-03-11 01:53:10.491849
12887	2156	6	null	2025-03-11 01:53:10.558184	2025-03-11 01:53:10.558184
12888	2156	7	FALSE	2025-03-11 01:53:10.624004	2025-03-11 01:53:10.624004
12889	2156	8	null	2025-03-11 01:53:10.69022	2025-03-11 01:53:10.69022
12890	2156	9	null	2025-03-11 01:53:10.757944	2025-03-11 01:53:10.757944
12891	2157	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:10.890065	2025-03-11 01:53:10.890065
12892	2157	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:10.955968	2025-03-11 01:53:10.955968
12893	2157	6	null	2025-03-11 01:53:11.022047	2025-03-11 01:53:11.022047
12894	2157	7	FALSE	2025-03-11 01:53:11.088914	2025-03-11 01:53:11.088914
12895	2157	8	null	2025-03-11 01:53:11.154894	2025-03-11 01:53:11.154894
12896	2157	9	null	2025-03-11 01:53:11.220904	2025-03-11 01:53:11.220904
12897	2158	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:53:11.353486	2025-03-11 01:53:11.353486
12898	2158	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:11.419312	2025-03-11 01:53:11.419312
12899	2158	6	null	2025-03-11 01:53:11.485193	2025-03-11 01:53:11.485193
12900	2158	7	TRUE	2025-03-11 01:53:11.551549	2025-03-11 01:53:11.551549
12901	2158	8	null	2025-03-11 01:53:11.617796	2025-03-11 01:53:11.617796
12902	2158	9	null	2025-03-11 01:53:11.684144	2025-03-11 01:53:11.684144
12903	2159	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:53:11.816762	2025-03-11 01:53:11.816762
12904	2159	5	4bfc57beda84f0069a1647806d9dee3c	2025-03-11 01:53:11.886827	2025-03-11 01:53:11.886827
12905	2159	6	null	2025-03-11 01:53:11.952933	2025-03-11 01:53:11.952933
12906	2159	7	TRUE	2025-03-11 01:53:12.018845	2025-03-11 01:53:12.018845
12907	2159	8	null	2025-03-11 01:53:12.084921	2025-03-11 01:53:12.084921
12908	2159	9	null	2025-03-11 01:53:12.150633	2025-03-11 01:53:12.150633
12909	2160	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:53:12.283224	2025-03-11 01:53:12.283224
12910	2160	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:12.349035	2025-03-11 01:53:12.349035
12911	2160	6	null	2025-03-11 01:53:12.415033	2025-03-11 01:53:12.415033
12912	2160	7	TRUE	2025-03-11 01:53:12.480982	2025-03-11 01:53:12.480982
12913	2160	8	null	2025-03-11 01:53:12.546983	2025-03-11 01:53:12.546983
12914	2160	9	null	2025-03-11 01:53:12.613049	2025-03-11 01:53:12.613049
12915	2161	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:53:12.74488	2025-03-11 01:53:12.74488
12916	2161	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:12.811047	2025-03-11 01:53:12.811047
12917	2161	6	null	2025-03-11 01:53:12.876952	2025-03-11 01:53:12.876952
12918	2161	7	TRUE	2025-03-11 01:53:12.942919	2025-03-11 01:53:12.942919
12919	2161	8	null	2025-03-11 01:53:13.008896	2025-03-11 01:53:13.008896
12920	2161	9	null	2025-03-11 01:53:13.075557	2025-03-11 01:53:13.075557
12921	2162	4	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:53:13.207982	2025-03-11 01:53:13.207982
12922	2162	5	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:53:13.274143	2025-03-11 01:53:13.274143
12923	2162	6	null	2025-03-11 01:53:13.340892	2025-03-11 01:53:13.340892
12924	2162	7	TRUE	2025-03-11 01:53:13.407968	2025-03-11 01:53:13.407968
12925	2162	8	null	2025-03-11 01:53:13.474106	2025-03-11 01:53:13.474106
12926	2162	9	null	2025-03-11 01:53:13.540275	2025-03-11 01:53:13.540275
12927	2163	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:53:13.671932	2025-03-11 01:53:13.671932
12928	2163	5	586b3a06c378b072fb36850155829d84	2025-03-11 01:53:13.738015	2025-03-11 01:53:13.738015
12929	2163	6	null	2025-03-11 01:53:13.804947	2025-03-11 01:53:13.804947
12930	2163	7	FALSE	2025-03-11 01:53:13.871044	2025-03-11 01:53:13.871044
12931	2163	8	null	2025-03-11 01:53:13.937159	2025-03-11 01:53:13.937159
12932	2163	9	null	2025-03-11 01:53:14.003087	2025-03-11 01:53:14.003087
12933	2164	4	28182d35876bad5fef39f13a6398bbbd	2025-03-11 01:53:14.139331	2025-03-11 01:53:14.139331
12934	2164	5	faba2605558da2b45b5c50087298b8bf	2025-03-11 01:53:14.205588	2025-03-11 01:53:14.205588
12935	2164	6	null	2025-03-11 01:53:14.271689	2025-03-11 01:53:14.271689
12936	2164	7	FALSE	2025-03-11 01:53:14.33817	2025-03-11 01:53:14.33817
12937	2164	8	null	2025-03-11 01:53:14.405093	2025-03-11 01:53:14.405093
12938	2164	9	null	2025-03-11 01:53:14.471162	2025-03-11 01:53:14.471162
12939	2165	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:53:14.603167	2025-03-11 01:53:14.603167
12940	2165	5	586b3a06c378b072fb36850155829d84	2025-03-11 01:53:14.669257	2025-03-11 01:53:14.669257
12941	2165	6	null	2025-03-11 01:53:14.735391	2025-03-11 01:53:14.735391
12942	2165	7	FALSE	2025-03-11 01:53:14.802261	2025-03-11 01:53:14.802261
12943	2165	8	null	2025-03-11 01:53:14.867984	2025-03-11 01:53:14.867984
12944	2165	9	null	2025-03-11 01:53:14.933889	2025-03-11 01:53:14.933889
12945	2166	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:53:15.071084	2025-03-11 01:53:15.071084
12946	2166	5	586b3a06c378b072fb36850155829d84	2025-03-11 01:53:15.137221	2025-03-11 01:53:15.137221
12947	2166	6	null	2025-03-11 01:53:15.203142	2025-03-11 01:53:15.203142
12948	2166	7	FALSE	2025-03-11 01:53:15.269771	2025-03-11 01:53:15.269771
12949	2166	8	null	2025-03-11 01:53:15.337333	2025-03-11 01:53:15.337333
12950	2166	9	null	2025-03-11 01:53:15.405658	2025-03-11 01:53:15.405658
12951	2167	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:53:15.540901	2025-03-11 01:53:15.540901
12952	2167	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:15.60705	2025-03-11 01:53:15.60705
12953	2167	6	null	2025-03-11 01:53:15.67404	2025-03-11 01:53:15.67404
12954	2167	7	TRUE	2025-03-11 01:53:15.742557	2025-03-11 01:53:15.742557
12955	2167	8	null	2025-03-11 01:53:15.808914	2025-03-11 01:53:15.808914
12956	2167	9	null	2025-03-11 01:53:15.875023	2025-03-11 01:53:15.875023
12957	2168	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:16.007086	2025-03-11 01:53:16.007086
12958	2168	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:16.073208	2025-03-11 01:53:16.073208
12959	2168	6	null	2025-03-11 01:53:16.139078	2025-03-11 01:53:16.139078
12960	2168	7	TRUE	2025-03-11 01:53:16.205425	2025-03-11 01:53:16.205425
12961	2168	8	null	2025-03-11 01:53:16.271466	2025-03-11 01:53:16.271466
12962	2168	9	null	2025-03-11 01:53:16.337536	2025-03-11 01:53:16.337536
12963	2169	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:53:16.469632	2025-03-11 01:53:16.469632
12964	2169	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:16.535418	2025-03-11 01:53:16.535418
12965	2169	6	null	2025-03-11 01:53:16.601257	2025-03-11 01:53:16.601257
12966	2169	7	TRUE	2025-03-11 01:53:16.667873	2025-03-11 01:53:16.667873
12967	2169	8	null	2025-03-11 01:53:16.733909	2025-03-11 01:53:16.733909
12968	2169	9	null	2025-03-11 01:53:16.799997	2025-03-11 01:53:16.799997
12969	2170	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:53:16.931907	2025-03-11 01:53:16.931907
12970	2170	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:16.997747	2025-03-11 01:53:16.997747
12971	2170	6	null	2025-03-11 01:53:17.063521	2025-03-11 01:53:17.063521
12972	2170	7	FALSE	2025-03-11 01:53:17.133264	2025-03-11 01:53:17.133264
12973	2170	8	null	2025-03-11 01:53:17.200049	2025-03-11 01:53:17.200049
12974	2170	9	null	2025-03-11 01:53:17.26597	2025-03-11 01:53:17.26597
12975	2171	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:53:17.397884	2025-03-11 01:53:17.397884
12976	2171	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:17.464203	2025-03-11 01:53:17.464203
12977	2171	6	null	2025-03-11 01:53:17.529383	2025-03-11 01:53:17.529383
12978	2171	7	TRUE	2025-03-11 01:53:17.594481	2025-03-11 01:53:17.594481
12979	2171	8	null	2025-03-11 01:53:17.660385	2025-03-11 01:53:17.660385
12980	2171	9	null	2025-03-11 01:53:17.726387	2025-03-11 01:53:17.726387
12981	2172	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:17.862991	2025-03-11 01:53:17.862991
12982	2172	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:17.930174	2025-03-11 01:53:17.930174
12983	2172	6	null	2025-03-11 01:53:17.995295	2025-03-11 01:53:17.995295
12984	2172	7	TRUE	2025-03-11 01:53:18.061337	2025-03-11 01:53:18.061337
12985	2172	8	null	2025-03-11 01:53:18.127383	2025-03-11 01:53:18.127383
12986	2172	9	null	2025-03-11 01:53:18.192344	2025-03-11 01:53:18.192344
12987	2173	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:18.324548	2025-03-11 01:53:18.324548
12988	2173	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:18.39075	2025-03-11 01:53:18.39075
12989	2173	6	null	2025-03-11 01:53:18.457628	2025-03-11 01:53:18.457628
12990	2173	7	TRUE	2025-03-11 01:53:18.523734	2025-03-11 01:53:18.523734
12991	2173	8	null	2025-03-11 01:53:18.590234	2025-03-11 01:53:18.590234
12992	2173	9	null	2025-03-11 01:53:18.656307	2025-03-11 01:53:18.656307
12993	2174	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:18.788885	2025-03-11 01:53:18.788885
12994	2174	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:18.854778	2025-03-11 01:53:18.854778
12995	2174	6	null	2025-03-11 01:53:18.926775	2025-03-11 01:53:18.926775
12996	2174	7	TRUE	2025-03-11 01:53:18.99275	2025-03-11 01:53:18.99275
12997	2174	8	null	2025-03-11 01:53:19.059435	2025-03-11 01:53:19.059435
12998	2174	9	null	2025-03-11 01:53:19.125844	2025-03-11 01:53:19.125844
12999	2175	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:53:19.257765	2025-03-11 01:53:19.257765
13000	2175	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:19.323574	2025-03-11 01:53:19.323574
13001	2175	6	null	2025-03-11 01:53:19.389419	2025-03-11 01:53:19.389419
13002	2175	7	TRUE	2025-03-11 01:53:19.45522	2025-03-11 01:53:19.45522
13003	2175	8	null	2025-03-11 01:53:19.52127	2025-03-11 01:53:19.52127
13004	2175	9	null	2025-03-11 01:53:19.587901	2025-03-11 01:53:19.587901
13005	2176	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:53:19.719708	2025-03-11 01:53:19.719708
13006	2176	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:19.786107	2025-03-11 01:53:19.786107
13007	2176	6	null	2025-03-11 01:53:19.852739	2025-03-11 01:53:19.852739
13008	2176	7	FALSE	2025-03-11 01:53:19.920973	2025-03-11 01:53:19.920973
13009	2176	8	null	2025-03-11 01:53:19.987302	2025-03-11 01:53:19.987302
13010	2176	9	null	2025-03-11 01:53:20.053268	2025-03-11 01:53:20.053268
13011	2177	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:53:20.185931	2025-03-11 01:53:20.185931
13012	2177	5	9626bbd88c300cb77b5697e32bd86518	2025-03-11 01:53:20.251874	2025-03-11 01:53:20.251874
13013	2177	6	null	2025-03-11 01:53:20.31781	2025-03-11 01:53:20.31781
13014	2177	7	TRUE	2025-03-11 01:53:20.383843	2025-03-11 01:53:20.383843
13015	2177	8	null	2025-03-11 01:53:20.449581	2025-03-11 01:53:20.449581
13016	2177	9	null	2025-03-11 01:53:20.515286	2025-03-11 01:53:20.515286
13017	2178	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:53:20.650639	2025-03-11 01:53:20.650639
13018	2178	5	f23737d6936b141a620d01584397b6cb	2025-03-11 01:53:20.716725	2025-03-11 01:53:20.716725
13019	2178	6	null	2025-03-11 01:53:20.782672	2025-03-11 01:53:20.782672
13020	2178	7	TRUE	2025-03-11 01:53:20.848943	2025-03-11 01:53:20.848943
13021	2178	8	null	2025-03-11 01:53:20.914999	2025-03-11 01:53:20.914999
13022	2178	9	null	2025-03-11 01:53:20.980978	2025-03-11 01:53:20.980978
13023	2179	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:53:21.112744	2025-03-11 01:53:21.112744
13024	2179	5	cfcb336f8e3001ab3a64ffef55e44614	2025-03-11 01:53:21.178623	2025-03-11 01:53:21.178623
13025	2179	6	null	2025-03-11 01:53:21.243414	2025-03-11 01:53:21.243414
13026	2179	7	TRUE	2025-03-11 01:53:21.30923	2025-03-11 01:53:21.30923
13027	2179	8	null	2025-03-11 01:53:21.381384	2025-03-11 01:53:21.381384
13028	2179	9	null	2025-03-11 01:53:21.448976	2025-03-11 01:53:21.448976
13029	2180	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:53:21.58103	2025-03-11 01:53:21.58103
13030	2180	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:53:21.647484	2025-03-11 01:53:21.647484
13031	2180	6	null	2025-03-11 01:53:21.712349	2025-03-11 01:53:21.712349
13032	2180	7	TRUE	2025-03-11 01:53:21.780179	2025-03-11 01:53:21.780179
13033	2180	8	null	2025-03-11 01:53:21.846216	2025-03-11 01:53:21.846216
13034	2180	9	null	2025-03-11 01:53:21.912234	2025-03-11 01:53:21.912234
13035	2181	4	000e03e7bf24ac1915212b0467218ec9	2025-03-11 01:53:22.049944	2025-03-11 01:53:22.049944
13036	2181	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:22.11582	2025-03-11 01:53:22.11582
13037	2181	6	null	2025-03-11 01:53:22.181638	2025-03-11 01:53:22.181638
13038	2181	7	FALSE	2025-03-11 01:53:22.247692	2025-03-11 01:53:22.247692
13039	2181	8	null	2025-03-11 01:53:22.313424	2025-03-11 01:53:22.313424
13040	2181	9	null	2025-03-11 01:53:22.379606	2025-03-11 01:53:22.379606
13041	2182	4	72d3c570e7cf57267a69ae2d5ad64d95	2025-03-11 01:53:22.512371	2025-03-11 01:53:22.512371
13042	2182	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:22.578291	2025-03-11 01:53:22.578291
13043	2182	6	null	2025-03-11 01:53:22.645452	2025-03-11 01:53:22.645452
13044	2182	7	TRUE	2025-03-11 01:53:22.712268	2025-03-11 01:53:22.712268
13045	2182	8	null	2025-03-11 01:53:22.778172	2025-03-11 01:53:22.778172
13046	2182	9	null	2025-03-11 01:53:22.844993	2025-03-11 01:53:22.844993
13047	2183	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:22.977143	2025-03-11 01:53:22.977143
13048	2183	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:23.043576	2025-03-11 01:53:23.043576
13049	2183	6	null	2025-03-11 01:53:23.109445	2025-03-11 01:53:23.109445
13050	2183	7	TRUE	2025-03-11 01:53:23.175337	2025-03-11 01:53:23.175337
13051	2183	8	null	2025-03-11 01:53:23.241745	2025-03-11 01:53:23.241745
13052	2183	9	null	2025-03-11 01:53:23.309673	2025-03-11 01:53:23.309673
13053	2184	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:53:23.450866	2025-03-11 01:53:23.450866
13054	2184	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:53:23.517542	2025-03-11 01:53:23.517542
13055	2184	6	null	2025-03-11 01:53:23.58235	2025-03-11 01:53:23.58235
13056	2184	7	FALSE	2025-03-11 01:53:23.648542	2025-03-11 01:53:23.648542
13057	2184	8	null	2025-03-11 01:53:23.714693	2025-03-11 01:53:23.714693
13058	2184	9	null	2025-03-11 01:53:23.780917	2025-03-11 01:53:23.780917
13059	2185	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:53:23.913811	2025-03-11 01:53:23.913811
13060	2185	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:53:23.979614	2025-03-11 01:53:23.979614
13061	2185	6	null	2025-03-11 01:53:24.045439	2025-03-11 01:53:24.045439
13062	2185	7	TRUE	2025-03-11 01:53:24.111493	2025-03-11 01:53:24.111493
13063	2185	8	null	2025-03-11 01:53:24.177299	2025-03-11 01:53:24.177299
13064	2185	9	null	2025-03-11 01:53:24.243002	2025-03-11 01:53:24.243002
13065	2186	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:53:24.374989	2025-03-11 01:53:24.374989
13066	2186	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:24.441099	2025-03-11 01:53:24.441099
13067	2186	6	null	2025-03-11 01:53:24.506912	2025-03-11 01:53:24.506912
13068	2186	7	TRUE	2025-03-11 01:53:24.572818	2025-03-11 01:53:24.572818
13069	2186	8	null	2025-03-11 01:53:24.63892	2025-03-11 01:53:24.63892
13070	2186	9	null	2025-03-11 01:53:24.709027	2025-03-11 01:53:24.709027
13071	2187	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:53:24.840616	2025-03-11 01:53:24.840616
13072	2187	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:24.906913	2025-03-11 01:53:24.906913
13073	2187	6	null	2025-03-11 01:53:24.972833	2025-03-11 01:53:24.972833
13074	2187	7	TRUE	2025-03-11 01:53:25.038522	2025-03-11 01:53:25.038522
13075	2187	8	null	2025-03-11 01:53:25.12958	2025-03-11 01:53:25.12958
13076	2187	9	null	2025-03-11 01:53:25.195572	2025-03-11 01:53:25.195572
13077	2188	4	66aba5325027ecf2e633272fd33574f8	2025-03-11 01:53:25.327602	2025-03-11 01:53:25.327602
13078	2188	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:25.39352	2025-03-11 01:53:25.39352
13079	2188	6	null	2025-03-11 01:53:25.459501	2025-03-11 01:53:25.459501
13080	2188	7	FALSE	2025-03-11 01:53:25.52542	2025-03-11 01:53:25.52542
13081	2188	8	null	2025-03-11 01:53:25.591267	2025-03-11 01:53:25.591267
13082	2188	9	null	2025-03-11 01:53:25.657029	2025-03-11 01:53:25.657029
13083	2189	4	66c00d9da45fe83e335fe79e8a32638d	2025-03-11 01:53:25.788483	2025-03-11 01:53:25.788483
13084	2189	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:25.85445	2025-03-11 01:53:25.85445
13085	2189	6	null	2025-03-11 01:53:25.921302	2025-03-11 01:53:25.921302
13086	2189	7	FALSE	2025-03-11 01:53:25.987389	2025-03-11 01:53:25.987389
13087	2189	8	null	2025-03-11 01:53:26.053234	2025-03-11 01:53:26.053234
13088	2189	9	null	2025-03-11 01:53:26.119649	2025-03-11 01:53:26.119649
13089	2190	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:53:26.251487	2025-03-11 01:53:26.251487
13090	2190	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:26.316262	2025-03-11 01:53:26.316262
13091	2190	6	null	2025-03-11 01:53:26.382258	2025-03-11 01:53:26.382258
13092	2190	7	TRUE	2025-03-11 01:53:26.447935	2025-03-11 01:53:26.447935
13093	2190	8	null	2025-03-11 01:53:26.513985	2025-03-11 01:53:26.513985
13094	2190	9	null	2025-03-11 01:53:26.579723	2025-03-11 01:53:26.579723
13095	2191	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:53:26.714457	2025-03-11 01:53:26.714457
13096	2191	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:26.780579	2025-03-11 01:53:26.780579
13097	2191	6	null	2025-03-11 01:53:26.848994	2025-03-11 01:53:26.848994
13098	2191	7	TRUE	2025-03-11 01:53:26.938697	2025-03-11 01:53:26.938697
13099	2191	8	null	2025-03-11 01:53:27.009294	2025-03-11 01:53:27.009294
13100	2191	9	null	2025-03-11 01:53:27.078075	2025-03-11 01:53:27.078075
13101	2192	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:53:27.210363	2025-03-11 01:53:27.210363
13102	2192	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:27.276318	2025-03-11 01:53:27.276318
13103	2192	6	null	2025-03-11 01:53:27.342483	2025-03-11 01:53:27.342483
13104	2192	7	FALSE	2025-03-11 01:53:27.407406	2025-03-11 01:53:27.407406
13105	2192	8	null	2025-03-11 01:53:27.472335	2025-03-11 01:53:27.472335
13106	2192	9	null	2025-03-11 01:53:27.538414	2025-03-11 01:53:27.538414
13107	2193	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:53:27.672697	2025-03-11 01:53:27.672697
13108	2193	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:27.744507	2025-03-11 01:53:27.744507
13109	2193	6	null	2025-03-11 01:53:27.813813	2025-03-11 01:53:27.813813
13110	2193	7	TRUE	2025-03-11 01:53:27.879939	2025-03-11 01:53:27.879939
13111	2193	8	null	2025-03-11 01:53:27.946216	2025-03-11 01:53:27.946216
13112	2193	9	null	2025-03-11 01:53:28.012357	2025-03-11 01:53:28.012357
13113	2194	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:28.144995	2025-03-11 01:53:28.144995
13114	2194	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:28.211051	2025-03-11 01:53:28.211051
13115	2194	6	null	2025-03-11 01:53:28.278706	2025-03-11 01:53:28.278706
13116	2194	7	TRUE	2025-03-11 01:53:28.348956	2025-03-11 01:53:28.348956
13117	2194	8	null	2025-03-11 01:53:28.415059	2025-03-11 01:53:28.415059
13118	2194	9	null	2025-03-11 01:53:28.481142	2025-03-11 01:53:28.481142
13119	2195	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:53:28.613022	2025-03-11 01:53:28.613022
13120	2195	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:28.678821	2025-03-11 01:53:28.678821
13121	2195	6	null	2025-03-11 01:53:28.744943	2025-03-11 01:53:28.744943
13122	2195	7	TRUE	2025-03-11 01:53:28.810892	2025-03-11 01:53:28.810892
13123	2195	8	null	2025-03-11 01:53:28.877006	2025-03-11 01:53:28.877006
13124	2195	9	null	2025-03-11 01:53:28.944131	2025-03-11 01:53:28.944131
13125	2196	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:53:29.076537	2025-03-11 01:53:29.076537
13126	2196	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:29.142719	2025-03-11 01:53:29.142719
13127	2196	6	null	2025-03-11 01:53:29.208652	2025-03-11 01:53:29.208652
13128	2196	7	FALSE	2025-03-11 01:53:29.274573	2025-03-11 01:53:29.274573
13129	2196	8	null	2025-03-11 01:53:29.340496	2025-03-11 01:53:29.340496
13130	2196	9	null	2025-03-11 01:53:29.406347	2025-03-11 01:53:29.406347
13131	2197	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:53:29.538058	2025-03-11 01:53:29.538058
13132	2197	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:29.604324	2025-03-11 01:53:29.604324
13133	2197	6	null	2025-03-11 01:53:29.672857	2025-03-11 01:53:29.672857
13134	2197	7	TRUE	2025-03-11 01:53:29.741579	2025-03-11 01:53:29.741579
13135	2197	8	null	2025-03-11 01:53:29.808778	2025-03-11 01:53:29.808778
13136	2197	9	null	2025-03-11 01:53:29.874928	2025-03-11 01:53:29.874928
13137	2198	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:30.007329	2025-03-11 01:53:30.007329
13138	2198	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:30.073339	2025-03-11 01:53:30.073339
13139	2198	6	null	2025-03-11 01:53:30.139552	2025-03-11 01:53:30.139552
13140	2198	7	FALSE	2025-03-11 01:53:30.205522	2025-03-11 01:53:30.205522
13141	2198	8	null	2025-03-11 01:53:30.271753	2025-03-11 01:53:30.271753
13142	2198	9	null	2025-03-11 01:53:30.33752	2025-03-11 01:53:30.33752
13143	2199	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:53:30.469953	2025-03-11 01:53:30.469953
13144	2199	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:53:30.536509	2025-03-11 01:53:30.536509
13145	2199	6	null	2025-03-11 01:53:30.60264	2025-03-11 01:53:30.60264
13146	2199	7	TRUE	2025-03-11 01:53:30.669626	2025-03-11 01:53:30.669626
13147	2199	8	null	2025-03-11 01:53:30.736891	2025-03-11 01:53:30.736891
13148	2199	9	null	2025-03-11 01:53:30.802684	2025-03-11 01:53:30.802684
13149	2200	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:53:30.935099	2025-03-11 01:53:30.935099
13150	2200	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:53:31.001025	2025-03-11 01:53:31.001025
13151	2200	6	null	2025-03-11 01:53:31.066686	2025-03-11 01:53:31.066686
13152	2200	7	FALSE	2025-03-11 01:53:31.132502	2025-03-11 01:53:31.132502
13153	2200	8	null	2025-03-11 01:53:31.198252	2025-03-11 01:53:31.198252
13154	2200	9	null	2025-03-11 01:53:31.263794	2025-03-11 01:53:31.263794
13155	2201	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:53:31.395776	2025-03-11 01:53:31.395776
13156	2201	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:53:31.461684	2025-03-11 01:53:31.461684
13157	2201	6	null	2025-03-11 01:53:31.527657	2025-03-11 01:53:31.527657
13158	2201	7	TRUE	2025-03-11 01:53:31.594296	2025-03-11 01:53:31.594296
13159	2201	8	null	2025-03-11 01:53:31.66008	2025-03-11 01:53:31.66008
13160	2201	9	null	2025-03-11 01:53:31.725842	2025-03-11 01:53:31.725842
13161	2202	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:31.858964	2025-03-11 01:53:31.858964
13162	2202	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:53:31.92554	2025-03-11 01:53:31.92554
13163	2202	6	null	2025-03-11 01:53:31.991266	2025-03-11 01:53:31.991266
13164	2202	7	TRUE	2025-03-11 01:53:32.057271	2025-03-11 01:53:32.057271
13165	2202	8	null	2025-03-11 01:53:32.123193	2025-03-11 01:53:32.123193
13166	2202	9	null	2025-03-11 01:53:32.189267	2025-03-11 01:53:32.189267
13167	2203	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:32.321512	2025-03-11 01:53:32.321512
13168	2203	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:53:32.389358	2025-03-11 01:53:32.389358
13169	2203	6	null	2025-03-11 01:53:32.455322	2025-03-11 01:53:32.455322
13170	2203	7	FALSE	2025-03-11 01:53:32.521277	2025-03-11 01:53:32.521277
13171	2203	8	null	2025-03-11 01:53:32.587338	2025-03-11 01:53:32.587338
13172	2203	9	null	2025-03-11 01:53:32.653772	2025-03-11 01:53:32.653772
13173	2204	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:53:32.784339	2025-03-11 01:53:32.784339
13174	2204	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:53:32.850225	2025-03-11 01:53:32.850225
13175	2204	6	null	2025-03-11 01:53:32.916586	2025-03-11 01:53:32.916586
13176	2204	7	TRUE	2025-03-11 01:53:32.982569	2025-03-11 01:53:32.982569
13177	2204	8	null	2025-03-11 01:53:33.048975	2025-03-11 01:53:33.048975
13178	2204	9	null	2025-03-11 01:53:33.117548	2025-03-11 01:53:33.117548
13179	2205	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:33.24999	2025-03-11 01:53:33.24999
13180	2205	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:33.317091	2025-03-11 01:53:33.317091
13181	2205	6	null	2025-03-11 01:53:33.384894	2025-03-11 01:53:33.384894
13182	2205	7	FALSE	2025-03-11 01:53:33.450799	2025-03-11 01:53:33.450799
13183	2205	8	Keytruda Brazil MA holder number: 1017102090017	2025-03-11 01:53:33.517414	2025-03-11 01:53:33.517414
13184	2205	9	null	2025-03-11 01:53:33.583409	2025-03-11 01:53:33.583409
13185	2206	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:33.71557	2025-03-11 01:53:33.71557
13186	2206	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:33.785128	2025-03-11 01:53:33.785128
13187	2206	6	Organon Heist bv Industriepark 30 2220 Heist-op-den-Berg Belgium OR Merck Sharp & Dohme BV Waarderweg 39 2031 BN Haarlem The Netherlands	2025-03-11 01:53:33.851569	2025-03-11 01:53:33.851569
13188	2206	7	TRUE	2025-03-11 01:53:33.918324	2025-03-11 01:53:33.918324
13189	2206	8	Merck Sharp & Dohme BV Waarderweg 39 2031 BN Haarlem The Netherlands	2025-03-11 01:53:33.984241	2025-03-11 01:53:33.984241
13190	2206	9	null	2025-03-11 01:53:34.052896	2025-03-11 01:53:34.052896
13191	2207	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:53:34.19151	2025-03-11 01:53:34.19151
13192	2207	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:53:34.257658	2025-03-11 01:53:34.257658
13193	2207	6	(Sunitib malate) Pfizer Labs Division of Pfizer Inc New York, NY 10017 \nOR\n(Sunitinib) AqVida GmbH 20355 Hamburg Germany\nOR\nSun Pharmaceutical Industries Ltd. Survey No. 259/15, Dadra-396 191 (U.T. of D & NH), India.	2025-03-11 01:53:34.323796	2025-03-11 01:53:34.323796
13194	2207	7	TRUE	2025-03-11 01:53:34.389749	2025-03-11 01:53:34.389749
13195	2207	8	(Sunitinib malate 12.5mg) \nEU/1/06/347/001\nEU/1/06/347/004\nPfizer Europe MA EEIG Boulevard de la Plaine 17 1050 Bruxelles Belgium\nUSA: NDC 0069-0550-38\nPfizer Labs Division of Pfizer Inc New York, NY 10017\nOR\n(Sunitinib malate 25mg) \nEU/1/06/347/002\nEU/1/06/347/005\nPfizer Europe MA EEIG Boulevard de la Plaine 17 1050 Bruxelles Belgium\nUSA: NDC 0069-0770-38\nPfizer Labs Division of Pfizer Inc New York, NY 10017\nOR\n(Sunitinib)\nEU 98710.00.00 (12.5mg)\nEU 98711.00.00 (25mg)\nAqVida GmbH Kaiser-Wilheilm-Str. 89 20355 Hamburg Germany\nOR\n(Sunitinib)\nUSA NDC:16714-676 (12.5mg)\nUSA NDC:16714-677 (25mg)\nNorthStar Rx LLC Memphis, TN 38141	2025-03-11 01:53:34.455976	2025-03-11 01:53:34.455976
13196	2207	9	null	2025-03-11 01:53:34.5222	2025-03-11 01:53:34.5222
13197	2208	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:34.657053	2025-03-11 01:53:34.657053
13198	2208	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:34.723734	2025-03-11 01:53:34.723734
13199	2208	6	null	2025-03-11 01:53:34.790275	2025-03-11 01:53:34.790275
13200	2208	7	FALSE	2025-03-11 01:53:34.856069	2025-03-11 01:53:34.856069
13201	2208	8	null	2025-03-11 01:53:34.921547	2025-03-11 01:53:34.921547
13202	2208	9	null	2025-03-11 01:53:34.986453	2025-03-11 01:53:34.986453
13203	2209	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:53:35.119337	2025-03-11 01:53:35.119337
13204	2209	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:53:35.185395	2025-03-11 01:53:35.185395
13205	2209	6	null	2025-03-11 01:53:35.251951	2025-03-11 01:53:35.251951
13206	2209	7	TRUE	2025-03-11 01:53:35.318024	2025-03-11 01:53:35.318024
13207	2209	8	null	2025-03-11 01:53:35.383967	2025-03-11 01:53:35.383967
13208	2209	9	null	2025-03-11 01:53:35.450004	2025-03-11 01:53:35.450004
13209	2210	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:53:35.58718	2025-03-11 01:53:35.58718
13210	2210	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:35.656183	2025-03-11 01:53:35.656183
13211	2210	6	USA:\nBristol-Myers Squibb\nCompany\nPrinceton, NJ 08543\nUSA\nEU:\nSwords Laboratories t/a\nBristol-Myers\nSquibb Cruiserath Biologics\nCruiserath Road,\nMulhuddart\nDublin 15, D15 H6EF\nIreland	2025-03-11 01:53:35.722174	2025-03-11 01:53:35.722174
13212	2210	7	TRUE	2025-03-11 01:53:35.788129	2025-03-11 01:53:35.788129
13213	2210	8	USA:\nNDC 0003-3774-12\nBristol-Myers Squibb Company\nEU:\nEU/1/15/1014/002\nBristol-Myers Squibb Pharma\nEEIG\nPlaza 254\nBlanchardstown Corporate Park\n2\nDublin 15, D15 T867\nIreland	2025-03-11 01:53:35.854586	2025-03-11 01:53:35.854586
13214	2210	9	null	2025-03-11 01:53:35.920286	2025-03-11 01:53:35.920286
13215	2211	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:36.05468	2025-03-11 01:53:36.05468
13216	2211	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:53:36.120588	2025-03-11 01:53:36.120588
13217	2211	6	null	2025-03-11 01:53:36.186624	2025-03-11 01:53:36.186624
13218	2211	7	TRUE	2025-03-11 01:53:36.253008	2025-03-11 01:53:36.253008
13219	2211	8	null	2025-03-11 01:53:36.318903	2025-03-11 01:53:36.318903
13220	2211	9	null	2025-03-11 01:53:36.385052	2025-03-11 01:53:36.385052
13221	2212	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:36.517564	2025-03-11 01:53:36.517564
13222	2212	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:53:36.583761	2025-03-11 01:53:36.583761
13223	2212	6	null	2025-03-11 01:53:36.650431	2025-03-11 01:53:36.650431
13224	2212	7	TRUE	2025-03-11 01:53:36.717013	2025-03-11 01:53:36.717013
13225	2212	8	null	2025-03-11 01:53:36.782875	2025-03-11 01:53:36.782875
13226	2212	9	null	2025-03-11 01:53:36.849389	2025-03-11 01:53:36.849389
13227	2213	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:36.98182	2025-03-11 01:53:36.98182
13228	2213	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:53:37.047687	2025-03-11 01:53:37.047687
13229	2213	6	Bayer AG\nKaiser-Wilhelm-Allee\n51368 Leverkusen\nGermany	2025-03-11 01:53:37.113928	2025-03-11 01:53:37.113928
13230	2213	7	TRUE	2025-03-11 01:53:37.179901	2025-03-11 01:53:37.179901
13231	2213	8	Italy: EU/1/13/858/002\nBayer AG\n51368 Leverkusen\nGermany\nUSA: NDC 50419-171-06\nBayer Healthcare Pharmaceuticals\nInc.\n100 Bayer Blvd.\nWhippany, NJ 07981	2025-03-11 01:53:37.249099	2025-03-11 01:53:37.249099
13232	2213	9	null	2025-03-11 01:53:37.317179	2025-03-11 01:53:37.317179
13233	2214	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:37.449966	2025-03-11 01:53:37.449966
13234	2214	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:53:37.517883	2025-03-11 01:53:37.517883
13235	2214	6	null	2025-03-11 01:53:37.584043	2025-03-11 01:53:37.584043
13236	2214	7	FALSE	2025-03-11 01:53:37.650265	2025-03-11 01:53:37.650265
13237	2214	8	null	2025-03-11 01:53:37.716251	2025-03-11 01:53:37.716251
13238	2214	9	null	2025-03-11 01:53:37.782118	2025-03-11 01:53:37.782118
13239	2215	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:37.913959	2025-03-11 01:53:37.913959
13240	2215	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:53:37.980951	2025-03-11 01:53:37.980951
13241	2215	6	null	2025-03-11 01:53:38.046838	2025-03-11 01:53:38.046838
13242	2215	7	FALSE	2025-03-11 01:53:38.112862	2025-03-11 01:53:38.112862
13243	2215	8	null	2025-03-11 01:53:38.179221	2025-03-11 01:53:38.179221
13244	2215	9	null	2025-03-11 01:53:38.245495	2025-03-11 01:53:38.245495
13245	2216	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:38.378272	2025-03-11 01:53:38.378272
13246	2216	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:38.443521	2025-03-11 01:53:38.443521
13247	2216	6	null	2025-03-11 01:53:38.509366	2025-03-11 01:53:38.509366
13248	2216	7	FALSE	2025-03-11 01:53:38.575213	2025-03-11 01:53:38.575213
13249	2216	8	null	2025-03-11 01:53:38.641106	2025-03-11 01:53:38.641106
13250	2216	9	null	2025-03-11 01:53:38.707102	2025-03-11 01:53:38.707102
13251	2217	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:38.842847	2025-03-11 01:53:38.842847
13252	2217	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:38.917239	2025-03-11 01:53:38.917239
13253	2217	6	null	2025-03-11 01:53:38.983202	2025-03-11 01:53:38.983202
13254	2217	7	FALSE	2025-03-11 01:53:39.049565	2025-03-11 01:53:39.049565
13255	2217	8	Keytruda Mexico MA holder number: 277M2016 SSA	2025-03-11 01:53:39.115762	2025-03-11 01:53:39.115762
13256	2217	9	null	2025-03-11 01:53:39.182057	2025-03-11 01:53:39.182057
13257	2218	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:39.325122	2025-03-11 01:53:39.325122
13258	2218	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:39.393618	2025-03-11 01:53:39.393618
13259	2218	6	Merck Sharp & Dohme LLC Rahway, NJ 07065 USA OR Merck Sharp & Dohme Corp (a subsidiary of Merck and Co. Inc. Whitehouse Station, NJ 08889 USA At: MSD Ireland (Carlow) Country Carlow, Ireland	2025-03-11 01:53:39.459601	2025-03-11 01:53:39.459601
13260	2218	7	FALSE	2025-03-11 01:53:39.525663	2025-03-11 01:53:39.525663
13261	2218	8	USA: NDC 0006-3026-02 Merck Sharp & Dohme LLC Rahway, NJ 07065 USA OR Merck Sharp & Dohme Corp., a subsidiary of Merck and Co., Inc., Whitehouse Station, NJ 08889, USA	2025-03-11 01:53:39.591709	2025-03-11 01:53:39.591709
13262	2218	9	null	2025-03-11 01:53:39.657674	2025-03-11 01:53:39.657674
13263	2219	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:53:39.791632	2025-03-11 01:53:39.791632
13264	2219	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:53:39.857729	2025-03-11 01:53:39.857729
13265	2219	6	(Sunitib malate) Pfizer Labs Division of Pfizer Inc New York, NY 10017 \nOR\n(Sunitinib) AqVida GmbH 20355 Hamburg Germany\nOR\nSun Pharmaceutical Industries Ltd. Survey No. 259/15, Dadra-396 191 (U.T. of D & NH), India.	2025-03-11 01:53:39.923894	2025-03-11 01:53:39.923894
13266	2219	7	FALSE	2025-03-11 01:53:39.990353	2025-03-11 01:53:39.990353
13267	2219	8	(Sunitinib malate 12.5mg) \nEU/1/06/347/001\nEU/1/06/347/004\nPfizer Europe MA EEIG Boulevard de la Plaine 17 1050 Bruxelles Belgium\nUSA: NDC 0069-0550-38\nPfizer Labs Division of Pfizer Inc New York, NY 10017\nOR\n(Sunitinib malate 25mg) \nEU/1/06/347/002\nEU/1/06/347/005\nPfizer Europe MA EEIG Boulevard de la Plaine 17 1050 Bruxelles Belgium\nUSA: NDC 0069-0770-38\nPfizer Labs Division of Pfizer Inc New York, NY 10017\nOR\n(Sunitinib)\nEU 98710.00.00 (12.5mg)\nEU 98711.00.00 (25mg)\nAqVida GmbH Kaiser-Wilheilm-Str. 89 20355 Hamburg Germany\nOR\n(Sunitinib)\nUSA NDC:16714-676 (12.5mg)\nUSA NDC:16714-677 (25mg)\nNorthStar Rx LLC Memphis, TN 38141	2025-03-11 01:53:40.056454	2025-03-11 01:53:40.056454
13268	2219	9	null	2025-03-11 01:53:40.121359	2025-03-11 01:53:40.121359
13269	2220	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:53:40.252024	2025-03-11 01:53:40.252024
13270	2220	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:40.318013	2025-03-11 01:53:40.318013
13271	2220	6	Bristol-Myers Squibb\nCompany\nPrinceton, NJ 08543\nUSA	2025-03-11 01:53:40.384192	2025-03-11 01:53:40.384192
13272	2220	7	FALSE	2025-03-11 01:53:40.47463	2025-03-11 01:53:40.47463
13273	2220	8	USA: NDC 0003-3774-12\nBristol-Myers Squibb Company\nPrinceton, NJ 08543 USA	2025-03-11 01:53:40.541137	2025-03-11 01:53:40.541137
13274	2220	9	null	2025-03-11 01:53:40.60774	2025-03-11 01:53:40.60774
13275	2221	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:40.744208	2025-03-11 01:53:40.744208
13276	2221	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:40.810337	2025-03-11 01:53:40.810337
13277	2221	6	null	2025-03-11 01:53:40.87689	2025-03-11 01:53:40.87689
13278	2221	7	FALSE	2025-03-11 01:53:40.962645	2025-03-11 01:53:40.962645
13279	2221	8	Keytruda Brazil MA holder number: 1017102090017	2025-03-11 01:53:41.028713	2025-03-11 01:53:41.028713
13280	2221	9	null	2025-03-11 01:53:41.09451	2025-03-11 01:53:41.09451
13281	2222	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:41.228562	2025-03-11 01:53:41.228562
13282	2222	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:41.29482	2025-03-11 01:53:41.29482
13283	2222	6	Organon Heist bv Industriepark 30 2220 Heist-op-den-Berg Belgium OR Merck Sharp & Dohme BV Waarderweg 39 2031 BN Haarlem The Netherlands	2025-03-11 01:53:41.360814	2025-03-11 01:53:41.360814
13284	2222	7	FALSE	2025-03-11 01:53:41.427072	2025-03-11 01:53:41.427072
13285	2222	8	Merck Sharp & Dohme BV Waarderweg 39 2031 BN Haarlem The Netherlands	2025-03-11 01:53:41.492932	2025-03-11 01:53:41.492932
13286	2222	9	null	2025-03-11 01:53:41.559301	2025-03-11 01:53:41.559301
13287	2223	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:41.691822	2025-03-11 01:53:41.691822
13288	2223	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:53:41.758372	2025-03-11 01:53:41.758372
13289	2223	6	null	2025-03-11 01:53:41.824197	2025-03-11 01:53:41.824197
13290	2223	7	FALSE	2025-03-11 01:53:41.890404	2025-03-11 01:53:41.890404
13291	2223	8	null	2025-03-11 01:53:41.95538	2025-03-11 01:53:41.95538
13292	2223	9	null	2025-03-11 01:53:42.021191	2025-03-11 01:53:42.021191
13293	2224	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:53:42.153267	2025-03-11 01:53:42.153267
13294	2224	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:42.219249	2025-03-11 01:53:42.219249
13295	2224	6	USA:\nBristol-Myers Squibb\nCompany\nPrinceton, NJ 08543\nUSA\nEU:\nSwords Laboratories t/a\nBristol-Myers\nSquibb Cruiserath Biologics\nCruiserath Road,\nMulhuddart\nDublin 15, D15 H6EF\nIreland	2025-03-11 01:53:42.285251	2025-03-11 01:53:42.285251
13296	2224	7	FALSE	2025-03-11 01:53:42.350966	2025-03-11 01:53:42.350966
13297	2224	8	USA:\nNDC 0003-3774-12\nBristol-Myers Squibb Company\nEU:\nEU/1/15/1014/002\nBristol-Myers Squibb Pharma\nEEIG\nPlaza 254\nBlanchardstown Corporate Park\n2\nDublin 15, D15 T867\nIreland	2025-03-11 01:53:42.41913	2025-03-11 01:53:42.41913
13298	2224	9	null	2025-03-11 01:53:42.485321	2025-03-11 01:53:42.485321
13299	2225	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:42.618083	2025-03-11 01:53:42.618083
13300	2225	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:53:42.684245	2025-03-11 01:53:42.684245
13301	2225	6	null	2025-03-11 01:53:42.750123	2025-03-11 01:53:42.750123
13302	2225	7	FALSE	2025-03-11 01:53:42.815979	2025-03-11 01:53:42.815979
13303	2225	8	null	2025-03-11 01:53:42.881652	2025-03-11 01:53:42.881652
13304	2225	9	null	2025-03-11 01:53:42.947249	2025-03-11 01:53:42.947249
13305	2226	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:43.080288	2025-03-11 01:53:43.080288
13306	2226	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:53:43.189142	2025-03-11 01:53:43.189142
13307	2226	6	null	2025-03-11 01:53:43.254959	2025-03-11 01:53:43.254959
13308	2226	7	TRUE	2025-03-11 01:53:43.321258	2025-03-11 01:53:43.321258
13309	2226	8	null	2025-03-11 01:53:43.387125	2025-03-11 01:53:43.387125
13310	2226	9	null	2025-03-11 01:53:43.453263	2025-03-11 01:53:43.453263
13311	2227	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:43.58533	2025-03-11 01:53:43.58533
13312	2227	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:43.650785	2025-03-11 01:53:43.650785
13313	2227	6	null	2025-03-11 01:53:43.716509	2025-03-11 01:53:43.716509
13314	2227	7	TRUE	2025-03-11 01:53:43.782488	2025-03-11 01:53:43.782488
13315	2227	8	null	2025-03-11 01:53:43.848501	2025-03-11 01:53:43.848501
13316	2227	9	null	2025-03-11 01:53:43.914938	2025-03-11 01:53:43.914938
13317	2228	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:53:44.049114	2025-03-11 01:53:44.049114
13318	2228	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:53:44.114953	2025-03-11 01:53:44.114953
13319	2228	6	null	2025-03-11 01:53:44.180783	2025-03-11 01:53:44.180783
13320	2228	7	FALSE	2025-03-11 01:53:44.246599	2025-03-11 01:53:44.246599
13321	2228	8	null	2025-03-11 01:53:44.312596	2025-03-11 01:53:44.312596
13322	2228	9	null	2025-03-11 01:53:44.377261	2025-03-11 01:53:44.377261
13323	2229	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:44.50901	2025-03-11 01:53:44.50901
13324	2229	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:44.574916	2025-03-11 01:53:44.574916
13325	2229	6	null	2025-03-11 01:53:44.641443	2025-03-11 01:53:44.641443
13326	2229	7	FALSE	2025-03-11 01:53:44.707772	2025-03-11 01:53:44.707772
13327	2229	8	null	2025-03-11 01:53:44.774363	2025-03-11 01:53:44.774363
13328	2229	9	null	2025-03-11 01:53:44.840301	2025-03-11 01:53:44.840301
13329	2230	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:44.972085	2025-03-11 01:53:44.972085
13330	2230	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:45.03858	2025-03-11 01:53:45.03858
13331	2230	6	null	2025-03-11 01:53:45.104742	2025-03-11 01:53:45.104742
13332	2230	7	FALSE	2025-03-11 01:53:45.170452	2025-03-11 01:53:45.170452
13333	2230	8	Keytruda Mexico MA holder number: 277M2016 SSA	2025-03-11 01:53:45.237011	2025-03-11 01:53:45.237011
13334	2230	9	null	2025-03-11 01:53:45.30335	2025-03-11 01:53:45.30335
13335	2231	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:45.434301	2025-03-11 01:53:45.434301
13336	2231	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:53:45.500912	2025-03-11 01:53:45.500912
13337	2231	6	Merck Sharp & Dohme LLC Rahway, NJ 07065 USA OR Merck Sharp & Dohme Corp (a subsidiary of Merck and Co. Inc. Whitehouse Station, NJ 08889 USA At: MSD Ireland (Carlow) Country Carlow, Ireland	2025-03-11 01:53:45.566611	2025-03-11 01:53:45.566611
13338	2231	7	FALSE	2025-03-11 01:53:45.632153	2025-03-11 01:53:45.632153
13339	2231	8	USA: NDC 0006-3026-02 Merck Sharp & Dohme LLC Rahway, NJ 07065 USA OR Merck Sharp & Dohme Corp., a subsidiary of Merck and Co., Inc., Whitehouse Station, NJ 08889, USA	2025-03-11 01:53:45.69737	2025-03-11 01:53:45.69737
13340	2231	9	null	2025-03-11 01:53:45.763034	2025-03-11 01:53:45.763034
13341	2232	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:53:45.894321	2025-03-11 01:53:45.894321
13342	2232	5	8dba42adbc5c2aac3e57c03564124545	2025-03-11 01:53:45.962296	2025-03-11 01:53:45.962296
13343	2232	6	null	2025-03-11 01:53:46.03379	2025-03-11 01:53:46.03379
13344	2232	7	TRUE	2025-03-11 01:53:46.09954	2025-03-11 01:53:46.09954
13345	2232	8	null	2025-03-11 01:53:46.165575	2025-03-11 01:53:46.165575
13346	2232	9	null	2025-03-11 01:53:46.233253	2025-03-11 01:53:46.233253
13347	2233	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:46.365301	2025-03-11 01:53:46.365301
13348	2233	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:53:46.430352	2025-03-11 01:53:46.430352
13349	2233	6	Bayer AG\nKaiser-Wilhelm-Allee\n51368 Leverkusen\nGermany	2025-03-11 01:53:46.496289	2025-03-11 01:53:46.496289
13350	2233	7	FALSE	2025-03-11 01:53:46.562208	2025-03-11 01:53:46.562208
13351	2233	8	Italy: EU/1/13/858/002\nBayer AG\n51368 Leverkusen\nGermany\nUSA: NDC 50419-171-06\nBayer Healthcare Pharmaceuticals\nInc.\n100 Bayer Blvd.\nWhippany, NJ 07981	2025-03-11 01:53:46.628007	2025-03-11 01:53:46.628007
13352	2233	9	null	2025-03-11 01:53:46.69417	2025-03-11 01:53:46.69417
13353	2234	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:53:46.826118	2025-03-11 01:53:46.826118
13354	2234	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:53:46.892132	2025-03-11 01:53:46.892132
13355	2234	6	null	2025-03-11 01:53:46.958191	2025-03-11 01:53:46.958191
13356	2234	7	FALSE	2025-03-11 01:53:47.024008	2025-03-11 01:53:47.024008
13357	2234	8	null	2025-03-11 01:53:47.095809	2025-03-11 01:53:47.095809
13358	2234	9	null	2025-03-11 01:53:47.163795	2025-03-11 01:53:47.163795
13359	2235	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:53:47.295447	2025-03-11 01:53:47.295447
13360	2235	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:53:47.361405	2025-03-11 01:53:47.361405
13361	2235	6	null	2025-03-11 01:53:47.428945	2025-03-11 01:53:47.428945
13362	2235	7	TRUE	2025-03-11 01:53:47.494763	2025-03-11 01:53:47.494763
13363	2235	8	null	2025-03-11 01:53:47.560689	2025-03-11 01:53:47.560689
13364	2235	9	null	2025-03-11 01:53:47.626602	2025-03-11 01:53:47.626602
13365	2236	4	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:53:47.7583	2025-03-11 01:53:47.7583
13366	2236	5	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:53:47.825833	2025-03-11 01:53:47.825833
13367	2236	6	null	2025-03-11 01:53:47.891326	2025-03-11 01:53:47.891326
13368	2236	7	TRUE	2025-03-11 01:53:47.957318	2025-03-11 01:53:47.957318
13369	2236	8	null	2025-03-11 01:53:48.023962	2025-03-11 01:53:48.023962
13370	2236	9	null	2025-03-11 01:53:48.089816	2025-03-11 01:53:48.089816
13371	2237	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:48.221966	2025-03-11 01:53:48.221966
13372	2237	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:48.288021	2025-03-11 01:53:48.288021
13373	2237	6	null	2025-03-11 01:53:48.354359	2025-03-11 01:53:48.354359
13374	2237	7	TRUE	2025-03-11 01:53:48.420276	2025-03-11 01:53:48.420276
13375	2237	8	null	2025-03-11 01:53:48.485292	2025-03-11 01:53:48.485292
13376	2237	9	null	2025-03-11 01:53:48.551609	2025-03-11 01:53:48.551609
13377	2238	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:48.683685	2025-03-11 01:53:48.683685
13378	2238	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:53:48.749753	2025-03-11 01:53:48.749753
13379	2238	6	null	2025-03-11 01:53:48.81591	2025-03-11 01:53:48.81591
13380	2238	7	FALSE	2025-03-11 01:53:48.881999	2025-03-11 01:53:48.881999
13381	2238	8	null	2025-03-11 01:53:48.947955	2025-03-11 01:53:48.947955
13382	2238	9	null	2025-03-11 01:53:49.013804	2025-03-11 01:53:49.013804
13383	2239	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:53:49.146156	2025-03-11 01:53:49.146156
13384	2239	5	9626bbd88c300cb77b5697e32bd86518	2025-03-11 01:53:49.212315	2025-03-11 01:53:49.212315
13385	2239	6	null	2025-03-11 01:53:49.278166	2025-03-11 01:53:49.278166
13386	2239	7	TRUE	2025-03-11 01:53:49.343909	2025-03-11 01:53:49.343909
13387	2239	8	null	2025-03-11 01:53:49.409703	2025-03-11 01:53:49.409703
13388	2239	9	null	2025-03-11 01:53:49.476231	2025-03-11 01:53:49.476231
13389	2240	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:49.614211	2025-03-11 01:53:49.614211
13390	2240	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:49.691837	2025-03-11 01:53:49.691837
13391	2240	6	null	2025-03-11 01:53:49.75793	2025-03-11 01:53:49.75793
13392	2240	7	TRUE	2025-03-11 01:53:49.824024	2025-03-11 01:53:49.824024
13393	2240	8	null	2025-03-11 01:53:49.890185	2025-03-11 01:53:49.890185
13394	2240	9	null	2025-03-11 01:53:49.95642	2025-03-11 01:53:49.95642
13395	2241	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:50.093151	2025-03-11 01:53:50.093151
13396	2241	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:50.159332	2025-03-11 01:53:50.159332
13397	2241	6	null	2025-03-11 01:53:50.22528	2025-03-11 01:53:50.22528
13398	2241	7	FALSE	2025-03-11 01:53:50.291648	2025-03-11 01:53:50.291648
13399	2241	8	null	2025-03-11 01:53:50.357769	2025-03-11 01:53:50.357769
13400	2241	9	null	2025-03-11 01:53:50.423788	2025-03-11 01:53:50.423788
13401	2242	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:53:50.586525	2025-03-11 01:53:50.586525
13402	2242	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:50.662445	2025-03-11 01:53:50.662445
13403	2242	6	null	2025-03-11 01:53:50.72872	2025-03-11 01:53:50.72872
13404	2242	7	TRUE	2025-03-11 01:53:50.7946	2025-03-11 01:53:50.7946
13405	2242	8	null	2025-03-11 01:53:50.860667	2025-03-11 01:53:50.860667
13406	2242	9	null	2025-03-11 01:53:50.926602	2025-03-11 01:53:50.926602
13407	2243	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:53:51.058753	2025-03-11 01:53:51.058753
13408	2243	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:51.125292	2025-03-11 01:53:51.125292
13409	2243	6	null	2025-03-11 01:53:51.191194	2025-03-11 01:53:51.191194
13410	2243	7	TRUE	2025-03-11 01:53:51.257089	2025-03-11 01:53:51.257089
13411	2243	8	null	2025-03-11 01:53:51.32302	2025-03-11 01:53:51.32302
13412	2243	9	null	2025-03-11 01:53:51.389212	2025-03-11 01:53:51.389212
13413	2244	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:53:51.52209	2025-03-11 01:53:51.52209
13414	2244	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:51.587806	2025-03-11 01:53:51.587806
13415	2244	6	null	2025-03-11 01:53:51.653882	2025-03-11 01:53:51.653882
13416	2244	7	TRUE	2025-03-11 01:53:51.719941	2025-03-11 01:53:51.719941
13417	2244	8	null	2025-03-11 01:53:51.786799	2025-03-11 01:53:51.786799
13418	2244	9	null	2025-03-11 01:53:51.852894	2025-03-11 01:53:51.852894
13419	2245	4	72d3c570e7cf57267a69ae2d5ad64d95	2025-03-11 01:53:51.985163	2025-03-11 01:53:51.985163
13420	2245	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:52.052104	2025-03-11 01:53:52.052104
13421	2245	6	null	2025-03-11 01:53:52.117794	2025-03-11 01:53:52.117794
13422	2245	7	TRUE	2025-03-11 01:53:52.18377	2025-03-11 01:53:52.18377
13423	2245	8	null	2025-03-11 01:53:52.24988	2025-03-11 01:53:52.24988
13424	2245	9	null	2025-03-11 01:53:52.315939	2025-03-11 01:53:52.315939
13425	2246	4	66aba5325027ecf2e633272fd33574f8	2025-03-11 01:53:52.44781	2025-03-11 01:53:52.44781
13426	2246	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:52.513439	2025-03-11 01:53:52.513439
13427	2246	6	null	2025-03-11 01:53:52.58119	2025-03-11 01:53:52.58119
13428	2246	7	FALSE	2025-03-11 01:53:52.64722	2025-03-11 01:53:52.64722
13429	2246	8	null	2025-03-11 01:53:52.714311	2025-03-11 01:53:52.714311
13430	2246	9	null	2025-03-11 01:53:52.78046	2025-03-11 01:53:52.78046
13431	2247	4	000e03e7bf24ac1915212b0467218ec9	2025-03-11 01:53:52.913121	2025-03-11 01:53:52.913121
13432	2247	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:52.979111	2025-03-11 01:53:52.979111
13433	2247	6	null	2025-03-11 01:53:53.045078	2025-03-11 01:53:53.045078
13434	2247	7	FALSE	2025-03-11 01:53:53.111639	2025-03-11 01:53:53.111639
13435	2247	8	null	2025-03-11 01:53:53.181005	2025-03-11 01:53:53.181005
13436	2247	9	null	2025-03-11 01:53:53.246895	2025-03-11 01:53:53.246895
13437	2248	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:53:53.378369	2025-03-11 01:53:53.378369
13438	2248	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:53.445099	2025-03-11 01:53:53.445099
13439	2248	6	null	2025-03-11 01:53:53.51592	2025-03-11 01:53:53.51592
13440	2248	7	TRUE	2025-03-11 01:53:53.581712	2025-03-11 01:53:53.581712
13441	2248	8	null	2025-03-11 01:53:53.647782	2025-03-11 01:53:53.647782
13442	2248	9	null	2025-03-11 01:53:53.713648	2025-03-11 01:53:53.713648
13443	2249	4	66c00d9da45fe83e335fe79e8a32638d	2025-03-11 01:53:53.845481	2025-03-11 01:53:53.845481
13444	2249	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:53.911712	2025-03-11 01:53:53.911712
13445	2249	6	null	2025-03-11 01:53:53.977556	2025-03-11 01:53:53.977556
13446	2249	7	FALSE	2025-03-11 01:53:54.042339	2025-03-11 01:53:54.042339
13447	2249	8	null	2025-03-11 01:53:54.108173	2025-03-11 01:53:54.108173
13448	2249	9	null	2025-03-11 01:53:54.174018	2025-03-11 01:53:54.174018
13449	2250	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:53:54.306174	2025-03-11 01:53:54.306174
13450	2250	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:53:54.37559	2025-03-11 01:53:54.37559
13451	2250	6	null	2025-03-11 01:53:54.440333	2025-03-11 01:53:54.440333
13452	2250	7	TRUE	2025-03-11 01:53:54.506167	2025-03-11 01:53:54.506167
13453	2250	8	null	2025-03-11 01:53:54.571645	2025-03-11 01:53:54.571645
13454	2250	9	null	2025-03-11 01:53:54.637703	2025-03-11 01:53:54.637703
13455	2251	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:53:54.769805	2025-03-11 01:53:54.769805
13456	2251	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:54.835919	2025-03-11 01:53:54.835919
13457	2251	6	null	2025-03-11 01:53:54.902166	2025-03-11 01:53:54.902166
13458	2251	7	FALSE	2025-03-11 01:53:54.971156	2025-03-11 01:53:54.971156
13459	2251	8	null	2025-03-11 01:53:55.037719	2025-03-11 01:53:55.037719
13460	2251	9	null	2025-03-11 01:53:55.104103	2025-03-11 01:53:55.104103
13461	2252	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:53:55.23703	2025-03-11 01:53:55.23703
13462	2252	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:53:55.302956	2025-03-11 01:53:55.302956
13463	2252	6	null	2025-03-11 01:53:55.368999	2025-03-11 01:53:55.368999
13464	2252	7	TRUE	2025-03-11 01:53:55.435054	2025-03-11 01:53:55.435054
13465	2252	8	null	2025-03-11 01:53:55.500919	2025-03-11 01:53:55.500919
13466	2252	9	null	2025-03-11 01:53:55.567267	2025-03-11 01:53:55.567267
13467	2253	4	28182d35876bad5fef39f13a6398bbbd	2025-03-11 01:53:55.699204	2025-03-11 01:53:55.699204
13468	2253	5	faba2605558da2b45b5c50087298b8bf	2025-03-11 01:53:55.765359	2025-03-11 01:53:55.765359
13469	2253	6	null	2025-03-11 01:53:55.835438	2025-03-11 01:53:55.835438
13470	2253	7	FALSE	2025-03-11 01:53:55.901318	2025-03-11 01:53:55.901318
13471	2253	8	null	2025-03-11 01:53:55.967881	2025-03-11 01:53:55.967881
13472	2253	9	null	2025-03-11 01:53:56.034166	2025-03-11 01:53:56.034166
13473	2254	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:56.165959	2025-03-11 01:53:56.165959
13474	2254	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:56.232002	2025-03-11 01:53:56.232002
13475	2254	6	null	2025-03-11 01:53:56.29789	2025-03-11 01:53:56.29789
13476	2254	7	FALSE	2025-03-11 01:53:56.36367	2025-03-11 01:53:56.36367
13477	2254	8	null	2025-03-11 01:53:56.429832	2025-03-11 01:53:56.429832
13478	2254	9	null	2025-03-11 01:53:56.495758	2025-03-11 01:53:56.495758
13479	2255	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:53:56.62836	2025-03-11 01:53:56.62836
13480	2255	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:56.694881	2025-03-11 01:53:56.694881
13481	2255	6	null	2025-03-11 01:53:56.761211	2025-03-11 01:53:56.761211
13482	2255	7	FALSE	2025-03-11 01:53:56.827876	2025-03-11 01:53:56.827876
13483	2255	8	null	2025-03-11 01:53:56.893796	2025-03-11 01:53:56.893796
13484	2255	9	null	2025-03-11 01:53:56.960065	2025-03-11 01:53:56.960065
13485	2256	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:53:57.092551	2025-03-11 01:53:57.092551
13486	2256	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:57.15856	2025-03-11 01:53:57.15856
13487	2256	6	null	2025-03-11 01:53:57.224515	2025-03-11 01:53:57.224515
13488	2256	7	FALSE	2025-03-11 01:53:57.291315	2025-03-11 01:53:57.291315
13489	2256	8	null	2025-03-11 01:53:57.357032	2025-03-11 01:53:57.357032
13490	2256	9	null	2025-03-11 01:53:57.423211	2025-03-11 01:53:57.423211
13491	2257	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:57.554864	2025-03-11 01:53:57.554864
13492	2257	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:57.620997	2025-03-11 01:53:57.620997
13493	2257	6	null	2025-03-11 01:53:57.687057	2025-03-11 01:53:57.687057
13494	2257	7	FALSE	2025-03-11 01:53:57.755757	2025-03-11 01:53:57.755757
13495	2257	8	null	2025-03-11 01:53:57.822719	2025-03-11 01:53:57.822719
13496	2257	9	null	2025-03-11 01:53:57.888681	2025-03-11 01:53:57.888681
13497	2258	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:58.021057	2025-03-11 01:53:58.021057
13498	2258	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:53:58.086704	2025-03-11 01:53:58.086704
13499	2258	6	null	2025-03-11 01:53:58.15292	2025-03-11 01:53:58.15292
13500	2258	7	TRUE	2025-03-11 01:53:58.21877	2025-03-11 01:53:58.21877
13501	2258	8	null	2025-03-11 01:53:58.285281	2025-03-11 01:53:58.285281
13502	2258	9	null	2025-03-11 01:53:58.351404	2025-03-11 01:53:58.351404
13503	2259	4	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:53:58.484084	2025-03-11 01:53:58.484084
13504	2259	5	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:53:58.550003	2025-03-11 01:53:58.550003
13505	2259	6	null	2025-03-11 01:53:58.616025	2025-03-11 01:53:58.616025
13506	2259	7	FALSE	2025-03-11 01:53:58.682018	2025-03-11 01:53:58.682018
13507	2259	8	null	2025-03-11 01:53:58.748111	2025-03-11 01:53:58.748111
13508	2259	9	null	2025-03-11 01:53:58.8141	2025-03-11 01:53:58.8141
13509	2260	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:53:58.948747	2025-03-11 01:53:58.948747
13510	2260	5	31f520fac457a753e5cebbd3f35354d4	2025-03-11 01:53:59.016053	2025-03-11 01:53:59.016053
13511	2260	6	null	2025-03-11 01:53:59.08366	2025-03-11 01:53:59.08366
13512	2260	7	TRUE	2025-03-11 01:53:59.152255	2025-03-11 01:53:59.152255
13513	2260	8	null	2025-03-11 01:53:59.222112	2025-03-11 01:53:59.222112
13514	2260	9	null	2025-03-11 01:53:59.291459	2025-03-11 01:53:59.291459
13515	2261	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:53:59.42472	2025-03-11 01:53:59.42472
13516	2261	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:53:59.493395	2025-03-11 01:53:59.493395
13517	2261	6	null	2025-03-11 01:53:59.559604	2025-03-11 01:53:59.559604
13518	2261	7	FALSE	2025-03-11 01:53:59.624537	2025-03-11 01:53:59.624537
13519	2261	8	null	2025-03-11 01:53:59.689489	2025-03-11 01:53:59.689489
13520	2261	9	null	2025-03-11 01:53:59.755869	2025-03-11 01:53:59.755869
13521	2262	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:53:59.893281	2025-03-11 01:53:59.893281
13522	2262	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:53:59.960737	2025-03-11 01:53:59.960737
13523	2262	6	null	2025-03-11 01:54:00.026691	2025-03-11 01:54:00.026691
13524	2262	7	FALSE	2025-03-11 01:54:00.092749	2025-03-11 01:54:00.092749
13525	2262	8	null	2025-03-11 01:54:00.159355	2025-03-11 01:54:00.159355
13526	2262	9	null	2025-03-11 01:54:00.22521	2025-03-11 01:54:00.22521
13527	2263	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:00.357004	2025-03-11 01:54:00.357004
13528	2263	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:00.423082	2025-03-11 01:54:00.423082
13529	2263	6	null	2025-03-11 01:54:00.489055	2025-03-11 01:54:00.489055
13530	2263	7	FALSE	2025-03-11 01:54:00.554925	2025-03-11 01:54:00.554925
13531	2263	8	null	2025-03-11 01:54:00.621031	2025-03-11 01:54:00.621031
13532	2263	9	null	2025-03-11 01:54:00.686947	2025-03-11 01:54:00.686947
13533	2264	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:00.819493	2025-03-11 01:54:00.819493
13534	2264	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:00.885631	2025-03-11 01:54:00.885631
13535	2264	6	null	2025-03-11 01:54:00.951754	2025-03-11 01:54:00.951754
13536	2264	7	TRUE	2025-03-11 01:54:01.017893	2025-03-11 01:54:01.017893
13537	2264	8	null	2025-03-11 01:54:01.083913	2025-03-11 01:54:01.083913
13538	2264	9	null	2025-03-11 01:54:01.149874	2025-03-11 01:54:01.149874
13539	2265	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:01.282397	2025-03-11 01:54:01.282397
13540	2265	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:01.348612	2025-03-11 01:54:01.348612
13541	2265	6	null	2025-03-11 01:54:01.414689	2025-03-11 01:54:01.414689
13542	2265	7	TRUE	2025-03-11 01:54:01.48105	2025-03-11 01:54:01.48105
13543	2265	8	null	2025-03-11 01:54:01.547062	2025-03-11 01:54:01.547062
13544	2265	9	null	2025-03-11 01:54:01.613184	2025-03-11 01:54:01.613184
13545	2266	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:01.745402	2025-03-11 01:54:01.745402
13546	2266	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:01.812286	2025-03-11 01:54:01.812286
13547	2266	6	null	2025-03-11 01:54:01.878955	2025-03-11 01:54:01.878955
13548	2266	7	TRUE	2025-03-11 01:54:01.945141	2025-03-11 01:54:01.945141
13549	2266	8	null	2025-03-11 01:54:02.011684	2025-03-11 01:54:02.011684
13550	2266	9	null	2025-03-11 01:54:02.078685	2025-03-11 01:54:02.078685
13551	2267	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:02.210877	2025-03-11 01:54:02.210877
13552	2267	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:02.276918	2025-03-11 01:54:02.276918
13553	2267	6	null	2025-03-11 01:54:02.343131	2025-03-11 01:54:02.343131
13554	2267	7	TRUE	2025-03-11 01:54:02.409019	2025-03-11 01:54:02.409019
13555	2267	8	null	2025-03-11 01:54:02.474382	2025-03-11 01:54:02.474382
13556	2267	9	null	2025-03-11 01:54:02.540405	2025-03-11 01:54:02.540405
13557	2268	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:02.672874	2025-03-11 01:54:02.672874
13558	2268	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:02.738724	2025-03-11 01:54:02.738724
13559	2268	6	null	2025-03-11 01:54:02.805741	2025-03-11 01:54:02.805741
13560	2268	7	TRUE	2025-03-11 01:54:02.872961	2025-03-11 01:54:02.872961
13561	2268	8	null	2025-03-11 01:54:02.939071	2025-03-11 01:54:02.939071
13562	2268	9	null	2025-03-11 01:54:03.005571	2025-03-11 01:54:03.005571
13563	2269	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:03.138159	2025-03-11 01:54:03.138159
13564	2269	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:03.204332	2025-03-11 01:54:03.204332
13565	2269	6	null	2025-03-11 01:54:03.270519	2025-03-11 01:54:03.270519
13566	2269	7	FALSE	2025-03-11 01:54:03.335409	2025-03-11 01:54:03.335409
13567	2269	8	null	2025-03-11 01:54:03.401345	2025-03-11 01:54:03.401345
13568	2269	9	null	2025-03-11 01:54:03.467259	2025-03-11 01:54:03.467259
13569	2270	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:03.601826	2025-03-11 01:54:03.601826
13570	2270	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:03.667694	2025-03-11 01:54:03.667694
13571	2270	6	null	2025-03-11 01:54:03.733648	2025-03-11 01:54:03.733648
13572	2270	7	TRUE	2025-03-11 01:54:03.800361	2025-03-11 01:54:03.800361
13573	2270	8	null	2025-03-11 01:54:03.866146	2025-03-11 01:54:03.866146
13574	2270	9	null	2025-03-11 01:54:03.93202	2025-03-11 01:54:03.93202
13575	2271	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:04.063632	2025-03-11 01:54:04.063632
13576	2271	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:04.129684	2025-03-11 01:54:04.129684
13577	2271	6	null	2025-03-11 01:54:04.195688	2025-03-11 01:54:04.195688
13578	2271	7	TRUE	2025-03-11 01:54:04.261495	2025-03-11 01:54:04.261495
13579	2271	8	null	2025-03-11 01:54:04.333008	2025-03-11 01:54:04.333008
13580	2271	9	null	2025-03-11 01:54:04.400377	2025-03-11 01:54:04.400377
13581	2272	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:04.53297	2025-03-11 01:54:04.53297
13582	2272	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:04.598843	2025-03-11 01:54:04.598843
13583	2272	6	null	2025-03-11 01:54:04.665232	2025-03-11 01:54:04.665232
13584	2272	7	FALSE	2025-03-11 01:54:04.732099	2025-03-11 01:54:04.732099
13585	2272	8	null	2025-03-11 01:54:04.798095	2025-03-11 01:54:04.798095
13586	2272	9	null	2025-03-11 01:54:04.863814	2025-03-11 01:54:04.863814
13587	2273	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:04.999903	2025-03-11 01:54:04.999903
13588	2273	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:05.070035	2025-03-11 01:54:05.070035
13589	2273	6	null	2025-03-11 01:54:05.13585	2025-03-11 01:54:05.13585
13590	2273	7	FALSE	2025-03-11 01:54:05.201946	2025-03-11 01:54:05.201946
13591	2273	8	null	2025-03-11 01:54:05.268678	2025-03-11 01:54:05.268678
13592	2273	9	null	2025-03-11 01:54:05.334836	2025-03-11 01:54:05.334836
13593	2274	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:05.469967	2025-03-11 01:54:05.469967
13594	2274	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:05.538141	2025-03-11 01:54:05.538141
13595	2274	6	null	2025-03-11 01:54:05.604181	2025-03-11 01:54:05.604181
13596	2274	7	FALSE	2025-03-11 01:54:05.669895	2025-03-11 01:54:05.669895
13597	2274	8	null	2025-03-11 01:54:05.736005	2025-03-11 01:54:05.736005
13598	2274	9	null	2025-03-11 01:54:05.806367	2025-03-11 01:54:05.806367
13599	2275	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:05.938735	2025-03-11 01:54:05.938735
13600	2275	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:54:06.005764	2025-03-11 01:54:06.005764
13601	2275	6	null	2025-03-11 01:54:06.07176	2025-03-11 01:54:06.07176
13602	2275	7	FALSE	2025-03-11 01:54:06.140959	2025-03-11 01:54:06.140959
13603	2275	8	null	2025-03-11 01:54:06.207038	2025-03-11 01:54:06.207038
13604	2275	9	null	2025-03-11 01:54:06.273126	2025-03-11 01:54:06.273126
13605	2276	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:06.406054	2025-03-11 01:54:06.406054
13606	2276	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:06.472038	2025-03-11 01:54:06.472038
13607	2276	6	null	2025-03-11 01:54:06.538426	2025-03-11 01:54:06.538426
13608	2276	7	TRUE	2025-03-11 01:54:06.603333	2025-03-11 01:54:06.603333
13609	2276	8	null	2025-03-11 01:54:06.669318	2025-03-11 01:54:06.669318
13610	2276	9	null	2025-03-11 01:54:06.735255	2025-03-11 01:54:06.735255
13611	2277	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:06.871574	2025-03-11 01:54:06.871574
13612	2277	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:06.938063	2025-03-11 01:54:06.938063
13613	2277	6	null	2025-03-11 01:54:07.003921	2025-03-11 01:54:07.003921
13614	2277	7	FALSE	2025-03-11 01:54:07.070785	2025-03-11 01:54:07.070785
13615	2277	8	null	2025-03-11 01:54:07.136753	2025-03-11 01:54:07.136753
13616	2277	9	null	2025-03-11 01:54:07.202689	2025-03-11 01:54:07.202689
13617	2278	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:07.335239	2025-03-11 01:54:07.335239
13618	2278	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:07.401463	2025-03-11 01:54:07.401463
13619	2278	6	null	2025-03-11 01:54:07.467302	2025-03-11 01:54:07.467302
13620	2278	7	FALSE	2025-03-11 01:54:07.533338	2025-03-11 01:54:07.533338
13621	2278	8	null	2025-03-11 01:54:07.599291	2025-03-11 01:54:07.599291
13622	2278	9	null	2025-03-11 01:54:07.665003	2025-03-11 01:54:07.665003
13623	2279	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:54:07.797058	2025-03-11 01:54:07.797058
13624	2279	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:07.86507	2025-03-11 01:54:07.86507
13625	2279	6	null	2025-03-11 01:54:07.933518	2025-03-11 01:54:07.933518
13626	2279	7	TRUE	2025-03-11 01:54:07.999567	2025-03-11 01:54:07.999567
13627	2279	8	null	2025-03-11 01:54:08.065546	2025-03-11 01:54:08.065546
13628	2279	9	null	2025-03-11 01:54:08.131568	2025-03-11 01:54:08.131568
13629	2280	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:08.263676	2025-03-11 01:54:08.263676
13630	2280	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:54:08.329832	2025-03-11 01:54:08.329832
13631	2280	6	null	2025-03-11 01:54:08.395671	2025-03-11 01:54:08.395671
13632	2280	7	FALSE	2025-03-11 01:54:08.461536	2025-03-11 01:54:08.461536
13633	2280	8	null	2025-03-11 01:54:08.527524	2025-03-11 01:54:08.527524
13634	2280	9	null	2025-03-11 01:54:08.593037	2025-03-11 01:54:08.593037
13635	2281	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:08.725269	2025-03-11 01:54:08.725269
13636	2281	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:08.792387	2025-03-11 01:54:08.792387
13637	2281	6	null	2025-03-11 01:54:08.858304	2025-03-11 01:54:08.858304
13638	2281	7	FALSE	2025-03-11 01:54:08.924776	2025-03-11 01:54:08.924776
13639	2281	8	null	2025-03-11 01:54:08.991398	2025-03-11 01:54:08.991398
13640	2281	9	null	2025-03-11 01:54:09.099321	2025-03-11 01:54:09.099321
13641	2282	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:09.23749	2025-03-11 01:54:09.23749
13642	2282	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:09.302414	2025-03-11 01:54:09.302414
13643	2282	6	null	2025-03-11 01:54:09.368551	2025-03-11 01:54:09.368551
13644	2282	7	TRUE	2025-03-11 01:54:09.434485	2025-03-11 01:54:09.434485
13645	2282	8	null	2025-03-11 01:54:09.500556	2025-03-11 01:54:09.500556
13646	2282	9	null	2025-03-11 01:54:09.567176	2025-03-11 01:54:09.567176
13647	2283	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:09.700115	2025-03-11 01:54:09.700115
13648	2283	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:09.765978	2025-03-11 01:54:09.765978
13649	2283	6	null	2025-03-11 01:54:09.8317	2025-03-11 01:54:09.8317
13650	2283	7	FALSE	2025-03-11 01:54:09.898041	2025-03-11 01:54:09.898041
13651	2283	8	null	2025-03-11 01:54:09.965128	2025-03-11 01:54:09.965128
13652	2283	9	null	2025-03-11 01:54:10.031797	2025-03-11 01:54:10.031797
13653	2284	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:10.163934	2025-03-11 01:54:10.163934
13654	2284	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:10.230774	2025-03-11 01:54:10.230774
13655	2284	6	null	2025-03-11 01:54:10.297332	2025-03-11 01:54:10.297332
13656	2284	7	TRUE	2025-03-11 01:54:10.364029	2025-03-11 01:54:10.364029
13657	2284	8	null	2025-03-11 01:54:10.430693	2025-03-11 01:54:10.430693
13658	2284	9	null	2025-03-11 01:54:10.497409	2025-03-11 01:54:10.497409
13659	2285	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:10.630781	2025-03-11 01:54:10.630781
13660	2285	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:10.696614	2025-03-11 01:54:10.696614
13661	2285	6	null	2025-03-11 01:54:10.762582	2025-03-11 01:54:10.762582
13662	2285	7	FALSE	2025-03-11 01:54:10.828546	2025-03-11 01:54:10.828546
13663	2285	8	null	2025-03-11 01:54:10.900506	2025-03-11 01:54:10.900506
13664	2285	9	null	2025-03-11 01:54:10.966333	2025-03-11 01:54:10.966333
13665	2286	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:11.098376	2025-03-11 01:54:11.098376
13666	2286	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:11.164292	2025-03-11 01:54:11.164292
13667	2286	6	null	2025-03-11 01:54:11.230567	2025-03-11 01:54:11.230567
13668	2286	7	FALSE	2025-03-11 01:54:11.295412	2025-03-11 01:54:11.295412
13669	2286	8	null	2025-03-11 01:54:11.360896	2025-03-11 01:54:11.360896
13670	2286	9	null	2025-03-11 01:54:11.426997	2025-03-11 01:54:11.426997
13671	2287	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:11.562046	2025-03-11 01:54:11.562046
13672	2287	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:54:11.629599	2025-03-11 01:54:11.629599
13673	2287	6	null	2025-03-11 01:54:11.695678	2025-03-11 01:54:11.695678
13674	2287	7	TRUE	2025-03-11 01:54:11.762086	2025-03-11 01:54:11.762086
13675	2287	8	null	2025-03-11 01:54:11.827739	2025-03-11 01:54:11.827739
13676	2287	9	null	2025-03-11 01:54:11.897129	2025-03-11 01:54:11.897129
13677	2288	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:12.029545	2025-03-11 01:54:12.029545
13678	2288	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:12.095382	2025-03-11 01:54:12.095382
13679	2288	6	null	2025-03-11 01:54:12.161196	2025-03-11 01:54:12.161196
13680	2288	7	FALSE	2025-03-11 01:54:12.231333	2025-03-11 01:54:12.231333
13681	2288	8	null	2025-03-11 01:54:12.298749	2025-03-11 01:54:12.298749
13682	2288	9	null	2025-03-11 01:54:12.364696	2025-03-11 01:54:12.364696
13683	2289	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:12.496969	2025-03-11 01:54:12.496969
13684	2289	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:12.564382	2025-03-11 01:54:12.564382
13685	2289	6	null	2025-03-11 01:54:12.630321	2025-03-11 01:54:12.630321
13686	2289	7	FALSE	2025-03-11 01:54:12.69601	2025-03-11 01:54:12.69601
13687	2289	8	null	2025-03-11 01:54:12.762508	2025-03-11 01:54:12.762508
13688	2289	9	null	2025-03-11 01:54:12.828615	2025-03-11 01:54:12.828615
13689	2290	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:12.96022	2025-03-11 01:54:12.96022
13690	2290	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:13.02608	2025-03-11 01:54:13.02608
13691	2290	6	null	2025-03-11 01:54:13.092027	2025-03-11 01:54:13.092027
13692	2290	7	FALSE	2025-03-11 01:54:13.157968	2025-03-11 01:54:13.157968
13693	2290	8	null	2025-03-11 01:54:13.224886	2025-03-11 01:54:13.224886
13694	2290	9	null	2025-03-11 01:54:13.296625	2025-03-11 01:54:13.296625
13695	2291	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:13.428403	2025-03-11 01:54:13.428403
13696	2291	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:13.494872	2025-03-11 01:54:13.494872
13697	2291	6	null	2025-03-11 01:54:13.561092	2025-03-11 01:54:13.561092
13698	2291	7	FALSE	2025-03-11 01:54:13.6277	2025-03-11 01:54:13.6277
13699	2291	8	null	2025-03-11 01:54:13.693668	2025-03-11 01:54:13.693668
13700	2291	9	null	2025-03-11 01:54:13.759768	2025-03-11 01:54:13.759768
13701	2292	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:13.892308	2025-03-11 01:54:13.892308
13702	2292	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:13.958088	2025-03-11 01:54:13.958088
13703	2292	6	null	2025-03-11 01:54:14.023816	2025-03-11 01:54:14.023816
13704	2292	7	FALSE	2025-03-11 01:54:14.089769	2025-03-11 01:54:14.089769
13705	2292	8	null	2025-03-11 01:54:14.155856	2025-03-11 01:54:14.155856
13706	2292	9	null	2025-03-11 01:54:14.22214	2025-03-11 01:54:14.22214
13707	2293	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:54:14.35424	2025-03-11 01:54:14.35424
13708	2293	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:54:14.42036	2025-03-11 01:54:14.42036
13709	2293	6	null	2025-03-11 01:54:14.485853	2025-03-11 01:54:14.485853
13710	2293	7	FALSE	2025-03-11 01:54:14.551666	2025-03-11 01:54:14.551666
13711	2293	8	null	2025-03-11 01:54:14.617678	2025-03-11 01:54:14.617678
13712	2293	9	null	2025-03-11 01:54:14.683739	2025-03-11 01:54:14.683739
13713	2294	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:54:14.820574	2025-03-11 01:54:14.820574
13714	2294	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:54:14.886373	2025-03-11 01:54:14.886373
13715	2294	6	null	2025-03-11 01:54:14.952777	2025-03-11 01:54:14.952777
13716	2294	7	TRUE	2025-03-11 01:54:15.018409	2025-03-11 01:54:15.018409
13717	2294	8	null	2025-03-11 01:54:15.084552	2025-03-11 01:54:15.084552
13718	2294	9	null	2025-03-11 01:54:15.150525	2025-03-11 01:54:15.150525
13719	2295	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:54:15.28133	2025-03-11 01:54:15.28133
13720	2295	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:54:15.346289	2025-03-11 01:54:15.346289
13721	2295	6	null	2025-03-11 01:54:15.412388	2025-03-11 01:54:15.412388
13722	2295	7	FALSE	2025-03-11 01:54:15.478013	2025-03-11 01:54:15.478013
13723	2295	8	null	2025-03-11 01:54:15.543948	2025-03-11 01:54:15.543948
13724	2295	9	null	2025-03-11 01:54:15.610029	2025-03-11 01:54:15.610029
13725	2296	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:54:15.741984	2025-03-11 01:54:15.741984
13726	2296	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:54:15.808151	2025-03-11 01:54:15.808151
13727	2296	6	null	2025-03-11 01:54:15.874186	2025-03-11 01:54:15.874186
13728	2296	7	FALSE	2025-03-11 01:54:15.940098	2025-03-11 01:54:15.940098
13729	2296	8	null	2025-03-11 01:54:16.006021	2025-03-11 01:54:16.006021
13730	2296	9	null	2025-03-11 01:54:16.071747	2025-03-11 01:54:16.071747
13731	2297	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:16.204513	2025-03-11 01:54:16.204513
13732	2297	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:16.270559	2025-03-11 01:54:16.270559
13733	2297	6	null	2025-03-11 01:54:16.336729	2025-03-11 01:54:16.336729
13734	2297	7	FALSE	2025-03-11 01:54:16.402736	2025-03-11 01:54:16.402736
13735	2297	8	null	2025-03-11 01:54:16.468503	2025-03-11 01:54:16.468503
13736	2297	9	null	2025-03-11 01:54:16.534327	2025-03-11 01:54:16.534327
13737	2298	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:54:16.667364	2025-03-11 01:54:16.667364
13738	2298	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:16.734163	2025-03-11 01:54:16.734163
13739	2298	6	null	2025-03-11 01:54:16.800359	2025-03-11 01:54:16.800359
13740	2298	7	FALSE	2025-03-11 01:54:16.866881	2025-03-11 01:54:16.866881
13741	2298	8	null	2025-03-11 01:54:16.93287	2025-03-11 01:54:16.93287
13742	2298	9	null	2025-03-11 01:54:16.998614	2025-03-11 01:54:16.998614
13743	2299	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:17.130638	2025-03-11 01:54:17.130638
13744	2299	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:17.196289	2025-03-11 01:54:17.196289
13745	2299	6	null	2025-03-11 01:54:17.262193	2025-03-11 01:54:17.262193
13746	2299	7	FALSE	2025-03-11 01:54:17.32947	2025-03-11 01:54:17.32947
13747	2299	8	null	2025-03-11 01:54:17.397095	2025-03-11 01:54:17.397095
13748	2299	9	null	2025-03-11 01:54:17.463175	2025-03-11 01:54:17.463175
13749	2300	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:17.595065	2025-03-11 01:54:17.595065
13750	2300	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:17.660792	2025-03-11 01:54:17.660792
13751	2300	6	null	2025-03-11 01:54:17.727096	2025-03-11 01:54:17.727096
13752	2300	7	FALSE	2025-03-11 01:54:17.793067	2025-03-11 01:54:17.793067
13753	2300	8	null	2025-03-11 01:54:17.859183	2025-03-11 01:54:17.859183
13754	2300	9	null	2025-03-11 01:54:17.92509	2025-03-11 01:54:17.92509
13755	2301	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:18.057446	2025-03-11 01:54:18.057446
13756	2301	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:18.125915	2025-03-11 01:54:18.125915
13757	2301	6	null	2025-03-11 01:54:18.191871	2025-03-11 01:54:18.191871
13758	2301	7	FALSE	2025-03-11 01:54:18.257921	2025-03-11 01:54:18.257921
13759	2301	8	null	2025-03-11 01:54:18.32446	2025-03-11 01:54:18.32446
13760	2301	9	null	2025-03-11 01:54:18.397538	2025-03-11 01:54:18.397538
13761	2302	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:54:18.529622	2025-03-11 01:54:18.529622
13762	2302	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:18.596088	2025-03-11 01:54:18.596088
13763	2302	6	null	2025-03-11 01:54:18.662388	2025-03-11 01:54:18.662388
13764	2302	7	FALSE	2025-03-11 01:54:18.727948	2025-03-11 01:54:18.727948
13765	2302	8	null	2025-03-11 01:54:18.794119	2025-03-11 01:54:18.794119
13766	2302	9	null	2025-03-11 01:54:18.860054	2025-03-11 01:54:18.860054
13767	2303	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:18.991953	2025-03-11 01:54:18.991953
13768	2303	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:19.057961	2025-03-11 01:54:19.057961
13769	2303	6	null	2025-03-11 01:54:19.123931	2025-03-11 01:54:19.123931
13770	2303	7	FALSE	2025-03-11 01:54:19.189892	2025-03-11 01:54:19.189892
13771	2303	8	null	2025-03-11 01:54:19.255934	2025-03-11 01:54:19.255934
13772	2303	9	null	2025-03-11 01:54:19.321866	2025-03-11 01:54:19.321866
13773	2304	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:19.465256	2025-03-11 01:54:19.465256
13774	2304	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:19.533122	2025-03-11 01:54:19.533122
13775	2304	6	null	2025-03-11 01:54:19.599801	2025-03-11 01:54:19.599801
13776	2304	7	FALSE	2025-03-11 01:54:19.665603	2025-03-11 01:54:19.665603
13777	2304	8	null	2025-03-11 01:54:19.730737	2025-03-11 01:54:19.730737
13778	2304	9	null	2025-03-11 01:54:19.796889	2025-03-11 01:54:19.796889
13779	2305	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:19.932115	2025-03-11 01:54:19.932115
13780	2305	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:54:19.998079	2025-03-11 01:54:19.998079
13781	2305	6	null	2025-03-11 01:54:20.064001	2025-03-11 01:54:20.064001
13782	2305	7	FALSE	2025-03-11 01:54:20.130387	2025-03-11 01:54:20.130387
13783	2305	8	null	2025-03-11 01:54:20.19642	2025-03-11 01:54:20.19642
13784	2305	9	null	2025-03-11 01:54:20.262477	2025-03-11 01:54:20.262477
13785	2306	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:20.396079	2025-03-11 01:54:20.396079
13786	2306	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:20.461917	2025-03-11 01:54:20.461917
13787	2306	6	null	2025-03-11 01:54:20.527804	2025-03-11 01:54:20.527804
13788	2306	7	FALSE	2025-03-11 01:54:20.593567	2025-03-11 01:54:20.593567
13789	2306	8	null	2025-03-11 01:54:20.660279	2025-03-11 01:54:20.660279
13790	2306	9	null	2025-03-11 01:54:20.725946	2025-03-11 01:54:20.725946
13791	2307	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:20.858126	2025-03-11 01:54:20.858126
13792	2307	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:20.924074	2025-03-11 01:54:20.924074
13793	2307	6	null	2025-03-11 01:54:20.990755	2025-03-11 01:54:20.990755
13794	2307	7	FALSE	2025-03-11 01:54:21.058137	2025-03-11 01:54:21.058137
13795	2307	8	null	2025-03-11 01:54:21.123965	2025-03-11 01:54:21.123965
13796	2307	9	null	2025-03-11 01:54:21.191401	2025-03-11 01:54:21.191401
13797	2308	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:21.328286	2025-03-11 01:54:21.328286
13798	2308	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:21.394132	2025-03-11 01:54:21.394132
13799	2308	6	null	2025-03-11 01:54:21.459963	2025-03-11 01:54:21.459963
13800	2308	7	FALSE	2025-03-11 01:54:21.525899	2025-03-11 01:54:21.525899
13801	2308	8	null	2025-03-11 01:54:21.59192	2025-03-11 01:54:21.59192
13802	2308	9	null	2025-03-11 01:54:21.658058	2025-03-11 01:54:21.658058
13803	2309	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:21.790066	2025-03-11 01:54:21.790066
13804	2309	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:21.856234	2025-03-11 01:54:21.856234
13805	2309	6	null	2025-03-11 01:54:21.922799	2025-03-11 01:54:21.922799
13806	2309	7	FALSE	2025-03-11 01:54:21.988741	2025-03-11 01:54:21.988741
13807	2309	8	null	2025-03-11 01:54:22.054349	2025-03-11 01:54:22.054349
13808	2309	9	null	2025-03-11 01:54:22.120477	2025-03-11 01:54:22.120477
13809	2310	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:22.253942	2025-03-11 01:54:22.253942
13810	2310	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:54:22.319639	2025-03-11 01:54:22.319639
13811	2310	6	null	2025-03-11 01:54:22.385666	2025-03-11 01:54:22.385666
13812	2310	7	FALSE	2025-03-11 01:54:22.454346	2025-03-11 01:54:22.454346
13813	2310	8	null	2025-03-11 01:54:22.523687	2025-03-11 01:54:22.523687
13814	2310	9	null	2025-03-11 01:54:22.590238	2025-03-11 01:54:22.590238
13815	2311	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:54:22.723966	2025-03-11 01:54:22.723966
13816	2311	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:54:22.79032	2025-03-11 01:54:22.79032
13817	2311	6	null	2025-03-11 01:54:22.856308	2025-03-11 01:54:22.856308
13818	2311	7	TRUE	2025-03-11 01:54:22.9223	2025-03-11 01:54:22.9223
13819	2311	8	null	2025-03-11 01:54:22.988866	2025-03-11 01:54:22.988866
13820	2311	9	null	2025-03-11 01:54:23.055422	2025-03-11 01:54:23.055422
13821	2312	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:54:23.187596	2025-03-11 01:54:23.187596
13822	2312	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:54:23.253838	2025-03-11 01:54:23.253838
13823	2312	6	null	2025-03-11 01:54:23.319865	2025-03-11 01:54:23.319865
13824	2312	7	FALSE	2025-03-11 01:54:23.385698	2025-03-11 01:54:23.385698
13825	2312	8	null	2025-03-11 01:54:23.451698	2025-03-11 01:54:23.451698
13826	2312	9	null	2025-03-11 01:54:23.517555	2025-03-11 01:54:23.517555
13827	2313	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:54:23.650053	2025-03-11 01:54:23.650053
13828	2313	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:54:23.718335	2025-03-11 01:54:23.718335
13829	2313	6	null	2025-03-11 01:54:23.784154	2025-03-11 01:54:23.784154
13830	2313	7	FALSE	2025-03-11 01:54:23.849973	2025-03-11 01:54:23.849973
13831	2313	8	null	2025-03-11 01:54:23.916006	2025-03-11 01:54:23.916006
13832	2313	9	null	2025-03-11 01:54:23.982349	2025-03-11 01:54:23.982349
13833	2314	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:24.114502	2025-03-11 01:54:24.114502
13834	2314	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:54:24.180196	2025-03-11 01:54:24.180196
13835	2314	6	null	2025-03-11 01:54:24.246242	2025-03-11 01:54:24.246242
13836	2314	7	FALSE	2025-03-11 01:54:24.317063	2025-03-11 01:54:24.317063
13837	2314	8	null	2025-03-11 01:54:24.383109	2025-03-11 01:54:24.383109
13838	2314	9	null	2025-03-11 01:54:24.449204	2025-03-11 01:54:24.449204
13839	2315	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:24.590132	2025-03-11 01:54:24.590132
13840	2315	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:54:24.660144	2025-03-11 01:54:24.660144
13841	2315	6	null	2025-03-11 01:54:24.726022	2025-03-11 01:54:24.726022
13842	2315	7	TRUE	2025-03-11 01:54:24.791994	2025-03-11 01:54:24.791994
13843	2315	8	null	2025-03-11 01:54:24.857712	2025-03-11 01:54:24.857712
13844	2315	9	null	2025-03-11 01:54:24.923908	2025-03-11 01:54:24.923908
13845	2316	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:54:25.055868	2025-03-11 01:54:25.055868
13846	2316	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:54:25.125704	2025-03-11 01:54:25.125704
13847	2316	6	null	2025-03-11 01:54:25.192572	2025-03-11 01:54:25.192572
13848	2316	7	FALSE	2025-03-11 01:54:25.258781	2025-03-11 01:54:25.258781
13849	2316	8	null	2025-03-11 01:54:25.32466	2025-03-11 01:54:25.32466
13850	2316	9	null	2025-03-11 01:54:25.390445	2025-03-11 01:54:25.390445
13851	2317	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:54:25.522592	2025-03-11 01:54:25.522592
13852	2317	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:54:25.588774	2025-03-11 01:54:25.588774
13853	2317	6	null	2025-03-11 01:54:25.654519	2025-03-11 01:54:25.654519
13854	2317	7	TRUE	2025-03-11 01:54:25.720685	2025-03-11 01:54:25.720685
13855	2317	8	null	2025-03-11 01:54:25.78657	2025-03-11 01:54:25.78657
13856	2317	9	null	2025-03-11 01:54:25.852657	2025-03-11 01:54:25.852657
13857	2318	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:25.983719	2025-03-11 01:54:25.983719
13858	2318	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:54:26.050065	2025-03-11 01:54:26.050065
13859	2318	6	null	2025-03-11 01:54:26.116234	2025-03-11 01:54:26.116234
13860	2318	7	FALSE	2025-03-11 01:54:26.182043	2025-03-11 01:54:26.182043
13861	2318	8	null	2025-03-11 01:54:26.247995	2025-03-11 01:54:26.247995
13862	2318	9	null	2025-03-11 01:54:26.314009	2025-03-11 01:54:26.314009
13863	2319	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:26.446543	2025-03-11 01:54:26.446543
13864	2319	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:54:26.512364	2025-03-11 01:54:26.512364
13865	2319	6	null	2025-03-11 01:54:26.578324	2025-03-11 01:54:26.578324
13866	2319	7	FALSE	2025-03-11 01:54:26.644174	2025-03-11 01:54:26.644174
13867	2319	8	null	2025-03-11 01:54:26.710023	2025-03-11 01:54:26.710023
13868	2319	9	null	2025-03-11 01:54:26.77589	2025-03-11 01:54:26.77589
13869	2320	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:26.907727	2025-03-11 01:54:26.907727
13870	2320	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:54:26.974046	2025-03-11 01:54:26.974046
13871	2320	6	null	2025-03-11 01:54:27.042629	2025-03-11 01:54:27.042629
13872	2320	7	FALSE	2025-03-11 01:54:27.108858	2025-03-11 01:54:27.108858
13873	2320	8	null	2025-03-11 01:54:27.17457	2025-03-11 01:54:27.17457
13874	2320	9	null	2025-03-11 01:54:27.240513	2025-03-11 01:54:27.240513
13875	2321	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:27.372916	2025-03-11 01:54:27.372916
13876	2321	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:54:27.438773	2025-03-11 01:54:27.438773
13877	2321	6	null	2025-03-11 01:54:27.504717	2025-03-11 01:54:27.504717
13878	2321	7	FALSE	2025-03-11 01:54:27.571299	2025-03-11 01:54:27.571299
13879	2321	8	null	2025-03-11 01:54:27.640903	2025-03-11 01:54:27.640903
13880	2321	9	null	2025-03-11 01:54:27.707751	2025-03-11 01:54:27.707751
13881	2322	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:27.838374	2025-03-11 01:54:27.838374
13882	2322	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:54:27.904427	2025-03-11 01:54:27.904427
13883	2322	6	null	2025-03-11 01:54:27.970658	2025-03-11 01:54:27.970658
13884	2322	7	FALSE	2025-03-11 01:54:28.047464	2025-03-11 01:54:28.047464
13885	2322	8	null	2025-03-11 01:54:28.113324	2025-03-11 01:54:28.113324
13886	2322	9	null	2025-03-11 01:54:28.179235	2025-03-11 01:54:28.179235
13887	2323	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:54:28.311351	2025-03-11 01:54:28.311351
13888	2323	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:54:28.377265	2025-03-11 01:54:28.377265
13889	2323	6	null	2025-03-11 01:54:28.443096	2025-03-11 01:54:28.443096
13890	2323	7	FALSE	2025-03-11 01:54:28.509942	2025-03-11 01:54:28.509942
13891	2323	8	null	2025-03-11 01:54:28.576568	2025-03-11 01:54:28.576568
13892	2323	9	null	2025-03-11 01:54:28.642501	2025-03-11 01:54:28.642501
13893	2324	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:28.774467	2025-03-11 01:54:28.774467
13894	2324	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:54:28.841006	2025-03-11 01:54:28.841006
13895	2324	6	null	2025-03-11 01:54:28.907177	2025-03-11 01:54:28.907177
13896	2324	7	FALSE	2025-03-11 01:54:28.972518	2025-03-11 01:54:28.972518
13897	2324	8	null	2025-03-11 01:54:29.038538	2025-03-11 01:54:29.038538
13898	2324	9	null	2025-03-11 01:54:29.104437	2025-03-11 01:54:29.104437
13899	2325	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:29.235969	2025-03-11 01:54:29.235969
13900	2325	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:29.301816	2025-03-11 01:54:29.301816
13901	2325	6	null	2025-03-11 01:54:29.367924	2025-03-11 01:54:29.367924
13902	2325	7	FALSE	2025-03-11 01:54:29.434073	2025-03-11 01:54:29.434073
13903	2325	8	null	2025-03-11 01:54:29.499879	2025-03-11 01:54:29.499879
13904	2325	9	null	2025-03-11 01:54:29.567124	2025-03-11 01:54:29.567124
13905	2326	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:29.699394	2025-03-11 01:54:29.699394
13906	2326	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:29.765915	2025-03-11 01:54:29.765915
13907	2326	6	null	2025-03-11 01:54:29.831816	2025-03-11 01:54:29.831816
13908	2326	7	TRUE	2025-03-11 01:54:29.898374	2025-03-11 01:54:29.898374
13909	2326	8	null	2025-03-11 01:54:29.963656	2025-03-11 01:54:29.963656
13910	2326	9	null	2025-03-11 01:54:30.029685	2025-03-11 01:54:30.029685
13911	2327	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:30.161874	2025-03-11 01:54:30.161874
13912	2327	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:30.228152	2025-03-11 01:54:30.228152
13913	2327	6	null	2025-03-11 01:54:30.294041	2025-03-11 01:54:30.294041
13914	2327	7	FALSE	2025-03-11 01:54:30.359867	2025-03-11 01:54:30.359867
13915	2327	8	null	2025-03-11 01:54:30.425881	2025-03-11 01:54:30.425881
13916	2327	9	null	2025-03-11 01:54:30.49237	2025-03-11 01:54:30.49237
13917	2328	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:54:30.631716	2025-03-11 01:54:30.631716
13918	2328	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:30.697865	2025-03-11 01:54:30.697865
13919	2328	6	null	2025-03-11 01:54:30.763909	2025-03-11 01:54:30.763909
13920	2328	7	FALSE	2025-03-11 01:54:30.832858	2025-03-11 01:54:30.832858
13921	2328	8	null	2025-03-11 01:54:30.898939	2025-03-11 01:54:30.898939
13922	2328	9	null	2025-03-11 01:54:30.965768	2025-03-11 01:54:30.965768
13923	2329	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:54:31.098708	2025-03-11 01:54:31.098708
13924	2329	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:31.164415	2025-03-11 01:54:31.164415
13925	2329	6	null	2025-03-11 01:54:31.231575	2025-03-11 01:54:31.231575
13926	2329	7	FALSE	2025-03-11 01:54:31.297656	2025-03-11 01:54:31.297656
13927	2329	8	null	2025-03-11 01:54:31.365386	2025-03-11 01:54:31.365386
13928	2329	9	null	2025-03-11 01:54:31.432039	2025-03-11 01:54:31.432039
13929	2330	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:54:31.56759	2025-03-11 01:54:31.56759
13930	2330	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:31.63346	2025-03-11 01:54:31.63346
13931	2330	6	null	2025-03-11 01:54:31.69916	2025-03-11 01:54:31.69916
13932	2330	7	TRUE	2025-03-11 01:54:31.765867	2025-03-11 01:54:31.765867
13933	2330	8	null	2025-03-11 01:54:31.832164	2025-03-11 01:54:31.832164
13934	2330	9	null	2025-03-11 01:54:31.898481	2025-03-11 01:54:31.898481
13935	2331	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:32.031818	2025-03-11 01:54:32.031818
13936	2331	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:54:32.097701	2025-03-11 01:54:32.097701
13937	2331	6	null	2025-03-11 01:54:32.163597	2025-03-11 01:54:32.163597
13938	2331	7	FALSE	2025-03-11 01:54:32.229588	2025-03-11 01:54:32.229588
13939	2331	8	null	2025-03-11 01:54:32.296369	2025-03-11 01:54:32.296369
13940	2331	9	null	2025-03-11 01:54:32.363361	2025-03-11 01:54:32.363361
13941	2332	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:32.495514	2025-03-11 01:54:32.495514
13942	2332	5	4bfc57beda84f0069a1647806d9dee3c	2025-03-11 01:54:32.561756	2025-03-11 01:54:32.561756
13943	2332	6	null	2025-03-11 01:54:32.629306	2025-03-11 01:54:32.629306
13944	2332	7	FALSE	2025-03-11 01:54:32.695505	2025-03-11 01:54:32.695505
13945	2332	8	null	2025-03-11 01:54:32.761691	2025-03-11 01:54:32.761691
13946	2332	9	null	2025-03-11 01:54:32.82897	2025-03-11 01:54:32.82897
13947	2333	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:32.96131	2025-03-11 01:54:32.96131
13948	2333	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:33.026961	2025-03-11 01:54:33.026961
13949	2333	6	null	2025-03-11 01:54:33.092811	2025-03-11 01:54:33.092811
13950	2333	7	TRUE	2025-03-11 01:54:33.158865	2025-03-11 01:54:33.158865
13951	2333	8	null	2025-03-11 01:54:33.224887	2025-03-11 01:54:33.224887
13952	2333	9	null	2025-03-11 01:54:33.290808	2025-03-11 01:54:33.290808
13953	2334	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:33.421343	2025-03-11 01:54:33.421343
13954	2334	5	b8eff75b87fa095ccf5f9a5124852b51	2025-03-11 01:54:33.487231	2025-03-11 01:54:33.487231
13955	2334	6	null	2025-03-11 01:54:33.553507	2025-03-11 01:54:33.553507
13956	2334	7	TRUE	2025-03-11 01:54:33.618343	2025-03-11 01:54:33.618343
13957	2334	8	null	2025-03-11 01:54:33.684337	2025-03-11 01:54:33.684337
13958	2334	9	null	2025-03-11 01:54:33.750525	2025-03-11 01:54:33.750525
13959	2335	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:54:33.883564	2025-03-11 01:54:33.883564
13960	2335	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:33.949425	2025-03-11 01:54:33.949425
13961	2335	6	null	2025-03-11 01:54:34.014633	2025-03-11 01:54:34.014633
13962	2335	7	FALSE	2025-03-11 01:54:34.098774	2025-03-11 01:54:34.098774
13963	2335	8	null	2025-03-11 01:54:34.164923	2025-03-11 01:54:34.164923
13964	2335	9	null	2025-03-11 01:54:34.231385	2025-03-11 01:54:34.231385
13965	2336	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:34.370356	2025-03-11 01:54:34.370356
13966	2336	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:34.436198	2025-03-11 01:54:34.436198
13967	2336	6	null	2025-03-11 01:54:34.502056	2025-03-11 01:54:34.502056
13968	2336	7	FALSE	2025-03-11 01:54:34.568139	2025-03-11 01:54:34.568139
13969	2336	8	null	2025-03-11 01:54:34.633945	2025-03-11 01:54:34.633945
13970	2336	9	null	2025-03-11 01:54:34.69974	2025-03-11 01:54:34.69974
13971	2337	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:54:34.831634	2025-03-11 01:54:34.831634
13972	2337	5	4bfc57beda84f0069a1647806d9dee3c	2025-03-11 01:54:34.897646	2025-03-11 01:54:34.897646
13973	2337	6	null	2025-03-11 01:54:34.963508	2025-03-11 01:54:34.963508
13974	2337	7	TRUE	2025-03-11 01:54:35.02985	2025-03-11 01:54:35.02985
13975	2337	8	null	2025-03-11 01:54:35.098741	2025-03-11 01:54:35.098741
13976	2337	9	null	2025-03-11 01:54:35.164675	2025-03-11 01:54:35.164675
13977	2338	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:54:35.296881	2025-03-11 01:54:35.296881
13978	2338	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:54:35.362792	2025-03-11 01:54:35.362792
13979	2338	6	null	2025-03-11 01:54:35.428575	2025-03-11 01:54:35.428575
13980	2338	7	TRUE	2025-03-11 01:54:35.494642	2025-03-11 01:54:35.494642
13981	2338	8	null	2025-03-11 01:54:35.560489	2025-03-11 01:54:35.560489
13982	2338	9	null	2025-03-11 01:54:35.63011	2025-03-11 01:54:35.63011
13983	2339	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:54:35.767075	2025-03-11 01:54:35.767075
13984	2339	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:54:35.833357	2025-03-11 01:54:35.833357
13985	2339	6	null	2025-03-11 01:54:35.89929	2025-03-11 01:54:35.89929
13986	2339	7	TRUE	2025-03-11 01:54:35.965654	2025-03-11 01:54:35.965654
13987	2339	8	null	2025-03-11 01:54:36.033151	2025-03-11 01:54:36.033151
13988	2339	9	null	2025-03-11 01:54:36.099308	2025-03-11 01:54:36.099308
13989	2340	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:54:36.231372	2025-03-11 01:54:36.231372
13990	2340	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:36.297445	2025-03-11 01:54:36.297445
13991	2340	6	null	2025-03-11 01:54:36.363524	2025-03-11 01:54:36.363524
13992	2340	7	FALSE	2025-03-11 01:54:36.42952	2025-03-11 01:54:36.42952
13993	2340	8	null	2025-03-11 01:54:36.49539	2025-03-11 01:54:36.49539
13994	2340	9	null	2025-03-11 01:54:36.561468	2025-03-11 01:54:36.561468
13995	2341	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:54:36.693909	2025-03-11 01:54:36.693909
13996	2341	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:36.759762	2025-03-11 01:54:36.759762
13997	2341	6	null	2025-03-11 01:54:36.826765	2025-03-11 01:54:36.826765
13998	2341	7	TRUE	2025-03-11 01:54:36.893794	2025-03-11 01:54:36.893794
13999	2341	8	null	2025-03-11 01:54:36.959761	2025-03-11 01:54:36.959761
14000	2341	9	null	2025-03-11 01:54:37.025762	2025-03-11 01:54:37.025762
14001	2342	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:54:37.159575	2025-03-11 01:54:37.159575
14002	2342	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:37.225455	2025-03-11 01:54:37.225455
14003	2342	6	null	2025-03-11 01:54:37.291826	2025-03-11 01:54:37.291826
14004	2342	7	FALSE	2025-03-11 01:54:37.357602	2025-03-11 01:54:37.357602
14005	2342	8	null	2025-03-11 01:54:37.423549	2025-03-11 01:54:37.423549
14006	2342	9	null	2025-03-11 01:54:37.489611	2025-03-11 01:54:37.489611
14007	2343	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:54:37.625079	2025-03-11 01:54:37.625079
14008	2343	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:37.693475	2025-03-11 01:54:37.693475
14009	2343	6	null	2025-03-11 01:54:37.759669	2025-03-11 01:54:37.759669
14010	2343	7	FALSE	2025-03-11 01:54:37.829813	2025-03-11 01:54:37.829813
14011	2343	8	null	2025-03-11 01:54:37.895816	2025-03-11 01:54:37.895816
14012	2343	9	null	2025-03-11 01:54:37.961823	2025-03-11 01:54:37.961823
14013	2344	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:38.093991	2025-03-11 01:54:38.093991
14014	2344	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:38.159833	2025-03-11 01:54:38.159833
14015	2344	6	null	2025-03-11 01:54:38.225733	2025-03-11 01:54:38.225733
14016	2344	7	TRUE	2025-03-11 01:54:38.2922	2025-03-11 01:54:38.2922
14017	2344	8	null	2025-03-11 01:54:38.357932	2025-03-11 01:54:38.357932
14018	2344	9	null	2025-03-11 01:54:38.423808	2025-03-11 01:54:38.423808
14019	2345	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:54:38.594075	2025-03-11 01:54:38.594075
14020	2345	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:38.662131	2025-03-11 01:54:38.662131
14021	2345	6	null	2025-03-11 01:54:38.728002	2025-03-11 01:54:38.728002
14022	2345	7	FALSE	2025-03-11 01:54:38.793817	2025-03-11 01:54:38.793817
14023	2345	8	null	2025-03-11 01:54:38.859539	2025-03-11 01:54:38.859539
14024	2345	9	null	2025-03-11 01:54:38.925324	2025-03-11 01:54:38.925324
14025	2346	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:39.05816	2025-03-11 01:54:39.05816
14026	2346	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:39.124236	2025-03-11 01:54:39.124236
14027	2346	6	null	2025-03-11 01:54:39.190081	2025-03-11 01:54:39.190081
14028	2346	7	TRUE	2025-03-11 01:54:39.25588	2025-03-11 01:54:39.25588
14029	2346	8	null	2025-03-11 01:54:39.322223	2025-03-11 01:54:39.322223
14030	2346	9	null	2025-03-11 01:54:39.388638	2025-03-11 01:54:39.388638
14031	2347	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:54:39.521013	2025-03-11 01:54:39.521013
14032	2347	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:39.586908	2025-03-11 01:54:39.586908
14033	2347	6	null	2025-03-11 01:54:39.652828	2025-03-11 01:54:39.652828
14034	2347	7	FALSE	2025-03-11 01:54:39.719288	2025-03-11 01:54:39.719288
14035	2347	8	null	2025-03-11 01:54:39.786944	2025-03-11 01:54:39.786944
14036	2347	9	null	2025-03-11 01:54:39.852678	2025-03-11 01:54:39.852678
14037	2348	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:54:39.984901	2025-03-11 01:54:39.984901
14038	2348	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:40.050812	2025-03-11 01:54:40.050812
14039	2348	6	null	2025-03-11 01:54:40.116971	2025-03-11 01:54:40.116971
14040	2348	7	FALSE	2025-03-11 01:54:40.182847	2025-03-11 01:54:40.182847
14041	2348	8	null	2025-03-11 01:54:40.248983	2025-03-11 01:54:40.248983
14042	2348	9	null	2025-03-11 01:54:40.315061	2025-03-11 01:54:40.315061
14043	2349	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:54:40.447088	2025-03-11 01:54:40.447088
14044	2349	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:40.512869	2025-03-11 01:54:40.512869
14045	2349	6	null	2025-03-11 01:54:40.578665	2025-03-11 01:54:40.578665
14046	2349	7	FALSE	2025-03-11 01:54:40.645555	2025-03-11 01:54:40.645555
14047	2349	8	null	2025-03-11 01:54:40.712405	2025-03-11 01:54:40.712405
14048	2349	9	null	2025-03-11 01:54:40.778234	2025-03-11 01:54:40.778234
14049	2350	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:54:40.912197	2025-03-11 01:54:40.912197
14050	2350	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:54:40.977938	2025-03-11 01:54:40.977938
14051	2350	6	null	2025-03-11 01:54:41.043828	2025-03-11 01:54:41.043828
14052	2350	7	TRUE	2025-03-11 01:54:41.110428	2025-03-11 01:54:41.110428
14053	2350	8	null	2025-03-11 01:54:41.176239	2025-03-11 01:54:41.176239
14054	2350	9	null	2025-03-11 01:54:41.2422	2025-03-11 01:54:41.2422
14055	2351	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:41.374182	2025-03-11 01:54:41.374182
14056	2351	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:41.440463	2025-03-11 01:54:41.440463
14057	2351	6	null	2025-03-11 01:54:41.506338	2025-03-11 01:54:41.506338
14058	2351	7	FALSE	2025-03-11 01:54:41.572089	2025-03-11 01:54:41.572089
14059	2351	8	null	2025-03-11 01:54:41.637934	2025-03-11 01:54:41.637934
14060	2351	9	null	2025-03-11 01:54:41.703576	2025-03-11 01:54:41.703576
14061	2352	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:41.835386	2025-03-11 01:54:41.835386
14062	2352	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:41.901917	2025-03-11 01:54:41.901917
14063	2352	6	null	2025-03-11 01:54:41.967714	2025-03-11 01:54:41.967714
14064	2352	7	FALSE	2025-03-11 01:54:42.033659	2025-03-11 01:54:42.033659
14065	2352	8	null	2025-03-11 01:54:42.099503	2025-03-11 01:54:42.099503
14066	2352	9	null	2025-03-11 01:54:42.165499	2025-03-11 01:54:42.165499
14067	2353	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:42.29731	2025-03-11 01:54:42.29731
14068	2353	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:42.363082	2025-03-11 01:54:42.363082
14069	2353	6	null	2025-03-11 01:54:42.431301	2025-03-11 01:54:42.431301
14070	2353	7	FALSE	2025-03-11 01:54:42.49743	2025-03-11 01:54:42.49743
14071	2353	8	null	2025-03-11 01:54:42.563176	2025-03-11 01:54:42.563176
14072	2353	9	null	2025-03-11 01:54:42.629359	2025-03-11 01:54:42.629359
14073	2354	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:42.760779	2025-03-11 01:54:42.760779
14074	2354	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:42.826574	2025-03-11 01:54:42.826574
14075	2354	6	null	2025-03-11 01:54:42.89749	2025-03-11 01:54:42.89749
14076	2354	7	FALSE	2025-03-11 01:54:42.963343	2025-03-11 01:54:42.963343
14077	2354	8	null	2025-03-11 01:54:43.029312	2025-03-11 01:54:43.029312
14078	2354	9	null	2025-03-11 01:54:43.095118	2025-03-11 01:54:43.095118
14079	2355	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:43.227848	2025-03-11 01:54:43.227848
14080	2355	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:43.293761	2025-03-11 01:54:43.293761
14081	2355	6	null	2025-03-11 01:54:43.359731	2025-03-11 01:54:43.359731
14082	2355	7	FALSE	2025-03-11 01:54:43.425679	2025-03-11 01:54:43.425679
14083	2355	8	null	2025-03-11 01:54:43.491701	2025-03-11 01:54:43.491701
14084	2355	9	null	2025-03-11 01:54:43.560999	2025-03-11 01:54:43.560999
14085	2356	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:43.695161	2025-03-11 01:54:43.695161
14086	2356	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:43.761066	2025-03-11 01:54:43.761066
14087	2356	6	null	2025-03-11 01:54:43.82834	2025-03-11 01:54:43.82834
14088	2356	7	FALSE	2025-03-11 01:54:43.894302	2025-03-11 01:54:43.894302
14089	2356	8	null	2025-03-11 01:54:43.960621	2025-03-11 01:54:43.960621
14090	2356	9	null	2025-03-11 01:54:44.026292	2025-03-11 01:54:44.026292
14091	2357	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:44.157727	2025-03-11 01:54:44.157727
14092	2357	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:54:44.223751	2025-03-11 01:54:44.223751
14093	2357	6	null	2025-03-11 01:54:44.289485	2025-03-11 01:54:44.289485
14094	2357	7	TRUE	2025-03-11 01:54:44.355052	2025-03-11 01:54:44.355052
14095	2357	8	null	2025-03-11 01:54:44.421255	2025-03-11 01:54:44.421255
14096	2357	9	null	2025-03-11 01:54:44.487066	2025-03-11 01:54:44.487066
14097	2358	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:54:44.619993	2025-03-11 01:54:44.619993
14098	2358	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:44.685993	2025-03-11 01:54:44.685993
14099	2358	6	null	2025-03-11 01:54:44.753381	2025-03-11 01:54:44.753381
14100	2358	7	FALSE	2025-03-11 01:54:44.819569	2025-03-11 01:54:44.819569
14101	2358	8	null	2025-03-11 01:54:44.886051	2025-03-11 01:54:44.886051
14102	2358	9	null	2025-03-11 01:54:44.951937	2025-03-11 01:54:44.951937
14103	2359	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:45.0843	2025-03-11 01:54:45.0843
14104	2359	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:45.150308	2025-03-11 01:54:45.150308
14105	2359	6	null	2025-03-11 01:54:45.216268	2025-03-11 01:54:45.216268
14106	2359	7	FALSE	2025-03-11 01:54:45.285025	2025-03-11 01:54:45.285025
14107	2359	8	null	2025-03-11 01:54:45.350863	2025-03-11 01:54:45.350863
14108	2359	9	null	2025-03-11 01:54:45.417068	2025-03-11 01:54:45.417068
14109	2360	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:54:45.553374	2025-03-11 01:54:45.553374
14110	2360	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:45.619673	2025-03-11 01:54:45.619673
14111	2360	6	null	2025-03-11 01:54:45.685591	2025-03-11 01:54:45.685591
14112	2360	7	FALSE	2025-03-11 01:54:45.752002	2025-03-11 01:54:45.752002
14113	2360	8	null	2025-03-11 01:54:45.817946	2025-03-11 01:54:45.817946
14114	2360	9	null	2025-03-11 01:54:45.883865	2025-03-11 01:54:45.883865
14115	2361	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:46.017118	2025-03-11 01:54:46.017118
14116	2361	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:46.083073	2025-03-11 01:54:46.083073
14117	2361	6	null	2025-03-11 01:54:46.148875	2025-03-11 01:54:46.148875
14118	2361	7	FALSE	2025-03-11 01:54:46.215407	2025-03-11 01:54:46.215407
14119	2361	8	null	2025-03-11 01:54:46.281368	2025-03-11 01:54:46.281368
14120	2361	9	null	2025-03-11 01:54:46.348102	2025-03-11 01:54:46.348102
14121	2362	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:46.480075	2025-03-11 01:54:46.480075
14122	2362	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:46.546007	2025-03-11 01:54:46.546007
14123	2362	6	null	2025-03-11 01:54:46.612062	2025-03-11 01:54:46.612062
14124	2362	7	FALSE	2025-03-11 01:54:46.678009	2025-03-11 01:54:46.678009
14125	2362	8	null	2025-03-11 01:54:46.744651	2025-03-11 01:54:46.744651
14126	2362	9	null	2025-03-11 01:54:46.810895	2025-03-11 01:54:46.810895
14127	2363	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:46.943613	2025-03-11 01:54:46.943613
14128	2363	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:47.01148	2025-03-11 01:54:47.01148
14129	2363	6	null	2025-03-11 01:54:47.077847	2025-03-11 01:54:47.077847
14130	2363	7	FALSE	2025-03-11 01:54:47.14375	2025-03-11 01:54:47.14375
14131	2363	8	null	2025-03-11 01:54:47.208335	2025-03-11 01:54:47.208335
14132	2363	9	null	2025-03-11 01:54:47.277025	2025-03-11 01:54:47.277025
14133	2364	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:47.409649	2025-03-11 01:54:47.409649
14134	2364	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:47.475563	2025-03-11 01:54:47.475563
14135	2364	6	null	2025-03-11 01:54:47.541881	2025-03-11 01:54:47.541881
14136	2364	7	FALSE	2025-03-11 01:54:47.607819	2025-03-11 01:54:47.607819
14137	2364	8	null	2025-03-11 01:54:47.673561	2025-03-11 01:54:47.673561
14138	2364	9	null	2025-03-11 01:54:47.739381	2025-03-11 01:54:47.739381
14139	2365	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:47.914173	2025-03-11 01:54:47.914173
14140	2365	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:47.980054	2025-03-11 01:54:47.980054
14141	2365	6	null	2025-03-11 01:54:48.04951	2025-03-11 01:54:48.04951
14142	2365	7	FALSE	2025-03-11 01:54:48.114371	2025-03-11 01:54:48.114371
14143	2365	8	null	2025-03-11 01:54:48.180218	2025-03-11 01:54:48.180218
14144	2365	9	null	2025-03-11 01:54:48.246405	2025-03-11 01:54:48.246405
14145	2366	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:48.378742	2025-03-11 01:54:48.378742
14146	2366	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:48.444717	2025-03-11 01:54:48.444717
14147	2366	6	null	2025-03-11 01:54:48.510545	2025-03-11 01:54:48.510545
14148	2366	7	FALSE	2025-03-11 01:54:48.576795	2025-03-11 01:54:48.576795
14149	2366	8	null	2025-03-11 01:54:48.64282	2025-03-11 01:54:48.64282
14150	2366	9	null	2025-03-11 01:54:48.708563	2025-03-11 01:54:48.708563
14151	2367	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:54:48.841188	2025-03-11 01:54:48.841188
14152	2367	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:48.908026	2025-03-11 01:54:48.908026
14153	2367	6	null	2025-03-11 01:54:48.97394	2025-03-11 01:54:48.97394
14154	2367	7	FALSE	2025-03-11 01:54:49.039812	2025-03-11 01:54:49.039812
14155	2367	8	null	2025-03-11 01:54:49.105756	2025-03-11 01:54:49.105756
14156	2367	9	null	2025-03-11 01:54:49.172351	2025-03-11 01:54:49.172351
14157	2368	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:49.310535	2025-03-11 01:54:49.310535
14158	2368	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:49.376316	2025-03-11 01:54:49.376316
14159	2368	6	null	2025-03-11 01:54:49.445988	2025-03-11 01:54:49.445988
14160	2368	7	FALSE	2025-03-11 01:54:49.512875	2025-03-11 01:54:49.512875
14161	2368	8	null	2025-03-11 01:54:49.578844	2025-03-11 01:54:49.578844
14162	2368	9	null	2025-03-11 01:54:49.644681	2025-03-11 01:54:49.644681
14163	2369	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:49.780305	2025-03-11 01:54:49.780305
14164	2369	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:49.848595	2025-03-11 01:54:49.848595
14165	2369	6	null	2025-03-11 01:54:49.917847	2025-03-11 01:54:49.917847
14166	2369	7	FALSE	2025-03-11 01:54:49.990877	2025-03-11 01:54:49.990877
14167	2369	8	null	2025-03-11 01:54:50.057897	2025-03-11 01:54:50.057897
14168	2369	9	null	2025-03-11 01:54:50.125059	2025-03-11 01:54:50.125059
14169	2370	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:50.261098	2025-03-11 01:54:50.261098
14170	2370	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:50.327212	2025-03-11 01:54:50.327212
14171	2370	6	null	2025-03-11 01:54:50.393163	2025-03-11 01:54:50.393163
14172	2370	7	FALSE	2025-03-11 01:54:50.459895	2025-03-11 01:54:50.459895
14173	2370	8	null	2025-03-11 01:54:50.526543	2025-03-11 01:54:50.526543
14174	2370	9	null	2025-03-11 01:54:50.616292	2025-03-11 01:54:50.616292
14175	2371	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:50.748875	2025-03-11 01:54:50.748875
14176	2371	5	85a4723e41c1bd8de38eb14c86e7ffff	2025-03-11 01:54:50.814821	2025-03-11 01:54:50.814821
14177	2371	6	null	2025-03-11 01:54:50.880674	2025-03-11 01:54:50.880674
14178	2371	7	FALSE	2025-03-11 01:54:50.946329	2025-03-11 01:54:50.946329
14179	2371	8	null	2025-03-11 01:54:51.012921	2025-03-11 01:54:51.012921
14180	2371	9	null	2025-03-11 01:54:51.078924	2025-03-11 01:54:51.078924
14181	2372	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:51.20941	2025-03-11 01:54:51.20941
14182	2372	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:54:51.274376	2025-03-11 01:54:51.274376
14183	2372	6	null	2025-03-11 01:54:51.339846	2025-03-11 01:54:51.339846
14184	2372	7	FALSE	2025-03-11 01:54:51.40577	2025-03-11 01:54:51.40577
14185	2372	8	null	2025-03-11 01:54:51.471927	2025-03-11 01:54:51.471927
14186	2372	9	null	2025-03-11 01:54:51.537861	2025-03-11 01:54:51.537861
14187	2373	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:51.669717	2025-03-11 01:54:51.669717
14188	2373	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:51.735786	2025-03-11 01:54:51.735786
14189	2373	6	null	2025-03-11 01:54:51.80188	2025-03-11 01:54:51.80188
14190	2373	7	FALSE	2025-03-11 01:54:51.86764	2025-03-11 01:54:51.86764
14191	2373	8	null	2025-03-11 01:54:51.933631	2025-03-11 01:54:51.933631
14192	2373	9	null	2025-03-11 01:54:51.999606	2025-03-11 01:54:51.999606
14193	2374	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:52.13146	2025-03-11 01:54:52.13146
14194	2374	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:54:52.197374	2025-03-11 01:54:52.197374
14195	2374	6	null	2025-03-11 01:54:52.26345	2025-03-11 01:54:52.26345
14196	2374	7	FALSE	2025-03-11 01:54:52.329185	2025-03-11 01:54:52.329185
14197	2374	8	null	2025-03-11 01:54:52.395212	2025-03-11 01:54:52.395212
14198	2374	9	null	2025-03-11 01:54:52.461082	2025-03-11 01:54:52.461082
14199	2375	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:52.592658	2025-03-11 01:54:52.592658
14200	2375	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:52.658363	2025-03-11 01:54:52.658363
14201	2375	6	null	2025-03-11 01:54:52.725064	2025-03-11 01:54:52.725064
14202	2375	7	FALSE	2025-03-11 01:54:52.791016	2025-03-11 01:54:52.791016
14203	2375	8	null	2025-03-11 01:54:52.858171	2025-03-11 01:54:52.858171
14204	2375	9	null	2025-03-11 01:54:52.924184	2025-03-11 01:54:52.924184
14205	2376	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:53.05752	2025-03-11 01:54:53.05752
14206	2376	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:53.123556	2025-03-11 01:54:53.123556
14207	2376	6	null	2025-03-11 01:54:53.188383	2025-03-11 01:54:53.188383
14208	2376	7	FALSE	2025-03-11 01:54:53.254714	2025-03-11 01:54:53.254714
14209	2376	8	null	2025-03-11 01:54:53.320481	2025-03-11 01:54:53.320481
14210	2376	9	null	2025-03-11 01:54:53.385358	2025-03-11 01:54:53.385358
14211	2377	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:53.517907	2025-03-11 01:54:53.517907
14212	2377	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:53.583957	2025-03-11 01:54:53.583957
14213	2377	6	null	2025-03-11 01:54:53.650314	2025-03-11 01:54:53.650314
14214	2377	7	FALSE	2025-03-11 01:54:53.716741	2025-03-11 01:54:53.716741
14215	2377	8	null	2025-03-11 01:54:53.782652	2025-03-11 01:54:53.782652
14216	2377	9	null	2025-03-11 01:54:53.848664	2025-03-11 01:54:53.848664
14217	2378	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:53.980935	2025-03-11 01:54:53.980935
14218	2378	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:54.04741	2025-03-11 01:54:54.04741
14219	2378	6	null	2025-03-11 01:54:54.113585	2025-03-11 01:54:54.113585
14220	2378	7	TRUE	2025-03-11 01:54:54.179943	2025-03-11 01:54:54.179943
14221	2378	8	null	2025-03-11 01:54:54.245802	2025-03-11 01:54:54.245802
14222	2378	9	null	2025-03-11 01:54:54.31165	2025-03-11 01:54:54.31165
14223	2379	4	940a3ac2aa69983e8ef726390d9c0aed	2025-03-11 01:54:54.444493	2025-03-11 01:54:54.444493
14224	2379	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:54:54.512899	2025-03-11 01:54:54.512899
14225	2379	6	null	2025-03-11 01:54:54.578611	2025-03-11 01:54:54.578611
14226	2379	7	FALSE	2025-03-11 01:54:54.644542	2025-03-11 01:54:54.644542
14227	2379	8	null	2025-03-11 01:54:54.709799	2025-03-11 01:54:54.709799
14228	2379	9	null	2025-03-11 01:54:54.77578	2025-03-11 01:54:54.77578
14229	2380	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:54.908362	2025-03-11 01:54:54.908362
14230	2380	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:54:54.974086	2025-03-11 01:54:54.974086
14231	2380	6	null	2025-03-11 01:54:55.040709	2025-03-11 01:54:55.040709
14232	2380	7	FALSE	2025-03-11 01:54:55.10674	2025-03-11 01:54:55.10674
14233	2380	8	null	2025-03-11 01:54:55.172646	2025-03-11 01:54:55.172646
14234	2380	9	null	2025-03-11 01:54:55.238576	2025-03-11 01:54:55.238576
14235	2381	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:55.37061	2025-03-11 01:54:55.37061
14236	2381	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:55.436525	2025-03-11 01:54:55.436525
14237	2381	6	null	2025-03-11 01:54:55.502924	2025-03-11 01:54:55.502924
14238	2381	7	FALSE	2025-03-11 01:54:55.568944	2025-03-11 01:54:55.568944
14239	2381	8	null	2025-03-11 01:54:55.634816	2025-03-11 01:54:55.634816
14240	2381	9	null	2025-03-11 01:54:55.700701	2025-03-11 01:54:55.700701
14241	2382	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:54:55.834033	2025-03-11 01:54:55.834033
14242	2382	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:54:55.899811	2025-03-11 01:54:55.899811
14243	2382	6	null	2025-03-11 01:54:55.965468	2025-03-11 01:54:55.965468
14244	2382	7	FALSE	2025-03-11 01:54:56.033786	2025-03-11 01:54:56.033786
14245	2382	8	null	2025-03-11 01:54:56.100218	2025-03-11 01:54:56.100218
14246	2382	9	null	2025-03-11 01:54:56.166744	2025-03-11 01:54:56.166744
14247	2383	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:56.298829	2025-03-11 01:54:56.298829
14248	2383	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:56.36469	2025-03-11 01:54:56.36469
14249	2383	6	null	2025-03-11 01:54:56.430813	2025-03-11 01:54:56.430813
14250	2383	7	FALSE	2025-03-11 01:54:56.496743	2025-03-11 01:54:56.496743
14251	2383	8	null	2025-03-11 01:54:56.562709	2025-03-11 01:54:56.562709
14252	2383	9	null	2025-03-11 01:54:56.629537	2025-03-11 01:54:56.629537
14253	2384	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:54:56.762279	2025-03-11 01:54:56.762279
14254	2384	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:54:56.828162	2025-03-11 01:54:56.828162
14255	2384	6	null	2025-03-11 01:54:56.894411	2025-03-11 01:54:56.894411
14256	2384	7	TRUE	2025-03-11 01:54:56.959617	2025-03-11 01:54:56.959617
14257	2384	8	null	2025-03-11 01:54:57.025778	2025-03-11 01:54:57.025778
14258	2384	9	null	2025-03-11 01:54:57.091856	2025-03-11 01:54:57.091856
14259	2385	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:54:57.223324	2025-03-11 01:54:57.223324
14260	2385	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:54:57.289301	2025-03-11 01:54:57.289301
14261	2385	6	null	2025-03-11 01:54:57.355136	2025-03-11 01:54:57.355136
14262	2385	7	FALSE	2025-03-11 01:54:57.427953	2025-03-11 01:54:57.427953
14263	2385	8	null	2025-03-11 01:54:57.4939	2025-03-11 01:54:57.4939
14264	2385	9	null	2025-03-11 01:54:57.559686	2025-03-11 01:54:57.559686
14265	2386	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:54:57.69232	2025-03-11 01:54:57.69232
14266	2386	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:54:57.758282	2025-03-11 01:54:57.758282
14267	2386	6	null	2025-03-11 01:54:57.82396	2025-03-11 01:54:57.82396
14268	2386	7	FALSE	2025-03-11 01:54:57.890196	2025-03-11 01:54:57.890196
14269	2386	8	null	2025-03-11 01:54:57.955874	2025-03-11 01:54:57.955874
14270	2386	9	null	2025-03-11 01:54:58.022352	2025-03-11 01:54:58.022352
14271	2387	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:54:58.154007	2025-03-11 01:54:58.154007
14272	2387	5	8dba42adbc5c2aac3e57c03564124545	2025-03-11 01:54:58.21984	2025-03-11 01:54:58.21984
14273	2387	6	null	2025-03-11 01:54:58.285824	2025-03-11 01:54:58.285824
14274	2387	7	TRUE	2025-03-11 01:54:58.351586	2025-03-11 01:54:58.351586
14275	2387	8	null	2025-03-11 01:54:58.417339	2025-03-11 01:54:58.417339
14276	2387	9	null	2025-03-11 01:54:58.483014	2025-03-11 01:54:58.483014
14277	2388	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:54:58.614897	2025-03-11 01:54:58.614897
14278	2388	5	8dba42adbc5c2aac3e57c03564124545	2025-03-11 01:54:58.680582	2025-03-11 01:54:58.680582
14279	2388	6	null	2025-03-11 01:54:58.746539	2025-03-11 01:54:58.746539
14280	2388	7	FALSE	2025-03-11 01:54:58.812663	2025-03-11 01:54:58.812663
14281	2388	8	null	2025-03-11 01:54:58.878628	2025-03-11 01:54:58.878628
14282	2388	9	null	2025-03-11 01:54:58.944947	2025-03-11 01:54:58.944947
14283	2389	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:54:59.077255	2025-03-11 01:54:59.077255
14284	2389	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:54:59.143413	2025-03-11 01:54:59.143413
14285	2389	6	null	2025-03-11 01:54:59.209177	2025-03-11 01:54:59.209177
14286	2389	7	FALSE	2025-03-11 01:54:59.274908	2025-03-11 01:54:59.274908
14287	2389	8	null	2025-03-11 01:54:59.340837	2025-03-11 01:54:59.340837
14288	2389	9	null	2025-03-11 01:54:59.406811	2025-03-11 01:54:59.406811
14289	2390	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:54:59.53885	2025-03-11 01:54:59.53885
14290	2390	5	8dba42adbc5c2aac3e57c03564124545	2025-03-11 01:54:59.605846	2025-03-11 01:54:59.605846
14291	2390	6	null	2025-03-11 01:54:59.673369	2025-03-11 01:54:59.673369
14292	2390	7	FALSE	2025-03-11 01:54:59.744038	2025-03-11 01:54:59.744038
14293	2390	8	null	2025-03-11 01:54:59.810749	2025-03-11 01:54:59.810749
14294	2390	9	null	2025-03-11 01:54:59.879176	2025-03-11 01:54:59.879176
14295	2391	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:00.010979	2025-03-11 01:55:00.010979
14296	2391	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:55:00.076897	2025-03-11 01:55:00.076897
14297	2391	6	null	2025-03-11 01:55:00.142669	2025-03-11 01:55:00.142669
14298	2391	7	FALSE	2025-03-11 01:55:00.208662	2025-03-11 01:55:00.208662
14299	2391	8	null	2025-03-11 01:55:00.274583	2025-03-11 01:55:00.274583
14300	2391	9	null	2025-03-11 01:55:00.340496	2025-03-11 01:55:00.340496
14301	2392	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:00.471548	2025-03-11 01:55:00.471548
14302	2392	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:55:00.538834	2025-03-11 01:55:00.538834
14303	2392	6	null	2025-03-11 01:55:00.605208	2025-03-11 01:55:00.605208
14304	2392	7	FALSE	2025-03-11 01:55:00.671386	2025-03-11 01:55:00.671386
14305	2392	8	null	2025-03-11 01:55:00.737258	2025-03-11 01:55:00.737258
14306	2392	9	null	2025-03-11 01:55:00.803536	2025-03-11 01:55:00.803536
14307	2393	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:00.934854	2025-03-11 01:55:00.934854
14308	2393	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:55:01.000903	2025-03-11 01:55:01.000903
14309	2393	6	null	2025-03-11 01:55:01.071191	2025-03-11 01:55:01.071191
14310	2393	7	FALSE	2025-03-11 01:55:01.137274	2025-03-11 01:55:01.137274
14311	2393	8	null	2025-03-11 01:55:01.203313	2025-03-11 01:55:01.203313
14312	2393	9	null	2025-03-11 01:55:01.269038	2025-03-11 01:55:01.269038
14313	2394	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:01.400726	2025-03-11 01:55:01.400726
14314	2394	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:01.46724	2025-03-11 01:55:01.46724
14315	2394	6	null	2025-03-11 01:55:01.533693	2025-03-11 01:55:01.533693
14316	2394	7	FALSE	2025-03-11 01:55:01.599648	2025-03-11 01:55:01.599648
14317	2394	8	null	2025-03-11 01:55:01.665345	2025-03-11 01:55:01.665345
14318	2394	9	null	2025-03-11 01:55:01.731924	2025-03-11 01:55:01.731924
14319	2395	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:01.863872	2025-03-11 01:55:01.863872
14320	2395	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:01.929806	2025-03-11 01:55:01.929806
14321	2395	6	null	2025-03-11 01:55:01.996013	2025-03-11 01:55:01.996013
14322	2395	7	FALSE	2025-03-11 01:55:02.061972	2025-03-11 01:55:02.061972
14323	2395	8	null	2025-03-11 01:55:02.129016	2025-03-11 01:55:02.129016
14324	2395	9	null	2025-03-11 01:55:02.195381	2025-03-11 01:55:02.195381
14325	2396	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:02.328982	2025-03-11 01:55:02.328982
14326	2396	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:02.394988	2025-03-11 01:55:02.394988
14327	2396	6	null	2025-03-11 01:55:02.460457	2025-03-11 01:55:02.460457
14328	2396	7	FALSE	2025-03-11 01:55:02.52627	2025-03-11 01:55:02.52627
14329	2396	8	null	2025-03-11 01:55:02.596586	2025-03-11 01:55:02.596586
14330	2396	9	null	2025-03-11 01:55:02.66368	2025-03-11 01:55:02.66368
14331	2397	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:02.796537	2025-03-11 01:55:02.796537
14332	2397	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:02.864654	2025-03-11 01:55:02.864654
14333	2397	6	null	2025-03-11 01:55:02.932893	2025-03-11 01:55:02.932893
14334	2397	7	FALSE	2025-03-11 01:55:02.999106	2025-03-11 01:55:02.999106
14335	2397	8	null	2025-03-11 01:55:03.064972	2025-03-11 01:55:03.064972
14336	2397	9	null	2025-03-11 01:55:03.131225	2025-03-11 01:55:03.131225
14337	2398	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:03.263485	2025-03-11 01:55:03.263485
14338	2398	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:03.329423	2025-03-11 01:55:03.329423
14339	2398	6	null	2025-03-11 01:55:03.39562	2025-03-11 01:55:03.39562
14340	2398	7	FALSE	2025-03-11 01:55:03.461772	2025-03-11 01:55:03.461772
14341	2398	8	null	2025-03-11 01:55:03.528055	2025-03-11 01:55:03.528055
14342	2398	9	null	2025-03-11 01:55:03.593377	2025-03-11 01:55:03.593377
14343	2399	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:03.726218	2025-03-11 01:55:03.726218
14344	2399	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:03.792098	2025-03-11 01:55:03.792098
14345	2399	6	null	2025-03-11 01:55:03.858134	2025-03-11 01:55:03.858134
14346	2399	7	FALSE	2025-03-11 01:55:03.923969	2025-03-11 01:55:03.923969
14347	2399	8	null	2025-03-11 01:55:03.989904	2025-03-11 01:55:03.989904
14348	2399	9	null	2025-03-11 01:55:04.055601	2025-03-11 01:55:04.055601
14349	2400	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:04.187718	2025-03-11 01:55:04.187718
14350	2400	5	9626bbd88c300cb77b5697e32bd86518	2025-03-11 01:55:04.254099	2025-03-11 01:55:04.254099
14351	2400	6	null	2025-03-11 01:55:04.325579	2025-03-11 01:55:04.325579
14352	2400	7	FALSE	2025-03-11 01:55:04.391606	2025-03-11 01:55:04.391606
14353	2400	8	null	2025-03-11 01:55:04.457529	2025-03-11 01:55:04.457529
14354	2400	9	null	2025-03-11 01:55:04.524793	2025-03-11 01:55:04.524793
14355	2401	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:04.660984	2025-03-11 01:55:04.660984
14356	2401	5	9626bbd88c300cb77b5697e32bd86518	2025-03-11 01:55:04.728644	2025-03-11 01:55:04.728644
14357	2401	6	null	2025-03-11 01:55:04.793785	2025-03-11 01:55:04.793785
14358	2401	7	TRUE	2025-03-11 01:55:04.859528	2025-03-11 01:55:04.859528
14359	2401	8	null	2025-03-11 01:55:04.925748	2025-03-11 01:55:04.925748
14360	2401	9	null	2025-03-11 01:55:04.991619	2025-03-11 01:55:04.991619
14361	2402	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:05.123807	2025-03-11 01:55:05.123807
14362	2402	5	9626bbd88c300cb77b5697e32bd86518	2025-03-11 01:55:05.189519	2025-03-11 01:55:05.189519
14363	2402	6	null	2025-03-11 01:55:05.255224	2025-03-11 01:55:05.255224
14364	2402	7	FALSE	2025-03-11 01:55:05.320965	2025-03-11 01:55:05.320965
14365	2402	8	null	2025-03-11 01:55:05.387949	2025-03-11 01:55:05.387949
14366	2402	9	null	2025-03-11 01:55:05.4537	2025-03-11 01:55:05.4537
14367	2403	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:05.58816	2025-03-11 01:55:05.58816
14368	2403	5	f23737d6936b141a620d01584397b6cb	2025-03-11 01:55:05.655273	2025-03-11 01:55:05.655273
14369	2403	6	null	2025-03-11 01:55:05.721597	2025-03-11 01:55:05.721597
14370	2403	7	FALSE	2025-03-11 01:55:05.786338	2025-03-11 01:55:05.786338
14371	2403	8	null	2025-03-11 01:55:05.851867	2025-03-11 01:55:05.851867
14372	2403	9	null	2025-03-11 01:55:05.917861	2025-03-11 01:55:05.917861
14373	2404	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:06.049889	2025-03-11 01:55:06.049889
14374	2404	5	f23737d6936b141a620d01584397b6cb	2025-03-11 01:55:06.115733	2025-03-11 01:55:06.115733
14375	2404	6	null	2025-03-11 01:55:06.181659	2025-03-11 01:55:06.181659
14376	2404	7	FALSE	2025-03-11 01:55:06.247839	2025-03-11 01:55:06.247839
14377	2404	8	null	2025-03-11 01:55:06.313881	2025-03-11 01:55:06.313881
14378	2404	9	null	2025-03-11 01:55:06.379857	2025-03-11 01:55:06.379857
14379	2405	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:06.511226	2025-03-11 01:55:06.511226
14380	2405	5	f23737d6936b141a620d01584397b6cb	2025-03-11 01:55:06.577423	2025-03-11 01:55:06.577423
14381	2405	6	null	2025-03-11 01:55:06.643272	2025-03-11 01:55:06.643272
14382	2405	7	TRUE	2025-03-11 01:55:06.709024	2025-03-11 01:55:06.709024
14383	2405	8	null	2025-03-11 01:55:06.774803	2025-03-11 01:55:06.774803
14384	2405	9	null	2025-03-11 01:55:06.841275	2025-03-11 01:55:06.841275
14385	2406	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:06.972849	2025-03-11 01:55:06.972849
14386	2406	5	cfcb336f8e3001ab3a64ffef55e44614	2025-03-11 01:55:07.039486	2025-03-11 01:55:07.039486
14387	2406	6	null	2025-03-11 01:55:07.105758	2025-03-11 01:55:07.105758
14388	2406	7	TRUE	2025-03-11 01:55:07.171806	2025-03-11 01:55:07.171806
14389	2406	8	null	2025-03-11 01:55:07.239062	2025-03-11 01:55:07.239062
14390	2406	9	null	2025-03-11 01:55:07.305389	2025-03-11 01:55:07.305389
14391	2407	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:07.437419	2025-03-11 01:55:07.437419
14392	2407	5	cfcb336f8e3001ab3a64ffef55e44614	2025-03-11 01:55:07.50341	2025-03-11 01:55:07.50341
14393	2407	6	null	2025-03-11 01:55:07.56993	2025-03-11 01:55:07.56993
14394	2407	7	FALSE	2025-03-11 01:55:07.636081	2025-03-11 01:55:07.636081
14395	2407	8	null	2025-03-11 01:55:07.701904	2025-03-11 01:55:07.701904
14396	2407	9	null	2025-03-11 01:55:07.768442	2025-03-11 01:55:07.768442
14397	2408	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:07.899894	2025-03-11 01:55:07.899894
14398	2408	5	cfcb336f8e3001ab3a64ffef55e44614	2025-03-11 01:55:07.966756	2025-03-11 01:55:07.966756
14399	2408	6	null	2025-03-11 01:55:08.032919	2025-03-11 01:55:08.032919
14400	2408	7	FALSE	2025-03-11 01:55:08.098813	2025-03-11 01:55:08.098813
14401	2408	8	null	2025-03-11 01:55:08.16527	2025-03-11 01:55:08.16527
14402	2408	9	null	2025-03-11 01:55:08.231079	2025-03-11 01:55:08.231079
14403	2409	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:55:08.36271	2025-03-11 01:55:08.36271
14404	2409	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:55:08.43298	2025-03-11 01:55:08.43298
14405	2409	6	null	2025-03-11 01:55:08.501401	2025-03-11 01:55:08.501401
14406	2409	7	FALSE	2025-03-11 01:55:08.56733	2025-03-11 01:55:08.56733
14407	2409	8	null	2025-03-11 01:55:08.633206	2025-03-11 01:55:08.633206
14408	2409	9	null	2025-03-11 01:55:08.701354	2025-03-11 01:55:08.701354
14409	2410	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:55:08.833636	2025-03-11 01:55:08.833636
14410	2410	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:55:08.901531	2025-03-11 01:55:08.901531
14411	2410	6	null	2025-03-11 01:55:08.968867	2025-03-11 01:55:08.968867
14412	2410	7	TRUE	2025-03-11 01:55:09.035586	2025-03-11 01:55:09.035586
14413	2410	8	null	2025-03-11 01:55:09.105112	2025-03-11 01:55:09.105112
14414	2410	9	null	2025-03-11 01:55:09.177108	2025-03-11 01:55:09.177108
14415	2411	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:55:09.308942	2025-03-11 01:55:09.308942
14416	2411	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:55:09.378523	2025-03-11 01:55:09.378523
14417	2411	6	null	2025-03-11 01:55:09.444897	2025-03-11 01:55:09.444897
14418	2411	7	FALSE	2025-03-11 01:55:09.510711	2025-03-11 01:55:09.510711
14419	2411	8	null	2025-03-11 01:55:09.576526	2025-03-11 01:55:09.576526
14420	2411	9	null	2025-03-11 01:55:09.642209	2025-03-11 01:55:09.642209
14421	2412	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:09.781778	2025-03-11 01:55:09.781778
14422	2412	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:09.847794	2025-03-11 01:55:09.847794
14423	2412	6	null	2025-03-11 01:55:09.914196	2025-03-11 01:55:09.914196
14424	2412	7	TRUE	2025-03-11 01:55:09.980048	2025-03-11 01:55:09.980048
14425	2412	8	null	2025-03-11 01:55:10.045957	2025-03-11 01:55:10.045957
14426	2412	9	null	2025-03-11 01:55:10.111472	2025-03-11 01:55:10.111472
14427	2413	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:55:10.245361	2025-03-11 01:55:10.245361
14428	2413	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:55:10.311395	2025-03-11 01:55:10.311395
14429	2413	6	null	2025-03-11 01:55:10.377336	2025-03-11 01:55:10.377336
14430	2413	7	TRUE	2025-03-11 01:55:10.443173	2025-03-11 01:55:10.443173
14431	2413	8	null	2025-03-11 01:55:10.509116	2025-03-11 01:55:10.509116
14432	2413	9	null	2025-03-11 01:55:10.574903	2025-03-11 01:55:10.574903
14433	2414	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:10.708371	2025-03-11 01:55:10.708371
14434	2414	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:10.774589	2025-03-11 01:55:10.774589
14435	2414	6	null	2025-03-11 01:55:10.842144	2025-03-11 01:55:10.842144
14436	2414	7	FALSE	2025-03-11 01:55:10.913031	2025-03-11 01:55:10.913031
14437	2414	8	null	2025-03-11 01:55:10.981123	2025-03-11 01:55:10.981123
14438	2414	9	null	2025-03-11 01:55:11.04707	2025-03-11 01:55:11.04707
14439	2415	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:11.181035	2025-03-11 01:55:11.181035
14440	2415	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:11.247051	2025-03-11 01:55:11.247051
14441	2415	6	null	2025-03-11 01:55:11.313969	2025-03-11 01:55:11.313969
14442	2415	7	FALSE	2025-03-11 01:55:11.386054	2025-03-11 01:55:11.386054
14443	2415	8	null	2025-03-11 01:55:11.451829	2025-03-11 01:55:11.451829
14444	2415	9	null	2025-03-11 01:55:11.517768	2025-03-11 01:55:11.517768
14445	2416	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:11.650501	2025-03-11 01:55:11.650501
14446	2416	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:11.716535	2025-03-11 01:55:11.716535
14447	2416	6	null	2025-03-11 01:55:11.782818	2025-03-11 01:55:11.782818
14448	2416	7	FALSE	2025-03-11 01:55:11.84878	2025-03-11 01:55:11.84878
14449	2416	8	null	2025-03-11 01:55:11.914718	2025-03-11 01:55:11.914718
14450	2416	9	null	2025-03-11 01:55:11.980921	2025-03-11 01:55:11.980921
14451	2417	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:12.113173	2025-03-11 01:55:12.113173
14452	2417	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:12.179096	2025-03-11 01:55:12.179096
14453	2417	6	null	2025-03-11 01:55:12.244849	2025-03-11 01:55:12.244849
14454	2417	7	FALSE	2025-03-11 01:55:12.310965	2025-03-11 01:55:12.310965
14455	2417	8	null	2025-03-11 01:55:12.376905	2025-03-11 01:55:12.376905
14456	2417	9	null	2025-03-11 01:55:12.442888	2025-03-11 01:55:12.442888
14457	2418	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:12.580265	2025-03-11 01:55:12.580265
14458	2418	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:12.646316	2025-03-11 01:55:12.646316
14459	2418	6	null	2025-03-11 01:55:12.712054	2025-03-11 01:55:12.712054
14460	2418	7	FALSE	2025-03-11 01:55:12.779859	2025-03-11 01:55:12.779859
14461	2418	8	null	2025-03-11 01:55:12.845742	2025-03-11 01:55:12.845742
14462	2418	9	null	2025-03-11 01:55:12.91169	2025-03-11 01:55:12.91169
14463	2419	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:13.044097	2025-03-11 01:55:13.044097
14464	2419	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:13.10993	2025-03-11 01:55:13.10993
14465	2419	6	null	2025-03-11 01:55:13.17565	2025-03-11 01:55:13.17565
14466	2419	7	TRUE	2025-03-11 01:55:13.241978	2025-03-11 01:55:13.241978
14467	2419	8	null	2025-03-11 01:55:13.307765	2025-03-11 01:55:13.307765
14468	2419	9	null	2025-03-11 01:55:13.373906	2025-03-11 01:55:13.373906
14469	2420	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:13.508216	2025-03-11 01:55:13.508216
14470	2420	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:13.574922	2025-03-11 01:55:13.574922
14471	2420	6	null	2025-03-11 01:55:13.640783	2025-03-11 01:55:13.640783
14472	2420	7	FALSE	2025-03-11 01:55:13.706975	2025-03-11 01:55:13.706975
14473	2420	8	null	2025-03-11 01:55:13.772771	2025-03-11 01:55:13.772771
14474	2420	9	null	2025-03-11 01:55:13.838747	2025-03-11 01:55:13.838747
14475	2421	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:55:13.970571	2025-03-11 01:55:13.970571
14476	2421	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:14.036334	2025-03-11 01:55:14.036334
14477	2421	6	null	2025-03-11 01:55:14.102259	2025-03-11 01:55:14.102259
14478	2421	7	TRUE	2025-03-11 01:55:14.168229	2025-03-11 01:55:14.168229
14479	2421	8	null	2025-03-11 01:55:14.234616	2025-03-11 01:55:14.234616
14480	2421	9	null	2025-03-11 01:55:14.3015	2025-03-11 01:55:14.3015
14481	2422	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:55:14.433302	2025-03-11 01:55:14.433302
14482	2422	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:14.499638	2025-03-11 01:55:14.499638
14483	2422	6	null	2025-03-11 01:55:14.565655	2025-03-11 01:55:14.565655
14484	2422	7	TRUE	2025-03-11 01:55:14.63232	2025-03-11 01:55:14.63232
14485	2422	8	null	2025-03-11 01:55:14.698648	2025-03-11 01:55:14.698648
14486	2422	9	null	2025-03-11 01:55:14.764491	2025-03-11 01:55:14.764491
14487	2423	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:14.899272	2025-03-11 01:55:14.899272
14488	2423	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:14.965674	2025-03-11 01:55:14.965674
14489	2423	6	null	2025-03-11 01:55:15.033068	2025-03-11 01:55:15.033068
14490	2423	7	TRUE	2025-03-11 01:55:15.09913	2025-03-11 01:55:15.09913
14491	2423	8	null	2025-03-11 01:55:15.167343	2025-03-11 01:55:15.167343
14492	2423	9	null	2025-03-11 01:55:15.233385	2025-03-11 01:55:15.233385
14493	2424	4	000e03e7bf24ac1915212b0467218ec9	2025-03-11 01:55:15.370683	2025-03-11 01:55:15.370683
14494	2424	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:15.437932	2025-03-11 01:55:15.437932
14495	2424	6	null	2025-03-11 01:55:15.504355	2025-03-11 01:55:15.504355
14496	2424	7	FALSE	2025-03-11 01:55:15.574887	2025-03-11 01:55:15.574887
14497	2424	8	null	2025-03-11 01:55:15.643223	2025-03-11 01:55:15.643223
14498	2424	9	null	2025-03-11 01:55:15.716458	2025-03-11 01:55:15.716458
14499	2425	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:55:15.852181	2025-03-11 01:55:15.852181
14500	2425	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:15.92098	2025-03-11 01:55:15.92098
14501	2425	6	null	2025-03-11 01:55:15.987077	2025-03-11 01:55:15.987077
14502	2425	7	FALSE	2025-03-11 01:55:16.053384	2025-03-11 01:55:16.053384
14503	2425	8	null	2025-03-11 01:55:16.11837	2025-03-11 01:55:16.11837
14504	2425	9	null	2025-03-11 01:55:16.1854	2025-03-11 01:55:16.1854
14505	2426	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:16.317209	2025-03-11 01:55:16.317209
14506	2426	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:16.382921	2025-03-11 01:55:16.382921
14507	2426	6	null	2025-03-11 01:55:16.448875	2025-03-11 01:55:16.448875
14508	2426	7	FALSE	2025-03-11 01:55:16.515095	2025-03-11 01:55:16.515095
14509	2426	8	null	2025-03-11 01:55:16.581176	2025-03-11 01:55:16.581176
14510	2426	9	null	2025-03-11 01:55:16.647152	2025-03-11 01:55:16.647152
14511	2427	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:16.779694	2025-03-11 01:55:16.779694
14512	2427	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:16.845423	2025-03-11 01:55:16.845423
14513	2427	6	null	2025-03-11 01:55:16.910419	2025-03-11 01:55:16.910419
14514	2427	7	FALSE	2025-03-11 01:55:16.976347	2025-03-11 01:55:16.976347
14515	2427	8	null	2025-03-11 01:55:17.05098	2025-03-11 01:55:17.05098
14516	2427	9	null	2025-03-11 01:55:17.117059	2025-03-11 01:55:17.117059
14517	2428	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:55:17.249057	2025-03-11 01:55:17.249057
14518	2428	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:17.314878	2025-03-11 01:55:17.314878
14519	2428	6	null	2025-03-11 01:55:17.38106	2025-03-11 01:55:17.38106
14520	2428	7	FALSE	2025-03-11 01:55:17.446836	2025-03-11 01:55:17.446836
14521	2428	8	null	2025-03-11 01:55:17.512818	2025-03-11 01:55:17.512818
14522	2428	9	null	2025-03-11 01:55:17.578671	2025-03-11 01:55:17.578671
14523	2429	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:17.711347	2025-03-11 01:55:17.711347
14524	2429	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:17.777364	2025-03-11 01:55:17.777364
14525	2429	6	null	2025-03-11 01:55:17.843228	2025-03-11 01:55:17.843228
14526	2429	7	FALSE	2025-03-11 01:55:17.909147	2025-03-11 01:55:17.909147
14527	2429	8	null	2025-03-11 01:55:17.975688	2025-03-11 01:55:17.975688
14528	2429	9	null	2025-03-11 01:55:18.043436	2025-03-11 01:55:18.043436
14529	2430	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:55:18.175803	2025-03-11 01:55:18.175803
14530	2430	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:18.242368	2025-03-11 01:55:18.242368
14531	2430	6	null	2025-03-11 01:55:18.309617	2025-03-11 01:55:18.309617
14532	2430	7	FALSE	2025-03-11 01:55:18.376304	2025-03-11 01:55:18.376304
14533	2430	8	null	2025-03-11 01:55:18.442084	2025-03-11 01:55:18.442084
14534	2430	9	null	2025-03-11 01:55:18.508133	2025-03-11 01:55:18.508133
14535	2431	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:18.640262	2025-03-11 01:55:18.640262
14536	2431	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:18.706162	2025-03-11 01:55:18.706162
14537	2431	6	null	2025-03-11 01:55:18.776528	2025-03-11 01:55:18.776528
14538	2431	7	FALSE	2025-03-11 01:55:18.844877	2025-03-11 01:55:18.844877
14539	2431	8	null	2025-03-11 01:55:18.911612	2025-03-11 01:55:18.911612
14540	2431	9	null	2025-03-11 01:55:18.977583	2025-03-11 01:55:18.977583
14541	2432	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:19.109367	2025-03-11 01:55:19.109367
14542	2432	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:19.175278	2025-03-11 01:55:19.175278
14543	2432	6	null	2025-03-11 01:55:19.241121	2025-03-11 01:55:19.241121
14544	2432	7	TRUE	2025-03-11 01:55:19.308135	2025-03-11 01:55:19.308135
14545	2432	8	null	2025-03-11 01:55:19.374053	2025-03-11 01:55:19.374053
14546	2432	9	null	2025-03-11 01:55:19.440074	2025-03-11 01:55:19.440074
14547	2433	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:55:19.572183	2025-03-11 01:55:19.572183
14548	2433	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:19.643397	2025-03-11 01:55:19.643397
14549	2433	6	null	2025-03-11 01:55:19.709729	2025-03-11 01:55:19.709729
14550	2433	7	FALSE	2025-03-11 01:55:19.776197	2025-03-11 01:55:19.776197
14551	2433	8	null	2025-03-11 01:55:19.84207	2025-03-11 01:55:19.84207
14552	2433	9	null	2025-03-11 01:55:19.907851	2025-03-11 01:55:19.907851
14553	2434	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:55:20.040056	2025-03-11 01:55:20.040056
14554	2434	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:20.106176	2025-03-11 01:55:20.106176
14555	2434	6	null	2025-03-11 01:55:20.172139	2025-03-11 01:55:20.172139
14556	2434	7	FALSE	2025-03-11 01:55:20.238254	2025-03-11 01:55:20.238254
14557	2434	8	null	2025-03-11 01:55:20.304313	2025-03-11 01:55:20.304313
14558	2434	9	null	2025-03-11 01:55:20.370218	2025-03-11 01:55:20.370218
14559	2435	4	66aba5325027ecf2e633272fd33574f8	2025-03-11 01:55:20.50302	2025-03-11 01:55:20.50302
14560	2435	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:20.568821	2025-03-11 01:55:20.568821
14561	2435	6	null	2025-03-11 01:55:20.634795	2025-03-11 01:55:20.634795
14562	2435	7	FALSE	2025-03-11 01:55:20.700729	2025-03-11 01:55:20.700729
14563	2435	8	null	2025-03-11 01:55:20.766845	2025-03-11 01:55:20.766845
14564	2435	9	null	2025-03-11 01:55:20.834463	2025-03-11 01:55:20.834463
14565	2436	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:20.966468	2025-03-11 01:55:20.966468
14566	2436	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:21.031895	2025-03-11 01:55:21.031895
14567	2436	6	null	2025-03-11 01:55:21.097856	2025-03-11 01:55:21.097856
14568	2436	7	FALSE	2025-03-11 01:55:21.163866	2025-03-11 01:55:21.163866
14569	2436	8	null	2025-03-11 01:55:21.230698	2025-03-11 01:55:21.230698
14570	2436	9	null	2025-03-11 01:55:21.296724	2025-03-11 01:55:21.296724
14571	2437	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:21.42891	2025-03-11 01:55:21.42891
14572	2437	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:21.496045	2025-03-11 01:55:21.496045
14573	2437	6	null	2025-03-11 01:55:21.561955	2025-03-11 01:55:21.561955
14574	2437	7	FALSE	2025-03-11 01:55:21.628252	2025-03-11 01:55:21.628252
14575	2437	8	null	2025-03-11 01:55:21.694195	2025-03-11 01:55:21.694195
14576	2437	9	null	2025-03-11 01:55:21.760482	2025-03-11 01:55:21.760482
14577	2438	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:21.895262	2025-03-11 01:55:21.895262
14578	2438	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:21.96128	2025-03-11 01:55:21.96128
14579	2438	6	null	2025-03-11 01:55:22.027184	2025-03-11 01:55:22.027184
14580	2438	7	FALSE	2025-03-11 01:55:22.098157	2025-03-11 01:55:22.098157
14581	2438	8	null	2025-03-11 01:55:22.16401	2025-03-11 01:55:22.16401
14582	2438	9	null	2025-03-11 01:55:22.233026	2025-03-11 01:55:22.233026
14583	2439	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:55:22.365315	2025-03-11 01:55:22.365315
14584	2439	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:22.431392	2025-03-11 01:55:22.431392
14585	2439	6	null	2025-03-11 01:55:22.497337	2025-03-11 01:55:22.497337
14586	2439	7	TRUE	2025-03-11 01:55:22.562398	2025-03-11 01:55:22.562398
14587	2439	8	null	2025-03-11 01:55:22.628529	2025-03-11 01:55:22.628529
14588	2439	9	null	2025-03-11 01:55:22.694335	2025-03-11 01:55:22.694335
14589	2440	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:55:22.825866	2025-03-11 01:55:22.825866
14590	2440	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:22.892289	2025-03-11 01:55:22.892289
14591	2440	6	null	2025-03-11 01:55:22.958171	2025-03-11 01:55:22.958171
14592	2440	7	TRUE	2025-03-11 01:55:23.023591	2025-03-11 01:55:23.023591
14593	2440	8	null	2025-03-11 01:55:23.089596	2025-03-11 01:55:23.089596
14594	2440	9	null	2025-03-11 01:55:23.155322	2025-03-11 01:55:23.155322
14595	2441	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:55:23.297137	2025-03-11 01:55:23.297137
14596	2441	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:23.362926	2025-03-11 01:55:23.362926
14597	2441	6	null	2025-03-11 01:55:23.42886	2025-03-11 01:55:23.42886
14598	2441	7	FALSE	2025-03-11 01:55:23.495061	2025-03-11 01:55:23.495061
14599	2441	8	null	2025-03-11 01:55:23.560848	2025-03-11 01:55:23.560848
14600	2441	9	null	2025-03-11 01:55:23.626784	2025-03-11 01:55:23.626784
14601	2442	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:23.759467	2025-03-11 01:55:23.759467
14602	2442	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:23.825952	2025-03-11 01:55:23.825952
14603	2442	6	null	2025-03-11 01:55:23.892597	2025-03-11 01:55:23.892597
14604	2442	7	FALSE	2025-03-11 01:55:23.959609	2025-03-11 01:55:23.959609
14605	2442	8	null	2025-03-11 01:55:24.025509	2025-03-11 01:55:24.025509
14606	2442	9	null	2025-03-11 01:55:24.090354	2025-03-11 01:55:24.090354
14607	2443	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:24.222017	2025-03-11 01:55:24.222017
14608	2443	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:24.288542	2025-03-11 01:55:24.288542
14609	2443	6	null	2025-03-11 01:55:24.354414	2025-03-11 01:55:24.354414
14610	2443	7	FALSE	2025-03-11 01:55:24.419427	2025-03-11 01:55:24.419427
14611	2443	8	null	2025-03-11 01:55:24.485509	2025-03-11 01:55:24.485509
14612	2443	9	null	2025-03-11 01:55:24.550297	2025-03-11 01:55:24.550297
14613	2444	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:24.683131	2025-03-11 01:55:24.683131
14614	2444	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:24.753089	2025-03-11 01:55:24.753089
14615	2444	6	null	2025-03-11 01:55:24.822493	2025-03-11 01:55:24.822493
14616	2444	7	FALSE	2025-03-11 01:55:24.888799	2025-03-11 01:55:24.888799
14617	2444	8	null	2025-03-11 01:55:24.95486	2025-03-11 01:55:24.95486
14618	2444	9	null	2025-03-11 01:55:25.021251	2025-03-11 01:55:25.021251
14619	2445	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:55:25.152414	2025-03-11 01:55:25.152414
14620	2445	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:25.218521	2025-03-11 01:55:25.218521
14621	2445	6	null	2025-03-11 01:55:25.284512	2025-03-11 01:55:25.284512
14622	2445	7	TRUE	2025-03-11 01:55:25.351882	2025-03-11 01:55:25.351882
14623	2445	8	null	2025-03-11 01:55:25.418205	2025-03-11 01:55:25.418205
14624	2445	9	null	2025-03-11 01:55:25.484164	2025-03-11 01:55:25.484164
14625	2446	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:55:25.616142	2025-03-11 01:55:25.616142
14626	2446	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:25.682439	2025-03-11 01:55:25.682439
14627	2446	6	null	2025-03-11 01:55:25.74872	2025-03-11 01:55:25.74872
14628	2446	7	FALSE	2025-03-11 01:55:25.816313	2025-03-11 01:55:25.816313
14629	2446	8	null	2025-03-11 01:55:25.881508	2025-03-11 01:55:25.881508
14630	2446	9	null	2025-03-11 01:55:25.947332	2025-03-11 01:55:25.947332
14631	2447	4	a9cc1c3f4198913e5138005cbb4f46ba	2025-03-11 01:55:26.079019	2025-03-11 01:55:26.079019
14632	2447	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:26.145241	2025-03-11 01:55:26.145241
14633	2447	6	null	2025-03-11 01:55:26.212472	2025-03-11 01:55:26.212472
14634	2447	7	TRUE	2025-03-11 01:55:26.278576	2025-03-11 01:55:26.278576
14635	2447	8	null	2025-03-11 01:55:26.344686	2025-03-11 01:55:26.344686
14636	2447	9	null	2025-03-11 01:55:26.410614	2025-03-11 01:55:26.410614
14637	2448	4	66aba5325027ecf2e633272fd33574f8	2025-03-11 01:55:26.542863	2025-03-11 01:55:26.542863
14638	2448	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:26.608817	2025-03-11 01:55:26.608817
14639	2448	6	null	2025-03-11 01:55:26.674687	2025-03-11 01:55:26.674687
14640	2448	7	FALSE	2025-03-11 01:55:26.74069	2025-03-11 01:55:26.74069
14641	2448	8	null	2025-03-11 01:55:26.806475	2025-03-11 01:55:26.806475
14642	2448	9	null	2025-03-11 01:55:26.872307	2025-03-11 01:55:26.872307
14643	2449	4	579e1e6c289e88784a31cbfbcd5e2f4e	2025-03-11 01:55:27.003669	2025-03-11 01:55:27.003669
14644	2449	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:27.06966	2025-03-11 01:55:27.06966
14645	2449	6	null	2025-03-11 01:55:27.135653	2025-03-11 01:55:27.135653
14646	2449	7	FALSE	2025-03-11 01:55:27.201563	2025-03-11 01:55:27.201563
14647	2449	8	null	2025-03-11 01:55:27.267448	2025-03-11 01:55:27.267448
14648	2449	9	null	2025-03-11 01:55:27.333666	2025-03-11 01:55:27.333666
14649	2450	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:55:27.465336	2025-03-11 01:55:27.465336
14650	2450	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:27.531224	2025-03-11 01:55:27.531224
14651	2450	6	null	2025-03-11 01:55:27.598033	2025-03-11 01:55:27.598033
14652	2450	7	FALSE	2025-03-11 01:55:27.665644	2025-03-11 01:55:27.665644
14653	2450	8	null	2025-03-11 01:55:27.733473	2025-03-11 01:55:27.733473
14654	2450	9	null	2025-03-11 01:55:27.799448	2025-03-11 01:55:27.799448
14655	2451	4	72d3c570e7cf57267a69ae2d5ad64d95	2025-03-11 01:55:27.937639	2025-03-11 01:55:27.937639
14656	2451	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:28.007349	2025-03-11 01:55:28.007349
14657	2451	6	null	2025-03-11 01:55:28.07352	2025-03-11 01:55:28.07352
14658	2451	7	FALSE	2025-03-11 01:55:28.13941	2025-03-11 01:55:28.13941
14659	2451	8	null	2025-03-11 01:55:28.208184	2025-03-11 01:55:28.208184
14660	2451	9	null	2025-03-11 01:55:28.276605	2025-03-11 01:55:28.276605
14661	2452	4	72d3c570e7cf57267a69ae2d5ad64d95	2025-03-11 01:55:28.408302	2025-03-11 01:55:28.408302
14662	2452	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:28.479766	2025-03-11 01:55:28.479766
14663	2452	6	null	2025-03-11 01:55:28.551991	2025-03-11 01:55:28.551991
14664	2452	7	FALSE	2025-03-11 01:55:28.61793	2025-03-11 01:55:28.61793
14665	2452	8	null	2025-03-11 01:55:28.684413	2025-03-11 01:55:28.684413
14666	2452	9	null	2025-03-11 01:55:28.750183	2025-03-11 01:55:28.750183
14667	2453	4	72d3c570e7cf57267a69ae2d5ad64d95	2025-03-11 01:55:28.882071	2025-03-11 01:55:28.882071
14668	2453	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:28.948144	2025-03-11 01:55:28.948144
14669	2453	6	null	2025-03-11 01:55:29.013909	2025-03-11 01:55:29.013909
14670	2453	7	FALSE	2025-03-11 01:55:29.079976	2025-03-11 01:55:29.079976
14671	2453	8	null	2025-03-11 01:55:29.146424	2025-03-11 01:55:29.146424
14672	2453	9	null	2025-03-11 01:55:29.217222	2025-03-11 01:55:29.217222
14673	2454	4	72d3c570e7cf57267a69ae2d5ad64d95	2025-03-11 01:55:29.348981	2025-03-11 01:55:29.348981
14674	2454	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:29.414983	2025-03-11 01:55:29.414983
14675	2454	6	null	2025-03-11 01:55:29.481459	2025-03-11 01:55:29.481459
14676	2454	7	TRUE	2025-03-11 01:55:29.546326	2025-03-11 01:55:29.546326
14677	2454	8	null	2025-03-11 01:55:29.611948	2025-03-11 01:55:29.611948
14678	2454	9	null	2025-03-11 01:55:29.677973	2025-03-11 01:55:29.677973
14679	2455	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:55:29.814622	2025-03-11 01:55:29.814622
14680	2455	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:29.880695	2025-03-11 01:55:29.880695
14681	2455	6	null	2025-03-11 01:55:29.946754	2025-03-11 01:55:29.946754
14682	2455	7	FALSE	2025-03-11 01:55:30.015268	2025-03-11 01:55:30.015268
14683	2455	8	null	2025-03-11 01:55:30.083106	2025-03-11 01:55:30.083106
14684	2455	9	null	2025-03-11 01:55:30.149096	2025-03-11 01:55:30.149096
14685	2456	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:55:30.281232	2025-03-11 01:55:30.281232
14686	2456	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:30.347328	2025-03-11 01:55:30.347328
14687	2456	6	null	2025-03-11 01:55:30.413208	2025-03-11 01:55:30.413208
14688	2456	7	FALSE	2025-03-11 01:55:30.480646	2025-03-11 01:55:30.480646
14689	2456	8	null	2025-03-11 01:55:30.548136	2025-03-11 01:55:30.548136
14690	2456	9	null	2025-03-11 01:55:30.614004	2025-03-11 01:55:30.614004
14691	2457	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:55:30.74631	2025-03-11 01:55:30.74631
14692	2457	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:30.813208	2025-03-11 01:55:30.813208
14693	2457	6	null	2025-03-11 01:55:30.879119	2025-03-11 01:55:30.879119
14694	2457	7	FALSE	2025-03-11 01:55:30.954805	2025-03-11 01:55:30.954805
14695	2457	8	null	2025-03-11 01:55:31.020565	2025-03-11 01:55:31.020565
14696	2457	9	null	2025-03-11 01:55:31.086449	2025-03-11 01:55:31.086449
14697	2458	4	66c00d9da45fe83e335fe79e8a32638d	2025-03-11 01:55:31.218568	2025-03-11 01:55:31.218568
14698	2458	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:31.284357	2025-03-11 01:55:31.284357
14699	2458	6	null	2025-03-11 01:55:31.350025	2025-03-11 01:55:31.350025
14700	2458	7	FALSE	2025-03-11 01:55:31.415976	2025-03-11 01:55:31.415976
14701	2458	8	null	2025-03-11 01:55:31.482391	2025-03-11 01:55:31.482391
14702	2458	9	null	2025-03-11 01:55:31.548684	2025-03-11 01:55:31.548684
14703	2459	4	66c00d9da45fe83e335fe79e8a32638d	2025-03-11 01:55:31.680802	2025-03-11 01:55:31.680802
14704	2459	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:31.746762	2025-03-11 01:55:31.746762
14705	2459	6	null	2025-03-11 01:55:31.812746	2025-03-11 01:55:31.812746
14706	2459	7	FALSE	2025-03-11 01:55:31.879769	2025-03-11 01:55:31.879769
14707	2459	8	null	2025-03-11 01:55:31.947111	2025-03-11 01:55:31.947111
14708	2459	9	null	2025-03-11 01:55:32.012999	2025-03-11 01:55:32.012999
14709	2460	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:55:32.144544	2025-03-11 01:55:32.144544
14710	2460	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:32.210543	2025-03-11 01:55:32.210543
14711	2460	6	null	2025-03-11 01:55:32.275375	2025-03-11 01:55:32.275375
14712	2460	7	TRUE	2025-03-11 01:55:32.341686	2025-03-11 01:55:32.341686
14713	2460	8	null	2025-03-11 01:55:32.408184	2025-03-11 01:55:32.408184
14714	2460	9	null	2025-03-11 01:55:32.474927	2025-03-11 01:55:32.474927
14715	2461	4	66c00d9da45fe83e335fe79e8a32638d	2025-03-11 01:55:32.63218	2025-03-11 01:55:32.63218
14716	2461	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:32.699374	2025-03-11 01:55:32.699374
14717	2461	6	null	2025-03-11 01:55:32.765963	2025-03-11 01:55:32.765963
14718	2461	7	FALSE	2025-03-11 01:55:32.831948	2025-03-11 01:55:32.831948
14719	2461	8	null	2025-03-11 01:55:32.89774	2025-03-11 01:55:32.89774
14720	2461	9	null	2025-03-11 01:55:32.963556	2025-03-11 01:55:32.963556
14721	2462	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:33.095484	2025-03-11 01:55:33.095484
14722	2462	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:33.161411	2025-03-11 01:55:33.161411
14723	2462	6	null	2025-03-11 01:55:33.227302	2025-03-11 01:55:33.227302
14724	2462	7	FALSE	2025-03-11 01:55:33.293233	2025-03-11 01:55:33.293233
14725	2462	8	null	2025-03-11 01:55:33.358537	2025-03-11 01:55:33.358537
14726	2462	9	null	2025-03-11 01:55:33.423335	2025-03-11 01:55:33.423335
14727	2463	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:33.555444	2025-03-11 01:55:33.555444
14728	2463	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:33.621436	2025-03-11 01:55:33.621436
14729	2463	6	null	2025-03-11 01:55:33.686363	2025-03-11 01:55:33.686363
14730	2463	7	TRUE	2025-03-11 01:55:33.752603	2025-03-11 01:55:33.752603
14731	2463	8	null	2025-03-11 01:55:33.819762	2025-03-11 01:55:33.819762
14732	2463	9	null	2025-03-11 01:55:33.885652	2025-03-11 01:55:33.885652
14733	2464	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:34.017927	2025-03-11 01:55:34.017927
14734	2464	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:34.084194	2025-03-11 01:55:34.084194
14735	2464	6	null	2025-03-11 01:55:34.150611	2025-03-11 01:55:34.150611
14736	2464	7	FALSE	2025-03-11 01:55:34.215385	2025-03-11 01:55:34.215385
14737	2464	8	null	2025-03-11 01:55:34.281171	2025-03-11 01:55:34.281171
14738	2464	9	null	2025-03-11 01:55:34.34766	2025-03-11 01:55:34.34766
14739	2465	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:55:34.47984	2025-03-11 01:55:34.47984
14740	2465	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:34.54606	2025-03-11 01:55:34.54606
14741	2465	6	null	2025-03-11 01:55:34.616945	2025-03-11 01:55:34.616945
14742	2465	7	FALSE	2025-03-11 01:55:34.682702	2025-03-11 01:55:34.682702
14743	2465	8	null	2025-03-11 01:55:34.748943	2025-03-11 01:55:34.748943
14744	2465	9	null	2025-03-11 01:55:34.815464	2025-03-11 01:55:34.815464
14745	2466	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:55:34.946989	2025-03-11 01:55:34.946989
14746	2466	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:55:35.012915	2025-03-11 01:55:35.012915
14747	2466	6	null	2025-03-11 01:55:35.078845	2025-03-11 01:55:35.078845
14748	2466	7	FALSE	2025-03-11 01:55:35.144479	2025-03-11 01:55:35.144479
14749	2466	8	null	2025-03-11 01:55:35.217555	2025-03-11 01:55:35.217555
14750	2466	9	null	2025-03-11 01:55:35.283532	2025-03-11 01:55:35.283532
14751	2467	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:55:35.415621	2025-03-11 01:55:35.415621
14752	2467	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:55:35.480316	2025-03-11 01:55:35.480316
14753	2467	6	null	2025-03-11 01:55:35.545986	2025-03-11 01:55:35.545986
14754	2467	7	FALSE	2025-03-11 01:55:35.611924	2025-03-11 01:55:35.611924
14755	2467	8	null	2025-03-11 01:55:35.677868	2025-03-11 01:55:35.677868
14756	2467	9	null	2025-03-11 01:55:35.743886	2025-03-11 01:55:35.743886
14757	2468	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:55:35.876705	2025-03-11 01:55:35.876705
14758	2468	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:55:35.945467	2025-03-11 01:55:35.945467
14759	2468	6	null	2025-03-11 01:55:36.012668	2025-03-11 01:55:36.012668
14760	2468	7	FALSE	2025-03-11 01:55:36.078612	2025-03-11 01:55:36.078612
14761	2468	8	null	2025-03-11 01:55:36.144675	2025-03-11 01:55:36.144675
14762	2468	9	null	2025-03-11 01:55:36.210603	2025-03-11 01:55:36.210603
14763	2469	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:55:36.342599	2025-03-11 01:55:36.342599
14764	2469	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:55:36.410696	2025-03-11 01:55:36.410696
14765	2469	6	null	2025-03-11 01:55:36.47644	2025-03-11 01:55:36.47644
14766	2469	7	FALSE	2025-03-11 01:55:36.542301	2025-03-11 01:55:36.542301
14767	2469	8	null	2025-03-11 01:55:36.608122	2025-03-11 01:55:36.608122
14768	2469	9	null	2025-03-11 01:55:36.67377	2025-03-11 01:55:36.67377
14769	2470	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:55:36.805973	2025-03-11 01:55:36.805973
14770	2470	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:55:36.872466	2025-03-11 01:55:36.872466
14771	2470	6	null	2025-03-11 01:55:36.938559	2025-03-11 01:55:36.938559
14772	2470	7	TRUE	2025-03-11 01:55:37.00474	2025-03-11 01:55:37.00474
14773	2470	8	null	2025-03-11 01:55:37.071084	2025-03-11 01:55:37.071084
14774	2470	9	null	2025-03-11 01:55:37.137902	2025-03-11 01:55:37.137902
14775	2471	4	28182d35876bad5fef39f13a6398bbbd	2025-03-11 01:55:37.277347	2025-03-11 01:55:37.277347
14776	2471	5	faba2605558da2b45b5c50087298b8bf	2025-03-11 01:55:37.344177	2025-03-11 01:55:37.344177
14777	2471	6	null	2025-03-11 01:55:37.40988	2025-03-11 01:55:37.40988
14778	2471	7	FALSE	2025-03-11 01:55:37.47532	2025-03-11 01:55:37.47532
14779	2471	8	null	2025-03-11 01:55:37.541019	2025-03-11 01:55:37.541019
14780	2471	9	null	2025-03-11 01:55:37.607191	2025-03-11 01:55:37.607191
14781	2472	4	28182d35876bad5fef39f13a6398bbbd	2025-03-11 01:55:37.738825	2025-03-11 01:55:37.738825
14782	2472	5	faba2605558da2b45b5c50087298b8bf	2025-03-11 01:55:37.84681	2025-03-11 01:55:37.84681
14783	2472	6	null	2025-03-11 01:55:37.913214	2025-03-11 01:55:37.913214
14784	2472	7	FALSE	2025-03-11 01:55:37.979071	2025-03-11 01:55:37.979071
14785	2472	8	null	2025-03-11 01:55:38.048078	2025-03-11 01:55:38.048078
14786	2472	9	null	2025-03-11 01:55:38.113965	2025-03-11 01:55:38.113965
14787	2473	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:38.247336	2025-03-11 01:55:38.247336
14788	2473	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:38.313446	2025-03-11 01:55:38.313446
14789	2473	6	null	2025-03-11 01:55:38.379333	2025-03-11 01:55:38.379333
14790	2473	7	FALSE	2025-03-11 01:55:38.445149	2025-03-11 01:55:38.445149
14791	2473	8	null	2025-03-11 01:55:38.511071	2025-03-11 01:55:38.511071
14792	2473	9	null	2025-03-11 01:55:38.576884	2025-03-11 01:55:38.576884
14793	2474	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:38.710061	2025-03-11 01:55:38.710061
14794	2474	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:38.775892	2025-03-11 01:55:38.775892
14795	2474	6	null	2025-03-11 01:55:38.841996	2025-03-11 01:55:38.841996
14796	2474	7	FALSE	2025-03-11 01:55:38.908067	2025-03-11 01:55:38.908067
14797	2474	8	null	2025-03-11 01:55:38.974785	2025-03-11 01:55:38.974785
14798	2474	9	null	2025-03-11 01:55:39.041046	2025-03-11 01:55:39.041046
14799	2475	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:39.173261	2025-03-11 01:55:39.173261
14800	2475	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:39.239337	2025-03-11 01:55:39.239337
14801	2475	6	null	2025-03-11 01:55:39.305585	2025-03-11 01:55:39.305585
14802	2475	7	TRUE	2025-03-11 01:55:39.371162	2025-03-11 01:55:39.371162
14803	2475	8	null	2025-03-11 01:55:39.437337	2025-03-11 01:55:39.437337
14804	2475	9	null	2025-03-11 01:55:39.503143	2025-03-11 01:55:39.503143
14805	2476	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:55:39.635231	2025-03-11 01:55:39.635231
14806	2476	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:39.700559	2025-03-11 01:55:39.700559
14807	2476	6	null	2025-03-11 01:55:39.766596	2025-03-11 01:55:39.766596
14808	2476	7	FALSE	2025-03-11 01:55:39.832747	2025-03-11 01:55:39.832747
14809	2476	8	null	2025-03-11 01:55:39.898536	2025-03-11 01:55:39.898536
14810	2476	9	null	2025-03-11 01:55:39.964738	2025-03-11 01:55:39.964738
14811	2477	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:55:40.097061	2025-03-11 01:55:40.097061
14812	2477	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:40.163901	2025-03-11 01:55:40.163901
14813	2477	6	null	2025-03-11 01:55:40.231314	2025-03-11 01:55:40.231314
14814	2477	7	FALSE	2025-03-11 01:55:40.296582	2025-03-11 01:55:40.296582
14815	2477	8	null	2025-03-11 01:55:40.363157	2025-03-11 01:55:40.363157
14816	2477	9	null	2025-03-11 01:55:40.44205	2025-03-11 01:55:40.44205
14817	2478	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:55:40.576541	2025-03-11 01:55:40.576541
14818	2478	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:40.647092	2025-03-11 01:55:40.647092
14819	2478	6	null	2025-03-11 01:55:40.713211	2025-03-11 01:55:40.713211
14820	2478	7	FALSE	2025-03-11 01:55:40.779013	2025-03-11 01:55:40.779013
14821	2478	8	null	2025-03-11 01:55:40.844988	2025-03-11 01:55:40.844988
14822	2478	9	null	2025-03-11 01:55:40.910751	2025-03-11 01:55:40.910751
14823	2479	4	8ceba0a1da1f5054bc60cb15322869e2	2025-03-11 01:55:41.044531	2025-03-11 01:55:41.044531
14824	2479	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:41.110686	2025-03-11 01:55:41.110686
14825	2479	6	null	2025-03-11 01:55:41.176562	2025-03-11 01:55:41.176562
14826	2479	7	FALSE	2025-03-11 01:55:41.245112	2025-03-11 01:55:41.245112
14827	2479	8	null	2025-03-11 01:55:41.31103	2025-03-11 01:55:41.31103
14828	2479	9	null	2025-03-11 01:55:41.376927	2025-03-11 01:55:41.376927
14829	2480	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:55:41.50869	2025-03-11 01:55:41.50869
14830	2480	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:41.574343	2025-03-11 01:55:41.574343
14831	2480	6	null	2025-03-11 01:55:41.641579	2025-03-11 01:55:41.641579
14832	2480	7	FALSE	2025-03-11 01:55:41.709779	2025-03-11 01:55:41.709779
14833	2480	8	null	2025-03-11 01:55:41.775636	2025-03-11 01:55:41.775636
14834	2480	9	null	2025-03-11 01:55:41.841579	2025-03-11 01:55:41.841579
14835	2481	4	85f0189cbbe20eec6cbb9a1d684d927b	2025-03-11 01:55:41.975155	2025-03-11 01:55:41.975155
14836	2481	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:42.040994	2025-03-11 01:55:42.040994
14837	2481	6	null	2025-03-11 01:55:42.107034	2025-03-11 01:55:42.107034
14838	2481	7	TRUE	2025-03-11 01:55:42.172865	2025-03-11 01:55:42.172865
14839	2481	8	null	2025-03-11 01:55:42.238956	2025-03-11 01:55:42.238956
14840	2481	9	null	2025-03-11 01:55:42.305526	2025-03-11 01:55:42.305526
14841	2482	4	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:55:42.43727	2025-03-11 01:55:42.43727
14842	2482	5	1f00fd9d2bb4257ea543e728c053c430	2025-03-11 01:55:42.503276	2025-03-11 01:55:42.503276
14843	2482	6	null	2025-03-11 01:55:42.569147	2025-03-11 01:55:42.569147
14844	2482	7	TRUE	2025-03-11 01:55:42.634884	2025-03-11 01:55:42.634884
14845	2482	8	null	2025-03-11 01:55:42.700716	2025-03-11 01:55:42.700716
14846	2482	9	null	2025-03-11 01:55:42.766776	2025-03-11 01:55:42.766776
14847	2483	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:42.897539	2025-03-11 01:55:42.897539
14848	2483	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:42.963338	2025-03-11 01:55:42.963338
14849	2483	6	null	2025-03-11 01:55:43.029155	2025-03-11 01:55:43.029155
14850	2483	7	FALSE	2025-03-11 01:55:43.094826	2025-03-11 01:55:43.094826
14851	2483	8	null	2025-03-11 01:55:43.160742	2025-03-11 01:55:43.160742
14852	2483	9	null	2025-03-11 01:55:43.225398	2025-03-11 01:55:43.225398
14853	2484	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:43.357278	2025-03-11 01:55:43.357278
14854	2484	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:55:43.424267	2025-03-11 01:55:43.424267
14855	2484	6	null	2025-03-11 01:55:43.490414	2025-03-11 01:55:43.490414
14856	2484	7	FALSE	2025-03-11 01:55:43.556283	2025-03-11 01:55:43.556283
14857	2484	8	null	2025-03-11 01:55:43.622315	2025-03-11 01:55:43.622315
14858	2484	9	null	2025-03-11 01:55:43.688214	2025-03-11 01:55:43.688214
14859	2485	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:43.819794	2025-03-11 01:55:43.819794
14860	2485	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:43.888509	2025-03-11 01:55:43.888509
14861	2485	6	null	2025-03-11 01:55:43.954501	2025-03-11 01:55:43.954501
14862	2485	7	FALSE	2025-03-11 01:55:44.02494	2025-03-11 01:55:44.02494
14863	2485	8	null	2025-03-11 01:55:44.090861	2025-03-11 01:55:44.090861
14864	2485	9	null	2025-03-11 01:55:44.157265	2025-03-11 01:55:44.157265
14865	2486	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:44.289437	2025-03-11 01:55:44.289437
14866	2486	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:44.355355	2025-03-11 01:55:44.355355
14867	2486	6	null	2025-03-11 01:55:44.421255	2025-03-11 01:55:44.421255
14868	2486	7	FALSE	2025-03-11 01:55:44.487336	2025-03-11 01:55:44.487336
14869	2486	8	null	2025-03-11 01:55:44.553064	2025-03-11 01:55:44.553064
14870	2486	9	null	2025-03-11 01:55:44.619126	2025-03-11 01:55:44.619126
14871	2487	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:44.751336	2025-03-11 01:55:44.751336
14872	2487	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:55:44.817155	2025-03-11 01:55:44.817155
14873	2487	6	null	2025-03-11 01:55:44.885651	2025-03-11 01:55:44.885651
14874	2487	7	TRUE	2025-03-11 01:55:44.951613	2025-03-11 01:55:44.951613
14875	2487	8	null	2025-03-11 01:55:45.017543	2025-03-11 01:55:45.017543
14876	2487	9	null	2025-03-11 01:55:45.085121	2025-03-11 01:55:45.085121
14877	2488	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:45.216415	2025-03-11 01:55:45.216415
14878	2488	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:55:45.282339	2025-03-11 01:55:45.282339
14879	2488	6	null	2025-03-11 01:55:45.348151	2025-03-11 01:55:45.348151
14880	2488	7	FALSE	2025-03-11 01:55:45.41425	2025-03-11 01:55:45.41425
14881	2488	8	null	2025-03-11 01:55:45.480363	2025-03-11 01:55:45.480363
14882	2488	9	null	2025-03-11 01:55:45.546576	2025-03-11 01:55:45.546576
14883	2489	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:45.678637	2025-03-11 01:55:45.678637
14884	2489	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:45.744469	2025-03-11 01:55:45.744469
14885	2489	6	null	2025-03-11 01:55:45.809364	2025-03-11 01:55:45.809364
14886	2489	7	TRUE	2025-03-11 01:55:45.875728	2025-03-11 01:55:45.875728
14887	2489	8	null	2025-03-11 01:55:45.941813	2025-03-11 01:55:45.941813
14888	2489	9	null	2025-03-11 01:55:46.007709	2025-03-11 01:55:46.007709
14889	2490	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:46.139989	2025-03-11 01:55:46.139989
14890	2490	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:55:46.205915	2025-03-11 01:55:46.205915
14891	2490	6	null	2025-03-11 01:55:46.272384	2025-03-11 01:55:46.272384
14892	2490	7	TRUE	2025-03-11 01:55:46.338111	2025-03-11 01:55:46.338111
14893	2490	8	null	2025-03-11 01:55:46.407835	2025-03-11 01:55:46.407835
14894	2490	9	null	2025-03-11 01:55:46.473845	2025-03-11 01:55:46.473845
14895	2491	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:46.605476	2025-03-11 01:55:46.605476
14896	2491	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:46.67122	2025-03-11 01:55:46.67122
14897	2491	6	null	2025-03-11 01:55:46.739838	2025-03-11 01:55:46.739838
14898	2491	7	TRUE	2025-03-11 01:55:46.80596	2025-03-11 01:55:46.80596
14899	2491	8	null	2025-03-11 01:55:46.871976	2025-03-11 01:55:46.871976
14900	2491	9	null	2025-03-11 01:55:46.938543	2025-03-11 01:55:46.938543
14901	2492	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:55:47.0729	2025-03-11 01:55:47.0729
14902	2492	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:55:47.138787	2025-03-11 01:55:47.138787
14903	2492	6	null	2025-03-11 01:55:47.204662	2025-03-11 01:55:47.204662
14904	2492	7	FALSE	2025-03-11 01:55:47.27069	2025-03-11 01:55:47.27069
14905	2492	8	null	2025-03-11 01:55:47.337989	2025-03-11 01:55:47.337989
14906	2492	9	null	2025-03-11 01:55:47.403644	2025-03-11 01:55:47.403644
14907	2493	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:55:47.541643	2025-03-11 01:55:47.541643
14908	2493	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:55:47.609011	2025-03-11 01:55:47.609011
14909	2493	6	null	2025-03-11 01:55:47.675084	2025-03-11 01:55:47.675084
14910	2493	7	FALSE	2025-03-11 01:55:47.740747	2025-03-11 01:55:47.740747
14911	2493	8	null	2025-03-11 01:55:47.806549	2025-03-11 01:55:47.806549
14912	2493	9	null	2025-03-11 01:55:47.872677	2025-03-11 01:55:47.872677
14913	2494	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:48.004506	2025-03-11 01:55:48.004506
14914	2494	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:48.070493	2025-03-11 01:55:48.070493
14915	2494	6	null	2025-03-11 01:55:48.138576	2025-03-11 01:55:48.138576
14916	2494	7	FALSE	2025-03-11 01:55:48.204297	2025-03-11 01:55:48.204297
14917	2494	8	null	2025-03-11 01:55:48.270965	2025-03-11 01:55:48.270965
14918	2494	9	null	2025-03-11 01:55:48.336831	2025-03-11 01:55:48.336831
14919	2495	4	28d819e53ba22d796dfead0e16752c01	2025-03-11 01:55:48.468318	2025-03-11 01:55:48.468318
14920	2495	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:55:48.535226	2025-03-11 01:55:48.535226
14921	2495	6	null	2025-03-11 01:55:48.601009	2025-03-11 01:55:48.601009
14922	2495	7	FALSE	2025-03-11 01:55:48.667683	2025-03-11 01:55:48.667683
14923	2495	8	null	2025-03-11 01:55:48.735663	2025-03-11 01:55:48.735663
14924	2495	9	null	2025-03-11 01:55:48.801294	2025-03-11 01:55:48.801294
14925	2496	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:48.932901	2025-03-11 01:55:48.932901
14926	2496	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:55:48.998707	2025-03-11 01:55:48.998707
14927	2496	6	null	2025-03-11 01:55:49.064518	2025-03-11 01:55:49.064518
14928	2496	7	TRUE	2025-03-11 01:55:49.130651	2025-03-11 01:55:49.130651
14929	2496	8	null	2025-03-11 01:55:49.1954	2025-03-11 01:55:49.1954
14930	2496	9	null	2025-03-11 01:55:49.261197	2025-03-11 01:55:49.261197
14931	2497	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:49.39288	2025-03-11 01:55:49.39288
14932	2497	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:55:49.459367	2025-03-11 01:55:49.459367
14933	2497	6	null	2025-03-11 01:55:49.526266	2025-03-11 01:55:49.526266
14934	2497	7	TRUE	2025-03-11 01:55:49.592023	2025-03-11 01:55:49.592023
14935	2497	8	null	2025-03-11 01:55:49.658738	2025-03-11 01:55:49.658738
14936	2497	9	null	2025-03-11 01:55:49.724679	2025-03-11 01:55:49.724679
14937	2498	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:49.856502	2025-03-11 01:55:49.856502
14938	2498	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:55:49.922641	2025-03-11 01:55:49.922641
14939	2498	6	null	2025-03-11 01:55:49.992667	2025-03-11 01:55:49.992667
14940	2498	7	FALSE	2025-03-11 01:55:50.058726	2025-03-11 01:55:50.058726
14941	2498	8	null	2025-03-11 01:55:50.124603	2025-03-11 01:55:50.124603
14942	2498	9	null	2025-03-11 01:55:50.190554	2025-03-11 01:55:50.190554
14943	2499	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:50.322773	2025-03-11 01:55:50.322773
14944	2499	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:50.389611	2025-03-11 01:55:50.389611
14945	2499	6	null	2025-03-11 01:55:50.455976	2025-03-11 01:55:50.455976
14946	2499	7	FALSE	2025-03-11 01:55:50.529971	2025-03-11 01:55:50.529971
14947	2499	8	null	2025-03-11 01:55:50.617008	2025-03-11 01:55:50.617008
14948	2499	9	null	2025-03-11 01:55:50.694267	2025-03-11 01:55:50.694267
14949	2500	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:50.826985	2025-03-11 01:55:50.826985
14950	2500	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:50.892634	2025-03-11 01:55:50.892634
14951	2500	6	null	2025-03-11 01:55:50.958375	2025-03-11 01:55:50.958375
14952	2500	7	FALSE	2025-03-11 01:55:51.024343	2025-03-11 01:55:51.024343
14953	2500	8	null	2025-03-11 01:55:51.090102	2025-03-11 01:55:51.090102
14954	2500	9	null	2025-03-11 01:55:51.155883	2025-03-11 01:55:51.155883
14955	2501	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:51.287721	2025-03-11 01:55:51.287721
14956	2501	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:55:51.409418	2025-03-11 01:55:51.409418
14957	2501	6	null	2025-03-11 01:55:51.475328	2025-03-11 01:55:51.475328
14958	2501	7	FALSE	2025-03-11 01:55:51.541102	2025-03-11 01:55:51.541102
14959	2501	8	null	2025-03-11 01:55:51.607031	2025-03-11 01:55:51.607031
14960	2501	9	null	2025-03-11 01:55:51.672351	2025-03-11 01:55:51.672351
14961	2502	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:51.804796	2025-03-11 01:55:51.804796
14962	2502	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:51.872579	2025-03-11 01:55:51.872579
14963	2502	6	null	2025-03-11 01:55:51.938571	2025-03-11 01:55:51.938571
14964	2502	7	TRUE	2025-03-11 01:55:52.004419	2025-03-11 01:55:52.004419
14965	2502	8	null	2025-03-11 01:55:52.070272	2025-03-11 01:55:52.070272
14966	2502	9	null	2025-03-11 01:55:52.136122	2025-03-11 01:55:52.136122
14967	2503	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:52.267838	2025-03-11 01:55:52.267838
14968	2503	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:52.333694	2025-03-11 01:55:52.333694
14969	2503	6	null	2025-03-11 01:55:52.400093	2025-03-11 01:55:52.400093
14970	2503	7	TRUE	2025-03-11 01:55:52.465746	2025-03-11 01:55:52.465746
14971	2503	8	null	2025-03-11 01:55:52.531762	2025-03-11 01:55:52.531762
14972	2503	9	null	2025-03-11 01:55:52.597941	2025-03-11 01:55:52.597941
14973	2504	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:52.732217	2025-03-11 01:55:52.732217
14974	2504	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:52.798158	2025-03-11 01:55:52.798158
14975	2504	6	null	2025-03-11 01:55:52.863381	2025-03-11 01:55:52.863381
14976	2504	7	TRUE	2025-03-11 01:55:52.929824	2025-03-11 01:55:52.929824
14977	2504	8	null	2025-03-11 01:55:52.995582	2025-03-11 01:55:52.995582
14978	2504	9	null	2025-03-11 01:55:53.065165	2025-03-11 01:55:53.065165
14979	2505	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:53.197166	2025-03-11 01:55:53.197166
14980	2505	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:53.263161	2025-03-11 01:55:53.263161
14981	2505	6	null	2025-03-11 01:55:53.328968	2025-03-11 01:55:53.328968
14982	2505	7	TRUE	2025-03-11 01:55:53.395634	2025-03-11 01:55:53.395634
14983	2505	8	null	2025-03-11 01:55:53.462709	2025-03-11 01:55:53.462709
14984	2505	9	null	2025-03-11 01:55:53.528647	2025-03-11 01:55:53.528647
14985	2506	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:53.66064	2025-03-11 01:55:53.66064
14986	2506	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:53.728953	2025-03-11 01:55:53.728953
14987	2506	6	null	2025-03-11 01:55:53.795117	2025-03-11 01:55:53.795117
14988	2506	7	FALSE	2025-03-11 01:55:53.861079	2025-03-11 01:55:53.861079
14989	2506	8	null	2025-03-11 01:55:53.926602	2025-03-11 01:55:53.926602
14990	2506	9	null	2025-03-11 01:55:53.993294	2025-03-11 01:55:53.993294
14991	2507	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:54.125234	2025-03-11 01:55:54.125234
14992	2507	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:54.19084	2025-03-11 01:55:54.19084
14993	2507	6	null	2025-03-11 01:55:54.256495	2025-03-11 01:55:54.256495
14994	2507	7	FALSE	2025-03-11 01:55:54.322194	2025-03-11 01:55:54.322194
14995	2507	8	null	2025-03-11 01:55:54.388887	2025-03-11 01:55:54.388887
14996	2507	9	null	2025-03-11 01:55:54.454675	2025-03-11 01:55:54.454675
14997	2508	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:54.587079	2025-03-11 01:55:54.587079
14998	2508	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:54.656264	2025-03-11 01:55:54.656264
14999	2508	6	null	2025-03-11 01:55:54.72151	2025-03-11 01:55:54.72151
15000	2508	7	FALSE	2025-03-11 01:55:54.788129	2025-03-11 01:55:54.788129
15001	2508	8	null	2025-03-11 01:55:54.854067	2025-03-11 01:55:54.854067
15002	2508	9	null	2025-03-11 01:55:54.923771	2025-03-11 01:55:54.923771
15003	2509	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:55.055807	2025-03-11 01:55:55.055807
15004	2509	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:55.121555	2025-03-11 01:55:55.121555
15005	2509	6	null	2025-03-11 01:55:55.186395	2025-03-11 01:55:55.186395
15006	2509	7	FALSE	2025-03-11 01:55:55.252817	2025-03-11 01:55:55.252817
15007	2509	8	null	2025-03-11 01:55:55.318682	2025-03-11 01:55:55.318682
15008	2509	9	null	2025-03-11 01:55:55.384704	2025-03-11 01:55:55.384704
15009	2510	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:55.517241	2025-03-11 01:55:55.517241
15010	2510	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:55.583011	2025-03-11 01:55:55.583011
15011	2510	6	null	2025-03-11 01:55:55.648872	2025-03-11 01:55:55.648872
15012	2510	7	FALSE	2025-03-11 01:55:55.714645	2025-03-11 01:55:55.714645
15013	2510	8	null	2025-03-11 01:55:55.781218	2025-03-11 01:55:55.781218
15014	2510	9	null	2025-03-11 01:55:55.847047	2025-03-11 01:55:55.847047
15015	2511	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:55.978933	2025-03-11 01:55:55.978933
15016	2511	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:56.044745	2025-03-11 01:55:56.044745
15017	2511	6	null	2025-03-11 01:55:56.110616	2025-03-11 01:55:56.110616
15018	2511	7	FALSE	2025-03-11 01:55:56.178099	2025-03-11 01:55:56.178099
15019	2511	8	null	2025-03-11 01:55:56.243643	2025-03-11 01:55:56.243643
15020	2511	9	null	2025-03-11 01:55:56.30838	2025-03-11 01:55:56.30838
15021	2512	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:56.440752	2025-03-11 01:55:56.440752
15022	2512	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:56.506683	2025-03-11 01:55:56.506683
15023	2512	6	null	2025-03-11 01:55:56.573349	2025-03-11 01:55:56.573349
15024	2512	7	FALSE	2025-03-11 01:55:56.639565	2025-03-11 01:55:56.639565
15025	2512	8	null	2025-03-11 01:55:56.705348	2025-03-11 01:55:56.705348
15026	2512	9	null	2025-03-11 01:55:56.771236	2025-03-11 01:55:56.771236
15027	2513	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:56.907946	2025-03-11 01:55:56.907946
15028	2513	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:56.973897	2025-03-11 01:55:56.973897
15029	2513	6	null	2025-03-11 01:55:57.039689	2025-03-11 01:55:57.039689
15030	2513	7	TRUE	2025-03-11 01:55:57.105591	2025-03-11 01:55:57.105591
15031	2513	8	null	2025-03-11 01:55:57.171695	2025-03-11 01:55:57.171695
15032	2513	9	null	2025-03-11 01:55:57.237447	2025-03-11 01:55:57.237447
15033	2514	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:57.430846	2025-03-11 01:55:57.430846
15034	2514	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:57.496915	2025-03-11 01:55:57.496915
15035	2514	6	null	2025-03-11 01:55:57.562843	2025-03-11 01:55:57.562843
15036	2514	7	FALSE	2025-03-11 01:55:57.631214	2025-03-11 01:55:57.631214
15037	2514	8	null	2025-03-11 01:55:57.697026	2025-03-11 01:55:57.697026
15038	2514	9	null	2025-03-11 01:55:57.762972	2025-03-11 01:55:57.762972
15039	2515	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:57.894685	2025-03-11 01:55:57.894685
15040	2515	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:57.960844	2025-03-11 01:55:57.960844
15041	2515	6	null	2025-03-11 01:55:58.027604	2025-03-11 01:55:58.027604
15042	2515	7	TRUE	2025-03-11 01:55:58.094059	2025-03-11 01:55:58.094059
15043	2515	8	null	2025-03-11 01:55:58.159877	2025-03-11 01:55:58.159877
15044	2515	9	null	2025-03-11 01:55:58.225983	2025-03-11 01:55:58.225983
15045	2516	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:58.357767	2025-03-11 01:55:58.357767
15046	2516	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:58.42405	2025-03-11 01:55:58.42405
15047	2516	6	null	2025-03-11 01:55:58.490001	2025-03-11 01:55:58.490001
15048	2516	7	FALSE	2025-03-11 01:55:58.555762	2025-03-11 01:55:58.555762
15049	2516	8	null	2025-03-11 01:55:58.621685	2025-03-11 01:55:58.621685
15050	2516	9	null	2025-03-11 01:55:58.687903	2025-03-11 01:55:58.687903
15051	2517	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:58.819903	2025-03-11 01:55:58.819903
15052	2517	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:58.885773	2025-03-11 01:55:58.885773
15053	2517	6	null	2025-03-11 01:55:58.951933	2025-03-11 01:55:58.951933
15054	2517	7	FALSE	2025-03-11 01:55:59.017702	2025-03-11 01:55:59.017702
15055	2517	8	null	2025-03-11 01:55:59.083667	2025-03-11 01:55:59.083667
15056	2517	9	null	2025-03-11 01:55:59.149519	2025-03-11 01:55:59.149519
15057	2518	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:59.285484	2025-03-11 01:55:59.285484
15058	2518	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:55:59.351611	2025-03-11 01:55:59.351611
15059	2518	6	null	2025-03-11 01:55:59.417773	2025-03-11 01:55:59.417773
15060	2518	7	TRUE	2025-03-11 01:55:59.483721	2025-03-11 01:55:59.483721
15061	2518	8	null	2025-03-11 01:55:59.550773	2025-03-11 01:55:59.550773
15062	2518	9	null	2025-03-11 01:55:59.621187	2025-03-11 01:55:59.621187
15063	2519	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:55:59.753314	2025-03-11 01:55:59.753314
15064	2519	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:55:59.824643	2025-03-11 01:55:59.824643
15065	2519	6	null	2025-03-11 01:55:59.891249	2025-03-11 01:55:59.891249
15066	2519	7	FALSE	2025-03-11 01:55:59.957017	2025-03-11 01:55:59.957017
15067	2519	8	null	2025-03-11 01:56:00.023552	2025-03-11 01:56:00.023552
15068	2519	9	null	2025-03-11 01:56:00.08963	2025-03-11 01:56:00.08963
15069	2520	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:00.221589	2025-03-11 01:56:00.221589
15070	2520	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:00.287689	2025-03-11 01:56:00.287689
15071	2520	6	null	2025-03-11 01:56:00.354402	2025-03-11 01:56:00.354402
15072	2520	7	FALSE	2025-03-11 01:56:00.421075	2025-03-11 01:56:00.421075
15073	2520	8	null	2025-03-11 01:56:00.486918	2025-03-11 01:56:00.486918
15074	2520	9	null	2025-03-11 01:56:00.552845	2025-03-11 01:56:00.552845
15075	2521	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:00.686711	2025-03-11 01:56:00.686711
15076	2521	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:00.753061	2025-03-11 01:56:00.753061
15077	2521	6	null	2025-03-11 01:56:00.81882	2025-03-11 01:56:00.81882
15078	2521	7	FALSE	2025-03-11 01:56:00.884812	2025-03-11 01:56:00.884812
15079	2521	8	null	2025-03-11 01:56:00.950573	2025-03-11 01:56:00.950573
15080	2521	9	null	2025-03-11 01:56:01.01655	2025-03-11 01:56:01.01655
15081	2522	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:01.149054	2025-03-11 01:56:01.149054
15082	2522	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:01.214926	2025-03-11 01:56:01.214926
15083	2522	6	null	2025-03-11 01:56:01.280958	2025-03-11 01:56:01.280958
15084	2522	7	FALSE	2025-03-11 01:56:01.346823	2025-03-11 01:56:01.346823
15085	2522	8	null	2025-03-11 01:56:01.412716	2025-03-11 01:56:01.412716
15086	2522	9	null	2025-03-11 01:56:01.47871	2025-03-11 01:56:01.47871
15087	2523	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:01.61223	2025-03-11 01:56:01.61223
15088	2523	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:01.678453	2025-03-11 01:56:01.678453
15089	2523	6	null	2025-03-11 01:56:01.744304	2025-03-11 01:56:01.744304
15090	2523	7	FALSE	2025-03-11 01:56:01.811014	2025-03-11 01:56:01.811014
15091	2523	8	null	2025-03-11 01:56:01.877592	2025-03-11 01:56:01.877592
15092	2523	9	null	2025-03-11 01:56:01.943472	2025-03-11 01:56:01.943472
15093	2524	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:02.075147	2025-03-11 01:56:02.075147
15094	2524	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:02.140963	2025-03-11 01:56:02.140963
15095	2524	6	null	2025-03-11 01:56:02.206791	2025-03-11 01:56:02.206791
15096	2524	7	FALSE	2025-03-11 01:56:02.27297	2025-03-11 01:56:02.27297
15097	2524	8	null	2025-03-11 01:56:02.340847	2025-03-11 01:56:02.340847
15098	2524	9	null	2025-03-11 01:56:02.407376	2025-03-11 01:56:02.407376
15099	2525	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:02.542128	2025-03-11 01:56:02.542128
15100	2525	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:02.608352	2025-03-11 01:56:02.608352
15101	2525	6	null	2025-03-11 01:56:02.674257	2025-03-11 01:56:02.674257
15102	2525	7	FALSE	2025-03-11 01:56:02.740273	2025-03-11 01:56:02.740273
15103	2525	8	null	2025-03-11 01:56:02.806439	2025-03-11 01:56:02.806439
15104	2525	9	null	2025-03-11 01:56:02.872318	2025-03-11 01:56:02.872318
15105	2526	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:03.004408	2025-03-11 01:56:03.004408
15106	2526	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:03.070711	2025-03-11 01:56:03.070711
15107	2526	6	null	2025-03-11 01:56:03.136965	2025-03-11 01:56:03.136965
15108	2526	7	FALSE	2025-03-11 01:56:03.203269	2025-03-11 01:56:03.203269
15109	2526	8	null	2025-03-11 01:56:03.269105	2025-03-11 01:56:03.269105
15110	2526	9	null	2025-03-11 01:56:03.335001	2025-03-11 01:56:03.335001
15111	2527	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:03.466764	2025-03-11 01:56:03.466764
15112	2527	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:03.532919	2025-03-11 01:56:03.532919
15113	2527	6	null	2025-03-11 01:56:03.598923	2025-03-11 01:56:03.598923
15114	2527	7	FALSE	2025-03-11 01:56:03.664687	2025-03-11 01:56:03.664687
15115	2527	8	null	2025-03-11 01:56:03.732418	2025-03-11 01:56:03.732418
15116	2527	9	null	2025-03-11 01:56:03.798757	2025-03-11 01:56:03.798757
15117	2528	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:03.931798	2025-03-11 01:56:03.931798
15118	2528	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:03.997674	2025-03-11 01:56:03.997674
15119	2528	6	null	2025-03-11 01:56:04.064095	2025-03-11 01:56:04.064095
15120	2528	7	FALSE	2025-03-11 01:56:04.13013	2025-03-11 01:56:04.13013
15121	2528	8	null	2025-03-11 01:56:04.196139	2025-03-11 01:56:04.196139
15122	2528	9	null	2025-03-11 01:56:04.261917	2025-03-11 01:56:04.261917
15123	2529	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:04.393971	2025-03-11 01:56:04.393971
15124	2529	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:04.459782	2025-03-11 01:56:04.459782
15125	2529	6	null	2025-03-11 01:56:04.525689	2025-03-11 01:56:04.525689
15126	2529	7	FALSE	2025-03-11 01:56:04.59179	2025-03-11 01:56:04.59179
15127	2529	8	null	2025-03-11 01:56:04.661121	2025-03-11 01:56:04.661121
15128	2529	9	null	2025-03-11 01:56:04.727967	2025-03-11 01:56:04.727967
15129	2530	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:04.862453	2025-03-11 01:56:04.862453
15130	2530	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:04.928605	2025-03-11 01:56:04.928605
15131	2530	6	null	2025-03-11 01:56:04.994611	2025-03-11 01:56:04.994611
15132	2530	7	FALSE	2025-03-11 01:56:05.073932	2025-03-11 01:56:05.073932
15133	2530	8	null	2025-03-11 01:56:05.13982	2025-03-11 01:56:05.13982
15134	2530	9	null	2025-03-11 01:56:05.205748	2025-03-11 01:56:05.205748
15135	2531	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:05.338096	2025-03-11 01:56:05.338096
15136	2531	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:05.404617	2025-03-11 01:56:05.404617
15137	2531	6	null	2025-03-11 01:56:05.470143	2025-03-11 01:56:05.470143
15138	2531	7	FALSE	2025-03-11 01:56:05.535812	2025-03-11 01:56:05.535812
15139	2531	8	null	2025-03-11 01:56:05.60037	2025-03-11 01:56:05.60037
15140	2531	9	null	2025-03-11 01:56:05.6667	2025-03-11 01:56:05.6667
15141	2532	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:05.797955	2025-03-11 01:56:05.797955
15142	2532	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:05.863772	2025-03-11 01:56:05.863772
15143	2532	6	null	2025-03-11 01:56:05.930082	2025-03-11 01:56:05.930082
15144	2532	7	FALSE	2025-03-11 01:56:05.996134	2025-03-11 01:56:05.996134
15145	2532	8	null	2025-03-11 01:56:06.062594	2025-03-11 01:56:06.062594
15146	2532	9	null	2025-03-11 01:56:06.128397	2025-03-11 01:56:06.128397
15147	2533	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:06.26438	2025-03-11 01:56:06.26438
15148	2533	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:06.330321	2025-03-11 01:56:06.330321
15149	2533	6	null	2025-03-11 01:56:06.401441	2025-03-11 01:56:06.401441
15150	2533	7	FALSE	2025-03-11 01:56:06.470186	2025-03-11 01:56:06.470186
15151	2533	8	null	2025-03-11 01:56:06.536523	2025-03-11 01:56:06.536523
15152	2533	9	null	2025-03-11 01:56:06.602559	2025-03-11 01:56:06.602559
15153	2534	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:06.734781	2025-03-11 01:56:06.734781
15154	2534	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:06.800832	2025-03-11 01:56:06.800832
15155	2534	6	null	2025-03-11 01:56:06.86696	2025-03-11 01:56:06.86696
15156	2534	7	FALSE	2025-03-11 01:56:06.932987	2025-03-11 01:56:06.932987
15157	2534	8	null	2025-03-11 01:56:06.998854	2025-03-11 01:56:06.998854
15158	2534	9	null	2025-03-11 01:56:07.064764	2025-03-11 01:56:07.064764
15159	2535	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:07.196947	2025-03-11 01:56:07.196947
15160	2535	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:07.264486	2025-03-11 01:56:07.264486
15161	2535	6	null	2025-03-11 01:56:07.331271	2025-03-11 01:56:07.331271
15162	2535	7	FALSE	2025-03-11 01:56:07.396841	2025-03-11 01:56:07.396841
15163	2535	8	null	2025-03-11 01:56:07.462418	2025-03-11 01:56:07.462418
15164	2535	9	null	2025-03-11 01:56:07.528145	2025-03-11 01:56:07.528145
15165	2536	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:07.659984	2025-03-11 01:56:07.659984
15166	2536	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:07.725742	2025-03-11 01:56:07.725742
15167	2536	6	null	2025-03-11 01:56:07.790314	2025-03-11 01:56:07.790314
15168	2536	7	FALSE	2025-03-11 01:56:07.856178	2025-03-11 01:56:07.856178
15169	2536	8	null	2025-03-11 01:56:07.921853	2025-03-11 01:56:07.921853
15170	2536	9	null	2025-03-11 01:56:07.986262	2025-03-11 01:56:07.986262
15171	2537	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:08.120038	2025-03-11 01:56:08.120038
15172	2537	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:08.18578	2025-03-11 01:56:08.18578
15173	2537	6	null	2025-03-11 01:56:08.251626	2025-03-11 01:56:08.251626
15174	2537	7	FALSE	2025-03-11 01:56:08.317929	2025-03-11 01:56:08.317929
15175	2537	8	null	2025-03-11 01:56:08.383963	2025-03-11 01:56:08.383963
15176	2537	9	null	2025-03-11 01:56:08.450413	2025-03-11 01:56:08.450413
15177	2538	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:08.58826	2025-03-11 01:56:08.58826
15178	2538	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:08.653948	2025-03-11 01:56:08.653948
15179	2538	6	null	2025-03-11 01:56:08.719732	2025-03-11 01:56:08.719732
15180	2538	7	FALSE	2025-03-11 01:56:08.785552	2025-03-11 01:56:08.785552
15181	2538	8	null	2025-03-11 01:56:08.850393	2025-03-11 01:56:08.850393
15182	2538	9	null	2025-03-11 01:56:08.916268	2025-03-11 01:56:08.916268
15183	2539	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:09.048181	2025-03-11 01:56:09.048181
15184	2539	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:09.114126	2025-03-11 01:56:09.114126
15185	2539	6	null	2025-03-11 01:56:09.180649	2025-03-11 01:56:09.180649
15186	2539	7	FALSE	2025-03-11 01:56:09.247703	2025-03-11 01:56:09.247703
15187	2539	8	null	2025-03-11 01:56:09.313826	2025-03-11 01:56:09.313826
15188	2539	9	null	2025-03-11 01:56:09.380272	2025-03-11 01:56:09.380272
15189	2540	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:09.5119	2025-03-11 01:56:09.5119
15190	2540	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:09.577962	2025-03-11 01:56:09.577962
15191	2540	6	null	2025-03-11 01:56:09.645035	2025-03-11 01:56:09.645035
15192	2540	7	TRUE	2025-03-11 01:56:09.716488	2025-03-11 01:56:09.716488
15193	2540	8	null	2025-03-11 01:56:09.782258	2025-03-11 01:56:09.782258
15194	2540	9	null	2025-03-11 01:56:09.848094	2025-03-11 01:56:09.848094
15195	2541	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:09.980331	2025-03-11 01:56:09.980331
15196	2541	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:10.046367	2025-03-11 01:56:10.046367
15197	2541	6	null	2025-03-11 01:56:10.112993	2025-03-11 01:56:10.112993
15198	2541	7	TRUE	2025-03-11 01:56:10.178876	2025-03-11 01:56:10.178876
15199	2541	8	null	2025-03-11 01:56:10.247328	2025-03-11 01:56:10.247328
15200	2541	9	null	2025-03-11 01:56:10.314349	2025-03-11 01:56:10.314349
15201	2542	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:10.447471	2025-03-11 01:56:10.447471
15202	2542	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:10.513314	2025-03-11 01:56:10.513314
15203	2542	6	null	2025-03-11 01:56:10.579354	2025-03-11 01:56:10.579354
15204	2542	7	TRUE	2025-03-11 01:56:10.645349	2025-03-11 01:56:10.645349
15205	2542	8	null	2025-03-11 01:56:10.711166	2025-03-11 01:56:10.711166
15206	2542	9	null	2025-03-11 01:56:10.776885	2025-03-11 01:56:10.776885
15207	2543	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:10.908603	2025-03-11 01:56:10.908603
15208	2543	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:10.974453	2025-03-11 01:56:10.974453
15209	2543	6	null	2025-03-11 01:56:11.040376	2025-03-11 01:56:11.040376
15210	2543	7	FALSE	2025-03-11 01:56:11.106336	2025-03-11 01:56:11.106336
15211	2543	8	null	2025-03-11 01:56:11.172008	2025-03-11 01:56:11.172008
15212	2543	9	null	2025-03-11 01:56:11.237701	2025-03-11 01:56:11.237701
15213	2544	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:11.370116	2025-03-11 01:56:11.370116
15214	2544	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:11.435915	2025-03-11 01:56:11.435915
15215	2544	6	null	2025-03-11 01:56:11.502092	2025-03-11 01:56:11.502092
15216	2544	7	FALSE	2025-03-11 01:56:11.567709	2025-03-11 01:56:11.567709
15217	2544	8	null	2025-03-11 01:56:11.633325	2025-03-11 01:56:11.633325
15218	2544	9	null	2025-03-11 01:56:11.699435	2025-03-11 01:56:11.699435
15219	2545	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:11.831583	2025-03-11 01:56:11.831583
15220	2545	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:11.901907	2025-03-11 01:56:11.901907
15221	2545	6	null	2025-03-11 01:56:11.970859	2025-03-11 01:56:11.970859
15222	2545	7	FALSE	2025-03-11 01:56:12.03722	2025-03-11 01:56:12.03722
15223	2545	8	null	2025-03-11 01:56:12.103214	2025-03-11 01:56:12.103214
15224	2545	9	null	2025-03-11 01:56:12.169112	2025-03-11 01:56:12.169112
15225	2546	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:12.306338	2025-03-11 01:56:12.306338
15226	2546	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:12.372261	2025-03-11 01:56:12.372261
15227	2546	6	null	2025-03-11 01:56:12.438156	2025-03-11 01:56:12.438156
15228	2546	7	FALSE	2025-03-11 01:56:12.503934	2025-03-11 01:56:12.503934
15229	2546	8	null	2025-03-11 01:56:12.570034	2025-03-11 01:56:12.570034
15230	2546	9	null	2025-03-11 01:56:12.64155	2025-03-11 01:56:12.64155
15231	2547	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:12.774408	2025-03-11 01:56:12.774408
15232	2547	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:12.844389	2025-03-11 01:56:12.844389
15233	2547	6	null	2025-03-11 01:56:12.910279	2025-03-11 01:56:12.910279
15234	2547	7	FALSE	2025-03-11 01:56:12.976006	2025-03-11 01:56:12.976006
15235	2547	8	null	2025-03-11 01:56:13.041986	2025-03-11 01:56:13.041986
15236	2547	9	null	2025-03-11 01:56:13.107945	2025-03-11 01:56:13.107945
15237	2548	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:13.240734	2025-03-11 01:56:13.240734
15238	2548	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:13.306688	2025-03-11 01:56:13.306688
15239	2548	6	null	2025-03-11 01:56:13.371502	2025-03-11 01:56:13.371502
15240	2548	7	FALSE	2025-03-11 01:56:13.437232	2025-03-11 01:56:13.437232
15241	2548	8	null	2025-03-11 01:56:13.503948	2025-03-11 01:56:13.503948
15242	2548	9	null	2025-03-11 01:56:13.56984	2025-03-11 01:56:13.56984
15243	2549	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:13.702287	2025-03-11 01:56:13.702287
15244	2549	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:13.768186	2025-03-11 01:56:13.768186
15245	2549	6	null	2025-03-11 01:56:13.834518	2025-03-11 01:56:13.834518
15246	2549	7	FALSE	2025-03-11 01:56:13.900431	2025-03-11 01:56:13.900431
15247	2549	8	null	2025-03-11 01:56:13.966015	2025-03-11 01:56:13.966015
15248	2549	9	null	2025-03-11 01:56:14.031849	2025-03-11 01:56:14.031849
15249	2550	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:14.1648	2025-03-11 01:56:14.1648
15250	2550	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:14.230629	2025-03-11 01:56:14.230629
15251	2550	6	null	2025-03-11 01:56:14.298808	2025-03-11 01:56:14.298808
15252	2550	7	FALSE	2025-03-11 01:56:14.364796	2025-03-11 01:56:14.364796
15253	2550	8	null	2025-03-11 01:56:14.429381	2025-03-11 01:56:14.429381
15254	2550	9	null	2025-03-11 01:56:14.495689	2025-03-11 01:56:14.495689
15255	2551	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:14.627675	2025-03-11 01:56:14.627675
15256	2551	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:14.693365	2025-03-11 01:56:14.693365
15257	2551	6	null	2025-03-11 01:56:14.759015	2025-03-11 01:56:14.759015
15258	2551	7	FALSE	2025-03-11 01:56:14.828336	2025-03-11 01:56:14.828336
15259	2551	8	null	2025-03-11 01:56:14.894307	2025-03-11 01:56:14.894307
15260	2551	9	null	2025-03-11 01:56:14.960994	2025-03-11 01:56:14.960994
15261	2552	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:15.092456	2025-03-11 01:56:15.092456
15262	2552	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:15.163051	2025-03-11 01:56:15.163051
15263	2552	6	null	2025-03-11 01:56:15.228832	2025-03-11 01:56:15.228832
15264	2552	7	FALSE	2025-03-11 01:56:15.294684	2025-03-11 01:56:15.294684
15265	2552	8	null	2025-03-11 01:56:15.3594	2025-03-11 01:56:15.3594
15266	2552	9	null	2025-03-11 01:56:15.424929	2025-03-11 01:56:15.424929
15267	2553	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:15.556178	2025-03-11 01:56:15.556178
15268	2553	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:15.622048	2025-03-11 01:56:15.622048
15269	2553	6	null	2025-03-11 01:56:15.68792	2025-03-11 01:56:15.68792
15270	2553	7	FALSE	2025-03-11 01:56:15.753681	2025-03-11 01:56:15.753681
15271	2553	8	null	2025-03-11 01:56:15.82043	2025-03-11 01:56:15.82043
15272	2553	9	null	2025-03-11 01:56:15.886416	2025-03-11 01:56:15.886416
15273	2554	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:16.01796	2025-03-11 01:56:16.01796
15274	2554	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:16.08498	2025-03-11 01:56:16.08498
15275	2554	6	null	2025-03-11 01:56:16.157694	2025-03-11 01:56:16.157694
15276	2554	7	FALSE	2025-03-11 01:56:16.229857	2025-03-11 01:56:16.229857
15277	2554	8	null	2025-03-11 01:56:16.296093	2025-03-11 01:56:16.296093
15278	2554	9	null	2025-03-11 01:56:16.361794	2025-03-11 01:56:16.361794
15279	2555	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:16.492373	2025-03-11 01:56:16.492373
15280	2555	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:16.558154	2025-03-11 01:56:16.558154
15281	2555	6	null	2025-03-11 01:56:16.625687	2025-03-11 01:56:16.625687
15282	2555	7	TRUE	2025-03-11 01:56:16.69157	2025-03-11 01:56:16.69157
15283	2555	8	null	2025-03-11 01:56:16.757336	2025-03-11 01:56:16.757336
15284	2555	9	null	2025-03-11 01:56:16.825	2025-03-11 01:56:16.825
15285	2556	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:16.957084	2025-03-11 01:56:16.957084
15286	2556	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:17.023099	2025-03-11 01:56:17.023099
15287	2556	6	null	2025-03-11 01:56:17.089191	2025-03-11 01:56:17.089191
15288	2556	7	FALSE	2025-03-11 01:56:17.155035	2025-03-11 01:56:17.155035
15289	2556	8	null	2025-03-11 01:56:17.220891	2025-03-11 01:56:17.220891
15290	2556	9	null	2025-03-11 01:56:17.288878	2025-03-11 01:56:17.288878
15291	2557	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:17.420863	2025-03-11 01:56:17.420863
15292	2557	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:17.486879	2025-03-11 01:56:17.486879
15293	2557	6	null	2025-03-11 01:56:17.552983	2025-03-11 01:56:17.552983
15294	2557	7	TRUE	2025-03-11 01:56:17.620372	2025-03-11 01:56:17.620372
15295	2557	8	null	2025-03-11 01:56:17.686112	2025-03-11 01:56:17.686112
15296	2557	9	null	2025-03-11 01:56:17.753417	2025-03-11 01:56:17.753417
15297	2558	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:17.886028	2025-03-11 01:56:17.886028
15298	2558	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:17.951876	2025-03-11 01:56:17.951876
15299	2558	6	null	2025-03-11 01:56:18.017911	2025-03-11 01:56:18.017911
15300	2558	7	TRUE	2025-03-11 01:56:18.083926	2025-03-11 01:56:18.083926
15301	2558	8	null	2025-03-11 01:56:18.15041	2025-03-11 01:56:18.15041
15302	2558	9	null	2025-03-11 01:56:18.216142	2025-03-11 01:56:18.216142
15303	2559	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:18.348026	2025-03-11 01:56:18.348026
15304	2559	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:18.413999	2025-03-11 01:56:18.413999
15305	2559	6	null	2025-03-11 01:56:18.479928	2025-03-11 01:56:18.479928
15306	2559	7	TRUE	2025-03-11 01:56:18.545882	2025-03-11 01:56:18.545882
15307	2559	8	null	2025-03-11 01:56:18.611929	2025-03-11 01:56:18.611929
15308	2559	9	null	2025-03-11 01:56:18.677818	2025-03-11 01:56:18.677818
15309	2560	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:18.809517	2025-03-11 01:56:18.809517
15310	2560	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:18.875329	2025-03-11 01:56:18.875329
15311	2560	6	null	2025-03-11 01:56:18.941919	2025-03-11 01:56:18.941919
15312	2560	7	TRUE	2025-03-11 01:56:19.007811	2025-03-11 01:56:19.007811
15313	2560	8	null	2025-03-11 01:56:19.074055	2025-03-11 01:56:19.074055
15314	2560	9	null	2025-03-11 01:56:19.145267	2025-03-11 01:56:19.145267
15315	2561	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:19.280424	2025-03-11 01:56:19.280424
15316	2561	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:19.346242	2025-03-11 01:56:19.346242
15317	2561	6	null	2025-03-11 01:56:19.412962	2025-03-11 01:56:19.412962
15318	2561	7	TRUE	2025-03-11 01:56:19.478952	2025-03-11 01:56:19.478952
15319	2561	8	null	2025-03-11 01:56:19.54481	2025-03-11 01:56:19.54481
15320	2561	9	null	2025-03-11 01:56:19.61064	2025-03-11 01:56:19.61064
15321	2562	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:19.743118	2025-03-11 01:56:19.743118
15322	2562	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:19.811726	2025-03-11 01:56:19.811726
15323	2562	6	null	2025-03-11 01:56:19.878186	2025-03-11 01:56:19.878186
15324	2562	7	TRUE	2025-03-11 01:56:19.943909	2025-03-11 01:56:19.943909
15325	2562	8	null	2025-03-11 01:56:20.009796	2025-03-11 01:56:20.009796
15326	2562	9	null	2025-03-11 01:56:20.075606	2025-03-11 01:56:20.075606
15327	2563	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:20.208679	2025-03-11 01:56:20.208679
15328	2563	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:20.277767	2025-03-11 01:56:20.277767
15329	2563	6	null	2025-03-11 01:56:20.345375	2025-03-11 01:56:20.345375
15330	2563	7	TRUE	2025-03-11 01:56:20.411313	2025-03-11 01:56:20.411313
15331	2563	8	null	2025-03-11 01:56:20.477285	2025-03-11 01:56:20.477285
15332	2563	9	null	2025-03-11 01:56:20.543267	2025-03-11 01:56:20.543267
15333	2564	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:20.675807	2025-03-11 01:56:20.675807
15334	2564	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:20.741596	2025-03-11 01:56:20.741596
15335	2564	6	null	2025-03-11 01:56:20.807342	2025-03-11 01:56:20.807342
15336	2564	7	TRUE	2025-03-11 01:56:20.873353	2025-03-11 01:56:20.873353
15337	2564	8	null	2025-03-11 01:56:20.939189	2025-03-11 01:56:20.939189
15338	2564	9	null	2025-03-11 01:56:21.004825	2025-03-11 01:56:21.004825
15339	2565	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:21.13767	2025-03-11 01:56:21.13767
15340	2565	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:21.203351	2025-03-11 01:56:21.203351
15341	2565	6	null	2025-03-11 01:56:21.269047	2025-03-11 01:56:21.269047
15342	2565	7	TRUE	2025-03-11 01:56:21.335115	2025-03-11 01:56:21.335115
15343	2565	8	null	2025-03-11 01:56:21.401044	2025-03-11 01:56:21.401044
15344	2565	9	null	2025-03-11 01:56:21.466374	2025-03-11 01:56:21.466374
15345	2566	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:21.597887	2025-03-11 01:56:21.597887
15346	2566	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:21.66382	2025-03-11 01:56:21.66382
15347	2566	6	null	2025-03-11 01:56:21.729711	2025-03-11 01:56:21.729711
15348	2566	7	FALSE	2025-03-11 01:56:21.795474	2025-03-11 01:56:21.795474
15349	2566	8	null	2025-03-11 01:56:21.861249	2025-03-11 01:56:21.861249
15350	2566	9	null	2025-03-11 01:56:21.926984	2025-03-11 01:56:21.926984
15351	2567	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:22.05885	2025-03-11 01:56:22.05885
15352	2567	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:22.124665	2025-03-11 01:56:22.124665
15353	2567	6	null	2025-03-11 01:56:22.190604	2025-03-11 01:56:22.190604
15354	2567	7	TRUE	2025-03-11 01:56:22.256411	2025-03-11 01:56:22.256411
15355	2567	8	null	2025-03-11 01:56:22.322528	2025-03-11 01:56:22.322528
15356	2567	9	null	2025-03-11 01:56:22.388849	2025-03-11 01:56:22.388849
15357	2568	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:22.520914	2025-03-11 01:56:22.520914
15358	2568	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:22.586932	2025-03-11 01:56:22.586932
15359	2568	6	null	2025-03-11 01:56:22.652963	2025-03-11 01:56:22.652963
15360	2568	7	FALSE	2025-03-11 01:56:22.719402	2025-03-11 01:56:22.719402
15361	2568	8	null	2025-03-11 01:56:22.785388	2025-03-11 01:56:22.785388
15362	2568	9	null	2025-03-11 01:56:22.851296	2025-03-11 01:56:22.851296
15363	2569	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:22.982946	2025-03-11 01:56:22.982946
15364	2569	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:23.048602	2025-03-11 01:56:23.048602
15365	2569	6	null	2025-03-11 01:56:23.114364	2025-03-11 01:56:23.114364
15366	2569	7	FALSE	2025-03-11 01:56:23.180069	2025-03-11 01:56:23.180069
15367	2569	8	null	2025-03-11 01:56:23.245841	2025-03-11 01:56:23.245841
15368	2569	9	null	2025-03-11 01:56:23.311709	2025-03-11 01:56:23.311709
15369	2570	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:23.443714	2025-03-11 01:56:23.443714
15370	2570	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:23.509591	2025-03-11 01:56:23.509591
15371	2570	6	null	2025-03-11 01:56:23.576029	2025-03-11 01:56:23.576029
15372	2570	7	FALSE	2025-03-11 01:56:23.641842	2025-03-11 01:56:23.641842
15373	2570	8	null	2025-03-11 01:56:23.708443	2025-03-11 01:56:23.708443
15374	2570	9	null	2025-03-11 01:56:23.773913	2025-03-11 01:56:23.773913
15375	2571	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:23.905747	2025-03-11 01:56:23.905747
15376	2571	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:23.971571	2025-03-11 01:56:23.971571
15377	2571	6	null	2025-03-11 01:56:24.037486	2025-03-11 01:56:24.037486
15378	2571	7	FALSE	2025-03-11 01:56:24.104667	2025-03-11 01:56:24.104667
15379	2571	8	null	2025-03-11 01:56:24.170339	2025-03-11 01:56:24.170339
15380	2571	9	null	2025-03-11 01:56:24.237499	2025-03-11 01:56:24.237499
15381	2572	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:24.370273	2025-03-11 01:56:24.370273
15382	2572	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:24.436674	2025-03-11 01:56:24.436674
15383	2572	6	null	2025-03-11 01:56:24.502613	2025-03-11 01:56:24.502613
15384	2572	7	TRUE	2025-03-11 01:56:24.568542	2025-03-11 01:56:24.568542
15385	2572	8	null	2025-03-11 01:56:24.634296	2025-03-11 01:56:24.634296
15386	2572	9	null	2025-03-11 01:56:24.700162	2025-03-11 01:56:24.700162
15387	2573	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:24.833357	2025-03-11 01:56:24.833357
15388	2573	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:24.899142	2025-03-11 01:56:24.899142
15389	2573	6	null	2025-03-11 01:56:24.964846	2025-03-11 01:56:24.964846
15390	2573	7	TRUE	2025-03-11 01:56:25.037123	2025-03-11 01:56:25.037123
15391	2573	8	null	2025-03-11 01:56:25.102875	2025-03-11 01:56:25.102875
15392	2573	9	null	2025-03-11 01:56:25.168552	2025-03-11 01:56:25.168552
15393	2574	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:25.301634	2025-03-11 01:56:25.301634
15394	2574	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:25.367426	2025-03-11 01:56:25.367426
15395	2574	6	null	2025-03-11 01:56:25.433344	2025-03-11 01:56:25.433344
15396	2574	7	TRUE	2025-03-11 01:56:25.499106	2025-03-11 01:56:25.499106
15397	2574	8	null	2025-03-11 01:56:25.565069	2025-03-11 01:56:25.565069
15398	2574	9	null	2025-03-11 01:56:25.631438	2025-03-11 01:56:25.631438
15399	2575	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:25.763696	2025-03-11 01:56:25.763696
15400	2575	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:25.829479	2025-03-11 01:56:25.829479
15401	2575	6	null	2025-03-11 01:56:25.894896	2025-03-11 01:56:25.894896
15402	2575	7	TRUE	2025-03-11 01:56:25.960654	2025-03-11 01:56:25.960654
15403	2575	8	null	2025-03-11 01:56:26.026719	2025-03-11 01:56:26.026719
15404	2575	9	null	2025-03-11 01:56:26.092311	2025-03-11 01:56:26.092311
15405	2576	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:26.223836	2025-03-11 01:56:26.223836
15406	2576	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:26.289817	2025-03-11 01:56:26.289817
15407	2576	6	null	2025-03-11 01:56:26.355852	2025-03-11 01:56:26.355852
15408	2576	7	TRUE	2025-03-11 01:56:26.42158	2025-03-11 01:56:26.42158
15409	2576	8	null	2025-03-11 01:56:26.488233	2025-03-11 01:56:26.488233
15410	2576	9	null	2025-03-11 01:56:26.560646	2025-03-11 01:56:26.560646
15411	2577	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:26.6934	2025-03-11 01:56:26.6934
15412	2577	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:26.759234	2025-03-11 01:56:26.759234
15413	2577	6	null	2025-03-11 01:56:26.825265	2025-03-11 01:56:26.825265
15414	2577	7	TRUE	2025-03-11 01:56:26.891496	2025-03-11 01:56:26.891496
15415	2577	8	null	2025-03-11 01:56:26.957795	2025-03-11 01:56:26.957795
15416	2577	9	null	2025-03-11 01:56:27.0237	2025-03-11 01:56:27.0237
15417	2578	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:27.156562	2025-03-11 01:56:27.156562
15418	2578	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:27.222968	2025-03-11 01:56:27.222968
15419	2578	6	null	2025-03-11 01:56:27.288716	2025-03-11 01:56:27.288716
15420	2578	7	TRUE	2025-03-11 01:56:27.357042	2025-03-11 01:56:27.357042
15421	2578	8	null	2025-03-11 01:56:27.422938	2025-03-11 01:56:27.422938
15422	2578	9	null	2025-03-11 01:56:27.488941	2025-03-11 01:56:27.488941
15423	2579	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:27.620939	2025-03-11 01:56:27.620939
15424	2579	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:27.686977	2025-03-11 01:56:27.686977
15425	2579	6	null	2025-03-11 01:56:27.752849	2025-03-11 01:56:27.752849
15426	2579	7	TRUE	2025-03-11 01:56:27.81871	2025-03-11 01:56:27.81871
15427	2579	8	null	2025-03-11 01:56:27.884938	2025-03-11 01:56:27.884938
15428	2579	9	null	2025-03-11 01:56:27.951746	2025-03-11 01:56:27.951746
15429	2580	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:28.084131	2025-03-11 01:56:28.084131
15430	2580	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:28.15017	2025-03-11 01:56:28.15017
15431	2580	6	null	2025-03-11 01:56:28.215874	2025-03-11 01:56:28.215874
15432	2580	7	TRUE	2025-03-11 01:56:28.281702	2025-03-11 01:56:28.281702
15433	2580	8	null	2025-03-11 01:56:28.347536	2025-03-11 01:56:28.347536
15434	2580	9	null	2025-03-11 01:56:28.413303	2025-03-11 01:56:28.413303
15435	2581	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:28.545051	2025-03-11 01:56:28.545051
15436	2581	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:28.611093	2025-03-11 01:56:28.611093
15437	2581	6	null	2025-03-11 01:56:28.676828	2025-03-11 01:56:28.676828
15438	2581	7	FALSE	2025-03-11 01:56:28.742928	2025-03-11 01:56:28.742928
15439	2581	8	null	2025-03-11 01:56:28.809832	2025-03-11 01:56:28.809832
15440	2581	9	null	2025-03-11 01:56:28.87681	2025-03-11 01:56:28.87681
15441	2582	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:29.008738	2025-03-11 01:56:29.008738
15442	2582	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:29.075129	2025-03-11 01:56:29.075129
15443	2582	6	null	2025-03-11 01:56:29.140971	2025-03-11 01:56:29.140971
15444	2582	7	FALSE	2025-03-11 01:56:29.207089	2025-03-11 01:56:29.207089
15445	2582	8	null	2025-03-11 01:56:29.272909	2025-03-11 01:56:29.272909
15446	2582	9	null	2025-03-11 01:56:29.338662	2025-03-11 01:56:29.338662
15447	2583	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:29.470047	2025-03-11 01:56:29.470047
15448	2583	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:29.537734	2025-03-11 01:56:29.537734
15449	2583	6	null	2025-03-11 01:56:29.603657	2025-03-11 01:56:29.603657
15450	2583	7	FALSE	2025-03-11 01:56:29.670202	2025-03-11 01:56:29.670202
15451	2583	8	null	2025-03-11 01:56:29.736097	2025-03-11 01:56:29.736097
15452	2583	9	null	2025-03-11 01:56:29.802633	2025-03-11 01:56:29.802633
15453	2584	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:29.934824	2025-03-11 01:56:29.934824
15454	2584	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:30.000767	2025-03-11 01:56:30.000767
15455	2584	6	null	2025-03-11 01:56:30.066439	2025-03-11 01:56:30.066439
15456	2584	7	FALSE	2025-03-11 01:56:30.131713	2025-03-11 01:56:30.131713
15457	2584	8	null	2025-03-11 01:56:30.197524	2025-03-11 01:56:30.197524
15458	2584	9	null	2025-03-11 01:56:30.263386	2025-03-11 01:56:30.263386
15459	2585	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:30.394853	2025-03-11 01:56:30.394853
15460	2585	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:30.465818	2025-03-11 01:56:30.465818
15461	2585	6	null	2025-03-11 01:56:30.531641	2025-03-11 01:56:30.531641
15462	2585	7	FALSE	2025-03-11 01:56:30.597777	2025-03-11 01:56:30.597777
15463	2585	8	null	2025-03-11 01:56:30.663631	2025-03-11 01:56:30.663631
15464	2585	9	null	2025-03-11 01:56:30.729576	2025-03-11 01:56:30.729576
15465	2586	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:30.861755	2025-03-11 01:56:30.861755
15466	2586	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:30.927633	2025-03-11 01:56:30.927633
15467	2586	6	null	2025-03-11 01:56:30.99418	2025-03-11 01:56:30.99418
15468	2586	7	FALSE	2025-03-11 01:56:31.060126	2025-03-11 01:56:31.060126
15469	2586	8	null	2025-03-11 01:56:31.125891	2025-03-11 01:56:31.125891
15470	2586	9	null	2025-03-11 01:56:31.191584	2025-03-11 01:56:31.191584
15471	2587	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:31.323832	2025-03-11 01:56:31.323832
15472	2587	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:31.38949	2025-03-11 01:56:31.38949
15473	2587	6	null	2025-03-11 01:56:31.457587	2025-03-11 01:56:31.457587
15474	2587	7	FALSE	2025-03-11 01:56:31.523617	2025-03-11 01:56:31.523617
15475	2587	8	null	2025-03-11 01:56:31.589577	2025-03-11 01:56:31.589577
15476	2587	9	null	2025-03-11 01:56:31.655317	2025-03-11 01:56:31.655317
15477	2588	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:31.7895	2025-03-11 01:56:31.7895
15478	2588	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:31.856211	2025-03-11 01:56:31.856211
15479	2588	6	null	2025-03-11 01:56:31.92196	2025-03-11 01:56:31.92196
15480	2588	7	TRUE	2025-03-11 01:56:31.989448	2025-03-11 01:56:31.989448
15481	2588	8	null	2025-03-11 01:56:32.056815	2025-03-11 01:56:32.056815
15482	2588	9	null	2025-03-11 01:56:32.122804	2025-03-11 01:56:32.122804
15483	2589	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:32.254512	2025-03-11 01:56:32.254512
15484	2589	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:32.320316	2025-03-11 01:56:32.320316
15485	2589	6	null	2025-03-11 01:56:32.386704	2025-03-11 01:56:32.386704
15486	2589	7	FALSE	2025-03-11 01:56:32.452687	2025-03-11 01:56:32.452687
15487	2589	8	null	2025-03-11 01:56:32.518686	2025-03-11 01:56:32.518686
15488	2589	9	null	2025-03-11 01:56:32.597653	2025-03-11 01:56:32.597653
15489	2590	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:32.729747	2025-03-11 01:56:32.729747
15490	2590	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:32.795716	2025-03-11 01:56:32.795716
15491	2590	6	null	2025-03-11 01:56:32.861601	2025-03-11 01:56:32.861601
15492	2590	7	TRUE	2025-03-11 01:56:32.927495	2025-03-11 01:56:32.927495
15493	2590	8	null	2025-03-11 01:56:33.011083	2025-03-11 01:56:33.011083
15494	2590	9	null	2025-03-11 01:56:33.077149	2025-03-11 01:56:33.077149
15495	2591	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:33.209377	2025-03-11 01:56:33.209377
15496	2591	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:33.275313	2025-03-11 01:56:33.275313
15497	2591	6	null	2025-03-11 01:56:33.340344	2025-03-11 01:56:33.340344
15498	2591	7	FALSE	2025-03-11 01:56:33.406445	2025-03-11 01:56:33.406445
15499	2591	8	null	2025-03-11 01:56:33.473641	2025-03-11 01:56:33.473641
15500	2591	9	null	2025-03-11 01:56:33.538349	2025-03-11 01:56:33.538349
15501	2592	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:33.669945	2025-03-11 01:56:33.669945
15502	2592	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:33.735662	2025-03-11 01:56:33.735662
15503	2592	6	null	2025-03-11 01:56:33.801662	2025-03-11 01:56:33.801662
15504	2592	7	FALSE	2025-03-11 01:56:33.867192	2025-03-11 01:56:33.867192
15505	2592	8	null	2025-03-11 01:56:33.93324	2025-03-11 01:56:33.93324
15506	2592	9	null	2025-03-11 01:56:33.999213	2025-03-11 01:56:33.999213
15507	2593	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:34.131817	2025-03-11 01:56:34.131817
15508	2593	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:34.19748	2025-03-11 01:56:34.19748
15509	2593	6	null	2025-03-11 01:56:34.263702	2025-03-11 01:56:34.263702
15510	2593	7	FALSE	2025-03-11 01:56:34.329608	2025-03-11 01:56:34.329608
15511	2593	8	null	2025-03-11 01:56:34.396263	2025-03-11 01:56:34.396263
15512	2593	9	null	2025-03-11 01:56:34.461324	2025-03-11 01:56:34.461324
15513	2594	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:34.597106	2025-03-11 01:56:34.597106
15514	2594	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:34.663501	2025-03-11 01:56:34.663501
15515	2594	6	null	2025-03-11 01:56:34.729913	2025-03-11 01:56:34.729913
15516	2594	7	FALSE	2025-03-11 01:56:34.795771	2025-03-11 01:56:34.795771
15517	2594	8	null	2025-03-11 01:56:34.861885	2025-03-11 01:56:34.861885
15518	2594	9	null	2025-03-11 01:56:34.927591	2025-03-11 01:56:34.927591
15519	2595	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:35.059212	2025-03-11 01:56:35.059212
15520	2595	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:35.125216	2025-03-11 01:56:35.125216
15521	2595	6	null	2025-03-11 01:56:35.191471	2025-03-11 01:56:35.191471
15522	2595	7	FALSE	2025-03-11 01:56:35.257669	2025-03-11 01:56:35.257669
15523	2595	8	null	2025-03-11 01:56:35.354519	2025-03-11 01:56:35.354519
15524	2595	9	null	2025-03-11 01:56:35.421876	2025-03-11 01:56:35.421876
15525	2596	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:35.553974	2025-03-11 01:56:35.553974
15526	2596	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:35.619711	2025-03-11 01:56:35.619711
15527	2596	6	null	2025-03-11 01:56:35.685498	2025-03-11 01:56:35.685498
15528	2596	7	FALSE	2025-03-11 01:56:35.751813	2025-03-11 01:56:35.751813
15529	2596	8	null	2025-03-11 01:56:35.817627	2025-03-11 01:56:35.817627
15530	2596	9	null	2025-03-11 01:56:35.883756	2025-03-11 01:56:35.883756
15531	2597	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:36.015769	2025-03-11 01:56:36.015769
15532	2597	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:36.081549	2025-03-11 01:56:36.081549
15533	2597	6	null	2025-03-11 01:56:36.147549	2025-03-11 01:56:36.147549
15534	2597	7	FALSE	2025-03-11 01:56:36.213477	2025-03-11 01:56:36.213477
15535	2597	8	null	2025-03-11 01:56:36.280349	2025-03-11 01:56:36.280349
15536	2597	9	null	2025-03-11 01:56:36.352654	2025-03-11 01:56:36.352654
15537	2598	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:36.484711	2025-03-11 01:56:36.484711
15538	2598	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:36.551185	2025-03-11 01:56:36.551185
15539	2598	6	null	2025-03-11 01:56:36.617627	2025-03-11 01:56:36.617627
15540	2598	7	FALSE	2025-03-11 01:56:36.683505	2025-03-11 01:56:36.683505
15541	2598	8	null	2025-03-11 01:56:36.749358	2025-03-11 01:56:36.749358
15542	2598	9	null	2025-03-11 01:56:36.815153	2025-03-11 01:56:36.815153
15543	2599	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:36.947001	2025-03-11 01:56:36.947001
15544	2599	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:37.012916	2025-03-11 01:56:37.012916
15545	2599	6	null	2025-03-11 01:56:37.078643	2025-03-11 01:56:37.078643
15546	2599	7	TRUE	2025-03-11 01:56:37.144617	2025-03-11 01:56:37.144617
15547	2599	8	null	2025-03-11 01:56:37.21157	2025-03-11 01:56:37.21157
15548	2599	9	null	2025-03-11 01:56:37.278379	2025-03-11 01:56:37.278379
15549	2600	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:37.410483	2025-03-11 01:56:37.410483
15550	2600	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:37.481976	2025-03-11 01:56:37.481976
15551	2600	6	null	2025-03-11 01:56:37.547815	2025-03-11 01:56:37.547815
15552	2600	7	TRUE	2025-03-11 01:56:37.614364	2025-03-11 01:56:37.614364
15553	2600	8	null	2025-03-11 01:56:37.680321	2025-03-11 01:56:37.680321
15554	2600	9	null	2025-03-11 01:56:37.746364	2025-03-11 01:56:37.746364
15555	2601	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:37.883332	2025-03-11 01:56:37.883332
15556	2601	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:37.949069	2025-03-11 01:56:37.949069
15557	2601	6	null	2025-03-11 01:56:38.020558	2025-03-11 01:56:38.020558
15558	2601	7	TRUE	2025-03-11 01:56:38.087	2025-03-11 01:56:38.087
15559	2601	8	null	2025-03-11 01:56:38.152914	2025-03-11 01:56:38.152914
15560	2601	9	null	2025-03-11 01:56:38.218695	2025-03-11 01:56:38.218695
15561	2602	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:38.350531	2025-03-11 01:56:38.350531
15562	2602	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:38.416739	2025-03-11 01:56:38.416739
15563	2602	6	null	2025-03-11 01:56:38.485491	2025-03-11 01:56:38.485491
15564	2602	7	TRUE	2025-03-11 01:56:38.551491	2025-03-11 01:56:38.551491
15565	2602	8	null	2025-03-11 01:56:38.617683	2025-03-11 01:56:38.617683
15566	2602	9	null	2025-03-11 01:56:38.685655	2025-03-11 01:56:38.685655
15567	2603	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:38.817566	2025-03-11 01:56:38.817566
15568	2603	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:38.883284	2025-03-11 01:56:38.883284
15569	2603	6	null	2025-03-11 01:56:38.948977	2025-03-11 01:56:38.948977
15570	2603	7	TRUE	2025-03-11 01:56:39.01502	2025-03-11 01:56:39.01502
15571	2603	8	null	2025-03-11 01:56:39.080877	2025-03-11 01:56:39.080877
15572	2603	9	null	2025-03-11 01:56:39.147057	2025-03-11 01:56:39.147057
15573	2604	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:39.278761	2025-03-11 01:56:39.278761
15574	2604	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:39.344576	2025-03-11 01:56:39.344576
15575	2604	6	null	2025-03-11 01:56:39.411113	2025-03-11 01:56:39.411113
15576	2604	7	TRUE	2025-03-11 01:56:39.476912	2025-03-11 01:56:39.476912
15577	2604	8	null	2025-03-11 01:56:39.542913	2025-03-11 01:56:39.542913
15578	2604	9	null	2025-03-11 01:56:39.609008	2025-03-11 01:56:39.609008
15579	2605	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:39.74129	2025-03-11 01:56:39.74129
15580	2605	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:39.807115	2025-03-11 01:56:39.807115
15581	2605	6	null	2025-03-11 01:56:39.87308	2025-03-11 01:56:39.87308
15582	2605	7	TRUE	2025-03-11 01:56:39.939201	2025-03-11 01:56:39.939201
15583	2605	8	null	2025-03-11 01:56:40.00477	2025-03-11 01:56:40.00477
15584	2605	9	null	2025-03-11 01:56:40.070855	2025-03-11 01:56:40.070855
15585	2606	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:40.203594	2025-03-11 01:56:40.203594
15586	2606	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:40.269625	2025-03-11 01:56:40.269625
15587	2606	6	null	2025-03-11 01:56:40.337427	2025-03-11 01:56:40.337427
15588	2606	7	TRUE	2025-03-11 01:56:40.403415	2025-03-11 01:56:40.403415
15589	2606	8	null	2025-03-11 01:56:40.469433	2025-03-11 01:56:40.469433
15590	2606	9	null	2025-03-11 01:56:40.535166	2025-03-11 01:56:40.535166
15591	2607	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:40.667244	2025-03-11 01:56:40.667244
15592	2607	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:40.733107	2025-03-11 01:56:40.733107
15593	2607	6	null	2025-03-11 01:56:40.800743	2025-03-11 01:56:40.800743
15594	2607	7	FALSE	2025-03-11 01:56:40.867632	2025-03-11 01:56:40.867632
15595	2607	8	null	2025-03-11 01:56:40.933968	2025-03-11 01:56:40.933968
15596	2607	9	null	2025-03-11 01:56:40.999687	2025-03-11 01:56:40.999687
15597	2608	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:41.136126	2025-03-11 01:56:41.136126
15598	2608	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:41.202151	2025-03-11 01:56:41.202151
15599	2608	6	null	2025-03-11 01:56:41.268887	2025-03-11 01:56:41.268887
15600	2608	7	TRUE	2025-03-11 01:56:41.334664	2025-03-11 01:56:41.334664
15601	2608	8	null	2025-03-11 01:56:41.399777	2025-03-11 01:56:41.399777
15602	2608	9	null	2025-03-11 01:56:41.466704	2025-03-11 01:56:41.466704
15603	2609	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:41.597343	2025-03-11 01:56:41.597343
15604	2609	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:41.663398	2025-03-11 01:56:41.663398
15605	2609	6	null	2025-03-11 01:56:41.729448	2025-03-11 01:56:41.729448
15606	2609	7	FALSE	2025-03-11 01:56:41.795289	2025-03-11 01:56:41.795289
15607	2609	8	null	2025-03-11 01:56:41.86105	2025-03-11 01:56:41.86105
15608	2609	9	null	2025-03-11 01:56:41.928216	2025-03-11 01:56:41.928216
15609	2610	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:42.059959	2025-03-11 01:56:42.059959
15610	2610	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:42.126412	2025-03-11 01:56:42.126412
15611	2610	6	null	2025-03-11 01:56:42.192488	2025-03-11 01:56:42.192488
15612	2610	7	FALSE	2025-03-11 01:56:42.258513	2025-03-11 01:56:42.258513
15613	2610	8	null	2025-03-11 01:56:42.324276	2025-03-11 01:56:42.324276
15614	2610	9	null	2025-03-11 01:56:42.389941	2025-03-11 01:56:42.389941
15615	2611	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:42.521655	2025-03-11 01:56:42.521655
15616	2611	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:42.58787	2025-03-11 01:56:42.58787
15617	2611	6	null	2025-03-11 01:56:42.654587	2025-03-11 01:56:42.654587
15618	2611	7	FALSE	2025-03-11 01:56:42.75035	2025-03-11 01:56:42.75035
15619	2611	8	null	2025-03-11 01:56:42.816316	2025-03-11 01:56:42.816316
15620	2611	9	null	2025-03-11 01:56:42.882246	2025-03-11 01:56:42.882246
15621	2612	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:43.013589	2025-03-11 01:56:43.013589
15622	2612	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:43.079825	2025-03-11 01:56:43.079825
15623	2612	6	null	2025-03-11 01:56:43.146399	2025-03-11 01:56:43.146399
15624	2612	7	FALSE	2025-03-11 01:56:43.212896	2025-03-11 01:56:43.212896
15625	2612	8	null	2025-03-11 01:56:43.278941	2025-03-11 01:56:43.278941
15626	2612	9	null	2025-03-11 01:56:43.345331	2025-03-11 01:56:43.345331
15627	2613	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:43.476773	2025-03-11 01:56:43.476773
15628	2613	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:43.54343	2025-03-11 01:56:43.54343
15629	2613	6	null	2025-03-11 01:56:43.609247	2025-03-11 01:56:43.609247
15630	2613	7	FALSE	2025-03-11 01:56:43.674917	2025-03-11 01:56:43.674917
15631	2613	8	null	2025-03-11 01:56:43.741895	2025-03-11 01:56:43.741895
15632	2613	9	null	2025-03-11 01:56:43.808399	2025-03-11 01:56:43.808399
15633	2614	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:43.940146	2025-03-11 01:56:43.940146
15634	2614	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:44.0063	2025-03-11 01:56:44.0063
15635	2614	6	null	2025-03-11 01:56:44.07229	2025-03-11 01:56:44.07229
15636	2614	7	TRUE	2025-03-11 01:56:44.138343	2025-03-11 01:56:44.138343
15637	2614	8	null	2025-03-11 01:56:44.205123	2025-03-11 01:56:44.205123
15638	2614	9	null	2025-03-11 01:56:44.270848	2025-03-11 01:56:44.270848
15639	2615	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:44.402882	2025-03-11 01:56:44.402882
15640	2615	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:44.468722	2025-03-11 01:56:44.468722
15641	2615	6	null	2025-03-11 01:56:44.534572	2025-03-11 01:56:44.534572
15642	2615	7	TRUE	2025-03-11 01:56:44.600574	2025-03-11 01:56:44.600574
15643	2615	8	null	2025-03-11 01:56:44.676796	2025-03-11 01:56:44.676796
15644	2615	9	null	2025-03-11 01:56:44.742998	2025-03-11 01:56:44.742998
15645	2616	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:44.874531	2025-03-11 01:56:44.874531
15646	2616	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:44.940214	2025-03-11 01:56:44.940214
15647	2616	6	null	2025-03-11 01:56:45.008383	2025-03-11 01:56:45.008383
15648	2616	7	FALSE	2025-03-11 01:56:45.074082	2025-03-11 01:56:45.074082
15649	2616	8	null	2025-03-11 01:56:45.140319	2025-03-11 01:56:45.140319
15650	2616	9	null	2025-03-11 01:56:45.206048	2025-03-11 01:56:45.206048
15651	2617	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:45.341045	2025-03-11 01:56:45.341045
15652	2617	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:45.407309	2025-03-11 01:56:45.407309
15653	2617	6	null	2025-03-11 01:56:45.473134	2025-03-11 01:56:45.473134
15654	2617	7	TRUE	2025-03-11 01:56:45.538537	2025-03-11 01:56:45.538537
15655	2617	8	null	2025-03-11 01:56:45.604722	2025-03-11 01:56:45.604722
15656	2617	9	null	2025-03-11 01:56:45.671428	2025-03-11 01:56:45.671428
15657	2618	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:45.806538	2025-03-11 01:56:45.806538
15658	2618	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:45.872173	2025-03-11 01:56:45.872173
15659	2618	6	null	2025-03-11 01:56:45.937827	2025-03-11 01:56:45.937827
15660	2618	7	FALSE	2025-03-11 01:56:46.003704	2025-03-11 01:56:46.003704
15661	2618	8	null	2025-03-11 01:56:46.069903	2025-03-11 01:56:46.069903
15662	2618	9	null	2025-03-11 01:56:46.136101	2025-03-11 01:56:46.136101
15663	2619	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:46.268339	2025-03-11 01:56:46.268339
15664	2619	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:46.334129	2025-03-11 01:56:46.334129
15665	2619	6	null	2025-03-11 01:56:46.400983	2025-03-11 01:56:46.400983
15666	2619	7	TRUE	2025-03-11 01:56:46.467262	2025-03-11 01:56:46.467262
15667	2619	8	null	2025-03-11 01:56:46.53334	2025-03-11 01:56:46.53334
15668	2619	9	null	2025-03-11 01:56:46.598669	2025-03-11 01:56:46.598669
15669	2620	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:46.731034	2025-03-11 01:56:46.731034
15670	2620	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:46.7969	2025-03-11 01:56:46.7969
15671	2620	6	null	2025-03-11 01:56:46.862939	2025-03-11 01:56:46.862939
15672	2620	7	FALSE	2025-03-11 01:56:46.928866	2025-03-11 01:56:46.928866
15673	2620	8	null	2025-03-11 01:56:46.994993	2025-03-11 01:56:46.994993
15674	2620	9	null	2025-03-11 01:56:47.061348	2025-03-11 01:56:47.061348
15675	2621	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:47.193173	2025-03-11 01:56:47.193173
15676	2621	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:47.258884	2025-03-11 01:56:47.258884
15677	2621	6	null	2025-03-11 01:56:47.324787	2025-03-11 01:56:47.324787
15678	2621	7	FALSE	2025-03-11 01:56:47.390577	2025-03-11 01:56:47.390577
15679	2621	8	null	2025-03-11 01:56:47.456242	2025-03-11 01:56:47.456242
15680	2621	9	null	2025-03-11 01:56:47.522017	2025-03-11 01:56:47.522017
15681	2622	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:47.653466	2025-03-11 01:56:47.653466
15682	2622	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:47.719498	2025-03-11 01:56:47.719498
15683	2622	6	null	2025-03-11 01:56:47.785304	2025-03-11 01:56:47.785304
15684	2622	7	TRUE	2025-03-11 01:56:47.850952	2025-03-11 01:56:47.850952
15685	2622	8	null	2025-03-11 01:56:47.916839	2025-03-11 01:56:47.916839
15686	2622	9	null	2025-03-11 01:56:47.982652	2025-03-11 01:56:47.982652
15687	2623	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:48.114169	2025-03-11 01:56:48.114169
15688	2623	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:48.179787	2025-03-11 01:56:48.179787
15689	2623	6	null	2025-03-11 01:56:48.24546	2025-03-11 01:56:48.24546
15690	2623	7	FALSE	2025-03-11 01:56:48.311359	2025-03-11 01:56:48.311359
15691	2623	8	null	2025-03-11 01:56:48.377146	2025-03-11 01:56:48.377146
15692	2623	9	null	2025-03-11 01:56:48.442862	2025-03-11 01:56:48.442862
15693	2624	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:48.574614	2025-03-11 01:56:48.574614
15694	2624	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:48.64069	2025-03-11 01:56:48.64069
15695	2624	6	null	2025-03-11 01:56:48.705599	2025-03-11 01:56:48.705599
15696	2624	7	TRUE	2025-03-11 01:56:48.771362	2025-03-11 01:56:48.771362
15697	2624	8	null	2025-03-11 01:56:48.837253	2025-03-11 01:56:48.837253
15698	2624	9	null	2025-03-11 01:56:48.9029	2025-03-11 01:56:48.9029
15699	2625	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:49.03457	2025-03-11 01:56:49.03457
15700	2625	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:49.100369	2025-03-11 01:56:49.100369
15701	2625	6	null	2025-03-11 01:56:49.166311	2025-03-11 01:56:49.166311
15702	2625	7	TRUE	2025-03-11 01:56:49.231979	2025-03-11 01:56:49.231979
15703	2625	8	null	2025-03-11 01:56:49.298939	2025-03-11 01:56:49.298939
15704	2625	9	null	2025-03-11 01:56:49.364672	2025-03-11 01:56:49.364672
15705	2626	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:49.497907	2025-03-11 01:56:49.497907
15706	2626	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:49.563697	2025-03-11 01:56:49.563697
15707	2626	6	null	2025-03-11 01:56:49.629563	2025-03-11 01:56:49.629563
15708	2626	7	TRUE	2025-03-11 01:56:49.695447	2025-03-11 01:56:49.695447
15709	2626	8	null	2025-03-11 01:56:49.761053	2025-03-11 01:56:49.761053
15710	2626	9	null	2025-03-11 01:56:49.826993	2025-03-11 01:56:49.826993
15711	2627	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:49.960771	2025-03-11 01:56:49.960771
15712	2627	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:56:50.026758	2025-03-11 01:56:50.026758
15713	2627	6	null	2025-03-11 01:56:50.092676	2025-03-11 01:56:50.092676
15714	2627	7	TRUE	2025-03-11 01:56:50.15923	2025-03-11 01:56:50.15923
15715	2627	8	null	2025-03-11 01:56:50.225037	2025-03-11 01:56:50.225037
15716	2627	9	null	2025-03-11 01:56:50.29198	2025-03-11 01:56:50.29198
15717	2628	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:50.424354	2025-03-11 01:56:50.424354
15718	2628	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:50.490331	2025-03-11 01:56:50.490331
15719	2628	6	null	2025-03-11 01:56:50.559103	2025-03-11 01:56:50.559103
15720	2628	7	FALSE	2025-03-11 01:56:50.625154	2025-03-11 01:56:50.625154
15721	2628	8	null	2025-03-11 01:56:50.691537	2025-03-11 01:56:50.691537
15722	2628	9	null	2025-03-11 01:56:50.757715	2025-03-11 01:56:50.757715
15723	2629	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:50.889793	2025-03-11 01:56:50.889793
15724	2629	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:50.957611	2025-03-11 01:56:50.957611
15725	2629	6	null	2025-03-11 01:56:51.02378	2025-03-11 01:56:51.02378
15726	2629	7	FALSE	2025-03-11 01:56:51.08959	2025-03-11 01:56:51.08959
15727	2629	8	null	2025-03-11 01:56:51.15536	2025-03-11 01:56:51.15536
15728	2629	9	null	2025-03-11 01:56:51.220978	2025-03-11 01:56:51.220978
15729	2630	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:51.352564	2025-03-11 01:56:51.352564
15730	2630	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:56:51.418321	2025-03-11 01:56:51.418321
15731	2630	6	null	2025-03-11 01:56:51.48385	2025-03-11 01:56:51.48385
15732	2630	7	FALSE	2025-03-11 01:56:51.549693	2025-03-11 01:56:51.549693
15733	2630	8	null	2025-03-11 01:56:51.615294	2025-03-11 01:56:51.615294
15734	2630	9	null	2025-03-11 01:56:51.681334	2025-03-11 01:56:51.681334
15735	2631	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:51.826686	2025-03-11 01:56:51.826686
15736	2631	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:51.892581	2025-03-11 01:56:51.892581
15737	2631	6	null	2025-03-11 01:56:51.959153	2025-03-11 01:56:51.959153
15738	2631	7	TRUE	2025-03-11 01:56:52.024875	2025-03-11 01:56:52.024875
15739	2631	8	null	2025-03-11 01:56:52.090862	2025-03-11 01:56:52.090862
15740	2631	9	null	2025-03-11 01:56:52.156609	2025-03-11 01:56:52.156609
15741	2632	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:52.28853	2025-03-11 01:56:52.28853
15742	2632	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:52.354482	2025-03-11 01:56:52.354482
15743	2632	6	null	2025-03-11 01:56:52.421259	2025-03-11 01:56:52.421259
15744	2632	7	TRUE	2025-03-11 01:56:52.487197	2025-03-11 01:56:52.487197
15745	2632	8	null	2025-03-11 01:56:52.553743	2025-03-11 01:56:52.553743
15746	2632	9	null	2025-03-11 01:56:52.619477	2025-03-11 01:56:52.619477
15747	2633	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:52.751712	2025-03-11 01:56:52.751712
15748	2633	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:52.81754	2025-03-11 01:56:52.81754
15749	2633	6	null	2025-03-11 01:56:52.883278	2025-03-11 01:56:52.883278
15750	2633	7	TRUE	2025-03-11 01:56:52.948675	2025-03-11 01:56:52.948675
15751	2633	8	null	2025-03-11 01:56:53.014385	2025-03-11 01:56:53.014385
15752	2633	9	null	2025-03-11 01:56:53.080012	2025-03-11 01:56:53.080012
15753	2634	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:53.21221	2025-03-11 01:56:53.21221
15754	2634	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:53.277823	2025-03-11 01:56:53.277823
15755	2634	6	null	2025-03-11 01:56:53.343503	2025-03-11 01:56:53.343503
15756	2634	7	TRUE	2025-03-11 01:56:53.409144	2025-03-11 01:56:53.409144
15757	2634	8	null	2025-03-11 01:56:53.474927	2025-03-11 01:56:53.474927
15758	2634	9	null	2025-03-11 01:56:53.540532	2025-03-11 01:56:53.540532
15759	2635	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:53.673961	2025-03-11 01:56:53.673961
15760	2635	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:53.742936	2025-03-11 01:56:53.742936
15761	2635	6	null	2025-03-11 01:56:53.811877	2025-03-11 01:56:53.811877
15762	2635	7	TRUE	2025-03-11 01:56:53.877708	2025-03-11 01:56:53.877708
15763	2635	8	null	2025-03-11 01:56:53.943587	2025-03-11 01:56:53.943587
15764	2635	9	null	2025-03-11 01:56:54.00854	2025-03-11 01:56:54.00854
15765	2636	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:54.1399	2025-03-11 01:56:54.1399
15766	2636	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:54.205978	2025-03-11 01:56:54.205978
15767	2636	6	null	2025-03-11 01:56:54.272213	2025-03-11 01:56:54.272213
15768	2636	7	TRUE	2025-03-11 01:56:54.338019	2025-03-11 01:56:54.338019
15769	2636	8	null	2025-03-11 01:56:54.404301	2025-03-11 01:56:54.404301
15770	2636	9	null	2025-03-11 01:56:54.475056	2025-03-11 01:56:54.475056
15771	2637	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:54.607642	2025-03-11 01:56:54.607642
15772	2637	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:54.673668	2025-03-11 01:56:54.673668
15773	2637	6	null	2025-03-11 01:56:54.739499	2025-03-11 01:56:54.739499
15774	2637	7	TRUE	2025-03-11 01:56:54.805579	2025-03-11 01:56:54.805579
15775	2637	8	null	2025-03-11 01:56:54.871473	2025-03-11 01:56:54.871473
15776	2637	9	null	2025-03-11 01:56:54.937243	2025-03-11 01:56:54.937243
15777	2638	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:55.068956	2025-03-11 01:56:55.068956
15778	2638	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:55.135024	2025-03-11 01:56:55.135024
15779	2638	6	null	2025-03-11 01:56:55.200953	2025-03-11 01:56:55.200953
15780	2638	7	TRUE	2025-03-11 01:56:55.267912	2025-03-11 01:56:55.267912
15781	2638	8	null	2025-03-11 01:56:55.333977	2025-03-11 01:56:55.333977
15782	2638	9	null	2025-03-11 01:56:55.400573	2025-03-11 01:56:55.400573
15783	2639	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:56:55.532849	2025-03-11 01:56:55.532849
15784	2639	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:56:55.598618	2025-03-11 01:56:55.598618
15785	2639	6	null	2025-03-11 01:56:55.664329	2025-03-11 01:56:55.664329
15786	2639	7	TRUE	2025-03-11 01:56:55.730404	2025-03-11 01:56:55.730404
15787	2639	8	null	2025-03-11 01:56:55.796305	2025-03-11 01:56:55.796305
15788	2639	9	null	2025-03-11 01:56:55.862168	2025-03-11 01:56:55.862168
15789	2640	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:55.993822	2025-03-11 01:56:55.993822
15790	2640	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:56.06009	2025-03-11 01:56:56.06009
15791	2640	6	null	2025-03-11 01:56:56.12612	2025-03-11 01:56:56.12612
15792	2640	7	TRUE	2025-03-11 01:56:56.191918	2025-03-11 01:56:56.191918
15793	2640	8	null	2025-03-11 01:56:56.259512	2025-03-11 01:56:56.259512
15794	2640	9	null	2025-03-11 01:56:56.328178	2025-03-11 01:56:56.328178
15795	2641	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:56.461076	2025-03-11 01:56:56.461076
15796	2641	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:56.527027	2025-03-11 01:56:56.527027
15797	2641	6	null	2025-03-11 01:56:56.592861	2025-03-11 01:56:56.592861
15798	2641	7	FALSE	2025-03-11 01:56:56.664025	2025-03-11 01:56:56.664025
15799	2641	8	null	2025-03-11 01:56:56.731781	2025-03-11 01:56:56.731781
15800	2641	9	null	2025-03-11 01:56:56.797772	2025-03-11 01:56:56.797772
15801	2642	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:56.932489	2025-03-11 01:56:56.932489
15802	2642	5	457699e6905d71896eb72fd2e034fffc	2025-03-11 01:56:56.998598	2025-03-11 01:56:56.998598
15803	2642	6	null	2025-03-11 01:56:57.064911	2025-03-11 01:56:57.064911
15804	2642	7	FALSE	2025-03-11 01:56:57.131292	2025-03-11 01:56:57.131292
15805	2642	8	null	2025-03-11 01:56:57.197588	2025-03-11 01:56:57.197588
15806	2642	9	null	2025-03-11 01:56:57.264424	2025-03-11 01:56:57.264424
15807	2643	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:57.395409	2025-03-11 01:56:57.395409
15808	2643	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:57.46152	2025-03-11 01:56:57.46152
15809	2643	6	null	2025-03-11 01:56:57.527235	2025-03-11 01:56:57.527235
15810	2643	7	TRUE	2025-03-11 01:56:57.592806	2025-03-11 01:56:57.592806
15811	2643	8	null	2025-03-11 01:56:57.658907	2025-03-11 01:56:57.658907
15812	2643	9	null	2025-03-11 01:56:57.724644	2025-03-11 01:56:57.724644
15813	2644	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:57.856146	2025-03-11 01:56:57.856146
15814	2644	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:57.923519	2025-03-11 01:56:57.923519
15815	2644	6	null	2025-03-11 01:56:57.988979	2025-03-11 01:56:57.988979
15816	2644	7	TRUE	2025-03-11 01:56:58.054525	2025-03-11 01:56:58.054525
15817	2644	8	null	2025-03-11 01:56:58.12043	2025-03-11 01:56:58.12043
15818	2644	9	null	2025-03-11 01:56:58.185915	2025-03-11 01:56:58.185915
15819	2645	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:58.317321	2025-03-11 01:56:58.317321
15820	2645	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:56:58.383005	2025-03-11 01:56:58.383005
15821	2645	6	null	2025-03-11 01:56:58.44868	2025-03-11 01:56:58.44868
15822	2645	7	TRUE	2025-03-11 01:56:58.514336	2025-03-11 01:56:58.514336
15823	2645	8	null	2025-03-11 01:56:58.602401	2025-03-11 01:56:58.602401
15824	2645	9	null	2025-03-11 01:56:58.667937	2025-03-11 01:56:58.667937
15825	2646	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:58.799366	2025-03-11 01:56:58.799366
15826	2646	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:58.86501	2025-03-11 01:56:58.86501
15827	2646	6	null	2025-03-11 01:56:58.930856	2025-03-11 01:56:58.930856
15828	2646	7	FALSE	2025-03-11 01:56:58.996609	2025-03-11 01:56:58.996609
15829	2646	8	null	2025-03-11 01:56:59.062877	2025-03-11 01:56:59.062877
15830	2646	9	null	2025-03-11 01:56:59.128667	2025-03-11 01:56:59.128667
15831	2647	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:59.263706	2025-03-11 01:56:59.263706
15832	2647	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:59.329541	2025-03-11 01:56:59.329541
15833	2647	6	null	2025-03-11 01:56:59.39532	2025-03-11 01:56:59.39532
15834	2647	7	FALSE	2025-03-11 01:56:59.46218	2025-03-11 01:56:59.46218
15835	2647	8	null	2025-03-11 01:56:59.529986	2025-03-11 01:56:59.529986
15836	2647	9	null	2025-03-11 01:56:59.599949	2025-03-11 01:56:59.599949
15837	2648	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:56:59.731668	2025-03-11 01:56:59.731668
15838	2648	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:56:59.801647	2025-03-11 01:56:59.801647
15839	2648	6	null	2025-03-11 01:56:59.867601	2025-03-11 01:56:59.867601
15840	2648	7	FALSE	2025-03-11 01:56:59.933568	2025-03-11 01:56:59.933568
15841	2648	8	null	2025-03-11 01:56:59.999688	2025-03-11 01:56:59.999688
15842	2648	9	null	2025-03-11 01:57:00.066774	2025-03-11 01:57:00.066774
15843	2649	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:00.199689	2025-03-11 01:57:00.199689
15844	2649	5	0c03f24141217aa9d3cffee545b39569	2025-03-11 01:57:00.265659	2025-03-11 01:57:00.265659
15845	2649	6	null	2025-03-11 01:57:00.33154	2025-03-11 01:57:00.33154
15846	2649	7	FALSE	2025-03-11 01:57:00.397282	2025-03-11 01:57:00.397282
15847	2649	8	null	2025-03-11 01:57:00.463343	2025-03-11 01:57:00.463343
15848	2649	9	null	2025-03-11 01:57:00.529135	2025-03-11 01:57:00.529135
15849	2650	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:00.660899	2025-03-11 01:57:00.660899
15850	2650	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:57:00.726972	2025-03-11 01:57:00.726972
15851	2650	6	null	2025-03-11 01:57:00.792778	2025-03-11 01:57:00.792778
15852	2650	7	TRUE	2025-03-11 01:57:00.85867	2025-03-11 01:57:00.85867
15853	2650	8	null	2025-03-11 01:57:00.923338	2025-03-11 01:57:00.923338
15854	2650	9	null	2025-03-11 01:57:00.989079	2025-03-11 01:57:00.989079
15855	2651	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:01.122205	2025-03-11 01:57:01.122205
15856	2651	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:01.187847	2025-03-11 01:57:01.187847
15857	2651	6	null	2025-03-11 01:57:01.253629	2025-03-11 01:57:01.253629
15858	2651	7	TRUE	2025-03-11 01:57:01.319363	2025-03-11 01:57:01.319363
15859	2651	8	null	2025-03-11 01:57:01.385221	2025-03-11 01:57:01.385221
15860	2651	9	null	2025-03-11 01:57:01.451201	2025-03-11 01:57:01.451201
15861	2652	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:01.585975	2025-03-11 01:57:01.585975
15862	2652	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:01.651368	2025-03-11 01:57:01.651368
15863	2652	6	null	2025-03-11 01:57:01.717376	2025-03-11 01:57:01.717376
15864	2652	7	TRUE	2025-03-11 01:57:01.78317	2025-03-11 01:57:01.78317
15865	2652	8	null	2025-03-11 01:57:01.849055	2025-03-11 01:57:01.849055
15866	2652	9	null	2025-03-11 01:57:01.915004	2025-03-11 01:57:01.915004
15867	2653	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:02.046909	2025-03-11 01:57:02.046909
15868	2653	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:02.11297	2025-03-11 01:57:02.11297
15869	2653	6	null	2025-03-11 01:57:02.178939	2025-03-11 01:57:02.178939
15870	2653	7	TRUE	2025-03-11 01:57:02.244918	2025-03-11 01:57:02.244918
15871	2653	8	null	2025-03-11 01:57:02.311266	2025-03-11 01:57:02.311266
15872	2653	9	null	2025-03-11 01:57:02.378007	2025-03-11 01:57:02.378007
15873	2654	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:57:02.51009	2025-03-11 01:57:02.51009
15874	2654	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:57:02.575909	2025-03-11 01:57:02.575909
15875	2654	6	null	2025-03-11 01:57:02.64515	2025-03-11 01:57:02.64515
15876	2654	7	TRUE	2025-03-11 01:57:02.710862	2025-03-11 01:57:02.710862
15877	2654	8	null	2025-03-11 01:57:02.776746	2025-03-11 01:57:02.776746
15878	2654	9	null	2025-03-11 01:57:02.842624	2025-03-11 01:57:02.842624
15879	2655	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:02.974742	2025-03-11 01:57:02.974742
15880	2655	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:03.041308	2025-03-11 01:57:03.041308
15881	2655	6	null	2025-03-11 01:57:03.10747	2025-03-11 01:57:03.10747
15882	2655	7	TRUE	2025-03-11 01:57:03.173553	2025-03-11 01:57:03.173553
15883	2655	8	null	2025-03-11 01:57:03.246392	2025-03-11 01:57:03.246392
15884	2655	9	null	2025-03-11 01:57:03.312317	2025-03-11 01:57:03.312317
15885	2656	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:57:03.444068	2025-03-11 01:57:03.444068
15886	2656	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:57:03.509851	2025-03-11 01:57:03.509851
15887	2656	6	null	2025-03-11 01:57:03.57598	2025-03-11 01:57:03.57598
15888	2656	7	TRUE	2025-03-11 01:57:03.641741	2025-03-11 01:57:03.641741
15889	2656	8	null	2025-03-11 01:57:03.708642	2025-03-11 01:57:03.708642
15890	2656	9	null	2025-03-11 01:57:03.775263	2025-03-11 01:57:03.775263
15891	2657	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:03.907289	2025-03-11 01:57:03.907289
15892	2657	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:03.973082	2025-03-11 01:57:03.973082
15893	2657	6	null	2025-03-11 01:57:04.044948	2025-03-11 01:57:04.044948
15894	2657	7	TRUE	2025-03-11 01:57:04.112072	2025-03-11 01:57:04.112072
15895	2657	8	null	2025-03-11 01:57:04.179429	2025-03-11 01:57:04.179429
15896	2657	9	null	2025-03-11 01:57:04.245103	2025-03-11 01:57:04.245103
15897	2658	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:04.377272	2025-03-11 01:57:04.377272
15898	2658	5	fbdf768a220241ca737a6b0cd83644cc	2025-03-11 01:57:04.44367	2025-03-11 01:57:04.44367
15899	2658	6	null	2025-03-11 01:57:04.509458	2025-03-11 01:57:04.509458
15900	2658	7	TRUE	2025-03-11 01:57:04.575585	2025-03-11 01:57:04.575585
15901	2658	8	null	2025-03-11 01:57:04.641462	2025-03-11 01:57:04.641462
15902	2658	9	null	2025-03-11 01:57:04.707766	2025-03-11 01:57:04.707766
15903	2659	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:57:04.839318	2025-03-11 01:57:04.839318
15904	2659	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:57:04.904864	2025-03-11 01:57:04.904864
15905	2659	6	null	2025-03-11 01:57:04.970788	2025-03-11 01:57:04.970788
15906	2659	7	TRUE	2025-03-11 01:57:05.03653	2025-03-11 01:57:05.03653
15907	2659	8	null	2025-03-11 01:57:05.102175	2025-03-11 01:57:05.102175
15908	2659	9	null	2025-03-11 01:57:05.167659	2025-03-11 01:57:05.167659
15909	2660	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:05.305602	2025-03-11 01:57:05.305602
15910	2660	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:05.375027	2025-03-11 01:57:05.375027
15911	2660	6	null	2025-03-11 01:57:05.440922	2025-03-11 01:57:05.440922
15912	2660	7	TRUE	2025-03-11 01:57:05.511383	2025-03-11 01:57:05.511383
15913	2660	8	null	2025-03-11 01:57:05.576969	2025-03-11 01:57:05.576969
15914	2660	9	null	2025-03-11 01:57:05.642526	2025-03-11 01:57:05.642526
15915	2661	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:05.773981	2025-03-11 01:57:05.773981
15916	2661	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:05.839448	2025-03-11 01:57:05.839448
15917	2661	6	null	2025-03-11 01:57:05.904303	2025-03-11 01:57:05.904303
15918	2661	7	TRUE	2025-03-11 01:57:05.970529	2025-03-11 01:57:05.970529
15919	2661	8	null	2025-03-11 01:57:06.03625	2025-03-11 01:57:06.03625
15920	2661	9	null	2025-03-11 01:57:06.102175	2025-03-11 01:57:06.102175
15921	2662	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:06.233751	2025-03-11 01:57:06.233751
15922	2662	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:06.299504	2025-03-11 01:57:06.299504
15923	2662	6	null	2025-03-11 01:57:06.365165	2025-03-11 01:57:06.365165
15924	2662	7	TRUE	2025-03-11 01:57:06.431081	2025-03-11 01:57:06.431081
15925	2662	8	null	2025-03-11 01:57:06.49704	2025-03-11 01:57:06.49704
15926	2662	9	null	2025-03-11 01:57:06.562958	2025-03-11 01:57:06.562958
15927	2663	4	34a39ccac29aa236d2eceeec828816c7	2025-03-11 01:57:06.696576	2025-03-11 01:57:06.696576
15928	2663	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:06.762267	2025-03-11 01:57:06.762267
15929	2663	6	null	2025-03-11 01:57:06.828034	2025-03-11 01:57:06.828034
15930	2663	7	TRUE	2025-03-11 01:57:06.894604	2025-03-11 01:57:06.894604
15931	2663	8	null	2025-03-11 01:57:06.961065	2025-03-11 01:57:06.961065
15932	2663	9	null	2025-03-11 01:57:07.030311	2025-03-11 01:57:07.030311
15933	2664	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:57:07.162619	2025-03-11 01:57:07.162619
15934	2664	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:57:07.2285	2025-03-11 01:57:07.2285
15935	2664	6	null	2025-03-11 01:57:07.294316	2025-03-11 01:57:07.294316
15936	2664	7	FALSE	2025-03-11 01:57:07.360472	2025-03-11 01:57:07.360472
15937	2664	8	null	2025-03-11 01:57:07.426493	2025-03-11 01:57:07.426493
15938	2664	9	null	2025-03-11 01:57:07.492316	2025-03-11 01:57:07.492316
15939	2665	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:57:07.623789	2025-03-11 01:57:07.623789
15940	2665	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:57:07.689779	2025-03-11 01:57:07.689779
15941	2665	6	null	2025-03-11 01:57:07.755943	2025-03-11 01:57:07.755943
15942	2665	7	FALSE	2025-03-11 01:57:07.822067	2025-03-11 01:57:07.822067
15943	2665	8	null	2025-03-11 01:57:07.888955	2025-03-11 01:57:07.888955
15944	2665	9	null	2025-03-11 01:57:07.9547	2025-03-11 01:57:07.9547
15945	2666	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:57:08.08678	2025-03-11 01:57:08.08678
15946	2666	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:57:08.152521	2025-03-11 01:57:08.152521
15947	2666	6	null	2025-03-11 01:57:08.218407	2025-03-11 01:57:08.218407
15948	2666	7	FALSE	2025-03-11 01:57:08.284139	2025-03-11 01:57:08.284139
15949	2666	8	null	2025-03-11 01:57:08.350027	2025-03-11 01:57:08.350027
15950	2666	9	null	2025-03-11 01:57:08.416515	2025-03-11 01:57:08.416515
15951	2667	4	0452000a3653c99592e1e7a0085e5f1b	2025-03-11 01:57:08.55137	2025-03-11 01:57:08.55137
15952	2667	5	ebc88f4eec573c4e803f2be01d0a6571	2025-03-11 01:57:08.61637	2025-03-11 01:57:08.61637
15953	2667	6	null	2025-03-11 01:57:08.684298	2025-03-11 01:57:08.684298
15954	2667	7	FALSE	2025-03-11 01:57:08.750059	2025-03-11 01:57:08.750059
15955	2667	8	null	2025-03-11 01:57:08.817414	2025-03-11 01:57:08.817414
15956	2667	9	null	2025-03-11 01:57:08.88696	2025-03-11 01:57:08.88696
15957	2668	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:09.018588	2025-03-11 01:57:09.018588
15958	2668	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:57:09.087723	2025-03-11 01:57:09.087723
15959	2668	6	null	2025-03-11 01:57:09.154704	2025-03-11 01:57:09.154704
15960	2668	7	FALSE	2025-03-11 01:57:09.220578	2025-03-11 01:57:09.220578
15961	2668	8	null	2025-03-11 01:57:09.286262	2025-03-11 01:57:09.286262
15962	2668	9	null	2025-03-11 01:57:09.353144	2025-03-11 01:57:09.353144
15963	2669	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:09.484777	2025-03-11 01:57:09.484777
15964	2669	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:57:09.550799	2025-03-11 01:57:09.550799
15965	2669	6	null	2025-03-11 01:57:09.616745	2025-03-11 01:57:09.616745
15966	2669	7	FALSE	2025-03-11 01:57:09.683129	2025-03-11 01:57:09.683129
15967	2669	8	null	2025-03-11 01:57:09.74961	2025-03-11 01:57:09.74961
15968	2669	9	null	2025-03-11 01:57:09.81436	2025-03-11 01:57:09.81436
15969	2670	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:09.952382	2025-03-11 01:57:09.952382
15970	2670	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:57:10.018289	2025-03-11 01:57:10.018289
15971	2670	6	null	2025-03-11 01:57:10.089239	2025-03-11 01:57:10.089239
15972	2670	7	FALSE	2025-03-11 01:57:10.154425	2025-03-11 01:57:10.154425
15973	2670	8	null	2025-03-11 01:57:10.220283	2025-03-11 01:57:10.220283
15974	2670	9	null	2025-03-11 01:57:10.286236	2025-03-11 01:57:10.286236
15975	2671	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:10.418824	2025-03-11 01:57:10.418824
15976	2671	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:57:10.484764	2025-03-11 01:57:10.484764
15977	2671	6	null	2025-03-11 01:57:10.550991	2025-03-11 01:57:10.550991
15978	2671	7	FALSE	2025-03-11 01:57:10.617084	2025-03-11 01:57:10.617084
15979	2671	8	null	2025-03-11 01:57:10.682874	2025-03-11 01:57:10.682874
15980	2671	9	null	2025-03-11 01:57:10.748905	2025-03-11 01:57:10.748905
15981	2672	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:10.881901	2025-03-11 01:57:10.881901
15982	2672	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:57:10.948231	2025-03-11 01:57:10.948231
15983	2672	6	null	2025-03-11 01:57:11.014148	2025-03-11 01:57:11.014148
15984	2672	7	FALSE	2025-03-11 01:57:11.08001	2025-03-11 01:57:11.08001
15985	2672	8	null	2025-03-11 01:57:11.145718	2025-03-11 01:57:11.145718
15986	2672	9	null	2025-03-11 01:57:11.212098	2025-03-11 01:57:11.212098
15987	2673	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:11.344657	2025-03-11 01:57:11.344657
15988	2673	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:57:11.410688	2025-03-11 01:57:11.410688
15989	2673	6	null	2025-03-11 01:57:11.477343	2025-03-11 01:57:11.477343
15990	2673	7	FALSE	2025-03-11 01:57:11.542921	2025-03-11 01:57:11.542921
15991	2673	8	null	2025-03-11 01:57:11.608885	2025-03-11 01:57:11.608885
15992	2673	9	null	2025-03-11 01:57:11.674773	2025-03-11 01:57:11.674773
15993	2674	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:11.807466	2025-03-11 01:57:11.807466
15994	2674	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:57:11.873372	2025-03-11 01:57:11.873372
15995	2674	6	null	2025-03-11 01:57:11.938282	2025-03-11 01:57:11.938282
15996	2674	7	FALSE	2025-03-11 01:57:12.004506	2025-03-11 01:57:12.004506
15997	2674	8	null	2025-03-11 01:57:12.070306	2025-03-11 01:57:12.070306
15998	2674	9	null	2025-03-11 01:57:12.13615	2025-03-11 01:57:12.13615
15999	2675	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:12.26834	2025-03-11 01:57:12.26834
16000	2675	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:57:12.334154	2025-03-11 01:57:12.334154
16001	2675	6	null	2025-03-11 01:57:12.400194	2025-03-11 01:57:12.400194
16002	2675	7	FALSE	2025-03-11 01:57:12.465932	2025-03-11 01:57:12.465932
16003	2675	8	null	2025-03-11 01:57:12.531828	2025-03-11 01:57:12.531828
16004	2675	9	null	2025-03-11 01:57:12.602201	2025-03-11 01:57:12.602201
16005	2676	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:12.739817	2025-03-11 01:57:12.739817
16006	2676	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:57:12.811429	2025-03-11 01:57:12.811429
16007	2676	6	null	2025-03-11 01:57:12.877337	2025-03-11 01:57:12.877337
16008	2676	7	FALSE	2025-03-11 01:57:12.943314	2025-03-11 01:57:12.943314
16009	2676	8	null	2025-03-11 01:57:13.009122	2025-03-11 01:57:13.009122
16010	2676	9	null	2025-03-11 01:57:13.075088	2025-03-11 01:57:13.075088
16011	2677	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:13.207529	2025-03-11 01:57:13.207529
16012	2677	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:57:13.272354	2025-03-11 01:57:13.272354
16013	2677	6	null	2025-03-11 01:57:13.339343	2025-03-11 01:57:13.339343
16014	2677	7	FALSE	2025-03-11 01:57:13.405254	2025-03-11 01:57:13.405254
16015	2677	8	null	2025-03-11 01:57:13.471168	2025-03-11 01:57:13.471168
16016	2677	9	null	2025-03-11 01:57:13.53774	2025-03-11 01:57:13.53774
16017	2678	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:13.669609	2025-03-11 01:57:13.669609
16018	2678	5	28e4ab034bff9b21bde2cb63968a32eb	2025-03-11 01:57:13.735557	2025-03-11 01:57:13.735557
16019	2678	6	null	2025-03-11 01:57:13.801608	2025-03-11 01:57:13.801608
16020	2678	7	FALSE	2025-03-11 01:57:13.901855	2025-03-11 01:57:13.901855
16021	2678	8	null	2025-03-11 01:57:13.967517	2025-03-11 01:57:13.967517
16022	2678	9	null	2025-03-11 01:57:14.033382	2025-03-11 01:57:14.033382
16023	2679	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:14.170579	2025-03-11 01:57:14.170579
16024	2679	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:57:14.236489	2025-03-11 01:57:14.236489
16025	2679	6	null	2025-03-11 01:57:14.302781	2025-03-11 01:57:14.302781
16026	2679	7	FALSE	2025-03-11 01:57:14.371186	2025-03-11 01:57:14.371186
16027	2679	8	null	2025-03-11 01:57:14.436775	2025-03-11 01:57:14.436775
16028	2679	9	null	2025-03-11 01:57:14.503103	2025-03-11 01:57:14.503103
16029	2680	4	743b04e0073e40aced5e75447f72f3e4	2025-03-11 01:57:14.634859	2025-03-11 01:57:14.634859
16030	2680	5	c37daf93f811c211cdc1091c77c8e35c	2025-03-11 01:57:14.700524	2025-03-11 01:57:14.700524
16031	2680	6	null	2025-03-11 01:57:14.766301	2025-03-11 01:57:14.766301
16032	2680	7	FALSE	2025-03-11 01:57:14.832061	2025-03-11 01:57:14.832061
16033	2680	8	null	2025-03-11 01:57:14.897867	2025-03-11 01:57:14.897867
16034	2680	9	null	2025-03-11 01:57:14.96392	2025-03-11 01:57:14.96392
16035	2681	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:15.096071	2025-03-11 01:57:15.096071
16036	2681	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:15.161983	2025-03-11 01:57:15.161983
16037	2681	6	null	2025-03-11 01:57:15.227916	2025-03-11 01:57:15.227916
16038	2681	7	TRUE	2025-03-11 01:57:15.294782	2025-03-11 01:57:15.294782
16039	2681	8	null	2025-03-11 01:57:15.360782	2025-03-11 01:57:15.360782
16040	2681	9	null	2025-03-11 01:57:15.426825	2025-03-11 01:57:15.426825
16041	2682	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:15.56516	2025-03-11 01:57:15.56516
16042	2682	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:15.630943	2025-03-11 01:57:15.630943
16043	2682	6	null	2025-03-11 01:57:15.696651	2025-03-11 01:57:15.696651
16044	2682	7	TRUE	2025-03-11 01:57:15.762402	2025-03-11 01:57:15.762402
16045	2682	8	null	2025-03-11 01:57:15.829114	2025-03-11 01:57:15.829114
16046	2682	9	null	2025-03-11 01:57:15.896368	2025-03-11 01:57:15.896368
16047	2683	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:16.027902	2025-03-11 01:57:16.027902
16048	2683	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:16.093682	2025-03-11 01:57:16.093682
16049	2683	6	null	2025-03-11 01:57:16.159787	2025-03-11 01:57:16.159787
16050	2683	7	TRUE	2025-03-11 01:57:16.229134	2025-03-11 01:57:16.229134
16051	2683	8	null	2025-03-11 01:57:16.296102	2025-03-11 01:57:16.296102
16052	2683	9	null	2025-03-11 01:57:16.361812	2025-03-11 01:57:16.361812
16053	2684	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:16.493706	2025-03-11 01:57:16.493706
16054	2684	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:57:16.560399	2025-03-11 01:57:16.560399
16055	2684	6	null	2025-03-11 01:57:16.628346	2025-03-11 01:57:16.628346
16056	2684	7	TRUE	2025-03-11 01:57:16.701024	2025-03-11 01:57:16.701024
16057	2684	8	null	2025-03-11 01:57:16.766961	2025-03-11 01:57:16.766961
16058	2684	9	null	2025-03-11 01:57:16.832918	2025-03-11 01:57:16.832918
16059	2685	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:16.964936	2025-03-11 01:57:16.964936
16060	2685	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:57:17.030742	2025-03-11 01:57:17.030742
16061	2685	6	null	2025-03-11 01:57:17.09668	2025-03-11 01:57:17.09668
16062	2685	7	TRUE	2025-03-11 01:57:17.162534	2025-03-11 01:57:17.162534
16063	2685	8	null	2025-03-11 01:57:17.228366	2025-03-11 01:57:17.228366
16064	2685	9	null	2025-03-11 01:57:17.295531	2025-03-11 01:57:17.295531
16065	2686	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:17.42991	2025-03-11 01:57:17.42991
16066	2686	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:57:17.496884	2025-03-11 01:57:17.496884
16067	2686	6	null	2025-03-11 01:57:17.562897	2025-03-11 01:57:17.562897
16068	2686	7	TRUE	2025-03-11 01:57:17.633479	2025-03-11 01:57:17.633479
16069	2686	8	null	2025-03-11 01:57:17.699163	2025-03-11 01:57:17.699163
16070	2686	9	null	2025-03-11 01:57:17.764896	2025-03-11 01:57:17.764896
16071	2687	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:17.896283	2025-03-11 01:57:17.896283
16072	2687	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:57:17.962634	2025-03-11 01:57:17.962634
16073	2687	6	null	2025-03-11 01:57:18.027378	2025-03-11 01:57:18.027378
16074	2687	7	TRUE	2025-03-11 01:57:18.093989	2025-03-11 01:57:18.093989
16075	2687	8	null	2025-03-11 01:57:18.16025	2025-03-11 01:57:18.16025
16076	2687	9	null	2025-03-11 01:57:18.226111	2025-03-11 01:57:18.226111
16077	2688	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:18.358682	2025-03-11 01:57:18.358682
16078	2688	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:18.425227	2025-03-11 01:57:18.425227
16079	2688	6	null	2025-03-11 01:57:18.491079	2025-03-11 01:57:18.491079
16080	2688	7	TRUE	2025-03-11 01:57:18.558227	2025-03-11 01:57:18.558227
16081	2688	8	null	2025-03-11 01:57:18.624086	2025-03-11 01:57:18.624086
16082	2688	9	null	2025-03-11 01:57:18.689428	2025-03-11 01:57:18.689428
16083	2689	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:18.821258	2025-03-11 01:57:18.821258
16084	2689	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:18.889327	2025-03-11 01:57:18.889327
16085	2689	6	null	2025-03-11 01:57:18.957892	2025-03-11 01:57:18.957892
16086	2689	7	TRUE	2025-03-11 01:57:19.024284	2025-03-11 01:57:19.024284
16087	2689	8	null	2025-03-11 01:57:19.090183	2025-03-11 01:57:19.090183
16088	2689	9	null	2025-03-11 01:57:19.160817	2025-03-11 01:57:19.160817
16089	2690	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:19.292536	2025-03-11 01:57:19.292536
16090	2690	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:57:19.358344	2025-03-11 01:57:19.358344
16091	2690	6	null	2025-03-11 01:57:19.423974	2025-03-11 01:57:19.423974
16092	2690	7	TRUE	2025-03-11 01:57:19.490006	2025-03-11 01:57:19.490006
16093	2690	8	null	2025-03-11 01:57:19.556006	2025-03-11 01:57:19.556006
16094	2690	9	null	2025-03-11 01:57:19.622426	2025-03-11 01:57:19.622426
16095	2691	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:19.754572	2025-03-11 01:57:19.754572
16096	2691	5	54f05ab5083dac5e590ed0acdd678281	2025-03-11 01:57:19.820639	2025-03-11 01:57:19.820639
16097	2691	6	null	2025-03-11 01:57:19.886243	2025-03-11 01:57:19.886243
16098	2691	7	TRUE	2025-03-11 01:57:19.951922	2025-03-11 01:57:19.951922
16099	2691	8	null	2025-03-11 01:57:20.021426	2025-03-11 01:57:20.021426
16100	2691	9	null	2025-03-11 01:57:20.087227	2025-03-11 01:57:20.087227
16101	2692	4	453f7282de3d51811b0eb25adc94450c	2025-03-11 01:57:20.219713	2025-03-11 01:57:20.219713
16102	2692	5	b2243d9c96da30bddfb30186c250539d	2025-03-11 01:57:20.285653	2025-03-11 01:57:20.285653
16103	2692	6	null	2025-03-11 01:57:20.351506	2025-03-11 01:57:20.351506
16104	2692	7	TRUE	2025-03-11 01:57:20.417758	2025-03-11 01:57:20.417758
16105	2692	8	null	2025-03-11 01:57:20.482234	2025-03-11 01:57:20.482234
16106	2692	9	null	2025-03-11 01:57:20.547789	2025-03-11 01:57:20.547789
16107	2693	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:20.679853	2025-03-11 01:57:20.679853
16108	2693	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:20.745692	2025-03-11 01:57:20.745692
16109	2693	6	null	2025-03-11 01:57:20.812072	2025-03-11 01:57:20.812072
16110	2693	7	TRUE	2025-03-11 01:57:20.878118	2025-03-11 01:57:20.878118
16111	2693	8	null	2025-03-11 01:57:20.944136	2025-03-11 01:57:20.944136
16112	2693	9	null	2025-03-11 01:57:21.01009	2025-03-11 01:57:21.01009
16113	2694	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:21.142744	2025-03-11 01:57:21.142744
16114	2694	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:21.208332	2025-03-11 01:57:21.208332
16115	2694	6	null	2025-03-11 01:57:21.274222	2025-03-11 01:57:21.274222
16116	2694	7	FALSE	2025-03-11 01:57:21.339948	2025-03-11 01:57:21.339948
16117	2694	8	null	2025-03-11 01:57:21.405767	2025-03-11 01:57:21.405767
16118	2694	9	null	2025-03-11 01:57:21.471529	2025-03-11 01:57:21.471529
16119	2695	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:21.603172	2025-03-11 01:57:21.603172
16120	2695	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:21.670113	2025-03-11 01:57:21.670113
16121	2695	6	null	2025-03-11 01:57:21.735992	2025-03-11 01:57:21.735992
16122	2695	7	FALSE	2025-03-11 01:57:21.802882	2025-03-11 01:57:21.802882
16123	2695	8	null	2025-03-11 01:57:21.869002	2025-03-11 01:57:21.869002
16124	2695	9	null	2025-03-11 01:57:21.935766	2025-03-11 01:57:21.935766
16125	2696	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:22.071285	2025-03-11 01:57:22.071285
16126	2696	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:22.137509	2025-03-11 01:57:22.137509
16127	2696	6	null	2025-03-11 01:57:22.203894	2025-03-11 01:57:22.203894
16128	2696	7	FALSE	2025-03-11 01:57:22.269978	2025-03-11 01:57:22.269978
16129	2696	8	null	2025-03-11 01:57:22.336098	2025-03-11 01:57:22.336098
16130	2696	9	null	2025-03-11 01:57:22.401857	2025-03-11 01:57:22.401857
16131	2697	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:22.533108	2025-03-11 01:57:22.533108
16132	2697	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:22.599011	2025-03-11 01:57:22.599011
16133	2697	6	null	2025-03-11 01:57:22.664899	2025-03-11 01:57:22.664899
16134	2697	7	FALSE	2025-03-11 01:57:22.730559	2025-03-11 01:57:22.730559
16135	2697	8	null	2025-03-11 01:57:22.796188	2025-03-11 01:57:22.796188
16136	2697	9	null	2025-03-11 01:57:22.862378	2025-03-11 01:57:22.862378
16137	2698	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:22.993885	2025-03-11 01:57:22.993885
16138	2698	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:23.059949	2025-03-11 01:57:23.059949
16139	2698	6	null	2025-03-11 01:57:23.128323	2025-03-11 01:57:23.128323
16140	2698	7	TRUE	2025-03-11 01:57:23.198141	2025-03-11 01:57:23.198141
16141	2698	8	null	2025-03-11 01:57:23.265066	2025-03-11 01:57:23.265066
16142	2698	9	null	2025-03-11 01:57:23.331024	2025-03-11 01:57:23.331024
16143	2699	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:23.462905	2025-03-11 01:57:23.462905
16144	2699	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:23.528538	2025-03-11 01:57:23.528538
16145	2699	6	null	2025-03-11 01:57:23.594183	2025-03-11 01:57:23.594183
16146	2699	7	TRUE	2025-03-11 01:57:23.660443	2025-03-11 01:57:23.660443
16147	2699	8	null	2025-03-11 01:57:23.726236	2025-03-11 01:57:23.726236
16148	2699	9	null	2025-03-11 01:57:23.792144	2025-03-11 01:57:23.792144
16149	2700	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:23.924448	2025-03-11 01:57:23.924448
16150	2700	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:23.990177	2025-03-11 01:57:23.990177
16151	2700	6	null	2025-03-11 01:57:24.056171	2025-03-11 01:57:24.056171
16152	2700	7	TRUE	2025-03-11 01:57:24.122496	2025-03-11 01:57:24.122496
16153	2700	8	null	2025-03-11 01:57:24.188498	2025-03-11 01:57:24.188498
16154	2700	9	null	2025-03-11 01:57:24.253618	2025-03-11 01:57:24.253618
16155	2701	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:24.386686	2025-03-11 01:57:24.386686
16156	2701	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:24.451319	2025-03-11 01:57:24.451319
16157	2701	6	null	2025-03-11 01:57:24.517482	2025-03-11 01:57:24.517482
16158	2701	7	TRUE	2025-03-11 01:57:24.589132	2025-03-11 01:57:24.589132
16159	2701	8	null	2025-03-11 01:57:24.655193	2025-03-11 01:57:24.655193
16160	2701	9	null	2025-03-11 01:57:24.721864	2025-03-11 01:57:24.721864
16161	2702	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:24.853708	2025-03-11 01:57:24.853708
16162	2702	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:24.920027	2025-03-11 01:57:24.920027
16163	2702	6	null	2025-03-11 01:57:24.985819	2025-03-11 01:57:24.985819
16164	2702	7	TRUE	2025-03-11 01:57:25.051677	2025-03-11 01:57:25.051677
16165	2702	8	null	2025-03-11 01:57:25.117797	2025-03-11 01:57:25.117797
16166	2702	9	null	2025-03-11 01:57:25.183676	2025-03-11 01:57:25.183676
16167	2703	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:25.314382	2025-03-11 01:57:25.314382
16168	2703	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:25.3815	2025-03-11 01:57:25.3815
16169	2703	6	null	2025-03-11 01:57:25.447677	2025-03-11 01:57:25.447677
16170	2703	7	TRUE	2025-03-11 01:57:25.513682	2025-03-11 01:57:25.513682
16171	2703	8	null	2025-03-11 01:57:25.579638	2025-03-11 01:57:25.579638
16172	2703	9	null	2025-03-11 01:57:25.645509	2025-03-11 01:57:25.645509
16173	2704	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:25.777323	2025-03-11 01:57:25.777323
16174	2704	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:25.843484	2025-03-11 01:57:25.843484
16175	2704	6	null	2025-03-11 01:57:25.90933	2025-03-11 01:57:25.90933
16176	2704	7	TRUE	2025-03-11 01:57:25.975174	2025-03-11 01:57:25.975174
16177	2704	8	null	2025-03-11 01:57:26.041078	2025-03-11 01:57:26.041078
16178	2704	9	null	2025-03-11 01:57:26.107007	2025-03-11 01:57:26.107007
16179	2705	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:26.238614	2025-03-11 01:57:26.238614
16180	2705	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:26.304685	2025-03-11 01:57:26.304685
16181	2705	6	null	2025-03-11 01:57:26.370778	2025-03-11 01:57:26.370778
16182	2705	7	TRUE	2025-03-11 01:57:26.436511	2025-03-11 01:57:26.436511
16183	2705	8	null	2025-03-11 01:57:26.502448	2025-03-11 01:57:26.502448
16184	2705	9	null	2025-03-11 01:57:26.568365	2025-03-11 01:57:26.568365
16185	2706	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:26.700117	2025-03-11 01:57:26.700117
16186	2706	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:26.765989	2025-03-11 01:57:26.765989
16187	2706	6	null	2025-03-11 01:57:26.831655	2025-03-11 01:57:26.831655
16188	2706	7	TRUE	2025-03-11 01:57:26.897799	2025-03-11 01:57:26.897799
16189	2706	8	null	2025-03-11 01:57:26.963576	2025-03-11 01:57:26.963576
16190	2706	9	null	2025-03-11 01:57:27.029203	2025-03-11 01:57:27.029203
16191	2707	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:27.161744	2025-03-11 01:57:27.161744
16192	2707	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:27.226332	2025-03-11 01:57:27.226332
16193	2707	6	null	2025-03-11 01:57:27.293275	2025-03-11 01:57:27.293275
16194	2707	7	FALSE	2025-03-11 01:57:27.360874	2025-03-11 01:57:27.360874
16195	2707	8	null	2025-03-11 01:57:27.42717	2025-03-11 01:57:27.42717
16196	2707	9	null	2025-03-11 01:57:27.494117	2025-03-11 01:57:27.494117
16197	2708	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:27.626326	2025-03-11 01:57:27.626326
16198	2708	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:27.694421	2025-03-11 01:57:27.694421
16199	2708	6	null	2025-03-11 01:57:27.762449	2025-03-11 01:57:27.762449
16200	2708	7	TRUE	2025-03-11 01:57:27.832571	2025-03-11 01:57:27.832571
16201	2708	8	null	2025-03-11 01:57:27.898376	2025-03-11 01:57:27.898376
16202	2708	9	null	2025-03-11 01:57:27.964747	2025-03-11 01:57:27.964747
16203	2709	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:28.101628	2025-03-11 01:57:28.101628
16204	2709	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:57:28.169261	2025-03-11 01:57:28.169261
16205	2709	6	null	2025-03-11 01:57:28.234953	2025-03-11 01:57:28.234953
16206	2709	7	FALSE	2025-03-11 01:57:28.300875	2025-03-11 01:57:28.300875
16207	2709	8	null	2025-03-11 01:57:28.370532	2025-03-11 01:57:28.370532
16208	2709	9	null	2025-03-11 01:57:28.437915	2025-03-11 01:57:28.437915
16209	2710	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:28.570083	2025-03-11 01:57:28.570083
16210	2710	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:28.636095	2025-03-11 01:57:28.636095
16211	2710	6	null	2025-03-11 01:57:28.702109	2025-03-11 01:57:28.702109
16212	2710	7	FALSE	2025-03-11 01:57:28.768701	2025-03-11 01:57:28.768701
16213	2710	8	null	2025-03-11 01:57:28.834802	2025-03-11 01:57:28.834802
16214	2710	9	null	2025-03-11 01:57:28.900746	2025-03-11 01:57:28.900746
16215	2711	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:29.032005	2025-03-11 01:57:29.032005
16216	2711	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:29.097795	2025-03-11 01:57:29.097795
16217	2711	6	null	2025-03-11 01:57:29.164005	2025-03-11 01:57:29.164005
16218	2711	7	FALSE	2025-03-11 01:57:29.230147	2025-03-11 01:57:29.230147
16219	2711	8	null	2025-03-11 01:57:29.296008	2025-03-11 01:57:29.296008
16220	2711	9	null	2025-03-11 01:57:29.362054	2025-03-11 01:57:29.362054
16221	2712	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:29.493909	2025-03-11 01:57:29.493909
16222	2712	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:29.5594	2025-03-11 01:57:29.5594
16223	2712	6	null	2025-03-11 01:57:29.625396	2025-03-11 01:57:29.625396
16224	2712	7	FALSE	2025-03-11 01:57:29.691201	2025-03-11 01:57:29.691201
16225	2712	8	null	2025-03-11 01:57:29.7569	2025-03-11 01:57:29.7569
16226	2712	9	null	2025-03-11 01:57:29.822977	2025-03-11 01:57:29.822977
16227	2713	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:29.955209	2025-03-11 01:57:29.955209
16228	2713	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:30.021247	2025-03-11 01:57:30.021247
16229	2713	6	null	2025-03-11 01:57:30.087357	2025-03-11 01:57:30.087357
16230	2713	7	FALSE	2025-03-11 01:57:30.153077	2025-03-11 01:57:30.153077
16231	2713	8	null	2025-03-11 01:57:30.218748	2025-03-11 01:57:30.218748
16232	2713	9	null	2025-03-11 01:57:30.284579	2025-03-11 01:57:30.284579
16233	2714	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:30.416354	2025-03-11 01:57:30.416354
16234	2714	5	d4b1672a28e3285ba01bbfb32ace6eae	2025-03-11 01:57:30.482122	2025-03-11 01:57:30.482122
16235	2714	6	null	2025-03-11 01:57:30.548049	2025-03-11 01:57:30.548049
16236	2714	7	FALSE	2025-03-11 01:57:30.613478	2025-03-11 01:57:30.613478
16237	2714	8	null	2025-03-11 01:57:30.679523	2025-03-11 01:57:30.679523
16238	2714	9	null	2025-03-11 01:57:30.745414	2025-03-11 01:57:30.745414
16239	2715	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:30.878029	2025-03-11 01:57:30.878029
16240	2715	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:57:30.943998	2025-03-11 01:57:30.943998
16241	2715	6	null	2025-03-11 01:57:31.009869	2025-03-11 01:57:31.009869
16242	2715	7	FALSE	2025-03-11 01:57:31.075606	2025-03-11 01:57:31.075606
16243	2715	8	null	2025-03-11 01:57:31.142271	2025-03-11 01:57:31.142271
16244	2715	9	null	2025-03-11 01:57:31.208166	2025-03-11 01:57:31.208166
16245	2716	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:31.340311	2025-03-11 01:57:31.340311
16246	2716	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:31.406036	2025-03-11 01:57:31.406036
16247	2716	6	null	2025-03-11 01:57:31.471871	2025-03-11 01:57:31.471871
16248	2716	7	TRUE	2025-03-11 01:57:31.547474	2025-03-11 01:57:31.547474
16249	2716	8	null	2025-03-11 01:57:31.613186	2025-03-11 01:57:31.613186
16250	2716	9	null	2025-03-11 01:57:31.678598	2025-03-11 01:57:31.678598
16251	2717	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:31.810445	2025-03-11 01:57:31.810445
16252	2717	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:57:31.876399	2025-03-11 01:57:31.876399
16253	2717	6	null	2025-03-11 01:57:31.944591	2025-03-11 01:57:31.944591
16254	2717	7	FALSE	2025-03-11 01:57:32.013791	2025-03-11 01:57:32.013791
16255	2717	8	null	2025-03-11 01:57:32.080029	2025-03-11 01:57:32.080029
16256	2717	9	null	2025-03-11 01:57:32.146149	2025-03-11 01:57:32.146149
16257	2718	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:32.278806	2025-03-11 01:57:32.278806
16258	2718	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:32.344892	2025-03-11 01:57:32.344892
16259	2718	6	null	2025-03-11 01:57:32.410764	2025-03-11 01:57:32.410764
16260	2718	7	TRUE	2025-03-11 01:57:32.476617	2025-03-11 01:57:32.476617
16261	2718	8	null	2025-03-11 01:57:32.542359	2025-03-11 01:57:32.542359
16262	2718	9	null	2025-03-11 01:57:32.608204	2025-03-11 01:57:32.608204
16263	2719	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:32.740105	2025-03-11 01:57:32.740105
16264	2719	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:57:32.80607	2025-03-11 01:57:32.80607
16265	2719	6	null	2025-03-11 01:57:32.872053	2025-03-11 01:57:32.872053
16266	2719	7	TRUE	2025-03-11 01:57:32.937921	2025-03-11 01:57:32.937921
16267	2719	8	null	2025-03-11 01:57:33.003728	2025-03-11 01:57:33.003728
16268	2719	9	null	2025-03-11 01:57:33.069746	2025-03-11 01:57:33.069746
16269	2720	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:33.202165	2025-03-11 01:57:33.202165
16270	2720	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:57:33.267928	2025-03-11 01:57:33.267928
16271	2720	6	null	2025-03-11 01:57:33.334054	2025-03-11 01:57:33.334054
16272	2720	7	TRUE	2025-03-11 01:57:33.400426	2025-03-11 01:57:33.400426
16273	2720	8	null	2025-03-11 01:57:33.466198	2025-03-11 01:57:33.466198
16274	2720	9	null	2025-03-11 01:57:33.53212	2025-03-11 01:57:33.53212
16275	2721	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:33.664008	2025-03-11 01:57:33.664008
16276	2721	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:57:33.733708	2025-03-11 01:57:33.733708
16277	2721	6	null	2025-03-11 01:57:33.800094	2025-03-11 01:57:33.800094
16278	2721	7	TRUE	2025-03-11 01:57:33.865802	2025-03-11 01:57:33.865802
16279	2721	8	null	2025-03-11 01:57:33.931763	2025-03-11 01:57:33.931763
16280	2721	9	null	2025-03-11 01:57:33.99747	2025-03-11 01:57:33.99747
16281	2722	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:34.130928	2025-03-11 01:57:34.130928
16282	2722	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:57:34.197039	2025-03-11 01:57:34.197039
16283	2722	6	null	2025-03-11 01:57:34.26285	2025-03-11 01:57:34.26285
16284	2722	7	TRUE	2025-03-11 01:57:34.328898	2025-03-11 01:57:34.328898
16285	2722	8	null	2025-03-11 01:57:34.401118	2025-03-11 01:57:34.401118
16286	2722	9	null	2025-03-11 01:57:34.467293	2025-03-11 01:57:34.467293
16287	2723	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:34.59894	2025-03-11 01:57:34.59894
16288	2723	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:34.665023	2025-03-11 01:57:34.665023
16289	2723	6	null	2025-03-11 01:57:34.731061	2025-03-11 01:57:34.731061
16290	2723	7	TRUE	2025-03-11 01:57:34.79724	2025-03-11 01:57:34.79724
16291	2723	8	null	2025-03-11 01:57:34.863581	2025-03-11 01:57:34.863581
16292	2723	9	null	2025-03-11 01:57:34.929349	2025-03-11 01:57:34.929349
16293	2724	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:35.060466	2025-03-11 01:57:35.060466
16294	2724	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:35.12627	2025-03-11 01:57:35.12627
16295	2724	6	null	2025-03-11 01:57:35.196121	2025-03-11 01:57:35.196121
16296	2724	7	TRUE	2025-03-11 01:57:35.2619	2025-03-11 01:57:35.2619
16297	2724	8	null	2025-03-11 01:57:35.329424	2025-03-11 01:57:35.329424
16298	2724	9	null	2025-03-11 01:57:35.395812	2025-03-11 01:57:35.395812
16299	2725	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:35.527765	2025-03-11 01:57:35.527765
16300	2725	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:35.593747	2025-03-11 01:57:35.593747
16301	2725	6	null	2025-03-11 01:57:35.659615	2025-03-11 01:57:35.659615
16302	2725	7	TRUE	2025-03-11 01:57:35.726724	2025-03-11 01:57:35.726724
16303	2725	8	null	2025-03-11 01:57:35.792613	2025-03-11 01:57:35.792613
16304	2725	9	null	2025-03-11 01:57:35.85872	2025-03-11 01:57:35.85872
16305	2726	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:35.994416	2025-03-11 01:57:35.994416
16306	2726	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:36.07379	2025-03-11 01:57:36.07379
16307	2726	6	null	2025-03-11 01:57:36.141064	2025-03-11 01:57:36.141064
16308	2726	7	TRUE	2025-03-11 01:57:36.206855	2025-03-11 01:57:36.206855
16309	2726	8	null	2025-03-11 01:57:36.272862	2025-03-11 01:57:36.272862
16310	2726	9	null	2025-03-11 01:57:36.338701	2025-03-11 01:57:36.338701
16311	2727	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:36.470554	2025-03-11 01:57:36.470554
16312	2727	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:36.535314	2025-03-11 01:57:36.535314
16313	2727	6	null	2025-03-11 01:57:36.601276	2025-03-11 01:57:36.601276
16314	2727	7	TRUE	2025-03-11 01:57:36.667509	2025-03-11 01:57:36.667509
16315	2727	8	null	2025-03-11 01:57:36.733336	2025-03-11 01:57:36.733336
16316	2727	9	null	2025-03-11 01:57:36.799472	2025-03-11 01:57:36.799472
16317	2728	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:57:36.931334	2025-03-11 01:57:36.931334
16318	2728	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:57:36.996914	2025-03-11 01:57:36.996914
16319	2728	6	null	2025-03-11 01:57:37.062958	2025-03-11 01:57:37.062958
16320	2728	7	TRUE	2025-03-11 01:57:37.128974	2025-03-11 01:57:37.128974
16321	2728	8	null	2025-03-11 01:57:37.194819	2025-03-11 01:57:37.194819
16322	2728	9	null	2025-03-11 01:57:37.264853	2025-03-11 01:57:37.264853
16323	2729	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:37.419646	2025-03-11 01:57:37.419646
16324	2729	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:37.485937	2025-03-11 01:57:37.485937
16325	2729	6	null	2025-03-11 01:57:37.551803	2025-03-11 01:57:37.551803
16326	2729	7	TRUE	2025-03-11 01:57:37.617434	2025-03-11 01:57:37.617434
16327	2729	8	null	2025-03-11 01:57:37.683274	2025-03-11 01:57:37.683274
16328	2729	9	null	2025-03-11 01:57:37.749187	2025-03-11 01:57:37.749187
16329	2730	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:37.88114	2025-03-11 01:57:37.88114
16330	2730	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:37.947007	2025-03-11 01:57:37.947007
16331	2730	6	null	2025-03-11 01:57:38.012813	2025-03-11 01:57:38.012813
16332	2730	7	TRUE	2025-03-11 01:57:38.078487	2025-03-11 01:57:38.078487
16333	2730	8	null	2025-03-11 01:57:38.144239	2025-03-11 01:57:38.144239
16334	2730	9	null	2025-03-11 01:57:38.209987	2025-03-11 01:57:38.209987
16335	2731	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:38.341774	2025-03-11 01:57:38.341774
16336	2731	5	ac7a12a756248fad2e64afc030210a28	2025-03-11 01:57:38.407884	2025-03-11 01:57:38.407884
16337	2731	6	null	2025-03-11 01:57:38.473979	2025-03-11 01:57:38.473979
16338	2731	7	TRUE	2025-03-11 01:57:38.540686	2025-03-11 01:57:38.540686
16339	2731	8	null	2025-03-11 01:57:38.606936	2025-03-11 01:57:38.606936
16340	2731	9	null	2025-03-11 01:57:38.672919	2025-03-11 01:57:38.672919
16341	2732	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:38.804328	2025-03-11 01:57:38.804328
16342	2732	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:38.870269	2025-03-11 01:57:38.870269
16343	2732	6	null	2025-03-11 01:57:38.9363	2025-03-11 01:57:38.9363
16344	2732	7	TRUE	2025-03-11 01:57:39.002406	2025-03-11 01:57:39.002406
16345	2732	8	null	2025-03-11 01:57:39.067937	2025-03-11 01:57:39.067937
16346	2732	9	null	2025-03-11 01:57:39.133825	2025-03-11 01:57:39.133825
16347	2733	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:39.265297	2025-03-11 01:57:39.265297
16348	2733	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:57:39.331048	2025-03-11 01:57:39.331048
16349	2733	6	null	2025-03-11 01:57:39.397165	2025-03-11 01:57:39.397165
16350	2733	7	FALSE	2025-03-11 01:57:39.462795	2025-03-11 01:57:39.462795
16351	2733	8	null	2025-03-11 01:57:39.52866	2025-03-11 01:57:39.52866
16352	2733	9	null	2025-03-11 01:57:39.597588	2025-03-11 01:57:39.597588
16353	2734	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:39.734608	2025-03-11 01:57:39.734608
16354	2734	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:39.800444	2025-03-11 01:57:39.800444
16355	2734	6	null	2025-03-11 01:57:39.866522	2025-03-11 01:57:39.866522
16356	2734	7	TRUE	2025-03-11 01:57:39.931424	2025-03-11 01:57:39.931424
16357	2734	8	null	2025-03-11 01:57:39.99745	2025-03-11 01:57:39.99745
16358	2734	9	null	2025-03-11 01:57:40.063376	2025-03-11 01:57:40.063376
16359	2735	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:40.19596	2025-03-11 01:57:40.19596
16360	2735	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:40.262678	2025-03-11 01:57:40.262678
16361	2735	6	null	2025-03-11 01:57:40.328752	2025-03-11 01:57:40.328752
16362	2735	7	TRUE	2025-03-11 01:57:40.398761	2025-03-11 01:57:40.398761
16363	2735	8	null	2025-03-11 01:57:40.465993	2025-03-11 01:57:40.465993
16364	2735	9	null	2025-03-11 01:57:40.533866	2025-03-11 01:57:40.533866
16365	2736	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:40.665833	2025-03-11 01:57:40.665833
16366	2736	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:57:40.738961	2025-03-11 01:57:40.738961
16367	2736	6	null	2025-03-11 01:57:40.805027	2025-03-11 01:57:40.805027
16368	2736	7	FALSE	2025-03-11 01:57:40.870764	2025-03-11 01:57:40.870764
16369	2736	8	null	2025-03-11 01:57:40.936664	2025-03-11 01:57:40.936664
16370	2736	9	null	2025-03-11 01:57:41.005441	2025-03-11 01:57:41.005441
16371	2737	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:41.137345	2025-03-11 01:57:41.137345
16372	2737	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:41.205457	2025-03-11 01:57:41.205457
16373	2737	6	null	2025-03-11 01:57:41.272109	2025-03-11 01:57:41.272109
16374	2737	7	TRUE	2025-03-11 01:57:41.337812	2025-03-11 01:57:41.337812
16375	2737	8	null	2025-03-11 01:57:41.404949	2025-03-11 01:57:41.404949
16376	2737	9	null	2025-03-11 01:57:41.470982	2025-03-11 01:57:41.470982
16377	2738	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:57:41.603231	2025-03-11 01:57:41.603231
16378	2738	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:57:41.669027	2025-03-11 01:57:41.669027
16379	2738	6	null	2025-03-11 01:57:41.734761	2025-03-11 01:57:41.734761
16380	2738	7	TRUE	2025-03-11 01:57:41.800607	2025-03-11 01:57:41.800607
16381	2738	8	null	2025-03-11 01:57:41.86643	2025-03-11 01:57:41.86643
16382	2738	9	null	2025-03-11 01:57:41.932311	2025-03-11 01:57:41.932311
16383	2739	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:42.065161	2025-03-11 01:57:42.065161
16384	2739	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:42.13107	2025-03-11 01:57:42.13107
16385	2739	6	null	2025-03-11 01:57:42.196948	2025-03-11 01:57:42.196948
16386	2739	7	TRUE	2025-03-11 01:57:42.262692	2025-03-11 01:57:42.262692
16387	2739	8	null	2025-03-11 01:57:42.329287	2025-03-11 01:57:42.329287
16388	2739	9	null	2025-03-11 01:57:42.395819	2025-03-11 01:57:42.395819
16389	2740	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:42.528776	2025-03-11 01:57:42.528776
16390	2740	5	0576614a8aa8d75c46259af328a74c9b	2025-03-11 01:57:42.59597	2025-03-11 01:57:42.59597
16391	2740	6	null	2025-03-11 01:57:42.664706	2025-03-11 01:57:42.664706
16392	2740	7	TRUE	2025-03-11 01:57:42.730951	2025-03-11 01:57:42.730951
16393	2740	8	null	2025-03-11 01:57:42.797012	2025-03-11 01:57:42.797012
16394	2740	9	null	2025-03-11 01:57:42.862965	2025-03-11 01:57:42.862965
16395	2741	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:57:42.994659	2025-03-11 01:57:42.994659
16396	2741	5	8dba42adbc5c2aac3e57c03564124545	2025-03-11 01:57:43.060566	2025-03-11 01:57:43.060566
16397	2741	6	null	2025-03-11 01:57:43.126506	2025-03-11 01:57:43.126506
16398	2741	7	FALSE	2025-03-11 01:57:43.193031	2025-03-11 01:57:43.193031
16399	2741	8	null	2025-03-11 01:57:43.259008	2025-03-11 01:57:43.259008
16400	2741	9	null	2025-03-11 01:57:43.324831	2025-03-11 01:57:43.324831
16401	2742	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:43.456671	2025-03-11 01:57:43.456671
16402	2742	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:43.522374	2025-03-11 01:57:43.522374
16403	2742	6	null	2025-03-11 01:57:43.588058	2025-03-11 01:57:43.588058
16404	2742	7	TRUE	2025-03-11 01:57:43.654374	2025-03-11 01:57:43.654374
16405	2742	8	null	2025-03-11 01:57:43.720434	2025-03-11 01:57:43.720434
16406	2742	9	null	2025-03-11 01:57:43.786319	2025-03-11 01:57:43.786319
16407	2743	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:43.917683	2025-03-11 01:57:43.917683
16408	2743	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:43.983772	2025-03-11 01:57:43.983772
16409	2743	6	null	2025-03-11 01:57:44.049768	2025-03-11 01:57:44.049768
16410	2743	7	TRUE	2025-03-11 01:57:44.115507	2025-03-11 01:57:44.115507
16411	2743	8	null	2025-03-11 01:57:44.181883	2025-03-11 01:57:44.181883
16412	2743	9	null	2025-03-11 01:57:44.247913	2025-03-11 01:57:44.247913
16413	2744	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:44.380043	2025-03-11 01:57:44.380043
16414	2744	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:44.445532	2025-03-11 01:57:44.445532
16415	2744	6	null	2025-03-11 01:57:44.510345	2025-03-11 01:57:44.510345
16416	2744	7	TRUE	2025-03-11 01:57:44.576783	2025-03-11 01:57:44.576783
16417	2744	8	null	2025-03-11 01:57:44.642699	2025-03-11 01:57:44.642699
16418	2744	9	null	2025-03-11 01:57:44.708337	2025-03-11 01:57:44.708337
16419	2745	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:44.841434	2025-03-11 01:57:44.841434
16420	2745	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:57:44.907121	2025-03-11 01:57:44.907121
16421	2745	6	null	2025-03-11 01:57:44.972881	2025-03-11 01:57:44.972881
16422	2745	7	FALSE	2025-03-11 01:57:45.038861	2025-03-11 01:57:45.038861
16423	2745	8	null	2025-03-11 01:57:45.105327	2025-03-11 01:57:45.105327
16424	2745	9	null	2025-03-11 01:57:45.171863	2025-03-11 01:57:45.171863
16425	2746	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:45.30633	2025-03-11 01:57:45.30633
16426	2746	5	b88786b632b84ae52b4519f79a725f0e	2025-03-11 01:57:45.372757	2025-03-11 01:57:45.372757
16427	2746	6	null	2025-03-11 01:57:45.43864	2025-03-11 01:57:45.43864
16428	2746	7	FALSE	2025-03-11 01:57:45.504282	2025-03-11 01:57:45.504282
16429	2746	8	null	2025-03-11 01:57:45.569275	2025-03-11 01:57:45.569275
16430	2746	9	null	2025-03-11 01:57:45.635314	2025-03-11 01:57:45.635314
16431	2747	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:45.768308	2025-03-11 01:57:45.768308
16432	2747	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:45.834691	2025-03-11 01:57:45.834691
16433	2747	6	null	2025-03-11 01:57:45.900531	2025-03-11 01:57:45.900531
16434	2747	7	TRUE	2025-03-11 01:57:45.966316	2025-03-11 01:57:45.966316
16435	2747	8	null	2025-03-11 01:57:46.03225	2025-03-11 01:57:46.03225
16436	2747	9	null	2025-03-11 01:57:46.098029	2025-03-11 01:57:46.098029
16437	2748	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:46.229833	2025-03-11 01:57:46.229833
16438	2748	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:46.295842	2025-03-11 01:57:46.295842
16439	2748	6	null	2025-03-11 01:57:46.361734	2025-03-11 01:57:46.361734
16440	2748	7	TRUE	2025-03-11 01:57:46.427575	2025-03-11 01:57:46.427575
16441	2748	8	null	2025-03-11 01:57:46.493442	2025-03-11 01:57:46.493442
16442	2748	9	null	2025-03-11 01:57:46.559998	2025-03-11 01:57:46.559998
16443	2749	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:46.692262	2025-03-11 01:57:46.692262
16444	2749	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:46.758051	2025-03-11 01:57:46.758051
16445	2749	6	null	2025-03-11 01:57:46.824556	2025-03-11 01:57:46.824556
16446	2749	7	TRUE	2025-03-11 01:57:46.889339	2025-03-11 01:57:46.889339
16447	2749	8	null	2025-03-11 01:57:46.955927	2025-03-11 01:57:46.955927
16448	2749	9	null	2025-03-11 01:57:47.02204	2025-03-11 01:57:47.02204
16449	2750	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:47.155044	2025-03-11 01:57:47.155044
16450	2750	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:47.221163	2025-03-11 01:57:47.221163
16451	2750	6	null	2025-03-11 01:57:47.28719	2025-03-11 01:57:47.28719
16452	2750	7	TRUE	2025-03-11 01:57:47.353196	2025-03-11 01:57:47.353196
16453	2750	8	null	2025-03-11 01:57:47.419142	2025-03-11 01:57:47.419142
16454	2750	9	null	2025-03-11 01:57:47.48532	2025-03-11 01:57:47.48532
16455	2751	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:47.616892	2025-03-11 01:57:47.616892
16456	2751	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:47.683383	2025-03-11 01:57:47.683383
16457	2751	6	null	2025-03-11 01:57:47.749253	2025-03-11 01:57:47.749253
16458	2751	7	TRUE	2025-03-11 01:57:47.81508	2025-03-11 01:57:47.81508
16459	2751	8	null	2025-03-11 01:57:47.881298	2025-03-11 01:57:47.881298
16460	2751	9	null	2025-03-11 01:57:47.947105	2025-03-11 01:57:47.947105
16461	2752	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:48.085299	2025-03-11 01:57:48.085299
16462	2752	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:48.157591	2025-03-11 01:57:48.157591
16463	2752	6	null	2025-03-11 01:57:48.223426	2025-03-11 01:57:48.223426
16464	2752	7	TRUE	2025-03-11 01:57:48.28901	2025-03-11 01:57:48.28901
16465	2752	8	null	2025-03-11 01:57:48.35496	2025-03-11 01:57:48.35496
16466	2752	9	null	2025-03-11 01:57:48.42077	2025-03-11 01:57:48.42077
16467	2753	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:48.558109	2025-03-11 01:57:48.558109
16468	2753	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:48.624624	2025-03-11 01:57:48.624624
16469	2753	6	null	2025-03-11 01:57:48.690497	2025-03-11 01:57:48.690497
16470	2753	7	TRUE	2025-03-11 01:57:48.756198	2025-03-11 01:57:48.756198
16471	2753	8	null	2025-03-11 01:57:48.822041	2025-03-11 01:57:48.822041
16472	2753	9	null	2025-03-11 01:57:48.888508	2025-03-11 01:57:48.888508
16473	2754	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:49.019049	2025-03-11 01:57:49.019049
16474	2754	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:57:49.084851	2025-03-11 01:57:49.084851
16475	2754	6	null	2025-03-11 01:57:49.150733	2025-03-11 01:57:49.150733
16476	2754	7	TRUE	2025-03-11 01:57:49.217154	2025-03-11 01:57:49.217154
16477	2754	8	null	2025-03-11 01:57:49.283473	2025-03-11 01:57:49.283473
16478	2754	9	null	2025-03-11 01:57:49.349299	2025-03-11 01:57:49.349299
16479	2755	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:49.482415	2025-03-11 01:57:49.482415
16480	2755	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:49.555023	2025-03-11 01:57:49.555023
16481	2755	6	null	2025-03-11 01:57:49.621137	2025-03-11 01:57:49.621137
16482	2755	7	TRUE	2025-03-11 01:57:49.68719	2025-03-11 01:57:49.68719
16483	2755	8	null	2025-03-11 01:57:49.753657	2025-03-11 01:57:49.753657
16484	2755	9	null	2025-03-11 01:57:49.819745	2025-03-11 01:57:49.819745
16485	2756	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:49.953999	2025-03-11 01:57:49.953999
16486	2756	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:50.020054	2025-03-11 01:57:50.020054
16487	2756	6	null	2025-03-11 01:57:50.087292	2025-03-11 01:57:50.087292
16488	2756	7	TRUE	2025-03-11 01:57:50.153631	2025-03-11 01:57:50.153631
16489	2756	8	null	2025-03-11 01:57:50.220383	2025-03-11 01:57:50.220383
16490	2756	9	null	2025-03-11 01:57:50.286636	2025-03-11 01:57:50.286636
16491	2757	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:50.418596	2025-03-11 01:57:50.418596
16492	2757	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:50.484692	2025-03-11 01:57:50.484692
16493	2757	6	null	2025-03-11 01:57:50.550836	2025-03-11 01:57:50.550836
16494	2757	7	TRUE	2025-03-11 01:57:50.617159	2025-03-11 01:57:50.617159
16495	2757	8	null	2025-03-11 01:57:50.683003	2025-03-11 01:57:50.683003
16496	2757	9	null	2025-03-11 01:57:50.749012	2025-03-11 01:57:50.749012
16497	2758	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:50.881251	2025-03-11 01:57:50.881251
16498	2758	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:50.94719	2025-03-11 01:57:50.94719
16499	2758	6	null	2025-03-11 01:57:51.01261	2025-03-11 01:57:51.01261
16500	2758	7	TRUE	2025-03-11 01:57:51.078689	2025-03-11 01:57:51.078689
16501	2758	8	null	2025-03-11 01:57:51.144477	2025-03-11 01:57:51.144477
16502	2758	9	null	2025-03-11 01:57:51.210336	2025-03-11 01:57:51.210336
16503	2759	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:51.342253	2025-03-11 01:57:51.342253
16504	2759	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:51.407896	2025-03-11 01:57:51.407896
16505	2759	6	null	2025-03-11 01:57:51.473465	2025-03-11 01:57:51.473465
16506	2759	7	TRUE	2025-03-11 01:57:51.538286	2025-03-11 01:57:51.538286
16507	2759	8	null	2025-03-11 01:57:51.604126	2025-03-11 01:57:51.604126
16508	2759	9	null	2025-03-11 01:57:51.669964	2025-03-11 01:57:51.669964
16509	2760	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:51.801339	2025-03-11 01:57:51.801339
16510	2760	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:57:51.868952	2025-03-11 01:57:51.868952
16511	2760	6	null	2025-03-11 01:57:51.936607	2025-03-11 01:57:51.936607
16512	2760	7	TRUE	2025-03-11 01:57:52.002774	2025-03-11 01:57:52.002774
16513	2760	8	null	2025-03-11 01:57:52.07388	2025-03-11 01:57:52.07388
16514	2760	9	null	2025-03-11 01:57:52.143232	2025-03-11 01:57:52.143232
16515	2761	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:52.275119	2025-03-11 01:57:52.275119
16516	2761	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:57:52.341087	2025-03-11 01:57:52.341087
16517	2761	6	null	2025-03-11 01:57:52.406824	2025-03-11 01:57:52.406824
16518	2761	7	TRUE	2025-03-11 01:57:52.472621	2025-03-11 01:57:52.472621
16519	2761	8	null	2025-03-11 01:57:52.538383	2025-03-11 01:57:52.538383
16520	2761	9	null	2025-03-11 01:57:52.60466	2025-03-11 01:57:52.60466
16521	2762	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:52.762395	2025-03-11 01:57:52.762395
16522	2762	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:57:52.828716	2025-03-11 01:57:52.828716
16523	2762	6	null	2025-03-11 01:57:52.894606	2025-03-11 01:57:52.894606
16524	2762	7	TRUE	2025-03-11 01:57:52.960532	2025-03-11 01:57:52.960532
16525	2762	8	null	2025-03-11 01:57:53.027026	2025-03-11 01:57:53.027026
16526	2762	9	null	2025-03-11 01:57:53.093905	2025-03-11 01:57:53.093905
16527	2763	4	39b8e028fe0fcee263e0141a0f6800b7	2025-03-11 01:57:53.226669	2025-03-11 01:57:53.226669
16528	2763	5	54e2537f934a9d060dd324b129e40eaa	2025-03-11 01:57:53.292886	2025-03-11 01:57:53.292886
16529	2763	6	null	2025-03-11 01:57:53.358946	2025-03-11 01:57:53.358946
16530	2763	7	TRUE	2025-03-11 01:57:53.424961	2025-03-11 01:57:53.424961
16531	2763	8	null	2025-03-11 01:57:53.490789	2025-03-11 01:57:53.490789
16532	2763	9	null	2025-03-11 01:57:53.557416	2025-03-11 01:57:53.557416
16533	2764	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:53.689125	2025-03-11 01:57:53.689125
16534	2764	5	6f24207574924e0e64b62dfa3a32eeaa	2025-03-11 01:57:53.755135	2025-03-11 01:57:53.755135
16535	2764	6	null	2025-03-11 01:57:53.82142	2025-03-11 01:57:53.82142
16536	2764	7	TRUE	2025-03-11 01:57:53.889278	2025-03-11 01:57:53.889278
16537	2764	8	null	2025-03-11 01:57:53.954975	2025-03-11 01:57:53.954975
16538	2764	9	null	2025-03-11 01:57:54.020829	2025-03-11 01:57:54.020829
16539	2765	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:54.15254	2025-03-11 01:57:54.15254
16540	2765	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:57:54.217935	2025-03-11 01:57:54.217935
16541	2765	6	null	2025-03-11 01:57:54.284027	2025-03-11 01:57:54.284027
16542	2765	7	FALSE	2025-03-11 01:57:54.349781	2025-03-11 01:57:54.349781
16543	2765	8	null	2025-03-11 01:57:54.421572	2025-03-11 01:57:54.421572
16544	2765	9	null	2025-03-11 01:57:54.487859	2025-03-11 01:57:54.487859
16545	2766	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:54.62004	2025-03-11 01:57:54.62004
16546	2766	5	9626bbd88c300cb77b5697e32bd86518	2025-03-11 01:57:54.687344	2025-03-11 01:57:54.687344
16547	2766	6	null	2025-03-11 01:57:54.753055	2025-03-11 01:57:54.753055
16548	2766	7	TRUE	2025-03-11 01:57:54.820883	2025-03-11 01:57:54.820883
16549	2766	8	null	2025-03-11 01:57:54.90051	2025-03-11 01:57:54.90051
16550	2766	9	null	2025-03-11 01:57:54.967432	2025-03-11 01:57:54.967432
16551	2767	4	38ad5f1e4d306fcc8cdcf23d31776188	2025-03-11 01:57:55.100252	2025-03-11 01:57:55.100252
16552	2767	5	791df49aa39fd47edb50e16fbcf15a69	2025-03-11 01:57:55.166093	2025-03-11 01:57:55.166093
16553	2767	6	null	2025-03-11 01:57:55.231879	2025-03-11 01:57:55.231879
16554	2767	7	TRUE	2025-03-11 01:57:55.298145	2025-03-11 01:57:55.298145
16555	2767	8	null	2025-03-11 01:57:55.364414	2025-03-11 01:57:55.364414
16556	2767	9	null	2025-03-11 01:57:55.429324	2025-03-11 01:57:55.429324
16557	2768	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:55.560337	2025-03-11 01:57:55.560337
16558	2768	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:57:55.626948	2025-03-11 01:57:55.626948
16559	2768	6	null	2025-03-11 01:57:55.692799	2025-03-11 01:57:55.692799
16560	2768	7	FALSE	2025-03-11 01:57:55.758714	2025-03-11 01:57:55.758714
16561	2768	8	null	2025-03-11 01:57:55.825423	2025-03-11 01:57:55.825423
16562	2768	9	null	2025-03-11 01:57:55.892086	2025-03-11 01:57:55.892086
16563	2769	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:56.023653	2025-03-11 01:57:56.023653
16564	2769	5	cfcb336f8e3001ab3a64ffef55e44614	2025-03-11 01:57:56.089575	2025-03-11 01:57:56.089575
16565	2769	6	null	2025-03-11 01:57:56.154402	2025-03-11 01:57:56.154402
16566	2769	7	TRUE	2025-03-11 01:57:56.220289	2025-03-11 01:57:56.220289
16567	2769	8	null	2025-03-11 01:57:56.286345	2025-03-11 01:57:56.286345
16568	2769	9	null	2025-03-11 01:57:56.353258	2025-03-11 01:57:56.353258
16569	2770	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:56.48785	2025-03-11 01:57:56.48785
16570	2770	5	cfcb336f8e3001ab3a64ffef55e44614	2025-03-11 01:57:56.553758	2025-03-11 01:57:56.553758
16571	2770	6	null	2025-03-11 01:57:56.619597	2025-03-11 01:57:56.619597
16572	2770	7	TRUE	2025-03-11 01:57:56.68544	2025-03-11 01:57:56.68544
16573	2770	8	null	2025-03-11 01:57:56.753174	2025-03-11 01:57:56.753174
16574	2770	9	null	2025-03-11 01:57:56.819083	2025-03-11 01:57:56.819083
16575	2771	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:56.950404	2025-03-11 01:57:56.950404
16576	2771	5	cfcb336f8e3001ab3a64ffef55e44614	2025-03-11 01:57:57.016258	2025-03-11 01:57:57.016258
16577	2771	6	null	2025-03-11 01:57:57.082556	2025-03-11 01:57:57.082556
16578	2771	7	TRUE	2025-03-11 01:57:57.149055	2025-03-11 01:57:57.149055
16579	2771	8	null	2025-03-11 01:57:57.21492	2025-03-11 01:57:57.21492
16580	2771	9	null	2025-03-11 01:57:57.280721	2025-03-11 01:57:57.280721
16581	2772	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:57.413027	2025-03-11 01:57:57.413027
16582	2772	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:57:57.480082	2025-03-11 01:57:57.480082
16583	2772	6	null	2025-03-11 01:57:57.545822	2025-03-11 01:57:57.545822
16584	2772	7	FALSE	2025-03-11 01:57:57.611854	2025-03-11 01:57:57.611854
16585	2772	8	null	2025-03-11 01:57:57.67762	2025-03-11 01:57:57.67762
16586	2772	9	null	2025-03-11 01:57:57.742352	2025-03-11 01:57:57.742352
16587	2773	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:57.875697	2025-03-11 01:57:57.875697
16588	2773	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:57.941547	2025-03-11 01:57:57.941547
16589	2773	6	null	2025-03-11 01:57:58.007296	2025-03-11 01:57:58.007296
16590	2773	7	TRUE	2025-03-11 01:57:58.073258	2025-03-11 01:57:58.073258
16591	2773	8	null	2025-03-11 01:57:58.138671	2025-03-11 01:57:58.138671
16592	2773	9	null	2025-03-11 01:57:58.204804	2025-03-11 01:57:58.204804
16593	2774	4	d7df1acbb1975108dafb49deb4899925	2025-03-11 01:57:58.336094	2025-03-11 01:57:58.336094
16594	2774	5	96ed1abb5de078b2860b0e32812fce8c	2025-03-11 01:57:58.401782	2025-03-11 01:57:58.401782
16595	2774	6	null	2025-03-11 01:57:58.466692	2025-03-11 01:57:58.466692
16596	2774	7	FALSE	2025-03-11 01:57:58.533315	2025-03-11 01:57:58.533315
16597	2774	8	null	2025-03-11 01:57:58.599065	2025-03-11 01:57:58.599065
16598	2774	9	null	2025-03-11 01:57:58.665647	2025-03-11 01:57:58.665647
16599	2775	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:57:58.822189	2025-03-11 01:57:58.822189
16600	2775	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:58.887801	2025-03-11 01:57:58.887801
16601	2775	6	null	2025-03-11 01:57:58.953486	2025-03-11 01:57:58.953486
16602	2775	7	TRUE	2025-03-11 01:57:59.019598	2025-03-11 01:57:59.019598
16603	2775	8	null	2025-03-11 01:57:59.085354	2025-03-11 01:57:59.085354
16604	2775	9	null	2025-03-11 01:57:59.151006	2025-03-11 01:57:59.151006
16605	2776	4	26004ead20da671b5edf00c052abe006	2025-03-11 01:57:59.283282	2025-03-11 01:57:59.283282
16606	2776	5	9626bbd88c300cb77b5697e32bd86518	2025-03-11 01:57:59.351522	2025-03-11 01:57:59.351522
16607	2776	6	null	2025-03-11 01:57:59.41642	2025-03-11 01:57:59.41642
16608	2776	7	TRUE	2025-03-11 01:57:59.481964	2025-03-11 01:57:59.481964
16609	2776	8	null	2025-03-11 01:57:59.549	2025-03-11 01:57:59.549
16610	2776	9	null	2025-03-11 01:57:59.615454	2025-03-11 01:57:59.615454
16611	2777	4	c36b59273dda27fdbd0e92331065eb22	2025-03-11 01:57:59.746759	2025-03-11 01:57:59.746759
16612	2777	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:57:59.812748	2025-03-11 01:57:59.812748
16613	2777	6	null	2025-03-11 01:57:59.878445	2025-03-11 01:57:59.878445
16614	2777	7	TRUE	2025-03-11 01:57:59.944826	2025-03-11 01:57:59.944826
16615	2777	8	null	2025-03-11 01:58:00.013753	2025-03-11 01:58:00.013753
16616	2777	9	null	2025-03-11 01:58:00.080605	2025-03-11 01:58:00.080605
16617	2778	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:58:00.213141	2025-03-11 01:58:00.213141
16618	2778	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:58:00.279173	2025-03-11 01:58:00.279173
16619	2778	6	null	2025-03-11 01:58:00.346861	2025-03-11 01:58:00.346861
16620	2778	7	TRUE	2025-03-11 01:58:00.413152	2025-03-11 01:58:00.413152
16621	2778	8	null	2025-03-11 01:58:00.478983	2025-03-11 01:58:00.478983
16622	2778	9	null	2025-03-11 01:58:00.544856	2025-03-11 01:58:00.544856
16623	2779	4	eaf8507b2e9de65ceb203e886c427076	2025-03-11 01:58:00.678064	2025-03-11 01:58:00.678064
16624	2779	5	a6ae0254cf388824676f8ffc71374f48	2025-03-11 01:58:00.743842	2025-03-11 01:58:00.743842
16625	2779	6	null	2025-03-11 01:58:00.8097	2025-03-11 01:58:00.8097
16626	2779	7	TRUE	2025-03-11 01:58:00.875568	2025-03-11 01:58:00.875568
16627	2779	8	null	2025-03-11 01:58:00.941535	2025-03-11 01:58:00.941535
16628	2