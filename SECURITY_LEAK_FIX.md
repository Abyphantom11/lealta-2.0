# 🚨 SEGURIDAD CRÍTICA: API Keys Filtradas en Git

## ❌ PROBLEMA DETECTADO

Tus API keys de Gemini se están filtrando **automáticamente** cada vez que haces commit porque:

### Archivos con API Keys en el Repositorio:
1. `.env.vercel` - **PÚBLICAMENTE ACCESIBLE**
2. `.env.vercel.production` - **PÚBLICAMENTE ACCESIBLE**

### API Keys Expuestas:
- `AIzaSyBH__flK-fmkGB2S9vMFSNMtuyIVjdrEOE` (en `.env.vercel.production`)
- `AIzaSyAkSmHtoNHHNAwukPwtJEL5pQ0U7IzAM7k` (en `.env.vercel`)

### Commits con las Keys:
```
ce761c7 fix: Correcciones críticas para demo
8faaa1e feat: Mejoras en detección de navegadores
8df38b3 fix(qr-manager): corregir nombre de relación
f1e02b9 fix: Solucionar error 'can't send empty message'
```

## 🔍 Por Qué Ocurre

### Ciclo Vicioso:
1. 🔑 Regeneras API key en Google Console
2. ✏️ Actualizas `.env.vercel` con la nueva key
3. 💾 Haces `git commit` y `git push`
4. 🤖 **GitHub escanea el commit y detecta la API key**
5. 📧 GitHub notifica a Google automáticamente
6. 🚫 **Google revoca la key en minutos/horas**
7. 🔄 Repites el ciclo...

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Revocar Keys Actuales Manualmente

Todas las keys en el historial ya están comprometidas:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Revoca/elimina AMBAS keys:
   - `AIzaSyBH__flK-fmkGB2S9vMFSNMtuyIVjdrEOE`
   - `AIzaSyAkSmHtoNHHNAwukPwtJEL5pQ0U7IzAM7k`

### PASO 2: Agregar Archivos al .gitignore

```bash
# Agregar a .gitignore
echo "" >> .gitignore
echo "# ⚠️ NUNCA commitear archivos con credenciales reales" >> .gitignore
echo ".env.vercel" >> .gitignore
echo ".env.vercel.*" >> .gitignore
echo "*.env.local" >> .gitignore
```

### PASO 3: Eliminar Archivos del Repositorio

```bash
# Eliminar del tracking de git (pero mantener localmente)
git rm --cached .env.vercel
git rm --cached .env.vercel.production

# Commit la eliminación
git commit -m "security: Remove .env files with leaked credentials from git tracking"
git push origin main
```

### PASO 4: Limpiar Historial de Git (OPCIONAL - AVANZADO)

⚠️ **ADVERTENCIA**: Esto reescribe el historial. Solo si el repo es privado o no tiene colaboradores.

```bash
# Usar BFG Repo-Cleaner o git-filter-repo
# Ver: https://rtyley.github.io/bfg-repo-cleaner/

# Alternativa: git filter-branch (más lento)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.vercel .env.vercel.production" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

### PASO 5: Crear Nueva API Key SEGURA

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Crea una **nueva** API key
3. **Configura restricciones**:
   - ✅ **Application restrictions**: HTTP referrers
   - Agrega tus dominios:
     - `https://lealta.app/*`
     - `https://*.lealta.app/*`
     - `https://*.vercel.app/*` (solo si usas previews)
   - ✅ **API restrictions**: Solo Gemini API
4. Copia la key

### PASO 6: Configurar en Vercel DIRECTAMENTE

**NUNCA más en archivos locales:**

```bash
# Método 1: Via CLI de Vercel
npx vercel env add GOOGLE_GEMINI_API_KEY production
# Pega la key cuando te la pida

npx vercel env add GOOGLE_GEMINI_API_KEY preview
# Pega la key cuando te la pida

# Método 2: Via Dashboard de Vercel
```

1. Ve a: https://vercel.com/tu-proyecto/settings/environment-variables
2. Add New Variable:
   - **Name**: `GOOGLE_GEMINI_API_KEY`
   - **Value**: `tu-nueva-api-key-segura`
   - **Environment**: Production, Preview, Development

