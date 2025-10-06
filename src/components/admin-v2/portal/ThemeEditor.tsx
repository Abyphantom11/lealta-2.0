'use client';

import { useState, useEffect } from 'react';
import { Palette, Sparkles, Layers, Check, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemePreview from './ThemePreview';

type ThemeStyle = 'moderno' | 'elegante' | 'sencillo';

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  nameColor?: string;
}

interface ThemeEditorProps {
  businessId: string;
  currentTheme?: ThemeStyle;
  onThemeChange?: (theme: ThemeStyle) => void;
}

export default function ThemeEditor({ 
  businessId, 
  currentTheme = 'moderno',
  onThemeChange 
}: ThemeEditorProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeStyle>(currentTheme);
  const [savedTheme, setSavedTheme] = useState<ThemeStyle>(currentTheme);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primaryColor: '#3b82f6',    // azul
    secondaryColor: '#10b981',  // verde
    accentColor: '#8b5cf6',     // púrpura
    nameColor: '#ec4899',       // rosa
  });
  const [savedConfig, setSavedConfig] = useState<ThemeConfig>(themeConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const hasChanges = selectedTheme !== savedTheme || JSON.stringify(themeConfig) !== JSON.stringify(savedConfig);

  // Cargar configuración actual al montar
  useEffect(() => {
    const loadCurrentConfig = async () => {
      try {
        const response = await fetch(`/api/business/${businessId}/client-theme`);
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setThemeConfig(data.config);
            setSavedConfig(data.config);
          }
        }
      } catch (error) {
        console.error('Error loading theme config:', error);
      }
    };
    loadCurrentConfig();
  }, [businessId]);

  const handleThemeSelect = (theme: ThemeStyle) => {
    setSelectedTheme(theme);
    setSaveMessage('');
  };

  const handleColorChange = (key: keyof ThemeConfig, value: string) => {
    setThemeConfig(prev => ({ ...prev, [key]: value }));
    setSaveMessage('');
  };

  const handleSaveTheme = async () => {
    setIsLoading(true);
    setSaveMessage('');
    
    try {
      if (onThemeChange) {
        await onThemeChange(selectedTheme);
      }
      
      // Guardar tema y configuración en la base de datos
      const response = await fetch(`/api/business/${businessId}/client-theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme: selectedTheme,
          config: themeConfig,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar el tema');

      setSavedTheme(selectedTheme);
      setSavedConfig(themeConfig);
      setSaveMessage('✓ Tema guardado correctamente');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving theme:', error);
      setSaveMessage('✗ Error al guardar el tema');
    } finally {
      setIsLoading(false);
    }
  };

  const themes = [
    {
      id: 'moderno' as ThemeStyle,
      name: 'Moderno',
      icon: Sparkles,
      description: 'Vibrante y dinámico',
      colors: {
        primary: 'from-indigo-600 via-purple-600 to-pink-600',
        secondary: 'from-green-600 to-emerald-600',
        accent: 'from-purple-600 to-pink-600',
      },
      preview: {
        bg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
        text: 'text-white',
        badge: 'bg-white/20',
      },
      features: [
        'Gradientes vibrantes',
        'Animaciones fluidas',
        'Efectos de blur',
        'Colores tech y modernos',
      ],
    },
    {
      id: 'elegante' as ThemeStyle,
      name: 'Elegante',
      icon: Palette,
      description: 'Sofisticado y premium',
      colors: {
        primary: 'from-slate-900 via-slate-800 to-slate-900',
        accent: 'from-amber-600 to-amber-500',
        border: 'border-amber-500/30',
      },
      preview: {
        bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 border border-amber-500/30',
      },
      features: [
        'Tonos oscuros mate',
        'Acentos dorados',
        'Glass morphism',
        'Estilo premium/luxury',
      ],
    },
    {
      id: 'sencillo' as ThemeStyle,
      name: 'Sencillo',
      icon: Layers,
      description: 'Limpio y personalizable',
      colors: {
        primary: 'bg-white',
        accent: 'bg-blue-500',
        border: 'border-blue-500',
      },
      preview: {
        bg: 'bg-white border-2 border-blue-500',
        text: 'text-blue-600',
        badge: 'bg-blue-50 border border-blue-200',
      },
      features: [
        'Diseño flat y limpio',
        'Sin gradientes',
        'Colores editables',
        'Alta legibilidad',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Palette className="w-12 h-12 mx-auto mb-4 text-primary-500" />
        <h4 className="text-lg font-semibold text-white mb-2">
          Gestor de Temas Visuales
        </h4>
        <p className="text-dark-400 mb-4">
          Personaliza el aspecto del portal de tus clientes. Los cambios se aplican instantáneamente.
        </p>
      </div>

      {/* Theme Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = selectedTheme === theme.id;

          return (
            <motion.button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all text-left
                ${isSelected 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1 z-10">
                  <Check className="w-4 h-4" />
                </div>
              )}

              {/* Icon and Name */}
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-500' : 'text-dark-400'}`} />
                <div>
                  <h5 className="text-white font-semibold text-sm">{theme.name}</h5>
                  <p className="text-xs text-dark-400">{theme.description}</p>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-1 text-xs text-dark-300 mb-2">
                {theme.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-start gap-1">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span className="line-clamp-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={handleSaveTheme}
            disabled={isLoading}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                saveMessage.includes('✓') 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {saveMessage}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Color Customization for ALL themes */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <h5 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-500" />
          Personalización de Colores
        </h5>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Color del Nombre del Cliente */}
          <div className="space-y-2">
            <label className="text-sm text-dark-300 block">
              Color del Nombre
            </label>
            <div className="relative">
              <input
                type="color"
                value={themeConfig.nameColor || '#ec4899'}
                onChange={(e) => handleColorChange('nameColor', e.target.value)}
                className="w-full h-12 rounded-lg border-2 border-dark-600 cursor-pointer bg-dark-700"
                title="Seleccionar color del nombre"
              />
            </div>
            <p className="text-xs text-dark-400">
              Solo el nombre
            </p>
          </div>

          {/* Conditional: Show additional colors only for "sencillo" theme */}
          {selectedTheme === 'sencillo' && (
            <>
              {/* Color Primario */}
              <div className="space-y-2">
                <label className="text-sm text-dark-300 block">Color Primario</label>
                <div className="relative">
                  <input
                    type="color"
                    value={themeConfig.primaryColor || '#3b82f6'}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-full h-12 rounded-lg border-2 border-dark-600 cursor-pointer bg-dark-700"
                    title="Seleccionar color primario"
                  />
                </div>
                <p className="text-xs text-dark-400">Balance</p>
              </div>

              {/* Color Secundario */}
              <div className="space-y-2">
                <label className="text-sm text-dark-300 block">Color Secundario</label>
                <div className="relative">
                  <input
                    type="color"
                    value={themeConfig.secondaryColor || '#10b981'}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-full h-12 rounded-lg border-2 border-dark-600 cursor-pointer bg-dark-700"
                    title="Seleccionar color secundario"
                  />
                </div>
                <p className="text-xs text-dark-400">Promociones</p>
              </div>

              {/* Color de Acento */}
              <div className="space-y-2">
                <label className="text-sm text-dark-300 block">Color de Acento</label>
                <div className="relative">
                  <input
                    type="color"
                    value={themeConfig.accentColor || '#8b5cf6'}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-full h-12 rounded-lg border-2 border-dark-600 cursor-pointer bg-dark-700"
                    title="Seleccionar color de acento"
                  />
                </div>
                <p className="text-xs text-dark-400">Recompensas</p>
              </div>
            </>
          )}
        </div>

        {selectedTheme !== 'sencillo' && (
          <p className="mt-4 text-sm text-dark-400 bg-dark-700 p-3 rounded-lg">
            💡 Los temas <strong className="text-white">Moderno</strong> y <strong className="text-white">Elegante</strong> utilizan colores predefinidos. 
            Solo el color del nombre es editable. Para personalizar más colores, selecciona el tema <strong className="text-white">Sencillo</strong>.
          </p>
        )}
      </div>

      {/* Live Preview Section */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h5 className="text-white font-semibold">Vista Previa en Tiempo Real</h5>
          <span className="text-xs text-dark-400 ml-auto capitalize">
            Tema: {selectedTheme}
          </span>
        </div>
        
        <div className="bg-black rounded-lg p-4 overflow-hidden">
          <ThemePreview theme={selectedTheme} previewConfig={themeConfig} />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <h5 className="text-white font-medium mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          Tema Actual: <span className="text-primary-500 capitalize">{selectedTheme}</span>
        </h5>
        <p className="text-sm text-dark-400">
          {selectedTheme === 'moderno' && 'Estilo vibrante y tech. Perfecto para negocios modernos y dinámicos.'}
          {selectedTheme === 'elegante' && 'Estilo sofisticado con tonos dorados. Ideal para negocios premium y exclusivos.'}
          {selectedTheme === 'sencillo' && 'Estilo limpio y personalizable. Perfecto para negocios locales con identidad propia.'}
        </p>
        
        {selectedTheme === 'sencillo' && (
          <div className="mt-3 pt-3 border-t border-dark-700">
            <p className="text-xs text-dark-400 mb-2">
              💡 En el tema "Sencillo" podrás personalizar los colores según tu marca en una futura actualización.
            </p>
          </div>
        )}
      </div>

      {/* Save Status */}
      {isLoading && (
        <div className="text-center text-sm text-dark-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
          Guardando tema...
        </div>
      )}
    </div>
  );
}
