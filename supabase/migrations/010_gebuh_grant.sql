-- Migration 010: SELECT-Berechtigung für GebüH-Tabelle
GRANT SELECT ON gebuh_positions TO authenticated;
