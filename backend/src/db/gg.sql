BEGIN;

-- Ensure PostGIS is available
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- DROP existing constraints (safe)
-- ========================================
ALTER TABLE IF EXISTS public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
ALTER TABLE IF EXISTS public.alerts DROP CONSTRAINT IF EXISTS alerts_hazard_id_fkey;
ALTER TABLE IF EXISTS public.alerts DROP CONSTRAINT IF EXISTS alerts_sent_by_fkey;
ALTER TABLE IF EXISTS public.checkins DROP CONSTRAINT IF EXISTS checkins_alert_id_fkey;
ALTER TABLE IF EXISTS public.checkins DROP CONSTRAINT IF EXISTS checkins_user_id_fkey;
ALTER TABLE IF EXISTS public.checkins DROP CONSTRAINT IF EXISTS checkins_zone_id_fkey;
ALTER TABLE IF EXISTS public.evacuation_reports DROP CONSTRAINT IF EXISTS evacuation_reports_alert_id_fkey;
ALTER TABLE IF EXISTS public.hazards DROP CONSTRAINT IF EXISTS hazards_reported_by_fkey;
ALTER TABLE IF EXISTS public.scheduled_drills DROP CONSTRAINT IF EXISTS scheduled_drills_alert_id_fkey;
ALTER TABLE IF EXISTS public.scheduled_drills DROP CONSTRAINT IF EXISTS scheduled_drills_created_by_fkey;
ALTER TABLE IF EXISTS public.sos_messages DROP CONSTRAINT IF EXISTS sos_messages_alert_id_fkey;
ALTER TABLE IF EXISTS public.sos_messages DROP CONSTRAINT IF EXISTS sos_messages_receiver_id_fkey;
ALTER TABLE IF EXISTS public.sos_messages DROP CONSTRAINT IF EXISTS sos_messages_sender_id_fkey;
ALTER TABLE IF EXISTS public.user_device_tokens DROP CONSTRAINT IF EXISTS user_device_tokens_user_id_fkey;
ALTER TABLE IF EXISTS public.zones DROP CONSTRAINT IF EXISTS zones_created_by_fkey;

-- ========================================
-- DROP tables (with CASCADE for safety)
-- ========================================
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.checkins CASCADE;
DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
DROP TABLE IF EXISTS public.evacuation_reports CASCADE;
DROP TABLE IF EXISTS public.hazards CASCADE;
DROP TABLE IF EXISTS public.scheduled_drills CASCADE;
DROP TABLE IF EXISTS public.sos_messages CASCADE;
DROP TABLE IF EXISTS public.user_device_tokens CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.zones CASCADE;

-- ========================================
-- CREATE TABLES
-- ========================================

CREATE TABLE public.users
(
    user_id serial PRIMARY KEY,
    full_name character varying(150) NOT NULL,
    email character varying(150) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    id_number character varying(50),
    department character varying(100),
    device_token text,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
);

CREATE TABLE public.zones
(
    zone_id serial PRIMARY KEY,
    name character varying(100) NOT NULL,
    type character varying(20),
    geom geometry(Polygon, 4326),
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    capacity integer DEFAULT 100
);

CREATE TABLE public.hazards
(
    hazard_id serial PRIMARY KEY,
    type character varying(50),
    description text,
    location geometry(Point, 4326),
    severity character varying(20),
    reported_by integer,
    status character varying(20) DEFAULT 'active',
    created_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone,
    photo_url character varying(255)
);

CREATE TABLE public.alerts
(
    alert_id serial PRIMARY KEY,
    hazard_id integer,
    title character varying(150),
    message text,
    sent_by integer,
    sent_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    is_drill boolean DEFAULT false
);

CREATE TABLE public.activity_logs
(
    log_id serial PRIMARY KEY,
    user_id integer,
    action character varying(50) NOT NULL,
    entity_type character varying(30),
    entity_id integer,
    details jsonb,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.checkins
(
    checkin_id serial PRIMARY KEY,
    alert_id integer,
    user_id integer,
    zone_id integer,
    checked_in_at timestamp without time zone DEFAULT now(),
    location geometry(Point, 4326),
    status character varying(20) DEFAULT 'safe',
    message text
);

CREATE TABLE public.emergency_contacts
(
    contact_id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    organization character varying(255),
    phone character varying(50) NOT NULL,
    category character varying(50) DEFAULT 'disaster',
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.evacuation_reports
(
    report_id serial PRIMARY KEY,
    alert_id integer,
    total_users integer,
    checked_in_count integer,
    generated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.scheduled_drills
(
    drill_id serial PRIMARY KEY,
    title character varying(255) NOT NULL,
    description text,
    scheduled_date timestamp with time zone NOT NULL,
    status character varying(20) DEFAULT 'scheduled',
    created_by integer,
    alert_id integer,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sos_messages
(
    message_id serial PRIMARY KEY,
    alert_id integer,
    sender_id integer,
    receiver_id integer,
    content text NOT NULL,
    location geometry(Point, 4326),
    is_read boolean DEFAULT false,
    priority character varying(20) DEFAULT 'normal',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_device_tokens
(
    token_id serial PRIMARY KEY,
    user_id integer,
    device_token text NOT NULL UNIQUE,
    platform character varying(20) DEFAULT 'android',
    last_used_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- FOREIGN KEYS
-- ========================================

ALTER TABLE public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE SET NULL;

ALTER TABLE public.alerts
    ADD CONSTRAINT alerts_hazard_id_fkey 
    FOREIGN KEY (hazard_id) REFERENCES public.hazards (hazard_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.alerts
    ADD CONSTRAINT alerts_sent_by_fkey 
    FOREIGN KEY (sent_by) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.checkins
    ADD CONSTRAINT checkins_alert_id_fkey 
    FOREIGN KEY (alert_id) REFERENCES public.alerts (alert_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.checkins
    ADD CONSTRAINT checkins_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.checkins
    ADD CONSTRAINT checkins_zone_id_fkey 
    FOREIGN KEY (zone_id) REFERENCES public.zones (zone_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.evacuation_reports
    ADD CONSTRAINT evacuation_reports_alert_id_fkey 
    FOREIGN KEY (alert_id) REFERENCES public.alerts (alert_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.hazards
    ADD CONSTRAINT hazards_reported_by_fkey 
    FOREIGN KEY (reported_by) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE public.scheduled_drills
    ADD CONSTRAINT scheduled_drills_alert_id_fkey 
    FOREIGN KEY (alert_id) REFERENCES public.alerts (alert_id)
    ON UPDATE NO ACTION ON DELETE SET NULL;

ALTER TABLE public.scheduled_drills
    ADD CONSTRAINT scheduled_drills_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE SET NULL;

ALTER TABLE public.sos_messages
    ADD CONSTRAINT sos_messages_alert_id_fkey 
    FOREIGN KEY (alert_id) REFERENCES public.alerts (alert_id)
    ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.sos_messages
    ADD CONSTRAINT sos_messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE SET NULL;

ALTER TABLE public.sos_messages
    ADD CONSTRAINT sos_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.user_device_tokens
    ADD CONSTRAINT user_device_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.zones
    ADD CONSTRAINT zones_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users (user_id)
    ON UPDATE NO ACTION ON DELETE NO ACTION;

-- ========================================
-- INDEXES (for better performance)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_checkins_alert_id ON public.checkins(alert_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alert_id ON public.sos_messages(alert_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_hazard_id ON public.alerts(hazard_id);
CREATE INDEX IF NOT EXISTS idx_hazards_reported_by ON public.hazards(reported_by);

COMMIT;