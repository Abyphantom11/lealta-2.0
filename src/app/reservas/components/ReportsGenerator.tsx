'use client';

import React, { useState } from 'react';
import { downloadReportPDF } from '@/utils/pdf-generator';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReportsGeneratorProps {
  businessId: string;
  businessName: string;
}

export default function ReportsGenerator({ businessId, businessName }: Readonly<ReportsGeneratorProps>) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'charts'>('summary');

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    
    try {
      const url = `/api/reservas/reportes?businessId=${businessId}&mes=${selectedMonth}&año=${selectedYear}`;
      console.log('🔍 Llamando a:', url);
      
      const response = await fetch(url);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error('Error al obtener datos del reporte');
      }

      const data = await response.json();
      console.log('✅ Datos recibidos:', data);
      console.log('Total reservas:', data?.metricas?.generales?.totalReservas);
      console.log('📊 Métricas para gráfica:', {
        totalReservas: data?.metricas?.generales?.totalReservas,
        personasEsperadas: data?.metricas?.generales?.totalPersonasEsperadas,
        asistentesReales: data?.metricas?.generales?.totalAsistentesReales,
        sinReserva: data?.metricas?.generales?.totalSinReserva
      });
      
      setPreview(data);
      
      toast.success('✅ Preview generado correctamente');
    } catch (error) {
      console.error('Error generando preview:', error);
      toast.error('❌ Error al generar preview del reporte');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!preview) {
      toast.error('Primero genera un preview del reporte');
      return;
    }

    try {
      downloadReportPDF(preview, { nombre: businessName });
      toast.success('✅ PDF descargado correctamente');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('❌ Error al descargar PDF');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Sistema de Reportes</h2>
        <p className="text-gray-600 text-sm">
          Genera reportes mensuales profesionales en formato PDF con estadísticas detalladas
        </p>
      </div>

      {/* Selector de Período */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Seleccionar Período</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Selector de Mes */}
          <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {months.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Año */}
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón Generar Preview */}
        <button
          onClick={handleGeneratePreview}
          disabled={isGenerating}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <span>🔍</span>
              Generar Preview
            </>
          )}
        </button>
      </div>

      {/* Preview de Estadísticas */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              📈 Preview: {preview.periodo.mesNombre} {preview.periodo.año}
            </h3>
            
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📥</span>
              Descargar PDF
            </button>
          </div>

          {/* Toggle: Vista Resumen vs Gráficas */}
          <div className="flex items-center justify-center gap-2 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'summary'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'charts'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              📈 Gráficas
            </button>
          </div>

          {/* VISTA: RESUMEN */}
          {viewMode === 'summary' && (
            <>
              {/* Grid de Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Reservas */}
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Total Reservas</p>
              <p className="text-2xl font-bold text-blue-600">
                {preview.metricas.generales.totalReservas}
              </p>
            </div>

            {/* Personas Esperadas */}
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Personas Esperadas</p>
              <p className="text-2xl font-bold text-purple-600">
                {preview.metricas.generales.totalPersonasEsperadas}
              </p>
            </div>

            {/* Asistentes Reales */}
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Asistentes Reales</p>
              <p className="text-2xl font-bold text-green-600">
                {preview.metricas.generales.totalAsistentesReales}
              </p>
            </div>

            {/* Total Sin Reserva */}
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Total Sin Reserva</p>
              <p className="text-2xl font-bold text-purple-600">
                {preview.metricas.generales.totalSinReserva}
              </p>
            </div>
          </div>

          {/* 🆕 NUEVAS MÉTRICAS: Sin Reserva */}
          {preview.metricas.sinReserva && (
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-5 rounded-lg border-2 border-cyan-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                🚶‍♂️ Clientes Sin Reserva (Walk-ins)
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Total Registros Sin Reserva */}
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total Registros</p>
                  <p className="text-2xl font-bold text-cyan-600">
                    {preview.metricas.sinReserva.totalRegistros}
                  </p>
                </div>

                {/* Total Personas Sin Reserva */}
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total Personas</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {preview.metricas.sinReserva.totalPersonas}
                  </p>
                </div>

                {/* Promedio Diario */}
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Promedio Diario</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {preview.metricas.sinReserva.promedioDiario.toFixed(1)}
                  </p>
                </div>

                {/* Días con Registros */}
                <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Días Activos</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {preview.metricas.sinReserva.diasConRegistros}
                  </p>
                </div>
              </div>

              {/* 📊 MÉTRICAS COMBINADAS */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h5 className="font-semibold text-gray-800 mb-3">📊 Resumen Total del Mes</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Personas Atendidas:</span>
                    <span className="font-bold text-indigo-600 text-lg">
                      {preview.metricas.generales.totalPersonasAtendidas || 
                       (preview.metricas.generales.totalAsistentesReales + preview.metricas.sinReserva.totalPersonas)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">% Sin Reserva:</span>
                    <span className="font-bold text-cyan-600 text-lg">
                      {((preview.metricas.sinReserva.totalPersonas / 
                         (preview.metricas.generales.totalAsistentesReales + preview.metricas.sinReserva.totalPersonas)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Análisis por Asistencia */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">✅ Análisis por Asistencia</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completadas:</span>
                <span className="font-bold text-green-600">
                  {preview.metricas.porAsistencia.completadas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sobreaforo:</span>
                <span className="font-bold text-blue-600">
                  {preview.metricas.porAsistencia.sobreaforo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Parciales:</span>
                <span className="font-bold text-yellow-600">
                  {preview.metricas.porAsistencia.parciales}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Caídas:</span>
                <span className="font-bold text-red-600">
                  {preview.metricas.porAsistencia.caidas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Canceladas:</span>
                <span className="font-bold text-orange-600">
                  {preview.metricas.porAsistencia.canceladas || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 🎯 NUEVO: Top 5 Promotores por Asistencia */}
          {preview.rankings.top5Promotores && preview.rankings.top5Promotores.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-lg border-2 border-orange-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                🏆 Top 5 Promotores (Mayor Asistencia)
              </h4>
              <div className="space-y-2">
                {preview.rankings.top5Promotores.filter((promotor: any) => promotor && promotor.nombre).map((promotor: any, idx: number) => (
                  <div key={promotor.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-orange-500">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{promotor.nombre}</p>
                        <p className="text-xs text-gray-500">{promotor.cantidad} reservas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{promotor.cumplimiento.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">cumplimiento</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 👥 NUEVO: Análisis Detallado por Promotor */}
          {preview.metricas.porPromotor && preview.metricas.porPromotor.length > 0 && (
            <div className="bg-white border-2 border-indigo-200 p-5 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                👥 Análisis por Promotor
                <span className="text-xs text-gray-500 font-normal">
                  (Esperados vs Asistieron)
                </span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-700">Promotor</th>
                      <th className="text-center py-2 px-3 text-gray-700">Reservas</th>
                      <th className="text-center py-2 px-3 text-gray-700">Esperados</th>
                      <th className="text-center py-2 px-3 text-gray-700">Asistieron</th>
                      <th className="text-center py-2 px-3 text-gray-700">Cumplimiento</th>
                      <th className="text-center py-2 px-3 text-gray-700">Caídas</th>
                      <th className="text-center py-2 px-3 text-gray-700">Canceladas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.metricas.porPromotor
                      .filter((promotor: any) => promotor?.nombre)
                      .sort((a: any, b: any) => b.personasAsistieron - a.personasAsistieron)
                      .map((promotor: any) => (
                        <tr key={promotor.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-800">{promotor.nombre}</td>
                          <td className="py-2 px-3 text-center text-blue-600 font-semibold">{promotor.totalReservas}</td>
                          <td className="py-2 px-3 text-center text-purple-600">{promotor.personasEsperadas}</td>
                          <td className="py-2 px-3 text-center text-green-600 font-bold">{promotor.personasAsistieron}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`font-bold ${
                              promotor.porcentajeCumplimiento >= 90 ? 'text-green-600' :
                              promotor.porcentajeCumplimiento >= 70 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {promotor.porcentajeCumplimiento.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-red-600">{promotor.reservasCaidas}</td>
                          <td className="py-2 px-3 text-center text-orange-600">{promotor.reservasCanceladas || 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top 3 Rankings (Preview compacto) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Top Días */}
            <div className="bg-white border-2 border-blue-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">📅 Top 3 Días (Reservas)</h4>
              <ul className="space-y-1 text-xs">
                {preview.rankings.top5Dias.slice(0, 3).map((dia: any, idx: number) => (
                  <li key={`dias-reservas-${dia.fecha}-${idx}`} className="flex justify-between">
                    <span className="text-gray-600">{dia.fecha}</span>
                    <span className="font-bold text-blue-600">{dia.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 🆕 Top Días Sin Reserva */}
            {preview.rankings.top5DiasSinReserva && preview.rankings.top5DiasSinReserva.length > 0 && (
              <div className="bg-white border-2 border-cyan-100 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">🚶‍♂️ Top 3 Días (Sin Reserva)</h4>
                <ul className="space-y-1 text-xs">
                  {preview.rankings.top5DiasSinReserva.slice(0, 3).map((dia: any, idx: number) => (
                    <li key={`dias-sin-reserva-${dia.fecha}-${idx}`} className="flex justify-between">
                      <span className="text-gray-600">{dia.fecha}</span>
                      <span className="font-bold text-cyan-600">{dia.personas} personas</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Clientes */}
            <div className="bg-white border-2 border-green-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">👥 Top 3 Clientes</h4>
              <ul className="space-y-1 text-xs">
                {preview.rankings.top5Clientes.slice(0, 3).filter((cliente: any) => cliente?.nombre).map((cliente: any, idx: number) => (
                  <li key={`cliente-${cliente.id || cliente.nombre}-${idx}`} className="flex justify-between">
                    <span className="text-gray-600 truncate">{cliente.nombre}</span>
                    <span className="font-bold text-green-600">{cliente.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Horarios */}
            <div className="bg-white border-2 border-purple-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">🕐 Top 3 Horarios</h4>
              <ul className="space-y-1 text-xs">
                {preview.rankings.top5Horarios.slice(0, 3).map((horario: any, idx: number) => (
                  <li key={`horario-${horario.horario}-${idx}`} className="flex justify-between">
                    <span className="text-gray-600">{horario.horario}</span>
                    <span className="font-bold text-purple-600">{horario.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">ℹ️ Nota:</span> El PDF completo incluye todas las métricas, 
              rankings completos (Top 5) y tabla detallada de todas las reservas del período.
            </p>
          </div>
            </>
          )}

          {/* VISTA: GRÁFICAS */}
          {viewMode === 'charts' && (
            <div className="space-y-6">
              {/* Info sobre escalas */}
              {(preview.metricas.generales.totalPersonasEsperadas > preview.metricas.generales.totalReservas * 10) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">⚠️ Nota:</span> Los valores tienen grandes diferencias de escala. 
                    Usa la vista &quot;📊 Resumen&quot; para ver los números exactos, o pasa el cursor sobre las barras para ver los valores.
                  </p>
                </div>
              )}

              {/* Gráfica 1: Métricas Generales */}
              <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">📈 Métricas Generales del Mes</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Total Reservas', value: preview.metricas.generales.totalReservas, fill: '#3B82F6' },
                    { name: 'Personas Esperadas', value: preview.metricas.generales.totalPersonasEsperadas, fill: '#A855F7' },
                    { name: 'Asistentes Reales', value: preview.metricas.generales.totalAsistentesReales, fill: '#10B981' },
                    { name: 'Sin Reserva', value: preview.metricas.generales.totalSinReserva, fill: '#06B6D4' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" angle={-12} textAnchor="end" height={70} style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', padding: '10px' }}
                      formatter={(value: any) => [value, 'Total']}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {[
                        { name: 'Total Reservas', fill: '#3B82F6' },
                        { name: 'Personas Esperadas', fill: '#A855F7' },
                        { name: 'Asistentes Reales', fill: '#10B981' },
                        { name: 'Sin Reserva', fill: '#06B6D4' }
                      ].map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Tabla de valores debajo de la gráfica */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-gray-600">Reservas</p>
                    <p className="font-bold text-blue-600">{preview.metricas.generales.totalReservas}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-gray-600">Esperadas</p>
                    <p className="font-bold text-purple-600">{preview.metricas.generales.totalPersonasEsperadas}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-gray-600">Asistieron</p>
                    <p className="font-bold text-green-600">{preview.metricas.generales.totalAsistentesReales}</p>
                  </div>
                  <div className="bg-cyan-50 p-2 rounded">
                    <p className="text-gray-600">Sin Reserva</p>
                    <p className="font-bold text-cyan-600">{preview.metricas.generales.totalSinReserva}</p>
                  </div>
                </div>
              </div>

              {/* Gráfica 2: Estado de Asistencia */}
              <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">✅ Estado de Asistencia</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Completadas', value: preview.metricas.porAsistencia.completadas, fill: '#10B981' },
                    { name: 'Sobreaforo', value: preview.metricas.porAsistencia.sobreaforo, fill: '#3B82F6' },
                    { name: 'Parciales', value: preview.metricas.porAsistencia.parciales, fill: '#F59E0B' },
                    { name: 'Caídas', value: preview.metricas.porAsistencia.caidas, fill: '#EF4444' },
                    { name: 'Canceladas', value: preview.metricas.porAsistencia.canceladas || 0, fill: '#F97316' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', padding: '10px' }}
                      formatter={(value: any) => [value, 'Total']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {[
                        { name: 'Completadas', fill: '#10B981' },
                        { name: 'Sobreaforo', fill: '#3B82F6' },
                        { name: 'Parciales', fill: '#F59E0B' },
                        { name: 'Caídas', fill: '#EF4444' },
                        { name: 'Canceladas', fill: '#F97316' }
                      ].map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Tabla de valores debajo de la gráfica */}
                <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-gray-600">Completadas</p>
                    <p className="font-bold text-green-600">{preview.metricas.porAsistencia.completadas}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-gray-600">Sobreaforo</p>
                    <p className="font-bold text-blue-600">{preview.metricas.porAsistencia.sobreaforo}</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <p className="text-gray-600">Parciales</p>
                    <p className="font-bold text-yellow-600">{preview.metricas.porAsistencia.parciales}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-gray-600">Caídas</p>
                    <p className="font-bold text-red-600">{preview.metricas.porAsistencia.caidas}</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="text-gray-600">Canceladas</p>
                    <p className="font-bold text-orange-600">{preview.metricas.porAsistencia.canceladas || 0}</p>
                  </div>
                </div>
              </div>

              {/* Grid de 2 columnas para las siguientes gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfica 3: Top 5 Días */}
                {preview.rankings.top5Dias && preview.rankings.top5Dias.length > 0 && (
                  <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">📅 Top 5 Días con más Reservas</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={preview.rankings.top5Dias.map((dia: any) => ({
                        fecha: dia.fecha,
                        reservas: dia.cantidad
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="fecha" angle={-12} textAnchor="end" height={60} style={{ fontSize: '11px' }} />
                        <YAxis style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                        <Bar dataKey="reservas" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gráfica 4: Top 5 Horarios */}
                {preview.rankings.top5Horarios && preview.rankings.top5Horarios.length > 0 && (
                  <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">🕐 Top 5 Horarios Populares</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={preview.rankings.top5Horarios.map((horario: any) => ({
                        horario: horario.horario,
                        reservas: horario.cantidad
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="horario" style={{ fontSize: '11px' }} />
                        <YAxis style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                        <Bar dataKey="reservas" fill="#A855F7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gráfica 5: Top 5 Promotores */}
                {preview.rankings.top5Promotores && preview.rankings.top5Promotores.length > 0 && (
                  <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">🏆 Top 5 Promotores</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={preview.rankings.top5Promotores
                        .filter((promotor: any) => promotor?.nombre)
                        .map((promotor: any) => ({
                          nombre: promotor.nombre.length > 12 ? promotor.nombre.substring(0, 12) + '...' : promotor.nombre,
                          reservas: promotor.cantidad
                        }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="nombre" angle={-12} textAnchor="end" height={60} style={{ fontSize: '11px' }} />
                        <YAxis style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                        <Bar dataKey="reservas" fill="#F97316" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gráfica 6: Top 5 Clientes */}
                {preview.rankings.top5Clientes && preview.rankings.top5Clientes.length > 0 && (
                  <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">👥 Top 5 Clientes Frecuentes</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={preview.rankings.top5Clientes
                        .filter((cliente: any) => cliente?.nombre)
                        .slice(0, 5)
                        .map((cliente: any) => ({
                          nombre: cliente.nombre.length > 12 ? cliente.nombre.substring(0, 12) + '...' : cliente.nombre,
                          reservas: cliente.cantidad
                        }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="nombre" angle={-12} textAnchor="end" height={60} style={{ fontSize: '11px' }} />
                        <YAxis style={{ fontSize: '11px' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                        <Bar dataKey="reservas" fill="#10B981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Info sobre gráficas */}
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">💡 Tip:</span> Estas gráficas te ayudan a visualizar rápidamente 
                  las tendencias y patrones de tus reservas. Usa el botón &quot;📊 Resumen&quot; para ver los detalles completos.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {!preview && !isGenerating && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg">Selecciona un período y genera el preview</p>
          <p className="text-sm mt-2">Podrás revisar las estadísticas antes de descargar el PDF</p>
        </div>
      )}
    </div>
  );
}
