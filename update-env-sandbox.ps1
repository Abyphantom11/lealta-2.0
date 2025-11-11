# Script para actualizar .env con credenciales de Paddle Sandbox

$envPath = ".env"
$content = Get-Content $envPath -Raw -Encoding UTF8

# Reemplazar credenciales de Paddle
$content = $content -replace 'PADDLE_CLIENT_TOKEN="live_36ddf9a4003f105fc2730fae735"[^\r\n]*', 'PADDLE_CLIENT_TOKEN="test_e7baca7d5de4072f974fbe36dce"'
$content = $content -replace 'PADDLE_API_KEY="pdl_live_apikey_01k9pkq5j39yxe14smwkz0rd1z_eZAdrvA4JdxsjmzS81Pmqc_At8"[^\r\n]*', 'PADDLE_API_KEY="pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd"'
$content = $content -replace 'PADDLE_WEBHOOK_SECRET="ntfset_01k9d9j96f9whgz0qtdke3tb6a"[^\r\n]*', 'PADDLE_WEBHOOK_SECRET="ntfset_01k9rf9t8ta8tdd06q1vgk2qex"'
$content = $content -replace 'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="live_36ddf9a4003f105fc2730fae735"[^\r\n]*', 'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_e7baca7d5de4072f974fbe36dce"'
$content = $content -replace 'NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"[^\r\n]*', 'NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"'
$content = $content -replace 'NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"[^\r\n]*', 'NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"'
$content = $content -replace 'PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"[^\r\n]*', 'PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"'

# Guardar el archivo
$content | Set-Content $envPath -NoNewline -Encoding UTF8

Write-Host "✅ Archivo .env actualizado con credenciales de Paddle Sandbox" -ForegroundColor Green
