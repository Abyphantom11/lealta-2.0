# 📧 Template: Solicitar Acceso a Paddle Sandbox

## Para: Paddle Support

Copia y pega este mensaje para solicitar acceso a Sandbox:

---

**Email:** support@paddle.com  
**Subject:** Request Sandbox Access for Development

---

**Mensaje:**

```
Hello Paddle Support Team,

I have a verified LIVE account but cannot access the Sandbox environment for development and testing.

Account Details:
- Email: [TU_EMAIL_DE_LA_CUENTA_LIVE]
- Company: [TU_EMPRESA/NOMBRE]
- Current Status: Live account verified and active

Issue:
When I try to access https://sandbox-vendors.paddle.com/ I get a 403 error on login.
I need Sandbox access to:
- Test my Paddle integration before going live
- Develop and debug my checkout implementation
- Test webhook endpoints locally

Could you please enable Sandbox access for my account?

Thanks!
[TU_NOMBRE]
```

---

## 📞 Otras Formas de Contactar

### 1. Chat en Vivo (Más Rápido)
1. Ve a: https://www.paddle.com/
2. Scroll abajo, busca el **chat widget** (esquina inferior derecha)
3. Click y di: "Need Sandbox access for development"

### 2. Desde tu Dashboard LIVE
1. Ve a: https://vendors.paddle.com/
2. Loguéate
3. Busca el **ícono de ayuda** (?, Help, Support)
4. Abre un ticket: "Request Sandbox Access"

### 3. Twitter/X
A veces responden rápido en redes:
- Twitter: @PaddleHQ
- Mensaje: "Need help getting Sandbox access for development @PaddleHQ"

---

## ⏱️ Tiempo de Respuesta Esperado

- **Chat en vivo:** Respuesta inmediata (si están en horario)
- **Email:** 24-48 horas
- **Ticket:** 24-72 horas

---

## 🚀 MIENTRAS TANTO: Desarrollo Sin Sandbox

Puedes seguir desarrollando tu aplicación sin acceso completo a Paddle. Aquí hay opciones:

### Opción 1: Desarrolla la UI primero
- Crea los componentes de pricing
- Diseña el flujo de checkout
- Prepara la UX de suscripción
- Deja los handlers vacíos por ahora

### Opción 2: Mock de Paddle (Simulación)
Crea una versión simulada para seguir desarrollando:

```typescript
// src/lib/paddle-mock.ts
export const mockPaddle = {
  Checkout: {
    open: (options: any) => {
      console.log('🎭 MOCK: Paddle checkout abierto con:', options);
      // Simula éxito después de 2 segundos
      setTimeout(() => {
        if (options.eventCallback) {
          options.eventCallback({
            name: 'checkout.completed',
            data: {
              transaction_id: 'txn_mock_123',
              status: 'completed',
            }
          });
        }
      }, 2000);
    }
  }
};
```

### Opción 3: Usa Stripe temporalmente
Stripe tiene setup inmediato sin restricciones de Sandbox.
¿Quieres que te ayude a configurarlo como plan B?

---

## 📝 Checklist Mientras Esperas

- [ ] Email enviado a support@paddle.com
- [ ] Ticket abierto desde el dashboard
- [ ] Intentado chat en vivo
- [ ] Desarrollando UI de pricing/checkout
- [ ] Preparando webhooks handlers
- [ ] Documentando flujo de suscripción

---

## ✅ Una Vez Que Tengas Acceso

Cuando Paddle te dé acceso a Sandbox:

1. Recibirás un email de confirmación
2. Podrás acceder a: https://sandbox-vendors.paddle.com/
3. Sigue la guía: `GUIA_RAPIDA_PADDLE_SANDBOX.md`
4. Crea productos, precios y obtén tokens
5. ¡Actualiza tu `.env` y a probar! 🚀

---

## 💡 Tip Pro

Cuando escribas a Paddle, menciona:
- "I'm developing a SaaS application" (les gusta eso)
- "Need to test integration before processing real payments"
- "My live account is verified and ready"

Esto acelera el proceso porque entienden que eres serio y no solo curioseando.
