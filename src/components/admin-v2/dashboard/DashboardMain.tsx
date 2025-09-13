'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Calendar, 
  TrendingUp,
  Star,
  Gift,
  Save,
  Edit3,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface VisitasData {
  visitasHoy: number;
  visitasSemana: number;
  visitasMes: number;
  tendencia: 'estable' | 'subiendo' | 'bajando';
}

interface ConfiguracionPuntos {
  puntosPorvPeso: number;
  bonusRegistro: number;
  puntosVisita: number;
}

interface Recompensa {
  id: string;
  nombre: string;
  puntos: number;
  stock?: number;
  activa: boolean;
  tipo: 'descuento' | 'producto';
}

/**
 * Dashboard principal que replica el diseño de la imagen
 */
const DashboardMain: React.FC = () => {
  // Estados
  const [visitas, setVisitas] = useState<VisitasData>({
    visitasHoy: 0,
    visitasSemana: 0, 
    visitasMes: 0,
    tendencia: 'estable'
  });

  const [configuracionPuntos, setConfiguracionPuntos] = useState<ConfiguracionPuntos>({
    puntosPorvPeso: 1,
    bonusRegistro: 100,
    puntosVisita: 5
  });

  const [recompensas, setRecompensas] = useState<Recompensa[]>([
    {
      id: 'desc-10',
      nombre: '10% de Descuento',
      puntos: 100,
      activa: true,
      tipo: 'descuento'
    },
    {
      id: 'bebida-gratis',
      nombre: 'Bebida Gratis',
      puntos: 50,
      stock: 20,
      activa: true,
      tipo: 'producto'
    }
  ]);

  const [editandoConfig, setEditandoConfig] = useState(false);

  // Cargar datos al inicializar
  useEffect(() => {
    cargarDatosVisitas();
    cargarConfiguracionPuntos();
    cargarRecompensas();
  }, []);

  const cargarDatosVisitas = async () => {
    try {
      // En el futuro, esto vendrá de una API
      // const response = await fetch('/api/admin/visitas');
      // const data = await response.json();
      
      // Datos mock por ahora
      setVisitas({
        visitasHoy: 0,
        visitasSemana: 0,
        visitasMes: 0,
        tendencia: 'estable'
      });
    } catch (error) {
      console.error('Error cargando visitas:', error);
    }
  };

  const cargarConfiguracionPuntos = async () => {
    try {
      const response = await fetch('/portal-config.json');
      const config = await response.json();
      
      if (config.configuracionPuntos) {
        setConfiguracionPuntos({
          puntosPorvPeso: config.configuracionPuntos.puntosPorDolar || 1,
          bonusRegistro: config.configuracionPuntos.bonusPorRegistro || 100,
          puntosVisita: 5 // Este valor se mantiene hardcodeado por ahora
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      // Fallback a valores por defecto si falla la carga
      setConfiguracionPuntos({
        puntosPorvPeso: 1,
        bonusRegistro: 100,
        puntosVisita: 5
      });
    }
  };

  const cargarRecompensas = async () => {
    try {
      // Cargar desde portal-config.json en el futuro
      setRecompensas([
        {
          id: 'desc-10',
          nombre: '10% de Descuento',
          puntos: 100,
          activa: true,
          tipo: 'descuento'
        },
        {
          id: 'bebida-gratis',
          nombre: 'Bebida Gratis',
          puntos: 50,
          stock: 20,
          activa: true,
          tipo: 'producto'
        }
      ]);
    } catch (error) {
      console.error('Error cargando recompensas:', error);
    }
  };

  const guardarConfiguracion = async () => {
    try {
      // En el futuro, enviar a API
      // await fetch('/api/admin/puntos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(configuracionPuntos)
      // });
      
      setEditandoConfig(false);
      console.log('Configuración guardada:', configuracionPuntos);
    } catch (error) {
      console.error('Error guardando configuración:', error);
    }
  };

  const toggleRecompensa = (id: string) => {
    setRecompensas(prev => 
      prev.map(recompensa => 
        recompensa.id === id 
          ? { ...recompensa, activa: !recompensa.activa }
          : recompensa
      )
    );
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

  return (
    <div className="space-y-6">
      {/* Métricas de Visitas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visitas Hoy */}
        <div className="bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6">
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
            <h3 className="text-blue-400 text-sm font-medium mb-1">Visitas Hoy</h3>
            <p className="text-4xl font-bold text-white mb-2">{visitas.visitasHoy}</p>
            <p className="text-dark-400 text-sm">→ Estable</p>
          </div>
        </div>

        {/* Visitas Esta Semana */}
        <div className="bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-purple-400 text-sm font-medium mb-1">Visitas Esta Semana</h3>
            <p className="text-4xl font-bold text-white mb-2">{visitas.visitasSemana}</p>
            <p className="text-dark-400 text-sm">Total de la semana</p>
          </div>
        </div>

        {/* Visitas Este Mes */}
        <div className="bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-green-400 text-sm font-medium mb-1">Visitas Este Mes</h3>
            <p className="text-4xl font-bold text-white mb-2">{visitas.visitasMes}</p>
            <p className="text-dark-400 text-sm">Total del mes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Puntos */}
        <div className="bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Configuración de Puntos</h3>
            </div>
            <button
              onClick={() => setEditandoConfig(!editandoConfig)}
              className="p-2 bg-primary-600/20 hover:bg-primary-600/30 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4 text-primary-400" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Puntos por peso gastado */}
            <div>
              <label htmlFor="puntos-peso" className="block text-dark-300 text-sm font-medium mb-2">
                Puntos por peso gastado
              </label>
              {editandoConfig ? (
                <input
                  id="puntos-peso"
                  type="number"
                  value={configuracionPuntos.puntosPorvPeso}
                  onChange={(e) => setConfiguracionPuntos(prev => ({
                    ...prev,
                    puntosPorvPeso: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-lg font-semibold"
                />
              ) : (
                <div className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg">
                  <div className="text-white text-lg font-semibold">{configuracionPuntos.puntosPorvPeso}</div>
                </div>
              )}
              <p className="text-dark-400 text-xs mt-1">
                Ej: 2 = 2 puntos por cada $1 gastado (máximo 10)
              </p>
            </div>

            {/* Bonus por registro */}
            <div>
              <label htmlFor="bonus-registro" className="block text-dark-300 text-sm font-medium mb-2">
                Bonus por registro
              </label>
              {editandoConfig ? (
                <input
                  id="bonus-registro"
                  type="number"
                  value={configuracionPuntos.bonusRegistro}
                  onChange={(e) => setConfiguracionPuntos(prev => ({
                    ...prev,
                    bonusRegistro: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-lg font-semibold"
                />
              ) : (
                <div className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg">
                  <div className="text-white text-lg font-semibold">{configuracionPuntos.bonusRegistro}</div>
                </div>
              )}
              <p className="text-dark-400 text-xs mt-1">
                Puntos que recibe el cliente al registrarse (máximo 1,000)
              </p>
            </div>

            {/* Puntos por visita al portal */}
            <div>
              <label htmlFor="puntos-visita" className="block text-dark-300 text-sm font-medium mb-2">
                Puntos por visita al portal
              </label>
              {editandoConfig ? (
                <input
                  id="puntos-visita"
                  type="number"
                  value={configuracionPuntos.puntosVisita}
                  onChange={(e) => setConfiguracionPuntos(prev => ({
                    ...prev,
                    puntosVisita: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-lg font-semibold"
                />
              ) : (
                <div className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg">
                  <div className="text-white text-lg font-semibold">{configuracionPuntos.puntosVisita}</div>
                </div>
              )}
              <p className="text-dark-400 text-xs mt-1">
                Puntos por visitar el portal (1 vez por día, máximo 20)
              </p>
            </div>

            {editandoConfig && (
              <button
                onClick={guardarConfiguracion}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 text-white" />
                <span className="text-white font-medium">Guardar Configuración</span>
              </button>
            )}
          </div>
        </div>

        {/* Recompensas Activas */}
        <div className="bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Recompensas Activas</h3>
          </div>

          <div className="space-y-4">
            {recompensas.map((recompensa) => (
              <div 
                key={recompensa.id}
                className="bg-dark-700/50 border border-dark-600/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-white font-medium">{recompensa.nombre}</h4>
                    <span className="text-yellow-400 text-sm font-medium">
                      {recompensa.tipo === 'descuento' ? 'descuento' : 'producto'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleRecompensa(recompensa.id)}
                    className="flex items-center space-x-1"
                  >
                    {recompensa.activa ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Activa</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-dark-400" />
                        <span className="text-dark-400 text-sm font-medium">Inactiva</span>
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-dark-300 text-sm mb-2">
                  {recompensa.tipo === 'descuento' 
                    ? `Descuento del ${/\d+/.exec(recompensa.nombre)?.[0]}% en tu próxima compra`
                    : `Cualquier bebida de la casa`
                  }
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold text-lg">
                    {recompensa.puntos} puntos
                  </span>
                  {recompensa.stock && (
                    <span className="text-dark-400 text-sm">
                      Stock: {recompensa.stock}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMain;
