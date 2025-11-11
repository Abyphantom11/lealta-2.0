# 🚀 AGREGAR VARIABLE FALTANTE EN VERCEL

## Variable que falta en producción:

```
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

---

## 📋 OPCIÓN 1: Desde la terminal (RÁPIDO)

```powershell
# Agregar a Production
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID production

# Cuando te pregunte el valor, pega:
pri_01k9rf1r9jv9aa3fsjnzf34zkp

# También agregar a Preview y Development (opcional)
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID preview
vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID development
```

---

## 📋 OPCIÓN 2: Desde el Dashboard de Vercel (VISUAL)

### 1. Ve a tu proyecto en Vercel:
```
https://vercel.com/themaster2648-9501s-projects/lealta/settings/environment-variables
```

### 2. Click en "Add New"

### 3. Llena el formulario:

**Name:**
```
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID
```

**Value:**
```
pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

**Environments:** ✅ Selecciona los 3
- [x] Production
- [x] Preview  
- [x] Development

### 4. Click "Save"

---

## 🔄 DESPUÉS DE AGREGAR LA VARIABLE:

### Redeploy para que tome efecto:

```powershell
# Opción A: Desde terminal
vercel --prod --force

# Opción B: Desde dashboard
# Ve a: Deployments → Click en los 3 puntos → Redeploy
```

---

## ✅ VERIFICAR QUE FUNCIONÓ:

Después del deploy, abre tu app en producción y ejecuta en la consola:

```javascript
console.log('Price ID:', process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID);
// Debería mostrar: pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

---

## 🎯 TAMBIÉN NECESITAS AGREGAR (si no están):

Verifica que estas también estén configuradas con los valores correctos:

```env
NEXT_PUBLIC_PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3
```

Si no la tienes, agrégala también:

```powershell
vercel env add NEXT_PUBLIC_PADDLE_PRODUCT_ID production
# Valor: pro_01k9d940v6ppjbh0cknn5xz4t3
```

---

## 📞 COMANDO COMPLETO PARA COPIAR/PEGAR:

```powershell
# 1. Agregar Price ID
echo "pri_01k9rf1r9jv9aa3fsjnzf34zkp" | vercel env add NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID production

# 2. Agregar Product ID
echo "pro_01k9d940v6ppjbh0cknn5xz4t3" | vercel env add NEXT_PUBLIC_PADDLE_PRODUCT_ID production

# 3. Redeploy
vercel --prod --force
```

---

## ⚡ RESUMEN:

**Variable faltante:** `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID`  
**Valor correcto:** `pri_01k9rf1r9jv9aa3fsjnzf34zkp`  
**Dónde:** Vercel Dashboard → Environment Variables  
**Después:** Redeploy con `vercel --prod --force`
