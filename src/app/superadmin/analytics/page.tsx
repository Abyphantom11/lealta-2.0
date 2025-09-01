'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsData, TransaccionAnalizada } from '@/types/analytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  LineChart, Line, ResponsiveContainer 
} from 'recharts';

// Colores para gráficas - comentados ya que no se utilizan actualmente
// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Helper para determinar la clase CSS según la confianza
const getConfianzaClass = (confianza: number): string => {
  if (confianza > 0.8) return 'bg-green-100 text-green-800';
  if (confianza > 0.6) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export default function SuperAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [transaccionesRecientes, setTransaccionesRecientes] = useState<TransaccionAnalizada[]>([]);
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadAnalyticsData();
    loadRecentTransactions();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // En MVP: datos mock, en producción: await fetch('/api/analytics/dashboard')
      const mockData: AnalyticsData = {
        transaccionesHoy: 47,
        transaccionesAyer: 42,
        puntosGenerados: 2840,
        ingresosTotales: 2840,
        productosTop: [
          { nombre: 'Café Americano', ventas: 15, ingresos: 450 },
          { nombre: 'Sandwich Club', ventas: 12, ingresos: 720 },
          { nombre: 'Pizza Margarita', ventas: 8, ingresos: 800 },
          { nombre: 'Coca Cola', ventas: 25, ingresos: 375 },
          { nombre: 'Ensalada Caesar', ventas: 6, ingresos: 420 }
        ],
        clientesTop: [
          { id: '1', nombre: 'María García', puntos: 245, gastosTotal: 2450 },
          { id: '2', nombre: 'Juan Pérez', puntos: 189, gastosTotal: 1890 },
          { id: '3', nombre: 'Ana López', puntos: 156, gastosTotal: 1560 }
        ],
        ventasPorHora: [
          { hora: 8, ventas: 3, ingresos: 120 },
          { hora: 9, ventas: 7, ingresos: 280 },
          { hora: 10, ventas: 12, ingresos: 480 },
          { hora: 11, ventas: 8, ingresos: 320 },
          { hora: 12, ventas: 15, ingresos: 600 },
          { hora: 13, ventas: 10, ingresos: 400 },
          { hora: 14, ventas: 5, ingresos: 200 }
        ]
      };
      setAnalytics(mockData);
    } catch (error) {
      setError('Error cargando datos de analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      // En MVP: datos mock, en producción: await fetch('/api/analytics/transactions')
      const mockTransactions: TransaccionAnalizada[] = [
        {
          id: 'txn_001',
          fechaTransaccion: new Date(),
          productos: [
            { nombre: 'Café Latte', cantidad: 2, precio: 35 },
            { nombre: 'Croissant', cantidad: 1, precio: 25 }
          ],
          totalPesos: 95,
          puntosGenerados: 95,
          estadoAnalisis: 'procesado',
          confianza: 0.95
        }
      ];
      setTransaccionesRecientes(mockTransactions);
    } catch (error) {
      console.error('Error cargando transacciones recientes:', error);
    }
  };

  const procesarImagenPOS = useCallback(async (file: File) => {
    if (!file) return;

    setProcesandoImagen(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('imagen', file);

      const response = await fetch('/api/analytics/process-pos', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar datos después del procesamiento exitoso
        await loadAnalyticsData();
        await loadRecentTransactions();
        
        alert(`✅ Imagen procesada exitosamente!\n\n` +
              `📦 ${result.transaccion.productos.length} productos detectados\n` +
              `💰 Total: $${result.transaccion.total}\n` +
              `⭐ Puntos: ${result.transaccion.puntos}\n` +
              `🎯 Confianza: ${(result.transaccion.confianza * 100).toFixed(1)}%`);
      } else {
        setError(result.error || 'Error procesando la imagen');
      }
    } catch (error) {
      setError('Error de conexión al procesar la imagen');
      console.error(error);
    } finally {
      setProcesandoImagen(false);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      procesarImagenPOS(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Analytics Super Admin
          </h1>
          <p className="text-gray-600">
            Dashboard inteligente con análisis automático de POS
          </p>
        </div>

        {/* Upload Zone */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors mb-8">
          <div className="p-8 text-center">
            <div className="mb-4">
              🤖 <span className="text-2xl">Análisis IA con Gemini</span>
            </div>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={procesandoImagen}
              className="hidden"
              id="pos-upload"
            />
            
            <label
              htmlFor="pos-upload"
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors cursor-pointer ${
                procesandoImagen 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {procesandoImagen ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analizando con IA...
                </>
              ) : (
                <>
                  📸 Subir Captura del POS
                </>
              )}
            </label>
            
            <p className="mt-3 text-sm text-gray-500">
              Soporta JPG, PNG hasta 10MB. La IA extraerá automáticamente productos, precios y totales.
            </p>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                ❌ {error}
              </div>
            )}
          </div>
        </div>

        {analytics && (
          <>
            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Transacciones Hoy"
                value={analytics.transaccionesHoy}
                subtitle={`+${analytics.transaccionesHoy - analytics.transaccionesAyer} vs ayer`}
                icon="📊"
                color="blue"
              />
              <MetricCard
                title="Puntos Generados"
                value={analytics.puntosGenerados.toLocaleString()}
                subtitle="Total del día"
                icon="⭐"
                color="yellow"
              />
              <MetricCard
                title="Ingresos Totales"
                value={`$${analytics.ingresosTotales.toLocaleString()}`}
                subtitle="Pesos mexicanos"
                icon="💰"
                color="green"
              />
              <MetricCard
                title="Promedio/Transacción"
                value={`$${Math.round(analytics.ingresosTotales / analytics.transaccionesHoy)}`}
                subtitle="Ticket promedio"
                icon="🎯"
                color="purple"
              />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Productos Top */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">🏆 Productos Más Vendidos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.productosTop}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ventas" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ventas por Hora */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">⏰ Ventas por Hora</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.ventasPorHora}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transacciones Recientes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">🕒 Transacciones Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Productos</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Puntos</th>
                      <th className="px-4 py-2 text-left">Confianza IA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaccionesRecientes.map((txn) => (
                      <tr key={txn.id} className="border-t">
                        <td className="px-4 py-2 font-mono text-sm">{txn.id}</td>
                        <td className="px-4 py-2">{txn.fechaTransaccion.toLocaleString()}</td>
                        <td className="px-4 py-2">{txn.productos.length} items</td>
                        <td className="px-4 py-2">${txn.totalPesos}</td>
                        <td className="px-4 py-2">⭐ {txn.puntosGenerados}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${getConfianzaClass(txn.confianza)}`}>
                            {(txn.confianza * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Componente para las métricas
const MetricCard = ({ title, value, subtitle, icon, color }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-full p-3 mr-4`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
