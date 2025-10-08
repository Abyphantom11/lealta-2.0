'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Activity, Package, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VentaSemana {
  semana: string;
  fecha: string;
  cantidad: number;
  ingresos: number;
}

interface ProductoTendencia {
  id: string;
  nombre: string;
  cantidadTotal: number;
  ingresoTotal: number;
  ventasSemana: VentaSemana[];
}

interface ProductosTendenciasData {
  productos: ProductoTendencia[];
  timestamp: string;
  periodo: {
    desde: string;
    hasta: string;
  };
}

export default function ProductosTendenciasChart() {
  const [data, setData] = useState<ProductosTendenciasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<number>(0);

  useEffect(() => {
    fetchTendenciasData();
  }, []);

  const fetchTendenciasData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/productos-tendencias', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Error fetching tendencias data:', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Tendencias de Ventas</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-10 bg-gray-700/50 rounded-lg flex-1"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-700/30 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data || data.productos.length === 0) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Tendencias de Ventas</h2>
        </div>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No hay datos de productos disponibles</p>
        </div>
      </div>
    );
  }

  const currentProduct = data.productos[selectedProduct];
  
  // Validar que tenemos datos válidos
  if (!currentProduct || !currentProduct.ventasSemana || currentProduct.ventasSemana.length === 0) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Tendencias de Ventas</h2>
        </div>
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Producto sin datos de ventas</p>
        </div>
      </div>
    );
  }

  // 🛡️ VALIDACIÓN: Asegurar datos válidos para evitar NaN
  const validVentas = currentProduct.ventasSemana.filter(v => 
    v && typeof v.ingresos === 'number' && !isNaN(v.ingresos) && v.ingresos >= 0
  );
  const maxValue = validVentas.length > 0 ? 
    Math.max(...validVentas.map(v => v.ingresos), 1) : 1;

  // Colores para cada producto (estilo trading)
  const productColors = [
    { bg: 'from-green-500 to-emerald-600', text: 'text-green-400', border: 'border-green-500', color: '#10b981' },
    { bg: 'from-blue-500 to-cyan-600', text: 'text-blue-400', border: 'border-blue-500', color: '#3b82f6' },
    { bg: 'from-purple-500 to-violet-600', text: 'text-purple-400', border: 'border-purple-500', color: '#8b5cf6' },
    { bg: 'from-orange-500 to-red-600', text: 'text-orange-400', border: 'border-orange-500', color: '#f97316' },
    { bg: 'from-pink-500 to-rose-600', text: 'text-pink-400', border: 'border-pink-500', color: '#ec4899' }
  ];

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Tendencias de Ventas</h2>
            <p className="text-gray-400 text-sm">Top 5 productos - Últimas 12 semanas</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Producto seleccionado</p>
          <p className="text-lg font-semibold text-white">{currentProduct.nombre}</p>
        </div>
      </div>

      {/* Botones de productos */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {data.productos.map((producto, index) => {
          const color = productColors[index];
          const isSelected = selectedProduct === index;
          
          return (
            <motion.button
              key={producto.id}
              onClick={() => setSelectedProduct(index)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                isSelected 
                  ? `${color.border} bg-gradient-to-r ${color.bg} bg-opacity-20` 
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  <BarChart3 className={`w-3 h-3 ${isSelected ? color.text : 'text-gray-400'}`} />
                </div>
                <p className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {producto.nombre}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${isSelected ? color.text : 'text-gray-400'}`}>
                    {formatCurrency(producto.ingresoTotal)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {producto.cantidadTotal} uds
                  </span>
                </div>
              </div>
              
              {/* Indicador de selección */}
              {isSelected && (
                <motion.div
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r ${color.bg}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Gráfico tipo bolsa de valores */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedProduct}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-black/20 rounded-xl p-4 border border-gray-800/30"
        >
          {/* Stats del producto seleccionado */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Total Ingresos</span>
              </div>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(currentProduct.ingresoTotal)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Unidades</span>
              </div>
              <p className="text-lg font-bold text-blue-400">
                {currentProduct.cantidadTotal}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Precio Promedio</span>
              </div>
              <p className="text-lg font-bold text-purple-400">
                {formatCurrency(currentProduct.ingresoTotal / currentProduct.cantidadTotal)}
              </p>
            </div>
          </div>

          {/* Gráfico de líneas estilo trading */}
          <div className="relative h-64">
            {/* Líneas de grilla */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="border-t border-gray-800/30 flex justify-end pr-2">
                  <span className="text-xs text-gray-500">
                    {formatCurrency((maxValue * (4 - i)) / 4)}
                  </span>
                </div>
              ))}
            </div>

            {/* Gráfico de líneas */}
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id={`gradient-${selectedProduct}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={productColors[selectedProduct].color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={productColors[selectedProduct].color} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Área bajo la curva */}
              {validVentas.length > 1 && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  d={`M ${validVentas.map((venta, index) => {
                    const x = validVentas.length > 1 ? 
                      (index / (validVentas.length - 1)) * 380 + 10 : 200;
                    const y = 190 - (venta.ingresos / maxValue) * 180;
                    return `${x} ${y}`;
                  }).join(' L ')} L 390 190 L 10 190 Z`}
                  fill={`url(#gradient-${selectedProduct})`}
                />
              )}

              {/* Línea principal */}
              {validVentas.length > 1 && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  d={`M ${validVentas.map((venta, index) => {
                    const x = validVentas.length > 1 ? 
                      (index / (validVentas.length - 1)) * 380 + 10 : 200;
                    const y = 190 - (venta.ingresos / maxValue) * 180;
                    return `${x} ${y}`;
                  }).join(' L ')}`}
                  stroke={productColors[selectedProduct].color}
                  strokeWidth="3"
                  fill="none"
                  className="drop-shadow-lg"
                />
              )}

              {/* Puntos de datos */}
              {validVentas.map((venta, index) => {
                const x = validVentas.length > 1 ? 
                  (index / (validVentas.length - 1)) * 380 + 10 : 200;
                const y = 190 - (venta.ingresos / maxValue) * 180;
                
                return (
                  <motion.circle
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={productColors[selectedProduct].color}
                    stroke="#1f2937"
                    strokeWidth="2"
                    className="drop-shadow-lg cursor-pointer hover:r-6 transition-all"
                  >
                    <title>{`${formatDate(venta.fecha)}: ${formatCurrency(venta.ingresos)}`}</title>
                  </motion.circle>
                );
              })}
            </svg>

            {/* Etiquetas del eje X */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
              {validVentas.map((venta, index) => {
                if (index % 2 === 0 || index === validVentas.length - 1) {
                  return (
                    <span key={index} className="text-xs text-gray-500">
                      {formatDate(venta.fecha)}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
