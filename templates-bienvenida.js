/**
 * 💬 TEMPLATES DE BIENVENIDA PARA LOVE ME SKY
 * ==========================================
 */

const WELCOME_MESSAGES = {
    // Mensaje de bienvenida principal
    bienvenida_principal: `🎉 ¡Bienvenido a Love Me Sky!

Hola {{nombre}}, somos el equipo de Love Me Sky y queremos darte la bienvenida a nuestro programa de fidelización.

✨ TUS BENEFICIOS EXCLUSIVOS:
• 🎁 Acumula puntos con cada visita
• 💰 Descuentos especiales para miembros  
• 🔥 Promociones exclusivas
• ⭐ Atención prioritaria
• 🎂 Sorpresa especial en tu cumpleaños

📱 Este es nuestro número oficial de WhatsApp.
¡Guárdalo para estar al día con nuestras ofertas!

🕐 Horarios de atención:
Lunes a Domingo: 8:00 AM - 10:00 PM

¡Esperamos verte pronto! 🍽️✨

El equipo de Love Me Sky 💙`,

    // Versión corta para envío masivo
    bienvenida_corta: `🎉 ¡Bienvenido a Love Me Sky!

{{nombre}}, gracias por unirte a nuestro programa de fidelización.

🎁 Beneficios exclusivos te esperan
📱 Número oficial: +593 99 568 3452
💙 El equipo de Love Me Sky`,

    // Para nuevos clientes
    nuevo_cliente: `👋 ¡Hola {{nombre}}!

¡Gracias por visitarnos en Love Me Sky!

🎊 Has sido registrado en nuestro programa de fidelización
⭐ Acumula puntos y disfruta de beneficios únicos
📱 Síguenos para ofertas exclusivas

¡Hasta la próxima visita! 💙`,

    // Confirmación de registro
    confirmacion_registro: `✅ ¡Registro exitoso!

{{nombre}}, tu cuenta de fidelización está activa.

🎯 Puntos actuales: {{puntos}}
🎁 Próximo beneficio: {{proximo_beneficio}}
📱 Mantente conectado para más sorpresas

Love Me Sky 💙`
};

// Función para personalizar mensajes
function personalizarMensaje(template, datos) {
    let mensaje = WELCOME_MESSAGES[template];
    
    // Reemplazar variables
    for (const [key, value] of Object.entries(datos)) {
        mensaje = mensaje.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return mensaje;
}

// Ejemplos de uso
console.log('💬 TEMPLATES DE BIENVENIDA PARA LOVE ME SKY');
console.log('==========================================\n');

console.log('📱 MENSAJE PRINCIPAL:');
console.log('====================');
const ejemploPrincipal = personalizarMensaje('bienvenida_principal', {
    nombre: 'María'
});
console.log(ejemploPrincipal);

console.log('\n📱 MENSAJE CORTO (PARA MASIVO):');
console.log('==============================');
const ejemploCorto = personalizarMensaje('bienvenida_corta', {
    nombre: 'Juan'
});
console.log(ejemploCorto);

console.log('\n📱 NUEVO CLIENTE:');
console.log('================');
const ejemploNuevo = personalizarMensaje('nuevo_cliente', {
    nombre: 'Ana'
});
console.log(ejemploNuevo);

console.log('\n✅ TEMPLATES LISTOS PARA USAR!');
console.log('==============================');
console.log('Una vez que tengas el número +593995683452 aprobado,');
console.log('podrás enviar estos mensajes a todos tus clientes.');

// Exportar para usar en el proyecto
module.exports = {
    WELCOME_MESSAGES,
    personalizarMensaje
};
