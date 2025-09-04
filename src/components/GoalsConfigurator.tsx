'use client';

import { useState, useEffect } from 'react';
import { motion } from './motion';
import { Target, DollarSign, Users, ShoppingCart, TrendingUp, Save, RotateCcw } from 'lucide-react';

interface InputFieldProps {
  label: string; 
  field: keyof BusinessGoals; 
  prefix?: string; 
  suffix?: string;
  min?: number;
  step?: number;
  description?: string;
  value: number | string;
  onChange: (field: keyof BusinessGoals, value: string) => void;
}

function InputField({ 
  label, 
  field, 
  prefix = '', 
  suffix = '',
  min = 0,
  step = 1,
  description = '',
  value,
  onChange
}: Readonly<InputFieldProps>) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={min}
          step={step}
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            prefix ? 'pl-8' : ''
          } ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {suffix}
          </span>
        )}
      </div>
      {description && (
        <p className="text-gray-500 text-xs flex items-center">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          {description}
        </p>
      )}
    </div>
  );
}

interface BusinessGoals {
  id?: string;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  dailyClients: number;
  weeklyClients: number;
  monthlyClients: number;
  dailyTransactions: number;
  weeklyTransactions: number;
  monthlyTransactions: number;
  targetTicketAverage: number;
  targetRetentionRate: number;
  targetConversionRate: number;
  targetTopClient: number;
  targetActiveClients: number;
}

interface GoalsConfiguratorProps {
  onClose: () => void;
  onSave: (goals: BusinessGoals) => void;
}

const defaultGoals: BusinessGoals = {
  dailyRevenue: 100,
  weeklyRevenue: 700,
  monthlyRevenue: 3000,
  dailyClients: 5,
  weeklyClients: 25,
  monthlyClients: 100,
  dailyTransactions: 8,
  weeklyTransactions: 50,
  monthlyTransactions: 200,
  targetTicketAverage: 50,
  targetRetentionRate: 70,
  targetConversionRate: 80,
  targetTopClient: 150,
  targetActiveClients: 50,
};

type TabType = 'revenue' | 'clients' | 'transactions' | 'general';

