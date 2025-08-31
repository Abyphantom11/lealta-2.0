# Extracción de Componentes

Esta guía explica cómo utilizar la herramienta de extracción de componentes para dividir archivos grandes en componentes más pequeños y reutilizables.

## Herramienta de Extracción de Componentes

La herramienta de extracción de componentes (`componentExtractor.ts`) analiza archivos React/Next.js y detecta componentes que pueden ser extraídos a archivos independientes. Esto mejora la mantenibilidad del código y facilita la reutilización.

### Características principales:

- Extracción automática basada en el tamaño del componente
- Extracción manual de componentes específicos por nombre
- Análisis del código para identificar dependencias e importaciones
- Actualización automática del archivo original con las importaciones

## Uso desde la línea de comandos

Puedes utilizar la herramienta desde la línea de comandos con el script `extract-components.ts`:

```bash
npx ts-node src/scripts/extract-components.ts --source=src/app/admin/page.tsx --output=src/components/admin --min-lines=50
```

### Opciones disponibles:

- `--source`: Ruta al archivo fuente (obligatorio)
- `--output`: Directorio donde se guardarán los componentes extraídos (obligatorio)
- `--min-lines`: Umbral mínimo de líneas para extraer un componente (predeterminado: 50)
- `--mode`: Modo de extracción ('auto' o 'manual', predeterminado: 'auto')
- `--components`: Lista de nombres de componentes separados por comas (solo para modo manual)

## Uso desde código

También puedes utilizar la herramienta programáticamente:

```typescript
import { extractComponents, updateSourceFile } from '@/lib/componentExtractor';

async function extractMyComponents() {
  // Extraer componentes automáticamente
  const extractedComponents = await extractComponents({
    sourcePath: 'src/app/admin/page.tsx',
    outputDir: 'src/components/admin',
    minLines: 50,
    mode: 'auto'
  });
  
  // Actualizar el archivo original con las importaciones
  if (extractedComponents.length > 0) {
    updateSourceFile(
      'src/app/admin/page.tsx', 
      extractedComponents, 
      '../../components/admin'
    );
  }
}

// O extraer componentes específicos
async function extractSpecificComponents() {
  const componentNames = [
    'ProductList',
    'OrderTable',
    'UserManagement'
  ];
  
  const extractedComponents = await extractComponents({
    sourcePath: 'src/app/admin/page.tsx',
    outputDir: 'src/components/admin',
    mode: 'manual',
    componentNames
  });
}
```

## Recomendaciones para la extracción de componentes

Para obtener mejores resultados al extraer componentes:

1. **Identifica componentes con responsabilidad única**: Busca secciones de código que representen una funcionalidad específica.

2. **Extrae componentes de tamaño mediano**: Empieza por extraer componentes de tamaño mediano (100-200 líneas) en lugar de intentar extraer todos los componentes a la vez.

3. **Revisa los componentes extraídos**: Después de la extracción, revisa los componentes generados para asegurarte de que funcionan correctamente y realizar ajustes si es necesario.

4. **Refactoriza los props**: Después de extraer un componente, considera refactorizar los props para hacerlos más claros y concisos.

5. **Prueba incrementalmente**: Haz pruebas después de extraer cada componente importante en lugar de extraer todos y luego probar.

## Ejemplo real

Si tienes un archivo `page.tsx` con múltiples secciones como encabezado, tabla de datos, formularios, etc., puedes extraerlos como componentes separados:

```typescript
// Archivo original: src/app/admin/clientes/page.tsx
// Extraer estos componentes:
// - ClienteHeader
// - ClienteTable
// - ClienteForm
// - ClienteFilters

// Después de la extracción, el archivo original se verá así:
import ClienteHeader from '../../components/admin/ClienteHeader';
import ClienteTable from '../../components/admin/ClienteTable';
import ClienteForm from '../../components/admin/ClienteForm';
import ClienteFilters from '../../components/admin/ClienteFilters';

export default function ClientesPage() {
  // Estado y lógica
  
  return (
    <div>
      <ClienteHeader title="Gestión de Clientes" />
      <ClienteFilters onFilterChange={handleFilterChange} />
      <ClienteTable 
        clientes={clientes} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />
      {showForm && (
        <ClienteForm 
          cliente={selectedCliente} 
          onSubmit={handleSubmit} 
          onCancel={() => setShowForm(false)} 
        />
      )}
    </div>
  );
}
```
