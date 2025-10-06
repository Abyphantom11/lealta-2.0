// Script para verificar y cambiar el tema del business
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BUSINESS_ID = "cmgewmtue0000eygwq8taawak";

async function verificarYCambiarTema() {
  try {
    console.log('🔍 Verificando tema actual...\n');
    
    // 1. Ver tema actual
    let business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID },
      select: {
        id: true,
        name: true,
        clientTheme: true
      }
    });
    
    console.log('📊 Estado ANTES:');
    console.log('   Negocio:', business?.name);
    console.log('   Tema actual:', business?.clientTheme || 'moderno (default)');
    console.log('');
    
    // 2. Cambiar a tema "elegante" para probar
    console.log('🔄 Cambiando tema a "elegante"...\n');
    
    business = await prisma.business.update({
      where: { id: BUSINESS_ID },
      data: {
        clientTheme: 'elegante'
      }
    });
    
    console.log('✅ Tema actualizado en BD');
    console.log('');
    
    // 3. Verificar cambio
    business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID },
      select: {
        id: true,
        name: true,
        clientTheme: true
      }
    });
    
    console.log('📊 Estado DESPUÉS:');
    console.log('   Negocio:', business?.name);
    console.log('   Tema actual:', business?.clientTheme);
    console.log('');
    
    console.log('🧪 PRUEBA:');
    console.log('   1. Ve a http://localhost:3000/cliente');
    console.log('   2. Abre la consola del navegador (F12)');
    console.log('   3. Busca los logs de "🎨 ThemeProvider"');
    console.log('   4. Deberías ver: Tema recibido: elegante');
    console.log('   5. La tarjeta de balance debe tener fondo NEGRO con borde DORADO');
    console.log('');
    console.log('💡 Si no ves el tema elegante:');
    console.log('   - Verifica que el servidor esté corriendo');
    console.log('   - Recarga la página con Ctrl+F5');
    console.log('   - Revisa los logs de la consola');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarYCambiarTema();
