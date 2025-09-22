import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentBusinessDay } from '@/lib/business-day-utils';

const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

export async function GET() {
  try {
    // ✅ SOLUCIÓN: Obtener día comercial en lugar de día natural
    const diaActual = await getCurrentBusinessDay();
    const ahora = new Date();
    const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    
    // Leer configuración
    const data = fs.readFileSync(PORTAL_CONFIG_PATH, 'utf8');
    const config = JSON.parse(data);
    
    // Filtrar banners como lo hace el componente
    const todosActivos = config.banners?.filter(
      (b: any) => b.activo && b.imagenUrl && b.imagenUrl.trim() !== ''
    ) || [];
    
    const bannersDelDia = todosActivos.filter((b: any) => {
      // Verificar día
      if (b.dia !== diaActual) {
        return false;
      }
      
      // Verificar hora si está configurada
      if (b.horaPublicacion) {
        const [horas, minutos] = b.horaPublicacion.split(':').map(Number);
        const horaPublicacion = horas * 60 + minutos;
        return horaActualMinutos >= horaPublicacion;
      }
      
      return true;
    });

    return NextResponse.json({
      debug: {
        diaActual,
        horaActual: `${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')}`,
        horaActualMinutos,
        totalBanners: config.banners?.length || 0,
        bannersActivos: todosActivos.length,
        bannersDelDia: bannersDelDia.length,
        detallesBanners: config.banners?.map((b: any) => ({
          id: b.id,
          dia: b.dia,
          activo: b.activo,
          tieneImagen: !!b.imagenUrl,
          horaPublicacion: b.horaPublicacion,
          cumpleDia: b.dia === diaActual,
          cumpleHora: b.horaPublicacion ? horaActualMinutos >= (parseInt(b.horaPublicacion.split(':')[0]) * 60 + parseInt(b.horaPublicacion.split(':')[1])) : true
        }))
      },
      bannersParaMostrar: bannersDelDia
    });
  } catch (error: unknown) {
    console.error('Error en debug banners:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
