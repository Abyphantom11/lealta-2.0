$file = "src/app/reservas/components/ReservationTable.tsx"
$content = Get-Content $file -Raw -Encoding UTF8

# Reemplazar actualizarDetalle
$pattern1 = @"
  // Función para actualizar un detalle específico
  const actualizarDetalle = useCallback\(\(reservaId: string, index: number, valor: string\) => \{
    const detalles = getDetallesReserva\(reservaId\);
    const nuevosDetalles = \[\.\.\.detalles\];
    nuevosDetalles\[index\] = valor;
    
    // .+ NO BLOQUEANTE: Guardar en background sin esperar
    if \(updateReservaOptimized\) \{
      updateReservaOptimized\(reservaId, \{ detalles: nuevosDetalles \}\)
        \.then\(\(\) => console\.log\('.+ Detalle actualizado'\)\)
        \.catch\(error => console\.error\('.+ Error actualizando detalle:', error\)\);
    \}
  \}, \[getDetallesReserva, updateReservaOptimized\]\);
"@

$replacement1 = @"
  // Función para actualizar un detalle específico
  const actualizarDetalle = useCallback((reservaId: string, index: number, valor: string) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = valor;
    
    // 🚀 OPTIMISTIC UPDATE: Usar updateField para actualización inmediata (igual que número de mesa)
    updateField(reservaId, 'detalles', nuevosDetalles);
  }, [getDetallesReserva, updateField]);
"@

$content = $content -replace $pattern1, $replacement1

# Reemplazar eliminarDetalle
$pattern2 = @"
  // Función para eliminar un detalle específico
  const eliminarDetalle = useCallback\(\(reservaId: string, index: number\) => \{
    const detalles = getDetallesReserva\(reservaId\);
    const nuevosDetalles = detalles\.filter\(\(_, i\) => i !== index\);
    
    // .+ NO BLOQUEANTE: Eliminar inmediatamente en UI, guardar en background
    if \(updateReservaOptimized\) \{
      updateReservaOptimized\(reservaId, \{ detalles: nuevosDetalles \}\)
        \.then\(\(\) => console\.log\('.+ Detalle eliminado'\)\)
        \.catch\(error => console\.error\('.+ Error eliminando detalle:', error\)\);
    \}
  \}, \[getDetallesReserva, updateReservaOptimized\]\);
"@

$replacement2 = @"
  // Función para eliminar un detalle específico
  const eliminarDetalle = useCallback((reservaId: string, index: number) => {
    const detalles = getDetallesReserva(reservaId);
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    
    // 🚀 OPTIMISTIC UPDATE: Usar updateField para actualización inmediata (igual que número de mesa)
    updateField(reservaId, 'detalles', nuevosDetalles);
  }, [getDetallesReserva, updateField]);
"@

$content = $content -replace $pattern2, $replacement2

# Guardar el archivo
$content | Set-Content $file -Encoding UTF8 -NoNewline

Write-Host "✅ Archivo actualizado exitosamente" -ForegroundColor Green
Write-Host "✅ actualizarDetalle y eliminarDetalle ahora usan updateField" -ForegroundColor Green
