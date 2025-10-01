'use client';

import React, { useState } from 'react';
import { downloadReportPDF } from '@/utils/pdf-generator';
import { toast } from 'sonner';

interface ReportsGeneratorProps {
  businessId: string;
  businessName: string;
}

export default function ReportsGenerator({ businessId, businessName }: Readonly<ReportsGeneratorProps>) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(
        `/api/reservas/reportes?businessId=${businessId}&mes=${selectedMonth}&año=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener datos del reporte');
      }

      const data = await response.json();
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <select
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
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

            {/* Cumplimiento */}
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Cumplimiento</p>
              <p className="text-2xl font-bold text-yellow-600">
                {preview.metricas.generales.porcentajeCumplimiento.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Análisis por Asistencia */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">✅ Análisis por Asistencia</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
            </div>
          </div>

          {/* Top 3 Rankings (Preview compacto) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Días */}
            <div className="bg-white border-2 border-blue-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">📅 Top 3 Días</h4>
              <ul className="space-y-1 text-xs">
                {preview.rankings.top5Dias.slice(0, 3).map((dia: any, idx: number) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-gray-600">{dia.fecha}</span>
                    <span className="font-bold text-blue-600">{dia.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Clientes */}
            <div className="bg-white border-2 border-green-100 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">👥 Top 3 Clientes</h4>
              <ul className="space-y-1 text-xs">
                {preview.rankings.top5Clientes.slice(0, 3).map((cliente: any, idx: number) => (
                  <li key={idx} className="flex justify-between">
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
                  <li key={idx} className="flex justify-between">
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
