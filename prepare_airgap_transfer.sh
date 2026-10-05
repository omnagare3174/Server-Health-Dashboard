#!/bin/bash
# Run this on a machine WITH internet access

echo "Preparing Airgapped Deployment Bundle..."

# 1. Install Node.js dependencies
echo "[1/4] Installing all Node.js dependencies..."
npm install

# 2. Build the React Frontend
echo "[2/4] Building the React frontend into static assets..."
npm run build

# 3. Clean up unnecessary cache to save space
echo "[3/4] Cleaning caches..."
rm -rf node_modules/.cache

# 4. Create the archive
echo "[4/4] Creating the standalone archive (airgap_app.tar.gz)..."
tar -czf airgap_app.tar.gz \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='airgap_app.tar.gz' \
    .

echo "---------------------------------------------------"
echo "SUCCESS! "
echo "The file 'airgap_app.tar.gz' has been created in this folder."
echo ""
echo "Next Steps:"
echo "1. Copy 'airgap_app.tar.gz' to your USB drive."
echo "2. Transfer it to your offline/airgapped server."
echo "3. On the offline server, extract it:"
echo "   tar -xzf airgap_app.tar.gz"
echo "4. Copy .env.example to .env and put your InfluxDB details in it."
echo "5. Start the server (no npm install needed!):"
echo "   npm run start"
