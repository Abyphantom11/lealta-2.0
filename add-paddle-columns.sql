-- Migración manual para agregar columnas de Paddle Billing sin perder datos
-- Ejecutar solo si las columnas no existen

-- Verificar si las columnas ya existen antes de agregarlas
DO $$ 
BEGIN
    -- Agregar subscriptionId si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Business' AND column_name = 'subscriptionId'
    ) THEN
        ALTER TABLE "Business" ADD COLUMN "subscriptionId" TEXT;
        RAISE NOTICE 'Columna subscriptionId agregada';
    ELSE
        RAISE NOTICE 'Columna subscriptionId ya existe';
    END IF;

    -- Agregar subscriptionStatus si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Business' AND column_name = 'subscriptionStatus'
    ) THEN
        ALTER TABLE "Business" ADD COLUMN "subscriptionStatus" TEXT;
        RAISE NOTICE 'Columna subscriptionStatus agregada';
    ELSE
        RAISE NOTICE 'Columna subscriptionStatus ya existe';
    END IF;

    -- Agregar planId si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Business' AND column_name = 'planId'
    ) THEN
        ALTER TABLE "Business" ADD COLUMN "planId" TEXT;
        RAISE NOTICE 'Columna planId agregada';
    ELSE
        RAISE NOTICE 'Columna planId ya existe';
    END IF;

    -- Agregar customerId si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Business' AND column_name = 'customerId'
    ) THEN
        ALTER TABLE "Business" ADD COLUMN "customerId" TEXT;
        RAISE NOTICE 'Columna customerId agregada';
    ELSE
        RAISE NOTICE 'Columna customerId ya existe';
    END IF;

    -- Agregar subscriptionStartDate si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Business' AND column_name = 'subscriptionStartDate'
    ) THEN
        ALTER TABLE "Business" ADD COLUMN "subscriptionStartDate" TIMESTAMP(3);
        RAISE NOTICE 'Columna subscriptionStartDate agregada';
    ELSE
        RAISE NOTICE 'Columna subscriptionStartDate ya existe';
    END IF;

    -- Agregar subscriptionEndDate si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Business' AND column_name = 'subscriptionEndDate'
    ) THEN
        ALTER TABLE "Business" ADD COLUMN "subscriptionEndDate" TIMESTAMP(3);
        RAISE NOTICE 'Columna subscriptionEndDate agregada';
    ELSE
        RAISE NOTICE 'Columna subscriptionEndDate ya existe';
    END IF;

    -- Agregar trialEndsAt si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Business' AND column_name = 'trialEndsAt'
    ) THEN
        ALTER TABLE "Business" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
        RAISE NOTICE 'Columna trialEndsAt agregada';
    ELSE
        RAISE NOTICE 'Columna trialEndsAt ya existe';
    END IF;

END $$;
