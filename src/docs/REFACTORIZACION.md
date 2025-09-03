# Guía de Refactorización para Optimizar el Código

## Introducción

Esta guía muestra cómo refactorizar código duplicado usando los nuevos servicios implementados.

## 1. Reemplazar Llamadas a Fetch con apiService

### Antes:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch('/api/admin/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al crear cliente');
    }

    alert('Cliente creado correctamente');
    setFormData(initialFormData);
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al crear el cliente');
  } finally {
    setIsLoading(false);
  }
};
```

### Después:

```typescript
import { apiService, notificationService } from '@/lib';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const result = await apiService.post('/api/admin/clientes', formData);

    if (!result.success) {
      throw new Error(result.error?.message || 'Error al crear cliente');
    }

    notificationService.success({
      title: 'Éxito',
      message: 'Cliente creado correctamente',
    });
    setFormData(initialFormData);
  } catch (error) {
    console.error('Error:', error);
    notificationService.error({
      title: 'Error',
      message:
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al crear el cliente',
    });
  } finally {
    setIsLoading(false);
  }
};
```

## 2. Reemplazar Manejo de Formularios con useFormManagement

### Antes:

```typescript
const [formData, setFormData] = useState({
  nombre: '',
  email: '',
  telefono: '',
});
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.nombre) {
    newErrors.nombre = 'El nombre es obligatorio';
  }

  if (!formData.email) {
    newErrors.email = 'El correo es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Formato de correo inválido';
  }

  if (!formData.telefono) {
    newErrors.telefono = 'El teléfono es obligatorio';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    // Lógica de envío...
  } catch (error) {
    // Manejo de errores...
  } finally {
    setIsSubmitting(false);
  }
};
```

### Después:

```typescript
import { useFormManagement, validationRules, apiService } from '@/lib';

// Configurar validaciones
const validations = {
  nombre: [validationRules.required()],
  email: [validationRules.required(), validationRules.email()],
  telefono: [validationRules.required()],
};

// Usar hook de formulario
const {
  values: formData,
  errors,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
} = useFormManagement({
  nombre: '',
  email: '',
  telefono: '',
}, validations);

// Función de envío
const submitForm = async (values) => {
  return await apiService.post('/api/clientes', values);
};

// Usar en JSX
<form onSubmit={handleSubmit(submitForm, {
  successMessage: 'Cliente creado correctamente',
  resetOnSuccess: true,
})}>
  {/* Campos del formulario */}
</form>
```

## 3. Extraer Componentes Repetitivos

### Antes:

```jsx
<div className="p-4 border rounded">
  <h3 className="text-lg font-bold mb-2">Información del Cliente</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block mb-1">Nombre</label>
      <input
        type="text"
        name="nombre"
        value={cliente.nombre}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
    </div>
    <div>
      <label className="block mb-1">Email</label>
      <input
        type="email"
        name="email"
        value={cliente.email}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
    </div>
    {/* Más campos... */}
  </div>
</div>

// En otro archivo:
<div className="p-4 border rounded">
  <h3 className="text-lg font-bold mb-2">Información del Producto</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block mb-1">Nombre</label>
      <input
        type="text"
        name="nombre"
        value={producto.nombre}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
    </div>
    <div>
      <label className="block mb-1">Precio</label>
      <input
        type="number"
        name="precio"
        value={producto.precio}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
    </div>
    {/* Más campos... */}
  </div>
</div>
```

### Después:

```jsx
// Componente FormSection.tsx
const FormSection = ({ title, children }) => (
  <div className="p-4 border rounded">
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <div className="grid grid-cols-2 gap-4">{children}</div>
  </div>
);

// Componente FormField.tsx
const FormField = ({ label, name, type = 'text', value, onChange, error }) => (
  <div>
    <label className="block mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full p-2 border rounded ${error ? 'border-red-500' : ''}`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Uso en componentes:
<FormSection title="Información del Cliente">
  <FormField
    label="Nombre"
    name="nombre"
    value={cliente.nombre}
    onChange={handleChange}
    error={errors.nombre}
  />
  <FormField
    label="Email"
    name="email"
    type="email"
    value={cliente.email}
    onChange={handleChange}
    error={errors.email}
  />
  {/* Más campos... */}
</FormSection>;
```

## 4. Usar Servicios de Utilidades para Fechas y Números

### Antes:

```jsx
<div className="client-info">
  <p>
    Fecha de registro:{' '}
    {new Date(cliente.registeredAt).toLocaleDateString('es-ES')}
  </p>
  <p>
    Última compra: {new Date(cliente.lastPurchase).toLocaleDateString('es-ES')}
  </p>
  <p>
    Total gastado:{' '}
    {cliente.totalSpent.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'MXN',
    })}
  </p>
  <p>Descuento: {(cliente.discount * 100).toFixed(2)}%</p>
</div>
```

### Después:

```jsx
import { dateUtils, numberUtils } from '@/lib';

<div className="client-info">
  <p>Fecha de registro: {dateUtils.formatDate(cliente.registeredAt)}</p>
  <p>Última compra: {dateUtils.formatDate(cliente.lastPurchase)}</p>
  <p>Total gastado: {numberUtils.formatPrice(cliente.totalSpent)}</p>
  <p>Descuento: {numberUtils.formatPercent(cliente.discount)}</p>
</div>;
```

## Recomendaciones Generales

1. **Analiza el código:** Busca patrones repetidos usando las herramientas de búsqueda.
2. **Extrae componentes:** Usa `componentExtractor.ts` para separar componentes grandes.
3. **Usa servicios centralizados:** Reemplaza las llamadas directas a `fetch` con `apiService`.
4. **Estandariza formularios:** Utiliza `useFormManagement` para manejar formularios.
5. **Consistencia en formato:** Usa las utilidades de fecha y número para tener un formato consistente.
6. **Sigue el principio DRY:** Don't Repeat Yourself - No te repitas.

Siguiendo estas pautas, se reducirá significativamente la duplicación de código y se mejorará la mantenibilidad del proyecto.
