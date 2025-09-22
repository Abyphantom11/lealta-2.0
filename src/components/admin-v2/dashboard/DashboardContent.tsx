'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Calendar,
  TrendingUp,
  Star,
  Gift,
  Save,
  Search,
  User,
  X,
  AlertCircle,
} from 'lucide-react';

// Tipos
interface VisitasData {
  visitasHoy: number;
  visitasSemana: number;
  visitasMes: number;
  tendencia: 'estable' | 'subiendo' | 'bajando';
}

interface ConfiguracionPuntos {
  puntosPorDolar: number;
  bonusPorRegistro: number;
  puntosVisita?: number; // Agregamos puntos por visita
  limites?: {
    maxPuntosPorDolar: number;
    maxBonusRegistro: number;
  };
}

interface Recompensa {
  id: string;
  nombre: string;
  puntos: number;
  stock?: number;
  activa: boolean;
  tipo: 'descuento' | 'producto';
  descripcion: string;
}

type NotificationType = 'success' | 'error' | 'info';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  cedula?: string;
  telefono?: string;
  puntos: number;
  totalGastado: number;
  totalVisitas: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DashboardContentProps {
  // Props opcionales para compatibilidad futura
}

/**
 * Componente principal del Dashboard - Replica de la segunda imagen
 */
