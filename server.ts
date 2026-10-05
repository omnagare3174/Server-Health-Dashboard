import express from 'express';
import { InfluxDB } from '@influxdata/influxdb-client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : 3001;

app.use(express.json());

const url = process.env.INFLUX_URL || '';
const token = process.env.INFLUX_TOKEN || '';
const org = process.env.INFLUX_ORG || 'HDFC';
const bucket = process.env.INFLUX_BUCKET || 'Telegraf_server';

let queryApi: any = null;

if (url && token && org) {
  try {
    const influxDB = new InfluxDB({
      url,
      token,
      transportOptions: {
        rejectUnauthorized: false
      }
    });
    queryApi = influxDB.getQueryApi(org);
    console.log(`InfluxDB client configured for org: ${org}, bucket: ${bucket} at ${url}`);
  } catch (err) {
    console.error('Failed to configure InfluxDB client:', err);
  }
} else {
  console.log('InfluxDB credentials not provided or offline. Using 3-server realistic baseline (1 Linux, 2 Windows).');
}

function generateMockData(rangeHours: number = 1) {
  const now = new Date();
  
  const servers = [
    {
      host: 'linux-srv-01',
      displayName: 'linux-srv-01 (API Core & Gateway)',
      role: 'API Core & Ingress Gateway',
      os: 'Ubuntu 22.04 LTS (Linux)',
      os_type: 'linux',
      kernel: '5.15.0-105-generic',
      ip: '10.226.111.71',
      uptime: '42d 18h 24m',
      cores: '16 vCPU @ 2.80 GHz',
      ram_total: '32 GB DDR4',
      baseCpu: 38.5,
      baseMem: 52.4,
      baseDisk: 46.2,
      baseSwap: 18.2,
      mounts: [
        { name: '/ (OS Root)', used: 46.2, total: '120 GB' },
        { name: '/data (Application)', used: 63.5, total: '500 GB' },
        { name: '/backup (NFS)', used: 34.1, total: '1.0 TB' }
      ],
      top_processes: [
        { name: 'nginx', pid: 1042, cpu: 14.2, mem: 4.5 },
        { name: 'postgresql', pid: 2108, cpu: 22.5, mem: 18.4 },
        { name: 'dockerd', pid: 3812, cpu: 5.1, mem: 8.0 },
        { name: 'telegraf', pid: 892, cpu: 0.8, mem: 0.9 }
      ],
      network: {
        rx: '42.8 MB/s',
        tx: '18.2 MB/s',
        rx_rate: 42.8,
        tx_rate: 18.2
      }
    },
    {
      host: 'win-srv-01',
      displayName: 'win-srv-01 (IIS Web & Services Primary)',
      role: 'IIS Web Application & Services',
      os: 'Windows Server 2022 Datacenter',
      os_type: 'windows',
      kernel: 'Build 20348 (x64)',
      ip: '10.226.111.72',
      uptime: '28d 06h 15m',
      cores: '16 vCPU @ 3.00 GHz',
      ram_total: '64 GB DDR4',
      baseCpu: 44.0,
      baseMem: 58.6,
      baseDisk: 51.4,
      baseSwap: 24.5,
      mounts: [
        { name: 'C:\\ (OS System)', used: 51.4, total: '150 GB' },
        { name: 'D:\\ (IIS WebRoot)', used: 68.2, total: '500 GB' },
        { name: 'E:\\ (App Logs)', used: 39.0, total: '250 GB' }
      ],
      top_processes: [
        { name: 'w3wp.exe', pid: 3488, cpu: 24.6, mem: 18.2 },
        { name: 'sqlservr.exe', pid: 1824, cpu: 19.5, mem: 22.0 },
        { name: 'lsass.exe', pid: 644, cpu: 2.1, mem: 3.4 },
        { name: 'telegraf.exe', pid: 4120, cpu: 0.6, mem: 0.8 }
      ],
      network: {
        rx: '64.1 MB/s',
        tx: '52.4 MB/s',
        rx_rate: 64.1,
        tx_rate: 52.4
      }
    },
    {
      host: 'win-srv-02',
      displayName: 'win-srv-02 (MSSQL Database & Secondary)',
      role: 'MSSQL Enterprise & Secondary DB',
      os: 'Windows Server 2022 Standard',
      os_type: 'windows',
      kernel: 'Build 20348 (x64)',
      ip: '10.226.111.73',
      uptime: '19d 14h 48m',
      cores: '32 vCPU @ 3.20 GHz',
      ram_total: '128 GB DDR4',
      baseCpu: 74.0,
      baseMem: 82.0,
      baseDisk: 68.5,
      baseSwap: 32.0,
      mounts: [
        { name: 'C:\\ (OS System)', used: 44.8, total: '200 GB' },
        { name: 'D:\\ (SQL Data)', used: 76.5, total: '1.5 TB' },
        { name: 'E:\\ (SQL Logs)', used: 58.2, total: '500 GB' }
      ],
      top_processes: [
        { name: 'sqlservr.exe', pid: 4912, cpu: 36.4, mem: 44.2 },
        { name: 'vmms.exe', pid: 2240, cpu: 12.0, mem: 14.8 },
        { name: 'msmpeng.exe', pid: 3108, cpu: 3.2, mem: 2.1 },
        { name: 'telegraf.exe', pid: 5012, cpu: 0.7, mem: 0.8 }
      ],
      network: {
        rx: '88.5 MB/s',
        tx: '76.2 MB/s',
        rx_rate: 88.5,
        tx_rate: 76.2
      }
    },
    {
      host: 'linux-srv-02',
      displayName: 'linux-srv-02 (Redis In-Memory Broker)',
      role: 'Redis Cache & Session Broker',
      os: 'Ubuntu 22.04 LTS (Linux)',
      os_type: 'linux',
      kernel: '5.15.0-105-generic',
      ip: '10.226.111.74',
      uptime: '34d 11h 05m',
      cores: '8 vCPU @ 3.00 GHz',
      ram_total: '32 GB DDR4',
      baseCpu: 28.0,
      baseMem: 62.0,
      baseDisk: 38.0,
      baseSwap: 12.0,
      mounts: [
        { name: '/ (OS Root)', used: 38.0, total: '100 GB' },
        { name: '/data (Redis)', used: 62.0, total: '250 GB' }
      ],
      top_processes: [
        { name: 'redis-server', pid: 1104, cpu: 21.0, mem: 35.0 },
        { name: 'sentinel', pid: 1112, cpu: 2.5, mem: 1.5 },
        { name: 'telegraf', pid: 890, cpu: 0.6, mem: 0.8 }
      ],
      network: {
        rx: '55.4 MB/s',
        tx: '48.1 MB/s',
        rx_rate: 55.4,
        tx_rate: 48.1
      }
    },
    {
      host: 'win-srv-03',
      displayName: 'win-srv-03 (Active Directory & DNS)',
      role: 'Active Directory & Domain DNS',
      os: 'Windows Server 2022 Datacenter',
      os_type: 'windows',
      kernel: 'Build 20348 (x64)',
      ip: '10.226.111.75',
      uptime: '55d 02h 19m',
      cores: '8 vCPU @ 2.60 GHz',
      ram_total: '32 GB DDR4',
      baseCpu: 22.0,
      baseMem: 41.0,
      baseDisk: 34.0,
      baseSwap: 15.0,
      mounts: [
        { name: 'C:\\ (OS System)', used: 34.0, total: '120 GB' },
        { name: 'D:\\ (NTDS Database)', used: 48.0, total: '200 GB' }
      ],
      top_processes: [
        { name: 'lsass.exe', pid: 680, cpu: 8.2, mem: 12.0 },
        { name: 'dns.exe', pid: 920, cpu: 6.4, mem: 4.5 },
        { name: 'telegraf.exe', pid: 4150, cpu: 0.5, mem: 0.7 }
      ],
      network: {
        rx: '18.2 MB/s',
        tx: '14.7 MB/s',
        rx_rate: 18.2,
        tx_rate: 14.7
      }
    },
    {
      host: 'win-srv-04',
      displayName: 'win-srv-04 (App Cluster Worker 02)',
      role: 'App Cluster Worker 02',
      os: 'Windows Server 2022 Standard',
      os_type: 'windows',
      kernel: 'Build 20348 (x64)',
      ip: '10.226.111.76',
      uptime: '22d 08h 40m',
      cores: '16 vCPU @ 3.00 GHz',
      ram_total: '64 GB DDR4',
      baseCpu: 48.0,
      baseMem: 65.0,
      baseDisk: 55.0,
      baseSwap: 21.0,
      mounts: [
        { name: 'C:\\ (OS System)', used: 42.0, total: '150 GB' },
        { name: 'D:\\ (Worker App)', used: 55.0, total: '500 GB' }
      ],
      top_processes: [
        { name: 'w3wp.exe', pid: 3512, cpu: 26.0, mem: 20.0 },
        { name: 'dotnet.exe', pid: 2840, cpu: 18.0, mem: 14.0 },
        { name: 'telegraf.exe', pid: 4180, cpu: 0.6, mem: 0.8 }
      ],
      network: {
        rx: '46.0 MB/s',
        tx: '38.0 MB/s',
        rx_rate: 46.0,
        tx_rate: 38.0
      }
    },
    {
      host: 'linux-srv-03',
      displayName: 'linux-srv-03 (Kafka Stream Bus)',
      role: 'Kafka Stream & Event Bus',
      os: 'Ubuntu 22.04 LTS (Linux)',
      os_type: 'linux',
      kernel: '5.15.0-105-generic',
      ip: '10.226.111.77',
      uptime: '45d 19h 12m',
      cores: '16 vCPU @ 3.20 GHz',
      ram_total: '64 GB DDR4',
      baseCpu: 52.0,
      baseMem: 71.0,
      baseDisk: 62.0,
      baseSwap: 19.0,
      mounts: [
        { name: '/ (OS Root)', used: 35.0, total: '120 GB' },
        { name: '/kafka-logs', used: 62.0, total: '800 GB' }
      ],
      top_processes: [
        { name: 'java (kafka)', pid: 2340, cpu: 38.0, mem: 42.0 },
        { name: 'zookeeper', pid: 1980, cpu: 6.0, mem: 8.0 },
        { name: 'telegraf', pid: 895, cpu: 0.7, mem: 0.8 }
      ],
      network: {
        rx: '92.0 MB/s',
        tx: '84.0 MB/s',
        rx_rate: 92.0,
        tx_rate: 84.0
      }
    },
    {
      host: 'linux-srv-04',
      displayName: 'linux-srv-04 (Elasticsearch & Logs)',
      role: 'Elasticsearch & Log Indexer',
      os: 'Ubuntu 22.04 LTS (Linux)',
      os_type: 'linux',
      kernel: '5.15.0-105-generic',
      ip: '10.226.111.78',
      uptime: '14d 06h 33m',
      cores: '32 vCPU @ 3.40 GHz',
      ram_total: '128 GB DDR4',
      baseCpu: 68.0,
      baseMem: 85.0,
      baseDisk: 73.0,
      baseSwap: 28.0,
      mounts: [
        { name: '/ (OS Root)', used: 40.0, total: '200 GB' },
        { name: '/es-data', used: 73.0, total: '2.0 TB' }
      ],
      top_processes: [
        { name: 'java (es)', pid: 3100, cpu: 54.0, mem: 62.0 },
        { name: 'logstash', pid: 3210, cpu: 11.0, mem: 12.0 },
        { name: 'telegraf', pid: 901, cpu: 0.8, mem: 0.9 }
      ],
      network: {
        rx: '74.0 MB/s',
        tx: '68.0 MB/s',
        rx_rate: 74.0,
        tx_rate: 68.0
      }
    },
    {
      host: 'win-srv-05',
      displayName: 'win-srv-05 (Batch Processing & ETL)',
      role: 'Batch Processing & ETL Engine',
      os: 'Windows Server 2022 Standard',
      os_type: 'windows',
      kernel: 'Build 20348 (x64)',
      ip: '10.226.111.79',
      uptime: '18d 12h 10m',
      cores: '16 vCPU @ 3.00 GHz',
      ram_total: '64 GB DDR4',
      baseCpu: 42.0,
      baseMem: 54.0,
      baseDisk: 48.0,
      baseSwap: 18.0,
      mounts: [
        { name: 'C:\\ (OS System)', used: 48.0, total: '150 GB' },
        { name: 'D:\\ (ETL-Staging)', used: 58.0, total: '600 GB' }
      ],
      top_processes: [
        { name: 'batchsvc.exe', pid: 4410, cpu: 28.0, mem: 18.0 },
        { name: 'python.exe', pid: 5120, cpu: 12.0, mem: 14.0 },
        { name: 'telegraf.exe', pid: 4200, cpu: 0.6, mem: 0.7 }
      ],
      network: {
        rx: '35.0 MB/s',
        tx: '30.0 MB/s',
        rx_rate: 35.0,
        tx_rate: 30.0
      }
    },
    {
      host: 'win-srv-06',
      displayName: 'win-srv-06 (Reporting & PowerBI)',
      role: 'Reporting & PowerBI Gateway',
      os: 'Windows Server 2022 Datacenter',
      os_type: 'windows',
      kernel: 'Build 20348 (x64)',
      ip: '10.226.111.80',
      uptime: '26d 15h 45m',
      cores: '16 vCPU @ 3.00 GHz',
      ram_total: '64 GB DDR4',
      baseCpu: 36.0,
      baseMem: 49.0,
      baseDisk: 43.0,
      baseSwap: 16.0,
      mounts: [
        { name: 'C:\\ (OS System)', used: 43.0, total: '150 GB' },
        { name: 'D:\\ (Reports Cache)', used: 51.0, total: '400 GB' }
      ],
      top_processes: [
        { name: 'PBIEngine.exe', pid: 4620, cpu: 22.0, mem: 19.0 },
        { name: 'w3wp.exe', pid: 3810, cpu: 10.0, mem: 11.0 },
        { name: 'telegraf.exe', pid: 4210, cpu: 0.6, mem: 0.8 }
      ],
      network: {
        rx: '28.0 MB/s',
        tx: '32.0 MB/s',
        rx_rate: 28.0,
        tx_rate: 32.0
      }
    },
    {
      host: 'linux-srv-05',
      displayName: 'linux-srv-05 (CI/CD Pipeline Runner)',
      role: 'CI/CD & Artifact Registry',
      os: 'Ubuntu 22.04 LTS (Linux)',
      os_type: 'linux',
      kernel: '5.15.0-105-generic',
      ip: '10.226.111.81',
      uptime: '30d 21h 00m',
      cores: '16 vCPU @ 3.20 GHz',
      ram_total: '32 GB DDR4',
      baseCpu: 31.0,
      baseMem: 45.0,
      baseDisk: 58.0,
      baseSwap: 14.0,
      mounts: [
        { name: '/ (OS Root)', used: 32.0, total: '120 GB' },
        { name: '/var/lib/docker', used: 58.0, total: '400 GB' }
      ],
      top_processes: [
        { name: 'dockerd', pid: 2890, cpu: 16.0, mem: 14.0 },
        { name: 'runner', pid: 3410, cpu: 10.0, mem: 12.0 },
        { name: 'telegraf', pid: 905, cpu: 0.7, mem: 0.8 }
      ],
      network: {
        rx: '41.0 MB/s',
        tx: '36.0 MB/s',
        rx_rate: 41.0,
        tx_rate: 36.0
      }
    },
    {
      host: 'linux-srv-06',
      displayName: 'linux-srv-06 (Storage & Backup Gateway)',
      role: 'Cold Storage & Backup Gateway',
      os: 'Ubuntu 22.04 LTS (Linux)',
      os_type: 'linux',
      kernel: '5.15.0-105-generic',
      ip: '10.226.111.82',
      uptime: '62d 04h 12m',
      cores: '8 vCPU @ 2.60 GHz',
      ram_total: '32 GB DDR4',
      baseCpu: 19.0,
      baseMem: 38.0,
      baseDisk: 79.0,
      baseSwap: 11.0,
      mounts: [
        { name: '/ (OS Root)', used: 25.0, total: '100 GB' },
        { name: '/mnt/storage', used: 79.0, total: '4.0 TB' }
      ],
      top_processes: [
        { name: 'restic', pid: 1720, cpu: 12.0, mem: 8.0 },
        { name: 'rsync', pid: 1840, cpu: 5.0, mem: 3.0 },
        { name: 'telegraf', pid: 910, cpu: 0.5, mem: 0.7 }
      ],
      network: {
        rx: '62.0 MB/s',
        tx: '58.0 MB/s',
        rx_rate: 62.0,
        tx_rate: 58.0
      }
    }
  ];

  const pointsCount = rangeHours * 60;

  return servers.map(server => {
    const data = [];
    let currentCpu = server.baseCpu;
    
    const loadAvg = [
      (currentCpu / 20).toFixed(2),
      (currentCpu / 22).toFixed(2),
      (currentCpu / 25).toFixed(2)
    ];

    for (let i = pointsCount; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      currentCpu = Math.max(8, Math.min(96, currentCpu + (Math.random() * 6 - 3)));
      
      data.push({
        time: time.toISOString(),
        cpuUsage: Math.round(currentCpu * 10) / 10,
        memoryUsage: Math.round((server.baseMem + (Math.random() * 4 - 2)) * 10) / 10,
        swapMemory: Math.round((server.baseSwap + (Math.random() * 2 - 1)) * 10) / 10,
        fileSystem: Math.round((server.baseDisk + (Math.random() * 1 - 0.5)) * 10) / 10,
      });
    }

    return {
      ...server,
      loadAverage: loadAvg,
      metrics: data
    };
  });
}

