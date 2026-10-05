@echo off
REM Run this on an internet-connected Windows machine to prepare offline deployment bundle
echo ========================================================
echo [1/3] Downloading InfluxDB v2 offline packages...
echo ========================================================
call download_packages.bat

echo.
echo ========================================================
echo [2/3] Building frontend assets...
echo ========================================================
where npm >nul 2>nul
if %errorlevel% equ 0 (
    call npm install
    call npm run build
) else (
    echo Note: npm not found in PATH, using pre-built Vanilla JS & Python server.
)

echo.
echo ========================================================
echo [3/3] Airgap bundle ready!
echo ========================================================
echo Simply copy this entire project directory to your USB drive
echo and transfer it to your airgapped InfluxDB v2 server.
echo.
echo On your offline server, run:
echo   install_offline.bat  (or ./install_offline.sh)
echo   python server.py
echo ========================================================
pause
