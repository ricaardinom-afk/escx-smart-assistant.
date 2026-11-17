-- Keep SECURITY DEFINER helpers outside PostgREST-exposed schemas.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND r.role = _role AND p.is_active AND _user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION private.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND r.role = ANY(_roles) AND p.is_active AND _user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT private.has_any_role(_user_id, ARRAY['admin','manager','operator','viewer']::public.app_role[])
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, public.app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT private.has_role(_user_id, _role) $$;
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT private.has_any_role(_user_id, _roles) $$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT private.is_staff(_user_id) $$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_select_staff ON public.profiles;
DROP POLICY IF EXISTS roles_select_admin ON public.user_roles;
DROP POLICY IF EXISTS customers_select_staff ON public.customers;
DROP POLICY IF EXISTS customers_insert_writers ON public.customers;
DROP POLICY IF EXISTS customers_update_writers ON public.customers;
DROP POLICY IF EXISTS customers_delete_managers ON public.customers;
DROP POLICY IF EXISTS audit_select_admin ON public.audit_logs;

CREATE POLICY profiles_select_staff ON public.profiles FOR SELECT TO authenticated
USING ((SELECT private.is_staff((SELECT auth.uid()))));
CREATE POLICY roles_select_admin ON public.user_roles FOR SELECT TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin'::public.app_role)));
CREATE POLICY customers_select_staff ON public.customers FOR SELECT TO authenticated
USING ((SELECT private.is_staff((SELECT auth.uid()))));
CREATE POLICY customers_insert_writers ON public.customers FOR INSERT TO authenticated
WITH CHECK ((SELECT private.has_any_role((SELECT auth.uid()), ARRAY['admin','manager','operator']::public.app_role[])));
CREATE POLICY customers_update_writers ON public.customers FOR UPDATE TO authenticated
USING ((SELECT private.has_any_role((SELECT auth.uid()), ARRAY['admin','manager','operator']::public.app_role[])))
WITH CHECK ((SELECT private.has_any_role((SELECT auth.uid()), ARRAY['admin','manager','operator']::public.app_role[])));
CREATE POLICY customers_delete_managers ON public.customers FOR DELETE TO authenticated
USING ((SELECT private.has_any_role((SELECT auth.uid()), ARRAY['admin','manager']::public.app_role[])));
CREATE POLICY audit_select_admin ON public.audit_logs FOR SELECT TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_name ON public.profiles;
DROP POLICY IF EXISTS roles_select_own ON public.user_roles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_update_own_name ON public.profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY roles_select_own ON public.user_roles FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS customers_owner_id_idx ON public.customers(owner_id);
