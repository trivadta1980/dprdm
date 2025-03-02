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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
    updated_at timestamp without time zone DEFAULT now() NOT NULL
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
-- Name: relationship_values; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.relationship_values (
    id integer NOT NULL,
    relationship_id integer NOT NULL,
    source_instance_id text NOT NULL,
    target_instance_id text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
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
-- Name: crosswalk_mappings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crosswalk_mappings ALTER COLUMN id SET DEFAULT nextval('public.crosswalk_mappings_id_seq'::regclass);


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
-- Data for Name: crosswalk_mappings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.crosswalk_mappings (id, name, description, source_system_id, target_system_id, mapping_data, created_at, updated_at) FROM stdin;
1	test	test	5	1	{"mappings": [{"confidence": 0.8, "sourceValue": "Australia1", "targetValue": "Australia"}, {"confidence": 0.8, "sourceValue": "Brazil1", "targetValue": "Brazil"}, {"confidence": 0.8, "sourceValue": "Canada1", "targetValue": "Canada"}, {"confidence": 0.8, "sourceValue": "Denmark1", "targetValue": "Denmark"}, {"confidence": 0.8, "sourceValue": "Egypt1", "targetValue": "Egypt"}, {"confidence": 0.8, "sourceValue": "France1", "targetValue": "France"}, {"confidence": 0.8, "sourceValue": "Germany1", "targetValue": "Germany"}, {"confidence": 0.8, "sourceValue": "Hungary1", "targetValue": "Hungary"}, {"confidence": 0.8, "sourceValue": "Indonesia1", "targetValue": "Indonesia"}, {"confidence": 0.8, "sourceValue": "Japan1", "targetValue": "Japan"}, {"confidence": 0.8, "sourceValue": "India1", "targetValue": "India"}], "sourceAttribute": "Country", "targetAttribute": "Country"}	2025-02-23 04:16:29.627652	2025-02-23 20:11:40.609
2	Enterprise Cities - SFDC Cities	Map Enterprise Cities to SFDC Cities	7	6	{"mappings": [{"confidence": 0.7, "sourceValue": "SFO", "targetValue": "San Francisco"}, {"confidence": 0.8, "sourceValue": "Dub", "targetValue": "Dublin"}], "sourceAttribute": "City", "targetAttribute": "City"}	2025-02-28 00:33:01.046616	2025-02-28 00:43:16.372
\.


--
-- Data for Name: reference_data_sets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reference_data_sets (id, name, description, type_id, data, created_at, updated_at) FROM stdin;
3	Customer Gender	Customer Gender	3	{"instance_1": {"_history": [{"changes": [{"field": "Gender_Code", "newValue": "M", "oldValue": ""}, {"field": "Gender_Name", "newValue": "Male", "oldValue": ""}], "timestamp": "2025-02-19T05:56:30.592Z"}], "Gender_Code": "M", "Gender_Name": "Male"}, "instance_2": {"_history": [{"changes": [{"field": "Gender_Code", "newValue": "F", "oldValue": ""}, {"field": "Gender_Name", "newValue": "Female", "oldValue": ""}], "timestamp": "2025-02-19T05:56:38.736Z"}], "Gender_Code": "F", "Gender_Name": "Female"}, "instance_3": {"_history": [{"changes": [{"field": "Gender_Code", "newValue": "O", "oldValue": ""}, {"field": "Gender_Name", "newValue": "Others", "oldValue": ""}], "timestamp": "2025-02-19T05:56:44.587Z"}], "Gender_Code": "O", "Gender_Name": "Others"}}	2025-02-19 05:56:20.181935	2025-02-19 05:56:44.731
5	SFDC Countries	Countries from SFDC	1	{"instance_1": {"Country": "Australia1", "Country_Code": "AUS1"}, "instance_2": {"Country": "Brazil1", "Country_Code": "BRA1"}, "instance_3": {"Country": "Canada1", "Country_Code": "CAN1"}, "instance_4": {"Country": "Denmark1", "Country_Code": "DNK1"}, "instance_5": {"Country": "Egypt1", "Country_Code": "EGY1"}, "instance_6": {"Country": "France1", "Country_Code": "FRA1"}, "instance_7": {"Country": "Germany1", "Country_Code": "DEU1"}, "instance_8": {"Country": "Hungary1", "Country_Code": "HUN1"}, "instance_9": {"Country": "Indonesia1", "Country_Code": "IDN1"}, "instance_10": {"Country": "Japan1", "Country_Code": "JPN1"}, "instance_11": {"Country": "India1", "_history": [{"changes": [{"field": "Country", "newValue": "India1", "oldValue": ""}, {"field": "Country_Code", "newValue": "IN1", "oldValue": ""}], "timestamp": "2025-02-23T20:07:50.273Z"}], "Country_Code": "IN1"}}	2025-02-22 19:55:44.619774	2025-02-23 20:07:52.76
4	States	States used in the enterpris	4	{"instance_1": {"State": "California", "_history": [{"changes": [{"field": "State", "newValue": "California", "oldValue": ""}, {"field": "State_Code", "newValue": "CA", "oldValue": ""}], "timestamp": "2025-02-19T23:11:53.712Z"}], "State_Code": "CA"}, "instance_2": {"State": "Texas", "_history": [{"changes": [{"field": "State", "newValue": "Texas", "oldValue": ""}, {"field": "State_Code", "newValue": "TX", "oldValue": ""}], "timestamp": "2025-02-19T23:12:05.169Z"}], "State_Code": "TX"}}	2025-02-19 23:10:50.487246	2025-02-19 23:12:05.73
1	Enterprise Countries	This is a list of countries that are managed in the enterprise	1	{"instance_1": {"Country": "Australia", "Country_Code": "AUS"}, "instance_2": {"Country": "Brazil", "Country_Code": "BRA"}, "instance_3": {"Country": "Canada", "Country_Code": "CAN"}, "instance_4": {"Country": "Denmark", "Country_Code": "DNK"}, "instance_5": {"Country": "Egypt", "Country_Code": "EGY"}, "instance_6": {"Country": "France", "Country_Code": "FRA"}, "instance_7": {"Country": "Germany", "Country_Code": "DEU"}, "instance_8": {"Country": "Hungary", "Country_Code": "HUN"}, "instance_9": {"Country": "Indonesia", "Country_Code": "IDN"}, "instance_10": {"Country": "Japan", "Country_Code": "JPN"}, "instance_11": {"Country": "India", "_history": [{"changes": [{"field": "Country", "newValue": "India", "oldValue": ""}, {"field": "Country_Code", "newValue": "IN", "oldValue": ""}], "timestamp": "2025-02-23T20:08:08.831Z"}], "Country_Code": "IN"}}	2025-02-19 00:53:46.956551	2025-02-23 20:08:09.268
6	Enterprise Cities	Enterprise Cities	5	{"instance_1": {"City": "San Francisco", "_history": [{"changes": [{"field": "City_Code", "newValue": "SFO1", "oldValue": "SFO"}], "timestamp": "2025-02-25T21:36:40.611Z"}], "City_Code": "SFO1"}, "instance_2": {"City": "Dublin", "City_Code": "DUB"}}	2025-02-25 21:34:57.287301	2025-02-25 21:36:40.91
2	Enterprise Products	All the enterprise products	2	{"instance_1": {"Product_ID": "P001", "Product_Name": "Macbook Pro 17 - 1", "Product_Category": "Laptop"}, "instance_2": {"Product_ID": "P002", "Product_Name": "Macbook Pro 18 - 2", "Product_Category": "Laptop"}, "instance_3": {"Product_ID": "P003", "Product_Name": "Macbook Pro 17 - 2", "Product_Category": "Laptop"}, "instance_4": {"Product_ID": "P004", "Product_Name": "Macbook Pro 18 - 3", "Product_Category": "Laptop"}, "instance_5": {"Product_ID": "P005", "Product_Name": "Macbook Pro 17 - 3", "Product_Category": "Laptop"}, "instance_6": {"Product_ID": "P006", "Product_Name": "Macbook Pro 18 - 4", "Product_Category": "Laptop"}, "instance_7": {"Product_ID": "P007", "Product_Name": "Macbook Pro 17 - 4", "Product_Category": "Laptop"}, "instance_8": {"Product_ID": "P008", "Product_Name": "Macbook Pro 18 - 5", "Product_Category": "Laptop"}, "instance_9": {"Product_ID": "P009", "Product_Name": "Macbook Pro 17 - 5", "Product_Category": "Laptop"}, "instance_10": {"Product_ID": "P010", "Product_Name": "Macbook Pro 18 - 6", "Product_Category": "Laptop"}, "instance_11": {"Product_ID": "P011", "Product_Name": "Macbook Pro 17 - 6", "Product_Category": "Laptop"}, "instance_12": {"Product_ID": "P012", "Product_Name": "Macbook Pro 18 - 7", "Product_Category": "Laptop"}}	2025-02-19 05:30:17.2092	2025-02-27 04:02:18.436
7	SFDC Cities	Cities in SFDC	5	{"instance_1": {"City": "SFO", "City_Code": "SFDC_SFO"}, "instance_2": {"City": "Dub", "City_Code": "SDFC_DUB"}}	2025-02-28 00:29:56.243979	2025-02-28 00:31:57.551
\.


--
-- Data for Name: reference_data_type_schemas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reference_data_type_schemas (id, reference_data_type_id, name, data_type, created_at) FROM stdin;
3	1	Country	String	2025-02-18 23:38:35.023964
4	1	Country_Code	String	2025-02-18 23:38:35.023964
5	2	Product_ID	String	2025-02-19 05:25:31.347994
6	2	Product_Category	String	2025-02-19 05:25:31.347994
7	2	Product_Name	String	2025-02-19 05:25:31.347994
8	3	Gender_Code	String	2025-02-19 05:55:45.232872
9	3	Gender_Name	String	2025-02-19 05:55:45.232872
10	4	State	String	2025-02-19 23:10:18.494832
11	4	State_Code	String	2025-02-19 23:10:18.494832
12	5	City_Code	String	2025-02-25 21:34:12.767833
13	5	City	String	2025-02-25 21:34:12.767833
\.


--
-- Data for Name: reference_data_types; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reference_data_types (id, name, description, created_at, updated_at) FROM stdin;
1	Country	Countries	2025-02-18 23:25:28.976737	2025-02-18 23:38:35.067
2	Product	Product Description	2025-02-19 05:25:31.347994	2025-02-19 05:25:31.347994
3	Gender	Gender	2025-02-19 05:55:45.232872	2025-02-19 05:55:45.232872
4	State	States in the Enterprise	2025-02-19 23:10:18.494832	2025-02-19 23:10:18.494832
5	Cities	All the citiies	2025-02-25 21:34:12.767833	2025-02-25 21:34:12.767833
\.


--
-- Data for Name: relationship_values; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.relationship_values (id, relationship_id, source_instance_id, target_instance_id, metadata, created_at, updated_at) FROM stdin;
1	1	instance_3	instance_1	\N	2025-02-20 02:10:22.025091	2025-02-20 02:10:22.025091
2	1	instance_3	instance_2	\N	2025-02-20 02:10:30.563042	2025-02-20 02:10:30.563042
4	2	instance_1	instance_1	\N	2025-02-25 21:38:33.935829	2025-02-25 21:38:33.935829
5	2	instance_1	instance_2	\N	2025-02-25 21:39:13.002307	2025-02-25 21:39:13.002307
\.


--
-- Data for Name: relationships; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.relationships (id, source_dataset_id, target_dataset_id, relationship_type, cardinality, source_field, target_field, created_at, updated_at, relationship_name) FROM stdin;
1	1	4	parent-child	one-to-many	Country_Code	State_Code	2025-02-20 01:41:36.932661	2025-02-20 01:53:00.359	Enterprise Countries -> States
2	4	6	parent-child	many-to-many	State	City	2025-02-25 21:38:14.324231	2025-02-27 03:30:33.776	Enterprise State To Cities
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, description, created_at, route_permissions, routes) FROM stdin;
1	admin	Administrator with full access	2025-02-18 21:46:48.560407	\N	\N
3	user	Standard user with limited access	2025-02-18 22:18:27.633003	\N	{/reference-data}
6	Sales User	Sales user	2025-02-19 05:54:53.762537	\N	{/reference-data,/relationships,/crosswalks}
4	Business User	Ablility to just add reference data and establish relationships	2025-02-18 22:36:40.910537	{/reference-data,/relationships}	{/reference-data,/relationships,/crosswalks}
5	Marketing User	Marketing user 	2025-02-18 22:48:18.416484	\N	{/reference-data,/relationships,/crosswalks,/reference-types}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
mw-jyadUDeu4cBXhdVje88yJTEyMNS7T	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-03-03 01:28:23
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, email, role_id, is_active, created_at, updated_at, reset_token, reset_token_expiry, require_password_change) FROM stdin;
1	admin	104e0afb216c24410e3450756e92183d5b1c8517e2b3fce530f64c688c9787f70cfffebb43f4d341ea5f4eaf989da3a2105cfcf09a0022351ba393dab7d48efc.e8c9c547234719a8a5ace5b671373808	jitender.nankani@gmail.com	1	t	2025-02-18 21:48:39.454161	2025-02-18 22:06:03.098	02366867bc1de2885804a578eb1e91b6f1a2f37714f8985b2bdbac87dacb2eff	2025-02-18 23:06:03.098	f
11	admin40	080ef1f1a7c97477a633e552d57254a361197c5736dece2f0b409ae8087547d8da7fc758279c1b2de66a02f198cfbf9eb913d691959d2e9a81edb7b62dece27f.ef004344424b67606925bbac1f0a3180	x@example12.com	3	f	2025-03-01 22:47:47.002915	2025-03-01 23:48:36.075	\N	\N	t
12	admin50	6d95a8e40f1f2dac32355ab4b1422b17ee5035288c609d58daa36e43dd98dd4b048646f4b60970a9f9e868e65f610d9619e0bbfb60eed2a6b7a169433333d713.d3fb0417fc5bf9a70bc6d994806a16be	x@x30.com	6	f	2025-03-01 22:50:14.705016	2025-03-01 23:48:44.375	\N	\N	t
5	satishm	64c52987a829613f56d9fb21583d0403b8ec28c5fc8f0964abf00e41fe5facc6178de587839f1ed70b6cf4fa277645afaaa4fbc1aed50cc2b66c4a978b41f4ee.2efdc9f3a5821e79ae01012d34f86896	satish.mallavolu@blumetra.com	3	t	2025-02-18 22:28:48.924127	2025-03-01 23:49:05.165	\N	\N	f
13	someone	9d5ecc3aa8a0709216d5baad2e2f641e74dafe04fd30be659c237012afae86bc1a28fe37b7d90718413cf8fa5e362bd115fd5350afd734edacf7710a2e6f677f.8191ffcdd57ac8f359f744ea8d03b6b7	someone@somewhere.com	3	t	2025-03-01 22:54:01.784094	2025-03-01 22:55:16.12	\N	\N	f
6	abc	d31bbee536bfd27c990278104e31535584bf795e3e419f64072693019660e18732d333cbbb85df4cc144373b8b9d28dd6da31f7eac5565931333075339c144e7.1f063bfa707890719ce01a2abc07a2e9	abc@gmail.com	3	f	2025-02-18 22:37:24.689649	2025-03-01 23:48:27.761	\N	\N	t
7	admin1	514ba990ab9618fcc983b6fa522f750b5669e0b0470e5bd8d29d4f1580cc7b5c0588664c975fa940bd8e56ea429282c5b71c3f41ccd71d28464fc101e7ed833e.fe466b07fb164cdc877bfc4e865dc8e0	jitendernankani@hotmail.com	3	f	2025-03-01 22:18:22.544445	2025-03-01 23:48:31.477	\N	\N	t
8	admin2	8266fa3ffcea57aa815cbd98c5a94d5ee55bdfc12bffbc4b8211088161e9f3c119d08b7dc0473313afeef03f88217672957171c66a3a663ceb63e626c546c43f.43f9a0d28310b9b89c958d0a77beeab3	x@x.com	3	f	2025-03-01 22:27:30.527792	2025-03-01 23:48:32.969	\N	\N	f
9	admin4	e1131d8c6923dac1ffaece321390f0203477ef23328f212251612d2f3d7de6f2bc8a4b09000b5ac9f7dcfc841d5beef80ad2d3dac357edf1ca2278b82eba05df.49f6226f3281fac1f23b103c4ca38abb	cde@example.com	5	f	2025-03-01 22:32:09.594522	2025-03-01 23:48:33.919	\N	\N	t
10	admin20	95b620d9a99fdd5d2e220cb440ae7d23d4b0dc97e330edc2fb4fed7c1bc18808c53b68589c9be26190d82411fef869d79ef149b68302fd5827eee1c7d6257d73.38dbf670c9afe6019bb044a137999ab0	x@x2.com	3	f	2025-03-01 22:44:39.606198	2025-03-01 23:48:35.031	\N	\N	t
\.


