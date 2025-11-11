# 📋 VARIABLES DE PADDLE NECESARIAS EN VERCEL

## ✅ CREDENCIALES (Autenticación)

Estas son las que acabas de actualizar:

```
✅ PADDLE_API_KEY (Backend)
   Valor: pdl_sdbx_apikey_01k9rr27zz3xd1m55ap4e80942_xWYP9thgfQEpzhSRJWMKMy_A0E

✅ PADDLE_CLIENT_TOKEN (Backend)
   Valor: test_d1946aec331b76469f5b5eab70b

✅ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN (Frontend - MUY IMPORTANTE)
   Valor: test_d1946aec331b76469f5b5eab70b
```

---

## ⚠️ PRICE ID (CRÍTICO - FALTA AGREGAR)

Esta variable le dice a Paddle **QUÉ producto cobrar**:

```
❌ NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID (Frontend)
   Valor: pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

**Sin esta variable, tu app NO sabrá qué precio usar para el checkout.**

---

## 🎯 OTRAS VARIABLES NECESARIAS

```
✅ PADDLE_WEBHOOK_SECRET (Backend)
   Valor: ntfset_01k9rf9t8ta8tdd06q1vgk2qex
   (Si no la regeneraste, usa la misma)

✅ PADDLE_VENDOR_ID (Backend)
   Valor: 257347
   (Este no cambia)

✅ NEXT_PUBLIC_PADDLE_ENVIRONMENT (Frontend)
   Valor: sandbox
```

---

## 📊 PRODUCT ID (OPCIONAL)

```
⚪ NEXT_PUBLIC_PADDLE_PRODUCT_ID
   Valor: pro_01k9d940v6ppjbh0cknn5xz4t3
   Uso: Opcional, solo para referencia
```

**No es crítico**, pero es bueno tenerlo para debugging.

---

## 🚨 VARIABLE MÁS IMPORTANTE QUE FALTA

**NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID**

Esta es la que causa que tu checkout NO funcione. Sin ella, cuando el usuario intenta pagar, el código no sabe qué Price ID enviar a Paddle.

---

## ⚡ AGREGAR AHORA EN VERCEL:

```bash
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID production
# Valor: pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

También agrégala para Preview y Development:

```bash
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID preview
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID development
```

---

## 📋 CHECKLIST COMPLETO DE VARIABLES EN VERCEL:

```
Backend (privadas):
✅ PADDLE_API_KEY
✅ PADDLE_CLIENT_TOKEN
✅ PADDLE_WEBHOOK_SECRET
✅ PADDLE_VENDOR_ID
✅ PADDLE_PLAN_ENTERPRISE_ID (opcional)

Frontend (públicas - NEXT_PUBLIC_*):
✅ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
❌ NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID  ← FALTA ESTA
✅ NEXT_PUBLIC_PADDLE_ENVIRONMENT
⚪ NEXT_PUBLIC_PADDLE_PRODUCT_ID (opcional)
```

---

## 🎯 RESUMEN:

**Preguntaste:** "Solo esas dos APIs cierto? product y price no son necesarios?"

**Respuesta:**
- ✅ API Key y Client Token = **CREDENCIALES** (ya agregadas)
- ❌ Price ID = **CRÍTICO** - Le dice a Paddle qué cobrar (FALTA)
- ⚪ Product ID = **OPCIONAL** - Solo para referencia

**SIN EL PRICE ID, EL CHECKOUT NO FUNCIONARÁ** porque el código no sabrá qué precio usar.

---

## 🚀 ACCIÓN INMEDIATA:

Agrega el Price ID en Vercel:

```bash
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID production
```

Valor: `pri_01k9rf1r9jv9aa3fsjnzf34zkp`

Luego redeploy:

```bash
vercel --prod --force
```

---

¿Quieres que te ayude a agregarlo ahora? 🎯
