import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';
import { notifyConfigChange } from '../../../../lib/sse-notifications';
import fs from 'fs';
import path from 'path';

// Configurar como ruta dinámica para permitir el uso de request.url
export const dynamic = 'force-dynamic';

// Función auxiliar para leer tarjetas del JSON file como en config-v2
const getAdminTarjetas = async (businessId: string) => {
  try {
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    console.log('🔍 Admin reading tarjetas from:', configPath);
    
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(fileContent);
      
      console.log('📊 Admin tarjetas RAW data:', {
        tarjetasArrayLength: config.tarjetas?.length || 0,
        tarjetasExist: !!config.tarjetas,
        tarjetasType: typeof config.tarjetas,
        firstTarjeta: config.tarjetas?.[0]?.nivel,
        allNiveles: config.tarjetas?.map((t: any) => t.nivel) || [],
        nombreEmpresa: config.nombreEmpresa,
        nivelesConfigKeys: Object.keys(config.nivelesConfig || {})
      });
      
      return {
        tarjetas: config.tarjetas || [],
        nombreEmpresa: config.nombreEmpresa || 'Mi Negocio',
        nivelesConfig: config.nivelesConfig || {}
      };
    }
  } catch (error) {
    console.error('❌ Error reading admin tarjetas JSON:', error);
  }
  
  return {
    tarjetas: [],
    nombreEmpresa: 'Mi Negocio',
    nivelesConfig: {}
  };
};

