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
        const response = await fetch(`/api/business/${businessId}/client-theme`);
        
        if (response.ok) {
          const data = await response.json();
          setThemeState(data.theme || 'moderno');
          setThemeConfigState(data.config || {});
        } else {
          console.error('ThemeProvider: Error loading theme:', await response.text());
        }
      } catch (error) {
        console.error('ThemeProvider: Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      fetchTheme();
    } else {
      setIsLoading(false);
    }
  }, [businessId]);

  const setTheme = (newTheme: ThemeStyle) => {
    setThemeState(newTheme);
  };

  const setThemeConfig = (newConfig: ThemeConfig) => {
    setThemeConfigState(newConfig);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, setThemeConfig, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
