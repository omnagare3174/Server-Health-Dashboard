@echo off
REM Run this on an internet-connected machine to download InfluxDB v2 wheels
echo ========================================================
echo Downloading InfluxDB v2 Python Wheels into offline_packages/
echo ========================================================

if not exist "offline_packages" mkdir offline_packages
python -m pip download -r requirements.txt -d offline_packages/
if %errorlevel% neq 0 (
    pip download -r requirements.txt -d offline_packages/
)

echo.
echo ========================================================
echo All InfluxDB v2 packages downloaded successfully!
echo You can now copy this folder or offline_packages to your air-gapped server.
echo ========================================================
pause
