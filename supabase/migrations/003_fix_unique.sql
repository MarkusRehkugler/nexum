-- 003_fix_unique.sql
-- Fügt UNIQUE-Constraint auf ai_session_results.session_id hinzu,
-- damit upsert(onConflict: 'session_id') funktioniert.

ALTER TABLE ai_session_results
  ADD CONSTRAINT ai_session_results_session_id_unique UNIQUE (session_id);
