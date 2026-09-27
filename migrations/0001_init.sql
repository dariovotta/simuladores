-- Esquema inicial de Simuladores (MisFinanzas).

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  pass_hash  TEXT NOT NULL,
  salt       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sesiones: se guarda el SHA-256 del token, nunca el token.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Simulaciones guardadas. El nombre es único por usuario.
--   simulator  id del simulador (comisiones, rotacion-ons, duration, lecap, carry-trade, cuotas)
--   params     JSON con los valores de entrada del simulador
CREATE TABLE IF NOT EXISTS simulations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  simulator  TEXT NOT NULL,
  name       TEXT NOT NULL,
  params     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id, created_at DESC);