// Función auxiliar para guardar tarjetas en el JSON file
const saveAdminTarjetas = async (businessId: string, tarjetas: any[], nombreEmpresa: string, nivelesConfig: any) => {
  try {
    const configDir = path.join(process.cwd(), 'config', 'portal');
    const configPath = path.join(configDir, `portal-config-${businessId}.json`);
    
    // Crear directorio si no existe
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Leer configuración existente o crear nueva
    let existingConfig = {};
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      existingConfig = JSON.parse(fileContent);
    }
    
    // Actualizar solo los campos relacionados con tarjetas
    const updatedConfig = {
      ...existingConfig,
      tarjetas: tarjetas,
      nombreEmpresa: nombreEmpresa,
      nivelesConfig: nivelesConfig,
      lastUpdated: new Date().toISOString(),
      version: '2.0.0'
    };
    
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    
    console.log('💾 Admin tarjetas saved to JSON:', {
      path: configPath,
      tarjetasCount: tarjetas.length,
      nombreEmpresa
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error saving admin tarjetas JSON:', error);
    return false;
  }
};

// 🔒 GET - Obtener configuración del portal desde PostgreSQL (PROTEGIDO)
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔍 Portal config access by: ${session.role} (${session.userId}) for business: ${session.businessId}`);
      
      // 🔄 NUEVA LÓGICA: Leer directamente de PostgreSQL como el branding
      const [banners, promociones, recompensas, favoritos] = await Promise.all([
        prisma.portalBanner.findMany({
          where: { businessId: session.businessId },
          orderBy: { orden: 'asc' }
        }),
        prisma.portalPromocion.findMany({
          where: { businessId: session.businessId },
          orderBy: { orden: 'asc' }
        }),
        prisma.portalRecompensa.findMany({
          where: { businessId: session.businessId },
          orderBy: { orden: 'asc' }
        }),
        prisma.portalFavoritoDelDia.findMany({
          where: { businessId: session.businessId },
          orderBy: { date: 'desc' }
        })
      ]);

      // 🎯 CRÍTICO: Leer tarjetas y configuración empresa del JSON file
      const { tarjetas, nombreEmpresa, nivelesConfig } = await getAdminTarjetas(session.businessId);

      // Convertir a formato esperado por el admin panel (mantener compatibilidad)
      const portalConfig = {
        banners: banners.map(b => ({
          id: b.id,
          dia: b.dia || 'viernes', // Usar el día real o valor por defecto
          titulo: b.title,
          descripcion: b.description || '',
          imagenUrl: b.imageUrl || '',
          horaPublicacion: '04:00', // Valor por defecto
          activo: b.active
        })),
        promociones: promociones.map(p => ({
          id: p.id,
          dia: p.dia || 'viernes', // Usar el día real o valor por defecto
          titulo: p.title,
          descripcion: p.description || '',
          descuento: parseInt(p.discount?.replace('%', '') || '0') || 0,
          horaTermino: '04:00', // Valor por defecto
          activo: p.active
        })),
        recompensas: recompensas.map(r => ({
          id: r.id,
          nombre: r.title,
          descripcion: r.description || '',
          puntosRequeridos: r.pointsCost,
          activo: r.active
        })),
        favoritoDelDia: favoritos.map(f => ({
          id: f.id,
          dia: f.dia || 'viernes', // Usar el día real o valor por defecto
          nombre: f.productName,
          descripcion: f.description || '',
          imagenUrl: f.imageUrl || '',
          horaPublicacion: '09:00', // Valor por defecto
          activo: f.active
        })),
        // Campos adicionales para compatibilidad con admin
        promotions: [],
        events: [],
        rewards: [],
        favorites: [],
        // 🎯 TARJETAS Y CONFIGURACIÓN DESDE JSON FILE
        tarjetas: tarjetas,
        nombreEmpresa: nombreEmpresa,
        nivelesConfig: nivelesConfig,
        settings: {
          lastUpdated: new Date().toISOString(),
          version: '2.0.0',
          source: 'hybrid-postgresql-json'
        }
      };

      return NextResponse.json(
        {
          success: true,
          config: portalConfig,
          timestamp: new Date().toISOString(),
          accessedBy: session.userId,
          businessId: session.businessId,
          source: 'postgresql'
        },
        {
          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '-1',
            'Surrogate-Control': 'no-store',
            Vary: '*',
          },
        }
      );
    } catch (error) {
      console.error('❌ Error obteniendo configuración del portal:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }, AuthConfigs.READ_ONLY);
}

// 🔒 PUT - Actualizar configuración del portal directamente en PostgreSQL (PROTEGIDO - ADMIN ONLY)
export async function PUT(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔧 Portal config update by: ${session.role} (${session.userId}) for business: ${session.businessId}`);
      
      const body = await request.json();
      const {
        banners,
        promociones,
        recompensas,
        favoritoDelDia,
        tarjetas,
        nombreEmpresa,
        nivelesConfig
      } = body;

      console.log('📦 Data received for update:', {
        bannersCount: banners?.length || 0,
        promocionesCount: promociones?.length || 0,
        recompensasCount: recompensas?.length || 0,
        favoritosCount: favoritoDelDia?.length || 0,
        tarjetasCount: tarjetas?.length || 0,
        nombreEmpresa: nombreEmpresa,
        hasNivelesConfig: !!nivelesConfig
      });

      // 🔄 NUEVA LÓGICA: Actualizar directamente en PostgreSQL usando transacciones

      // ACTUALIZAR BANNERS
      if (banners && Array.isArray(banners)) {
        console.log('🎨 Updating banners...');
        
        // Eliminar banners existentes
        await prisma.portalBanner.deleteMany({
          where: { businessId: session.businessId }
        });
        
        // Crear nuevos banners
        for (let i = 0; i < banners.length; i++) {
          const banner = banners[i];
          await prisma.portalBanner.create({
            data: {
              businessId: session.businessId,
              title: banner.titulo || `Banner ${i + 1}`,
              description: banner.descripcion || '',
              imageUrl: banner.imagenUrl || null,
              dia: banner.dia || null, // Guardar el día de la semana
              active: banner.activo !== undefined ? banner.activo : true,
              orden: i
            }
          });
        }
        console.log(`✅ Updated ${banners.length} banners`);
      }

      // ACTUALIZAR PROMOCIONES
      if (promociones && Array.isArray(promociones)) {
        console.log('🔥 Updating promociones...');
        
        // Eliminar promociones existentes
        await prisma.portalPromocion.deleteMany({
          where: { businessId: session.businessId }
        });
        
        // Crear nuevas promociones
        for (let i = 0; i < promociones.length; i++) {
          const promo = promociones[i];
          await prisma.portalPromocion.create({
            data: {
              businessId: session.businessId,
              title: promo.titulo || `Promoción ${i + 1}`,
              description: promo.descripcion || '',
              imageUrl: promo.imagenUrl || null,
              discount: promo.descuento ? `${promo.descuento}%` : null,
              dia: promo.dia || null, // Guardar el día de la semana
              active: promo.activo !== undefined ? promo.activo : true,
              orden: i
            }
          });
        }
        console.log(`✅ Updated ${promociones.length} promociones`);
      }

      // ACTUALIZAR RECOMPENSAS
      if (recompensas && Array.isArray(recompensas)) {
        console.log('🎁 Updating recompensas...');
        
        // Eliminar recompensas existentes
        await prisma.portalRecompensa.deleteMany({
          where: { businessId: session.businessId }
        });
        
        // Crear nuevas recompensas
        for (let i = 0; i < recompensas.length; i++) {
          const reward = recompensas[i];
          await prisma.portalRecompensa.create({
            data: {
              businessId: session.businessId,
              title: reward.nombre || `Recompensa ${i + 1}`,
              description: reward.descripcion || '',
              imageUrl: reward.imagenUrl || null,
              pointsCost: reward.puntosRequeridos || 100,
              active: reward.activo !== undefined ? reward.activo : true,
              orden: i
            }
          });
        }
        console.log(`✅ Updated ${recompensas.length} recompensas`);
      }

      // ACTUALIZAR FAVORITOS DEL DÍA
      if (favoritoDelDia && Array.isArray(favoritoDelDia)) {
        console.log('⭐ Updating favoritos del día...');
        
        // Eliminar favoritos existentes
        await prisma.portalFavoritoDelDia.deleteMany({
          where: { businessId: session.businessId }
        });
        
        // Crear nuevos favoritos
        for (let i = 0; i < favoritoDelDia.length; i++) {
          const fav = favoritoDelDia[i];
          await prisma.portalFavoritoDelDia.create({
            data: {
              businessId: session.businessId,
              productName: fav.nombre || `Favorito ${i + 1}`,
              description: fav.descripcion || '',
              imageUrl: fav.imagenUrl || null,
              dia: fav.dia || null, // Guardar el día de la semana
              active: fav.activo !== undefined ? fav.activo : true
            }
          });
        }
        console.log(`✅ Updated ${favoritoDelDia.length} favoritos del día`);
      }

      // 🎯 ACTUALIZAR TARJETAS Y CONFIGURACIÓN EMPRESA EN JSON FILE
      if (tarjetas || nombreEmpresa || nivelesConfig) {
        console.log('💳 Updating tarjetas in JSON file...');
        
        // Leer configuración actual para mantener otros datos
        const currentConfig = await getAdminTarjetas(session.businessId);
        
        const updatedTarjetas = tarjetas || currentConfig.tarjetas;
        const updatedNombreEmpresa = nombreEmpresa || currentConfig.nombreEmpresa;
        const updatedNivelesConfig = nivelesConfig || currentConfig.nivelesConfig;
        
        const saved = await saveAdminTarjetas(
          session.businessId, 
          updatedTarjetas, 
          updatedNombreEmpresa, 
          updatedNivelesConfig
        );
        
        if (saved) {
          console.log(`✅ Updated tarjetas in JSON file for business ${session.businessId}`);
          
          // � SINCRONIZAR CON BASE DE DATOS: Actualizar configuración de tarjetas en PostgreSQL
          try {
            // Convertir configuración de tarjetas al formato de la BD
            if (updatedTarjetas && Array.isArray(updatedTarjetas) && updatedTarjetas.length > 0) {
              const tarjetaConfig = updatedTarjetas[0]; // Tomar la primera configuración de tarjeta
              
              if (tarjetaConfig.niveles && Array.isArray(tarjetaConfig.niveles)) {
                // Convertir niveles a formato de BD
                const levelsConfig = {};
                tarjetaConfig.niveles.forEach((nivel: any) => {
                  if (nivel.nombre) {
                    levelsConfig[nivel.nombre.toLowerCase()] = {
                      minPoints: nivel.puntosRequeridos || 0,
                      minVisits: nivel.visitasRequeridas || 0,
                      benefits: [nivel.beneficio || `Cliente ${nivel.nombre}`],
                      colors: nivel.colores || ['#666666', '#999999']
                    };
                  }
                });

                // Actualizar o crear configuración en PostgreSQL
                await prisma.portalTarjetasConfig.upsert({
                  where: { businessId: session.businessId },
                  update: {
                    levelsConfig: levelsConfig,
                    updatedAt: new Date()
                  },
                  create: {
                    businessId: session.businessId,
                    levelsConfig: levelsConfig,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                });
                
                console.log(`🔄 Synchronized tarjetas config to PostgreSQL for business ${session.businessId}`);
              }
            }
          } catch (syncError) {
            console.error(`❌ Error synchronizing tarjetas to PostgreSQL for business ${session.businessId}:`, syncError);
          }
          
          // �🔔 NOTIFICAR CAMBIOS: Solo al business específico
          await notifyConfigChange(session.businessId);
        } else {
          console.warn(`⚠️ Failed to update tarjetas in JSON file for business ${session.businessId}`);
        }
      }

      console.log(`✅ Portal config updated successfully (PostgreSQL + JSON) by ${session.role} for business ${session.businessId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Configuración actualizada en PostgreSQL y JSON file',
        updatedBy: session.userId,
        businessId: session.businessId,
        timestamp: new Date().toISOString(),
        source: 'hybrid-postgresql-json'
      });
    } catch (error) {
      console.error('❌ Error actualizando configuración del portal:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }, AuthConfigs.ADMIN_ONLY);
}
