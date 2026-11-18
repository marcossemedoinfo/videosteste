@echo off
cd /d "%~dp0"
echo Iniciando servidor local do FutStream em http://localhost:8080 ...
start "" "http://localhost:8080"
python -m http.server 8080 --directory public
