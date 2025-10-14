const { getCurrentBusinessDay } = require('./src/utils/business-day-utils');

async function testBusinessDay() {
  try {
    // Test con diferentes business IDs de la base de datos
    const businessIds = [
      'cmgf5px5f0000eyy0elci9yds', // Tiene favorito para lunes
      'cmgh621rd0012lb0aixrzpvrw'  // Tiene favorito para viernes
    ];
    
    for (const businessId of businessIds) {
      console.log(`🔍 BusinessId: ${businessId}`);
      const currentDay = await getCurrentBusinessDay(businessId);
      console.log(`   Día comercial actual: ${currentDay}`);
      
      // También mostrar hora actual
      const now = new Date();
      console.log(`   Hora actual: ${now.getHours()}:${now.getMinutes()}`);
      console.log(`   Día real: ${['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()]}`);
      console.log('   ---');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBusinessDay();
