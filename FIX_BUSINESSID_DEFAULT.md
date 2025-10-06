# 🔧 Fix: businessId "default" → businessId Real

## 🐛 Problema Identificado

El sistema estaba intentando usar `businessId = "default"` que **no existe en la base de datos**, causando errores 404:

```
❌ Error: {"error":"Negocio no encontrado","businessId":"default"}
```

### Causa Raíz:
1. El `businessId` hardcoded original `"cmfr2y0ia0000eyvw7ef3k20u"` **no existe** en la BD
2. El único business en la BD es **"momo"** con ID `"cmgewmtue0000eygwq8taawak"`
3. Los componentes tenían `businessId = 'default'` como fallback

---

## ✅ Solución Implementada

### 1. **Verificar Business ID Existente**

**Script:** `verify-business-id.js`
```javascript
// Verificó que el business real es:
- Nombre: "momo"
- ID: "cmgewmtue0000eygwq8taawak"
- Tema: "moderno"
```

### 2. **Actualizar Portal Cliente** (`src/app/cliente/page.tsx`)

**Antes:**
```typescript
const businessId = "cmfr2y0ia0000eyvw7ef3k20u"; // ❌ No existe
```

**Después:**
```typescript
const businessId = "cmgewmtue0000eygwq8taawak"; // ✅ Business "momo"
```

### 3. **Actualizar AuthHandler** (`src/app/cliente/components/AuthHandler.tsx`)

**Cambio 1: Obtener businessId del contexto**
```typescript
// Antes
export default function AuthHandler({ businessId }: ...) {
  const { brandingConfig } = useBranding();

// Después
export default function AuthHandler({ businessId: propBusinessId }: ...) {
  const { brandingConfig, businessId: contextBusinessId } = useBranding();
  const businessId = propBusinessId || contextBusinessId || 'cmgewmtue0000eygwq8taawak';
```

**Cambio 2: Validar businessId antes de hacer fetch**
```typescript
// Antes
const configBusinessId = businessId || 'default'; // ❌ Causa el error

// Después
if (!businessId || businessId === 'default') {
  console.warn('⚠️ businessId no válido');
  setPortalConfig(getDefaultPortalConfig());
  return;
}
const configResponse = await fetch(`/api/portal/config-v2?businessId=${businessId}`);
```

### 4. **Actualizar PortalContent** (`src/components/admin-v2/portal/PortalContent.tsx`)

**Agregado estado para businessId:**
```typescript
const [currentBusinessId, setCurrentBusinessId] = useState<string>('cmgewmtue0000eygwq8taawak');
```

**Pasar businessId a PortalContentManager:**
```typescript
<PortalContentManager
  // ...otros props
  businessId={currentBusinessId} // ✅ NUEVO
/>
```

### 5. **Actualizar PortalContentManager** (`src/components/admin-v2/portal/PortalContentManager.tsx`)

**Cambio 1: Default businessId válido**
```typescript
// Antes
businessId = 'default', // ❌

// Después
businessId = 'cmgewmtue0000eygwq8taawak', // ✅ Business "momo"
```

**Cambio 2: Validación mejorada**
```typescript
const loadCurrentTheme = useCallback(async () => {
  if (!businessId || businessId === 'default') {
    console.warn('⚠️ businessId no válido');
    setIsLoadingTheme(false);
    return;
  }
  // ...cargar tema
}, [businessId]);
```

---

## 🔄 Flujo Corregido

### Portal Cliente:
```mermaid
page.tsx
  ↓ businessId="cmgewmtue0000eygwq8taawak"
BrandingProvider
  ↓ businessId en contexto
ThemeProvider
  ↓ GET /api/business/[id]/client-theme ✅
AuthHandler
  ↓ GET /api/portal/config-v2?businessId=... ✅
Dashboard con tema correcto
```

### Portal Admin:
```mermaid
PortalContent.tsx
  ↓ currentBusinessId="cmgewmtue0000eygwq8taawak"
PortalContentManager
  ↓ GET /api/business/[id]/client-theme ✅
ThemeEditor
  ↓ POST /api/business/[id]/client-theme ✅
Tema guardado en BD
```

---

## 🧪 Verificación

### 1. Verificar Business en BD:
```bash
node verify-business-id.js
```

**Output esperado:**
```
✅ Business encontrado:
   ID: cmgewmtue0000eygwq8taawak
   Nombre: momo
   Tema: moderno
```

### 2. Probar Portal Cliente:
1. Ir a `/cliente`
2. Ya NO debe haber errores 404
3. Debe cargar el tema guardado
4. BalanceCard debe mostrar con el tema correcto

### 3. Probar Portal Admin:
1. Ir a `/admin` → Portal Cliente → Vista Previa
2. Ya NO debe haber errores 404
3. Debe mostrar tema actual
4. Cambiar tema debe guardar correctamente

---

## 📊 Endpoints Verificados

| Endpoint | Status | businessId |
|----------|--------|------------|
| `/api/portal/config-v2` | ✅ 200 | cmgewmtue0000eygwq8taawak |
| `/api/business/[id]/client-theme` GET | ✅ 200 | cmgewmtue0000eygwq8taawak |
| `/api/business/[id]/client-theme` POST | ✅ 200 | cmgewmtue0000eygwq8taawak |

---

## 🎯 Resultado

### Antes:
```
❌ Error 404: Business "default" no encontrado
❌ Error 404: Business "cmfr2y0ia0000eyvw7ef3k20u" no encontrado
❌ Portal cliente no carga
❌ Temas no funcionan
```

### Después:
```
✅ businessId correcto: "cmgewmtue0000eygwq8taawak"
✅ Portal cliente carga correctamente
✅ Temas se guardan y aplican
✅ Sincronización admin ↔ cliente funcionando
```

---

## 📝 Archivos Modificados

1. ✅ `src/app/cliente/page.tsx` - businessId correcto
2. ✅ `src/app/cliente/components/AuthHandler.tsx` - validación y contexto
3. ✅ `src/components/admin-v2/portal/PortalContent.tsx` - estado businessId
4. ✅ `src/components/admin-v2/portal/PortalContentManager.tsx` - default correcto
5. ✅ `verify-business-id.js` - script de verificación

---

## 🚀 Próximos Pasos

### Para Producción:
1. **Obtener businessId de la URL** en lugar de hardcoded:
```typescript
// src/app/[businessId]/cliente/page.tsx
export default function ClientePage({ params }: { params: { businessId: string } }) {
  return (
    <BrandingProvider businessId={params.businessId}>
      {/* ... */}
    </BrandingProvider>
  );
}
```

2. **Multi-tenant routing**:
```
/[businessSlug]/cliente → Resolve slug → businessId
/admin → Use session businessId
```

3. **Validación de businessId**:
- Middleware que verifique que el business existe
- Redirect a 404 si no existe

---

**Fecha:** 6 de Octubre, 2025
**Estado:** ✅ Corregido y funcional
**Business actual:** momo (cmgewmtue0000eygwq8taawak)
