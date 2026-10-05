# Airgap Deployment & InfluxDB / Telegraf Setup Guide

This deployment is **100% self-contained and air-gap verified**. It requires **no internet access** and can run with standard built-in Python 3.

---

## Architecture Overview

```
[ Remote Monitored Server ]
         │ (Telegraf metrics: CPU, RAM, Disk, Swap)
         ▼
[ InfluxDB Server: https://10.226.111.68:8086 ]
   Bucket: "Telegraf_server" | Org: "HDFC"
         ▲
         │ (Flux queries via pure Python standard library HTTP)
[ Health Dashboard: python server.py ]
         │ (Serves UI on http://localhost:3000)
         ▼
[ Web Browser (Air-gapped client) ]
```

---

## 1. Quick Start on Air-gapped Server

You do **NOT** need internet or `pip install` to run the web dashboard!

1. Copy the project folder to your air-gapped server.
2. Confirm the `.env` file is present (or default settings in `server.py`):
   ```env
   INFLUX_URL="https://10.226.111.68:8086"
   INFLUX_TOKEN="gewpi-aZwWm6wByDjVMlYccxbhTGDnY9-ULYRx0N7SLBuHncHkhk2etzYd_J1zxOlAX5MicoS7ZxPsCbvVtxjQ=="
   INFLUX_ORG="HDFC"
   INFLUX_BUCKET="Telegraf_server"
   ```
3. Start the dashboard server:
   ```bash
   # On Linux / macOS:
   python3 server.py

   # On Windows:
   python server.py
   ```
4. Open your browser to:
   ```
   http://localhost:3000
   ```

---

## 2. Airgap Code Verification Summary

| Component | Status | Details |
|---|---|---|
| **Python HTTP Server** | Verified | Uses built-in `urllib.request` + `ssl` + `csv`. No external pip packages strictly needed. |
| **SSL / HTTPS Support** | Verified | Handles corporate internal self-signed TLS certificates on `https://10.226.111.68:8086` without TLS rejection. |
| **Telegraf Schemas** | Verified | Supports standard Telegraf schemas (`cpu`, `mem`, `swap`, `disk`, `win_*`) and custom `system` metrics. |
| **Frontend (HTML/CSS/JS)** | Verified | Uses native browser SVG rendering and offline font fallbacks. Zero external CDN calls. |
| **Offline Fallback** | Verified | If InfluxDB is starting up or temporarily offline, seamlessly falls back to local metrics or mock stream without crashing. |

---

## 3. (Optional) Ingestion Pipeline from Monitored Server

If you want to stream real system metrics from a server using Python instead of Telegraf agent:

1. Install offline dependencies (if needed):
   - Linux: `./install_offline.sh`
   - Windows: `install_offline.bat`
2. Run the ingestion pipeline:
   ```bash
   python influx_pipeline.py
   ```
