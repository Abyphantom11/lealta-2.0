-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'BASIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "permissions" JSONB,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "sessionToken" TEXT,
    "sessionExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "User_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Location_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "totalVisitas" INTEGER NOT NULL DEFAULT 0,
    "totalGastado" REAL NOT NULL DEFAULT 0,
    "defaultCount" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "lastLogin" DATETIME,
    "portalViews" INTEGER NOT NULL DEFAULT 0,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cliente_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consumo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "clienteId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "productos" JSONB NOT NULL,
    "total" REAL NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "empleadoId" TEXT NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "metodoPago" TEXT,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "ticketImageUrl" TEXT,
    "ocrText" TEXT,
    CONSTRAINT "Consumo_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Consumo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consumo_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consumo_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitLog_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortalConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "banners" JSONB NOT NULL,
    "promociones" JSONB NOT NULL,
    "eventos" JSONB NOT NULL,
    "recompensas" JSONB NOT NULL,
    "favoritoDelDia" JSONB,
    "colores" JSONB,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "icono" TEXT,
    "parentId" TEXT,
    CONSTRAINT "MenuCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL,
    "precioVaso" REAL,
    "precioBotella" REAL,
    "tipoProducto" TEXT NOT NULL DEFAULT 'simple',
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "imagenUrl" TEXT,
    "opciones" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TarjetaLealtad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "businessId" TEXT,
    "nivel" TEXT NOT NULL,
    "fechaAsignacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignacionManual" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "historicoNiveles" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TarjetaLealtad_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfiguracionTarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "nombrePersonalizado" TEXT NOT NULL,
    "textoCalidad" TEXT NOT NULL,
    "puntosMinimos" INTEGER NOT NULL DEFAULT 0,
    "gastosMinimos" REAL NOT NULL DEFAULT 0,
    "visitasMinimas" INTEGER NOT NULL DEFAULT 0,
    "beneficio" TEXT,
    "beneficiosExtra" JSONB,
    "colores" JSONB NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessGoals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "dailyRevenue" REAL NOT NULL DEFAULT 100,
    "weeklyRevenue" REAL NOT NULL DEFAULT 700,
    "monthlyRevenue" REAL NOT NULL DEFAULT 3000,
    "dailyClients" INTEGER NOT NULL DEFAULT 5,
    "weeklyClients" INTEGER NOT NULL DEFAULT 25,
    "monthlyClients" INTEGER NOT NULL DEFAULT 100,
    "dailyTransactions" INTEGER NOT NULL DEFAULT 8,
    "weeklyTransactions" INTEGER NOT NULL DEFAULT 50,
    "monthlyTransactions" INTEGER NOT NULL DEFAULT 200,
    "targetTicketAverage" REAL NOT NULL DEFAULT 20,
    "targetRetentionRate" REAL NOT NULL DEFAULT 70,
    "targetConversionRate" REAL NOT NULL DEFAULT 80,
    "targetTopClient" REAL NOT NULL DEFAULT 150,
    "targetActiveClients" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessGoals_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT,
    "sessionId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,
    "referrer" TEXT,
    "path" TEXT NOT NULL DEFAULT '/cliente',
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Visita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("cedula") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstadisticaVisita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "periodo" TEXT NOT NULL,
    "totalVisitas" INTEGER NOT NULL DEFAULT 0,
    "visitasRegistradas" INTEGER NOT NULL DEFAULT 0,
    "visitasAnonimas" INTEGER NOT NULL DEFAULT 0,
    "sesionesUnicas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HistorialCanje" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "clienteId" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteCedula" TEXT NOT NULL,
    "recompensaId" TEXT NOT NULL,
    "recompensaNombre" TEXT NOT NULL,
    "puntosDescontados" INTEGER NOT NULL,
    "empleadoId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistorialCanje_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistorialCanje_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Business_subdomain_key" ON "Business"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "User_businessId_email_key" ON "User"("businessId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cedula_key" ON "Cliente"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "PortalConfig_businessId_key" ON "PortalConfig"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_businessId_nombre_parentId_key" ON "MenuCategory"("businessId", "nombre", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuProduct_categoryId_nombre_key" ON "MenuProduct"("categoryId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TarjetaLealtad_clienteId_key" ON "TarjetaLealtad"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionTarjeta_businessId_key" ON "ConfiguracionTarjeta"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionTarjeta_businessId_nivel_key" ON "ConfiguracionTarjeta"("businessId", "nivel");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessGoals_businessId_key" ON "BusinessGoals"("businessId");

-- CreateIndex
CREATE INDEX "Visita_timestamp_idx" ON "Visita"("timestamp");

-- CreateIndex
CREATE INDEX "Visita_clienteId_idx" ON "Visita"("clienteId");

-- CreateIndex
CREATE INDEX "Visita_sessionId_idx" ON "Visita"("sessionId");

-- CreateIndex
CREATE INDEX "Visita_path_idx" ON "Visita"("path");

-- CreateIndex
CREATE UNIQUE INDEX "EstadisticaVisita_fecha_periodo_key" ON "EstadisticaVisita"("fecha", "periodo");

-- CreateIndex
CREATE INDEX "HistorialCanje_clienteId_idx" ON "HistorialCanje"("clienteId");

-- CreateIndex
CREATE INDEX "HistorialCanje_businessId_idx" ON "HistorialCanje"("businessId");

-- CreateIndex
CREATE INDEX "HistorialCanje_createdAt_idx" ON "HistorialCanje"("createdAt");
