@echo off
set "NODE_PATH=C:\Users\jdcha\AppData\Roaming\npm\node_modules"
node "%~dp0verificar.js" %*
exit /b %ERRORLEVEL%
