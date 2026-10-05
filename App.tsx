import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  RefreshCw, 
  Server,
  AlertTriangle,
  Clock,
  Terminal,
  Layers,
  Settings
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface MetricData {
  time: string;
  cpuUsage: number;
  memoryUsage: number;
  swapMemory: number;
  fileSystem: number;
}

interface ServerData {
  host: string;
  os: string;
  kernel: string;
  loadAverage: string[];
  mounts: string[];
  metrics: MetricData[];
}

export default function App() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/metrics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      let data: ServerData[] = await response.json();
      
      // Sort by utilization (CPU + Memory of latest metric)
      data.sort((a, b) => {
        const getScore = (server: ServerData) => {
          if (!server.metrics || server.metrics.length === 0) return 0;
          const last = server.metrics[server.metrics.length - 1];
          return last.cpuUsage + last.memoryUsage;
        };
        return getScore(b) - getScore(a);
      });
      
      setServers(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e4e4e4] font-sans p-4 sm:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-baseline border-b border-white/20 pb-6 mb-8 gap-6">
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-serif italic tracking-tighter text-[#e4e4e4] flex items-center gap-3">
              <Server className="w-8 h-8 opacity-60" />
              Cluster Health Command
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mt-3">
              Global Overview // Sorted by Utilization
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1">
              {['1h', '3h', '6h', '12h', '24h'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`text-xs px-3 py-1 font-mono uppercase tracking-wider transition-colors ${timeRange === range ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button 
              onClick={fetchMetrics}
              disabled={loading}
              className="group flex items-center gap-3 hover:opacity-80 transition-all disabled:opacity-50 text-white/80 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">Refresh</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-[#ff3b30]/10 border border-[#ff3b30]/30 flex items-start gap-3 text-[#ff3b30]">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-mono">{error}</p>
          </div>
        )}

        <div className="space-y-12">
          {servers.map((server) => (
            <ServerRow key={server.host} server={server} />
          ))}
        </div>
        
        <footer className="mt-12 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono">
          <span>Global_Cluster_View</span>
          <span>Encrypted Session: AES-256</span>
          <span>Design_Ref: Editorial_Technical_Standard</span>
        </footer>
      </div>
    </div>
  );
}

function ServerRow({ server }: { server: ServerData }) {
  const currentMetrics = server.metrics.length > 0 ? server.metrics[server.metrics.length - 1] : null;
  const isCpuHigh = currentMetrics ? currentMetrics.cpuUsage > 85 : false;
  const isMemHigh = currentMetrics ? currentMetrics.memoryUsage > 85 : false;
  
  let healthRating = "OPTIMAL";
  let healthColor = "text-[#34c759]";
  if (isCpuHigh && isMemHigh) {
    healthRating = "CRITICAL";
    healthColor = "text-[#ff3b30]";
  } else if (isCpuHigh || isMemHigh) {
    healthRating = "WARNING";
    healthColor = "text-[#ffcc00]";
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6 flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-mono text-white flex items-center gap-3">
            <Server className="w-6 h-6 opacity-80" />
            {server.host}
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-white/60">
            <span className="flex items-center gap-1"><Settings className="w-3 h-3" /> OS: {server.os}</span>
            <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> Kernel: {server.kernel}</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Load Avg: {server.loadAverage.join(', ')}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Health Status</span>
          <span className={`text-xl font-bold font-mono tracking-widest ${healthColor}`}>
            {healthRating}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      {currentMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="CPU Usage" 
            value={`${currentMetrics.cpuUsage}%`} 
            icon={<Cpu className="w-4 h-4" />}
            isAlert={isCpuHigh}
          />
          <StatCard 
            title="Memory Usage" 
            value={`${currentMetrics.memoryUsage}%`} 
            icon={<Database className="w-4 h-4" />}
            isAlert={isMemHigh}
          />
          <StatCard 
            title="Swap Memory" 
            value={`${currentMetrics.swapMemory}%`} 
            icon={<Layers className="w-4 h-4 opacity-50" />}
          />
          <StatCard 
            title="File System" 
            value={`${currentMetrics.fileSystem}%`} 
            icon={<HardDrive className="w-4 h-4" />}
            footer={
              <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-white/40 font-mono flex gap-2">
                <span>Mounts:</span>
                <span className="text-white/60">{server.mounts.join(', ')}</span>
              </div>
            }
          />
        </div>
      )}

      {/* Mini Charts for Histography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[200px]">
        <div className="border border-white/5 bg-black/20 p-4 relative">
          <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-white/50 z-10">CPU Histography</span>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={server.metrics} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorCpu-${server.host}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isCpuHigh ? "#ff3b30" : "#e4e4e4"} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={isCpuHigh ? "#ff3b30" : "#e4e4e4"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cpuUsage" name="CPU" stroke={isCpuHigh ? "#ff3b30" : "#e4e4e4"} strokeWidth={1} fillOpacity={1} fill={`url(#colorCpu-${server.host})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="border border-white/5 bg-black/20 p-4 relative">
          <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-white/50 z-10">Memory Histography</span>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={server.metrics} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorMem-${server.host}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isMemHigh ? "#ff3b30" : "#34c759"} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={isMemHigh ? "#ff3b30" : "#34c759"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="memoryUsage" name="Memory" stroke={isMemHigh ? "#ff3b30" : "#34c759"} strokeWidth={1} fillOpacity={1} fill={`url(#colorMem-${server.host})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, isAlert = false, footer }: { title: string, value: string | number, icon: React.ReactNode, isAlert?: boolean, footer?: React.ReactNode }) {
  return (
    <div className={`border p-4 flex flex-col justify-between transition-colors min-h-[120px] ${isAlert ? 'border-[#ff3b30]/30 bg-[#ff3b30]/10' : 'border-white/10 bg-white/5'}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{title}</p>
        <div className={`opacity-60 ${isAlert ? 'text-[#ff3b30]' : 'text-white'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-3xl font-mono ${isAlert ? 'text-[#ff3b30]' : 'text-[#e4e4e4]'}`}>
          {value}
        </p>
      </div>
      {footer}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const time = new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return (
      <div className="bg-[#0a0a0a] border border-white/20 p-3 shadow-2xl font-mono z-50">
        <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">{time}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-4 text-xs">
            <span style={{ color: entry.color }} className="uppercase tracking-wider">
              {entry.name}:
            </span>
            <span className="text-[#e4e4e4]">
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
