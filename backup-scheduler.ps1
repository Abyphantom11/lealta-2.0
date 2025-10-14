# Script de backup diario automatizado para Lealta
# Se ejecuta desde el Programador de Tareas de Windows

# Cambiar al directorio del proyecto
Set-Location "C:\Users\abrah\lealta"

# Agregar PostgreSQL al PATH
$env:PATH += ";C:\Program Files\PostgreSQL\18\bin"

# Ejecutar backup completo
Write-Host "$(Get-Date): Iniciando backup automatico..." -ForegroundColor Green

try {
    # Ejecutar el script de backup
    node create-backup-neon.js
    
    Write-Host "$(Get-Date): Backup completado exitosamente!" -ForegroundColor Green
    
    # Opcional: Limpiar backups antiguos (mayores a 30 dias)
    $cutoffDate = (Get-Date).AddDays(-30)
    Get-ChildItem -Path "backups" -Filter "backup_*" | Where-Object {$_.LastWriteTime -lt $cutoffDate} | Remove-Item -Force
    
    Write-Host "$(Get-Date): Backups antiguos limpiados" -ForegroundColor Yellow
    
} catch {
    Write-Host "$(Get-Date): Error durante backup: $_" -ForegroundColor Red
    # Escribir error a un log
    "$(Get-Date): Error durante backup: $_" | Out-File -Append -FilePath "backup-errors.log"
}
