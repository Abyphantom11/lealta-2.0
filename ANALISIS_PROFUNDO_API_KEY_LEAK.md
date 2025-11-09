# 🚨 ANÁLISIS PROFUNDO: Por Qué Tu API Key de Gemini Se Filtra Constantemente

**Fecha**: 9 de noviembre de 2025  
**Investigador**: GitHub Copilot  
**Criticidad**: 🔴 CRÍTICA  

---

## 📊 RESUMEN EJECUTIVO

Tu API key de Gemini se está filtrando **automáticamente cada vez que haces commit**, incluso cuando la acabas de regenerar. Este documento explica **por qué ocurre** y **cómo solucionarlo definitivamente**.

---

## 🔍 HALLAZGOS PRINCIPALES

### 1. ⚠️ Archivos con API Keys en el Repositorio

Se encontraron **2 archivos** con API keys hardcodeadas que **ESTÁN SIENDO COMMITEADOS**:

| Archivo | API Key Expuesta | Estado |
|---------|-----------------|--------|
| `.env.vercel` | `AIzaSyAkSmHtoNHHNAwukPwtJEL5pQ0U7IzAM7k` | ❌ En Git |
| `.env.vercel.production` | `AIzaSyBH__flK-fmkGB2S9vMFSNMtuyIVjdrEOE` | ❌ En Git |

### 2. 📜 Historial Comprometido

```bash
git log --all --full-history -- .env.vercel .env.vercel.production

ce761c7 fix: Correcciones críticas para demo
8faaa1e feat: Mejoras en detección de navegadores  
8df38b3 fix(qr-manager): corregir nombre de relación
f1e02b9 fix: Solucionar error 'can't send empty message'
```

Las API keys están en **múltiples commits** en el historial.

### 3. 🚫 Archivos NO Estaban en .gitignore

```bash
# Verificación
$ git check-ignore .env.vercel
# (vacío - NO está ignorado)

$ git ls-files | grep ".env.vercel"
.env.vercel
.env.vercel.production
```

**Conclusión**: Estos archivos se están trackeando y commitando normalmente.

---

## 🔄 CICLO DE FILTRACIÓN

### Por Qué Se Repite el Problema:

```mermaid
graph LR
    A[Regeneras API Key] --> B[Actualizas .env.vercel]
    B --> C[git add .]
    C --> D[git commit]
    D --> E[git push]
    E --> F[GitHub escanea commit]
    F --> G[GitHub detecta API key]
    G --> H[GitHub notifica a Google]
    H --> I[Google REVOCA la key]
    I --> J[Error 403 Forbidden]
    J --> A
```

### Detalle Técnico:

1. **T+0 min**: Regeneras la key en Google Console
2. **T+1 min**: Actualizas `.env.vercel` con la nueva key
3. **T+2 min**: `git commit -m "update env"` + `git push`
4. **T+3 min**: GitHub ejecuta **Secret Scanning** en el commit
5. **T+3 min**: GitHub detecta patrón: `AIza[0-9A-Za-z_-]{35}`
6. **T+4 min**: GitHub envía notificación a Google (via Partner API)
7. **T+5-60 min**: Google **revoca automáticamente** la key
8. **T+60 min**: Recibes error 403: "Your API key was reported as leaked"

---

## 🛡️ POR QUÉ GITHUB DETECTA LA KEY

### GitHub Secret Scanning

GitHub escanea **automáticamente** todos los commits públicos (y privados en planes Enterprise) buscando:

- ✅ AWS Access Keys
- ✅ Google API Keys (`AIza...`)
- ✅ Stripe Keys
- ✅ OpenAI Keys
- ✅ Y +200 patrones más

**Regex usado para Gemini**:
```regex
AIza[0-9A-Za-z_-]{35}
```

### Partner Program de GitHub

Google es **partner** de GitHub Secret Scanning:
- GitHub detecta → Notifica a Google automáticamente
- Google revoca → Envía email al propietario
- Tiempo: **5-60 minutos** desde el commit

Más info: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning

---

## 🎯 SOLUCIÓN DEFINITIVA

### ✅ FASE 1: Limpieza Inmediata (10 minutos)

```bash
# 1. Actualizar .gitignore
echo ".env.vercel" >> .gitignore
echo ".env.vercel.*" >> .gitignore

# 2. Eliminar del tracking
git rm --cached .env.vercel
git rm --cached .env.vercel.production

# 3. Commit de seguridad
git commit -m "security: Remove leaked API keys from git tracking"
git push origin main

# 4. Revocar keys manualmente en Google Console
# https://console.cloud.google.com/apis/credentials
```

