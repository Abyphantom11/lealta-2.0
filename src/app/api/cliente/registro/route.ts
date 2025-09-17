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

    // 🏢 OBTENER BUSINESS ID DEL CONTEXTO - MEJORADO
    let businessId = request.headers.get('x-business-id');
    
    // Si no está en el header, usar el del cuerpo de la petición
    if (!businessId && bodyBusinessId) {
      businessId = bodyBusinessId;
    }
    
    // 🚨 FALLBACK: Si el businessId del header es un slug, extraer de la sesión
    if (!businessId || businessId.length < 10) { // Los IDs reales son más largos
      const sessionCookie = request.cookies.get('session');
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
          businessId = sessionData.businessId;
        } catch (error) {
          console.error('❌ Error parseando sesión:', error);
        }
      }
    }
    
    if (!businessId) {
      console.error('❌ No se encontró businessId en headers, cuerpo ni sesión');
      return NextResponse.json(
        { error: 'Contexto de negocio requerido' },
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
    } catch (error) {
      console.warn('⚠️ No se pudo cargar configuración de puntos, usando valor por defecto:', error);
    }

    // Por ahora trabajamos sin business relationship - necesitamos actualizar el esquema
    // Vamos a intentar crear el cliente sin businessId primero
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
      
    } catch (tarjetaError) {
      console.warn('⚠️ Error asignando tarjeta Bronce automática:', tarjetaError);
      // No fallar el registro si hay error con la tarjeta
    }

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
