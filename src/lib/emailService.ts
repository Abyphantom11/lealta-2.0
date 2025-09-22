// ========================================
// � EMAIL SERVICE - PREPARADO PARA FUTURO
// ========================================
// Funcionalidad de emails desactivada temporalmente
// Se implementará post-producción con Resend o servicio similar

// Configuración base para cuando se active
export const EMAIL_CONFIG = {
  from: {
    hello: `lealta <${process.env.RESEND_FROM_EMAIL}>`,
    noReply: `lealta <${process.env.RESEND_NO_REPLY_EMAIL}>`,
    trials: `lealta Trials <${process.env.RESEND_TRIALS_EMAIL}>`,
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'lealta',
};

// Tipos para futuro uso
export type EmailType = 
  | 'email-verification'
  | 'welcome'
  | 'password-reset'
  | 'trial-welcome'
  | 'trial-reminder'
  | 'trial-expired'
  | 'business-registered'
  | 'staff-invitation'
  | 'loyalty-level-up'
  | 'promotional';

export interface EmailData {
  to: string | string[];
  type: EmailType;
  data: Record<string, any>;
}

// 🚫 FUNCIÓN SIMULADA - EMAILS DESACTIVADOS TEMPORALMENTE
export async function sendEmail({ to, type, data }: EmailData) {
  console.log('� Email simulado (función desactivada):', { 
    to: Array.isArray(to) ? to.join(', ') : to,
    type, 
    data: Object.keys(data).join(', ')
  });
  
  // Simular éxito para no romper flujos existentes
  return { 
    success: true,
    data: { id: `sim_${Date.now()}` }, 
    error: null 
  };
}

// Utilidades básicas que sí se usan
export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generateSecureToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// � TODO POST-PRODUCCIÓN:
// - Integrar Resend o servicio de email preferido
// - Implementar templates HTML responsivos
// - Configurar webhooks para eventos de email
// - Añadir sistema de colas para envío masivo
// - Implementar métricas de entrega y apertura
