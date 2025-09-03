import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Por ahora trabajamos sin business relationship - necesitamos actualizar el esquema
    // Vamos a intentar crear el cliente sin businessId primero
    const nuevoCliente = await prisma.cliente.create({
      data: {
        cedula: cedula.toString(),
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
        puntos: 100, // Puntos de bienvenida
        totalVisitas: 1,
        portalViews: 1,
      },
    });

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
