# 🔗 Sistema de Enlaces de Afiliado para Promotores

## Descripción

El sistema de enlaces de afiliado permite a los promotores rastrear qué invitados llegaron a través de sus enlaces únicos. Cada promotor puede generar un enlace personalizado que incluye su código de referencia.

## Cómo Funciona

### 1. Generar Enlaces de Afiliado

Los enlaces de afiliado se generan automáticamente usando el nombre del promotor como código de referencia:

```
https://lealta.app/evento/[slug-del-evento]?ref=[nombre-del-promotor]
```

**Ejemplo:**
```
https://lealta.app/evento/tecno-GqwPiv?ref=Antonio
```

### 2. Copiar Enlaces desde el Gestor de Promotores

1. Ve a **Reservas** → **Gestión de Promotores**
2. Encuentra al promotor deseado en la lista
3. Haz clic en el botón verde de **Copiar** (📋)
4. El enlace se copiará automáticamente al portapapeles
5. Comparte el enlace con el promotor

### 3. Rastreo de Conversiones

Cuando un invitado se registra a través de un enlace de afiliado:

1. El sistema captura el parámetro `ref` de la URL
2. Busca al promotor correspondiente en la base de datos
3. Vincula el registro del invitado con ese promotor
4. Guarda el código de referencia usado (para análisis)

### 4. Ver Estadísticas

Las conversiones de promotores se pueden ver en:

- **Gestión de Promotores** → pestaña "Estadísticas"
- **Lista de Invitados del Evento** → columna de promotor
- **Reportes de Eventos** → desgloses por promotor

## Campos Agregados a la Base de Datos

### EventGuest

```prisma
model EventGuest {
  // ... campos existentes
  
  // Rastreo de promotores (atribución de enlaces de afiliado)
  promotorId        String?
  referralCode      String?  // El código ref usado (para análisis)
  
  // Relación
  Promotor          Promotor?  @relation("EventGuestPromotor", fields: [promotorId], references: [id])
}
```

### Promotor

```prisma
model Promotor {
  // ... campos existentes
  
  // Nueva relación
  EventGuests EventGuest[]  @relation("EventGuestPromotor")
}
```

## Casos de Uso

### Caso 1: Promotor que Trabaja con Eventos

**Contexto:** Un promotor llamado "Antonio" quiere compartir el enlace de un evento de techno.

**Pasos:**
1. El administrador crea el promotor "Antonio" en el sistema
2. Copia el enlace de afiliado desde el gestor
3. Antonio comparte el enlace en sus redes sociales
4. Los invitados se registran usando ese enlace
5. El sistema registra a Antonio como el promotor que trajo a esos invitados

### Caso 2: Múltiples Promotores para un Mismo Evento

**Contexto:** Un evento tiene 3 promotores: "Instagram", "Facebook", "WhatsApp"

**Pasos:**
1. Se crean los 3 promotores en el sistema
2. Se generan 3 enlaces únicos:
   - `...?ref=Instagram`
   - `...?ref=Facebook`
   - `...?ref=WhatsApp`
3. Cada enlace se usa en el canal correspondiente
4. El sistema rastrea cuántos invitados llegaron por cada canal

### Caso 3: Análisis de Efectividad

**Pregunta:** ¿Qué promotor trae más invitados?

**Respuesta:** Consulta la tabla EventGuest filtrando por evento:

```sql
SELECT 
  p.nombre AS promotor,
  COUNT(eg.id) AS total_invitados,
  COUNT(CASE WHEN eg.status = 'CHECKED_IN' THEN 1 END) AS asistieron
FROM "EventGuest" eg
LEFT JOIN "Promotor" p ON eg."promotorId" = p.id
WHERE eg."eventId" = '[id-del-evento]'
GROUP BY p.nombre
ORDER BY total_invitados DESC;
```

## Notas Técnicas

### Búsqueda de Promotor

El sistema busca promotores usando el nombre exacto (case-insensitive):

```typescript
const promotor = await prisma.promotor.findFirst({
  where: {
    businessId: event.businessId,
    nombre: referralCode, // Nombre del promotor
    activo: true
  }
});
```

### Código de Referencia vs ID de Promotor

- **`referralCode`**: Se guarda tal cual viene en la URL (útil para análisis históricos)
- **`promotorId`**: Se vincula al promotor real encontrado en la BD (útil para relaciones)

Si el promotor se elimina o cambia de nombre después, el `referralCode` preserva la información original.

## Mejoras Futuras

- [ ] Generar códigos de referencia únicos y cortos (ej: `ref=ANT123` en vez de `ref=Antonio`)
- [ ] Dashboard de estadísticas de promotores por evento
- [ ] Enlaces con tracking de UTM parameters
- [ ] API endpoint para generar enlaces programáticamente
- [ ] QR codes personalizados por promotor
- [ ] Comisiones automáticas basadas en conversiones

## Ejemplo de Integración

```typescript
// En el frontend (EventRegistrationPage)
const [referralCode, setReferralCode] = useState<string | null>(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    setReferralCode(ref);
  }
}, []);

// Al registrar invitado
await fetch(`/api/events/${eventId}/guests`, {
  method: 'POST',
  body: JSON.stringify({
    // ... otros campos
    referralCode: referralCode // ✅ Se envía el código
  })
});
```

---

**Implementado:** 2024-01-XX  
**Versión:** 1.0  
**Estado:** ✅ Activo
