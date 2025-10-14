# Módulo de Reservas - Documento de Requerimientos

## Introducción

El módulo de reservas es un sistema integral para gestionar reservaciones de eventos/espacios, reemplazando el proceso manual actual basado en Excel. El sistema permitirá crear perfiles de reserva, generar códigos QR únicos para el control de acceso, y realizar seguimiento en tiempo real de la asistencia.

## Requerimientos

### Requerimiento 1

**Historia de Usuario:** Como administrador de reservas, quiero crear una nueva reserva con todos los datos del cliente, para tener un registro completo y organizado de la reservación.

#### Criterios de Aceptación

1. CUANDO el administrador acceda al módulo de reservas ENTONCES el sistema DEBERÁ mostrar un formulario para crear nueva reserva
2. CUANDO se complete el formulario de reserva ENTONCES el sistema DEBERÁ guardar: nombre del cliente, número de personas, razón de la visita, beneficios de reserva, y promotor
3. CUANDO se guarde una reserva ENTONCES el sistema DEBERÁ generar automáticamente un ID único para la reserva
4. CUANDO se cree una reserva ENTONCES el sistema DEBERÁ validar que todos los campos obligatorios estén completos

### Requerimiento 2

**Historia de Usuario:** Como administrador de reservas, quiero generar un código QR único para cada reserva, para que el cliente pueda compartirlo con sus invitados y controlar el acceso.

#### Criterios de Aceptación

1. CUANDO se cree una reserva ENTONCES el sistema DEBERÁ generar automáticamente un código QR único
2. CUANDO se genere el QR ENTONCES el sistema DEBERÁ asociarlo permanentemente con la reserva específica
3. CUANDO se muestre el QR ENTONCES el sistema DEBERÁ permitir descargarlo o imprimirlo
4. CUANDO se escanee el QR ENTONCES el sistema DEBERÁ identificar la reserva correspondiente

### Requerimiento 3

**Historia de Usuario:** Como cliente con reserva, quiero compartir el código QR con mis invitados, para que puedan acceder al evento de manera controlada.

#### Criterios de Aceptación

1. CUANDO el cliente reciba el QR ENTONCES el sistema DEBERÁ permitir compartirlo por diferentes medios (WhatsApp, email, etc.)
2. CUANDO un invitado escanee el QR ENTONCES el sistema DEBERÁ registrar +1 a la asistencia de esa reserva
3. CUANDO se escanee el QR ENTONCES el sistema DEBERÁ mostrar información básica de la reserva (nombre, evento)
4. CUANDO se alcance el límite de personas ENTONCES el sistema DEBERÁ notificar que la reserva está completa

### Requerimiento 4

**Historia de Usuario:** Como personal de acceso, quiero usar un scanner QR integrado en la aplicación para registrar la entrada de invitados de manera rápida y eficiente.

#### Criterios de Aceptación

1. CUANDO acceda al módulo scanner ENTONCES el sistema DEBERÁ activar automáticamente la cámara del dispositivo
2. CUANDO se detecte un QR válido ENTONCES el sistema DEBERÁ incrementar automáticamente el contador de asistencia en +1
3. CUANDO se registre una entrada ENTONCES el sistema DEBERÁ mostrar confirmación visual con: nombre de reserva, personas actuales vs. reservadas
4. CUANDO se complete el escaneo ENTONCES el sistema DEBERÁ proporcionar feedback visual/sonoro de éxito
5. IF el QR es inválido o expirado THEN el sistema DEBERÁ mostrar mensaje de error claro sin registrar entrada
6. CUANDO se use en móvil ENTONCES el sistema DEBERÁ permitir alternar entre cámara frontal y trasera
7. CUANDO se escanee exitosamente ENTONCES el sistema DEBERÁ mantener el scanner activo para el siguiente QR

### Requerimiento 5

**Historia de Usuario:** Como administrador de reservas, quiero editar los datos de una reserva existente, para manejar cambios de última hora en la información.

#### Criterios de Aceptación

1. WHEN el administrador seleccione una reserva THEN el sistema DEBERÁ mostrar todos los datos editables
2. WHEN se modifiquen los datos THEN el sistema DEBERÁ validar la información antes de guardar
3. WHEN se actualice el número de personas THEN el sistema DEBERÁ mantener el mismo QR pero actualizar el límite
4. WHEN se guarden los cambios THEN el sistema DEBERÁ registrar la fecha y hora de la modificación

### Requerimiento 6

**Historia de Usuario:** Como administrador, quiero ver un dashboard estilo Notion con vista de calendario y tabla de datos, para gestionar las reservas de manera visual e intuitiva.

