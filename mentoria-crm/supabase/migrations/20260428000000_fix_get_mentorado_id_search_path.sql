-- Fix: add SET search_path to get_mentorado_id() SECURITY DEFINER function.
-- Without this, the function is vulnerable to search_path injection (lint 0011).
CREATE OR REPLACE FUNCTION get_mentorado_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM mentorados WHERE user_id = auth.uid() LIMIT 1;
$$;
