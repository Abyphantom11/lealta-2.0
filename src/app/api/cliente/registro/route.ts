import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

export async function POST(request: NextRequest) {
  try {
    const { cedula, nombre, telefono, correo } = await request.json();

    if (!cedula || !nombre || !telefono || !correo) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el cliente ya existe (por cédula)
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        cedula: cedula.toString(),
      },
    });

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con esta cédula' },
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
          businessId: null, // Por ahora sin business relationship
        },
      });
      console.log(`✅ Tarjeta Bronce asignada automáticamente al cliente ${nuevoCliente.nombre}`);
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
