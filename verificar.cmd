@echo off
set "NODE_PATH=%APPDATA%\npm\node_modules"
node "%~dp0verificar.js" %*
exit /b %ERRORLEVEL%
