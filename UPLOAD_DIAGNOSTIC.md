# 🚨 DIAGNÓSTICO CRÍTICO: SISTEMA UPLOAD ROTO

## 📋 **ANÁLISIS DEL PROBLEMA:**

**Síntomas reportados:**
- ❌ No se pueden subir imágenes
- ❌ Sistema de edición no funciona
- ❌ Vista previa del portal/branding rota
- ❌ Banner diario no funciona
- ❌ Favorito del día no funciona
- ❌ Hooks y APIs desincronizados

## 🔍 **COMPONENTES AFECTADOS:**

### **1. Sistema de Upload de Imágenes:**
- `BrandingManager` - Carrusel de imágenes
- `BannersManager` - Banners diarios  
- `ProductModal` - Imágenes de productos
- `useImageUpload` - Hook unificado
- `/api/admin/upload` - API de upload

### **2. Flujo Admin/Cliente:**
- Página admin: `/[businessId]/admin`
- Portal cliente: Vista previa y funcionamiento
- APIs de administración protegidas

## 🎯 **POSIBLES CAUSAS:**

### **A. Migración de Uploaders (más probable)**
1. **Cambios en autenticación** → APIs de upload sin acceso
2. **Rutas de API modificadas** → Endpoints no encontrados
3. **Middleware de auth roto** → Requests bloqueados
4. **FormData o headers incorrectos** → Upload fallan silenciosamente

### **B. Sesión/Auth desincronizado**
1. **Cookies de sesión** → Perdidas o inválidas
2. **BusinessId validation** → Fallos en validación
3. **Permisos de rol** → Restricciones incorrectas

### **C. Estado del hook useImageUpload**
1. **Error handling** → Errores silenciosos
2. **FormData construction** → Malformed requests  
3. **Response parsing** → Errores de JSON

## 🔧 **PLAN DE DIAGNÓSTICO:**

### **Paso 1: Verificar API de Upload**
```bash
# Test directo del endpoint
curl -X POST /api/admin/upload \
  -H "Cookie: session=[SESSION]" \
  -F "file=@test.jpg"
```

### **Paso 2: Verificar Sesión Admin**
- Abrir DevTools → Application → Cookies
- Verificar cookie `session` existe y es válida
- Verificar que el usuario tiene permisos admin

### **Paso 3: Verificar Console Errors**
- Abrir DevTools → Console
- Buscar errores de:
  - Fetch API calls
  - Authentication failures
  - CORS errors
  - JSON parsing errors

### **Paso 4: Verificar Network Tab**
- DevTools → Network
- Filtrar por "upload" o "admin"
- Ver status codes de requests
- Verificar headers y response

## 🚨 **ACCIONES INMEDIATAS:**

### **1. Test de API Admin:**
```javascript
// En console del navegador
fetch('/api/admin/upload', {
  method: 'POST',
  body: new FormData()
}).then(r => console.log(r.status))
```

### **2. Test de Sesión:**
```javascript
// En console del navegador
document.cookie.includes('session')
```

### **3. Test de useImageUpload:**
- Abrir BrandingManager
- Intentar upload
- Ver errores en console

## 📝 **LOGS ESPERADOS:**

### **✅ Funcionando:**
```
🔒 AUTH: Protecting POST /api/admin/upload
📁 File upload request by: admin (userId)
✅ Service Worker registrado
```

### **❌ Roto:**
```
❌ AUTH DENIED: No session cookie
❌ Error registrando Service Worker
❌ Upload failed: [ERROR_MESSAGE]
```

---

**Siguiente paso**: Ejecutar diagnóstico en DevTools y reportar resultados específicos.

*Estado*: 🚨 **DIAGNÓSTICO EN PROGRESO**  
*Prioridad*: **CRÍTICA - SISTEMA CORE ROTO**
