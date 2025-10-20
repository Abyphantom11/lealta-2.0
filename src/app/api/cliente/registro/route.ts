import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { AppError, ErrorType, handleError, CommonErrors, apiErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación de entrada con Zod
const registroSchema = z.object({
  cedula: z.string().min(1, 'Cédula es requerida'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  telefono: z.string().min(1, 'Teléfono es requerido'),
  correo: z.string().email('Email inválido'),
  businessId: z.string().optional()
});

// 🔒 BUSINESS ISOLATION: Configuración por business
function getPortalConfigPath(businessId: string): string {
  return path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
}

export async function POST(request: NextRequest) {
  try {
    // Validar entrada
    const body = await request.json();
    const validationResult = registroSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw CommonErrors.VALIDATION_FAILED(
        validationResult.error.issues[0].path.join('.'),
        validationResult.error.issues[0].message
      );
    }

    const { cedula, nombre, telefono, correo, businessId: bodyBusinessId } = validationResult.data;

    // 🔥 CRÍTICO: Obtener businessId con múltiples métodos para business isolation
    const businessId = await determineBusinessId(bodyBusinessId, request);
    
    // 🔍 DEBUG: Log detallado del businessId determinado
    console.log('🔍 REGISTRO DEBUG:', {
      bodyBusinessId,
      determinedBusinessId: businessId,
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    if (!businessId) {
      console.error('❌ REGISTRO ERROR: No se pudo determinar businessId', {
        bodyBusinessId,
        referer: request.headers.get('referer'),
        headers: Object.fromEntries(request.headers.entries())
      });
      throw new AppError(
        'No se pudo determinar el contexto del negocio',
        ErrorType.BUSINESS_LOGIC,
        400,
        true,
        { action: 'cliente_registro' }
      );
    }

    // 2. Verificar si ya existe un cliente con esa cédula en este business
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        cedula: cedula.toString(),
        businessId: businessId,
      },
    });

    if (clienteExistente) {
      throw new AppError(
        'Ya existe un cliente con esta cédula en este negocio',
        ErrorType.BUSINESS_LOGIC,
        409,
        true,
        { businessId, metadata: { cedula } }
      );
    }

    // 🔧 Obtener configuración de puntos dinámica POR BUSINESS
    const bonusPorRegistro = await getBonusPorRegistro(businessId);

    // Crear el cliente nuevo con transacción
    const nuevoCliente = await prisma.$transaction(async (tx) => {
      console.log('🔄 CREANDO CLIENTE:', {
        businessId,
        cedula: cedula.toString(),
        nombre: nombre.trim(),
        bonusPorRegistro
      });

      const cliente = await tx.cliente.create({
        data: {
          businessId: businessId,
          cedula: cedula.toString(),
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          puntos: bonusPorRegistro,
          totalVisitas: 1,
          portalViews: 1,
        },
      });

      console.log('✅ CLIENTE CREADO:', {
        id: cliente.id,
        businessId: cliente.businessId,
        cedula: cliente.cedula,
        nombre: cliente.nombre
      });

      // 🏆 Asignar tarjeta Bronce automáticamente
      const tarjeta = await tx.tarjetaLealtad.create({
        data: {
          clienteId: cliente.id,
          nivel: 'Bronce',
          activa: true,
          asignacionManual: false,
          fechaAsignacion: new Date(),
          businessId: businessId,
        },
      });

      console.log('✅ TARJETA CREADA:', {
        id: tarjeta.id,
        clienteId: tarjeta.clienteId,
        businessId: tarjeta.businessId,
        nivel: tarjeta.nivel
      });

      return cliente;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Cliente registrado: ${nuevoCliente.nombre} (${nuevoCliente.cedula}) en business ${businessId}`);
    }

    return NextResponse.json({
      success: true,
      clienteCliente: {
        id: nuevoCliente.id,
        cedula: nuevoCliente.cedula,
        nombre: nuevoCliente.nombre,
        puntos: nuevoCliente.puntos,
        visitas: nuevoCliente.totalVisitas,
      },
    });
  } catch (error) {
    return apiErrorHandler(error as Error, request);
  }
}

// Helper functions
async function determineBusinessId(bodyBusinessId: string | undefined, request: NextRequest): Promise<string | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('🏢 Cliente Registro: Determinando business context...');
  }
  
  // Método 1: Del cuerpo de la petición
  if (bodyBusinessId) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ BusinessId from request body: ${bodyBusinessId}`);
    }
    return bodyBusinessId;
  }
  
  // Método 2: Del header
  const headerBusinessId = request.headers.get('x-business-id');
  if (headerBusinessId) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ BusinessId from header: ${headerBusinessId}`);
    }
    return headerBusinessId;
  }
  
  // Método 3: Del referer
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const pathSegments = refererUrl.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 1 && pathSegments[1] === 'cliente') {
        const potentialBusinessSlug = pathSegments[0];
        
        const business = await prisma.business.findFirst({
          where: {
            OR: [
              { slug: potentialBusinessSlug },
              { subdomain: potentialBusinessSlug },
              { id: potentialBusinessSlug }
            ],
            isActive: true
          }
        });
        
        if (business) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ BusinessId from referer: ${potentialBusinessSlug} → ${business.id}`);
          }
          return business.id;
        }
      }
    } catch (error) {
      handleError(error as Error, { action: 'parse_referer' });
    }
  }
  
  return null;
}

async function getBonusPorRegistro(businessId: string): Promise<number> {
  const defaultBonus = 100;
  
  try {
    const configPath = getPortalConfigPath(businessId);
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    const bonus = config.configuracionPuntos?.bonusPorRegistro || defaultBonus;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`💰 Bonus por registro configurado para business ${businessId}: ${bonus}`);
    }
    
    return bonus;
  } catch (error) {
    handleError(error as Error, { 
      businessId, 
      action: 'load_bonus_config',
      metadata: { fallbackValue: defaultBonus }
    });
    return defaultBonus;
  }
}
