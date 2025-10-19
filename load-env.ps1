# Script para cargar variables de entorno desde .env
Write-Host "📄 Cargando variables de entorno desde .env..." -ForegroundColor Cyan

if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        $line = $_.Trim()
        
        # Ignorar líneas vacías y comentarios
        if ($line -and !$line.StartsWith('#')) {
            # Buscar patrón KEY=VALUE
            if ($line -match '^([^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Remover comillas si existen
                if ($value -match '^"(.*)"$') {
                    $value = $matches[1]
                } elseif ($value -match "^'(.*)'$") {
                    $value = $matches[1]
                }
                
                # Establecer variable de entorno
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                
                # Mostrar (ocultar passwords)
                if ($key -like "*PASSWORD*" -or $key -like "*SECRET*" -or $key -like "*DATABASE_URL*") {
                    Write-Host "  ✓ $key = ****" -ForegroundColor Gray
                } else {
                    Write-Host "  ✓ $key = $value" -ForegroundColor Gray
                }
            }
        }
    }
    
    Write-Host ""
    Write-Host "✅ Variables cargadas correctamente" -ForegroundColor Green
    
    # Verificar DATABASE_URL
    if ($env:DATABASE_URL) {
        $sanitized = $env:DATABASE_URL -replace ':([^@]+)@', ':****@'
        Write-Host "✅ DATABASE_URL: $sanitized" -ForegroundColor Green
    } else {
        Write-Host "❌ DATABASE_URL no está definida" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
    exit 1
}
