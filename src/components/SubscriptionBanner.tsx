'use client';

/**
 * Banner de advertencia de suscripción
 * 
 * Muestra alertas cuando:
 * - El trial está por expirar (≤7 días)
 * - Está en grace period
 * - El trial ya expiró
 * 
 * NO se muestra para:
 * - Usuarios con suscripción activa
 * - Usuarios legacy (sin trial asignado)
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, AlertTriangle, Clock, AlertCircle } from 'lucide-react';

interface SubscriptionAccess {
  hasAccess: boolean;
  status: 'active' | 'trialing' | 'expired' | 'legacy' | 'grace_period';
  daysRemaining: number | null;
  message: string;
  isLegacyUser: boolean;
}

interface SubscriptionBannerProps {
  businessId: string;
}

export default function SubscriptionBanner({ businessId }: SubscriptionBannerProps) {
  const [access, setAccess] = useState<SubscriptionAccess | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const checkSubscription = async () => {
      try {
        const response = await fetch(`/api/subscription/check?businessId=${businessId}`);
        const data = await response.json();

        if (data.success && data.access) {
          setAccess(data.access);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [businessId]);

  // No mostrar si está cargando
  if (loading) return null;

  // No mostrar si no hay datos
  if (!access) return null;

  // No mostrar para usuarios con suscripción activa
  if (access.status === 'active') return null;

  // No mostrar para usuarios legacy
  if (access.isLegacyUser) return null;

  // No mostrar si fue desestimado
  if (dismissed) return null;

  // No mostrar si el trial tiene más de 7 días restantes
  if (
    access.status === 'trialing' &&
    access.daysRemaining !== null &&
    access.daysRemaining > 7
  ) {
    return null;
  }

  // Determinar estilo según el estado
  const getBannerStyle = () => {
    switch (access.status) {
      case 'expired':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-red-600 dark:text-red-400',
        };
      case 'grace_period':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          icon: <AlertTriangle className="w-5 h-5" />,
          iconColor: 'text-orange-600 dark:text-orange-400',
        };
      case 'trialing':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: <Clock className="w-5 h-5" />,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          icon: <Clock className="w-5 h-5" />,
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const style = getBannerStyle();

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${style.bg} border-b ${style.border} shadow-sm`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Icono y mensaje */}
          <div className="flex items-center gap-3 flex-1">
            <div className={style.iconColor}>{style.icon}</div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${style.text}`}>
                {access.message}
              </p>
              {access.daysRemaining !== null && access.daysRemaining > 0 && (
                <p className={`text-xs ${style.text} opacity-80 mt-0.5`}>
                  {access.daysRemaining === 1
                    ? 'Queda 1 día'
                    : `Quedan ${access.daysRemaining} días`}
                </p>
              )}
            </div>
          </div>

          {/* Botón de acción */}
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
            >
              Ver planes
            </Link>

            {/* Botón cerrar (solo si no está expirado) */}
            {access.status !== 'expired' && (
              <button
                onClick={() => setDismissed(true)}
                className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${style.text}`}
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
