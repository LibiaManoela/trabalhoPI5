# Script para Iniciar HCI Vitta - Sistema de Triagem Clínica com IA
# Este script abre os serviços necessários em janelas separadas

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      HCI Vitta - Sistema de Triagem Clínica com IA            ║" -ForegroundColor Cyan
Write-Host "║                  INICIALIZADOR DE SERVIÇOS                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$projectPath = "c:\Projetos Facul\trabalhoPI5"

# Verificar se está no diretório correto
if (-not (Test-Path "$projectPath\docker-compose.yml")) {
    Write-Host "❌ Erro: docker-compose.yml não encontrado em $projectPath" -ForegroundColor Red
    Write-Host "   Verifique o caminho e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Projeto encontrado em: $projectPath" -ForegroundColor Green

# Verificar Docker
Write-Host "`n🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado! Instale o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Parar containers antigos se existirem
Write-Host "`n🛑 Parando containers antigos (se existirem)..." -ForegroundColor Yellow
Push-Location $projectPath
docker-compose down 2>$null | Out-Null
Pop-Location

# Iniciar Docker Compose em nova janela
Write-Host "`n🚀 Iniciando serviços (Backend, Database, IA Engine)..." -ForegroundColor Cyan
Write-Host "   Uma nova janela se abrirá com os logs." -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath'; docker-compose up --build"

Write-Host "`n⏳ Aguardando 10 segundos para os serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Testar conectividade
Write-Host "`n🧪 Testando conectividade..." -ForegroundColor Yellow

$backendTest = $false
$maxTentativas = 5
$tentativa = 0

while (-not $backendTest -and $tentativa -lt $maxTentativas) {
    try {
        $response = curl.exe -s -w "%{http_code}" -o $null "http://localhost:3000/usuarios" 2>$null
        if ($response -eq "200" -or $response -eq "500") {
            $backendTest = $true
            Write-Host "✅ Backend respondendo em http://localhost:3000" -ForegroundColor Green
        }
    } catch {
        Write-Host "   Tentativa $($tentativa + 1)/$maxTentativas..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    $tentativa++
}

if (-not $backendTest) {
    Write-Host "⚠️  Backend pode ainda estar iniciando. Aguarde mais alguns segundos." -ForegroundColor Yellow
}

# Abrir Frontend em nova janela
Write-Host "`n📁 Iniciando servidor frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\frontend-chatAI\front'; python -m http.server 5500; Write-Host 'Servidor rodando em http://localhost:5500'"

Write-Host "`n✅ Servidor de desenvolvimento iniciado: http://localhost:5500" -ForegroundColor Green

# Abrir navegador automaticamente
Write-Host "`n🌐 Abrindo navegador..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:5500/html/login.html"

# Exibir resumo
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    SISTEMA INICIADO! ✅                        ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  🌐 Frontend:      http://localhost:5500                       ║" -ForegroundColor Green
Write-Host "║  🔌 Backend API:   http://localhost:3000                       ║" -ForegroundColor Green
Write-Host "║  🎛️  pgAdmin:      http://localhost:8080                       ║" -ForegroundColor Green
Write-Host "║     (user: admin@pgadmin.org / pass: 090106)                   ║" -ForegroundColor Green
Write-Host "║  🤖 IA Engine:     http://localhost:5000                       ║" -ForegroundColor Green
Write-Host "║  🐘 PostgreSQL:    localhost:5432                              ║" -ForegroundColor Green
Write-Host "║     (user: postgres / pass: 090106)                            ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  📋 Guia de Testes: Veja TESTING_GUIDE.md                      ║" -ForegroundColor Green
Write-Host "║  ❓ Problemas? Verifique os logs na primeira janela.            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n💡 Dica: Para parar tudo, feche as janelas ou execute:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor Yellow

Write-Host "`nPressione ENTER para continuar..." -ForegroundColor Gray
Read-Host
