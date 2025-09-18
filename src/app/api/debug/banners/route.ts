import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

export async function GET(request: NextRequest) {
  try {
    // Obtener día actual
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaActual = diasSemana[new Date().getDay()];
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
  } catch (error) {
    console.error('Error en debug banners:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}
