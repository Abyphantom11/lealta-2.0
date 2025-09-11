'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FavoritoDelDia {
  id: string;
  nombre?: string;
  descripcion?: string;
  imagenUrl: string;
  activo: boolean;
  dia?: string;
  horaPublicacion?: string;
}

// Eliminamos esta función ya que ahora manejamos la lógica directamente en fetchFavorito y forceRefresh

// Eliminamos esta función ya que ahora manejamos la lógica directamente en los métodos fetchFavorito y forceRefresh

export default function FavoritoDelDiaSection() {
  const [favorito, setFavorito] = useState<FavoritoDelDia | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Adición de un estado para detectar cambios en el modo simulación
  const [simulatedDay, setSimulatedDay] = useState<string | null>(null);

  useEffect(() => {
    // Esta función revisa si hay un día simulado configurado
    const checkSimulationMode = () => {
      const currentSimDay =
        typeof window !== 'undefined' ? (window as any).portalPreviewDay : null;
      console.log('🔍 FavoritoDelDiaSection checkSimulationMode:', {
        currentSimDay,
        simulatedDay,
        changed: currentSimDay !== simulatedDay,
      });

      if (currentSimDay !== simulatedDay) {
        setSimulatedDay(currentSimDay);
        console.log(
          '🔄 FavoritoDelDiaSection: Cambio en simulación detectado -',
          currentSimDay || 'modo normal'
        );
        return true;
      }
      return false;
    };

    // Función simplificada para cargar favoritos directamente sin complicaciones
    const fetchFavorito = async (force = false) => {
      console.log(
        '⭐ FavoritoDelDiaSection - fetchFavorito - Iniciando solicitud, force:',
        force
      );
      try {
        // Verificar simulación primero
        const simulationChanged = checkSimulationMode();
        console.log(
          '⭐ FavoritoDelDiaSection - fetchFavorito - simulationChanged:',
          simulationChanged
        );

        if (!force && !simulationChanged) return;

        // Generar un timestamp único para prevenir caché agresivo
        const timestamp = Date.now() + Math.random();
        console.log(
          '⭐ FavoritoDelDiaSection - fetchFavorito - haciendo fetch con timestamp:',
          timestamp
        );

        // Hacemos un fetch directo con opciones para evitar cualquier caché
        const response = await fetch(
          `/api/admin/portal-config?businessId=default&t=${timestamp}`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
              Expires: '0',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Verificar estructura de los datos
          console.log('🎯 Cliente - Datos completos recibidos:', {
            success: data.success,
            configExiste: Boolean(data.config),
            tipoConfig: typeof data.config,
            favoritoDelDiaTipo: typeof data.config?.favoritoDelDia,
            favoritoDelDiaEsArray: Array.isArray(data.config?.favoritoDelDia),
            favoritoDelDiaLength: Array.isArray(data.config?.favoritoDelDia)
              ? data.config.favoritoDelDia.length
              : 'n/a',
            favoritoDelDia: data.config?.favoritoDelDia || 'no hay datos',
          });

          // Verificar el día actual o simulado
          const diasSemana = [
            'domingo',
            'lunes',
            'martes',
            'miercoles',
            'jueves',
            'viernes',
            'sabado',
          ];
          const diaHoy = diasSemana[new Date().getDay()];
          const diaSimulado =
            typeof window !== 'undefined'
              ? (window as any).portalPreviewDay
              : null;
          const diaParaMostrar = diaSimulado || diaHoy;

          console.log('🔍 Cliente - Día para mostrar:', {
            diaHoy,
            diaSimulado,
            diaParaMostrar,
            indiceHoy: new Date().getDay(),
          });

          // ENFOQUE SIMPLIFICADO: Buscar directamente el favorito para el día actual/simulado
          if (
            Array.isArray(data.config?.favoritoDelDia) &&
            data.config.favoritoDelDia.length > 0
          ) {
            // Buscar favorito que coincida con el día
            const favoritos = data.config.favoritoDelDia;

            // Listar todos los favoritos disponibles
            console.log(
              '📋 Favoritos disponibles:',
              favoritos.map((f: any) => ({
                id: f.id,
                dia: f.dia,
                nombre: f.nombre,
                activo: f.activo,
                coincideDia: f.dia === diaParaMostrar,
              }))
            );

            // Buscar el favorito del día actual/simulado
            const favoritoHoy = favoritos.find((f: any) => {
              const coincideDia = f.dia === diaParaMostrar;
              const tieneImagen = Boolean(
                f.imagenUrl && f.imagenUrl.trim() !== ''
              );
              const estaActivo = diaSimulado ? true : Boolean(f.activo); // En simulación ignoramos si está activo

              return coincideDia && tieneImagen && estaActivo;
            });

            if (favoritoHoy) {
              console.log(
                '✅ Cliente - Favorito encontrado directamente:',
                favoritoHoy
              );
              setFavorito(favoritoHoy);
            } else {
              console.log(
                '🚫 Cliente - No se encontró favorito para el día',
                diaParaMostrar
              );
              setFavorito(null);
            }
          } else {
            console.log('⚠️ Cliente - No hay array de favoritos o está vacío');
            setFavorito(null);
          }
        } else {
          console.error('❌ Error en respuesta API:', response.status);
        }
      } catch (error) {
        console.error('Error loading favorito:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Función para forzar la limpieza de caché y recargar datos - simplificada
    const forceRefresh = async () => {
      console.log('🔄 FavoritoDelDia: Forzando actualización completa');
      setIsLoading(true);
      setFavorito(null);

      // Usar un timestamp aleatorio para evitar caché
      const timestamp = Date.now() + Math.random();

      try {
        // Llamada directa con opciones anti-caché
        const response = await fetch(
          `/api/admin/portal-config?forceRefresh=true&t=${timestamp}`,
          {
            cache: 'no-store',
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
              Expires: '0',
            },
          }
        );

        if (response.ok) {
          // Procesar directamente la respuesta
          const data = await response.json();

          // Verificar que tengamos datos y son un array
          if (
            !data ||
            !data.config ||
            !Array.isArray(data.config.favoritoDelDia)
          ) {
            console.log(
              '⚠️ FavoritoDelDia - REFRESH FORZADO - Datos inválidos:',
              data?.config?.favoritoDelDia
            );
            setFavorito(null);
            setIsLoading(false);
            return;
          }

          console.log(
            '� FavoritoDelDia - REFRESH FORZADO - Favoritos recibidos:',
            data.config.favoritoDelDia.map((f: any) => ({
              id: f.id,
              dia: f.dia,
              nombre: f.nombre,
            }))
          );

          // Buscar el favorito para el día actual o simulado directamente
          const diasSemana = [
            'domingo',
            'lunes',
            'martes',
            'miercoles',
            'jueves',
            'viernes',
            'sabado',
          ];
          const diaHoy = diasSemana[new Date().getDay()];
          const diaSimulado =
            typeof window !== 'undefined'
              ? (window as any).portalPreviewDay
              : null;
          const diaParaMostrar = diaSimulado || diaHoy;

          console.log(
            '🔍 FavoritoDelDia - Buscando favorito para día:',
            diaParaMostrar
          );

          // Buscar favorito que coincida con el día
          const favoritoEncontrado = data.config.favoritoDelDia.find(
            (f: any) => {
              // Verificaciones básicas
              if (!f.dia || !f.imagenUrl) return false;

              // Coincidencia de día (directa o normalizada)
              const coincideDia =
                f.dia.trim().toLowerCase() ===
                diaParaMostrar.trim().toLowerCase();

              // En simulación ignoramos si está activo
              const estaActivo = diaSimulado ? true : Boolean(f.activo);

              return coincideDia && estaActivo;
            }
          );

          if (favoritoEncontrado) {
            console.log(
              '✅ FavoritoDelDia - REFRESH FORZADO - Favorito encontrado:',
              favoritoEncontrado
            );
            setFavorito(favoritoEncontrado);
          } else {
            console.log(
              '❌ FavoritoDelDia - REFRESH FORZADO - No se encontró favorito para',
              diaParaMostrar
            );
            setFavorito(null);
          }
        } else {
          console.error('❌ Error en respuesta API:', response.status);
        }
      } catch (error) {
        console.error('❌ Error en refresh forzado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Mostrar mensajes de inicio
    console.log('🚀 FavoritoDelDiaSection: Iniciando componente...');

    // Cargar inmediatamente con refresh forzado
    forceRefresh();

    // Polling para actualización en tiempo real cada 3 segundos
    const interval = setInterval(() => {
      console.log('🔄 FavoritoDelDiaSection: Polling periódico');
      fetchFavorito(true); // Siempre forzar para debugging
    }, 3000);

    // Escuchar eventos de simulación de día
    const handleSimulationChange = () => {
      console.log('🔄 Detectado cambio en la simulación del día');
      // Usar refresh forzado en lugar de fetchFavorito normal
      forceRefresh();
    };

    // Listener para escuchar cambios en el día simulado
    let additionalInterval: NodeJS.Timeout | null = null;

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'portalPreviewDayChanged',
        handleSimulationChange
      );

      // También crear un listener manual para la variable global
      const checkForChanges = () => {
        const changed = checkSimulationMode();
        if (changed) {
          console.log(
            '🔄 Cambio detectado en modo simulación - forzando refresh'
          );
          forceRefresh();
        }
      };
      additionalInterval = setInterval(checkForChanges, 1000);
    }

    return () => {
      clearInterval(interval);
      if (additionalInterval) {
        clearInterval(additionalInterval);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'portalPreviewDayChanged',
          handleSimulationChange
        );
      }
    };
  }, [simulatedDay]);

  // Siempre renderizar algo para el debugging
  console.log('🖼️ FavoritoDelDiaSection renderizando con:', {
    isLoading,
    tieneFavorito: Boolean(favorito),
    favorito,
  });

  if (isLoading) {
    return (
      <div className="mx-4 mb-6 p-4 border border-dashed border-yellow-400 bg-yellow-500/10 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-2">
          Cargando favorito del día...
        </h3>
        <p className="text-sm text-white/70">Espere un momento</p>
      </div>
    );
  }

  if (!favorito) {
    // Para debug: mostrar un mensaje visible cuando no hay favorito
    const diasSemana = [
      'domingo',
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
    ];
    const diaHoy = diasSemana[new Date().getDay()];
    const diaSimulado =
      typeof window !== 'undefined' ? (window as any).portalPreviewDay : null;

    return (
      <div className="mx-4 mb-6 p-4 border border-dashed border-red-400 bg-red-500/10 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-2">
          No hay favorito para mostrar
        </h3>
        <p className="text-sm text-white/70">
          Día actual: {diaHoy}
          <br />
          Día simulado: {diaSimulado || 'ninguno'}
          <br />
          Verificar configuración en admin
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-6">
      {/* Mostrar el nombre como encabezado separado si existe */}
      {favorito.nombre && (
        <h3 className="text-lg font-semibold text-white mb-4">
          {favorito.nombre}
        </h3>
      )}
      {/* Si no hay nombre, usar un título genérico */}
      {!favorito.nombre && (
        <h3 className="text-lg font-semibold text-white mb-4">
          Favorito del día
        </h3>
      )}
      <motion.div
        className="bg-dark-800 rounded-xl overflow-hidden relative"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={favorito.imagenUrl}
          alt={favorito.nombre || 'Favorito del día'}
          className="w-full h-48 object-cover rounded-xl"
        />
        {/* Solo mostrar la descripción si existe y no es igual al título */}
        {favorito.descripcion && favorito.descripcion !== favorito.nombre && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3">
            <p className="text-sm text-white">{favorito.descripcion}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