#### Criterios de Aceptación

1. WHEN el administrador acceda al dashboard THEN el sistema DEBERÁ mostrar una vista de calendario mensual en el lado derecho
2. WHEN se seleccione un día del calendario THEN el sistema DEBERÁ mostrar las reservas de ese día en formato tabla/matriz
3. WHEN se muestre la tabla de reservas THEN el sistema DEBERÁ organizar los datos en columnas: Cliente, Personas, Estado, Promotor, Asistencia
4. WHEN se haga clic en una reserva THEN el sistema DEBERÁ abrir un panel lateral con todos los detalles editables
5. WHEN se navegue entre meses THEN el sistema DEBERÁ mantener la funcionalidad de filtrado y búsqueda
6. WHEN se visualicen las reservas THEN el sistema DEBERÁ usar códigos de color para indicar estados (pendiente, en curso, completada)

### Requerimiento 7

**Historia de Usuario:** Como administrador, quiero generar reportes de asistencia integrados en la interfaz tipo Notion, para analizar el rendimiento sin salir del sistema.

#### Criterios de Aceptación

1. WHEN se acceda a la sección de reportes THEN el sistema DEBERÁ mostrar widgets visuales con métricas clave
2. WHEN se genere un reporte THEN el sistema DEBERÁ incluir gráficos de asistencia por promotor, día y tipo de evento
3. WHEN se seleccione un rango de fechas THEN el sistema DEBERÁ actualizar automáticamente las métricas mostradas
4. WHEN se exporte el reporte THEN el sistema DEBERÁ permitir descarga en formato Excel manteniendo el formato visual
5. WHEN se visualicen las estadísticas THEN el sistema DEBERÁ mostrar comparativas mes a mes y tendencias

### Requerimiento 8

**Historia de Usuario:** Como administrador, quiero una interfaz responsive y moderna, para poder gestionar reservas desde cualquier dispositivo de manera eficiente.

#### Criterios de Aceptación

1. WHEN se acceda desde móvil THEN el sistema DEBERÁ adaptar la vista de calendario a pantalla pequeña
2. WHEN se use en tablet THEN el sistema DEBERÁ mantener la funcionalidad completa con navegación optimizada
3. WHEN se interactúe con la tabla THEN el sistema DEBERÁ permitir scroll horizontal y redimensionado de columnas
4. WHEN se use el escáner QR THEN el sistema DEBERÁ activar automáticamente la cámara del dispositivo móvil

### Requerimiento 9

**Historia de Usuario:** Como personal de acceso, quiero usar el QR como incrementador flexible para registrar múltiples personas de la misma reserva de manera eficiente.

#### Criterios de Aceptación

1. WHEN se escanee el mismo QR múltiples veces THEN el sistema DEBERÁ permitir incrementar el contador sin restricciones
2. WHEN se registren personas adicionales THEN el sistema DEBERÁ mostrar el total actual vs. reservado (ej: "José López: 23/20 personas")
3. WHEN se supere el número reservado THEN el sistema DEBERÁ mostrar el exceso pero permitir el registro
4. WHEN se escanee para múltiples personas THEN el sistema DEBERÁ mantener un registro de timestamp de cada incremento

### Requerimiento 10

**Historia de Usuario:** Como administrador, quiero gestionar estados de reservas y tener opciones de control manual, para manejar situaciones especiales.

#### Criterios de Aceptación

1. WHEN se cree una reserva THEN el sistema DEBERÁ asignar estado inicial "Confirmada"
2. WHEN lleguen los primeros invitados THEN el sistema DEBERÁ cambiar automáticamente a "En Progreso"
3. WHEN se complete el evento THEN el administrador DEBERÁ poder marcar como "Completada" o "No Show"
4. WHEN el QR no funcione THEN el sistema DEBERÁ permitir incremento manual con búsqueda por nombre
5. WHEN se requiera auditoría THEN el sistema DEBERÁ registrar quién hizo cada acción y cuándo

### Requerimiento 11

**Historia de Usuario:** Como administrador, quiero integrar el módulo con el sistema actual de clientes, para aprovechar la información existente.

#### Criterios de Aceptación

1. WHEN se cree una reserva THEN el sistema DEBERÁ permitir buscar clientes existentes en la base de datos
2. WHEN se seleccione un cliente existente THEN el sistema DEBERÁ autocompletar sus datos básicos
3. WHEN se registre un nuevo cliente THEN el sistema DEBERÁ agregarlo automáticamente a la base de clientes
4. WHEN se consulten promotores THEN el sistema DEBERÁ usar la lista actual de promotores del sistema
