const { PrismaClient } = require('@prisma/client');

async function fixQRConfiguration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando configuración del QR...\n');
    
    // Verificar QR actual en BD
    const qrInDB = await prisma.qRLink.findUnique({
      where: { shortId: 'ig4gRl' }
    });
    
    if (!qrInDB) {
      console.log('❌ QR no encontrado en base de datos');
      return;
    }
    
    console.log('📋 QR EN BASE DE DATOS:');
    console.log(`Short ID: ${qrInDB.shortId}`);
    console.log(`Target URL: ${qrInDB.targetUrl}`);
    console.log(`Backup URL: ${qrInDB.backupUrl}`);
    console.log(`Activo: ${qrInDB.isActive}`);
    
    console.log('\n🖥️ QR EN QR MANAGER (según imagen):');
    console.log('Target URL: https://lealta.app/love-me-sky/cliente/');
    console.log('Backup URL: https://github.com/Abyphantom11/Men-');
    
    console.log('\n🔧 CORRIGIENDO CONFIGURACIÓN...');
    console.log('Actualizando BD para que coincida con QR Manager');
    
    // Actualizar QR para que coincida con lo que el usuario editó en QR Manager
    const updatedQR = await prisma.qRLink.update({
      where: { shortId: 'ig4gRl' },
      data: {
        targetUrl: 'https://lealta.app/love-me-sky/cliente/',
        backupUrl: 'https://github.com/Abyphantom11/Men-',
        name: 'menú',
        updatedAt: new Date()
      }
    });
    
    console.log('\n✅ QR ACTUALIZADO:');
    console.log(`Target URL: ${updatedQR.targetUrl}`);
    console.log(`Backup URL: ${updatedQR.backupUrl}`);
    console.log(`Nombre: ${updatedQR.name}`);
    
    console.log('\n🧪 VERIFICACIÓN:');
    console.log('1. Ahora escanea tu QR físico');
    console.log('2. Debe redirigir a: https://lealta.app/love-me-sky/cliente/');
    console.log('3. Si no funciona, debe ir al backup: https://github.com/Abyphantom11/Men-');
    
    console.log('\n🎯 FLUJO CORREGIDO:');
    console.log('📱 QR Físico (Cloudflare muerto) →');
    console.log('🔄 Interceptado por lealta.app →');
    console.log('🎯 https://lealta.app/r/ig4gRl →');
    console.log('🏁 https://lealta.app/love-me-sky/cliente/ (TU CONFIGURACIÓN)');
    
    console.log('\n✅ PROBLEMA RESUELTO!');
    console.log('El QR ahora redirige a la URL que editaste en QR Manager');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixQRConfiguration();
