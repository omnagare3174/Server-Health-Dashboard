@echo off
REM Offline installer for InfluxDB v2 Client and Telemetry Packages
echo ========================================================
echo Installing InfluxDB v2 Python packages from local folder...
echo ========================================================
python -m pip install --no-index --find-links=offline_packages -r requirements.txt
if %errorlevel% neq 0 (
    pip install --no-index --find-links=offline_packages -r requirements.txt
)
echo.
echo ========================================================
echo InfluxDB v2 packages installed successfully!
echo You can run the dashboard: python server.py
echo Or run the pipeline:      python influx_pipeline.py
echo ========================================================
pause
