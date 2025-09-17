const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarSesionesMultiples() {
  console.log('🖥️ VERIFICANDO SISTEMA DE SESIONES MÚLTIPLES');
  console.log('=============================================');
  
  try {
    // 1. Buscar usuarios con sesiones activas
    console.log('\n📊 USUARIOS CON SESIONES ACTIVAS:');
    const usuariosConSesion = await prisma.user.findMany({
      where: {
        sessionToken: { not: null },
        sessionExpires: { gt: new Date() },
        isActive: true
      },
      include: {
        business: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    usuariosConSesion.forEach(user => {
      const expiresIn = user.sessionExpires ? 
        Math.round((user.sessionExpires.getTime() - Date.now()) / (1000 * 60 * 60)) : 'N/A';
      console.log(`  - ${user.name} (${user.email})`);
      console.log(`    Business: ${user.business.name}`);
      console.log(`    Sesión expira en: ${expiresIn} horas`);
      console.log(`    Session Token: ${user.sessionToken?.substring(0, 8)}...`);
      console.log('');
    });

    // 2. Analizar el sistema de sesiones
    console.log('🔍 ANÁLISIS DEL SISTEMA DE SESIONES:');
    console.log('===================================');
    
    console.log('✅ CARACTERÍSTICAS ACTUALES:');
    console.log('  - Una sesión por usuario (sessionToken único)');
    console.log('  - Login nuevo SOBRESCRIBE sesión anterior');
    console.log('  - Duración: 24 horas desde último login');
    console.log('  - Cookie httpOnly con sessionToken');
    
    console.log('\n⚠️  COMPORTAMIENTO MULTI-DISPOSITIVO:');
    console.log('  - PC 1: Usuario se loguea → sessionToken = ABC123');
    console.log('  - PC 2: Usuario se loguea → sessionToken = XYZ789');
    console.log('  - PC 1: Sesión INVALIDADA (token ABC123 ya no existe)');
    console.log('  - Solo PC 2 mantiene acceso válido');
    
    console.log('\n🎯 CONSECUENCIAS PRÁCTICAS:');
    console.log('  ❌ Múltiples PCs NO pueden trabajar simultáneamente');
    console.log('  ❌ Último login desconecta sesiones anteriores');
    console.log('  ❌ Equipo de 3 personas necesita usuarios separados');
    
    // 3. Verificar schema de sesiones
    console.log('\n📋 ESQUEMA ACTUAL DE SESIONES:');
    console.log('============================');
    console.log('  sessionToken: String? → UN token por usuario');
    console.log('  sessionExpires: DateTime? → UNA expiración');
    console.log('  lastLogin: DateTime? → ÚLTIMO acceso');
    
    console.log('\n💡 PARA SESIONES MÚLTIPLES SE NECESITARÍA:');
    console.log('=========================================');
    console.log('  - Tabla separada: UserSessions');
    console.log('  - Múltiples tokens por usuario');
    console.log('  - Metadata de dispositivos');
    console.log('  - Gestión de expiración independiente');

    // 4. Revisar schema actual
    const sampleUser = usuariosConSesion[0];
    if (sampleUser) {
      console.log('\n🔍 ESTRUCTURA DE USUARIO EJEMPLO:');
      console.log('================================');
      console.log(`ID: ${sampleUser.id}`);
      console.log(`Email: ${sampleUser.email}`);
      console.log(`SessionToken: ${sampleUser.sessionToken ? 'ACTIVO' : 'INACTIVO'}`);
      console.log(`SessionExpires: ${sampleUser.sessionExpires}`);
      console.log(`LastLogin: ${sampleUser.lastLogin}`);
      console.log(`LoginAttempts: ${sampleUser.loginAttempts}`);
      console.log(`LockedUntil: ${sampleUser.lockedUntil || 'No bloqueado'}`);
    }

  } catch (error) {
    console.error('❌ Error verificando sesiones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarSesionesMultiples();
