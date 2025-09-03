// Test de JSON Schema
const { z } = require('zod');
const zodToJsonSchema = require('zod-to-json-schema').default;

// Función de conversión simplificada
function convertZodToJsonSchema(schema) {
  const jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    strictUnions: true,
  });
  
  // Añadir manualmente la propiedad $schema para cumplir con draft 2020-12
  return {
    ...jsonSchema,
    $schema: "https://json-schema.org/draft/2020-12/schema"
  };
}

// Crear un esquema Zod de ejemplo
const ExampleSchema = z.object({
  name: z.string().min(3).max(50),
  age: z.number().int().positive(),
  email: z.string().email(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string()
  }),
  tags: z.array(z.string()),
  status: z.enum(['active', 'inactive', 'pending']),
  metadata: z.record(z.string(), z.any())
});

// Convertir a JSON Schema
const jsonSchema = convertZodToJsonSchema(ExampleSchema);

// Validar el esquema JSON
console.log('JSON Schema generado:');
console.log(JSON.stringify(jsonSchema, null, 2));

// Verificar la propiedad $schema
console.log('\nVerificación de compatibilidad:');
console.log(`¿Tiene propiedad $schema?: ${jsonSchema.$schema ? 'Sí' : 'No'}`);
console.log(`Valor de $schema: ${jsonSchema.$schema}`);

// Verificar si cumple con el estándar 2020-12
console.log(`¿Cumple con draft 2020-12?: ${jsonSchema.$schema === 'https://json-schema.org/draft/2020-12/schema' ? 'Sí' : 'No'}`);

// Mostrar estructura general
console.log('\nEstructura general del esquema:');
console.log('Propiedades de nivel superior:', Object.keys(jsonSchema));
