#!/bin/bash
# Offline installer for InfluxDB v2 Client and Telemetry Packages
# Run this script on your OFFLINE machine

echo "========================================================"
echo "Installing InfluxDB v2 packages from offline_packages/..."
echo "========================================================"

if command -v python3 &>/dev/null; then
    python3 -m pip install --no-index --find-links=offline_packages/ -r requirements.txt
else
    pip install --no-index --find-links=offline_packages/ -r requirements.txt
fi

echo "---------------------------------------------------"
echo "Installation complete!"
echo "Start dashboard:  python3 server.py"
echo "Start ingestion:  python3 influx_pipeline.py"
