import os
import time
import socket
import random
import psutil
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()

# InfluxDB / Telegraf Ingestion Configuration
URL = os.getenv('INFLUX_URL', 'https://10.226.111.68:8086')
TOKEN = os.getenv('INFLUX_TOKEN', 'gewpi-aZwWm6wByDjVMlYccxbhTGDnY9-ULYRx0N7SLBuHncHkhk2etzYd_J1zxOlAX5MicoS7ZxPsCbvVtxjQ==')
ORG = os.getenv('INFLUX_ORG', 'HDFC')
BUCKET = os.getenv('INFLUX_BUCKET', 'Telegraf_server')

try:
    from influxdb_client import InfluxDBClient, Point, WritePrecision
    from influxdb_client.client.write_api import SYNCHRONOUS
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    HAS_INFLUX = True
except ImportError:
    HAS_INFLUX = False

def main():
    if not HAS_INFLUX:
        print("ERROR: influxdb-client package is not installed.")
        print("Please run: pip install influxdb-client python-dotenv psutil")
        return

    if not TOKEN or not ORG or not BUCKET:
        print("ERROR: Missing InfluxDB configuration.")
        print("Ensure INFLUX_TOKEN, INFLUX_ORG, and INFLUX_BUCKET are set.")
        return

    hostname = socket.gethostname() or "server-alpha"
    print("=" * 65)
    print(" InfluxDB Metric Ingestion Pipeline")
    print("=" * 65)
    print(f" Target URL:  {URL}")
    print(f" Org:         {ORG}")
    print(f" Bucket:      {BUCKET}")
    print(f" Host Tag:    {hostname}")
    print("=" * 65)
    print("Connecting to InfluxDB...")

    # Initialize the InfluxDB Client with SSL support for private/self-signed certificates
    client = InfluxDBClient(
        url=URL,
        token=TOKEN,
        org=ORG,
        verify_ssl=False
    )
    
    # Use synchronous write API
    write_api = client.write_api(write_options=SYNCHRONOUS)
    
    print(f"Successfully initialized client! Streaming metrics to bucket '{BUCKET}'...")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            # 1. Gather real system metrics using psutil
            cpu_usage = psutil.cpu_percent(interval=1)
            mem = psutil.virtual_memory()
            memory_usage = mem.percent
            
            swap = psutil.swap_memory()
            swap_usage = swap.percent

            try:
                disk_path = 'C:\\' if os.name == 'nt' else '/'
                disk = psutil.disk_usage(disk_path)
                fs_usage = disk.percent
            except Exception:
                fs_usage = 50.0
            
            # Occasionally simulate a CPU or Memory spike for testing alert thresholds
            if random.random() > 0.92:
                cpu_usage = random.uniform(88.0, 98.0)
                print(">>> [SIMULATION] High CPU Spike triggered!")
                
            if random.random() > 0.96:
                memory_usage = random.uniform(86.0, 96.0)
                print(">>> [SIMULATION] High Memory Spike triggered!")

            # 2. Create the data points compatible with both custom schema and standard Telegraf
            # Point A: System measurement (consumed by dashboard API)
            system_point = (
                Point("system")
                .tag("host", hostname)
                .field("cpuUsage", float(round(cpu_usage, 1)))
                .field("memoryUsage", float(round(memory_usage, 1)))
                .field("swapMemory", float(round(swap_usage, 1)))
                .field("fileSystem", float(round(fs_usage, 1)))
                .time(time.time_ns(), WritePrecision.NS)
            )

            # Point B: Standard Telegraf cpu/mem measurement
            cpu_point = (
                Point("cpu")
                .tag("host", hostname)
                .tag("cpu", "cpu-total")
                .field("usage_active", float(round(cpu_usage, 1)))
                .field("usage_idle", float(round(max(0.0, 100.0 - cpu_usage), 1)))
                .time(time.time_ns(), WritePrecision.NS)
            )

            mem_point = (
                Point("mem")
                .tag("host", hostname)
                .field("used_percent", float(round(memory_usage, 1)))
                .time(time.time_ns(), WritePrecision.NS)
            )

            # 3. Write data to InfluxDB
            write_api.write(bucket=BUCKET, org=ORG, record=[system_point, cpu_point, mem_point])
            
            print(f"[{time.strftime('%H:%M:%S')}] Wrote metrics -> CPU: {cpu_usage:.1f}% | RAM: {memory_usage:.1f}% | SWAP: {swap_usage:.1f}% | DISK: {fs_usage:.1f}%")
            
            # Flush interval (every 4 seconds)
            time.sleep(4)

    except KeyboardInterrupt:
        print("\nStopping metric pipeline ingestion...")
    except Exception as e:
        print(f"\nPipeline Ingestion Error: {e}")
    finally:
        client.close()
        print("InfluxDB client connection closed.")

if __name__ == "__main__":
    main()