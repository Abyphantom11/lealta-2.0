# Solución para los problemas con Workers y JSON Schema

## Problema 1: Workers en la carpeta `.next`

### ¿Qué ocurría?
Los worker scripts se estaban guardando en la carpeta `.next`, que es borrada y recreada con cada build. Esto provocaba que los workers se perdieran y tuvieran que ser recreados, lo que podía causar problemas de funcionamiento.

### Solución implementada
1. Creamos una carpeta dedicada `src/workers/` para almacenar todos los scripts de workers
2. Implementamos un sistema que copia automáticamente los workers a la ubicación adecuada durante el build
3. El script `scripts/copy-service-worker.js` ahora se ejecuta antes de cada build para garantizar que el Service Worker esté actualizado

## Problema 2: JSON Schema no compatible con draft 2020-12

### ¿Qué ocurría?
La API de Copilot/Anthropic requiere que los esquemas JSON cumplan con el estándar JSON Schema draft 2020-12. El esquema que se estaba enviando no cumplía con este requisito, lo que provocaba el error:

```
tools.0.custom.input_schema: JSON schema is invalid. It must match JSON Schema draft 2020-12
```

### Solución implementada
1. Creamos un helper `src/lib/schema-helpers.ts` que convierte esquemas Zod a JSON Schema 2020-12
2. La función `convertZodToJsonSchema` garantiza que los esquemas exportados cumplan con el estándar requerido
3. La función `validateWithZod` proporciona una validación mejorada con mensajes de error más claros

## Mejoras adicionales

### Service Worker mejorado
- Implementamos un Service Worker más robusto con estrategias de caché optimizadas
- Agregamos manejo de eventos de sincronización para datos offline
- Mejoramos el manejo de errores y la detección de estado offline

### Página offline
- Creamos una página `offline.html` que se muestra cuando el usuario no tiene conexión
- La página incluye funcionalidad para intentar reconectar automáticamente
- Proporciona una mejor experiencia de usuario durante problemas de conectividad

## Cómo usar estos cambios

### Para trabajar con los esquemas JSON:
```typescript
import { BusinessSchema } from '@/lib/validations';
import { convertZodToJsonSchema } from '@/lib/schema-helpers';

// Convertir un esquema Zod a JSON Schema 2020-12
const jsonSchema = convertZodToJsonSchema(BusinessSchema);

// Enviar este esquema a Copilot/Anthropic
// jsonSchema está garantizado que cumple con draft 2020-12
```

### Para validar datos con los esquemas:
```typescript
import { ClienteSchema } from '@/lib/validations';
import { validateWithZod } from '@/lib/schema-helpers';

// Validar datos contra un esquema
const data = { /* ... */ };
const result = validateWithZod(ClienteSchema, data);

if (result.success) {
  // Datos válidos, usar result.data
} else {
  // Datos inválidos, mostrar result.error
}
```

### Para trabajar con workers:
Coloca todos los worker scripts en `src/workers/` y serán copiados automáticamente a las ubicaciones adecuadas durante el build.