--
-- Name: crosswalk_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.crosswalk_mappings_id_seq', 2, true);


--
-- Name: reference_data_sets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reference_data_sets_id_seq', 7, true);


--
-- Name: reference_data_type_schemas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reference_data_type_schemas_id_seq', 13, true);


--
-- Name: reference_data_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reference_data_types_id_seq', 5, true);


--
-- Name: relationship_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.relationship_values_id_seq', 5, true);


--
-- Name: relationships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.relationships_id_seq', 2, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: users_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_role_id_seq', 2, true);


--
-- Name: crosswalk_mappings crosswalk_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crosswalk_mappings
    ADD CONSTRAINT crosswalk_mappings_pkey PRIMARY KEY (id);


--
-- Name: reference_data_sets reference_data_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_sets
    ADD CONSTRAINT reference_data_sets_pkey PRIMARY KEY (id);


--
-- Name: reference_data_type_schemas reference_data_type_schemas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_type_schemas
    ADD CONSTRAINT reference_data_type_schemas_pkey PRIMARY KEY (id);


--
-- Name: reference_data_types reference_data_types_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_types
    ADD CONSTRAINT reference_data_types_name_key UNIQUE (name);


--
-- Name: reference_data_types reference_data_types_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_types
    ADD CONSTRAINT reference_data_types_pkey PRIMARY KEY (id);


