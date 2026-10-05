#!/bin/bash
# Run this script on a machine WITH internet access

echo "Creating directory for offline packages..."
mkdir -p offline_packages

echo "Downloading Python packages from requirements.txt..."
pip download -r requirements.txt -d offline_packages/

echo "---------------------------------------------------"
echo "Download complete! "
echo "Now, copy this entire project folder (including the 'offline_packages' directory)"
echo "to a USB drive and move it to your offline environment."
