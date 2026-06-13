-- ── Veranstaltungen (Kurse, Seminare, Workshops, Gruppen) ────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID          NOT NULL REFERENCES tenants(id),
  title            TEXT          NOT NULL,
  description      TEXT,
  type             TEXT          NOT NULL DEFAULT 'course'
                                 CHECK (type IN ('course', 'seminar', 'workshop', 'group')),
  status           TEXT          NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('draft', 'active', 'cancelled', 'completed')),
  max_participants  INTEGER,
  price            NUMERIC(15,2),
  location         TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_same_tenant" ON courses FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ── Einzelne Termine innerhalb einer Veranstaltung ────────────────────────────
CREATE TABLE IF NOT EXISTS course_sessions (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID          NOT NULL REFERENCES tenants(id),
  course_id   UUID          NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT,
  starts_at   TIMESTAMPTZ   NOT NULL,
  ends_at     TIMESTAMPTZ   NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_sessions_same_tenant" ON course_sessions FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ── Teilnehmer-Anmeldungen ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_participants (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID          NOT NULL REFERENCES tenants(id),
  course_id     UUID          NOT NULL REFERENCES courses(id),
  client_id     UUID          NOT NULL REFERENCES clients(id),
  status        TEXT          NOT NULL DEFAULT 'registered'
                              CHECK (status IN ('registered', 'waitlist', 'cancelled')),
  registered_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  UNIQUE (course_id, client_id)
);

ALTER TABLE course_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_participants_same_tenant" ON course_participants FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
