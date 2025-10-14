import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey } from '../env';

// Inicializar Gemini con validación segura de env vars
const apiKey = getGeminiApiKey();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ReservationParseResult {
  clienteNombre?: string;
  clienteCedula?: string;
  clienteCorreo?: string;
  clienteTelefono?: string;
  numeroPersonas?: number;
  fecha?: string; // YYYY-MM-DD
  hora?: string; // HH:MM
  confianza: number; // 0-1
  camposFaltantes: string[];
  errores?: string[];
  metadata?: {
    formatoDetectado: 'whatsapp' | 'formulario' | 'email' | 'conversacion' | 'desconocido';
    idioma: 'es' | 'en' | 'otro';
  };
}

export class GeminiReservationParser {
  private readonly model = genAI?.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });

  async parseReservationText(text: string): Promise<ReservationParseResult> {
    if (!this.model) {
      console.error('❌ Google Gemini no está configurado');
      throw new Error('Google Gemini no está configurado. Verifica tu API key.');
    }

    if (!text || text.trim().length < 10) {
      throw new Error('El texto es demasiado corto. Debe tener al menos 10 caracteres.');
    }

    console.log('🤖 [GEMINI-RESERVA] Iniciando análisis de texto...');
    console.log('🤖 [GEMINI-RESERVA] Longitud del texto:', text.length, 'caracteres');

    try {
      // Obtener fecha actual para contexto de fechas relativas
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dayOfWeek = today.toLocaleDateString('es-ES', { weekday: 'long' });

      const prompt = `
Eres un asistente especializado en extraer información de reservaciones de restaurantes/eventos desde mensajes de clientes.

CONTEXTO TEMPORAL:
- Hoy es: ${todayStr} (${dayOfWeek})
- Usa este contexto para interpretar fechas relativas como "mañana", "pasado mañana", "viernes", etc.

TEXTO A ANALIZAR:
"""
${text}
"""

INSTRUCCIONES DETALLADAS:
1. 🔍 Extrae TODOS los datos del cliente que puedas identificar
2. 📝 Sé flexible con formatos: detecta variaciones de etiquetas
3. 📅 Interpreta fechas relativas basándote en la fecha de HOY
4. 🌍 Detecta códigos de país en teléfonos (+507, +1, etc.)
5. ✅ Normaliza formatos (cédulas con guiones, emails en minúsculas)
6. 🎯 Calcula confianza basado en claridad y completitud

CAMPOS A EXTRAER:
- **Nombre completo**: Busca "nombre", "name", "mi nombre es", "soy", etc.
- **Cédula/ID**: Formatos como "8-123-4567", "8 123 4567", "cedula:", "id:", etc.
- **Email**: Detecta cualquier texto con @ y dominio válido
- **Teléfono**: Números con 7-15 dígitos, puede incluir +, -, espacios, paréntesis
- **Número de personas**: "somos X", "para X personas", "mesa de X", "X pax"
- **Fecha**: Formatos absolutos (DD/MM/YYYY, "5 de octubre") o relativos ("mañana", "viernes")
- **Hora**: "8pm", "20:00", "8 de la noche", "8:30 PM"

REGLAS DE NORMALIZACIÓN:
- Cédulas: EXTRAER TAL CUAL sin agregar guiones. Solo números (ejemplo: "8-123-4567" → "81234567", "8 123 4567" → "81234567")
- Emails: Todo en minúsculas
- Teléfonos: SOLO números sin código de país, sin guiones, sin espacios (ejemplo: "+507 6234-5678" → "62345678", "6234-5678" → "62345678")
- Fechas: Convertir a formato YYYY-MM-DD
- Horas: Convertir a formato 24h HH:MM
- Personas: Solo el número entero

DETECCIÓN DE FORMATO:
- WhatsApp: Mensaje informal, emojis, saludos casuales
- Formulario: Estructura de etiquetas y valores, formato rígido
- Email: Encabezados, firma, formato profesional
- Conversación: Lenguaje natural, preguntas, respuestas

CONFIANZA:
- Alta (0.8-1.0): Todos los campos principales claros y validables
- Media (0.5-0.8): Algunos campos ambiguos o faltantes
- Baja (0.0-0.5): Muchos campos faltantes o texto confuso

FORMATO DE RESPUESTA (SOLO JSON, SIN MARKDOWN):
{
  "clienteNombre": "Nombre Completo o null",
  "clienteCedula": "solo_numeros_sin_guiones o null",
  "clienteCorreo": "email@domain.com o null",
  "clienteTelefono": "solo_numeros_sin_codigo_pais o null",
  "numeroPersonas": numero_entero o null,
  "fecha": "YYYY-MM-DD o null",
  "hora": "HH:MM o null",
  "confianza": decimal_entre_0_y_1,
  "camposFaltantes": ["lista", "de", "campos", "no", "encontrados"],
  "errores": ["lista de problemas si los hay"],
  "metadata": {
    "formatoDetectado": "whatsapp|formulario|email|conversacion|desconocido",
    "idioma": "es|en|otro"
  }
}

REGLAS CRÍTICAS:
- 🚨 Responde ÚNICAMENTE con JSON válido, sin texto adicional
- 🚨 Si un campo no se encuentra, usa null (no string vacío)
- 🚨 camposFaltantes debe listar SOLO los campos obligatorios faltantes
- 🚨 Sé conservador con confianza: si dudas, baja el score
- 🚨 errores solo si hay problemas reales (formato inválido, ambigüedad crítica)
- ✅ Prioriza precisión sobre completitud
`;

      console.log('🤖 [GEMINI-RESERVA] Enviando prompt a Gemini AI...');
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      console.log('📥 [GEMINI-RESERVA] Respuesta raw (primeros 300 chars):', responseText.substring(0, 300));

      // Limpiar la respuesta de markdown y extraer JSON
      const cleanedText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // Buscar el JSON en la respuesta
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = jsonRegex.exec(cleanedText);

      if (!jsonMatch) {
        console.error('❌ No se encontró JSON válido en la respuesta');
        throw new Error('No se pudo extraer JSON válido de la respuesta de Gemini');
      }

      let parseResult: ReservationParseResult;
      try {
        parseResult = JSON.parse(jsonMatch[0]);
        console.log('✅ [GEMINI-RESERVA] JSON parseado exitosamente');
        console.log('📊 [GEMINI-RESERVA] Confianza:', parseResult.confianza);
        console.log('📋 [GEMINI-RESERVA] Campos detectados:', {
          nombre: !!parseResult.clienteNombre,
          cedula: !!parseResult.clienteCedula,
          email: !!parseResult.clienteCorreo,
          telefono: !!parseResult.clienteTelefono,
          personas: !!parseResult.numeroPersonas,
          fecha: !!parseResult.fecha,
          hora: !!parseResult.hora,
        });
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error(`Error parseando respuesta JSON: ${parseError}`);
      }

      // Validar y normalizar resultado
      this.validateAndNormalize(parseResult);

      return parseResult;
    } catch (error) {
      console.error('❌ [GEMINI-RESERVA] Error analizando texto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Fallo en análisis de IA: ${errorMessage}`);
    }
  }

  private validateAndNormalize(result: ReservationParseResult): void {
    // Validar confianza
    if (typeof result.confianza !== 'number' || result.confianza < 0 || result.confianza > 1) {
      console.warn('⚠️ Confianza inválida, ajustando a 0.5');
      result.confianza = 0.5;
    }

    // Validar array de campos faltantes
    if (!Array.isArray(result.camposFaltantes)) {
      result.camposFaltantes = [];
    }

    // Normalizar email a minúsculas
    if (result.clienteCorreo) {
      result.clienteCorreo = result.clienteCorreo.toLowerCase().trim();
      
      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(result.clienteCorreo)) {
        console.warn('⚠️ Email con formato sospechoso:', result.clienteCorreo);
        result.errores = result.errores || [];
        result.errores.push('Formato de email podría ser inválido');
      }
    }

    // Validar número de personas
    if (result.numeroPersonas !== null && result.numeroPersonas !== undefined) {
      if (result.numeroPersonas < 1 || result.numeroPersonas > 100) {
        console.warn('⚠️ Número de personas fuera de rango:', result.numeroPersonas);
        result.errores = result.errores || [];
        result.errores.push('Número de personas parece inusual');
      }
    }

    // Validar formato de fecha (YYYY-MM-DD)
    if (result.fecha) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(result.fecha)) {
        console.warn('⚠️ Formato de fecha incorrecto:', result.fecha);
        result.errores = result.errores || [];
        result.errores.push('Formato de fecha incorrecto');
      } else {
        // Validar que la fecha no sea en el pasado
        const fechaReserva = new Date(result.fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaReserva < hoy) {
          console.warn('⚠️ Fecha en el pasado:', result.fecha);
          result.errores = result.errores || [];
          result.errores.push('La fecha parece estar en el pasado');
        }
      }
    }

    // Validar formato de hora (HH:MM)
    if (result.hora) {
      const horaRegex = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
      if (!horaRegex.test(result.hora)) {
        console.warn('⚠️ Formato de hora incorrecto:', result.hora);
        result.errores = result.errores || [];
        result.errores.push('Formato de hora incorrecto');
      }
    }

    // Normalizar cédula (asegurar guiones)
    if (result.clienteCedula) {
      // Remover espacios y caracteres no numéricos excepto guiones
      let cedula = result.clienteCedula.replace(/[^\d-]/g, '');
      
      // Si no tiene guiones y tiene formato panameño (7-9 dígitos), intentar formato X-XXX-XXXX
      if (!cedula.includes('-') && cedula.length >= 7 && cedula.length <= 9) {
        if (cedula.length === 7) {
          // Formato X-XXX-XXX
          cedula = `${cedula[0]}-${cedula.substring(1, 4)}-${cedula.substring(4)}`;
        } else if (cedula.length === 8) {
          // Formato X-XXXX-XXX
          cedula = `${cedula[0]}-${cedula.substring(1, 5)}-${cedula.substring(5)}`;
        } else if (cedula.length === 9) {
          // Formato XX-XXX-XXXX
          cedula = `${cedula.substring(0, 2)}-${cedula.substring(2, 5)}-${cedula.substring(5)}`;
        }
      }
      
      result.clienteCedula = cedula;
    }

    // Identificar campos faltantes obligatorios
    const camposObligatorios = [
      { key: 'clienteNombre', nombre: 'Nombre' },
      { key: 'clienteCedula', nombre: 'Cédula' },
      { key: 'clienteCorreo', nombre: 'Email' },
      { key: 'clienteTelefono', nombre: 'Teléfono' },
      { key: 'fecha', nombre: 'Fecha' },
      { key: 'hora', nombre: 'Hora' },
    ];

    result.camposFaltantes = camposObligatorios
      .filter(campo => !result[campo.key as keyof ReservationParseResult])
      .map(campo => campo.nombre);

    console.log('✅ [GEMINI-RESERVA] Validación completada');
    console.log('📋 [GEMINI-RESERVA] Campos faltantes:', result.camposFaltantes);
  }
}
