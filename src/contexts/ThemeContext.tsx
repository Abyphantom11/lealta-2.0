'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeStyle = 'moderno' | 'elegante' | 'sencillo';

export interface ThemeConfig {
  // Configuración personalizable para tema "sencillo"
  primaryColor?: string;      // Color principal (ej: '#3b82f6' - azul)
  secondaryColor?: string;    // Color secundario (ej: '#10b981' - verde)
  accentColor?: string;       // Color de acento (ej: '#8b5cf6' - púrpura)
  nameColor?: string;         // Color del nombre del cliente
}

interface ThemeContextValue {
  theme: ThemeStyle;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeStyle) => void;
  setThemeConfig: (config: ThemeConfig) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'moderno',
  themeConfig: {},
  setTheme: () => {},
  setThemeConfig: () => {},
  isLoading: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
  businessId: string;
  initialTheme?: ThemeStyle;
}

export function ThemeProvider({ children, businessId, initialTheme = 'moderno' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeStyle>(initialTheme);
  const [themeConfig, setThemeConfigState] = useState<ThemeConfig>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar el tema del negocio desde la API
    const fetchTheme = async () => {
      try {
        console.log('🎨 ThemeProvider: Cargando tema para businessId:', businessId);
        const response = await fetch(`/api/business/${businessId}/client-theme`);
        console.log('🎨 ThemeProvider: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🎨 ThemeProvider: Tema recibido:', data.theme);
          console.log('🎨 ThemeProvider: Config recibida:', data.config);
          setThemeState(data.theme || 'moderno');
          setThemeConfigState(data.config || {});
        } else {
          console.error('🎨 ThemeProvider: Error response:', await response.text());
        }
      } catch (error) {
        console.error('🎨 ThemeProvider: Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      fetchTheme();
    } else {
      console.warn('🎨 ThemeProvider: No businessId provided');
      setIsLoading(false);
    }
  }, [businessId]);

  const setTheme = (newTheme: ThemeStyle) => {
    console.log('🎨 ThemeProvider: Tema cambiado localmente a:', newTheme);
    setThemeState(newTheme);
  };

  const setThemeConfig = (newConfig: ThemeConfig) => {
    console.log('🎨 ThemeProvider: Config cambiada localmente a:', newConfig);
    setThemeConfigState(newConfig);
  };

  console.log('🎨 ThemeProvider: Renderizando con tema:', theme, 'isLoading:', isLoading);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, setThemeConfig, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
