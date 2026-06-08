@echo off
REM Script simples para iniciar HCI Vitta

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║      HCI Vitta - Sistema de Triagem Clinica com IA            ║
echo ║                  INICIALIZADOR RAPIDO                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd /d "c:\Projetos Facul\trabalhoPI5"

if not exist "docker-compose.yml" (
    echo Erro: docker-compose.yml nao encontrado!
    echo Verifique se voce esta no diretorio correto.
    pause
    exit /b 1
)

echo [1/3] Parando containers antigos...
docker-compose down >nul 2>&1

echo [2/3] Iniciando backend, database e IA engine...
start "HCI Vitta - Backend" cmd /k "docker-compose up --build"

echo [3/3] Iniciando servidor frontend...
timeout /t 5 /nobreak
start "HCI Vitta - Frontend" cmd /k "cd frontend-chatAI\front && python -m http.server 5500"

timeout /t 3 /nobreak
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                  SISTEMA INICIADO! ok                         ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  URL Frontend:     http://localhost:5500/html/login.html      ║
echo ║  URL Backend:      http://localhost:3000                      ║
echo ║  URL pgAdmin:      http://localhost:8080                      ║
echo ║  URL IA Engine:    http://localhost:5000                      ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  Login Padrao:     usuario / senha                             ║
echo ║  pgAdmin:          admin@pgadmin.org / 090106                 ║
echo ║  PostgreSQL:       postgres / 090106                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Abrindo navegador...
timeout /t 2 /nobreak
start http://localhost:5500/html/login.html

echo.
echo Sistema pronto!
pause
