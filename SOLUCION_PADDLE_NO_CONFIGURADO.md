# 🔧 SOLUCIÓN: "Paddle no configurado"

## 🎯 PROBLEMA IDENTIFICADO

El mensaje que estás viendo:
```
⚠️ Error con Paddle:
Paddle no configurado. Necesitas crear una cuenta en Paddle Sandbox primero.
```

**NO es un error real de Paddle.** Es un mensaje de tu app porque detecta que **falta la variable `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` en producción**.

---

## ✅ SOLUCIÓN

Necesitas agregar **2 variables públicas** en Vercel que faltan:

### 1️⃣ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN

```bash
vercel env add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN production
```

**Valor:**
```
test_d1946aec331b76469f5b5eab70b
```

### 2️⃣ NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID

```bash
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID production
```

**Valor:**
```
pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

---

## 🚀 DESPUÉS DE AGREGAR LAS VARIABLES

**Hacer redeploy:**

```bash
vercel --prod --force
```

---

## 📋 ALTERNATIVA: Desde el Dashboard de Vercel

1. Ve a: https://vercel.com/tu-proyecto/settings/environment-variables

2. Agrega las 2 variables:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | `test_d1946aec331b76469f5b5eab70b` | Production, Preview, Development |
| `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` | `pri_01k9rf1r9jv9aa3fsjnzf34zkp` | Production, Preview, Development |

3. Redeploy desde: Deployments → "..." → Redeploy

---

## 🎓 ¿POR QUÉ PASA ESTO?

Las variables `NEXT_PUBLIC_*` son especiales en Next.js:
- Se **embeben en el código del navegador** durante el build
- **Deben estar en Vercel** antes del deploy
- Un redeploy es **obligatorio** después de agregarlas

---

## ✅ DESPUÉS DEL REDEPLOY

El mensaje desaparecerá y verás:
- ✅ Paddle se inicializa correctamente
- ✅ El overlay de checkout se abre
- ✅ Puedes procesar pagos de prueba

---

¿Quieres que te ayude a agregarlas por terminal? 🚀
