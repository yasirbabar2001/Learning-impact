/** Append-only: never edit a migration that has shipped; add a new one instead. */
export const MIGRATIONS: string[] = [
  /* 1: accounts, commerce, learning, certificates */ `
  CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    designation TEXT NOT NULL DEFAULT '',
    organisation TEXT NOT NULL DEFAULT '',
    company_id TEXT REFERENCES companies(id),
    company_role TEXT CHECK (company_role IN ('manager', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_active_day TEXT,
    show_on_leaderboard INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT
  );

  CREATE TABLE course_settings (
    slug TEXT PRIMARY KEY,
    price_pkr INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id),
    company_id TEXT REFERENCES companies(id),
    kind TEXT NOT NULL CHECK (kind IN ('individual', 'seats')),
    course_slug TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 1 CHECK (seats >= 1),
    unit_price_pkr INTEGER NOT NULL,
    amount_pkr INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'awaiting_payment'
      CHECK (status IN ('awaiting_payment', 'submitted', 'approved', 'rejected', 'cancelled')),
    payment_method TEXT NOT NULL DEFAULT '',
    transaction_ref TEXT NOT NULL DEFAULT '',
    proof_file TEXT,
    buyer_note TEXT NOT NULL DEFAULT '',
    admin_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    submitted_at TEXT,
    decided_at TEXT
  );
  CREATE INDEX orders_user ON orders(user_id);
  CREATE INDEX orders_status ON orders(status);

  CREATE TABLE seat_pools (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    course_slug TEXT NOT NULL,
    order_id TEXT REFERENCES orders(id),
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX seat_pools_company ON seat_pools(company_id, course_slug);

  CREATE TABLE invitations (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    company_id TEXT NOT NULL REFERENCES companies(id),
    course_slug TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
    created_at TEXT NOT NULL,
    accepted_at TEXT,
    accepted_user_id TEXT REFERENCES users(id)
  );
  CREATE INDEX invitations_company ON invitations(company_id);

  CREATE TABLE enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    course_slug TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('purchase', 'company', 'admin')),
    order_id TEXT REFERENCES orders(id),
    company_id TEXT REFERENCES companies(id),
    extra_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    UNIQUE (user_id, course_slug)
  );

  CREATE TABLE session_progress (
    user_id TEXT NOT NULL REFERENCES users(id),
    course_slug TEXT NOT NULL,
    session_id TEXT NOT NULL,
    cards_seen INTEGER NOT NULL DEFAULT 0,
    lesson_done_at TEXT,
    quiz_attempts INTEGER NOT NULL DEFAULT 0,
    quiz_best INTEGER NOT NULL DEFAULT 0,
    quiz_last INTEGER,
    quiz_passed_at TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, course_slug, session_id)
  );

  -- Every XP award; ref is unique per user so the same achievement never pays twice.
  CREATE TABLE xp_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    ref TEXT NOT NULL,
    label TEXT NOT NULL,
    xp INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (user_id, ref)
  );
  CREATE INDEX xp_events_time ON xp_events(created_at);

  CREATE TABLE badges (
    user_id TEXT NOT NULL REFERENCES users(id),
    badge TEXT NOT NULL,
    earned_at TEXT NOT NULL,
    PRIMARY KEY (user_id, badge)
  );

  CREATE TABLE exam_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    course_slug TEXT NOT NULL,
    question_ids TEXT NOT NULL,
    option_orders TEXT NOT NULL,
    answers TEXT NOT NULL DEFAULT '{}',
    started_at TEXT NOT NULL,
    deadline_at TEXT NOT NULL,
    submitted_at TEXT,
    correct INTEGER,
    total INTEGER NOT NULL,
    percent INTEGER,
    passed INTEGER
  );
  CREATE INDEX exam_attempts_user ON exam_attempts(user_id, course_slug);

  CREATE TABLE certificates (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id),
    course_slug TEXT NOT NULL,
    attempt_id TEXT REFERENCES exam_attempts(id),
    holder_name TEXT NOT NULL,
    percent INTEGER NOT NULL,
    issued_at TEXT NOT NULL,
    revoked_at TEXT,
    UNIQUE (user_id, course_slug)
  );

  CREATE TABLE kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];