const DashboardContent: React.FC<DashboardContentProps> = () => {
  // Configuración de niveles
  // const nivelesConfig = {
  //   Bronce: {
  //     condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 },
  //   },
  //   Plata: {
  //     condiciones: {
  //       puntosMinimos: 100,
  //       gastosMinimos: 500,
  //       visitasMinimas: 5,
  //     },
  //   },
  //   Oro: {
  //     condiciones: {
  //       puntosMinimos: 500,
  //       gastosMinimos: 1500,
  //       visitasMinimas: 10,
  //     },
  //   },
  //   Diamante: {
  //     condiciones: {
  //       puntosMinimos: 5000,
  //       gastosMinimos: 8000,
  //       visitasMinimas: 50,
  //     },
  //   },
  //   Platino: {
  //     condiciones: {
  //       puntosMinimos: 3000,
  //       gastosMinimos: 5000,
  //       visitasMinimas: 30,
  //     },
  //   },
  // };

  // Función para calcular nivel automático del cliente
  // const calculateClientLevel = (client: Cliente) => {
  //   // ✅ CORRECCIÓN: Usar puntos para determinar nivel
  //   const puntosAcumulados = client.puntos || 0;
  //   const visitas = client.totalVisitas || 0;

  //   // ✅ CORRECCIÓN: Usar configuración real del portal en lugar de valores hardcodeados
  //   if (portalConfig?.tarjetas) {
  //     const tarjetasActivas = portalConfig.tarjetas.filter((t: any) => t.activo);
  //     if (tarjetasActivas.length > 0) {
  //       // Ordenar tarjetas por requisitos de puntos (de mayor a menor)
  //       const tarjetasOrdenadas = tarjetasActivas
  //         .slice()
  //         .sort((a: any, b: any) => (b.condiciones?.puntosMinimos || 0) - (a.condiciones?.puntosMinimos || 0));

  //       // Encontrar el nivel MÁS ALTO que cumple los requisitos (lógica OR)
  //       for (const tarjeta of tarjetasOrdenadas) {
  //         const puntosRequeridos = tarjeta.condiciones?.puntosMinimos || 0;
  //         const visitasRequeridas = tarjeta.condiciones?.visitasMinimas || 0;

  //         const cumplePuntos = puntosAcumulados >= puntosRequeridos;
  //         const cumpleVisitas = visitas >= visitasRequeridas;

  //         // Lógica OR: cumple si tiene puntos suficientes O visitas suficientes
  //         if (cumplePuntos || cumpleVisitas) {
  //           return tarjeta.nivel;
  //         }
  //       }
  //     }
  //   }

  //   // Fallback a la lógica anterior si no hay configuración del portal
  //   const niveles = ['Diamante', 'Platino', 'Oro', 'Plata', 'Bronce'];
  //   for (const nivel of niveles) {
  //     const condiciones = nivelesConfig[nivel as keyof typeof nivelesConfig].condiciones;
  //     if (
  //       puntosAcumulados >= condiciones.puntosMinimos &&
  //       visitas >= condiciones.visitasMinimas
  //     ) {
  //       return nivel;
  //     }
  //   }
  //   return 'Bronce'; // Nivel por defecto
  // };

  // Función para obtener colores de niveles
  // const getNivelColor = (nivel: string) => {
  //   const colores = {
  //     Bronce: 'from-amber-600 to-amber-700',
  //     Plata: 'from-gray-400 to-gray-500',
  //     Oro: 'from-yellow-400 to-yellow-500',
  //     Diamante: 'from-blue-400 to-blue-500',
  //     Platino: 'from-gray-300 to-gray-400',
  //   };
  //   return colores[nivel as keyof typeof colores] || 'from-gray-400 to-gray-500';
  // };

  // Estados
  const [visitas, setVisitas] = useState<VisitasData>({
    visitasHoy: 0,
    visitasSemana: 0,
    visitasMes: 0,
    tendencia: 'estable',
  });

  const [configuracionPuntos, setConfiguracionPuntos] =
    useState<ConfiguracionPuntos>({
      puntosPorDolar: 4, // Valor por defecto que coincide con el config actual
      bonusPorRegistro: 400, // Valor por defecto que coincide con el config actual
      puntosVisita: 5,
      limites: {
        maxPuntosPorDolar: 10,
        maxBonusRegistro: 1000,
      },
    });

  // ✅ NUEVO: Estado para configuración del portal (niveles de tarjetas)
  // const [portalConfig, setPortalConfig] = useState<any>(null);

  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Estados temporales para edición libre
  const [puntosPorDolarTemp, setPuntosPorDolarTemp] = useState<string>('4');
  const [bonusPorRegistroTemp, setBonusPorRegistroTemp] =
    useState<string>('400');

  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);

  // Estados para el modal de canje
  const [modalCanjeAbierto, setModalCanjeAbierto] = useState(false);
  const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<Recompensa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Cliente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [procesandoCanje, setProcesandoCanje] = useState(false);

  // Estados para notificaciones
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    visible: boolean;
  }>({
    type: 'info',
    message: '',
    visible: false
  });

  // Función para mostrar notificación
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Función para cargar recompensas
  const cargarRecompensas = useCallback(async () => {
    try {
      // Usar la misma API que el Portal Cliente
      const configResponse = await fetch('/api/admin/portal-config?businessId=default', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!configResponse.ok) {
        console.error('Error al cargar configuración de portal:', configResponse.status);
        return;
      }
      
      const data = await configResponse.json();
      const config = data.config || data; // Manejar diferentes estructuras de respuesta
      console.log('Config cargado desde API:', config); // Debug
      
      if (config.recompensas && Array.isArray(config.recompensas)) {
        console.log('Recompensas encontradas:', config.recompensas); // Debug
        // Filtrar solo recompensas activas y ordenar de menor a mayor puntos
        const recompensasActivas = config.recompensas
          .filter((r: any) => r.activo === true)
          .map((r: any) => ({
            id: r.id,
            nombre: r.nombre,
            puntos: r.puntosRequeridos,
            activa: r.activo,
            tipo: (r.categoria === 'descuento' || r.tipo === 'descuento' || r.nombre?.toLowerCase().includes('descuento')) ? 'descuento' : 'producto',
            descripcion: r.descripcion,
            stock: r.stock
          }))
          .sort((a: Recompensa, b: Recompensa) => (a.puntos || 0) - (b.puntos || 0));
        
        console.log('Recompensas procesadas:', recompensasActivas); // Debug
        setRecompensas(recompensasActivas);
        // Removed notification for silent updates
      } else {
        console.log('No se encontraron recompensas en config'); // Debug
        setRecompensas([]);
      }
    } catch (error) {
      console.error('Error cargando recompensas:', error);
      setRecompensas([]);
      // Only show error notifications
      showNotification('error', 'Error al cargar recompensas');
    }
  }, []);

  // Función helper para estilos de notificación
  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500 text-green-100';
      case 'error':
        return 'bg-red-900/90 border-red-500 text-red-100';
      default:
        return 'bg-blue-900/90 border-blue-500 text-blue-100';
    }
  };

  // Función para buscar clientes
  const searchClients = async (term: string) => {
    if (term.length < 2) {
      setClients([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/clients/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm: term }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClients(data.clients || []);
        } else {
          setClients([]);
        }
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar el canje de recompensa
  const procesarCanje = async () => {
    if (!selectedClient || !recompensaSeleccionada) return;

    // Verificar si el cliente tiene suficientes puntos
    if (selectedClient.puntos < recompensaSeleccionada.puntos) {
      showNotification('error', `El cliente no tiene suficientes puntos. Necesita ${recompensaSeleccionada.puntos} puntos pero solo tiene ${selectedClient.puntos}.`);
      return;
    }

    setProcesandoCanje(true);
    try {
      const response = await fetch('/api/admin/canjear-recompensa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: selectedClient.id,
          recompensaId: recompensaSeleccionada.id,
          recompensaNombre: recompensaSeleccionada.nombre,
          puntosDescontados: recompensaSeleccionada.puntos,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showNotification('success', `¡Canje exitoso! Se descontaron ${recompensaSeleccionada.puntos} puntos de ${selectedClient.nombre}. Puntos restantes: ${data.data.puntosRestantes}`);
          
          // Actualizar puntos del cliente seleccionado
          setSelectedClient(prev => prev ? { ...prev, puntos: data.data.puntosRestantes } : null);
          
          // Cerrar modal y limpiar estados
          setTimeout(() => {
            setModalCanjeAbierto(false);
            setRecompensaSeleccionada(null);
            setSelectedClient(null);
            setSearchTerm('');
            setClients([]);
          }, 2000);
        } else {
          showNotification('error', `Error: ${data.message || 'No se pudo procesar el canje'}`);
        }
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.message || 'Error de conexión al procesar el canje');
      }
    } catch (error) {
      console.error('Error procesando canje:', error);
      showNotification('error', 'Error interno al procesar el canje');
    } finally {
      setProcesandoCanje(false);
    }
  };

  // Función para abrir modal de canje
  const abrirModalCanje = (recompensa: Recompensa) => {
    setRecompensaSeleccionada(recompensa);
    setModalCanjeAbierto(true);
    setSelectedClient(null);
    setSearchTerm('');
    setClients([]);
  };

  // Función para cerrar modal de canje
  const cerrarModalCanje = () => {
    setModalCanjeAbierto(false);
    setRecompensaSeleccionada(null);
    setSelectedClient(null);
    setSearchTerm('');
    setClients([]);
  };

  // 📊 Cargar datos reales de visitas y recompensas
  useEffect(() => {
    const cargarDatosVisitas = async () => {
      try {
        console.log('🔄 Cargando datos de visitas para admin dashboard');
        
        const response = await fetch('/api/admin/visitas', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 DATOS DE VISITAS RECIBIDOS:', data);
          if (data.success) {
            setVisitas({
              visitasHoy: data.data.visitasHoy,
              visitasSemana: data.data.visitasSemana,
              visitasMes: data.data.visitasMes,
              tendencia: data.data.tendencia,
            });
            console.log('✅ VISITAS ACTUALIZADAS:', {
              hoy: data.data.visitasHoy,
              semana: data.data.visitasSemana,
              mes: data.data.visitasMes
            });
          }
        } else {
          console.error('❌ Error en respuesta de visitas:', response.status);
        }
      } catch (error) {
        console.error('❌ Error cargando datos de visitas:', error);
        // Mantener datos por defecto en caso de error
      }
    };

    const cargarConfiguracionPuntos = async () => {
      try {
        // Primero intentar cargar desde la API
        const response = await fetch('/api/admin/puntos');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const nuevaConfig = {
              puntosPorDolar: data.data.puntosPorDolar || 2,
              bonusPorRegistro: data.data.bonusPorRegistro || 100,
              puntosVisita: 5, // Valor por defecto para visitas
              limites: {
                maxPuntosPorDolar: data.data.limites?.maxPuntosPorDolar || 10,
                maxBonusRegistro: data.data.limites?.maxBonusRegistro || 1000,
              },
            };
            setConfiguracionPuntos(nuevaConfig);
            // Sincronizar estados temporales
            setPuntosPorDolarTemp(nuevaConfig.puntosPorDolar.toString());
            setBonusPorRegistroTemp(nuevaConfig.bonusPorRegistro.toString());
            return; // Éxito, no necesitamos fallback
          }
        }

        // Fallback: cargar directamente desde portal-config.json
        console.log('API no disponible, cargando desde portal-config.json...');
        const configResponse = await fetch('/portal-config.json');
        const config = await configResponse.json();

        // ✅ NUEVO: Cargar configuración completa del portal (incluye tarjetas)
        console.log('📊 Cargando configuración del portal:', config);
        // setPortalConfig(config);

        if (config.configuracionPuntos) {
          const nuevaConfig = {
            puntosPorDolar: config.configuracionPuntos.puntosPorDolar || 2,
            bonusPorRegistro:
              config.configuracionPuntos.bonusPorRegistro || 100,
            puntosVisita: 5, // Valor por defecto para visitas
            limites: {
              maxPuntosPorDolar:
                config.configuracionPuntos.limites?.maxPuntosPorDolar || 10,
              maxBonusRegistro:
                config.configuracionPuntos.limites?.maxBonusRegistro || 1000,
            },
          };
          setConfiguracionPuntos(nuevaConfig);
          // Sincronizar estados temporales
          setPuntosPorDolarTemp(nuevaConfig.puntosPorDolar.toString());
          setBonusPorRegistroTemp(nuevaConfig.bonusPorRegistro.toString());
        }
      } catch (error) {
        console.error('Error cargando configuración de puntos:', error);
        // Mantener valores por defecto en caso de error total
      }
    };

    cargarDatosVisitas();
    cargarConfiguracionPuntos();
    cargarRecompensas();

    // Actualizar cada 30 segundos para datos en tiempo real
    const interval = setInterval(() => {
      cargarDatosVisitas();
      cargarRecompensas(); // También actualizar recompensas
    }, 30000);

    return () => clearInterval(interval);
  }, [cargarRecompensas]);

  // UseEffect para búsqueda de clientes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClients(searchTerm);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const guardarConfiguracion = async () => {
    setGuardandoConfig(true);
    setMensajeGuardado(null);

    try {
      const response = await fetch('/api/admin/puntos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puntosPorDolar: configuracionPuntos.puntosPorDolar,
          bonusPorRegistro: configuracionPuntos.bonusPorRegistro,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMensajeGuardado('✅ Configuración guardada exitosamente');
        console.log('✅ Configuración guardada exitosamente');
      } else {
        setMensajeGuardado('❌ Error guardando configuración');
        console.error('❌ Error guardando configuración:', data.error);
      }
    } catch (error) {
      setMensajeGuardado('❌ Error de conexión');
      console.error('❌ Error de red guardando configuración:', error);
    } finally {
      setGuardandoConfig(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensajeGuardado(null), 3000);
    }
  };

  // 🔄 Función para guardar automáticamente con debounce
  const guardarConfiguracionConDebounce = (
    configuracion: ConfiguracionPuntos
  ) => {
    // Usar setTimeout para el debounce simple
    setTimeout(() => {
      fetch('/api/admin/puntos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puntosPorDolar: configuracion.puntosPorDolar,
          bonusPorRegistro: configuracion.bonusPorRegistro,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('✅ Configuración guardada automáticamente');
          } else {
            console.error('❌ Error guardando configuración:', data.error);
          }
        })
        .catch(error => {
          console.error('❌ Error de red:', error);
        });
    }, 1000);
  };

  // 🔧 Funciones para manejar cambios con validación diferida
  const manejarCambioPuntosPorDolar = (valor: string) => {
    setPuntosPorDolarTemp(valor);
  };

  const manejarCambioBonusPorRegistro = (valor: string) => {
    setBonusPorRegistroTemp(valor);
  };

  const aplicarValidacionPuntosPorDolar = () => {
    const numeroValidado = Math.min(
      10,
      Math.max(1, parseInt(puntosPorDolarTemp) || 1)
    );
    const nuevaConfiguracion = {
      ...configuracionPuntos,
      puntosPorDolar: numeroValidado,
    };
    setConfiguracionPuntos(nuevaConfiguracion);
    setPuntosPorDolarTemp(numeroValidado.toString());
    guardarConfiguracionConDebounce(nuevaConfiguracion);
  };

  const aplicarValidacionBonusPorRegistro = () => {
    const numeroValidado = Math.min(
      1000,
      Math.max(1, parseInt(bonusPorRegistroTemp) || 1)
    );
    const nuevaConfiguracion = {
      ...configuracionPuntos,
      bonusPorRegistro: numeroValidado,
    };
    setConfiguracionPuntos(nuevaConfiguracion);
    setBonusPorRegistroTemp(numeroValidado.toString());
    guardarConfiguracionConDebounce(nuevaConfiguracion);
  };

  const getTrendIcon = () => {
    switch (visitas.tendencia) {
      case 'subiendo':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bajando':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-blue-400 rounded-full" />;
    }
  };

  // 🔍 DEBUG: Log datos antes del render
  console.log('🎨 RENDERIZANDO DASHBOARD CON DATOS:', {
    visitasHoy: visitas.visitasHoy,
    visitasSemana: visitas.visitasSemana,
    visitasMes: visitas.visitasMes,
    tendencia: visitas.tendencia,
    totalRecompensas: recompensas.length
  });

  return (
    <div className="space-y-6">
      
      {/* Métricas de Visitas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visitas Hoy */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className="text-blue-400 text-sm">Estable</span>
            </div>
          </div>
          <div>
            <h3 className="text-blue-400 text-sm font-medium mb-1">
              Visitas Hoy
            </h3>
            <p className="text-4xl font-bold text-white mb-2">
              {visitas.visitasHoy}
            </p>
            <p className="text-dark-400 text-sm">→ Estable</p>
          </div>
        </div>

        {/* Visitas Esta Semana */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-purple-400 text-sm font-medium mb-1">
              Visitas Esta Semana
            </h3>
            <p className="text-4xl font-bold text-white mb-2">
              {visitas.visitasSemana}
            </p>
            <p className="text-dark-400 text-sm">Total de la semana</p>
          </div>
        </div>

        {/* Visitas Este Mes */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-green-400 text-sm font-medium mb-1">
              Visitas Este Mes
            </h3>
            <p className="text-4xl font-bold text-white mb-2">
              {visitas.visitasMes}
            </p>
            <p className="text-dark-400 text-sm">Total del mes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Puntos */}
        <div className="premium-card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Configuración de Puntos
            </h3>
          </div>

          <div className="space-y-4">
            {/* Puntos por dólar gastado */}
            <div>
              <label
                htmlFor="puntos-dolar"
                className="block text-dark-300 text-sm font-medium mb-2"
              >
                Puntos por dólar gastado
              </label>
              <input
                id="puntos-dolar"
                type="number"
                min="1"
                max="10"
                value={puntosPorDolarTemp}
                onChange={e => manejarCambioPuntosPorDolar(e.target.value)}
                onBlur={aplicarValidacionPuntosPorDolar}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    aplicarValidacionPuntosPorDolar();
                  }
                }}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-lg font-semibold"
              />
              <p className="text-dark-400 text-xs mt-1">
                Ej: 2 = 2 puntos por cada $1 gastado (máximo 10)
              </p>
            </div>

            {/* Bonus por registro */}
            <div>
              <label
                htmlFor="bonus-registro"
                className="block text-dark-300 text-sm font-medium mb-2"
              >
                Bonus por registro
              </label>
              <input
                id="bonus-registro"
                type="number"
                min="1"
                max="1000"
                value={bonusPorRegistroTemp}
                onChange={e => manejarCambioBonusPorRegistro(e.target.value)}
                onBlur={aplicarValidacionBonusPorRegistro}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    aplicarValidacionBonusPorRegistro();
                  }
                }}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-lg font-semibold"
              />
              <p className="text-dark-400 text-xs mt-1">
                Puntos que recibe el cliente al registrarse (máximo 1,000)
              </p>
            </div>

            <button
              onClick={guardarConfiguracion}
              disabled={guardandoConfig}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                guardandoConfig
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Save className="w-4 h-4 text-white" />
              <span className="text-white font-medium">
                {guardandoConfig ? 'Guardando...' : 'Guardar Configuración'}
              </span>
            </button>

            {/* Mensaje de feedback */}
            {mensajeGuardado && (
              <div
                className={`text-center text-sm mt-2 font-medium ${
                  mensajeGuardado.includes('✅')
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {mensajeGuardado}
              </div>
            )}
          </div>
        </div>

        {/* Recompensas Activas */}
        <div className="premium-card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Recompensas Activas
            </h3>
          </div>

          <div className="space-y-4">
            {recompensas.length === 0 ? (
              <div className="text-center py-8 bg-dark-700/30 rounded-lg border-2 border-dashed border-dark-600">
                <Gift className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                <p className="text-dark-400">No hay recompensas activas</p>
                <p className="text-dark-500 text-sm">
                  Ve a Portal Cliente → Recompensas para crear y activar recompensas
                </p>
              </div>
            ) : (
              recompensas.map(recompensa => (
                <div
                  key={recompensa.id}
                  className="bg-dark-700/50 border border-dark-600/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-white font-medium">
                        {recompensa.nombre}
                      </h4>
                      <span className="text-yellow-400 text-sm font-medium">
                        {recompensa.tipo === 'descuento'
                          ? 'descuento'
                          : 'producto'}
                      </span>
                    </div>
                    <span className="text-green-400 text-sm font-medium">
                      Activa
                    </span>
                  </div>

                  <p className="text-dark-300 text-sm mb-2">
                    {recompensa.descripcion}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-yellow-400 font-bold text-lg">
                        {recompensa.puntos} puntos
                      </span>
                      {recompensa.stock && (
                        <span className="text-dark-400 text-sm">
                          Stock: {recompensa.stock}
                        </span>
                      )}
                    </div>
                    <button
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                      onClick={() => abrirModalCanje(recompensa)}
                    >
                      Canjear
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Canje */}
      {modalCanjeAbierto && recompensaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              {/* Header del Modal */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Gift className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Canjear Recompensa
                  </h3>
                </div>
                <button
                  onClick={cerrarModalCanje}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Información de la Recompensa */}
              <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-white">{recompensaSeleccionada.nombre}</h4>
                </div>
                <p className="text-gray-300 text-sm mb-2">{recompensaSeleccionada.descripcion}</p>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{recompensaSeleccionada.puntos} puntos</span>
                </div>
              </div>

              {/* Buscador de Cliente */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="client-search" className="block text-sm font-medium text-gray-300 mb-2">
                    Buscar Cliente
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="client-search"
                      type="text"
                      placeholder="Buscar por nombre, email, teléfono o cédula..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Lista de Clientes */}
                <div className="border border-gray-600 rounded-lg max-h-64 overflow-y-auto bg-gray-800">
                  {loading && (
                    <div className="p-4 text-center text-gray-300">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                        Buscando clientes...
                      </div>
                    </div>
                  )}

                  {!loading && clients.length === 0 && searchTerm.length >= 2 && (
                    <div className="p-4 text-center text-gray-300">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      No se encontraron clientes
                    </div>
                  )}

                  {!loading && clients.length === 0 && searchTerm.length < 2 && (
                    <div className="p-4 text-center text-gray-300">
                      Escribe al menos 2 caracteres para buscar
                    </div>
                  )}

                  {!loading && clients.length > 0 && (
                    <div className="divide-y divide-gray-600">
                      {clients.map((client) => {
                        // const nivelAutomatico = calculateClientLevel(client);
                        
                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className={`w-full text-left p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                              selectedClient?.id === client.id ? 'bg-blue-900/30 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <User className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {client.nombre}
                                </p>
                                <p className="text-sm text-gray-300 truncate">
                                  {client.email}
                                </p>
                                <p className="text-xs text-blue-400 truncate">
                                  Cédula: {client.cedula || 'No registrada'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-yellow-400 font-medium">
                                    {client.puntos} puntos
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente Seleccionado y Botón de Canje */}
              {selectedClient && (
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-white mb-3">Cliente Seleccionado</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300"><span className="font-medium text-white">Nombre:</span> {selectedClient.nombre}</p>
                      <p className="text-sm text-gray-300"><span className="font-medium text-white">Puntos disponibles:</span> <span className="text-yellow-400 font-medium">{selectedClient.puntos}</span></p>
                    </div>
                    
                    {/* Verificación de puntos */}
                    {selectedClient.puntos < recompensaSeleccionada.puntos && (
                      <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 text-sm font-medium">
                            Puntos insuficientes
                          </span>
                        </div>
                        <p className="text-red-300 text-sm mt-1">
                          El cliente necesita {recompensaSeleccionada.puntos - selectedClient.puntos} puntos adicionales.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={cerrarModalCanje}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={procesarCanje}
                      disabled={selectedClient.puntos < recompensaSeleccionada.puntos || procesandoCanje}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {procesandoCanje ? 'Procesando...' : 'Confirmar Canje'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notificación del sistema */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${
          getNotificationStyles(notification.type)
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' && <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">✓</div>}
            {notification.type === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
            {notification.type === 'info' && <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">i</div>}
            <div className="flex-1">
              <p className="font-medium text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className="text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardContent;
