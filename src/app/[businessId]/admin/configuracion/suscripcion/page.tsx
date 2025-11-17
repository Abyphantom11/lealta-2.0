'use client';

/**
 * Página de gestión de suscripción dentro de Configuración
 * Ruta: /[businessId]/admin/configuracion/suscripcion
 */

import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { usePaddle } from '@/hooks/usePaddle';
import { PADDLE_PRICE_ID_ENTERPRISE } from '@/lib/paddle';
import { 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Receipt,
  ExternalLink,
  Loader2,
  Clock,
  Sparkles,
  PartyPopper
} from 'lucide-react';

interface SubscriptionStatus {
  hasAccess: boolean;
  status: 'active' | 'trialing' | 'expired' | 'legacy' | 'grace_period';
  daysRemaining: number | null;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  subscriptionId?: string | null;
  needsPayment: boolean;
  message: string;
  isLegacyUser: boolean;
}

export default function SuscripcionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const businessId = params.businessId as string;
  const { data: session, status: sessionStatus } = useSession();
  const { createCheckout, openSubscriptionPortal, isLoading: paddleLoading } = usePaddle();
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Detectar pago exitoso
  useEffect(() => {
    const success = searchParams.get('success');
    const paddleTxn = searchParams.get('_ptxn');
    
    if (success === 'true' || paddleTxn) {
      console.log('🎉 Pago exitoso detectado!');
      setShowSuccessMessage(true);
      
      // Ocultar mensaje después de 10 segundos
      setTimeout(() => setShowSuccessMessage(false), 10000);
    }
  }, [searchParams]);

  // Obtener datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('🔍 Obteniendo datos del usuario...');
        const response = await fetch('/api/auth/me');
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Datos del usuario:', data);
          
          // El endpoint devuelve { user: { email, name, ... } }
          const userData = data.user || data;
          setUserEmail(userData.email || '');
          setUserName(userData.name || '');
          
          console.log('📧 Email guardado:', userData.email);
          console.log('👤 Nombre guardado:', userData.name);
        } else {
          console.error('❌ Error obteniendo usuario:', response.status);
          // Intentar usar los datos de la sesión como fallback
          if (session?.user) {
            console.log('🔄 Usando datos de sesión como fallback');
            setUserEmail(session.user.email || '');
            setUserName(session.user.name || '');
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        // Intentar usar los datos de la sesión como fallback
        if (session?.user) {
          console.log('🔄 Usando datos de sesión como fallback después de error');
          setUserEmail(session.user.email || '');
          setUserName(session.user.name || '');
        }
      }
    };

    if (sessionStatus !== 'loading') {
      fetchUserData();
    }
  }, [sessionStatus, session]);

  // Cargar datos de suscripción
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!businessId) return;

      try {
        const response = await fetch(`/api/subscription/check?businessId=${businessId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSubscriptionData(data.access);
          }
        } else {
          console.warn('No se pudo verificar el estado de suscripción (esto es normal si no estás autenticado)');
          // Establecer un estado por defecto para que la página funcione
          setSubscriptionData({
            hasAccess: true,
            status: 'legacy',
            daysRemaining: null,
            trialEndsAt: null,
            subscriptionStatus: null,
            needsPayment: false,
            message: 'Estado de suscripción no disponible',
            isLegacyUser: true,
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Establecer estado por defecto en caso de error
        setSubscriptionData({
          hasAccess: true,
          status: 'legacy',
          daysRemaining: null,
          trialEndsAt: null,
          subscriptionStatus: null,
          needsPayment: false,
          message: 'Estado de suscripción no disponible',
          isLegacyUser: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [businessId]);

  // Manejar suscripción
  const handleSubscribe = async () => {
    console.log('🔵 Iniciando suscripción...');
    console.log('Session:', session);
    console.log('Session Status:', sessionStatus);
    console.log('UserEmail from state:', userEmail);
    console.log('UserEmail from session:', session?.user?.email);
    console.log('BusinessId:', businessId);
    
    // Esperar un momento si los datos aún no están disponibles
    if (!userEmail && !session?.user?.email) {
      console.log('⏳ Esperando datos del usuario...');
      // Esperar 2 segundos para dar tiempo a que carguen los datos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Usar email del estado o de la sesión
    const email = userEmail || session?.user?.email;
    const name = userName || session?.user?.name;
    
    console.log('📧 Email final a usar:', email);
    console.log('👤 Nombre final a usar:', name);
    
    if (!email) {
      alert('⚠️ No se pudo obtener tu información de usuario.\n\nPor favor:\n1. Recarga la página (Ctrl+R)\n2. Si el problema persiste, cierra sesión y vuelve a entrar\n\nO accede desde: https://lealta.app/pricing');
      return;
    }

    // Usar Price ID desde configuración
    const priceId = PADDLE_PRICE_ID_ENTERPRISE;
    console.log('Price ID:', priceId);

    setIsProcessing(true);
    try {
      console.log('🟢 Creando checkout con Paddle...');
      console.log('Email:', email);
      console.log('Name:', name);
      
      await createCheckout({
        priceId: priceId,
        businessId: businessId,
        customerEmail: email,
        customerName: name || 'Usuario',
        successUrl: `${globalThis.location.origin}/${businessId}/admin/configuracion/suscripcion?success=true`,
        cancelUrl: `${globalThis.location.origin}/${businessId}/admin/configuracion/suscripcion`,
      });
      console.log('✅ Checkout creado exitosamente');
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      alert(`Error al iniciar el proceso de pago:\n\n${error instanceof Error ? error.message : 'Error desconocido'}\n\nRevisa la consola (F12) para más detalles.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar apertura del portal de gestión
  const handleManageSubscription = async () => {
    if (!subscriptionData?.subscriptionId) {
      alert('No hay subscription ID disponible');
      return;
    }

    try {
      await openSubscriptionPortal(subscriptionData.subscriptionId);
    } catch (error) {
      console.error('Error opening subscription portal:', error);
      alert('Error al abrir el portal de gestión. Por favor intenta de nuevo.');
    }
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Determinar color y estado según subscription
  const getStatusConfig = () => {
    if (!subscriptionData) return null;

    switch (subscriptionData.status) {
      case 'active':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-600',
          title: '✅ Suscripción Activa',
          description: 'Tu acceso está garantizado',
        };
      case 'trialing':
        return {
          icon: Clock,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-600',
          title: '🎉 Periodo de Prueba',
          description: subscriptionData.message,
        };
      case 'grace_period':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          iconColor: 'text-orange-600',
          title: '⚠️ Periodo de Gracia',
          description: subscriptionData.message,
        };
      case 'expired':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-600',
          title: '❌ Suscripción Expirada',
          description: 'Suscríbete para continuar',
        };
      case 'legacy':
        return {
          icon: CheckCircle,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-600',
          title: '👑 Cliente Preferencial',
          description: 'Acceso completo garantizado',
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="p-6 max-w-5xl">
      {/* Mensaje de Éxito */}
      {showSuccessMessage && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-6 shadow-lg animate-in slide-in-from-top">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <PartyPopper className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 mb-2">
                🎉 ¡Pago Procesado Exitosamente!
              </h3>
              <p className="text-green-700 mb-2">
                Tu suscripción se activará en los próximos minutos. Recibirás una confirmación por email.
              </p>
              <p className="text-sm text-green-600">
                💡 Tip: Puedes cerrar esta página y continuar usando Lealta normalmente.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-600 hover:text-green-800 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Suscripción y Facturación
        </h1>
        <p className="text-gray-600">
          Administra tu plan y métodos de pago
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Estado de Suscripción */}
        {statusConfig && (
          <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-xl p-6`}>
            <div className="flex items-start gap-4 mb-4">
              <div className={`${statusConfig.bgColor} rounded-full p-3`}>
                <statusConfig.icon className={`w-8 h-8 ${statusConfig.iconColor}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {statusConfig.title}
                </h2>
                <p className={`${statusConfig.textColor}`}>
                  {statusConfig.description}
                </p>
              </div>
            </div>

            {/* Días restantes */}
            {subscriptionData?.daysRemaining !== null && subscriptionData.daysRemaining > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">
                    {subscriptionData.daysRemaining === 1 
                      ? 'Queda 1 día' 
                      : `Quedan ${subscriptionData.daysRemaining} días`}
                  </span>
                </div>
              </div>
            )}

            {/* Fecha de expiración */}
            {subscriptionData?.trialEndsAt && (
              <div className="mt-2 text-sm text-gray-600">
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
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-indigo-50 rounded-full p-3">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Plan Enterprise
              </h2>
              <p className="text-gray-600">
                $250 USD/mes por negocio
              </p>
            </div>
          </div>

          <div className="space-y-2 text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Reservas ilimitadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Staff ilimitado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">QR personalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Soporte prioritario</span>
            </div>
          </div>
        </div>

        {/* Acciones - Mostrar siempre */}
        {subscriptionData?.status !== 'active' && (
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🚀 {subscriptionData?.needsPayment ? 'Activa tu Suscripción' : 'Suscríbete a Lealta'}
            </h3>
            <p className="text-gray-700 mb-6">
              {subscriptionData?.needsPayment 
                ? 'Continúa disfrutando de todas las funcionalidades de Lealta sin interrupciones.'
                : 'Suscríbete hoy y asegura tu acceso completo a todas las funcionalidades de Lealta.'
              }
            </p>
            <button
              onClick={handleSubscribe}
              disabled={isProcessing || paddleLoading || (!userEmail && !session?.user?.email)}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                isProcessing || paddleLoading || (!userEmail && !session?.user?.email)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white`}
            >
              {isProcessing || paddleLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </span>
              ) : (!userEmail && !session?.user?.email) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando datos...
                </span>
              ) : (
                'Suscribirme Ahora'
              )}
            </button>
            {(!userEmail && !session?.user?.email) && (
              <p className="text-sm text-amber-600 mt-2">
                ⏳ Cargando tu información de usuario...
              </p>
            )}
          </div>
        )}

        {/* Portal de Facturación de Paddle */}
        {subscriptionData?.status === 'active' && subscriptionData?.subscriptionId && (
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Receipt className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gestionar Suscripción
                  </h3>
                  <p className="text-sm text-gray-600">
                    Actualiza método de pago, ve facturas o cancela tu suscripción
                  </p>
                </div>
              </div>
              <button
                onClick={handleManageSubscription}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors text-sm font-medium"
              >
                Abrir Portal
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ayuda */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          ¿Necesitas ayuda?
        </h3>
        <p className="text-gray-700 mb-4">
          Si tienes problemas con tu suscripción o necesitas asistencia, contáctanos:
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href="mailto:soporte@lealta.com"
            className="text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
          >
            📧 soporte@lealta.com
          </a>
          <a
            href="/pricing"
            target="_blank"
            className="text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
          >
            💰 Ver planes detallados
          </a>
        </div>
      </div>
    </div>
  );
}
