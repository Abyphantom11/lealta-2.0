-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TarjetaLealtad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "businessId" TEXT,
    "nivel" TEXT NOT NULL,
    "fechaAsignacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignacionManual" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "puntosProgreso" INTEGER NOT NULL DEFAULT 0,
    "historicoNiveles" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TarjetaLealtad_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TarjetaLealtad" ("activa", "asignacionManual", "businessId", "clienteId", "createdAt", "fechaAsignacion", "historicoNiveles", "id", "nivel", "updatedAt") SELECT "activa", "asignacionManual", "businessId", "clienteId", "createdAt", "fechaAsignacion", "historicoNiveles", "id", "nivel", "updatedAt" FROM "TarjetaLealtad";
DROP TABLE "TarjetaLealtad";
ALTER TABLE "new_TarjetaLealtad" RENAME TO "TarjetaLealtad";
CREATE UNIQUE INDEX "TarjetaLealtad_clienteId_key" ON "TarjetaLealtad"("clienteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
