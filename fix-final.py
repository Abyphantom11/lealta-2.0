#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import codecs

# Leer con encoding UTF-8
with codecs.open('src/app/reservas/components/ReservationTable.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Buscar y reemplazar las funciones
in_actualizar = False
in_eliminar = False
new_lines = []
skip_lines = 0

for i, line in enumerate(lines):
    if skip_lines > 0:
        skip_lines -= 1
        continue
    
    # Detectar inicio de actualizarDetalle
    if '  const actualizarDetalle = useCallback' in line:
        in_actualizar = True
        new_lines.append(line)
        continue
    
    # Detectar inicio de eliminarDetalle
    if '  const eliminarDetalle = useCallback' in line:
        in_eliminar = True
        new_lines.append(line)
        continue
    
    # Reemplazar dentro de actualizarDetalle
    if in_actualizar:
        if 'if (updateReservaOptimized)' in line:
            # Saltar todas las líneas hasta el cierre del callback
            for j in range(i, len(lines)):
                if '  }, [getDetallesReserva,' in lines[j]:
                    new_lines.append('    \n')
                    new_lines.append('    // 🚀 OPTIMISTIC UPDATE: Usar updateField para actualización inmediata (igual que número de mesa)\n')
                    new_lines.append("    updateField(reservaId, 'detalles', nuevosDetalles);\n")
                    new_lines.append('  }, [getDetallesReserva, updateField]);\n')
                    skip_lines = j - i
                    in_actualizar = False
                    break
            continue
        new_lines.append(line)
        continue
    
    # Reemplazar dentro de eliminarDetalle
    if in_eliminar:
        if 'if (updateReservaOptimized)' in line:
            # Saltar todas las líneas hasta el cierre del callback
            for j in range(i, len(lines)):
                if '  }, [getDetallesReserva,' in lines[j]:
                    new_lines.append('    \n')
                    new_lines.append('    // 🚀 OPTIMISTIC UPDATE: Usar updateField para actualización inmediata (igual que número de mesa)\n')
                    new_lines.append("    updateField(reservaId, 'detalles', nuevosDetalles);\n")
                    new_lines.append('  }, [getDetallesReserva, updateField]);\n')
                    skip_lines = j - i
                    in_eliminar = False
                    break
            continue
        new_lines.append(line)
        continue
    
    new_lines.append(line)

# Guardar con encoding UTF-8
with codecs.open('src/app/reservas/components/ReservationTable.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Archivo actualizado exitosamente")
print("✅ actualizarDetalle y eliminarDetalle ahora usan updateField")
