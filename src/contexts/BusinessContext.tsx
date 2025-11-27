'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BusinessContextType {
  businessId: string | null;
  businessSlug: string | null;
  businessName: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

interface BusinessProviderProps {
  children: ReactNode;
  initialSlug: string;
}

export function BusinessProvider({ children, initialSlug }: BusinessProviderProps) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(initialSlug);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusiness = async () => {
    if (!initialSlug) {
      setError('No business slug provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 BusinessContext: Resolving business...', initialSlug);

      // SINGLE SOURCE: Una sola API que resuelve todo
      const response = await fetch(`/api/business/resolve/${initialSlug}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Business not found or access denied');
      }

      const data = await response.json();

      console.log('✅ BusinessContext: Business resolved', {
        id: data.id,
        name: data.name,
      });

      setBusinessId(data.id);
      setBusinessSlug(data.slug);
      setBusinessName(data.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('❌ BusinessContext error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug]);

  const value: BusinessContextType = {
    businessId,
    businessSlug,
    businessName,
    isLoading,
    error,
    refresh: loadBusiness,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext(): BusinessContextType {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusinessContext must be used within BusinessProvider');
  }
  return context;
}

/**
 * Hook opcional que no lanza error si no hay BusinessProvider
 * Útil para componentes que pueden estar fuera del contexto
 */
export function useOptionalBusinessContext(): BusinessContextType | null {
  const context = useContext(BusinessContext);
  return context ?? null;
}
