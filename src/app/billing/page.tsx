'use client';

/**
 * Página de gestión de suscripción
 * Ruta: /billing
 * 
 * Permite a los clientes:
 * - Ver estado de suscripción
 * - Suscribirse si no tienen plan
 * - Ver próxima fecha de pago
 * - Acceder a facturas (Paddle Billing Portal)
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePaddle } from '@/hooks/usePaddle';
import { PADDLE_PRICE_ID_ENTERPRISE } from '@/lib/paddle';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Receipt,
  ExternalLink,
  Loader2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface SubscriptionStatus {
  hasAccess: boolean;
  status: 'active' | 'trialing' | 'expired' | 'legacy' | 'grace_period';
  daysRemaining: number | null;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  needsPayment: boolean;
  message: string;
  isLegacyUser: boolean;
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { createCheckout, isLoading: paddleLoading } = usePaddle();
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/billing');
    }
  }, [status, router]);

  // Cargar datos de suscripción
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.businessId) return;

      try {
        const response = await fetch(`/api/subscription/check?businessId=${session.user.businessId}`);
        const data = await response.json();

        if (data.success) {
          setSubscriptionData(data.access);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.businessId) {
      fetchSubscription();
    }
  }, [session]);

  // Manejar suscripción
  const handleSubscribe = async () => {
    if (!session?.user) return;

    setIsProcessing(true);
    try {
      await createCheckout({
        priceId: PADDLE_PRICE_ID_ENTERPRISE,
        businessId: session.user.businessId || '',
        customerEmail: session.user.email || '',
        customerName: session.user.name || '',
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing`,
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al iniciar el proceso de pago. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Estados de carga
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Cargando información de suscripción...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Determinar color y estado según subscription
  const getStatusConfig = () => {
    if (!subscriptionData) return null;

    switch (subscriptionData.status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'green',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          title: '✅ Suscripción Activa',
          description: 'Tu acceso está garantizado',
        };
      case 'trialing':
        return {
          icon: Clock,
          color: 'yellow',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          title: '🎉 Periodo de Prueba',
          description: subscriptionData.message,
        };
      case 'grace_period':
        return {
          icon: AlertTriangle,
          color: 'orange',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          textColor: 'text-orange-400',
          title: '⚠️ Periodo de Gracia',
          description: subscriptionData.message,
        };
      case 'expired':
        return {
          icon: AlertTriangle,
          color: 'red',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          title: '❌ Suscripción Expirada',
          description: 'Suscríbete para continuar',
        };
      case 'legacy':
        return {
          icon: CheckCircle,
          color: 'blue',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-400',
          title: '👑 Cliente Preferencial',
          description: 'Acceso completo garantizado',
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin" 
            className="text-purple-400 hover:text-purple-300 mb-4 inline-block"
          >
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Gestión de Suscripción
          </h1>
          <p className="text-gray-400">
            Administra tu plan y facturación
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
          {/* Estado de Suscripción */}
          {statusConfig && (
            <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-2xl p-6`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`${statusConfig.bgColor} rounded-full p-3`}>
                  <statusConfig.icon className={`w-8 h-8 ${statusConfig.textColor}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">
                    {statusConfig.title}
                  </h2>
                  <p className="text-gray-300">
                    {statusConfig.description}
                  </p>
                </div>
              </div>

              {/* Días restantes */}
              {subscriptionData?.daysRemaining !== null && subscriptionData.daysRemaining > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {subscriptionData.daysRemaining === 1 
                        ? 'Queda 1 día' 
                        : `Quedan ${subscriptionData.daysRemaining} días`}
                    </span>
                  </div>
                </div>
              )}

              {/* Fecha de expiración */}
              {subscriptionData?.trialEndsAt && (
                <div className="mt-2 text-sm text-gray-400">
                  Expira: {new Date(subscriptionData.trialEndsAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          )}

          {/* Plan Actual */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-purple-500/10 rounded-full p-3">
                <CreditCard className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Plan Enterprise
                </h2>
                <p className="text-gray-300">
                  $250 USD/mes por negocio
                </p>
              </div>
            </div>

            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Reservas ilimitadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Staff ilimitado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Soporte prioritario</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {subscriptionData?.needsPayment && (
            <div className="md:col-span-2 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4">
                🚀 Activa tu Suscripción
              </h3>
              <p className="text-gray-300 mb-6">
                Continúa disfrutando de todas las funcionalidades de Lealta sin interrupciones.
              </p>
              <button
                onClick={handleSubscribe}
                disabled={isProcessing || paddleLoading}
                className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  isProcessing || paddleLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                } text-white`}
              >
                {isProcessing || paddleLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  'Suscribirme Ahora'
                )}
              </button>
            </div>
          )}

          {/* Portal de Facturación de Paddle */}
          {subscriptionData?.status === 'active' && (
            <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Receipt className="w-6 h-6 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Facturas y Métodos de Pago
                    </h3>
                    <p className="text-sm text-gray-400">
                      Gestiona tu información de pago en el portal de Paddle
                    </p>
                  </div>
                </div>
                <a
                  href="https://vendors.paddle.com/customers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
                >
                  Abrir Portal
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Ayuda */}
        <div className="mt-12 max-w-5xl bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-gray-300 mb-4">
            Si tienes problemas con tu suscripción o necesitas asistencia, contáctanos:
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:soporte@lealta.com"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              📧 soporte@lealta.com
            </a>
            <Link
              href="/pricing"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              💰 Ver planes y precios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
