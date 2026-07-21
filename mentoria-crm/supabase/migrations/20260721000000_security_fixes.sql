-- Fix mutable search_path on trigger function (lint 0011)
CREATE OR REPLACE FUNCTION update_etapa_respostas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;
