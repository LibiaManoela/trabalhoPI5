Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "             HCI VITTA - INICIALIZADOR POWERSHELL (DOCKER)          " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if (Get-Process "Docker Desktop" -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Docker Desktop detectado em execucao." -ForegroundColor Green
} else {
    Write-Host "[AVISO] Certifique-se de que o Docker Desktop foi iniciado manualmente antes de continuar." -ForegroundColor Yellow
}

Write-Host "[INFO] Executando montagem e subindo os containers da aplicacao..." -ForegroundColor Yellow
docker-compose up --build