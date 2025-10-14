const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', '[businessId]', 'staff', 'StaffPageContent-full.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Definir los reemplazos
const replacements = [
  ['im??genes', 'imágenes'],
  ['funci??n', 'función'],
  ['b??squeda', 'búsqueda'],
  ['autom??tica', 'automática'],
  ['tel??fono', 'teléfono'],
  ['c??dula', 'cédula'],
  ['??rea', 'área'],
  ['m??nimo', 'mínimo'],
  ['m??s', 'más'],
  ['m??ltiples', 'múltiples'],
  ['n??meros', 'números'],
  ['seg??n', 'según'],
  ['confirmaci??n', 'confirmación'],
  ['may??sculas', 'mayúsculas'],
  ['l??gica', 'lógica'],
  ['din??micos', 'dinámicos'],
  ['configuraci??n', 'configuración'],
  ['depuraci??n', 'depuración'],
  ['??nicos', 'únicos'],
  ['??nico', 'único'],
  ['??nicamente', 'únicamente'],
  ['estad??sticas', 'estadísticas'],
  ['categor??a', 'categoría'],
  ['revisi??n', 'revisión'],
  ['verificaci??n', 'verificación'],
  ['autenticaci??n', 'autenticación'],
  ['conexi??n', 'conexión'],
  ['informaci??n', 'información'],
  ['Bot??n', 'Botón'],
  ['bot??n', 'botón'],
  ['Input C??dula', 'Input Cédula'],
  ['Tel??fono', 'Teléfono'],
  ['s??mbolos', 'símbolos'],
  ['despu??s', 'después'],
  ['n??mero', 'número'],
  ['bas??ndose', 'basándose'],
  ['??nica', 'única'],
  ['MAY??SCULAS', 'MAYÚSCULAS'],
  ['d??a', 'día'],
  ['Autom??tica', 'Automática'],
  ['L??gica', 'Lógica'],
  ['consolidaci??n', 'consolidación'],
  ['Categor??a', 'Categoría'],
  ['C??dula', 'Cédula']
];

// Aplicar todos los reemplazos
replacements.forEach(([from, to]) => {
  // Usar reemplazo simple de cadenas en lugar de regex para evitar problemas con caracteres especiales
  content = content.split(from).join(to);
});

// Escribir el archivo corregido
fs.writeFileSync(filePath, content, 'utf8');

console.log('Archivo corregido exitosamente. Caracteres problemáticos reemplazados.');
