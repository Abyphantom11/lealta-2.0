'use client';

import { useState } from 'react';

/**
 * 🔗 Payment Link Simple para Paddle
 * 
 * Solución temporal para evitar 403
 * Usa tu Price ID directamente
 */

interface PaddlePaymentButtonProps {
  priceId: string;
  businessId?: string;
  customerEmail?: string;
  customerName?: string;
  buttonText?: string;
  className?: string;
}

export default function PaddlePaymentButton({
  priceId,
  businessId,
  customerEmail,
  customerName,
  buttonText = 'Subscribe Now',
  className = '',
}: PaddlePaymentButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsRedirecting(true);
    setError(null);

    try {
      // 🎯 OPCIÓN 1: Llamar a API para crear checkout
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          businessId,
          customerEmail,
          customerName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear checkout');
      }

      const { checkoutUrl } = await response.json();
      
      console.log('✅ Checkout URL recibida:', checkoutUrl);
      
      // Redirigir al checkout
      globalThis.location.href = checkoutUrl;

    } catch (err) {
      console.error('❌ Error generando payment link:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      alert(`Error al procesar el pago: ${errorMessage}\n\nInténtalo de nuevo.`);
      setIsRedirecting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRedirecting}
      className={className || `
        px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 
        text-white font-semibold rounded-lg 
        hover:from-emerald-600 hover:to-cyan-600 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
      `}
    >
      {isRedirecting ? 'Redirigiendo...' : buttonText}
    </button>
  );
}

/**
 * 🎯 EJEMPLO DE USO:
 * 
 * <PaddlePaymentButton
 *   priceId="pri_01k9d95qvht02dqzvkw0h5876p"
 *   businessId={business.id}
 *   customerEmail={user.email}
 *   buttonText="Subscribe to Enterprise - $250/month"
 * />
 */