--
-- Name: relationship_values relationship_values_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationship_values
    ADD CONSTRAINT relationship_values_pkey PRIMARY KEY (id);


--
-- Name: relationships relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_unique UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_crosswalk_source; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_crosswalk_source ON public.crosswalk_mappings USING btree (source_system_id);


--
-- Name: idx_crosswalk_target; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_crosswalk_target ON public.crosswalk_mappings USING btree (target_system_id);


--
-- Name: crosswalk_mappings crosswalk_mappings_source_system_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crosswalk_mappings
    ADD CONSTRAINT crosswalk_mappings_source_system_id_fkey FOREIGN KEY (source_system_id) REFERENCES public.reference_data_sets(id);


--
-- Name: crosswalk_mappings crosswalk_mappings_target_system_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crosswalk_mappings
    ADD CONSTRAINT crosswalk_mappings_target_system_id_fkey FOREIGN KEY (target_system_id) REFERENCES public.reference_data_sets(id);


--
-- Name: reference_data_sets reference_data_sets_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_sets
    ADD CONSTRAINT reference_data_sets_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.reference_data_types(id);


--
-- Name: reference_data_type_schemas reference_data_type_schemas_reference_data_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reference_data_type_schemas
    ADD CONSTRAINT reference_data_type_schemas_reference_data_type_id_fkey FOREIGN KEY (reference_data_type_id) REFERENCES public.reference_data_types(id);


--
-- Name: relationship_values relationship_values_relationship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationship_values
    ADD CONSTRAINT relationship_values_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id);


--
-- Name: relationships relationships_source_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_source_dataset_id_fkey FOREIGN KEY (source_dataset_id) REFERENCES public.reference_data_sets(id);


--
-- Name: relationships relationships_target_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_target_dataset_id_fkey FOREIGN KEY (target_dataset_id) REFERENCES public.reference_data_sets(id);


--
-- Name: users users_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

