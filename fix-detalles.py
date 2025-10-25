#!/usr/bin/env python3
"""
Script para cambiar detalles a usar updateField (optimistic updates)
"""
import re

# Leer el archivo
with open('src/app/reservas/components/ReservationTable.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazar agregarDetalle
old_agregar = '''  // Función para agregar un nuevo campo de detalle
  const agregarDetalle = useCallback(async (reservaId: string, valor: string = '') => {
    const detallesActuales = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detallesActuales, valor];
    
    // 🔥 Guardar DIRECTAMENTE en servidor (sin updateField para evitar doble actualización)
    if (updateReservaOptimized) {
      try {
        await updateReservaOptimized(reservaId, { detalles: nuevosDetalles });
        console.log('✅ Detalle agregado y guardado:', nuevosDetalles);
      } catch (error) {
        console.error('❌ Error guardando detalle:', error);
        throw error; // Re-throw para que el caller pueda manejarlo
      }
    }
  }, [getDetallesReserva, updateReservaOptimized]);'''

new_agregar = '''  // Función para agregar un nuevo campo de detalle
  const agregarDetalle = useCallback(async (reservaId: string, valor: string = '') => {
    const detallesActuales = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detallesActuales, valor];
    
    // 🚀 OPTIMISTIC UPDATE: Usar updateField para actualización inmediata (igual que número de mesa)
    updateField(reservaId, 'detalles', nuevosDetalles);
  }, [getDetallesReserva, updateField]);'''

content = content.replace(old_agregar, new_agregar)

# Reemplazar actualizarDetalle
old_actualizar = '''  // Función para actualizar un detalle específico
  const actualizarDetalle = useCallback((reservaId: string, index: number, valor: string) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = valor;
    
    // 🔥 NO BLOQUEANTE: Guardar en background sin esperar
    if (updateReservaOptimized) {
      updateReservaOptimized(reservaId, { detalles: nuevosDetalles })
        .then(() => console.log('✅ Detalle actualizado'))
        .catch(error => console.error('❌ Error actualizando detalle:', error));
    }
  }, [getDetallesReserva, updateReservaOptimized]);'''

new_actualizar = '''  // Función para actualizar un detalle específico
  const actualizarDetalle = useCallback((reservaId: string, index: number, valor: string) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = valor;
    
    // 🚀 OPTIMISTIC UPDATE: Usar updateField para actualización inmediata (igual que número de mesa)
    updateField(reservaId, 'detalles', nuevosDetalles);
  }, [getDetallesReserva, updateField]);'''

content = content.replace(old_actualizar, new_actualizar)

# Reemplazar eliminarDetalle
old_eliminar = '''  // Función para eliminar un detalle específico
  const eliminarDetalle = useCallback((reservaId: string, index: number) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    
    // 🔥 NO BLOQUEANTE: Eliminar inmediatamente en UI, guardar en background
    if (updateReservaOptimized) {
      updateReservaOptimized(reservaId, { detalles: nuevosDetalles })
        .then(() => console.log('✅ Detalle eliminado'))
        .catch(error => console.error('❌ Error eliminando detalle:', error));
    }
  }, [getDetallesReserva, updateReservaOptimized]);'''

new_eliminar = '''  // Función para eliminar un detalle específico
  const eliminarDetalle = useCallback((reservaId: string, index: number) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    
    // 🚀 OPTIMISTIC UPDATE: Usar updateField para actualización inmediata (igual que número de mesa)
    updateField(reservaId, 'detalles', nuevosDetalles);
  }, [getDetallesReserva, updateField]);'''

content = content.replace(old_eliminar, new_eliminar)

# Guardar el archivo
with open('src/app/reservas/components/ReservationTable.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Archivo actualizado exitosamente")
print("✅ Los detalles ahora usan updateField (optimistic updates)")
print("✅ Deberían ser tan rápidos como el número de mesa")
