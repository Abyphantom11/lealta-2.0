// import { Resend } from 'resend'; // 🚫 TEMPORALMENTE DESACTIVADO

// Inicializar Resend
// const resend = new Resend(process.env.RESEND_API_KEY); // 🚫 TEMPORALMENTE DESACTIVADO

// Configuración de emails
export const EMAIL_CONFIG = {
  from: {
    hello: `lealta <${process.env.RESEND_FROM_EMAIL}>`,
    noReply: `lealta <${process.env.RESEND_NO_REPLY_EMAIL}>`,
    trials: `lealta Trials <${process.env.RESEND_TRIALS_EMAIL}>`,
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'lealta',
};

// Tipos de email
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

// Interface para datos de email
export interface EmailData {
  to: string | string[];
  type: EmailType;
  data: Record<string, any>;
}

// Función principal para enviar emails - 🚫 TEMPORALMENTE DESACTIVADO
export async function sendEmail({ to, type, data }: EmailData) {
  console.log('🚫 Email temporalmente desactivado:', { to, type, data });
  return { 
    data: { id: 'temp-disabled' }, 
    error: null 
  };
  
  // try {
  //   const template = getEmailTemplate(type, data);
    
  //   const result = await resend.emails.send({
  //     from: template.from,
  //     to: Array.isArray(to) ? to : [to],
  //     subject: template.subject,
  //     html: template.html,
  //     text: template.text,
  //   });

  //   console.log(`✅ Email ${type} enviado exitosamente:`, result);
  //   return { success: true, data: result };
  // } catch (error) {
  //   console.error(`❌ Error enviando email ${type}:`, error);
  //   return { success: false, error };
  // }
}

// Generar código de verificación
export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generar token seguro
export function generateSecureToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Obtener template de email según tipo
function getEmailTemplate(type: EmailType, data: Record<string, any>) {
  const templates = {
    'email-verification': {
      from: EMAIL_CONFIG.from.noReply,
      subject: `🔐 Código de verificación - ${EMAIL_CONFIG.appName}`,
      html: getEmailVerificationHTML(data as { code: string; businessName?: string; expiresIn?: string }),
      text: getEmailVerificationText(data as { code: string; businessName?: string; expiresIn?: string }),
    },
    'welcome': {
      from: EMAIL_CONFIG.from.hello,
      subject: `🎉 ¡Bienvenido a ${EMAIL_CONFIG.appName}!`,
      html: getWelcomeHTML(data as { businessName: string; adminName: string; loginUrl?: string }),
      text: getWelcomeText(data as { businessName: string; adminName: string; loginUrl?: string }),
    },
    'password-reset': {
      from: EMAIL_CONFIG.from.noReply,
      subject: `🔑 Restablecer contraseña - ${EMAIL_CONFIG.appName}`,
      html: getPasswordResetHTML(data),
      text: getPasswordResetText(data),
    },
    'trial-welcome': {
      from: EMAIL_CONFIG.from.trials,
      subject: `🚀 ¡Tu prueba gratuita de 14 días ha comenzado!`,
      html: getTrialWelcomeHTML(data as { businessName: string; adminName: string; trialDays: number; dashboardUrl?: string }),
      text: getTrialWelcomeText(data as { businessName: string; adminName: string; trialDays: number; dashboardUrl?: string }),
    },
    'trial-reminder': {
      from: EMAIL_CONFIG.from.trials,
      subject: `⏰ Tu prueba gratuita expira pronto`,
      html: getTrialReminderHTML(data),
      text: getTrialReminderText(data),
    },
    'trial-expired': {
      from: EMAIL_CONFIG.from.trials,
      subject: `📋 Tu prueba gratuita ha expirado`,
      html: getTrialExpiredHTML(data),
      text: getTrialExpiredText(data),
    },
    'business-registered': {
      from: EMAIL_CONFIG.from.hello,
      subject: `🏢 Empresa registrada exitosamente en ${EMAIL_CONFIG.appName}`,
      html: getBusinessRegisteredHTML(data),
      text: getBusinessRegisteredText(data),
    },
    'staff-invitation': {
      from: EMAIL_CONFIG.from.hello,
      subject: `👥 Invitación para unirte al equipo`,
      html: getStaffInvitationHTML(data),
      text: getStaffInvitationText(data),
    },
    'loyalty-level-up': {
      from: EMAIL_CONFIG.from.hello,
      subject: `🎊 ¡Has subido de nivel en tu tarjeta de lealtad!`,
      html: getLoyaltyLevelUpHTML(data),
      text: getLoyaltyLevelUpText(data),
    },
    'promotional': {
      from: EMAIL_CONFIG.from.hello,
      subject: data.subject || `🎁 Oferta especial de ${EMAIL_CONFIG.appName}`,
      html: getPromotionalHTML(data),
      text: getPromotionalText(data),
    },
  };

  return templates[type];
}

// ========================================
// 🎨 TEMPLATES HTML - DISEÑO PREMIUM
// ========================================

function getEmailVerificationHTML(data: { code: string; businessName?: string; expiresIn?: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Código de Verificación</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white;">🔐 Verificación de Email</h1>
          <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.9; color: white;">Confirma tu dirección de correo electrónico</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 32px;">
          <p style="font-size: 16px; line-height: 1.6; color: #e5e5e5; margin: 0 0 24px 0;">
            ${data.businessName ? `Hola, equipo de <strong>${data.businessName}</strong>!` : 'Hola!'}
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #e5e5e5; margin: 0 0 32px 0;">
            Para completar tu registro en <strong>Lealta</strong>, por favor usa el siguiente código de verificación:
          </p>

          <!-- Código de verificación -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">
              ${data.code}
            </div>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #a1a1a1; margin: 24px 0 0 0; text-align: center;">
            Este código expira en ${data.expiresIn || '10 minutos'}. Si no solicitaste este código, puedes ignorar este email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #111; padding: 24px 32px; border-top: 1px solid #333; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            © 2025 Lealta. Plataforma de inteligencia comercial.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">
            <a href="${EMAIL_CONFIG.appUrl}" style="color: #3b82f6; text-decoration: none;">lealta.app</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getEmailVerificationText(data: { code: string; businessName?: string; expiresIn?: string }) {
  return `
Verificación de Email - Lealta

${data.businessName ? `Hola, equipo de ${data.businessName}!` : 'Hola!'}

Para completar tu registro en Lealta, usa este código de verificación:

CÓDIGO: ${data.code}

Este código expira en ${data.expiresIn || '10 minutos'}.

Si no solicitaste este código, puedes ignorar este email.

---
Lealta - Plataforma de inteligencia comercial
${EMAIL_CONFIG.appUrl}
  `;
}

function getWelcomeHTML(data: { businessName: string; adminName: string; loginUrl?: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bienvenido a lealta</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: white;">🎉 ¡Bienvenido a lealta!</h1>
          <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.9; color: white;">Tu plataforma de inteligencia comercial está lista</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 32px;">
          <p style="font-size: 18px; line-height: 1.6; color: #e5e5e5; margin: 0 0 24px 0;">
            Hola <strong>${data.adminName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #e5e5e5; margin: 0 0 24px 0;">
            ¡Felicitaciones! Tu empresa <strong>${data.businessName}</strong> ha sido registrada exitosamente en Lealta.
          </p>

          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 16px 0; color: #10b981; font-size: 18px;">🚀 ¿Qué sigue?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #e5e5e5;">
              <li style="margin-bottom: 8px;">Configura tu sistema de tarjetas de lealtad</li>
              <li style="margin-bottom: 8px;">Personaliza el portal de tus clientes</li>
              <li style="margin-bottom: 8px;">Agrega a tu equipo de trabajo</li>
              <li style="margin-bottom: 8px;">Comienza a registrar consumos</li>
            </ul>
          </div>

          ${data.loginUrl ? `
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Acceder a tu Dashboard
            </a>
          </div>
          ` : ''}

          <p style="font-size: 14px; line-height: 1.6; color: #a1a1a1; margin: 24px 0 0 0;">
            Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte a transformar tu negocio!
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #111; padding: 24px 32px; border-top: 1px solid #333; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            © 2025 Lealta. Plataforma de inteligencia comercial.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getWelcomeText(data: { businessName: string; adminName: string; loginUrl?: string }) {
  return `
¡Bienvenido a lealta!

Hola ${data.adminName},

¡Felicitaciones! Tu empresa ${data.businessName} ha sido registrada exitosamente en Lealta.

¿Qué sigue?
• Configura tu sistema de tarjetas de lealtad
• Personaliza el portal de tus clientes  
• Agrega a tu equipo de trabajo
• Comienza a registrar consumos

${data.loginUrl ? `Accede a tu dashboard: ${data.loginUrl}` : ''}

Si tienes alguna pregunta, estamos aquí para ayudarte.

---
Lealta - Plataforma de inteligencia comercial
${EMAIL_CONFIG.appUrl}
  `;
}

// Placeholder functions para otros templates (implementaremos según necesidad)
function getPasswordResetHTML(_data: any) { return `<p>Password reset HTML template</p>`; }
function getPasswordResetText(_data: any) { return `Password reset text template`; }
function getTrialWelcomeHTML(data: { businessName: string; adminName: string; trialDays: number; dashboardUrl?: string }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>¡Tu prueba gratuita ha comenzado!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: white;">🚀 ¡Tu prueba ha comenzado!</h1>
          <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.9; color: white;">Tienes ${data.trialDays} días para explorar Lealta</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 32px;">
          <p style="font-size: 18px; line-height: 1.6; color: #e5e5e5; margin: 0 0 24px 0;">
            Hola <strong>${data.adminName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #e5e5e5; margin: 0 0 24px 0;">
            ¡Excelente! Tu empresa <strong>${data.businessName}</strong> ahora tiene acceso completo a Lealta por ${data.trialDays} días completamente gratis.
          </p>

          <div style="background: #1f2937; border-radius: 12px; padding: 24px; margin: 32px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 16px 0; color: #f59e0b; font-size: 18px;">🎯 Qué puedes hacer ahora:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #e5e5e5;">
              <li style="margin-bottom: 8px;">✅ Configurar tu sistema de tarjetas de lealtad</li>
              <li style="margin-bottom: 8px;">🎨 Personalizar el portal de tus clientes</li>
              <li style="margin-bottom: 8px;">👥 Agregar a tu equipo de trabajo</li>
              <li style="margin-bottom: 8px;">📊 Registrar consumos y generar reportes</li>
              <li style="margin-bottom: 8px;">🤖 Usar el OCR para procesar tickets</li>
              <li style="margin-bottom: 8px;">📧 Configurar notificaciones automáticas</li>
            </ul>
          </div>

          ${data.dashboardUrl ? `
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Ir a mi Dashboard
            </a>
          </div>
          ` : ''}

          <div style="background: #374151; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h4 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 16px;">💡 Consejo Pro:</h4>
            <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.5;">
              Comienza registrando algunos clientes y configura al menos una categoría de tarjeta. 
              ¡En menos de 30 minutos tendrás tu sistema funcionando!
            </p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #a1a1a1; margin: 24px 0 0 0;">
            ¿Necesitas ayuda? Responde a este email y nuestro equipo te ayudará a sacar el máximo provecho de tu prueba.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #111; padding: 24px 32px; border-top: 1px solid #333; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            © 2025 Lealta. Plataforma de inteligencia comercial.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">
            Tu prueba expira el: <strong>${new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getTrialWelcomeText(data: { businessName: string; adminName: string; trialDays: number; dashboardUrl?: string }) {
  return `
¡Tu prueba gratuita ha comenzado! - Lealta

Hola ${data.adminName},

¡Excelente! Tu empresa ${data.businessName} ahora tiene acceso completo a Lealta por ${data.trialDays} días completamente gratis.

Qué puedes hacer ahora:
✅ Configurar tu sistema de tarjetas de lealtad
🎨 Personalizar el portal de tus clientes
👥 Agregar a tu equipo de trabajo
📊 Registrar consumos y generar reportes
🤖 Usar el OCR para procesar tickets
📧 Configurar notificaciones automáticas

${data.dashboardUrl ? `Accede a tu dashboard: ${data.dashboardUrl}` : ''}

Consejo Pro: Comienza registrando algunos clientes y configura al menos una categoría de tarjeta. ¡En menos de 30 minutos tendrás tu sistema funcionando!

Tu prueba expira el: ${new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}

¿Necesitas ayuda? Responde a este email y nuestro equipo te ayudará.

---
Lealta - Plataforma de inteligencia comercial
${EMAIL_CONFIG.appUrl}
  `;
}
function getTrialReminderHTML(_data: any) { return `<p>Trial reminder HTML template</p>`; }
function getTrialReminderText(_data: any) { return `Trial reminder text template`; }
function getTrialExpiredHTML(_data: any) { return `<p>Trial expired HTML template</p>`; }
function getTrialExpiredText(_data: any) { return `Trial expired text template`; }
function getBusinessRegisteredHTML(_data: any) { return `<p>Business registered HTML template</p>`; }
function getBusinessRegisteredText(_data: any) { return `Business registered text template`; }
function getStaffInvitationHTML(_data: any) { return `<p>Staff invitation HTML template</p>`; }
function getStaffInvitationText(_data: any) { return `Staff invitation text template`; }
function getLoyaltyLevelUpHTML(_data: any) { return `<p>Loyalty level up HTML template</p>`; }
function getLoyaltyLevelUpText(_data: any) { return `Loyalty level up text template`; }
function getPromotionalHTML(_data: any) { return `<p>Promotional HTML template</p>`; }
function getPromotionalText(_data: any) { return `Promotional text template`; }
