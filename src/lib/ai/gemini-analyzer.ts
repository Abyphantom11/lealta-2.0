import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiAnalysisResult } from '@/types/analytics';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export class GeminiPOSAnalyzer {
  private readonly model = genAI.getGenerativeModel({
    model: 'gemini-pro-vision',
  });

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<GeminiAnalysisResult> {
    try {
      const prompt = `
        Analiza esta captura de pantalla del sistema POS (Point of Sale) y extrae la información de la venta.

        INSTRUCCIONES ESPECÍFICAS:
        1. Identifica TODOS los productos vendidos con sus cantidades y precios
        2. Encuentra el TOTAL FINAL de la venta
        3. Extrae la fecha y hora si está visible
        4. Calcula los puntos de fidelización (1 punto = 1 peso)

        FORMATO DE RESPUESTA REQUERIDO (JSON):
        {
          "productos": [
            {
              "nombre": "Nombre exacto del producto",
              "cantidad": número_entero,
              "precio": precio_unitario_decimal,
              "categoria": "bebida|comida|postre|otro"
            }
          ],
          "total": total_decimal,
          "fecha": "YYYY-MM-DD HH:MM:SS o null si no visible",
          "puntosGenerados": total_redondeado_entero,
          "confianza": decimal_0_a_1,
          "errores": ["lista de errores si los hay"]
        }

        REGLAS IMPORTANTES:
        - Si no puedes leer algún texto claramente, incluye en "errores"
        - Los precios deben ser números decimales
        - Las cantidades deben ser números enteros
        - La confianza debe reflejar qué tan seguro estás de la lectura
        - Si es una imagen borrosa o no es un POS, indica confianza baja
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();

      // Extraer JSON de la respuesta
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(text);
      if (!jsonMatch) {
        throw new Error(
          'No se pudo extraer JSON válido de la respuesta de Gemini'
        );
      }

      const analysisResult: GeminiAnalysisResult = JSON.parse(jsonMatch[0]);

      // Validaciones básicas
      this.validateAnalysisResult(analysisResult);

      return analysisResult;
    } catch (error) {
      console.error('Error analizando imagen con Gemini:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Fallo en análisis de IA: ${errorMessage}`);
    }
  }

  private validateAnalysisResult(result: GeminiAnalysisResult): void {
    if (!result.productos || !Array.isArray(result.productos)) {
      throw new Error('Productos no válidos en el resultado');
    }

    if (typeof result.total !== 'number' || result.total <= 0) {
      throw new Error('Total no válido en el resultado');
    }

    if (
      typeof result.confianza !== 'number' ||
      result.confianza < 0 ||
      result.confianza > 1
    ) {
      throw new Error('Nivel de confianza no válido');
    }

    // Validar cada producto
    result.productos.forEach((producto, index) => {
      if (!producto.nombre || typeof producto.nombre !== 'string') {
        throw new Error(`Producto ${index}: nombre no válido`);
      }
      if (typeof producto.cantidad !== 'number' || producto.cantidad <= 0) {
        throw new Error(`Producto ${index}: cantidad no válida`);
      }
      if (typeof producto.precio !== 'number' || producto.precio <= 0) {
        throw new Error(`Producto ${index}: precio no válido`);
      }
    });
  }

  // Método para procesar múltiples imágenes en lote
  async analyzeBatch(
    images: Array<{ buffer: Buffer; mimeType: string }>
  ): Promise<GeminiAnalysisResult[]> {
    const results: GeminiAnalysisResult[] = [];

    for (const image of images) {
      try {
        const result = await this.analyzeImage(image.buffer, image.mimeType);
        results.push(result);

        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error en imagen del lote:', error);
        // Continuar con las demás imágenes
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        results.push({
          productos: [],
          total: 0,
          fecha: '',
          puntosGenerados: 0,
          confianza: 0,
          errores: [`Error procesando imagen: ${errorMessage}`],
        });
      }
    }

    return results;
  }
}

export const geminiAnalyzer = new GeminiPOSAnalyzer();
