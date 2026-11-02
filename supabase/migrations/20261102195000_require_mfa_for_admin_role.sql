-- Require a verified second authentication factor before an account can exercise
-- the platform-admin role through RLS policies or SECURITY DEFINER functions.
-- Non-admin users retain self-role lookup; cross-user role lookup requires MFA.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN _role = 'admin'::public.app_role
      AND coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
      THEN false
    WHEN _user_id = auth.uid()
      OR (
        coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
        AND EXISTS (
          SELECT 1
          FROM public.user_roles admin_role
          WHERE admin_role.user_id = auth.uid()
            AND admin_role.role = 'admin'::public.app_role
        )
      )
      THEN EXISTS (
        SELECT 1
        FROM public.user_roles target_role
        WHERE target_role.user_id = _user_id
          AND target_role.role = _role
      )
    ELSE false
  END;
$function$;
