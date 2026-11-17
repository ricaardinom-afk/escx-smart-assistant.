DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_staff ON public.profiles;
CREATE POLICY profiles_select_access ON public.profiles
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT private.is_staff((SELECT auth.uid())))
);

DROP POLICY IF EXISTS roles_select_own ON public.user_roles;
DROP POLICY IF EXISTS roles_select_admin ON public.user_roles;
CREATE POLICY roles_select_access ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT private.has_role((SELECT auth.uid()), 'admin'::public.app_role))
);
