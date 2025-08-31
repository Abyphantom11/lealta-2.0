// Archivo temporal para verificar tipos de Prisma
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Test de tipos de TarjetaLealtad
async function testTarjetaLealtad() {
  const tarjeta = await prisma.tarjetaLealtad.findUnique({
    where: { id: "test" }
  })
  
  const configuracion = await prisma.configuracionTarjeta.findUnique({
    where: { id: "test" }
  })
  
  console.log(tarjeta, configuracion)
}

testTarjetaLealtad()
