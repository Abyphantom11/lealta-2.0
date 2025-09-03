import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

/**
 * Convierte un esquema Zod a un esquema JSON que cumple con JSON Schema draft 2020-12
 * 
 * @param schema El esquema Zod a convertir
 * @returns Un objeto de esquema JSON compatible con JSON Schema draft 2020-12
 */
export function convertZodToJsonSchema(schema: z.ZodType) {
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

/**
 * Valida que un objeto cumpla con un esquema Zod
 * y devuelve un mensaje de error formatado si no es válido
 * 
 * @param schema El esquema Zod para validar
 * @param data Los datos a validar
 * @returns El resultado de la validación
 */
export function validateWithZod<T extends z.ZodType>(
  schema: T, 
  data: unknown
): { success: boolean; data?: z.infer<T>; error?: string } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const formattedError = result.error.format();
    const errorMessages: string[] = [];
    
    function extractErrors(obj: any, path: string[] = []) {
      if (obj._errors && obj._errors.length > 0) {
        errorMessages.push(`${path.join('.')}: ${obj._errors.join(', ')}`);
      }
      
      Object.keys(obj).forEach(key => {
        if (key !== '_errors' && typeof obj[key] === 'object') {
          extractErrors(obj[key], [...path, key]);
        }
      });
    }
    
    extractErrors(formattedError);
    
    return {
      success: false,
      error: errorMessages.join('; ')
    };
  }
  
  return {
    success: true,
    data: result.data
  };
}