export default function GoalsConfigurator({ onClose, onSave }: Readonly<GoalsConfiguratorProps>) {
  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [goals, setGoals] = useState<BusinessGoals>(defaultGoals);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  useEffect(() => {
    fetchCurrentGoals();
    
    // Cleanup function para limpiar timeout al desmontar
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const fetchCurrentGoals = async () => {
    try {
      const response = await fetch('/api/admin/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || defaultGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      setGoals(defaultGoals);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goals),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Limpiar timeout si existe
        if (saveTimeout) {
          clearTimeout(saveTimeout);
          setSaveTimeout(null);
        }
        
        // Notificar al componente padre
        onSave(data.goals);
        
        // Disparar evento para actualizar dashboard
        window.dispatchEvent(new CustomEvent('goalsUpdated', { 
          detail: data.goals 
        }));
        
        onClose();
      } else {
        console.error('Error saving goals');
        alert('Error guardando las metas. Por favor intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Error guardando las metas. Por favor intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setGoals(defaultGoals);
  };

  const saveGoals = async (goalsToSave?: BusinessGoals) => {
    const dataToSave = goalsToSave || goals;
    try {
      const response = await fetch('/api/admin/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Disparar evento personalizado para notificar al dashboard
        window.dispatchEvent(new CustomEvent('goalsUpdated', { 
          detail: result.goals 
        }));
        
        console.log('✅ Metas guardadas automáticamente');
      }
    } catch (error) {
      console.error('❌ Error en auto-guardado:', error);
    }
  };

  const updateGoal = (field: keyof BusinessGoals, value: string) => {
    // Permitir valores vacíos temporalmente para mejor UX
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    setGoals(prev => ({ ...prev, [field]: numericValue }));
    
    // Auto-guardar después de 1 segundo de inactividad
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    setIsAutoSaving(true);
    
    const newTimeout = setTimeout(async () => {
      await saveGoals({ ...goals, [field]: numericValue });
      setIsAutoSaving(false);
    }, 1000);
    
    setSaveTimeout(newTimeout);
  };

  // Renderizar InputField con las props necesarias
  const renderInputField = (props: Omit<InputFieldProps, 'value' | 'onChange'>) => (
    <InputField
      {...props}
      value={goals[props.field] || ''}
      onChange={updateGoal}
    />
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden"
      onWheel={(e) => e.preventDefault()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-4xl mx-4 h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Configurar Metas del Negocio</h2>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-400 text-sm">Personaliza los objetivos de tu dashboard</p>
                  {isAutoSaving && (
                    <div className="flex items-center space-x-1 text-xs text-blue-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Guardando...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-6 pt-6">
          <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1">
            {[
              { key: 'revenue' as const, label: 'Ingresos', icon: DollarSign },
              { key: 'clients' as const, label: 'Clientes', icon: Users },
              { key: 'transactions' as const, label: 'Transacciones', icon: ShoppingCart },
              { key: 'general' as const, label: 'General', icon: TrendingUp },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content - Con scroll interno */}
        <div className="flex-1 p-6 overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 #1f2937'
        }}>
          <style dangerouslySetInnerHTML={{
            __html: `
              .overflow-y-auto::-webkit-scrollbar {
                width: 6px;
              }
              .overflow-y-auto::-webkit-scrollbar-track {
                background: #1f2937;
                border-radius: 3px;
              }
              .overflow-y-auto::-webkit-scrollbar-thumb {
                background: #374151;
                border-radius: 3px;
              }
              .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                background: #4b5563;
              }
            `
          }} />
          
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Metas de Ingresos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderInputField({
                  label: "Ingresos Diarios",
                  field: "dailyRevenue",
                  prefix: "$"
                })}
                {renderInputField({
                  label: "Ingresos Semanales",
                  field: "weeklyRevenue",
                  prefix: "$"
                })}
                {renderInputField({
                  label: "Ingresos Mensuales",
                  field: "monthlyRevenue",
                  prefix: "$"
                })}
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Metas de Clientes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderInputField({
                  label: "Clientes Diarios",
                  field: "dailyClients",
                  suffix: "clientes"
                })}
                {renderInputField({
                  label: "Clientes Semanales",
                  field: "weeklyClients",
                  suffix: "clientes"
                })}
                {renderInputField({
                  label: "Clientes Mensuales",
                  field: "monthlyClients",
                  suffix: "clientes"
                })}
                {renderInputField({
                  label: "Clientes Activos (Mensual)",
                  field: "targetActiveClients",
                  suffix: "clientes",
                  description: "Clientes con transacciones en los últimos 30 días"
                })}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <ShoppingCart className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Metas de Transacciones</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderInputField({
                  label: "Transacciones Diarias",
                  field: "dailyTransactions",
                  suffix: "trans."
                })}
                {renderInputField({
                  label: "Transacciones Semanales",
                  field: "weeklyTransactions",
                  suffix: "trans."
                })}
                {renderInputField({
                  label: "Transacciones Mensuales",
                  field: "monthlyTransactions",
                  suffix: "trans."
                })}
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="w-6 h-6 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Metas Generales</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInputField({
                  label: "Ticket Promedio",
                  field: "targetTicketAverage",
                  prefix: "$"
                })}
                {renderInputField({
                  label: "Tasa de Retención (%)",
                  field: "targetRetentionRate",
                  suffix: "%",
                  min: 0
                })}
                {renderInputField({
                  label: "Tasa de Conversión",
                  field: "targetConversionRate",
                  suffix: "%",
                  min: 0
                })}
                {renderInputField({
                  label: "Cliente Top (Mensual)",
                  field: "targetTopClient",
                  prefix: "$"
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Guardando...' : 'Guardar Metas'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
