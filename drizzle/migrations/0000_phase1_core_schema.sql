CREATE TYPE public.app_role AS ENUM ('admin','manager','operator','viewer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text CHECK (full_name IS NULL OR char_length(full_name) <= 120),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  company text CHECK (company IS NULL OR char_length(company) <= 160),
  email text CHECK (email IS NULL OR (char_length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ()-]{6,25}$'),
  first_contact_date date,
  request_type text CHECK (request_type IS NULL OR char_length(request_type) <= 160),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  commercial_status text NOT NULL DEFAULT 'novo' CHECK (commercial_status IN ('novo','em_contacto','proposta','negociacao','ganho','perdido','inactivo')),
  internal_notes text CHECK (internal_notes IS NULL OR char_length(internal_notes) <= 5000),
  is_demo boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customers_status_idx ON public.customers(commercial_status);
CREATE INDEX customers_created_idx ON public.customers(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions (security definer, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND r.role = _role AND p.is_active AND _user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND r.role = ANY(_roles) AND p.is_active AND _user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin','manager','operator','viewer']::public.app_role[])
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- Policies: profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "profiles_update_own_name" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Policies: user_roles (read only from client)
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "roles_select_admin" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies: customers
CREATE POLICY "customers_select_staff" ON public.customers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "customers_insert_writers" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','manager','operator']::public.app_role[]));
CREATE POLICY "customers_update_writers" ON public.customers FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','manager','operator']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','manager','operator']::public.app_role[]));
CREATE POLICY "customers_delete_managers" ON public.customers FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','manager']::public.app_role[]));

-- Policies: audit_logs (admin read only; writes only via triggers)
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Customer stamping trigger
CREATE OR REPLACE FUNCTION public.customers_stamp()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  NEW.name := btrim(NEW.name);
  NEW.email := NULLIF(lower(btrim(NEW.email)), '');
  RETURN NEW;
END $$;
CREATE TRIGGER customers_stamp BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.customers_stamp();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Generic audit trigger
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id text; _details jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _id := (to_jsonb(OLD) ->> 'id');
    _details := jsonb_build_object('old', to_jsonb(OLD) - 'internal_notes');
  ELSIF TG_OP = 'UPDATE' THEN
    _id := (to_jsonb(NEW) ->> 'id');
    _details := jsonb_build_object('changed', (SELECT coalesce(jsonb_agg(k), '[]'::jsonb) FROM jsonb_object_keys(to_jsonb(NEW)) k WHERE to_jsonb(NEW) -> k IS DISTINCT FROM to_jsonb(OLD) -> k));
  ELSE
    _id := (to_jsonb(NEW) ->> 'id');
    _details := jsonb_build_object('new', to_jsonb(NEW) - 'internal_notes');
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, _id, _details);
  RETURN coalesce(NEW, OLD);
END $$;
CREATE TRIGGER customers_audit AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER user_roles_audit AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER profiles_audit AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- Protect last active admin
CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _remaining int;
BEGIN
  -- Serialize administrative role changes so concurrent requests cannot remove the last active admin.
  PERFORM pg_advisory_xact_lock(hashtextextended('public.protect_last_admin', 0));
  IF TG_TABLE_NAME = 'user_roles' THEN
    IF OLD.role <> 'admin' OR (TG_OP = 'UPDATE' AND NEW.role = 'admin' AND NEW.user_id = OLD.user_id) THEN RETURN coalesce(NEW, OLD); END IF;
    _uid := OLD.user_id;
  ELSE
    IF NOT (OLD.is_active AND NOT NEW.is_active) THEN RETURN NEW; END IF;
    _uid := OLD.id;
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'admin') THEN RETURN NEW; END IF;
  END IF;
  SELECT count(*) INTO _remaining FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
   WHERE r.role = 'admin' AND p.is_active AND r.user_id <> _uid;
  IF _remaining = 0 AND EXISTS (SELECT 1 FROM auth.users WHERE id = _uid) THEN
    RAISE EXCEPTION 'Não é possível remover ou desactivar o último administrador activo.';
  END IF;
  RETURN coalesce(NEW, OLD);
END $$;
CREATE TRIGGER user_roles_protect_last_admin BEFORE UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();
CREATE TRIGGER profiles_protect_last_admin BEFORE UPDATE OF is_active ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

-- Auto-create profile on signup (no role is ever granted automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, email) VALUES (NEW.id, NEW.email) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.customers_stamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_last_admin() FROM PUBLIC, anon, authenticated;

-- Dashboard metrics (respects caller permissions)
CREATE OR REPLACE FUNCTION public.dashboard_metrics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN jsonb_build_object(
    'total', (SELECT count(*) FROM public.customers),
    'last30', (SELECT count(*) FROM public.customers WHERE created_at >= now() - interval '30 days'),
    'by_status', (SELECT coalesce(jsonb_object_agg(commercial_status, c), '{}'::jsonb) FROM (SELECT commercial_status, count(*) c FROM public.customers GROUP BY 1) s)
  );
END $$;
REVOKE EXECUTE ON FUNCTION public.dashboard_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_metrics() TO authenticated;

-- Least-privilege table grants. RLS is not a substitute for SQL privileges:
-- remove Supabase default table grants from anon/authenticated, then grant only
-- the operations required by the policies above.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;


-- Restrict direct execution of the platform event-trigger helper; the event trigger
-- continues to invoke it for DDL, but API roles cannot call it through RPC.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Bootstrap the existing confirmed owner account. New users receive a profile
-- through handle_new_user(), but never receive a role automatically.
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'ricardino.nkosi@escx.co.ao'
ON CONFLICT (user_id, role) DO NOTHING;
