# 🚨 EJECUCIÓN RÁPIDA - Fix de API Key Filtrada

**TIEMPO ESTIMADO**: 10 minutos  
**CRITICIDAD**: 🔴 URGENTE

---

## 🎯 PROBLEMA EN 1 LÍNEA

Tus archivos `.env.vercel` y `.env.vercel.production` están en el repositorio Git con las API keys, por eso cada vez que las regeneras, GitHub las detecta y Google las revoca automáticamente.

---

## ⚡ SOLUCIÓN RÁPIDA (Copia y pega)

### 1️⃣ Ejecutar Script Automático (RECOMENDADO)

```powershell
# En PowerShell en la raíz del proyecto:
.\fix-security-leak.ps1
```

**O hacer manual:**

### 2️⃣ Pasos Manuales

```bash
# A. Actualizar .gitignore
echo "" >> .gitignore
echo ".env.vercel" >> .gitignore  
echo ".env.vercel.*" >> .gitignore

# B. Eliminar del tracking de Git
git rm --cached .env.vercel
git rm --cached .env.vercel.production

# C. Commit
git commit -m "security: Remove leaked API keys from git"

# D. Push
git push origin main
```

### 3️⃣ Revocar Keys Antiguas

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Busca y **elimina** estas keys (ya están comprometidas):
   - La que termina en `...EOM7k`
   - La que termina en `...rEOE`

### 4️⃣ Crear Nueva Key SEGURA

1. En Google Console → **Create Credentials** → **API Key**
2. Click en **Restrict Key**:
   - ✅ **Application restrictions**: HTTP referrers (web sites)
   - Agrega: `https://lealta.app/*`
   - Agrega: `https://*.vercel.app/*`
   - ✅ **API restrictions**: Restrict key → Generative Language API
3. **Save** y copia la nueva key

### 5️⃣ Agregar a Vercel (NO a archivos)

**Opción A - Dashboard (más fácil)**:
1. https://vercel.com/tu-proyecto/settings/environment-variables
2. **Add New**:
   - Name: `GOOGLE_GEMINI_API_KEY`
   - Value: `tu-nueva-key-aqui`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

**Opción B - CLI**:
```bash
npx vercel env add GOOGLE_GEMINI_API_KEY production
# Pegar la key cuando te la pida
```

### 6️⃣ Desarrollo Local (Opcional)

```bash
# Solo si desarrollas localmente
echo "GOOGLE_GEMINI_API_KEY=tu-key-para-dev-local" > .env.local
```

### 7️⃣ Limpiar Archivos Locales (Opcional)

```bash
# Ya no los necesitas
rm .env.vercel
rm .env.vercel.production
```

---

## ✅ VERIFICACIÓN

```bash
# Debe estar vacío (archivos ya no están en git)
git status | grep ".env.vercel"

# Debe mostrar que están ignorados
git check-ignore -v .env.vercel

# Test de la nueva key
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=TU_NUEVA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'

# Debe responder sin error 403
```

---

## 🚫 QUÉ NO HACER

- ❌ NO regeneres la key sin seguir estos pasos primero
- ❌ NO pongas la nueva key en archivos `.env.vercel`
- ❌ NO hagas commit de archivos con la key
- ❌ NO uses la misma key si ya salió en un commit

---

## 📊 RESUMEN ANTES/DESPUÉS

### ❌ ANTES (Inseguro):
```
.env.vercel (con API key) → git commit → git push 
→ GitHub detecta → Google revoca → Error 403
```

### ✅ DESPUÉS (Seguro):
```
API Key → Solo en Vercel Dashboard
Desarrollo local → .env.local (gitignored)
Git → Sin secrets
```

---

## 🆘 SI ALGO FALLA

1. **Error al hacer git rm**: Los archivos ya no están trackeados (está bien)
2. **Error 403 persiste**: Espera 5 minutos y redeploy en Vercel
3. **No puedes eliminar la key**: Ya fue revocada (está bien)

---

## 📖 MÁS INFORMACIÓN

- [ANALISIS_PROFUNDO_API_KEY_LEAK.md](./ANALISIS_PROFUNDO_API_KEY_LEAK.md) - Análisis completo
- [SECURITY_LEAK_FIX.md](./SECURITY_LEAK_FIX.md) - Guía detallada

---

**¿Todo listo?** → Ejecuta `.\fix-security-leak.ps1` y sigue las instrucciones 🚀