### ✅ FASE 2: Nueva Configuración Segura (15 minutos)

```bash
# 1. Crear nueva API key en Google Console con restricciones:
#    - HTTP referrers: https://lealta.app/*
#    - API restrictions: Solo Gemini API

# 2. Agregar a Vercel (NO a archivos)
npx vercel env add GOOGLE_GEMINI_API_KEY production
# Pegar la nueva key

# 3. Para desarrollo local
echo "GOOGLE_GEMINI_API_KEY=tu-key-local" > .env.local

# 4. Eliminar archivos locales (opcional)
rm .env.vercel .env.vercel.production
```

### ✅ FASE 3: Prevención Futura (30 minutos)

**1. Pre-commit Hook** para detectar secrets:

```bash
# .husky/pre-commit
if git diff --cached | grep -E "AIza[0-9A-Za-z_-]{35}"; then
  echo "❌ API key detectada - Commit bloqueado"
  exit 1
fi
```

**2. Git-secrets**:

```bash
git secrets --install
git secrets --add 'AIza[0-9A-Za-z_-]{35}'
```

**3. Proceso correcto**:
- ✅ API keys → Vercel Dashboard
- ✅ Desarrollo → `.env.local` (gitignored)
- ❌ NUNCA → Archivos commiteados

---

## 📈 MÉTRICAS DEL INCIDENTE

### Exposición Actual:

- **Commits afectados**: 4+ commits
- **API Keys comprometidas**: 2 keys
- **Tiempo de exposición**: Desde commit hasta ahora
- **Accesibilidad**: 🔴 Pública (si el repo es público) o 🟡 Interna (si es privado)

### Impacto:

- ✅ **Bajo**: Si el repo es privado y no hay colaboradores externos
- 🟡 **Medio**: Si hay colaboradores o el repo fue público alguna vez
- 🔴 **Alto**: Si el repo es público

---

## 🧪 VERIFICACIÓN DE LA SOLUCIÓN

### Checklist Post-Remediación:

```bash
# ✅ Archivos NO aparecen en git status
git status | grep ".env.vercel"
# (debe estar vacío)

# ✅ Archivos están ignorados
git check-ignore -v .env.vercel
# .gitignore:XX:.env.vercel    .env.vercel

# ✅ No hay secrets en el repo
grep -r "AIza" . --exclude-dir=node_modules --exclude-dir=.git
# (solo debe aparecer en .env.local o templates)

# ✅ Nueva key funciona
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=NUEVA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
# (debe responder sin 403)
```

---

## 📚 LECCIONES APRENDIDAS

### ❌ Lo Que NO Funciona:

1. Regenerar la key sin eliminarla del repo
2. Poner keys en archivos `.env.vercel` commiteados
3. Confiar en que "nadie verá el repo privado"

### ✅ Lo Que SÍ Funciona:

1. **Nunca** commitear archivos con secrets
2. Usar **Vercel Environment Variables** exclusivamente
3. `.env.local` para desarrollo (gitignored)
4. Pre-commit hooks para validación
5. Restricciones de API key (HTTP referrers + API limits)

---

## 🔗 RECURSOS ADICIONALES

- 📖 [SECURITY_LEAK_FIX.md](./SECURITY_LEAK_FIX.md) - Guía completa de remediación
- 🔧 [fix-security-leak.ps1](./fix-security-leak.ps1) - Script automatizado
- 📋 [.env.vercel.template](./.env.vercel.template) - Plantilla segura

### Enlaces Externos:

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Google API Security Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) (para limpiar historial)

---

## 🎬 CONCLUSIÓN

**Root Cause**: Archivos `.env.vercel` con API keys reales están siendo commiteados al repositorio.

**Why It Repeats**: GitHub detecta automáticamente y notifica a Google, quien revoca la key.

**Solution**: Eliminar archivos del repo, usar solo Vercel Dashboard para producción y `.env.local` para desarrollo.

**Prevention**: Pre-commit hooks, .gitignore correcto, y nunca más commitear secrets.

---

**Estado**: 🛠️ Remediación en progreso  
**Prioridad**: 🔴 P0 - Crítica  
**ETA Resolución**: 25 minutos con el script automatizado
