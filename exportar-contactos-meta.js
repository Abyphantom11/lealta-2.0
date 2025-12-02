/**
 * 📤 Exportar contactos para Meta WhatsApp Business
 * Ejecutar: node exportar-contactos-meta.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportarContactos() {
  console.log('📱 Exportando contactos para Meta WhatsApp...\n');

  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        telefono: {
          not: ''
        }
      },
      select: {
        nombre: true,
        telefono: true,
        correo: true
      }
    });

    console.log(`📊 Total de clientes con teléfono: ${clientes.length}\n`);

    // Formatear números al formato internacional de Ecuador
    const contactos = [];
    const errores = [];

    for (const cliente of clientes) {
      let phone = cliente.telefono.replace(/\D/g, ''); // Solo dígitos
      
      // Normalizar a formato +593
      if (phone.startsWith('09') && phone.length === 10) {
        phone = '593' + phone.substring(1);
      } else if (phone.startsWith('9') && phone.length === 9) {
        phone = '593' + phone;
      } else if (phone.startsWith('593')) {
        // Ya está bien
      } else {
        errores.push({ nombre: cliente.nombre, telefono: cliente.telefono, razon: 'Formato no reconocido' });
        continue;
      }

      // Validar longitud (Ecuador: 593 + 9 dígitos = 12)
      if (phone.length !== 12) {
        errores.push({ nombre: cliente.nombre, telefono: cliente.telefono, razon: `Longitud incorrecta: ${phone.length}` });
        continue;
      }

      contactos.push({
        phone_number: '+' + phone,
        first_name: cliente.nombre.split(' ')[0] || 'Cliente',
        last_name: cliente.nombre.split(' ').slice(1).join(' ') || ''
      });
    }

    // Crear CSV para Meta
    const csvHeader = 'phone_number,first_name,last_name';
    const csvRows = contactos.map(c => 
      `${c.phone_number},${c.first_name.replace(/,/g, '')},${c.last_name.replace(/,/g, '')}`
    );
    const csv = [csvHeader, ...csvRows].join('\n');

    // Guardar CSV
    const csvFilename = 'contactos-meta-whatsapp.csv';
    fs.writeFileSync(csvFilename, csv, 'utf8');

    // Crear vCard para importar a teléfono
    const vcards = contactos.map(c => {
      const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ');
      return `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
N:${c.last_name};${c.first_name};;;
TEL;TYPE=CELL:${c.phone_number}
END:VCARD`;
    }).join('\n');

    const vcfFilename = 'contactos-whatsapp.vcf';
    fs.writeFileSync(vcfFilename, vcards, 'utf8');

    console.log(`✅ Exportados ${contactos.length} contactos válidos`);
    console.log(`⚠️  ${errores.length} contactos con errores (omitidos)`);
    console.log(`\n📁 Archivos guardados:`);
    console.log(`   - ${csvFilename} (para Meta WhatsApp API)`);
    console.log(`   - ${vcfFilename} (para importar a tu teléfono)`);
    
    if (errores.length > 0) {
      console.log('\n❌ Contactos con errores:');
      errores.slice(0, 10).forEach(e => {
        console.log(`   - ${e.nombre}: ${e.telefono} (${e.razon})`);
      });
      if (errores.length > 10) {
        console.log(`   ... y ${errores.length - 10} más`);
      }
    }

    console.log('\n📋 PRÓXIMOS PASOS PARA WHATSAPP BUSINESS APP:');
    console.log('1. Envía el archivo .vcf a tu teléfono (email, Drive, etc.)');
    console.log('2. Abre el archivo .vcf y selecciona "Importar todos"');
    console.log('3. Abre WhatsApp Business → Nueva difusión');
    console.log('4. Selecciona hasta 256 contactos por lista de difusión');
    console.log('5. Envía tu mensaje de reactivación');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Los contactos deben tener tu número guardado para recibir difusiones');
    console.log('   - Máximo 250 conversaciones/día con tu plan actual');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

exportarContactos();
