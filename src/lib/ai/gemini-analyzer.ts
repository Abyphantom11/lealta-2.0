import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiAnalysisResult } from '@/types/analytics';
import { getGeminiApiKey } from '../env';

// Lazy initialization - se inicializa solo cuando se necesita
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error('❌ GOOGLE_GEMINI_API_KEY no configurada');
    return null;
  }
  
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export class GeminiPOSAnalyzer {
  private getModel() {
    const ai = getGenAI();
    if (!ai) return null;
    
    return ai.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });
  }

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<GeminiAnalysisResult> {
    const model = this.getModel();
    
    if (!model) {
      console.error('❌ Google Gemini no está configurado');
      throw new Error('Google Gemini no está configurado. Verifica tu API key.');
    }
    
    console.log('🤖 [GEMINI] Iniciando análisis de imagen...');
    console.log('🤖 [GEMINI] Buffer size:', imageBuffer.length, 'bytes');
    console.log('🤖 [GEMINI] MIME type:', mimeType);
    
    try {
      const prompt = `
        Analiza esta imagen de un ticket de venta, recibo o pantalla POS y extrae TODA la información visible con máxima precisión.

        INSTRUCCIONES DETALLADAS:
        1. 🔍 Examina CUIDADOSAMENTE toda la imagen
        2. 📝 Identifica TODOS los productos/servicios vendidos
        3. 💰 Encuentra el TOTAL FINAL exacto de la venta
        4. ⏰ Busca fecha, hora y empleado/cajero
        5. 🎯 Determina la confianza basada en la claridad de la imagen

        FORMATO DE RESPUESTA REQUERIDO (SOLO JSON, SIN MARKDOWN):
        {
          "productos": [
            {
              "nombre": "Nombre exacto del producto como aparece",
              "cantidad": número_entero,
              "precio": precio_unitario_decimal,
              "categoria": "bebida|comida|postre|servicio|otro"
            }
          ],
          "total": total_final_decimal,
          "fecha": "YYYY-MM-DD HH:MM:SS o null si no visible",
          "empleado": "Nombre del empleado/cajero o null si no visible",
          "puntosGenerados": total_redondeado_entero,
          "confianza": decimal_entre_0_y_1,
          "errores": ["lista de problemas encontrados si los hay"],
          "metadata": {
            "tipoDocumento": "ticket|recibo|pantalla_pos|factura|otro",
            "negocio": "nombre del negocio si es visible o null",
            "metodoPago": "efectivo|tarjeta|transferencia|otro|null"
          }
        }

        REGLAS CRÍTICAS:
        - 🚨 Responde ÚNICAMENTE con el JSON, sin texto adicional
        - 📊 Si no encuentras productos, devuelve array vacío
        - 💯 Si no encuentras total, devuelve 0
        - 🎯 Confianza alta (>0.8) solo si la imagen es muy clara
        - ❌ Si la imagen no es un ticket/POS, confianza debe ser < 0.3
        - 🔢 Todos los precios deben ser números sin símbolos de moneda
        - ✅ Sé conservador con la confianza si tienes dudas
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType,
        },
      };

      console.log('🤖 [GEMINI] Enviando prompt a Gemini AI...');
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();

      console.log('📥 [GEMINI] Respuesta raw de Gemini (primeros 200 chars):', text.substring(0, 200));
      console.log('📥 [GEMINI] Longitud total de respuesta:', text.length);

      // Limpiar la respuesta de markdown y extraer JSON
      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // Buscar el JSON en la respuesta
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(cleanedText);
      
      if (!jsonMatch) {
        console.error('❌ No se encontró JSON válido en la respuesta:', text);
        throw new Error('No se pudo extraer JSON válido de la respuesta de Gemini');
      }

      let analysisResult: GeminiAnalysisResult;
      try {
        analysisResult = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON parseado exitosamente:', analysisResult);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        console.error('Texto que falló al parsear:', jsonMatch[0]);
        throw new Error(`Error parseando respuesta JSON: ${parseError}`);
      }

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
