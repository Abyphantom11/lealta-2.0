// Simulación de lógica del Dashboard
const niveles = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];

const puntosRequeridos = {
  'Bronce': 0,
  'Plata': 100,
  'Oro': 500,
  'Diamante': 1500,
  'Platino': 3000
};

const visitasRequeridas = {
  'Bronce': 0,
  'Plata': 5,
  'Oro': 10,
  'Diamante': 20,
  'Platino': 30
};

function testProgreso(nivelActual, puntosAcumulados, visitasActuales) {
  console.log(`\n=== Cliente ${nivelActual} ===`);
  console.log(`Puntos acumulados: ${puntosAcumulados}`);
  console.log(`Visitas: ${visitasActuales}`);

  const currentIndex = niveles.indexOf(nivelActual);
  let progress = 0;
  let siguienteNivel = '';
  let descripcion = '';

  if (currentIndex < niveles.length - 1) {
    siguienteNivel = niveles[currentIndex + 1];
    const puntosSiguienteNivel = puntosRequeridos[siguienteNivel];
    const visitasSiguienteNivel = visitasRequeridas[siguienteNivel];

    const progresoPuntos = puntosSiguienteNivel > 0 ? Math.min((puntosAcumulados / puntosSiguienteNivel) * 100, 100) : 100;
    const progresoVisitas = visitasSiguienteNivel > 0 ? Math.min((visitasActuales / visitasSiguienteNivel) * 100, 100) : 100;
    progress = Math.max(progresoPuntos, progresoVisitas);

    const puntosNecesarios = Math.max(0, puntosSiguienteNivel - puntosAcumulados);
    const visitasNecesarias = Math.max(0, visitasSiguienteNivel - visitasActuales);

    if (puntosAcumulados >= puntosSiguienteNivel || visitasActuales >= visitasSiguienteNivel) {
      descripcion = '¡Ya cumples los requisitos para ascender!';
    } else if (progresoPuntos > progresoVisitas) {
      descripcion = `${puntosNecesarios} puntos para ${siguienteNivel}`;
    } else {
      descripcion = `${visitasNecesarias} visitas para ${siguienteNivel}`;
    }

    console.log(`Progreso hacia ${siguienteNivel}: ${Math.round(progress)}%`);
    console.log(`Requisitos ${siguienteNivel}: ${puntosSiguienteNivel} puntos O ${visitasSiguienteNivel} visitas`);
    console.log(`Progreso por puntos: ${Math.round(progresoPuntos)}%`);
    console.log(`Progreso por visitas: ${Math.round(progresoVisitas)}%`);
    console.log(`Descripción: ${descripcion}`);
  } else {
    progress = 100;
    siguienteNivel = 'Máximo';
    descripcion = 'Nivel máximo alcanzado';
    console.log(`${descripcion} - ${Math.round(progress)}%`);
  }
}

// Casos de prueba
testProgreso('Bronce', 50, 3);  // Progreso hacia Plata
testProgreso('Oro', 500, 1);    // Ya Oro, progreso hacia Diamante
testProgreso('Platino', 5000, 50); // Nivel máximo
