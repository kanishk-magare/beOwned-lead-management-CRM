--
-- PostgreSQL database dump
--

-- Dumped from database version 14.10
-- Dumped by pg_dump version 14.10

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
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: lead_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_notes (
    id integer NOT NULL,
    lead_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lead_notes_content_check CHECK ((char_length(content) > 0))
);


ALTER TABLE public.lead_notes OWNER TO postgres;

--
-- Name: lead_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.lead_notes_id_seq OWNER TO postgres;

--
-- Name: lead_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_notes_id_seq OWNED BY public.lead_notes.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(15) NOT NULL,
    email character varying(255) NOT NULL,
    budget numeric(14,2) NOT NULL,
    location character varying(150) NOT NULL,
    property_type character varying(20) NOT NULL,
    source character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'New'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT leads_budget_check CHECK ((budget >= (0)::numeric)),
    CONSTRAINT leads_property_type_check CHECK (((property_type)::text = ANY ((ARRAY['1 BHK'::character varying, '2 BHK'::character varying, '3 BHK'::character varying, '4+ BHK'::character varying, 'Villa'::character varying, 'Plot'::character varying, 'Commercial'::character varying])::text[]))),
    CONSTRAINT leads_source_check CHECK (((source)::text = ANY ((ARRAY['Facebook'::character varying, 'Google'::character varying, 'Instagram'::character varying, 'Referral'::character varying, 'Website'::character varying, 'Walk-in'::character varying, 'Other'::character varying])::text[]))),
    CONSTRAINT leads_status_check CHECK (((status)::text = ANY ((ARRAY['New'::character varying, 'Contacted'::character varying, 'Site Visit'::character varying, 'Closed'::character varying])::text[])))
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.leads_id_seq OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: lead_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes ALTER COLUMN id SET DEFAULT nextval('public.lead_notes_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Data for Name: lead_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_notes (id, lead_id, content, created_at) FROM stdin;
1	2	Called — prefers east-facing flat, near metro.	2026-10-01 19:52:45.056397+05:30
2	2	Sent brochure for Prestige Lakeside.	2026-10-01 19:52:45.056397+05:30
3	3	Site visit scheduled for Saturday 11 AM.	2026-10-01 19:52:45.056397+05:30
4	4	Booking amount received. Agreement signed.	2026-10-01 19:52:45.056397+05:30
5	7	Wants gated community with clubhouse. Very high intent.	2026-10-01 19:52:45.056397+05:30
6	6	test note	2026-10-01 20:33:14.719188+05:30
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, name, phone, email, budget, location, property_type, source, status, created_at, updated_at) FROM stdin;
1	Aarav Sharma	9876543210	aarav.sharma@example.com	7500000.00	Whitefield, Bangalore	2 BHK	Facebook	New	2026-09-30 19:52:45.056397+05:30	2026-09-30 19:52:45.056397+05:30
2	Priya Nair	9823456710	priya.nair@example.com	12500000.00	Koramangala, Bangalore	3 BHK	Google	Contacted	2026-09-28 19:52:45.056397+05:30	2026-09-28 19:52:45.056397+05:30
3	Rohan Mehta	9811122233	rohan.mehta@example.com	4500000.00	Hinjewadi, Pune	1 BHK	Referral	Site Visit	2026-09-25 19:52:45.056397+05:30	2026-09-25 19:52:45.056397+05:30
4	Sneha Iyer	9900112233	sneha.iyer@example.com	25000000.00	Bandra West, Mumbai	3 BHK	Website	Closed	2026-09-19 19:52:45.056397+05:30	2026-09-19 19:52:45.056397+05:30
5	Vikram Singh	9812345678	vikram.singh@example.com	9000000.00	Sector 62, Noida	Plot	Google	Contacted	2026-09-27 19:52:45.056397+05:30	2026-09-27 19:52:45.056397+05:30
7	Karan Malhotra	9988776655	karan.m@example.com	38000000.00	Golf Course Road, Gurgaon	4+ BHK	Referral	Site Visit	2026-09-23 19:52:45.056397+05:30	2026-09-23 19:52:45.056397+05:30
8	Meera Reddy	9123456780	meera.reddy@example.com	15500000.00	Jubilee Hills, Hyderabad	Villa	Facebook	Closed	2026-09-11 19:52:45.056397+05:30	2026-09-11 19:52:45.056397+05:30
9	Arjun Das	9234567810	arjun.das@example.com	5500000.00	New Town, Kolkata	2 BHK	Walk-in	New	2026-09-29 19:52:45.056397+05:30	2026-09-29 19:52:45.056397+05:30
10	Ishita Kapoor	9345678120	ishita.k@example.com	21000000.00	Powai, Mumbai	3 BHK	Google	Contacted	2026-09-26 19:52:45.056397+05:30	2026-09-26 19:52:45.056397+05:30
11	Rahul Verma	9456781230	rahul.verma@example.com	3200000.00	Electronic City, Bangalore	1 BHK	Facebook	New	2026-09-30 19:52:45.056397+05:30	2026-09-30 19:52:45.056397+05:30
12	Divya Menon	9567812340	divya.menon@example.com	18000000.00	Kakkanad, Kochi	Villa	Website	Site Visit	2026-09-21 19:52:45.056397+05:30	2026-09-21 19:52:45.056397+05:30
6	Ananya Gupta	9765432109	ananya.gupta@example.com	6200000.00	Gachibowli, Hyderabad	2 BHK	Instagram	Contacted	2026-10-01 19:52:45.056397+05:30	2026-10-01 20:33:34.855459+05:30
13	kanishk magare	8169484239	kanishkmagare55@gmail.com	6500000.00	Vikhroli	1 BHK	Walk-in	Contacted	2026-10-01 20:34:19.84358+05:30	2026-10-01 20:34:19.84358+05:30
\.


--
-- Name: lead_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lead_notes_id_seq', 6, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 13, true);


--
-- Name: lead_notes lead_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_pkey PRIMARY KEY (id);


--
-- Name: leads leads_phone_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_phone_unique UNIQUE (phone);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: idx_lead_notes_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes USING btree (lead_id, created_at DESC);


--
-- Name: idx_leads_budget; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_budget ON public.leads USING btree (budget);


--
-- Name: idx_leads_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);


--
-- Name: idx_leads_name_lower; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_name_lower ON public.leads USING btree (lower((name)::text));


--
-- Name: idx_leads_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_source ON public.leads USING btree (source);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: leads trg_leads_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lead_notes lead_notes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_notes
    ADD CONSTRAINT lead_notes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

