-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "puntosAcumulados" INTEGER NOT NULL DEFAULT 0,
    "totalVisitas" INTEGER NOT NULL DEFAULT 0,
    "totalGastado" REAL NOT NULL DEFAULT 0,
    "defaultCount" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "lastLogin" DATETIME,
    "portalViews" INTEGER NOT NULL DEFAULT 0,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cliente_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Cliente" ("businessId", "cedula", "correo", "defaultCount", "id", "lastLogin", "nombre", "portalViews", "puntos", "registeredAt", "riskLevel", "telefono", "totalGastado", "totalVisitas") SELECT "businessId", "cedula", "correo", "defaultCount", "id", "lastLogin", "nombre", "portalViews", "puntos", "registeredAt", "riskLevel", "telefono", "totalGastado", "totalVisitas" FROM "Cliente";
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_cedula_key" ON "Cliente"("cedula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