### PASO 7: Configuración Local SEGURA

Crea `.env.local` (ya está en .gitignore):

```bash
# .env.local (NUNCA commitear)
GOOGLE_GEMINI_API_KEY="tu-nueva-api-key-solo-para-desarrollo-local"
```

### PASO 8: Verificar que NO se Filtre

```bash
# Verificar que los archivos están ignorados
git status

# No deberías ver .env.vercel ni .env.vercel.production

# Verificar .gitignore
cat .gitignore | Select-String "\.env"
```

## 🛡️ PREVENCIÓN FUTURA

### 1. Pre-commit Hook

Instala un hook que detecte secrets antes de commitear:

```bash
npm install --save-dev @commitlint/cli husky lint-staged
```

Crea `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Buscar patrones de API keys
if git diff --cached | grep -E "(AIza[0-9A-Za-z_-]{35}|sk-[a-zA-Z0-9]{48})"; then
  echo "❌ ERROR: API key detectada en el commit"
  echo "🚫 Commit bloqueado por seguridad"
  exit 1
fi
```

### 2. Git-secrets (GitHub)

```bash
# Instalar git-secrets
git secrets --install
git secrets --register-aws
git secrets --add 'AIza[0-9A-Za-z_-]{35}'
```

### 3. GitHub Secret Scanning

Si tu repo es privado, habilita:
- Settings → Security → Secret scanning
- Settings → Security → Push protection

### 4. Vercel Environment Variables ONLY

**REGLA DE ORO**:
- ✅ API keys en Vercel Dashboard
- ✅ API keys en `.env.local` (gitignored)
- ❌ NUNCA en archivos commiteados

## 🔍 MONITOREO

### Verificar que la Nueva Key Funciona:

```bash
# Test local
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=TU_NUEVA_KEY"

# Debería responder sin error 403
```

### Logs de Vercel:

1. Despliega: `vercel --prod`
2. Monitorea: `vercel logs --follow`
3. Busca: "Error fetching from generativelanguage.googleapis.com"

## 📊 CHECKLIST COMPLETO

- [ ] ✅ Revocar keys antiguas en Google Console
- [ ] ✅ Agregar `.env.vercel*` a `.gitignore`
- [ ] ✅ `git rm --cached .env.vercel .env.vercel.production`
- [ ] ✅ Commit y push de la eliminación
- [ ] ✅ Crear nueva API key en Google Console
- [ ] ✅ Configurar restricciones en la API key
- [ ] ✅ Agregar key a Vercel via Dashboard/CLI
- [ ] ✅ Crear `.env.local` para desarrollo (gitignored)
- [ ] ✅ Eliminar archivos `.env.vercel*` locales
- [ ] ✅ Verificar que no hay secrets en `git status`
- [ ] ✅ Test de la nueva configuración
- [ ] ✅ Monitorear que no haya error 403
- [ ] ⚠️ (Opcional) Limpiar historial con BFG Repo-Cleaner

## 🚀 RESULTADO ESPERADO

### Antes:
```
❌ API key en archivos commitados
❌ GitHub detecta y notifica a Google
❌ Google revoca la key automáticamente
❌ Error 403 Forbidden
```

### Después:
```
✅ API key solo en Vercel Environment Variables
✅ API key solo en .env.local (gitignored)
✅ No hay secrets en el repositorio
✅ GitHub no puede detectarla
✅ Google no la revoca
✅ Gemini funciona perfectamente
```

## 🆘 SI TODO FALLA

### Plan B: API Key Management Service

Considera usar servicios de gestión de secrets:
- **Vercel KV** para secrets
- **HashiCorp Vault**
- **AWS Secrets Manager**
- **Google Secret Manager**

## 📞 SOPORTE

Si después de seguir estos pasos TODAVÍA se filtra la key:

1. Verifica que el repo es privado
2. Revisa que `.gitignore` funciona: `git check-ignore -v .env.vercel`
3. Busca otros archivos: `grep -r "AIza" .`
4. Contacta a GitHub Support

---

**Fecha**: 9 de noviembre de 2025
**Criticidad**: 🔴 CRÍTICA
**Estado**: 🛠️ EN REMEDIACIÓN
