import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

const CLIENT_PORTAL_DIR = path.join(process.cwd(), 'client-portal');

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`🔄 Sync-tarjetas POST by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
    const body = await request.json();
    const { nombreEmpresa } = body;

    if (!nombreEmpresa) {
      return NextResponse.json({ error: 'Nombre de empresa requerido' }, { status: 400 });
    }

    let updatedCards = 0;

    // Verificar si existe el directorio client-portal
    try {
      await fs.access(CLIENT_PORTAL_DIR);
    } catch {
      // Si no existe el directorio, no hay tarjetas que actualizar
      return NextResponse.json({ 
        message: 'No hay tarjetas de clientes para actualizar',
        updatedCards: 0 
      });
    }

    // Leer todos los archivos en client-portal
    const files = await fs.readdir(CLIENT_PORTAL_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(CLIENT_PORTAL_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const clientData = JSON.parse(fileContent);

          // Verificar si el cliente tiene una tarjeta asignada
          if (clientData.tarjeta && typeof clientData.tarjeta === 'object') {
            // Actualizar el nombre de la empresa en la tarjeta
            clientData.tarjeta.nombreEmpresa = nombreEmpresa;
            
            // Guardar el archivo actualizado
            await fs.writeFile(filePath, JSON.stringify(clientData, null, 2), 'utf8');
            updatedCards++;
          }
        } catch (fileError) {
          console.error(`Error procesando archivo ${file}:`, fileError);
          // Continuar con el siguiente archivo en caso de error
        }
      }
    }

    return NextResponse.json({
      message: `${updatedCards} tarjetas de clientes actualizadas`,
      updatedCards,
      syncedBy: session.userId // ✅ AUDITORÍA
    });

  } catch (error) {
    console.error('❌ Error sincronizando tarjetas de empresa:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, AuthConfigs.ADMIN_ONLY);
}
