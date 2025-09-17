import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

export async function POST(request: NextRequest) {
  try {
    const { cedula, nombre, telefono, correo, businessId: bodyBusinessId } = await request.json();

    if (!cedula || !nombre || !telefono || !correo) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // 🔥 CRÍTICO: Obtener businessId con múltiples métodos para business isolation
    let businessId = null;
    
    console.log('🏢 Cliente Registro: Determinando business context...');
    
    // Método 1: Del cuerpo de la petición (más confiable para rutas públicas)
    if (bodyBusinessId) {
      businessId = bodyBusinessId;
      console.log(`✅ BusinessId from request body: ${businessId}`);
    }
    
    // Método 2: Del header (para compatibilidad con rutas internas)
    if (!businessId) {
      businessId = request.headers.get('x-business-id');
      if (businessId) {
        console.log(`✅ BusinessId from header: ${businessId}`);
      }
    }
    
    // Método 3: Del referer (extraer de la URL de origen)
    if (!businessId) {
      const referer = request.headers.get('referer');
      if (referer) {
        const refererUrl = new URL(referer);
        const pathSegments = refererUrl.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 1 && pathSegments[1] === 'cliente') {
          const potentialBusinessSlug = pathSegments[0];
          
          // Validar que es un business válido consultando la DB
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
            businessId = business.id;
            console.log(`✅ BusinessId from referer: ${potentialBusinessSlug} → ${businessId}`);
          }
        }
      }
    }
    
    if (!businessId) {
      console.error('❌ No se pudo determinar el business context para el registro');
      return NextResponse.json(
        { error: 'No se pudo determinar el contexto del negocio' },
        { status: 400 }
      );
    }

    // 2. Verificar si ya existe un cliente con esa cédula en este business
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        cedula: cedula.toString(),
        businessId: businessId, // ✅ VERIFICAR POR BUSINESS TAMBIÉN
      },
    });

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con esta cédula en este negocio' },
        { status: 400 }
      );
    }

    // 🔧 Obtener configuración de puntos dinámica
    let bonusPorRegistro = 100; // Valor por defecto
    try {
      const configContent = await fs.readFile(PORTAL_CONFIG_PATH, 'utf-8');
      const config = JSON.parse(configContent);
      bonusPorRegistro = config.configuracionPuntos?.bonusPorRegistro || 100;
      console.log(`💰 Bonus por registro configurado: ${bonusPorRegistro}`);
    } catch (error) {
      console.warn('⚠️ No se pudo cargar configuración de puntos, usando valor por defecto:', error);
    }

    // Crear el cliente nuevo
    const nuevoCliente = await prisma.cliente.create({
      data: {
        businessId: businessId, // ✅ ASIGNAR BUSINESS ID
        cedula: cedula.toString(),
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
        puntos: bonusPorRegistro, // ✅ Puntos dinámicos de bienvenida
        totalVisitas: 1,
        portalViews: 1,
      },
    });

    // 🏆 Asignar tarjeta Bronce automáticamente a clientes nuevos
    try {
      await prisma.tarjetaLealtad.create({
        data: {
          clienteId: nuevoCliente.id,
          nivel: 'Bronce',
          activa: true,
          asignacionManual: false, // Asignación automática
          fechaAsignacion: new Date(),
          businessId: businessId, // ✅ ASIGNAR BUSINESS ID A LA TARJETA
        },
      });
      console.log(`🏆 Tarjeta Bronce asignada automáticamente al cliente ${nuevoCliente.cedula}`);
    } catch (tarjetaError) {
      console.warn('⚠️ Error asignando tarjeta Bronce automática:', tarjetaError);
      // No fallar el registro si hay error con la tarjeta
    }

    console.log(`✅ Cliente registrado exitosamente: ${nuevoCliente.nombre} (${nuevoCliente.cedula}) en business ${businessId}`);

    return NextResponse.json({
      success: true,
      cliente: {
        id: nuevoCliente.id,
        cedula: nuevoCliente.cedula,
        nombre: nuevoCliente.nombre,
        puntos: nuevoCliente.puntos,
        visitas: nuevoCliente.totalVisitas,
      },
    });
  } catch (error) {
    console.error('Error registrando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