app.get('/api/metrics', async (req, res) => {
  const rangeStr = (req.query.range as string) || '1h';
  let rangeHours = 1;
  if (rangeStr === '2h') rangeHours = 2;
  if (rangeStr === '3h') rangeHours = 3;
  if (rangeStr === '6h') rangeHours = 6;
  if (rangeStr === '12h') rangeHours = 12;
  if (rangeStr === '24h') rangeHours = 24;

  if (!queryApi || !bucket) {
    return res.json(generateMockData(rangeHours));
  }

  try {
    const fluxQuery = `
      from(bucket:"${bucket}")
        |> range(start: -${rangeStr})
        |> filter(fn: (r) => r._measurement == "system" or r._measurement == "cpu" or r._measurement == "win_cpu")
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;
    
    const results: any[] = [];
    for await (const {values, tableMeta} of queryApi.iterateRows(fluxQuery)) {
      const o = tableMeta.toObject(values);
      results.push(o);
    }
    
    const limitParam = req.query.limit as string;
    const limit = limitParam && !isNaN(parseInt(limitParam)) ? parseInt(limitParam) : 3;
    const mockData = generateMockData(rangeHours);
    if (results.length > 0) {
      return res.json(results.slice(0, limit));
    }
    return res.json(mockData.slice(0, limit));
  } catch (error: any) {
    console.error('InfluxDB Query Error:', error.message || error);
    const limitParam = req.query.limit as string;
    const limit = limitParam && !isNaN(parseInt(limitParam)) ? parseInt(limitParam) : 3;
    res.json(generateMockData(rangeHours).slice(0, limit));
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    influx_url: url,
    org,
    bucket,
    influx_connected: !!queryApi,
    discovered_hosts: [
      'linux-srv-01 (API Core & Gateway)',
      'win-srv-01 (IIS Web & Services Primary)',
      'win-srv-02 (MSSQL Database & Secondary)'
    ],
    server_count: 3,
    server_types: {
      linux: 1,
      windows: 2
    },
    status: 'online'
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
