'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from './motion';

interface DateRange {
  label: string;
  value: string;
  days: number;
  color: string;
}

interface DateRangePickerProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  showComparison?: boolean;
  onComparisonToggle?: (enabled: boolean) => void;
}

const predefinedRanges: DateRange[] = [
  { label: 'Hoy', value: 'today', days: 1, color: 'text-green-400' },
  { label: 'Ayer', value: 'yesterday', days: 1, color: 'text-blue-400' },
  { label: 'Esta Semana', value: 'week', days: 7, color: 'text-purple-400' },
  { label: 'Semana Pasada', value: 'lastWeek', days: 7, color: 'text-indigo-400' },
  { label: 'Este Mes', value: 'month', days: 30, color: 'text-cyan-400' },
  { label: 'Mes Pasado', value: 'lastMonth', days: 30, color: 'text-teal-400' },
  { label: 'Últimos 7 días', value: '7days', days: 7, color: 'text-orange-400' },
  { label: 'Últimos 30 días', value: '30days', days: 30, color: 'text-yellow-400' },
  { label: 'Últimos 90 días', value: '90days', days: 90, color: 'text-pink-400' },
  { label: 'Este Año', value: 'year', days: 365, color: 'text-red-400' },
];

export default function DateRangePicker({ 
  selectedRange, 
  onRangeChange, 
  showComparison = false,
  onComparisonToggle 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  const selectedRangeData = predefinedRanges.find(r => r.value === selectedRange) || predefinedRanges[0];

  const handleRangeSelect = (value: string) => {
    onRangeChange(value);
    setIsOpen(false);
  };

  const handleComparisonToggle = () => {
    const newValue = !comparisonEnabled;
    setComparisonEnabled(newValue);
    onComparisonToggle?.(newValue);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-3">
        {/* Selector Principal */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-3 px-4 py-3 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl border border-gray-700/50 backdrop-blur-sm transition-all group"
          >
            <Calendar className="w-5 h-5 text-gray-400 group-hover:text-white" />
            <div className="text-left">
              <p className="text-white font-medium text-sm">{selectedRangeData.label}</p>
              <p className="text-gray-400 text-xs">{selectedRangeData.days} día{selectedRangeData.days > 1 ? 's' : ''}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-2">
                  <div className="grid grid-cols-1 gap-1">
                    {predefinedRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => handleRangeSelect(range.value)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all hover:bg-gray-800/60 ${
                          selectedRange === range.value ? 'bg-gray-800/80 border border-gray-600/30' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${range.color.replace('text-', 'bg-')}`}></div>
                          <span className="text-white text-sm font-medium">{range.label}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{range.days}d</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle de Comparación */}
        {showComparison && (
          <button
            onClick={handleComparisonToggle}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all ${
              comparisonEnabled 
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                : 'bg-gray-800/60 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Comparar</span>
          </button>
        )}

        {/* Indicador de Tiempo Real */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <Clock className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">En Vivo</span>
        </div>
      </div>

      {/* Info de Comparación */}
      {comparisonEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
        >
          <p className="text-blue-300 text-sm">
            📊 Comparando con período anterior: <span className="font-medium">{selectedRangeData.label}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
