-- =============================================
-- Políticas CRM para mentorado_trilhas
-- O mentor não é um mentorado (get_mentorado_id() retorna NULL),
-- então apenas ele pode atribuir e remover trilhas.
-- =============================================

CREATE POLICY mentorado_trilhas_insert ON mentorado_trilhas
  FOR INSERT WITH CHECK (get_mentorado_id() IS NULL);

CREATE POLICY mentorado_trilhas_delete ON mentorado_trilhas
  FOR DELETE USING (get_mentorado_id() IS NULL);
