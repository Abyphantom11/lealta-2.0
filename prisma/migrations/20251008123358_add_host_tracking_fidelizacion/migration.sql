-- 🏠 FIDELIZACIÓN POR ANFITRIÓN: Sistema de tracking de consumos de invitados

-- 1. Agregar campo tableNumber a Reservation
ALTER TABLE "Reservation" ADD COLUMN "tableNumber" TEXT;

-- 2. Crear tabla HostTracking
CREATE TABLE "HostTracking" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "reservationName" TEXT NOT NULL,
    "tableNumber" TEXT,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostTracking_pkey" PRIMARY KEY ("id")
);

-- 3. Crear tabla GuestConsumo
CREATE TABLE "GuestConsumo" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "hostTrackingId" TEXT NOT NULL,
    "consumoId" TEXT NOT NULL,
    "guestCedula" TEXT,
    "guestName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestConsumo_pkey" PRIMARY KEY ("id")
);

-- 4. Crear índices para HostTracking
CREATE UNIQUE INDEX "HostTracking_reservationId_key" ON "HostTracking"("reservationId");
CREATE INDEX "HostTracking_businessId_idx" ON "HostTracking"("businessId");
CREATE INDEX "HostTracking_reservationId_idx" ON "HostTracking"("reservationId");
CREATE INDEX "HostTracking_clienteId_idx" ON "HostTracking"("clienteId");
CREATE INDEX "HostTracking_reservationDate_idx" ON "HostTracking"("reservationDate");
CREATE INDEX "HostTracking_tableNumber_idx" ON "HostTracking"("tableNumber");
CREATE INDEX "HostTracking_isActive_idx" ON "HostTracking"("isActive");

-- 5. Crear índices para GuestConsumo
CREATE UNIQUE INDEX "GuestConsumo_consumoId_key" ON "GuestConsumo"("consumoId");
CREATE INDEX "GuestConsumo_businessId_idx" ON "GuestConsumo"("businessId");
CREATE INDEX "GuestConsumo_hostTrackingId_idx" ON "GuestConsumo"("hostTrackingId");
CREATE INDEX "GuestConsumo_consumoId_idx" ON "GuestConsumo"("consumoId");

-- 6. Agregar Foreign Keys para HostTracking
ALTER TABLE "HostTracking" ADD CONSTRAINT "HostTracking_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostTracking" ADD CONSTRAINT "HostTracking_reservationId_fkey" 
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HostTracking" ADD CONSTRAINT "HostTracking_clienteId_fkey" 
    FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Agregar Foreign Keys para GuestConsumo
ALTER TABLE "GuestConsumo" ADD CONSTRAINT "GuestConsumo_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestConsumo" ADD CONSTRAINT "GuestConsumo_hostTrackingId_fkey" 
    FOREIGN KEY ("hostTrackingId") REFERENCES "HostTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestConsumo" ADD CONSTRAINT "GuestConsumo_consumoId_fkey" 
    FOREIGN KEY ("consumoId") REFERENCES "Consumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
