CREATE TABLE IF NOT EXISTS preferencias_notificacion (
  usuario_id INT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  telegram_chat_id TEXT UNIQUE,
  telegram_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
  push_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suscripciones_push (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  clave_p256dh TEXT NOT NULL,
  clave_auth TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS suscripciones_push_usuario_idx ON suscripciones_push(usuario_id);

CREATE TABLE IF NOT EXISTS vinculos_telegram (
  token_hash CHAR(64) PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_en TIMESTAMPTZ NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vinculos_telegram_expira_idx ON vinculos_telegram(expira_en);

CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(60) NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  mensaje TEXT NOT NULL,
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  leida_en TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notificaciones_usuario_fecha_idx
  ON notificaciones(usuario_id, fecha_creacion DESC);
