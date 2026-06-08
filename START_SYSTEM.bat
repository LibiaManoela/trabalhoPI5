@echo off
TITLE HCI Vitta - Inicializador do Sistema Docker
cls
echo ====================================================================
echo                   INICIALIZANDO ECOSSISTEMA HCI VITTA              
echo ====================================================================
echo.
echo [INFO] Verificando e subindo os containers locais via Docker Compose...
echo [INFO] Isso ira iniciar: Node.js (Porta 3000), IA Engine (Porta 5000), 
echo        PostgreSQL (Porta 5432) e pgAdmin (Porta 8080).
echo.
echo Certifique-se de que o Docker Desktop esta aberto e rodando!
echo ====================================================================
echo.

:: Executa o docker-compose reconstruindo imagens se houver mudancas nos requirements ou packages
docker-compose up --build

echo.
echo [AVISO] Sistema encerrado ou interrompido.
pause