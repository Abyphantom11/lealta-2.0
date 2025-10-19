// Script para probar el endpoint de imagen OG
const fetch = require('node-fetch');

async function testOGEndpoint() {
  console.log('🧪 Probando endpoint de imagen OG\n');

  // Primero, necesitamos un shareId válido
  // Vamos a buscar el más reciente en la base de datos
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Buscar un share link reciente
    const shareLink = await prisma.qRShareLink.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { shareId: true },
    });

    if (!shareLink) {
      console.log('❌ No hay share links en la base de datos');
      console.log('💡 Crea uno primero desde la aplicación');
      return;
    }

    const shareId = shareLink.shareId;
    console.log('✅ Share ID encontrado:', shareId);

    // Probar el endpoint OG
    const ogUrl = `http://localhost:3001/api/share/qr/${shareId}/og`;
    console.log('🔗 Probando:', ogUrl);

    const response = await fetch(ogUrl);
    
    console.log('📊 Status:', response.status);
    console.log('📝 Headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
    });

    if (response.status === 200) {
      console.log('✅ Imagen generada exitosamente!');
      console.log('\n🎨 Puedes ver la imagen en tu navegador:');
      console.log(`   ${ogUrl}`);
      console.log('\n📱 Para probar en WhatsApp:');
      console.log(`   http://localhost:3001/share/qr/${shareId}`);
      console.log('\n🔍 Para validar Open Graph:');
      console.log(`   https://developers.facebook.com/tools/debug/`);
    } else {
      const text = await response.text();
      console.log('❌ Error:', text);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testOGEndpoint();
