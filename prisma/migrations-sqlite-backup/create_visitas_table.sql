-- Tabla para registrar visitas al portal cliente
CREATE TABLE IF NOT EXISTS "Visita" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clienteId" TEXT, -- Puede ser NULL para visitas anónimas
  "sessionId" TEXT NOT NULL, -- ID único de sesión
  "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "ip" TEXT,
  "referrer" TEXT,
  "path" TEXT NOT NULL DEFAULT '/cliente',
  "isRegistered" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para consultas rápidas por fecha
  INDEX "idx_visita_timestamp" ("timestamp"),
  INDEX "idx_visita_cliente" ("clienteId"),
  INDEX "idx_visita_session" ("sessionId"),
  INDEX "idx_visita_path" ("path")
);

-- Tabla para estadísticas agregadas (cache)
CREATE TABLE IF NOT EXISTS "EstadisticaVisita" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fecha" DATE NOT NULL,
  "periodo" TEXT NOT NULL, -- 'dia', 'semana', 'mes'
  "totalVisitas" INTEGER NOT NULL DEFAULT 0,
  "visitasRegistradas" INTEGER NOT NULL DEFAULT 0,
  "visitasAnonimas" INTEGER NOT NULL DEFAULT 0,
  "sesionesUnicas" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE("fecha", "periodo")
);
