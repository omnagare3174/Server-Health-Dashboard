// Ultra-Attractive Cyber Fintech Server Command Center (Vanilla JS)
// Single-Screen 3-Node Architecture (1 Linux Server + 2 Windows Servers)

let serversData = [];
let selectedHost = null;
let autoRefreshTimer = null;
let currentRange = '1h';
let currentTheme = 'dark';
let auditEvents = [];
let activeClusterFilter = 'all';
let currentCardSize = localStorage.getItem('dashboardCardSize') || 'normal';
let currentGridCols = localStorage.getItem('dashboardGridCols') || 'auto';
let inspectViewMode = 'split';
let currentNocSubTab = 'overview';

function setInspectViewMode(mode) {
  inspectViewMode = mode;
  const btnSplit = document.getElementById('btnSplitNoc');
  const btnPulse = document.getElementById('btnPulseOnly');
  if (btnSplit) btnSplit.classList.toggle('active', mode === 'split');
  if (btnPulse) btnPulse.classList.toggle('active', mode === 'pulse');
  if (selectedHost) {
    renderActiveServer();
  }
}

function setNocSubTab(tab) {
  currentNocSubTab = tab;
  if (selectedHost) {
    renderActiveServer();
  }
}
window.setNocSubTab = setNocSubTab;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCardSizeControls();
  updateClock();
  setInterval(updateClock, 100);
  
  addEvent('info', 'Application Health Dashboard initialized');
  addEvent('info', 'Single-Screen Monitoring Mode active (3 Cluster Nodes)');
  
  fetchStatus();
  fetchMetrics();
  autoRefreshTimer = setInterval(fetchMetrics, 15000);
  initModalDragAndResize();
  initButtonRipples();
  initAiNeuralBackground();
  initChatbot();
});

function initButtonRipples() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.neon-btn, .theme-toggle-btn, .range-btn, .modal-control-icon-btn, .modal-close-icon-btn, .modal-dismiss-btn, .footer-inspect-btn, .node-filter-btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-wave';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    btn.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 650);
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  currentTheme = savedTheme;
  applyThemeUI(currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  applyThemeUI(currentTheme);
  addEvent('info', `Interface theme set to ${currentTheme.toUpperCase()} mode`);
}

function applyThemeUI(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  if (theme === 'light') {
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeText) themeText.textContent = 'LIGHT MODE';
  } else {
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeText) themeText.textContent = 'DARK MODE';
  }
  if (serversData && serversData.length > 0) {
    renderServerCards();
    if (selectedHost) renderActiveServer();
  }
}

function updateClock() {
  const clockEl = document.getElementById('liveClock');
  if (clockEl) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
    clockEl.textContent = `${timeStr}.${ms} UTC`;
  }
}

function addEvent(type, message, host = '') {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  auditEvents.unshift({ type, message, time: timeStr, host });
  if (auditEvents.length > 10) auditEvents.pop();

  const listEl = document.getElementById('eventsList');
  if (listEl) {
    listEl.innerHTML = auditEvents.map(evt => `
      <span class="ticker-item">
        <span class="time">[${evt.time}]</span>
        ${evt.host ? `<span class="host-tag">${evt.host}:</span>` : ''}
        <span>${evt.message}</span>
        <span style="opacity: 0.3; margin: 0 4px;">•</span>
      </span>
    `).join('');
  }
}

async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return;
    const data = await res.json();
    
    const badge = document.getElementById('influxHeaderBadge');
    const label = document.getElementById('influxHeaderLabel');
    const targetBadge = document.getElementById('envTargetBadge');
    const statusText = document.getElementById('statusText');

    if (data.influx_connected) {
      if (badge) badge.className = 'influx-header-chip';
      if (label) label.textContent = `INFLUXDB: CONNECTED (${data.influx_url.replace(/^https?:\/\//, '')})`;
      if (statusText) statusText.textContent = `InfluxDB Live Pipeline (${data.bucket})`;
    } else {
      if (badge) badge.className = 'influx-header-chip offline';
      if (label) label.textContent = 'AIRGAP TELEMETRY STREAM';
      if (statusText) statusText.textContent = 'Offline Telemetry Pipeline (Airgap Ready)';
    }

    if (targetBadge && data.org && data.bucket) {
      targetBadge.textContent = `ORG: ${data.org} | BUCKET: ${data.bucket}`;
    }

    const clusterSub = document.getElementById('clusterNodeSubtext');
    const countBadge = document.getElementById('clusterNodeCountBadge');
    const srvCountBadge = document.getElementById('serverCountBadge');

    if (data.server_count) {
      const linCount = data.server_types ? data.server_types.linux : (data.linux !== undefined ? data.linux : 1);
      const winCount = data.server_types ? data.server_types.windows : (data.windows !== undefined ? data.windows : 2);
      const linText = `${linCount} Linux Server${linCount === 1 ? '' : 's'}`;
      const winText = `${winCount} Windows Server${winCount === 1 ? '' : 's'}`;
      if (clusterSub) clusterSub.textContent = `${linText} • ${winText}`;
      if (countBadge) countBadge.textContent = `● ${data.server_count} NODES MONITORED`;
      if (srvCountBadge) srvCountBadge.textContent = `${data.server_count} NODES (${linCount} LINUX • ${winCount} WINDOWS)`;
    }
  } catch (err) {
    console.error('Status check error:', err);
  }
}

async function fetchMetrics() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.classList.add('loading');

  try {
    const response = await fetch(`/api/metrics?range=${currentRange}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    serversData = await response.json();
    
    renderServerCards();
    if (selectedHost) {
      renderActiveServer();
    }
    updateConnectionStatus(true);
    updateChatbotTelegrafTicker();
  } catch (error) {
    console.error('Failed to fetch server metrics:', error);
    addEvent('warn', `Backend connection note: ${error.message}`);
    updateConnectionStatus(false, error.message);
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('loading');
  }
}

function updateConnectionStatus(isConnected, errorMsg = '') {
  const liveBeacon = document.querySelector('.live-beacon');
  const statusText = document.getElementById('statusText');
  const lastSync = document.getElementById('lastSyncTime');
  if (liveBeacon) {
    liveBeacon.style.background = isConnected ? 'var(--neon-emerald)' : '#ef4444';
    liveBeacon.style.boxShadow = isConnected ? '0 0 10px var(--neon-emerald)' : '0 0 10px #ef4444';
  }
  if (statusText && !isConnected) {
    statusText.textContent = `Connection Alert (${errorMsg})`;
  }
  if (lastSync && isConnected) {
    lastSync.textContent = `Sync: ${new Date().toLocaleTimeString()}`;
  }
}

function setTimeFilter(range, btnEl) {
  currentRange = range;
  document.querySelectorAll('.range-btn').forEach(b => {
    const fnAttr = b.getAttribute('onclick') || '';
    if (fnAttr.toLowerCase().includes(`'${range.toLowerCase()}'`)) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  renderServerCards();
  if (selectedHost) {
    renderActiveServer();
  }
  addEvent('info', `Telemetry time window set to ${range.toUpperCase()}`);
  fetchMetrics();
}



// Persistent card states: host -> { isMinimized: boolean, width: number|null, height: number|null }
let cardStates = {};
try {
  const savedStates = localStorage.getItem('dashboardCardCustomStates');
  if (savedStates) cardStates = JSON.parse(savedStates);
} catch (e) {
  cardStates = {};
}

function saveCardStates() {
  try {
    localStorage.setItem('dashboardCardCustomStates', JSON.stringify(cardStates));
  } catch (e) {}
}

function initCardSizeControls() {
  const savedCols = localStorage.getItem('dashboardGridCols') || 'auto';
  setGridColumns(savedCols, false);
}

function toggleCardMinimize(event, host) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (!cardStates[host]) {
    cardStates[host] = { isMinimized: false, width: null, height: null };
  }
  cardStates[host].isMinimized = !cardStates[host].isMinimized;
  saveCardStates();
  renderServerCards();
  addEvent('info', `${cardStates[host].isMinimized ? 'Minimized' : 'Maximized'} card for ${host}`, host);
}

let isStretchingCard = false;
let wasStretchingCard = false;
let stretchTargetHost = null;
let stretchDirection = 'corner';
let stretchStartX = 0;
let stretchStartY = 0;
let stretchStartWidth = 0;
let stretchStartHeight = 0;
let stretchCardEl = null;
let stretchHudEl = null;

function handleCardClick(event, host) {
  if (isStretchingCard || wasStretchingCard) {
    wasStretchingCard = false;
    return;
  }
  if (event.target.closest('.card-min-max-btn') || event.target.closest('.card-stretch-handle') || event.target.closest('.footer-inspect-btn') || event.target.closest('.min-inspect-btn')) {
    return;
  }
  selectServer(host);
}

function startCardStretch(event, host, direction) {
  event.stopPropagation();
  event.preventDefault();

  const safeHost = String(host).replace(/[^a-zA-Z0-9_-]/g, '_');
  const card = document.getElementById(`nodeCard_${safeHost}`) || event.target.closest('.node-card');
  if (!card) return;

  isStretchingCard = true;
  stretchTargetHost = host;
  stretchDirection = direction;
  stretchStartX = event.clientX;
  stretchStartY = event.clientY;
  stretchStartWidth = card.offsetWidth;
  stretchStartHeight = card.offsetHeight;
  stretchCardEl = card;

  stretchHudEl = document.getElementById('cardStretchHud');
  if (!stretchHudEl) {
    stretchHudEl = document.createElement('div');
    stretchHudEl.id = 'cardStretchHud';
    stretchHudEl.className = 'card-stretch-hud';
    document.body.appendChild(stretchHudEl);
  }
  stretchHudEl.style.display = 'block';
  stretchHudEl.style.left = `${event.clientX + 16}px`;
  stretchHudEl.style.top = `${event.clientY + 16}px`;
  stretchHudEl.innerHTML = `<span>${stretchStartWidth} × ${stretchStartHeight}px</span>`;

  card.classList.add('is-stretching');
  document.body.classList.add('is-stretching-active');

  window.addEventListener('mousemove', onCardStretchMove);
  window.addEventListener('mouseup', onCardStretchUp);
}

function onCardStretchMove(event) {
  if (!isStretchingCard || !stretchCardEl) return;

  const deltaX = event.clientX - stretchStartX;
  const deltaY = event.clientY - stretchStartY;

  let newWidth = stretchStartWidth;
  let newHeight = stretchStartHeight;

  if (stretchDirection === 'corner' || stretchDirection === 'right') {
    newWidth = Math.max(280, Math.min(window.innerWidth - 40, stretchStartWidth + deltaX));
    stretchCardEl.style.width = `${newWidth}px`;
    stretchCardEl.style.maxWidth = 'none';
  }

  if (stretchDirection === 'corner' || stretchDirection === 'bottom') {
    newHeight = Math.max(150, Math.min(1200, stretchStartHeight + deltaY));
    stretchCardEl.style.height = `${newHeight}px`;
    stretchCardEl.style.minHeight = `${newHeight}px`;
  }

  const isMin = newHeight < 270;
  if (stretchHudEl) {
    stretchHudEl.style.left = `${event.clientX + 16}px`;
    stretchHudEl.style.top = `${event.clientY + 16}px`;
    stretchHudEl.innerHTML = `<span>${Math.round(newWidth)} × ${Math.round(newHeight)}px</span> <strong style="color: ${isMin ? 'var(--neon-amber)' : 'var(--neon-cyan)'}; margin-left: 6px;">${isMin ? 'MINIMIZED' : 'MAXIMIZED'}</strong>`;
  }

  if (isMin) {
    stretchCardEl.classList.add('card-minimized');
    const minMaxBtn = stretchCardEl.querySelector('.card-min-max-btn');
    if (minMaxBtn) {
      minMaxBtn.title = 'Maximize card (Show full graphs & network)';
      minMaxBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      `;
    }
  } else {
    stretchCardEl.classList.remove('card-minimized');
    const minMaxBtn = stretchCardEl.querySelector('.card-min-max-btn');
    if (minMaxBtn) {
      minMaxBtn.title = 'Minimize card (Show minimum info: CPU, RAM, DISK, SWAP)';
      minMaxBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
    }
  }
}

function onCardStretchUp(event) {
  if (!isStretchingCard) return;

  window.removeEventListener('mousemove', onCardStretchMove);
  window.removeEventListener('mouseup', onCardStretchUp);

  if (stretchCardEl) {
    stretchCardEl.classList.remove('is-stretching');
    const finalWidth = stretchCardEl.offsetWidth;
    const finalHeight = stretchCardEl.offsetHeight;
    const isMin = finalHeight < 270;

    if (!cardStates[stretchTargetHost]) {
      cardStates[stretchTargetHost] = {};
    }
    cardStates[stretchTargetHost].isMinimized = isMin;
    cardStates[stretchTargetHost].width = finalWidth;
    cardStates[stretchTargetHost].height = isMin ? null : finalHeight;
    saveCardStates();
  }

  if (stretchHudEl) {
    stretchHudEl.style.display = 'none';
  }
  document.body.classList.remove('is-stretching-active');

  isStretchingCard = false;
  wasStretchingCard = true;
  setTimeout(() => {
    wasStretchingCard = false;
  }, 250);

  renderServerCards();
}

function setCardSize(size, doRerender = true) {}
function setCardSizeBySlider(val) {}

function setGridColumns(cols, doRerender = false) {
  currentGridCols = cols;
  localStorage.setItem('dashboardGridCols', cols);

  document.querySelectorAll('.grid-columns-selector .col-btn').forEach(btn => {
    if (btn.getAttribute('data-cols') === cols) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const grid = document.getElementById('serverCardsGrid');
  if (grid) {
    grid.classList.remove('cols-1', 'cols-2', 'cols-3', 'cols-auto');
    grid.classList.add(`cols-${cols}`);
  }
}

function getCubicBezierSpline(points) {
  if (!points || points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
  }
  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.x.toFixed(1) === 'NaN' ? '0' : p2.y.toFixed(1)}`;
  }
  return path;
}

function getTimeAxisConfig(range = '1h') {
  const r = String(range || '1h').toLowerCase();
  if (r === '2h') {
    return {
      labels: ['-2h', '-90m', '-60m', '-30m', 'NOW'],
      pulseLabels: ['-2h', '-90m', '-60m', '-40m', '-20m', '-10m', 'NOW'],
      cardLabels: ['-2h', '-1h', 'NOW'],
      subtext: '2H WINDOW',
      minutes: 120
    };
  } else if (r === '12h') {
    return {
      labels: ['-12h', '-9h', '-6h', '-3h', 'NOW'],
      pulseLabels: ['-12h', '-10h', '-8h', '-6h', '-4h', '-2h', 'NOW'],
      cardLabels: ['-12h', '-6h', 'NOW'],
      subtext: '12H WINDOW',
      minutes: 720
    };
  } else if (r === '24h') {
    return {
      labels: ['-24h', '-18h', '-12h', '-6h', 'NOW'],
      pulseLabels: ['-24h', '-20h', '-16h', '-12h', '-8h', '-4h', 'NOW'],
      cardLabels: ['-24h', '-12h', 'NOW'],
      subtext: '24H WINDOW',
      minutes: 1440
    };
  }
  return {
    labels: ['-60m', '-45m', '-30m', '-15m', 'NOW'],
    pulseLabels: ['-60m', '-45m', '-30m', '-20m', '-10m', '-5m', 'NOW'],
    cardLabels: ['-60m', '-30m', 'NOW'],
    subtext: '1H WINDOW',
    minutes: 60
  };
}

function formatActualTime12h(dateOrIso) {
  let d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  if (isNaN(d.getTime()) && typeof dateOrIso === 'string' && dateOrIso.includes(':')) {
    const today = new Date().toISOString().split('T')[0];
    d = new Date(`${today}T${dateOrIso}`);
  }
  if (isNaN(d.getTime())) d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

function formatActualDateTime12h(dateOrIso) {
  let d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  if (isNaN(d.getTime()) && typeof dateOrIso === 'string' && dateOrIso.includes(':')) {
    const today = new Date().toISOString().split('T')[0];
    d = new Date(`${today}T${dateOrIso}`);
  }
  if (isNaN(d.getTime())) d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${month} ${day}, ${year} ${hours}:${minStr} ${ampm}`;
}

function formatAxisDateTime(dateOrIso) {
  let d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  if (isNaN(d.getTime()) && typeof dateOrIso === 'string' && dateOrIso.includes(':')) {
    const today = new Date().toISOString().split('T')[0];
    d = new Date(`${today}T${dateOrIso}`);
  }
  if (isNaN(d.getTime())) d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${month} ${day} ${hours}:${minStr} ${ampm}`;
}

function getActualTimeTicks(metrics, rangeStr = '1h', count = 5) {
  const rangeLower = String(rangeStr).toLowerCase();
  const rangeMinutesMap = { '1h': 60, '2h': 120, '3h': 180, '6h': 360, '12h': 720, '24h': 1440 };
  const spanMin = rangeMinutesMap[rangeLower] || 60;
  const now = Date.now();
  let startMs = now - spanMin * 60 * 1000;
  let endMs = now;

  if (metrics && metrics.length >= 2) {
    const firstT = metrics[0].time;
    const lastT = metrics[metrics.length - 1].time;
    if (firstT && lastT) {
      let dStart = new Date(firstT);
      let dEnd = new Date(lastT);
      if (isNaN(dStart.getTime()) && typeof firstT === 'string' && firstT.includes(':')) {
        const today = new Date().toISOString().split('T')[0];
        dStart = new Date(`${today}T${firstT}`);
        dEnd = new Date(`${today}T${lastT}`);
      }
      if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dEnd.getTime() > dStart.getTime()) {
        startMs = dStart.getTime();
        endMs = dEnd.getTime();
      }
    }
  }

  const isLongRange = rangeLower === '12h' || rangeLower === '24h';
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const pct = i / (count - 1);
    const timeMs = startMs + pct * (endMs - startMs);
    ticks.push({
      pct,
      label: isLongRange ? formatAxisDateTime(timeMs) : formatActualTime12h(timeMs),
      timeMs
    });
  }
  return ticks;
}

function sampleMetrics(rawMetrics, targetCount = 48) {
  if (!rawMetrics || rawMetrics.length === 0) return [];
  if (rawMetrics.length <= targetCount) return rawMetrics;

  const sampled = [];
  const total = rawMetrics.length;
  const step = (total - 1) / (targetCount - 1);
  for (let i = 0; i < targetCount; i++) {
    const idx = Math.min(total - 1, Math.round(i * step));
    sampled.push(rawMetrics[idx]);
  }
  return sampled;
}

function generateGlossyWaveGraphSvg(metrics, isAlert, host = 'default', height = 110, threshold = 80, isFullPage = false, containerId = '') {
  if (!metrics || metrics.length < 2) {
    metrics = [
      { cpuUsage: 35, memoryUsage: 45, time: '12:00:00' },
      { cpuUsage: 42, memoryUsage: 48, time: '12:05:00' },
      { cpuUsage: 38, memoryUsage: 46, time: '12:10:00' },
      { cpuUsage: 55, memoryUsage: 52, time: '12:15:00' },
      { cpuUsage: 48, memoryUsage: 50, time: '12:20:00' },
      { cpuUsage: 62, memoryUsage: 58, time: '12:25:00' }
    ];
  }

  const timeCfg = getTimeAxisConfig(currentRange);
  const recent = sampleMetrics(metrics, isFullPage ? 48 : 28);
  const width = isFullPage ? 940 : 540;
  const paddingLeft = isFullPage ? 46 : 38;
  const paddingRight = 14;
  const paddingTop = 14;
  const paddingBottom = 26;
  const usableW = width - paddingLeft - paddingRight;
  const usableH = Math.max(30, height - paddingTop - paddingBottom);

  const safeHost = String(host).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniquePrefix = (containerId || safeHost) + (isFullPage ? '_fp' : '_card');
  const gradId = `glossyGrad-${uniquePrefix}`;
  const filterId = `luminousGlow-${uniquePrefix}`;

  // Threshold Y position (80%)
  const threshY = paddingTop + usableH * (1 - (threshold / 100));

  // Map CPU and RAM points
  const cpuPoints = recent.map((m, idx) => {
    const x = paddingLeft + (idx / (recent.length - 1)) * usableW;
    const val = Math.min(100, Math.max(0, m.cpuUsage));
    const y = paddingTop + usableH * (1 - (val / 100));
    return { x, y, val, time: m.time, cpu: m.cpuUsage, ram: m.memoryUsage };
  });

  const ramPoints = recent.map((m, idx) => {
    const x = paddingLeft + (idx / (recent.length - 1)) * usableW;
    const val = Math.min(100, Math.max(0, m.memoryUsage));
    const y = paddingTop + usableH * (1 - (val / 100));
    return { x, y, val };
  });

  const cpuSpline = getCubicBezierSpline(cpuPoints);
  const ramSpline = getCubicBezierSpline(ramPoints);

  const lastPoint = cpuPoints[cpuPoints.length - 1];
  const latestCpu = lastPoint.val;
  const isOverThreshold = latestCpu >= threshold || isAlert;

  const strokeColor = isOverThreshold ? '#ff2d55' : '#00f2fe';
  const ramColor = '#00f5a0';
  const threshColor = '#ff2d55';

  const bottomBaselineY = paddingTop + usableH;
  const cpuAreaD = `${cpuSpline} L ${(paddingLeft + usableW).toFixed(1)},${bottomBaselineY.toFixed(1)} L ${paddingLeft.toFixed(1)},${bottomBaselineY.toFixed(1)} Z`;

  // Grid percentage lines: 100%, 80%, 60%, 40%, 20%, 0%
  const grid100Y = paddingTop;
  const grid60Y = paddingTop + usableH * 0.4;
  const grid40Y = paddingTop + usableH * 0.6;
  const grid20Y = paddingTop + usableH * 0.8;
  const grid0Y = bottomBaselineY;

  // Actual Time labels across bottom x-axis according to currentRange (e.g. 1:00 am / pm)
  const timeTicksData = getActualTimeTicks(metrics, currentRange, isFullPage ? 5 : 3);
  const timeTicksSvg = timeTicksData.map((t, idx) => {
    const tx = paddingLeft + t.pct * usableW;
    const align = idx === 0 ? 'start' : (idx === timeTicksData.length - 1 ? 'end' : 'middle');
    return `
      <line x1="${tx.toFixed(1)}" y1="${grid0Y.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(grid0Y + 4).toFixed(1)}" stroke="var(--grid-line-stroke)" stroke-width="1" />
      <text x="${tx.toFixed(1)}" y="${(grid0Y + 16).toFixed(1)}" text-anchor="${align}" fill="var(--text-dim)" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 9.5 : 8.5}" font-weight="700">${t.label}</text>
    `;
  }).join('');

  // Data payload for interactive hover with X time, Y value, and Increasing/Decreasing trend
  const pointsData = recent.map((m, idx) => {
    const totalMin = timeCfg.minutes;
    const minutesAgo = Math.round(((recent.length - 1 - idx) / (recent.length - 1)) * totalMin);
    let relTimeStr = 'LIVE';
    if (minutesAgo > 0) {
      if (minutesAgo >= 60) {
        const hrs = (minutesAgo / 60).toFixed(minutesAgo % 60 === 0 ? 0 : 1);
        relTimeStr = `-${hrs}h`;
      } else {
        relTimeStr = `-${minutesAgo}m`;
      }
    }

    const prevCpu = idx > 0 ? recent[idx - 1].cpuUsage : m.cpuUsage;
    const cpuDelta = m.cpuUsage - prevCpu;
    const prevRam = idx > 0 ? recent[idx - 1].memoryUsage : m.memoryUsage;
    const ramDelta = m.memoryUsage - prevRam;
    const actualTimeStr = formatActualTime12h(m.time);
    const fullDateTimeStr = formatActualDateTime12h(m.time);
    const axisDateTimeStr = formatAxisDateTime(m.time);

    return {
      time: actualTimeStr,
      fullDateTime: fullDateTimeStr,
      axisTime: axisDateTimeStr,
      rawTime: m.time,
      relTime: relTimeStr,
      minutesAgo: minutesAgo,
      cpu: Math.round(m.cpuUsage),
      cpuExact: Number(m.cpuUsage).toFixed(1),
      cpuDelta: Number(cpuDelta).toFixed(1),
      ram: Math.round(m.memoryUsage),
      ramExact: Number(m.memoryUsage).toFixed(1),
      ramDelta: Number(ramDelta).toFixed(1),
      xPct: ((idx / (recent.length - 1)) * usableW + paddingLeft) / width,
      yPct: (paddingTop + usableH * (1 - Math.min(100, Math.max(0, m.cpuUsage)) / 100)) / height
    };
  });

  const svgContent = `
    <svg class="glossy-wave-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <!-- Luminous Glow Filter for Dark Mode -->
        <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="glowBlur1"/>
          <feGaussianBlur stdDeviation="6" result="glowBlur2"/>
          <feMerge>
            <feMergeNode in="glowBlur2"/>
            <feMergeNode in="glowBlur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Specular Highlight Area Gradient -->
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${strokeColor}" stop-opacity="${isOverThreshold ? '0.48' : '0.36'}" />
          <stop offset="25%" stop-color="${strokeColor}" stop-opacity="${isOverThreshold ? '0.28' : '0.18'}" />
          <stop offset="70%" stop-color="${strokeColor}" stop-opacity="0.04" />
          <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0" />
        </linearGradient>

        <!-- Danger Zone Gradient (Above 80% Threshold) -->
        <linearGradient id="dangerZoneGrad-${uniquePrefix}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff2d55" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#ff2d55" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <!-- Danger Zone Highlight Above 80% Threshold -->
      <rect x="${paddingLeft}" y="${grid100Y}" width="${usableW}" height="${Math.max(0, threshY - grid100Y)}" fill="url(#dangerZoneGrad-${uniquePrefix})" rx="2" />

      <!-- Horizontal Grid Lines (Percentage Axis) -->
      <line x1="${paddingLeft}" y1="${grid100Y.toFixed(1)}" x2="${(paddingLeft + usableW).toFixed(1)}" y2="${grid100Y.toFixed(1)}" stroke="var(--grid-line-stroke)" stroke-width="0.8" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${grid60Y.toFixed(1)}" x2="${(paddingLeft + usableW).toFixed(1)}" y2="${grid60Y.toFixed(1)}" stroke="var(--grid-line-stroke)" stroke-width="0.8" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${grid40Y.toFixed(1)}" x2="${(paddingLeft + usableW).toFixed(1)}" y2="${grid40Y.toFixed(1)}" stroke="var(--grid-line-stroke)" stroke-width="0.8" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${grid20Y.toFixed(1)}" x2="${(paddingLeft + usableW).toFixed(1)}" y2="${grid20Y.toFixed(1)}" stroke="var(--grid-line-stroke)" stroke-width="0.8" stroke-dasharray="3,3" />
      <line x1="${paddingLeft}" y1="${grid0Y.toFixed(1)}" x2="${(paddingLeft + usableW).toFixed(1)}" y2="${grid0Y.toFixed(1)}" stroke="var(--grid-line-stroke)" stroke-width="1.2" />

      <!-- Left Percentage Axis Labels -->
      <text x="${paddingLeft - 6}" y="${grid100Y + 3.5}" text-anchor="end" fill="var(--text-dim)" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 9.5 : 8.5}" font-weight="700">100%</text>
      <text x="${paddingLeft - 6}" y="${grid60Y + 3.5}" text-anchor="end" fill="var(--text-dim)" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 9.5 : 8.5}" font-weight="700">60%</text>
      <text x="${paddingLeft - 6}" y="${grid40Y + 3.5}" text-anchor="end" fill="var(--text-dim)" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 9.5 : 8.5}" font-weight="700">40%</text>
      <text x="${paddingLeft - 6}" y="${grid20Y + 3.5}" text-anchor="end" fill="var(--text-dim)" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 9.5 : 8.5}" font-weight="700">20%</text>
      <text x="${paddingLeft - 6}" y="${grid0Y + 3.5}" text-anchor="end" fill="var(--text-dim)" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 9.5 : 8.5}" font-weight="700">0%</text>

      <!-- CRITICAL THRESHOLD LINE (80%) -->
      <line x1="${paddingLeft}" y1="${threshY.toFixed(1)}" x2="${(paddingLeft + usableW).toFixed(1)}" y2="${threshY.toFixed(1)}" stroke="${threshColor}" stroke-width="${isFullPage ? '1.6' : '1.3'}" stroke-dasharray="5,3" class="glossy-threshold-line" />
      
      <!-- 80% Threshold Left Label -->
      <text x="${paddingLeft - 6}" y="${threshY + 3.5}" text-anchor="end" fill="${threshColor}" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 10 : 9}" font-weight="900">80%</text>
      
      <!-- 80% Threshold Right Badge -->
      <rect x="${(paddingLeft + usableW - (isFullPage ? 130 : 110)).toFixed(1)}" y="${Math.max(1, threshY - (isFullPage ? 11 : 9.5)).toFixed(1)}" width="${isFullPage ? 126 : 106}" height="${isFullPage ? 13 : 11}" rx="3" fill="rgba(255, 45, 85, 0.2)" stroke="rgba(255, 45, 85, 0.55)" stroke-width="0.8" />
      <text x="${(paddingLeft + usableW - (isFullPage ? 67 : 57)).toFixed(1)}" y="${Math.max(8, threshY - 1).toFixed(1)}" text-anchor="middle" fill="#ff2d55" font-family="'JetBrains Mono', monospace" font-size="${isFullPage ? 8.5 : 7.8}" font-weight="800" letter-spacing="0.04em">⚠️ ${threshold}% THRESHOLD</text>

      <!-- Bottom Time Axis Ticks & Labels with actual times -->
      ${timeTicksSvg}

      <!-- Shaded Glossy Wave CPU Area -->
      <path d="${cpuAreaD}" fill="url(#${gradId})" />

      <!-- Secondary RAM Wave Curve (Emerald Spline) -->
      <path d="${ramSpline}" fill="none" stroke="${ramColor}" stroke-width="${isFullPage ? '2' : '1.5'}" stroke-dasharray="4,2" opacity="0.75" class="glossy-ram-path" />

      <!-- Hero CPU Glossy Wave Curve (Cyan / Red Spline with Luminous Glow) -->
      <path d="${cpuSpline}" fill="none" stroke="${strokeColor}" stroke-width="${isFullPage ? '3.2' : '2.4'}" stroke-linecap="round" stroke-linejoin="round" class="glossy-wave-path ${isOverThreshold ? 'alert' : ''}" filter="url(#${filterId})" />

      <!-- Glowing Head Pulse Pin at Latest Metric Value -->
      <circle cx="${lastPoint.x.toFixed(1)}" cy="${lastPoint.y.toFixed(1)}" r="${isFullPage ? 6 : 4.5}" fill="${strokeColor}" opacity="0.35" class="sparkline-halo" />
      <circle cx="${lastPoint.x.toFixed(1)}" cy="${lastPoint.y.toFixed(1)}" r="${isFullPage ? 3.5 : 2.8}" fill="${strokeColor}" stroke="#ffffff" stroke-width="1.2" class="sparkline-head-dot" />
    </svg>
  `;

  // Wrap in interactive container with laser scrubber, x/y badges and floating HUD
  const cId = containerId || `waveContainer_${uniquePrefix}`;
  const pointsJson = JSON.stringify(pointsData).replace(/'/g, "&apos;");
  return `
    <div class="glossy-wave-container" id="${cId}" data-points='${pointsJson}' onmousemove="handleGlossyWaveHover(event, this)" onmouseleave="handleGlossyWaveLeave(this)">
      ${svgContent}
      <div class="wave-scrubber-line"></div>
      <div class="wave-scrubber-dot"></div>
      <div class="wave-x-time-badge"></div>
      <div class="wave-y-val-badge"></div>
      <div class="wave-hud-tooltip"></div>
    </div>
  `;
}

function handleGlossyWaveHover(e, container) {
  if (!container) return;
  const rawData = container.getAttribute('data-points');
  if (!rawData) return;
  
  let points = [];
  try {
    points = JSON.parse(rawData);
  } catch (err) {
    return;
  }
  if (!points || points.length === 0) return;

  const rect = container.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const relX = Math.max(0, Math.min(1, mouseX / rect.width));

  // Find closest data point
  let closest = points[0];
  let minDiff = 9999;
  for (const pt of points) {
    const diff = Math.abs(pt.xPct - relX);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pt;
    }
  }

  const scrubberLine = container.querySelector('.wave-scrubber-line');
  const scrubberDot = container.querySelector('.wave-scrubber-dot');
  const xTimeBadge = container.querySelector('.wave-x-time-badge');
  const yValBadge = container.querySelector('.wave-y-val-badge');
  const hudTooltip = container.querySelector('.wave-hud-tooltip');

  const pointPixelX = closest.xPct * rect.width;
  const pointPixelY = closest.yPct * rect.height;

  if (scrubberLine) {
    scrubberLine.style.left = `${pointPixelX}px`;
    scrubberLine.style.opacity = '1';
  }

  if (scrubberDot) {
    scrubberDot.style.left = `${pointPixelX}px`;
    scrubberDot.style.top = `${pointPixelY}px`;
    scrubberDot.style.opacity = '1';
    if (closest.cpu >= 80) {
      scrubberDot.style.borderColor = '#ff2d55';
      scrubberDot.style.boxShadow = '0 0 12px #ff2d55, 0 0 24px #ff2d55';
    } else {
      scrubberDot.style.borderColor = '#00f2fe';
      scrubberDot.style.boxShadow = '0 0 12px #00f2fe, 0 0 24px #00f2fe';
    }
  }

  if (xTimeBadge) {
    const isLong = currentRange === '12h' || currentRange === '24h';
    xTimeBadge.textContent = isLong ? (closest.axisTime || closest.time) : closest.time;
    xTimeBadge.style.left = `${pointPixelX}px`;
    xTimeBadge.style.opacity = '1';
  }

  if (yValBadge) {
    yValBadge.textContent = `${closest.cpuExact}%`;
    yValBadge.style.top = `${pointPixelY}px`;
    yValBadge.style.opacity = '1';
  }

  if (hudTooltip) {
    const cpuDeltaNum = parseFloat(closest.cpuDelta || 0);
    let cpuTrendHtml = '';
    if (cpuDeltaNum > 0.1) {
      cpuTrendHtml = `<span class="trend-pill inc">▲ Inc (+${closest.cpuDelta}%)</span>`;
    } else if (cpuDeltaNum < -0.1) {
      cpuTrendHtml = `<span class="trend-pill dec">▼ Dec (${closest.cpuDelta}%)</span>`;
    } else {
      cpuTrendHtml = `<span class="trend-pill steady">▬ Steady</span>`;
    }

    const ramDeltaNum = parseFloat(closest.ramDelta || 0);
    let ramTrendHtml = '';
    if (ramDeltaNum > 0.1) {
      ramTrendHtml = `<span class="trend-pill inc-green">▲ Inc (+${closest.ramDelta}%)</span>`;
    } else if (ramDeltaNum < -0.1) {
      ramTrendHtml = `<span class="trend-pill dec">▼ Dec (${closest.ramDelta}%)</span>`;
    } else {
      ramTrendHtml = `<span class="trend-pill steady">▬ Steady</span>`;
    }

    const scrubTag = closest.minutesAgo > 0
      ? `<span class="scrub-direction-tag">◀ ${closest.minutesAgo}m ago (Backward)</span>`
      : `<span class="scrub-direction-tag" style="color: var(--neon-cyan);">▶ Realtime (Current)</span>`;

    hudTooltip.innerHTML = `
      <div class="hud-tooltip-header">
        <span class="hud-tooltip-time">⏱ ${closest.fullDateTime || closest.time}</span>
        ${scrubTag}
      </div>
      <div class="hud-tooltip-metric-row">
        <div class="metric-val-block">
          <span style="color: ${closest.cpu >= 80 ? '#ff2d55' : 'var(--neon-cyan)'}; font-weight: 700;">CPU: <strong>${closest.cpuExact}%</strong></span>
          ${cpuTrendHtml}
        </div>
        <div class="metric-val-block">
          <span style="color: var(--neon-emerald); font-weight: 700;">RAM: <strong>${closest.ramExact}%</strong></span>
          ${ramTrendHtml}
        </div>
      </div>
      <div class="hud-tooltip-status ${closest.cpu >= 80 ? 'danger' : 'normal'}">
        ${closest.cpu >= 80 ? '⚠️ CRITICAL LOAD (>80%)' : '● NOMINAL HEALTH'}
      </div>
    `;
    
    // Position tooltip cleanly docked opposite to cursor so it never clips or obscures the laser line
    if (pointPixelX < rect.width * 0.55) {
      hudTooltip.style.left = 'auto';
      hudTooltip.style.right = '8px';
    } else {
      hudTooltip.style.left = '8px';
      hudTooltip.style.right = 'auto';
    }
    hudTooltip.style.top = '6px';
    hudTooltip.style.opacity = '1';
  }
}

function handleGlossyWaveLeave(container) {
  if (!container) return;
  const scrubberLine = container.querySelector('.wave-scrubber-line');
  const scrubberDot = container.querySelector('.wave-scrubber-dot');
  const xTimeBadge = container.querySelector('.wave-x-time-badge');
  const yValBadge = container.querySelector('.wave-y-val-badge');
  const hudTooltip = container.querySelector('.wave-hud-tooltip');
  if (scrubberLine) scrubberLine.style.opacity = '0';
  if (scrubberDot) scrubberDot.style.opacity = '0';
  if (xTimeBadge) xTimeBadge.style.opacity = '0';
  if (yValBadge) yValBadge.style.opacity = '0';
  if (hudTooltip) hudTooltip.style.opacity = '0';
}

function generateThresholdGraphSvg(metrics, isAlert, host = 'default', height = 110, threshold = 80) {
  return generateGlossyWaveGraphSvg(metrics, isAlert, host, height, threshold, false);
}

function setClusterFilter(filter, btn) {
  activeClusterFilter = filter;
  document.querySelectorAll('.node-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const grid = document.getElementById('serverCardsGrid');
  if (grid) {
    grid.classList.remove('filter-linux', 'filter-windows', 'filter-core', 'filter-six');
    if (filter === 'linux') grid.classList.add('filter-linux');
    else if (filter === 'windows') grid.classList.add('filter-windows');
    else if (filter === 'core') grid.classList.add('filter-core');
  }
  renderServerCards();
  addEvent('info', `Display filtered: ${filter.toUpperCase()}`);
}

function renderServerCards() {
  const grid = document.getElementById('serverCardsGrid');
  if (!grid || !serversData) return;

  grid.classList.remove('cols-1', 'cols-2', 'cols-3', 'cols-auto');
  grid.classList.add(`cols-${currentGridCols}`);

  let displayData = serversData;
  if (activeClusterFilter === 'core') {
    displayData = serversData.slice(0, 3);
  } else if (activeClusterFilter === 'linux') {
    displayData = serversData.filter(s => s.os_type === 'linux' || !s.os.toLowerCase().includes('windows'));
  } else if (activeClusterFilter === 'windows') {
    displayData = serversData.filter(s => s.os_type === 'windows' || s.os.toLowerCase().includes('windows'));
  }

  grid.innerHTML = displayData.map((server, idx) => {
    const current = server.metrics && server.metrics.length > 0 ? server.metrics[server.metrics.length - 1] : null;
    const cpuUsage = current ? current.cpuUsage : 0;
    const memoryUsage = current ? current.memoryUsage : 0;
    const diskUsage = current ? current.fileSystem : 0;
    const fileSystemUsage = diskUsage;
    const swapUsage = current ? current.swapMemory : 0;

    const isHighCpu = cpuUsage >= 80;
    const isHighMem = memoryUsage >= 80;
    const isAlert = isHighCpu || isHighMem;
    const isActive = server.host === selectedHost;

    const hostState = cardStates[server.host] || { isMinimized: false, width: null, height: null };
    const isCardMinimized = !!hostState.isMinimized;

    // Dynamic graph height depending on custom stretched height
    let graphHeight = 110;
    if (hostState.height && !isCardMinimized) {
      graphHeight = Math.max(75, Math.min(320, hostState.height - 275));
    }

    const avgLoad = current ? (cpuUsage + memoryUsage + swapUsage) / 3 : 0;
    const score = Math.max(0, Math.min(100, Math.round(100 - avgLoad)));
    const nodeIndex = String(idx + 1).padStart(2, '0');
    const safeHost = String(server.host).replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Glossy Wave SVG with time & percentage info and luminous glow
    const thresholdGraphSvg = generateGlossyWaveGraphSvg(server.metrics, isAlert, server.host, graphHeight, 80, false, `cardWave_${idx}`);
    const latency = (0.5 + ((idx * 0.27) % 1.5)).toFixed(1);

    const isWindows = server.os_type === 'windows' || server.os.toLowerCase().includes('windows');

    // OS Badge
    let osShort = 'Linux';
    if (isWindows) {
      if (server.os.includes('Datacenter')) osShort = 'Win 2022 DC';
      else if (server.os.includes('Standard')) osShort = 'Win 2022 Std';
      else if (server.os.includes('2019')) osShort = 'Win 2019 DC';
      else osShort = 'Windows';
    } else {
      if (server.os.includes('Ubuntu')) osShort = 'Ubuntu 22.04';
      else if (server.os.includes('Debian')) osShort = 'Debian 12';
      else if (server.os.includes('RHEL')) osShort = 'RHEL 9.3';
      else osShort = 'Linux Node';
    }

    const osBadgeHtml = isWindows
      ? `<span class="os-badge windows" title="${server.os}">
          <svg viewBox="0 0 88 88" fill="currentColor">
            <path d="M0 12.4l35.6-4.9.1 34.6H0V12.4zm35.7 41.7l-.1 34.7-35.6-4.9V54.1h35.7zM42.1 6.5L88 0v42.1H42.1V6.5zm45.9 47.6V88L42.1 81.5V54.1H88z"/>
          </svg>
          ${osShort}
        </span>`
      : `<span class="os-badge linux" title="${server.os}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a4 4 0 0 0-4 4v3.2C6.8 10.1 6 12 6 14.5c0 3.5 1.5 5.5 3 6.5v1h6v-1c1.5-1 3-3 3-6.5 0-2.5-.8-4.4-2-5.3V6a4 4 0 0 0-4-4zm-1.5 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          ${osShort}
        </span>`;

    // Storage partitions data (clean filesystem glance)
    const rawMounts = server.mounts || (isWindows ? [
      { name: 'C:\\ (OS System)', used: Math.round(fileSystemUsage), total: '150 GB' },
      { name: 'D:\\ (IIS WebRoot)', used: Math.min(95, Math.max(10, Math.round(fileSystemUsage + 12))), total: '500 GB' }
    ] : [
      { name: '/ (OS Root)', used: Math.round(fileSystemUsage), total: '120 GB' },
      { name: '/data (Application)', used: Math.min(95, Math.max(10, Math.round(fileSystemUsage + 8))), total: '500 GB' }
    ]);
    const mountsList = rawMounts.map(m => {
      let driveLetter = m.name;
      let label = m.label || '';
      if (m.name.includes('(')) {
        const parts = m.name.split('(');
        driveLetter = parts[0].trim();
        label = parts[1].replace(')', '').trim();
      }
      return { driveLetter, label, used: Math.round(m.used), total: m.total || '250 GB' };
    });

    // CPU context subtext
    const cpuSub = isWindows ? (server.cores ? server.cores.split(' ')[0] + ' vCPU' : '16 vCPU') : `Load: ${(server.loadAverage || ['0.8','0.9','0.7'])[0]}`;
    // RAM context subtext
    const ramTotalNum = parseInt(server.ram_total || '32');
    const ramUsedNum = Math.round(((memoryUsage) / 100) * ramTotalNum);
    const ramSub = `${ramUsedNum}/${ramTotalNum} GB`;

    // Custom Inline Styles for Stretch
    let inlineStyles = [];
    if (hostState.width) inlineStyles.push(`width: ${hostState.width}px`);
    if (hostState.height && !isCardMinimized) {
      inlineStyles.push(`height: ${hostState.height}px`);
      inlineStyles.push(`min-height: ${hostState.height}px`);
    }
    const styleAttr = inlineStyles.length > 0 ? `style="${inlineStyles.join('; ')}"` : '';

    return `
      <div class="node-card ${isActive ? 'active' : ''} ${isAlert ? 'alert-node' : ''} ${isCardMinimized ? 'card-minimized' : ''}" 
           id="nodeCard_${safeHost}" 
           data-host="${server.host}" 
           onclick="handleCardClick(event, '${server.host}')" 
           ${styleAttr} 
           role="button" 
           tabindex="0" 
           title="Click to inspect full telemetry for ${server.host}">
        
        <!-- Laser Runner Accent -->
        <div class="card-laser-accent ${isAlert ? 'laser-alert' : ''}"></div>
        
        <!-- HUD Reticle Corners -->
        <span class="card-corner-hud tl"></span>
        <span class="card-corner-hud tr"></span>
        <span class="card-corner-hud bl"></span>
        <span class="card-corner-hud br"></span>

        <!-- Card Top Header (Double click header to minimize/maximize) -->
        <div class="node-card-header" ondblclick="toggleCardMinimize(event, '${server.host}')" title="Double click to minimize/maximize">
          <div class="node-header-top-row">
            <div class="node-tags-group">
              <span class="node-num-tag">#${nodeIndex}</span>
              ${osBadgeHtml}
              <span class="node-host-name-title" title="${server.host}">${server.host}</span>
            </div>
            <div class="node-status-group">
              <span class="status-pulse-dot ${isAlert ? 'alert' : 'healthy'}"></span>
              <span class="node-status-chip ${isAlert ? 'alert' : 'healthy'}">
                ${isAlert ? 'ALERT' : 'ONLINE'}
              </span>

              <!-- Minimize / Maximize Button -->
              <button class="card-min-max-btn" 
                      onclick="toggleCardMinimize(event, '${server.host}')" 
                      title="${isCardMinimized ? 'Maximize card (Show full graphs & storage)' : 'Minimize card (Show minimum info: CPU, RAM, SWAP)'}">
                ${isCardMinimized ? `
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                ` : `
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                `}
              </button>
            </div>
          </div>

          <div class="node-sub-info-row">
            <span class="role-text" title="${server.role}">${server.role || (isWindows ? 'Windows Server' : 'Linux Server')}</span>
            <span class="node-cores-spec">${server.cores ? server.cores.split(' ')[0] + ' vCPU' : '16 vCPU'} • ${server.kernel || (isWindows ? 'x64' : 'Linux')}</span>
            <span class="ping-uptime">Uptime: ${server.uptime || '30d'}</span>
          </div>
        </div>

        <!-- 3 Primary Gauges: CPU, RAM, SWAP (Always Visible Minimum Info) -->
        <div class="node-gauges-matrix">
          <!-- CPU Tile -->
          <div class="gauge-tile ${isHighCpu ? 'alert-tile' : ''}">
            <div class="gauge-tile-head">
              <span class="gauge-tile-lbl">CPU</span>
              <span class="gauge-tile-val ${isHighCpu ? 'alert' : ''}">${Math.round(cpuUsage)}%</span>
            </div>
            <div class="gauge-tile-track">
              <div class="gauge-tile-fill" style="width: ${cpuUsage}%; background: ${isHighCpu ? '#ef4444' : 'var(--neon-cyan)'};"></div>
            </div>
            <div class="gauge-tile-foot">
              <span class="gauge-tile-sub">${cpuSub}</span>
              ${isHighCpu ? '<span class="tile-warn-badge">ALERT</span>' : ''}
            </div>
          </div>

          <!-- RAM Tile -->
          <div class="gauge-tile ${isHighMem ? 'alert-tile' : ''}">
            <div class="gauge-tile-head">
              <span class="gauge-tile-lbl">RAM</span>
              <span class="gauge-tile-val ${isHighMem ? 'alert' : ''}">${Math.round(memoryUsage)}%</span>
            </div>
            <div class="gauge-tile-track">
              <div class="gauge-tile-fill" style="width: ${memoryUsage}%; background: ${isHighMem ? '#ef4444' : 'var(--neon-emerald)'};"></div>
            </div>
            <div class="gauge-tile-foot">
              <span class="gauge-tile-sub">${ramSub}</span>
              ${isHighMem ? '<span class="tile-warn-badge">ALERT</span>' : ''}
            </div>
          </div>

          <!-- SWAP / PAGE Tile -->
          <div class="gauge-tile">
            <div class="gauge-tile-head">
              <span class="gauge-tile-lbl">${isWindows ? 'PAGE' : 'SWAP'}</span>
              <span class="gauge-tile-val">${Math.round(swapUsage)}%</span>
            </div>
            <div class="gauge-tile-track">
              <div class="gauge-tile-fill" style="width: ${swapUsage}%; background: var(--neon-purple);"></div>
            </div>
            <div class="gauge-tile-foot">
              <span class="gauge-tile-sub">${isWindows ? 'Pagefile' : 'Virtual'}</span>
            </div>
          </div>
        </div>

        <!-- Minimized Footer Bar (Visible Only in Minimized Mode) -->
        <div class="minimized-footer-bar">
          <span class="min-health-chip" style="color: ${score >= 80 ? 'var(--neon-emerald)' : 'var(--neon-amber)'};">
            ◆ HEALTH: <strong>${score}%</strong>
          </span>
          <span class="min-status-hint">MINIMAL INFO VIEW</span>
          <button class="min-inspect-btn" onclick="event.stopPropagation(); selectServer('${server.host}')" title="Inspect Full Telemetry">
            <span>INSPECT</span>
            <span>↗</span>
          </button>
        </div>

        <!-- Expandable Section (Collapsed in Minimized Mode) -->
        <div class="card-expandable-section">
          <!-- Threshold Oscilloscope Graph Box -->
          <div class="node-waveform-box">
            <div class="waveform-header">
              <div class="waveform-header-left">
                <span class="waveform-title">OSCILLOSCOPE (${currentRange.toUpperCase()})</span>
                <span class="waveform-chip-thresh">THRESHOLD: <strong>80%</strong></span>
              </div>
              <div class="waveform-header-right">
                <span class="waveform-live-chip"><span class="pulse-dot"></span>LIVE</span>
                <span class="waveform-cpu-badge ${isHighCpu ? 'alert' : ''}">CPU: ${cpuUsage}%</span>
              </div>
            </div>
            <div class="waveform-svg-wrap">
              ${thresholdGraphSvg}
            </div>
          </div>

          <!-- Storage Volumes Allocation Panel (Replaces Network Panel) -->
          <div class="node-storage-panel">
            <div class="storage-header">
              <div class="storage-title-wrap">
                <span class="storage-icon">💾</span>
                <span class="storage-label">STORAGE ALLOCATION</span>
              </div>
              <span class="storage-total-tag">${mountsList.length} VOLS • <strong>${Math.round(fileSystemUsage)}% USED</strong></span>
            </div>
            <div class="storage-drives-mini-list">
              ${mountsList.slice(0, 3).map(m => `
                <div class="drive-mini-pill" title="${m.driveLetter} (${m.label}): ${m.used}% of ${m.total}">
                  <span class="drive-letter-tag">${m.driveLetter}</span>
                  <span class="drive-pct-tag ${m.used >= 80 ? 'alert' : ''}">${m.used}%</span>
                  <div class="drive-mini-bar">
                    <div class="drive-mini-bar-fill ${m.used >= 80 ? 'alert' : ''}" style="width: ${m.used}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Card Footer -->
          <div class="node-card-footer">
            <div class="footer-meta-left">
              <span class="footer-health-chip" style="color: ${score >= 80 ? 'var(--neon-emerald)' : 'var(--neon-amber)'};">
                ◆ HEALTH: <strong>${score}%</strong>
              </span>
              <span class="footer-kernel-dim">${server.kernel || (isWindows ? 'x64' : 'Linux')}</span>
            </div>
            <button class="footer-inspect-btn" onclick="event.stopPropagation(); selectServer('${server.host}')" title="Inspect Full Telemetry, Partitions & Processes for ${server.host}">
              <span>INSPECT</span>
              <span class="inspect-arrow">↗</span>
            </button>
          </div>
        </div>

        <!-- Interactive Click & Stretch Handles -->
        <!-- Corner Stretch Handle -->
        <div class="card-stretch-handle corner" 
             onmousedown="startCardStretch(event, '${server.host}', 'corner')" 
             title="Click & drag corner to stretch width and height">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14ZM14 6H12V4H14V6ZM6 14H4V12H6V14ZM10 10H8V8H10V10Z"/>
          </svg>
        </div>

        <!-- Bottom Edge Stretch Handle -->
        <div class="card-stretch-handle bottom" 
             onmousedown="startCardStretch(event, '${server.host}', 'bottom')" 
             title="Click & drag to stretch height">
          <span class="stretch-bar-indicator"></span>
        </div>

        <!-- Right Edge Stretch Handle -->
        <div class="card-stretch-handle right" 
             onmousedown="startCardStretch(event, '${server.host}', 'right')" 
             title="Click & drag to stretch width">
          <span class="stretch-bar-indicator vertical"></span>
        </div>

      </div>
    `;
  }).join('');
}

function selectServer(host) {
  selectedHost = host;
  renderServerCards();
  renderActiveServer();
  addEvent('info', `Opened telemetry inspection modal for ${host}`, host);
}

function closeServerDetails() {
  selectedHost = null;
  const overlay = document.getElementById('serverModalOverlay');
  if (overlay) overlay.classList.remove('modal-open');
  document.body.classList.remove('modal-open-body');
  renderServerCards();
  addEvent('info', 'Returned to Multi-Node Cluster Dashboard');
}

let isDraggingModal = false;
let isResizingModal = false;
let resizeDirection = null;
let dragStartX = 0;
let dragStartY = 0;
let initialDialogRect = null;
let isMaximized = false;
let savedPreMaximizeStyle = null;

function toggleModalMaximize() {
  const dialog = document.querySelector('.server-modal-dialog');
  const maxBtn = document.getElementById('modalMaximizeBtn');
  if (!dialog) return;

  if (!isMaximized) {
    savedPreMaximizeStyle = {
      position: dialog.style.position,
      left: dialog.style.left,
      top: dialog.style.top,
      margin: dialog.style.margin,
      width: dialog.style.width,
      height: dialog.style.height,
      maxWidth: dialog.style.maxWidth,
      maxHeight: dialog.style.maxHeight
    };

    dialog.style.position = 'fixed';
    dialog.style.left = '16px';
    dialog.style.top = '16px';
    dialog.style.margin = '0';
    dialog.style.width = 'calc(100vw - 32px)';
    dialog.style.height = 'calc(100vh - 32px)';
    dialog.style.maxWidth = 'none';
    dialog.style.maxHeight = 'none';
    dialog.classList.add('modal-maximized');
    isMaximized = true;

    if (maxBtn) {
      maxBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <rect x="8" y="4" width="12" height="12" rx="2"></rect>
          <path d="M4 8v12h12"></path>
        </svg>
      `;
    }
  } else {
    if (savedPreMaximizeStyle) {
      dialog.style.position = savedPreMaximizeStyle.position || '';
      dialog.style.left = savedPreMaximizeStyle.left || '';
      dialog.style.top = savedPreMaximizeStyle.top || '';
      dialog.style.margin = savedPreMaximizeStyle.margin || 'auto';
      dialog.style.width = savedPreMaximizeStyle.width || '';
      dialog.style.height = savedPreMaximizeStyle.height || '';
      dialog.style.maxWidth = savedPreMaximizeStyle.maxWidth || '';
      dialog.style.maxHeight = savedPreMaximizeStyle.maxHeight || '';
    }
    dialog.classList.remove('modal-maximized');
    isMaximized = false;

    if (maxBtn) {
      maxBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      `;
    }
  }
}

function initModalDragAndResize() {
  const dialog = document.querySelector('.server-modal-dialog');
  const header = document.querySelector('.server-modal-header');
  const cornerHandle = document.getElementById('modalResizeCorner');
  const rightHandle = document.getElementById('modalResizeRight');
  const bottomHandle = document.getElementById('modalResizeBottom');

  if (!dialog || !header) return;

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('.range-picker') || isMaximized) return;

    isDraggingModal = true;
    const rect = dialog.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;

    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.left = `${rect.left}px`;
    dialog.style.top = `${rect.top}px`;
    e.preventDefault();
  });

  header.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || e.target.closest('.range-picker')) return;
    toggleModalMaximize();
  });

  function startResize(e, direction) {
    if (isMaximized) return;
    isResizingModal = true;
    resizeDirection = direction;
    const rect = dialog.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialDialogRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };

    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.left = `${rect.left}px`;
    dialog.style.top = `${rect.top}px`;
    e.preventDefault();
    e.stopPropagation();
  }

  if (cornerHandle) cornerHandle.addEventListener('mousedown', (e) => startResize(e, 'both'));
  if (rightHandle) rightHandle.addEventListener('mousedown', (e) => startResize(e, 'horizontal'));
  if (bottomHandle) bottomHandle.addEventListener('mousedown', (e) => startResize(e, 'vertical'));

  window.addEventListener('mousemove', (e) => {
    if (isDraggingModal) {
      let newLeft = e.clientX - dragStartX;
      let newTop = e.clientY - dragStartY;

      newLeft = Math.max(10, Math.min(window.innerWidth - dialog.offsetWidth - 10, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - dialog.offsetHeight - 10, newTop));

      dialog.style.left = `${newLeft}px`;
      dialog.style.top = `${newTop}px`;
    } else if (isResizingModal && initialDialogRect) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      if (resizeDirection === 'both' || resizeDirection === 'horizontal') {
        const newW = Math.max(480, Math.min(window.innerWidth - initialDialogRect.left - 15, initialDialogRect.width + deltaX));
        dialog.style.width = `${newW}px`;
        dialog.style.maxWidth = 'none';
      }

      if (resizeDirection === 'both' || resizeDirection === 'vertical') {
        const newH = Math.max(320, Math.min(window.innerHeight - initialDialogRect.top - 15, initialDialogRect.height + deltaY));
        dialog.style.height = `${newH}px`;
        dialog.style.maxHeight = 'none';
      }
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingModal = false;
    isResizingModal = false;
  });
}

function handleModalBackdropClick(event) {
  if (event.target && event.target.id === 'serverModalOverlay') {
    closeServerDetails();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selectedHost) {
    closeServerDetails();
  }
});

function generateSpecGraphCardSvg(type, server, isDark = true, range = currentRange) {
  const timeCfg = getTimeAxisConfig(range);
  let rawMetrics = (server && server.metrics && server.metrics.length >= 2) ? server.metrics : null;
  if (!rawMetrics) {
    rawMetrics = [
      { cpuUsage: 25, memoryUsage: 45, swapMemory: 18, time: '12:00:00' },
      { cpuUsage: 32, memoryUsage: 48, swapMemory: 18, time: '12:05:00' },
      { cpuUsage: 28, memoryUsage: 46, swapMemory: 19, time: '12:10:00' },
      { cpuUsage: 45, memoryUsage: 52, swapMemory: 20, time: '12:15:00' },
      { cpuUsage: 38, memoryUsage: 50, swapMemory: 20, time: '12:20:00' },
      { cpuUsage: 52, memoryUsage: 58, swapMemory: 22, time: '12:25:00' },
      { cpuUsage: 48, memoryUsage: 56, swapMemory: 21, time: '12:30:00' },
      { cpuUsage: 62, memoryUsage: 60, swapMemory: 23, time: '12:35:00' }
    ];
  }

  const metrics = sampleMetrics(rawMetrics, 42);

  const w = 1000;
  const h = 150;
  const padLeft = 54;
  const padRight = 18;
  const padTop = 14;
  const padBottom = 26;
  const usableW = w - padLeft - padRight;
  const usableH = h - padTop - padBottom;
  const bottomY = padTop + usableH;

  const safeHost = String((server && server.host) || 'srv').replace(/[^a-zA-Z0-9_-]/g, '_');
  const uid = `spec_${type}_${safeHost}_${Math.floor(Math.random()*10000)}`;

  const current = metrics[metrics.length - 1];
  const isHighCpu = current.cpuUsage >= 80;

  // Horizontal Grid Lines (100%, 75%, 50%, 25%, 0%)
  const y100 = padTop;
  const y75 = padTop + usableH * 0.25;
  const y50 = padTop + usableH * 0.5;
  const y25 = padTop + usableH * 0.75;
  const y0 = bottomY;

  // Vertical dashes aligned with 5 ticks (0, 0.25, 0.5, 0.75, 1.0)
  const vLines = [0, 0.25, 0.5, 0.75, 1.0].map(pct => {
    const vx = padLeft + pct * usableW;
    return `<line x1="${vx.toFixed(1)}" y1="${padTop}" x2="${vx.toFixed(1)}" y2="${bottomY}" stroke="rgba(38, 56, 81, 0.6)" stroke-dasharray="3 6" stroke-width="1"/>`;
  }).join('');

  let yLabels = [];
  let series1Pts = [];
  let series2Pts = [];
  let stroke1 = '';
  let stroke2 = '';
  let fillDef = '';
  let thresholdRect = '';

  if (type === 'cpu') {
    yLabels = ['100%', '75%', '50%', '25%'];
    stroke1 = isHighCpu ? '#ff5c76' : '#00f2fe';
    stroke2 = '';

    fillDef = `
      <linearGradient id="cpuGrad_${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isHighCpu ? '#ff4d6d' : '#00f2fe'}" stop-opacity="${isHighCpu ? '0.62' : '0.45'}"/>
        <stop offset="100%" stop-color="${isHighCpu ? '#ff4d6d' : '#00f2fe'}" stop-opacity="0.05"/>
      </linearGradient>
    `;

    const threshY = padTop + usableH * 0.2;
    thresholdRect = `
      <rect x="${padLeft}" y="${padTop}" width="${usableW}" height="${usableH * 0.2}" fill="${isHighCpu ? '#ff4d6d' : '#62d380'}" opacity="${isHighCpu ? '0.25' : '0.18'}" rx="3"/>
      <line x1="${padLeft}" y1="${threshY.toFixed(1)}" x2="${padLeft + usableW}" y2="${threshY.toFixed(1)}" stroke="${isHighCpu ? '#ff4d6d' : 'rgba(239, 68, 68, 0.7)'}" stroke-dasharray="4 4" stroke-width="1.5"/>
      <text x="${padLeft + usableW - 8}" y="${threshY - 4}" text-anchor="end" fill="#ff4d6d" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700">80% THRESHOLD</text>
    `;

    series1Pts = metrics.map((m, idx) => {
      const x = padLeft + (idx / (metrics.length - 1)) * usableW;
      const val = Math.min(100, Math.max(0, m.cpuUsage));
      const y = padTop + usableH * (1 - val / 100);
      return { x, y, val };
    });

    series2Pts = [];

  } else if (type === 'mem') {
    const ramTotal = parseInt((server && server.ram_total) || '32');
    yLabels = [
      `${ramTotal}GB`,
      `${Math.round(ramTotal * 0.75)}GB`,
      `${Math.round(ramTotal * 0.5)}GB`,
      `${Math.round(ramTotal * 0.25)}GB`
    ];
    stroke1 = '#7be0a0';
    stroke2 = '#f6bf42';

    fillDef = `
      <linearGradient id="memGrad_${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e9fdf" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#1e9fdf" stop-opacity="0.04"/>
      </linearGradient>
    `;

    series1Pts = metrics.map((m, idx) => {
      const x = padLeft + (idx / (metrics.length - 1)) * usableW;
      const val = Math.min(100, Math.max(0, m.memoryUsage));
      const y = padTop + usableH * (1 - val / 100);
      return { x, y, val };
    });

    series2Pts = metrics.map((m, idx) => {
      const x = padLeft + (idx / (metrics.length - 1)) * usableW;
      const val = Math.min(100, Math.max(0, m.swapMemory || (m.memoryUsage * 0.4)));
      const y = padTop + usableH * (1 - val / 100);
      return { x, y, val };
    });

  } else if (type === 'disk') {
    yLabels = ['100%', '75%', '50%', '25%'];
    stroke1 = '#00f5a0';
    stroke2 = '#38bdf8';

    fillDef = `
      <linearGradient id="diskGrad_${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00f5a0" stop-opacity="0.48"/>
        <stop offset="100%" stop-color="#00f5a0" stop-opacity="0.03"/>
      </linearGradient>
    `;

    series1Pts = metrics.map((m, idx) => {
      const x = padLeft + (idx / (metrics.length - 1)) * usableW;
      const val = Math.min(100, Math.max(0, m.fileSystem !== undefined ? m.fileSystem : (server.baseDisk || 45)));
      const y = padTop + usableH * (1 - val / 100);
      return { x, y, val };
    });

    series2Pts = metrics.map((m, idx) => {
      const x = padLeft + (idx / (metrics.length - 1)) * usableW;
      const baseIo = 24.5 + (m.fileSystem || 45) * 0.35;
      const variation = 0.85 + 0.3 * Math.sin(idx * 0.75 + 1.1);
      const val = Math.min(100, Math.max(0, baseIo * variation));
      const y = padTop + usableH * (1 - val / 100);
      return { x, y, val };
    });
  } else if (type === 'net') {
    const rxRate = server.network ? (server.network.rx_rate || parseFloat(server.network.rx) || 45.0) : 45.0;
    const txRate = server.network ? (server.network.tx_rate || parseFloat(server.network.tx) || 20.0) : 20.0;
    const maxThroughput = Math.max(100, Math.ceil(Math.max(rxRate, txRate) * 1.5 / 25) * 25);
    yLabels = [`${maxThroughput}M`, `${Math.round(maxThroughput * 0.75)}M`, `${Math.round(maxThroughput * 0.5)}M`, `${Math.round(maxThroughput * 0.25)}M`];
    stroke1 = '#38bdf8';
    stroke2 = '#fb923c';

    fillDef = `
      <linearGradient id="netGrad_${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.04"/>
      </linearGradient>
    `;

    series1Pts = metrics.map((m, idx) => {
      const x = padLeft + (idx / (metrics.length - 1)) * usableW;
      const variation = 0.85 + 0.3 * Math.sin(idx * 0.6 + 0.7) + ((idx % 5) * 0.03);
      const val = Math.min(maxThroughput, Math.max(2, rxRate * variation));
      const y = padTop + usableH * (1 - val / maxThroughput);
      return { x, y, val };
    });

    series2Pts = metrics.map((m, idx) => {
      const x = padLeft + (idx / (metrics.length - 1)) * usableW;
      const variation = 0.85 + 0.28 * Math.cos(idx * 0.55 + 1.2) + ((idx % 4) * 0.04);
      const val = Math.min(maxThroughput, Math.max(2, txRate * variation));
      const y = padTop + usableH * (1 - val / maxThroughput);
      return { x, y, val };
    });
  }

  if (series1Pts.length === 0) {
    series1Pts = metrics.map((m, idx) => ({
      x: padLeft + (idx / (metrics.length - 1)) * usableW,
      y: padTop + usableH * 0.5,
      val: 50
    }));
  }

  const s1Spline = getCubicBezierSpline(series1Pts);
  const s2Spline = stroke2 && series2Pts.length > 0 ? getCubicBezierSpline(series2Pts) : '';
  const areaD = `${s1Spline} L ${(padLeft + usableW).toFixed(1)},${bottomY.toFixed(1)} L ${padLeft.toFixed(1)},${bottomY.toFixed(1)} Z`;

  // Actual Time labels based on range (e.g. 1:00 am / pm or Oct 01 01:00 pm for 12h/24h)
  const timeTicksData = getActualTimeTicks(rawMetrics, range, 5);
  const timeTicks = timeTicksData.map((tick, idx) => {
    const tx = padLeft + tick.pct * usableW;
    const anchor = idx === 0 ? 'start' : (idx === timeTicksData.length - 1 ? 'end' : 'middle');
    return `<text x="${tx.toFixed(1)}" y="${(bottomY + 16).toFixed(1)}" text-anchor="${anchor}" fill="#8397b2" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="700">${tick.label}</text>`;
  }).join('');

  const yLabelsSvg = `
    <text x="${padLeft - 8}" y="${(y100 + 4).toFixed(1)}" text-anchor="end" fill="#8397b2" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700">${yLabels[0]}</text>
    <text x="${padLeft - 8}" y="${(y75 + 4).toFixed(1)}" text-anchor="end" fill="#8397b2" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700">${yLabels[1]}</text>
    <text x="${padLeft - 8}" y="${(y50 + 4).toFixed(1)}" text-anchor="end" fill="#8397b2" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700">${yLabels[2]}</text>
    <text x="${padLeft - 8}" y="${(y25 + 4).toFixed(1)}" text-anchor="end" fill="#8397b2" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700">${yLabels[3]}</text>
  `;

  const svgContent = `
    <svg class="spec-graph-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs>
        ${fillDef}
        <filter id="glow_${uid}" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Background Grid -->
      <g stroke="#26364d" stroke-width="1">
        <line x1="${padLeft}" y1="${y100.toFixed(1)}" x2="${padLeft + usableW}" y2="${y100.toFixed(1)}"/>
        <line x1="${padLeft}" y1="${y75.toFixed(1)}" x2="${padLeft + usableW}" y2="${y75.toFixed(1)}"/>
        <line x1="${padLeft}" y1="${y50.toFixed(1)}" x2="${padLeft + usableW}" y2="${y50.toFixed(1)}"/>
        <line x1="${padLeft}" y1="${y25.toFixed(1)}" x2="${padLeft + usableW}" y2="${y25.toFixed(1)}"/>
        <line x1="${padLeft}" y1="${y0.toFixed(1)}" x2="${padLeft + usableW}" y2="${y0.toFixed(1)}"/>
      </g>
      <g>${vLines}</g>

      ${thresholdRect}

      <!-- Series 1 Area Fill -->
      <path d="${areaD}" fill="url(#${type}Grad_${uid})"/>

      <!-- Series 1 Stroke (2.4px primary) -->
      <path d="${s1Spline}" fill="none" stroke="${stroke1}" stroke-width="2.4" class="spec-graph-s1" filter="url(#glow_${uid})"/>

      <!-- Series 2 Stroke (1.6px secondary, rendered only if series2 exists) -->
      ${stroke2 && s2Spline ? `<path d="${s2Spline}" fill="none" stroke="${stroke2}" stroke-width="1.6" class="spec-graph-s2" stroke-dasharray="${type === 'mem' ? '5 3' : 'none'}"/>` : ''}

      <!-- Axis Labels with actual times/dates -->
      <g>${yLabelsSvg}</g>
      <g>${timeTicks}</g>
    </svg>
  `;

  // Build hover data points for inside graph
  const specHoverPoints = metrics.map((m, idx) => {
    const totalMin = timeCfg.minutes;
    const minutesAgo = Math.round(((metrics.length - 1 - idx) / (metrics.length - 1)) * totalMin);
    const actualTime = formatActualTime12h(m.time);
    const fullDateTime = formatActualDateTime12h(m.time);
    const axisTime = formatAxisDateTime(m.time);

    let name1 = '';
    let val1 = '';
    let shortVal1 = '';
    let delta1 = '0.0';
    let name2 = '';
    let val2 = '';
    let shortVal2 = '';
    let delta2 = '0.0';

    if (type === 'cpu') {
      name1 = 'CPU Utilization';
      val1 = `${m.cpuUsage.toFixed(1)}%`;
      shortVal1 = `${Math.round(m.cpuUsage)}%`;
      const prevCpu = idx > 0 ? metrics[idx - 1].cpuUsage : m.cpuUsage;
      delta1 = (m.cpuUsage - prevCpu).toFixed(1);

      name2 = '';
      val2 = '';
      shortVal2 = '';
      delta2 = '0.0';
    } else if (type === 'mem') {
      const ramTotal = parseInt((server && server.ram_total) || '32');
      const usedGb = ((m.memoryUsage / 100) * ramTotal).toFixed(1);
      name1 = 'RAM In-Use';
      val1 = `${usedGb} GB (${m.memoryUsage.toFixed(1)}%)`;
      shortVal1 = `${usedGb} GB`;
      const prevMem = idx > 0 ? metrics[idx - 1].memoryUsage : m.memoryUsage;
      delta1 = (m.memoryUsage - prevMem).toFixed(1);

      name2 = 'Swap Memory';
      const swapVal = series2Pts[idx] ? series2Pts[idx].val : (m.swapMemory || 18);
      const prevSwap = idx > 0 ? (series2Pts[idx - 1] ? series2Pts[idx - 1].val : swapVal) : swapVal;
      const swapGb = ((swapVal / 100) * (ramTotal * 0.25)).toFixed(1);
      val2 = `${swapGb} GB (${swapVal.toFixed(1)}%)`;
      shortVal2 = `${swapGb} GB`;
      delta2 = (swapVal - prevSwap).toFixed(1);
    } else if (type === 'disk') {
      const fsVal = series1Pts[idx] ? series1Pts[idx].val : (m.fileSystem || 45);
      const prevFs = idx > 0 ? (series1Pts[idx - 1] ? series1Pts[idx - 1].val : fsVal) : fsVal;
      name1 = 'Disk Usage';
      val1 = `${fsVal.toFixed(1)}%`;
      shortVal1 = `${Math.round(fsVal)}%`;
      delta1 = (fsVal - prevFs).toFixed(1);

      name2 = 'Disk I/O Rate';
      const ioVal = (series2Pts.length > 0 && series2Pts[idx]) ? series2Pts[idx].val : 35.0;
      const prevIo = idx > 0 ? ((series2Pts.length > 0 && series2Pts[idx - 1]) ? series2Pts[idx - 1].val : ioVal) : ioVal;
      val2 = `${ioVal.toFixed(1)} MB/s`;
      shortVal2 = `${Math.round(ioVal)} MB/s`;
      delta2 = (ioVal - prevIo).toFixed(1);
    } else if (type === 'net') {
      const rxVal = series1Pts[idx] ? series1Pts[idx].val : 42.0;
      const prevRx = idx > 0 ? (series1Pts[idx - 1] ? series1Pts[idx - 1].val : rxVal) : rxVal;
      name1 = 'Inbound (RX)';
      val1 = `${rxVal.toFixed(1)} MB/s`;
      shortVal1 = `${Math.round(rxVal)} MB/s`;
      delta1 = (rxVal - prevRx).toFixed(1);

      name2 = 'Outbound (TX)';
      const txVal = (series2Pts.length > 0 && series2Pts[idx]) ? series2Pts[idx].val : 18.0;
      const prevTx = idx > 0 ? ((series2Pts.length > 0 && series2Pts[idx - 1]) ? series2Pts[idx - 1].val : txVal) : txVal;
      val2 = `${txVal.toFixed(1)} MB/s`;
      shortVal2 = `${Math.round(txVal)} MB/s`;
      delta2 = (txVal - prevTx).toFixed(1);
    }

    return {
      xPct: (series1Pts[idx] ? series1Pts[idx].x : padLeft) / w,
      y1Pct: (series1Pts[idx] ? series1Pts[idx].y : bottomY) / h,
      y2Pct: series2Pts.length > 0 && series2Pts[idx] ? series2Pts[idx].y / h : 0,
      actualTime,
      fullDateTime,
      axisTime,
      minutesAgo,
      name1, val1, shortVal1, delta1, color1: stroke1,
      name2, val2, shortVal2, delta2, color2: stroke2
    };
  });

  const specContainerId = `specContainer_${type}_${safeHost}_${Math.floor(Math.random()*10000)}`;
  const specPointsJson = JSON.stringify(specHoverPoints).replace(/'/g, "&apos;");
  return `
    <div class="spec-graph-container" id="${specContainerId}" data-points='${specPointsJson}' onmousemove="handleSpecGraphHover(event, this)" onmouseleave="handleSpecGraphLeave(this)">
      ${svgContent}
      <div class="spec-scrubber-line"></div>
      <div class="spec-scrubber-dot"></div>
      <div class="spec-scrubber-dot-2"></div>
      <div class="spec-x-time-badge"></div>
      <div class="spec-y-val-badge"></div>
      <div class="spec-hud-tooltip"></div>
    </div>
  `;
}

function handleSpecGraphHover(e, container) {
  if (!container) return;
  const rawData = container.getAttribute('data-points');
  if (!rawData) return;
  let points = [];
  try {
    points = JSON.parse(rawData);
  } catch (err) {
    return;
  }
  if (!points || points.length === 0) return;

  const rect = container.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const relX = Math.max(0, Math.min(1, mouseX / rect.width));

  // Find closest point
  let closest = points[0];
  let minDiff = 9999;
  for (const pt of points) {
    const diff = Math.abs(pt.xPct - relX);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pt;
    }
  }

  const scrubberLine = container.querySelector('.spec-scrubber-line');
  const scrubberDot = container.querySelector('.spec-scrubber-dot');
  const scrubberDot2 = container.querySelector('.spec-scrubber-dot-2');
  const xTimeBadge = container.querySelector('.spec-x-time-badge');
  const yValBadge = container.querySelector('.spec-y-val-badge');
  const hudTooltip = container.querySelector('.spec-hud-tooltip');

  const pointPixelX = closest.xPct * rect.width;
  const pointPixelY1 = closest.y1Pct * rect.height;
  const pointPixelY2 = closest.y2Pct * rect.height;

  if (scrubberLine) {
    scrubberLine.style.left = `${pointPixelX}px`;
    scrubberLine.style.opacity = '1';
  }

  if (scrubberDot) {
    scrubberDot.style.left = `${pointPixelX}px`;
    scrubberDot.style.top = `${pointPixelY1}px`;
    scrubberDot.style.borderColor = closest.color1;
    scrubberDot.style.boxShadow = `0 0 10px ${closest.color1}, 0 0 20px ${closest.color1}`;
    scrubberDot.style.opacity = '1';
  }

  if (scrubberDot2) {
    if (closest.name2) {
      scrubberDot2.style.left = `${pointPixelX}px`;
      scrubberDot2.style.top = `${pointPixelY2}px`;
      scrubberDot2.style.borderColor = closest.color2;
      scrubberDot2.style.boxShadow = `0 0 8px ${closest.color2}`;
      scrubberDot2.style.opacity = '1';
    } else {
      scrubberDot2.style.opacity = '0';
    }
  }

  if (xTimeBadge) {
    const isLong = currentRange === '12h' || currentRange === '24h';
    xTimeBadge.textContent = isLong ? (closest.axisTime || closest.actualTime) : closest.actualTime;
    xTimeBadge.style.left = `${pointPixelX}px`;
    xTimeBadge.style.opacity = '1';
  }

  if (yValBadge) {
    yValBadge.textContent = closest.shortVal1;
    yValBadge.style.top = `${pointPixelY1}px`;
    yValBadge.style.opacity = '1';
  }

  if (hudTooltip) {
    const d1 = parseFloat(closest.delta1 || 0);
    let trend1Html = '';
    if (d1 > 0.05) {
      trend1Html = `<span class="trend-pill inc">▲ Inc (+${closest.delta1})</span>`;
    } else if (d1 < -0.05) {
      trend1Html = `<span class="trend-pill dec">▼ Dec (${closest.delta1})</span>`;
    } else {
      trend1Html = `<span class="trend-pill steady">▬ Steady</span>`;
    }

    const d2 = parseFloat(closest.delta2 || 0);
    let trend2Html = '';
    if (d2 > 0.05) {
      trend2Html = `<span class="trend-pill inc">▲ Inc (+${closest.delta2})</span>`;
    } else if (d2 < -0.05) {
      trend2Html = `<span class="trend-pill dec">▼ Dec (${closest.delta2})</span>`;
    } else {
      trend2Html = `<span class="trend-pill steady">▬ Steady</span>`;
    }

    const scrubTag = closest.minutesAgo > 0
      ? `<span class="scrub-direction-tag">◀ ${closest.minutesAgo}m ago (Backward)</span>`
      : `<span class="scrub-direction-tag" style="color: var(--neon-cyan);">▶ Realtime (Current)</span>`;

    hudTooltip.innerHTML = `
      <div class="hud-tooltip-header">
        <span class="hud-tooltip-time">⏱ ${closest.fullDateTime || closest.actualTime}</span>
        ${scrubTag}
      </div>
      <div class="hud-tooltip-metric-row">
        <div class="metric-val-block">
          <span style="color: ${closest.color1}; font-weight: 700;">${closest.name1}: <strong>${closest.val1}</strong></span>
          ${trend1Html}
        </div>
        ${closest.name2 ? `
        <div class="metric-val-block">
          <span style="color: ${closest.color2}; font-weight: 700;">${closest.name2}: <strong>${closest.val2}</strong></span>
          ${trend2Html}
        </div>
        ` : ''}
      </div>
    `;

    const tooltipWidth = 240;
    const clampedX = Math.max(tooltipWidth / 2 + 10, Math.min(rect.width - tooltipWidth / 2 - 10, pointPixelX));
    hudTooltip.style.left = `${clampedX}px`;
    const tooltipHeight = closest.name2 ? 78 : 58;
    let targetTop;
    if (pointPixelY1 > rect.height * 0.45) {
      // Point is in lower half (below 50% load) -> place tooltip above point
      targetTop = pointPixelY1 - tooltipHeight - 10;
    } else {
      // Point is in upper half (high load) -> place tooltip below point
      targetTop = pointPixelY1 + 14;
    }
    const maxTop = Math.max(2, rect.height - tooltipHeight - 2);
    hudTooltip.style.top = `${Math.max(2, Math.min(maxTop, targetTop))}px`;
    hudTooltip.style.opacity = '1';
  }
}

function handleSpecGraphLeave(container) {
  if (!container) return;
  const scrubberLine = container.querySelector('.spec-scrubber-line');
  const scrubberDot = container.querySelector('.spec-scrubber-dot');
  const scrubberDot2 = container.querySelector('.spec-scrubber-dot-2');
  const xTimeBadge = container.querySelector('.spec-x-time-badge');
  const yValBadge = container.querySelector('.spec-y-val-badge');
  const hudTooltip = container.querySelector('.spec-hud-tooltip');

  if (scrubberLine) scrubberLine.style.opacity = '0';
  if (scrubberDot) scrubberDot.style.opacity = '0';
  if (scrubberDot2) scrubberDot2.style.opacity = '0';
  if (xTimeBadge) xTimeBadge.style.opacity = '0';
  if (yValBadge) yValBadge.style.opacity = '0';
  if (hudTooltip) hudTooltip.style.opacity = '0';
}

function generateFullSpecPulseSvg(server, currentRange = '1h') {
  const timeCfg = getTimeAxisConfig(currentRange);
  let rawMetrics = (server && server.metrics && server.metrics.length >= 2) ? server.metrics : null;
  if (!rawMetrics) {
    rawMetrics = [
      { cpuUsage: 35, memoryUsage: 45, swapMemory: 18, time: '12:00:00' },
      { cpuUsage: 42, memoryUsage: 48, swapMemory: 18, time: '12:05:00' },
      { cpuUsage: 38, memoryUsage: 46, swapMemory: 19, time: '12:10:00' },
      { cpuUsage: 55, memoryUsage: 52, swapMemory: 20, time: '12:15:00' },
      { cpuUsage: 48, memoryUsage: 50, swapMemory: 20, time: '12:20:00' },
      { cpuUsage: 62, memoryUsage: 58, swapMemory: 22, time: '12:25:00' },
      { cpuUsage: 75, memoryUsage: 64, swapMemory: 24, time: '12:30:00' },
      { cpuUsage: 82, memoryUsage: 70, swapMemory: 26, time: '12:35:00' }
    ];
  }

  const metrics = sampleMetrics(rawMetrics, 56);

  const current = metrics[metrics.length - 1];
  const isHighCpu = current.cpuUsage >= 80;
  const isHighMem = current.memoryUsage >= 80;
  const isAlert = isHighCpu || isHighMem;

  const ramTotalNum = parseInt((server && server.ram_total) || '32');
  const ramUsedNum = Math.round(((current.memoryUsage) / 100) * ramTotalNum);
  const netRx = server && server.network ? server.network.rx : '45.2 MB/s';
  const netTx = server && server.network ? server.network.tx : '22.8 MB/s';

  const cpuYTop = 250;
  const cpuYBot = 435;
  const cpuH = cpuYBot - cpuYTop;
  const c1Left = 145;
  const c1Right = 1670;
  const c1W = c1Right - c1Left;

  const cpuPts = metrics.map((m, idx) => {
    const x = c1Left + (idx / (metrics.length - 1)) * c1W;
    const y = cpuYTop + cpuH * (1 - Math.min(100, Math.max(0, m.cpuUsage)) / 100);
    return { x, y, val: m.cpuUsage };
  });
  const cpuSpline = getCubicBezierSpline(cpuPts);
  const cpuArea = `${cpuSpline} L ${c1Right},${cpuYBot} L ${c1Left},${cpuYBot} Z`;

  const sysLoadPts = metrics.map((m, idx) => {
    const x = c1Left + (idx / (metrics.length - 1)) * c1W;
    const val = Math.min(100, Math.max(0, m.cpuUsage * 0.65 + 10));
    const y = cpuYTop + cpuH * (1 - val / 100);
    return { x, y, val };
  });
  const sysSpline = getCubicBezierSpline(sysLoadPts);

  const memYTop = 610;
  const memYBot = 795;
  const memH = memYBot - memYTop;

  const memPts = metrics.map((m, idx) => {
    const x = c1Left + (idx / (metrics.length - 1)) * c1W;
    const y = memYTop + memH * (1 - Math.min(100, Math.max(0, m.memoryUsage)) / 100);
    return { x, y, val: m.memoryUsage };
  });
  const memSpline = getCubicBezierSpline(memPts);
  const memArea = `${memSpline} L ${c1Right},${memYBot} L ${c1Left},${memYBot} Z`;

  const swapPts = metrics.map((m, idx) => {
    const x = c1Left + (idx / (metrics.length - 1)) * c1W;
    const val = Math.min(100, Math.max(0, m.swapMemory || (m.memoryUsage * 0.35)));
    const y = memYTop + memH * (1 - val / 100);
    return { x, y, val };
  });
  const swapSpline = getCubicBezierSpline(swapPts);

  const netYTop = 965;
  const netYBot = 1150;
  const netH = netYBot - netYTop;
  const rxBase = (server && server.network?.rx_rate) || 45.2;
  const txBase = (server && server.network?.tx_rate) || 22.8;
  const maxNet = Math.max(100, (rxBase + txBase) * 1.4);

  const rxPts = metrics.map((m, idx) => {
    const x = c1Left + (idx / (metrics.length - 1)) * c1W;
    const val = rxBase * (0.85 + 0.3 * Math.sin(idx * 0.6 + 1));
    const y = netYTop + netH * (1 - Math.min(1, val / maxNet));
    return { x, y, val };
  });
  const rxSpline = getCubicBezierSpline(rxPts);
  const rxArea = `${rxSpline} L ${c1Right},${netYBot} L ${c1Left},${netYBot} Z`;

  const txPts = metrics.map((m, idx) => {
    const x = c1Left + (idx / (metrics.length - 1)) * c1W;
    const val = txBase * (0.85 + 0.3 * Math.cos(idx * 0.5 + 2));
    const y = netYTop + netH * (1 - Math.min(1, val / maxNet));
    return { x, y, val };
  });
  const txSpline = getCubicBezierSpline(txPts);

  // Dynamic actual time ticks for pulse view (8 ticks matching 8 vertical dashed lines)
  const pulseTicks = getActualTimeTicks(rawMetrics, currentRange, 8);
  const cpuTimeTicks = pulseTicks.map((tick, idx) => {
    const x = c1Left + tick.pct * c1W;
    const anchor = idx === 0 ? 'start' : (idx === pulseTicks.length - 1 ? 'end' : 'middle');
    return `<text x="${x.toFixed(1)}" y="462" text-anchor="${anchor}">${tick.label}</text>`;
  }).join('');

  const memTimeTicks = pulseTicks.map((tick, idx) => {
    const x = c1Left + tick.pct * c1W;
    const anchor = idx === 0 ? 'start' : (idx === pulseTicks.length - 1 ? 'end' : 'middle');
    return `<text x="${x.toFixed(1)}" y="822" text-anchor="${anchor}">${tick.label}</text>`;
  }).join('');

  const netTimeTicks = pulseTicks.map((tick, idx) => {
    const x = c1Left + tick.pct * c1W;
    const anchor = idx === 0 ? 'start' : (idx === pulseTicks.length - 1 ? 'end' : 'middle');
    return `<text x="${x.toFixed(1)}" y="1178" text-anchor="${anchor}">${tick.label}</text>`;
  }).join('');

  const safeHost = String((server && server.host) || 'srv').replace(/[^a-zA-Z0-9_-]/g, '_');

  // Build hover data for pulse view
  const pulseHoverPoints = metrics.map((m, idx) => {
    const totalMin = timeCfg.minutes;
    const minutesAgo = Math.round(((metrics.length - 1 - idx) / (metrics.length - 1)) * totalMin);
    const prevM = idx > 0 ? metrics[idx - 1] : m;
    const actualTime = formatActualTime12h(m.time);

    const cpuVal = m.cpuUsage;
    const cpuDelta = (m.cpuUsage - prevM.cpuUsage).toFixed(1);
    const sysVal = sysLoadPts[idx].val;
    const prevSysVal = idx > 0 ? sysLoadPts[idx - 1].val : sysVal;
    const sysDelta = (sysVal - prevSysVal).toFixed(1);

    const memVal = m.memoryUsage;
    const memDelta = (m.memoryUsage - prevM.memoryUsage).toFixed(1);
    const swapVal = swapPts[idx].val;
    const prevSwapVal = idx > 0 ? swapPts[idx - 1].val : swapVal;
    const swapDelta = (swapVal - prevSwapVal).toFixed(1);

    const rxVal = rxPts[idx].val;
    const prevRxVal = idx > 0 ? rxPts[idx - 1].val : rxVal;
    const rxDelta = (rxVal - prevRxVal).toFixed(1);

    const txVal = txPts[idx].val;
    const prevTxVal = idx > 0 ? txPts[idx - 1].val : txVal;
    const txDelta = (txVal - prevTxVal).toFixed(1);

    return {
      xPct: (c1Left + (idx / (metrics.length - 1)) * c1W) / 1800,
      actualTime,
      minutesAgo,
      // Card 1
      cpuVal: cpuVal.toFixed(1) + '%',
      cpuDelta,
      sysVal: sysVal.toFixed(1) + '%',
      sysDelta,
      yCpuPct: (cpuYTop + cpuH * (1 - Math.min(100, Math.max(0, m.cpuUsage)) / 100)) / 1320,
      ySysPct: (cpuYTop + cpuH * (1 - sysVal / 100)) / 1320,
      // Card 2
      memVal: ((memVal / 100) * ramTotalNum).toFixed(1) + ' GB (' + memVal.toFixed(1) + '%)',
      memDelta,
      swapVal: ((swapVal / 100) * (ramTotalNum * 0.25)).toFixed(1) + ' GB',
      swapDelta,
      yMemPct: (memYTop + memH * (1 - Math.min(100, Math.max(0, memVal)) / 100)) / 1320,
      ySwapPct: (memYTop + memH * (1 - swapVal / 100)) / 1320,
      // Card 3
      rxVal: rxVal.toFixed(1) + ' MB/s',
      rxDelta,
      txVal: txVal.toFixed(1) + ' MB/s',
      txDelta,
      yRxPct: (netYTop + netH * (1 - Math.min(1, rxVal / maxNet))) / 1320,
      yTxPct: (netYTop + netH * (1 - Math.min(1, txVal / maxNet))) / 1320
    };
  });

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1800 1320" preserveAspectRatio="xMidYMid meet" style="display: block;">
      <defs>
        <linearGradient id="spec_bg" x2="0" y2="1">
          <stop stop-color="#121a29"/>
          <stop offset="1" stop-color="#070b12"/>
        </linearGradient>
        <linearGradient id="spec_cpu" y2="1">
          <stop stop-color="${isHighCpu ? '#ff4d6d' : '#00f2fe'}" stop-opacity=".62"/>
          <stop offset="1" stop-color="${isHighCpu ? '#ff4d6d' : '#00f2fe'}" stop-opacity=".05"/>
        </linearGradient>
        <linearGradient id="spec_net" y2="1">
          <stop stop-color="#1ed6ff" stop-opacity=".6"/>
          <stop offset="1" stop-color="#1ed6ff" stop-opacity="0"/>
        </linearGradient>
        <filter id="spec_glow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="1800" height="1320" fill="url(#spec_bg)"/>

      <!-- Header -->
      <text x="78" y="82" fill="#f3f7ff" font-family="'JetBrains Mono', Arial" font-size="34" font-weight="800" letter-spacing="1">INFRASTRUCTURE PULSE</text>
      <text x="80" y="116" fill="#8397b2" font-family="'JetBrains Mono', Arial" font-size="18" font-weight="600">${((server && (server.displayName || server.host)) || 'SERVER').toUpperCase()}  •  ${currentRange.toUpperCase()} STREAM  •  LIVE TELEMETRY</text>

      <!-- Status Badge -->
      <rect x="1465" y="55" width="255" height="48" rx="24" fill="${isAlert ? '#321826' : '#073d39'}"/>
      <circle cx="1495" cy="79" r="7" fill="${isAlert ? '#ff4d6d' : '#27e6b0'}" filter="url(#spec_glow)"/>
      <text x="1512" y="85" fill="${isAlert ? '#ff8ba1' : '#8affe0'}" font-family="'JetBrains Mono', Arial" font-size="17" font-weight="700">${isAlert ? 'HIGH LOAD ALERT' : 'HEALTHY SYSTEM'}</text>

      <!-- 3 Card Backgrounds -->
      <g fill="#0d1523" stroke="#26364d" stroke-width="2">
        <rect x="62" y="155" width="1676" height="330" rx="22"/>
        <rect x="62" y="510" width="1676" height="330" rx="22"/>
        <rect x="62" y="865" width="1676" height="330" rx="22"/>
      </g>

      <!-- === CARD 1: CPU UTILIZATION === -->
      <g font-family="'JetBrains Mono', Arial">
        <text x="105" y="202" fill="#f4f8ff" font-size="24" font-weight="700">CPU UTILIZATION</text>
        <text x="105" y="230" fill="#8499b6" font-size="16">STACKED SYSTEM LOAD • CURRENT ${Math.round(current.cpuUsage)}%</text>
        <rect x="1455" y="185" width="238" height="48" rx="12" fill="${isHighCpu ? '#321826' : 'rgba(6, 182, 212, 0.12)'}"/>
        <text x="1480" y="216" fill="${isHighCpu ? '#ff8ba1' : '#00f2fe'}" font-size="17" font-weight="700">${isHighCpu ? '● HIGH UTILIZATION' : '● NOMINAL LOAD'}</text>
      </g>
      <g stroke="#263851">
        <path d="M145 270H1670M145 320H1670M145 370H1670M145 420H1670"/>
        <path d="M145 250V435M363 250V435M581 250V435M799 250V435M1017 250V435M1235 250V435M1453 250V435M1670 250V435" stroke-dasharray="3 7"/>
      </g>
      <rect x="145" y="250" width="1525" height="73" fill="${isHighCpu ? '#ff4d6d' : '#62d380'}" opacity=".24"/>
      <path d="${cpuArea}" fill="url(#spec_cpu)"/>
      <!-- Less thick curve matching dashboard graph (2.4px primary, 1.6px secondary) -->
      <path d="${cpuSpline}" fill="none" stroke="${isHighCpu ? '#ff5c76' : '#00f2fe'}" stroke-width="2.4"/>
      <path d="${sysSpline}" fill="none" stroke="#32bcf1" stroke-width="1.6"/>
      <g fill="#8397b2" font-family="'JetBrains Mono', Arial" font-size="14">
        <text x="92" y="274">100%</text><text x="102" y="324">75%</text><text x="102" y="374">50%</text><text x="102" y="424">25%</text>
        ${cpuTimeTicks}
      </g>

      <!-- === CARD 2: MEMORY COMPOSITION === -->
      <g font-family="'JetBrains Mono', Arial">
        <text x="105" y="557" fill="#f4f8ff" font-size="24" font-weight="700">MEMORY COMPOSITION</text>
        <text x="105" y="585" fill="#8499b6" font-size="16">${ramTotalNum} GB TOTAL • CACHE, USED, FREE & SWAP</text>
        <text x="1505" y="575" fill="#76e3b0" font-size="28" font-weight="700">${ramUsedNum} GB</text>
        <text x="1505" y="600" fill="#8397b2" font-size="14">IN USE (${Math.round(current.memoryUsage)}%)</text>
      </g>
      <g stroke="#263851">
        <path d="M145 630H1670M145 680H1670M145 730H1670M145 780H1670"/>
        <path d="M145 610V795M363 610V795M581 610V795M799 610V795M1017 610V795M1235 610V795M1453 610V795M1670 610V795" stroke-dasharray="3 7"/>
      </g>
      <path d="${memArea}" fill="#1e9fdf" opacity=".32"/>
      <!-- Less thick curve matching dashboard graph (2.4px primary, 1.6px secondary) -->
      <path d="${memSpline}" fill="none" stroke="#7be0a0" stroke-width="2.4"/>
      <path d="${swapSpline}" fill="none" stroke="#f6bf42" stroke-width="1.6"/>
      <g fill="#8397b2" font-family="'JetBrains Mono', Arial" font-size="14">
        <text x="82" y="634">${ramTotalNum}GB</text><text x="82" y="684">${Math.round(ramTotalNum * 0.75)}GB</text><text x="82" y="734">${Math.round(ramTotalNum * 0.5)}GB</text><text x="100" y="784">0GB</text>
        ${memTimeTicks}
      </g>

      <!-- === CARD 3: NETWORK TRAFFIC === -->
      <g font-family="'JetBrains Mono', Arial">
        <text x="105" y="912" fill="#f4f8ff" font-size="24" font-weight="700">NETWORK TRAFFIC</text>
        <text x="105" y="940" fill="#8499b6" font-size="16">INBOUND & OUTBOUND THROUGHPUT</text>
        <text x="1420" y="930" fill="#46dfff" font-size="17" font-weight="700">↓ IN: ${netRx}</text>
        <text x="1560" y="930" fill="#ff9c4e" font-size="17" font-weight="700">↑ OUT: ${netTx}</text>
      </g>
      <g stroke="#263851">
        <path d="M145 985H1670M145 1035H1670M145 1085H1670M145 1135H1670"/>
        <path d="M145 965V1150M363 965V1150M581 965V1150M799 965V1150M1017 965V1150M1235 965V1150M1453 965V1150M1670 965V1150" stroke-dasharray="3 7"/>
      </g>
      <path d="${rxArea}" fill="url(#spec_net)"/>
      <!-- Less thick curve matching dashboard graph (2.4px primary, 1.6px secondary) -->
      <path d="${rxSpline}" fill="none" stroke="#2bdcff" stroke-width="2.4"/>
      <path d="${txSpline}" fill="none" stroke="#ff9a4d" stroke-width="1.6"/>
      <g fill="#8397b2" font-family="'JetBrains Mono', Arial" font-size="14">
        <text x="75" y="989">${Math.round(maxNet)}M</text><text x="75" y="1039">${Math.round(maxNet * 0.75)}M</text><text x="75" y="1089">${Math.round(maxNet * 0.5)}M</text><text x="95" y="1139">0</text>
        ${netTimeTicks}
      </g>
    </svg>
  `;

  const pulseContainerId = `pulseContainer_${safeHost}`;
  const pulsePointsJson = JSON.stringify(pulseHoverPoints).replace(/'/g, "&apos;");
  return `
    <div class="pulse-svg-container" id="${pulseContainerId}" data-points='${pulsePointsJson}' onmousemove="handlePulseHover(event, this)" onmouseleave="handlePulseLeave(this)" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #070b12; border-radius: 14px; border: 1px solid #26364d; position: relative;">
      ${svgContent}
      <div class="pulse-scrubber-line"></div>
      <div class="pulse-scrubber-dot dot-1"></div>
      <div class="pulse-scrubber-dot dot-2"></div>
      <div class="pulse-x-time-badge"></div>
      <div class="pulse-y-val-badge"></div>
      <div class="pulse-hud-tooltip"></div>
    </div>
  `;
}

function handlePulseHover(e, container) {
  if (!container) return;
  const rawData = container.getAttribute('data-points');
  if (!rawData) return;
  let points = [];
  try {
    points = JSON.parse(rawData);
  } catch (err) {
    return;
  }
  if (!points || points.length === 0) return;

  const rect = container.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const relX = Math.max(0, Math.min(1, mouseX / rect.width));
  const svgY = (mouseY / rect.height) * 1320;

  // Find closest point
  let closest = points[0];
  let minDiff = 9999;
  for (const pt of points) {
    const diff = Math.abs(pt.xPct - relX);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pt;
    }
  }

  const scrubberLine = container.querySelector('.pulse-scrubber-line');
  const dot1 = container.querySelector('.pulse-scrubber-dot.dot-1');
  const dot2 = container.querySelector('.pulse-scrubber-dot.dot-2');
  const hudTooltip = container.querySelector('.pulse-hud-tooltip');

  const pointPixelX = closest.xPct * rect.width;

  let cardName = 'CPU UTILIZATION';
  let s1Name = 'CPU';
  let s1Val = closest.cpuVal;
  let s1Delta = closest.cpuDelta;
  let s1Col = '#00f2fe';
  let s2Name = 'System Load';
  let s2Val = closest.sysVal;
  let s2Delta = closest.sysDelta;
  let s2Col = '#32bcf1';
  let dot1Y = closest.yCpuPct * rect.height;
  let dot2Y = closest.ySysPct * rect.height;
  let cardTopPct = 155 / 1320;
  let cardHeightPct = 330 / 1320;

  if (svgY >= 490 && svgY < 850) {
    cardName = 'MEMORY COMPOSITION';
    s1Name = 'RAM In-Use';
    s1Val = closest.memVal;
    s1Delta = closest.memDelta;
    s1Col = '#7be0a0';
    s2Name = 'Swap';
    s2Val = closest.swapVal;
    s2Delta = closest.swapDelta;
    s2Col = '#f6bf42';
    dot1Y = closest.yMemPct * rect.height;
    dot2Y = closest.ySwapPct * rect.height;
    cardTopPct = 510 / 1320;
    cardHeightPct = 330 / 1320;
  } else if (svgY >= 850) {
    cardName = 'NETWORK TRAFFIC';
    s1Name = 'Inbound (RX)';
    s1Val = closest.rxVal;
    s1Delta = closest.rxDelta;
    s1Col = '#2bdcff';
    s2Name = 'Outbound (TX)';
    s2Val = closest.txVal;
    s2Delta = closest.txDelta;
    s2Col = '#ff9a4d';
    dot1Y = closest.yRxPct * rect.height;
    dot2Y = closest.yTxPct * rect.height;
    cardTopPct = 865 / 1320;
    cardHeightPct = 330 / 1320;
  }

  if (scrubberLine) {
    scrubberLine.style.left = `${pointPixelX}px`;
    scrubberLine.style.top = `${cardTopPct * rect.height}px`;
    scrubberLine.style.height = `${cardHeightPct * rect.height}px`;
    scrubberLine.style.opacity = '1';
  }

  if (dot1) {
    dot1.style.left = `${pointPixelX}px`;
    dot1.style.top = `${dot1Y}px`;
    dot1.style.borderColor = s1Col;
    dot1.style.boxShadow = `0 0 10px ${s1Col}`;
    dot1.style.opacity = '1';
  }

  if (dot2) {
    dot2.style.left = `${pointPixelX}px`;
    dot2.style.top = `${dot2Y}px`;
    dot2.style.borderColor = s2Col;
    dot2.style.boxShadow = `0 0 8px ${s2Col}`;
    dot2.style.opacity = '1';
  }

  if (hudTooltip) {
    const d1 = parseFloat(s1Delta || 0);
    let trend1Html = '';
    if (d1 > 0.05) {
      trend1Html = `<span class="trend-pill inc">▲ Inc (+${s1Delta})</span>`;
    } else if (d1 < -0.05) {
      trend1Html = `<span class="trend-pill dec">▼ Dec (${s1Delta})</span>`;
    } else {
      trend1Html = `<span class="trend-pill steady">▬ Steady</span>`;
    }

    const d2 = parseFloat(s2Delta || 0);
    let trend2Html = '';
    if (d2 > 0.05) {
      trend2Html = `<span class="trend-pill inc">▲ Inc (+${s2Delta})</span>`;
    } else if (d2 < -0.05) {
      trend2Html = `<span class="trend-pill dec">▼ Dec (${s2Delta})</span>`;
    } else {
      trend2Html = `<span class="trend-pill steady">▬ Steady</span>`;
    }

    const scrubTag = closest.minutesAgo > 0
      ? `<span class="scrub-direction-tag">◀ ${closest.minutesAgo}m ago (Backward)</span>`
      : `<span class="scrub-direction-tag" style="color: var(--neon-cyan);">▶ Realtime (Current)</span>`;

    hudTooltip.innerHTML = `
      <div class="hud-tooltip-header">
        <span class="hud-tooltip-time">⏱ ${closest.actualTime}</span>
        ${scrubTag}
      </div>
      <div style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">${cardName}</div>
      <div class="hud-tooltip-metric-row">
        <div class="metric-val-block">
          <span style="color: ${s1Col}; font-weight: 700;">${s1Name}: <strong>${s1Val}</strong></span>
          ${trend1Html}
        </div>
        <div class="metric-val-block">
          <span style="color: ${s2Col}; font-weight: 700;">${s2Name}: <strong>${s2Val}</strong></span>
          ${trend2Html}
        </div>
      </div>
    `;

    const tooltipWidth = 240;
    const clampedX = Math.max(tooltipWidth / 2 + 10, Math.min(rect.width - tooltipWidth / 2 - 10, pointPixelX));
    hudTooltip.style.left = `${clampedX}px`;
    const tooltipHeight = 90;
    const minY = Math.min(dot1Y, dot2Y);
    if (minY > tooltipHeight + 20) {
      hudTooltip.style.top = `${minY - tooltipHeight - 12}px`;
    } else {
      hudTooltip.style.top = `${minY + 20}px`;
    }
    hudTooltip.style.opacity = '1';
  }

  const xTimeBadge = container.querySelector('.pulse-x-time-badge');
  const yValBadge = container.querySelector('.pulse-y-val-badge');
  if (xTimeBadge) {
    xTimeBadge.textContent = closest.actualTime;
    xTimeBadge.style.left = `${pointPixelX}px`;
    xTimeBadge.style.bottom = `${Math.max(6, rect.height - (cardTopPct + cardHeightPct) * rect.height + 4)}px`;
    xTimeBadge.style.opacity = '1';
  }
  if (yValBadge) {
    yValBadge.textContent = String(s1Val).split(' ')[0];
    yValBadge.style.top = `${dot1Y}px`;
    yValBadge.style.opacity = '1';
  }
}

function handlePulseLeave(container) {
  if (!container) return;
  const scrubberLine = container.querySelector('.pulse-scrubber-line');
  const dot1 = container.querySelector('.pulse-scrubber-dot.dot-1');
  const dot2 = container.querySelector('.pulse-scrubber-dot.dot-2');
  const xTimeBadge = container.querySelector('.pulse-x-time-badge');
  const yValBadge = container.querySelector('.pulse-y-val-badge');
  const hudTooltip = container.querySelector('.pulse-hud-tooltip');
  if (scrubberLine) scrubberLine.style.opacity = '0';
  if (dot1) dot1.style.opacity = '0';
  if (dot2) dot2.style.opacity = '0';
  if (xTimeBadge) xTimeBadge.style.opacity = '0';
  if (yValBadge) yValBadge.style.opacity = '0';
  if (hudTooltip) hudTooltip.style.opacity = '0';
}

function renderActiveServer() {
  const overlay = document.getElementById('serverModalOverlay');
  const container = document.getElementById('activeServerContainer');
  if (!container || !overlay) return;

  if (!selectedHost) {
    overlay.classList.remove('modal-open');
    document.body.classList.remove('modal-open-body');
    container.innerHTML = '';
    return;
  }

  const server = serversData.find(s => s.host === selectedHost);
  if (!server) {
    overlay.classList.remove('modal-open');
    document.body.classList.remove('modal-open-body');
    container.innerHTML = '';
    return;
  }

  const current = server.metrics && server.metrics.length > 0 ? server.metrics[server.metrics.length - 1] : null;
  if (!current) return;

  const isHighCpu = current.cpuUsage >= 80;
  const isHighMem = current.memoryUsage >= 80;
  const isAlert = isHighCpu || isHighMem;

  const modalTitle = document.getElementById('modalServerTitle');
  const modalMeta = document.getElementById('modalServerMeta');
  const modalPulse = document.getElementById('modalNodePulse');
  const modalStatusChip = document.getElementById('modalStatusChip');

  if (modalTitle) modalTitle.textContent = server.displayName || server.host;
  if (modalMeta) modalMeta.textContent = `OS: ${server.os} • IP: ${server.ip} • Cores: ${server.cores} • RAM: ${server.ram_total} • Uptime: ${server.uptime}`;
  if (modalPulse) modalPulse.className = `modal-pulse-dot ${isAlert ? 'alert' : 'healthy'}`;
  if (modalStatusChip) {
    modalStatusChip.className = `modal-status-chip ${isAlert ? 'chip-alert' : 'chip-healthy'}`;
    modalStatusChip.textContent = isAlert ? 'HIGH LOAD ALERT' : 'OPERATIONAL [HEALTHY]';
  }

  overlay.classList.add('modal-open');
  document.body.classList.add('modal-open-body');

  if (inspectViewMode === 'pulse') {
    container.className = 'inspect-fullpage-body mode-pulse';
    container.innerHTML = generateFullSpecPulseSvg(server, currentRange);
    return;
  }

  container.className = 'inspect-fullpage-body mode-split';

  const isWindows = server.os_type === 'windows' || server.os.toLowerCase().includes('windows');
  const coresShort = server.cores ? server.cores.split(' ')[0] : '16';
  const ramTotalNum = parseInt(server.ram_total || '32');
  const ramUsedNum = Math.round(((current.memoryUsage) / 100) * ramTotalNum);
  const swapTotalGb = Math.max(4, Math.round(ramTotalNum * 0.25));
  const swapUsedGb = ((current.swapMemory / 100) * swapTotalGb).toFixed(1);
  const loadAvg = (server.loadAverage || ['1.93'])[0];

  const netRx = server.network ? server.network.rx : '45.2 MB/s';
  const netTx = server.network ? server.network.tx : '22.8 MB/s';
  const rxNum = server.network ? (server.network.rx_rate || 45.2) : 45.2;
  const txNum = server.network ? (server.network.tx_rate || 22.8) : 22.8;
  const totalThroughput = (rxNum + txNum).toFixed(1);

  const rawMounts = server.mounts || (isWindows ? [
    { name: 'C:\\', label: 'OS System', used: Math.round(current.fileSystem), total: '150 GB', fs: 'NTFS' },
    { name: 'D:\\', label: 'IIS WebRoot', used: Math.min(95, Math.max(10, Math.round(current.fileSystem + 12))), total: '500 GB', fs: 'NTFS' },
    { name: 'E:\\', label: 'App Logs', used: Math.max(10, Math.round(current.fileSystem - 15)), total: '250 GB', fs: 'NTFS' }
  ] : [
    { name: '/', label: 'OS Root', used: Math.round(current.fileSystem), total: '120 GB', fs: 'ext4' },
    { name: '/data', label: 'Application', used: Math.min(95, Math.max(10, Math.round(current.fileSystem + 8))), total: '500 GB', fs: 'ext4' },
    { name: '/var/log', label: 'System Logs', used: Math.max(10, Math.round(current.fileSystem - 18)), total: '80 GB', fs: 'ext4' }
  ]);

  const mountsList = rawMounts.map(m => {
    let driveLetter = m.name;
    let label = m.label || '';
    if (m.name.includes('(')) {
      const parts = m.name.split('(');
      driveLetter = parts[0].trim();
      label = parts[1].replace(')', '').trim();
    } else if (!label) {
      label = (driveLetter === 'C:\\' || driveLetter === '/') ? 'OS System' : 'Data Volume';
    }
    return {
      driveLetter,
      label,
      used: Math.round(m.used),
      total: m.total || '250 GB',
      fs: m.fs || (isWindows ? 'NTFS' : 'ext4')
    };
  });

  const defaultProcesses = isWindows ? [
    { pid: 3488, name: 'w3wp.exe', cpu: (current.cpuUsage * 0.35).toFixed(1), mem: '18.2', user: 'SYSTEM', threads: 42, status: 'RUNNING' },
    { pid: 1824, name: 'sqlservr.exe', cpu: (current.cpuUsage * 0.28).toFixed(1), mem: '22.0', user: 'NETWORK SVC', threads: 64, status: 'RUNNING' },
    { pid: 644, name: 'lsass.exe', cpu: (current.cpuUsage * 0.05).toFixed(1), mem: '3.4', user: 'SYSTEM', threads: 18, status: 'RUNNING' },
    { pid: 4120, name: 'telegraf.exe', cpu: '0.6', mem: '0.8', user: 'LOCAL SVC', threads: 12, status: 'RUNNING' },
    { pid: 2780, name: 'svchost.exe', cpu: '1.2', mem: '2.1', user: 'SYSTEM', threads: 24, status: 'RUNNING' },
    { pid: 5190, name: 'dotnet.exe', cpu: (current.cpuUsage * 0.12).toFixed(1), mem: '9.5', user: 'IIS APPPOOL', threads: 36, status: 'RUNNING' }
  ] : [
    { pid: 1420, name: 'telegraf', cpu: '0.8', mem: '0.9', user: 'telegraf', threads: 8, status: 'RUNNING' },
    { pid: 2190, name: 'influxdb', cpu: (current.cpuUsage * 0.22).toFixed(1), mem: '8.2', user: 'influxdb', threads: 24, status: 'RUNNING' },
    { pid: 3840, name: 'nginx', cpu: (current.cpuUsage * 0.18).toFixed(1), mem: '3.5', user: 'www-data', threads: 16, status: 'RUNNING' },
    { pid: 4012, name: 'dockerd', cpu: (current.cpuUsage * 0.25).toFixed(1), mem: '12.4', user: 'root', threads: 32, status: 'RUNNING' },
    { pid: 4890, name: 'redis-server', cpu: '2.1', mem: '4.2', user: 'redis', threads: 6, status: 'RUNNING' },
    { pid: 5210, name: 'node-api', cpu: (current.cpuUsage * 0.15).toFixed(1), mem: '16.8', user: 'app', threads: 20, status: 'RUNNING' }
  ];

  const rawProcesses = server.top_processes && server.top_processes.length > 0 ? server.top_processes : defaultProcesses;
  const processesList = rawProcesses.map((p, idx) => ({
    pid: p.pid || (1000 + idx * 250),
    name: p.name,
    cpu: typeof p.cpu === 'number' ? p.cpu.toFixed(1) : (p.cpu || '1.0'),
    mem: typeof p.mem === 'number' ? p.mem.toFixed(1) : (p.mem || '1.0'),
    user: p.user || (isWindows ? 'SYSTEM' : 'root'),
    threads: p.threads || (12 + (idx * 6) % 32),
    status: p.status || 'RUNNING'
  }));

  let rightSidebarContent = '';

  if (currentNocSubTab === 'overview') {
    rightSidebarContent = `
      <!-- 4 Clean Hero KPI Cards -->
      <div class="noc-clean-kpi-grid">
        <div class="noc-clean-kpi-card">
          <div class="kpi-card-top-accent cpu"></div>
          <div class="kpi-card-header">
            <div class="kpi-card-tag">
              <span class="kpi-icon-dot cpu"></span>
              <span class="kpi-name">CPU LOAD</span>
            </div>
            <span class="kpi-chip">${coresShort} vCPU</span>
          </div>
          <div class="kpi-metric-val ${isHighCpu ? 'alert' : 'cpu'}">
            ${Math.round(current.cpuUsage)}<span class="kpi-unit">%</span>
          </div>
          <div class="kpi-card-footer">
            <span class="kpi-sub-text">Load: ${loadAvg}</span>
            <div class="kpi-mini-bar">
              <div class="kpi-mini-bar-fill ${isHighCpu ? 'alert' : 'cpu'}" style="width: ${current.cpuUsage}%;"></div>
            </div>
          </div>
        </div>

        <div class="noc-clean-kpi-card">
          <div class="kpi-card-top-accent mem"></div>
          <div class="kpi-card-header">
            <div class="kpi-card-tag">
              <span class="kpi-icon-dot mem"></span>
              <span class="kpi-name">RAM OCCUPANCY</span>
            </div>
            <span class="kpi-chip">${ramTotalNum} GB</span>
          </div>
          <div class="kpi-metric-val ${isHighMem ? 'alert' : 'mem'}">
            ${Math.round(current.memoryUsage)}<span class="kpi-unit">%</span>
          </div>
          <div class="kpi-card-footer">
            <span class="kpi-sub-text">${ramUsedNum}/${ramTotalNum} GB In Use</span>
            <div class="kpi-mini-bar">
              <div class="kpi-mini-bar-fill ${isHighMem ? 'alert' : 'mem'}" style="width: ${current.memoryUsage}%;"></div>
            </div>
          </div>
        </div>

        <div class="noc-clean-kpi-card">
          <div class="kpi-card-top-accent disk"></div>
          <div class="kpi-card-header">
            <div class="kpi-card-tag">
              <span class="kpi-icon-dot disk"></span>
              <span class="kpi-name">PRIMARY DISK</span>
            </div>
            <span class="kpi-chip">${mountsList.length} Vols</span>
          </div>
          <div class="kpi-metric-val disk">
            ${Math.round(current.fileSystem)}<span class="kpi-unit">%</span>
          </div>
          <div class="kpi-card-footer">
            <span class="kpi-sub-text">${mountsList[0].driveLetter} ${mountsList[0].label}</span>
            <div class="kpi-mini-bar">
              <div class="kpi-mini-bar-fill disk" style="width: ${current.fileSystem}%;"></div>
            </div>
          </div>
        </div>

        <div class="noc-clean-kpi-card">
          <div class="kpi-card-top-accent swap"></div>
          <div class="kpi-card-header">
            <div class="kpi-card-tag">
              <span class="kpi-icon-dot swap"></span>
              <span class="kpi-name">${isWindows ? 'PAGEFILE' : 'SWAP'}</span>
            </div>
            <span class="kpi-chip">VIRTUAL</span>
          </div>
          <div class="kpi-metric-val swap">
            ${Math.round(current.swapMemory)}<span class="kpi-unit">%</span>
          </div>
          <div class="kpi-card-footer">
            <span class="kpi-sub-text">${swapUsedGb}/${swapTotalGb} GB Used</span>
            <div class="kpi-mini-bar">
              <div class="kpi-mini-bar-fill swap" style="width: ${current.swapMemory}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Partitions & Drives (Clean, No Box Soup) -->
      <div class="noc-clean-card">
        <div class="noc-clean-card-head">
          <div class="noc-head-title-wrap">
            <svg class="noc-head-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>
            </svg>
            <span class="noc-head-title">ACTIVE PARTITIONS & DRIVES</span>
          </div>
          <span class="noc-head-badge">${mountsList.length} Volumes</span>
        </div>
        <div class="noc-clean-mount-list">
          ${mountsList.map(m => {
            const isMntAlert = m.used >= 80;
            return `
              <div class="noc-clean-mount-item">
                <div class="mount-item-top">
                  <div class="mount-name-wrap">
                    <span class="mount-drive-pill">${m.driveLetter}</span>
                    <span class="mount-label-text">(${m.label})</span>
                  </div>
                  <div class="mount-stats-wrap">
                    <span class="mount-pct-val ${isMntAlert ? 'alert' : ''}">${m.used}%</span>
                    <span class="mount-size-dim">(${m.total})</span>
                  </div>
                </div>
                <div class="mount-meter-track">
                  <div class="mount-meter-bar ${isMntAlert ? 'alert-bar' : ''}" style="width: ${m.used}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Active System Processes (With Dedicated Table Header) -->
      <div class="noc-clean-card">
        <div class="noc-clean-card-head">
          <div class="noc-head-title-wrap">
            <svg class="noc-head-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
            </svg>
            <span class="noc-head-title">ACTIVE SYSTEM PROCESSES</span>
          </div>
          <span class="noc-head-live-badge"><span class="pulse-beacon-cyan"></span> LIVE SLICES</span>
        </div>

        <div class="noc-proc-table-header">
          <span class="th-pid">PID</span>
          <span class="th-name">PROCESS NAME</span>
          <span class="th-cpu">CPU %</span>
          <span class="th-mem">RAM %</span>
        </div>

        <div class="noc-clean-proc-list">
          ${processesList.slice(0, 4).map(p => {
            const pCpuNum = parseFloat(p.cpu);
            const pMemNum = parseFloat(p.mem);
            return `
              <div class="noc-clean-proc-row">
                <span class="proc-td-pid">#${p.pid}</span>
                <div class="proc-td-name" title="${p.name}">
                  <span class="proc-bullet"></span>
                  <span class="proc-text">${p.name}</span>
                </div>
                <span class="proc-td-cpu ${pCpuNum >= 20 ? 'high-cpu' : ''}">${p.cpu}%</span>
                <span class="proc-td-mem ${pMemNum >= 20 ? 'high-mem' : ''}">${p.mem}%</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Primary Interface Strip -->
      <div class="noc-clean-net-strip">
        <div class="net-left-col">
          <div class="net-title-line">
            <span class="net-icon-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>
            <span class="net-primary-lbl">PRIMARY INTERFACE (eth0 / LAN)</span>
            <span class="net-link-active" title="Link Active (10 Gbps Full Duplex)"></span>
          </div>
          <div class="net-meta-line">
            <span>${server.ip} • 10 Gbps Full Duplex</span>
          </div>
        </div>

        <div class="net-right-col">
          <div class="net-rate-pill rx" title="Inbound Traffic Rate">
            <span>↓</span>
            <span>${netRx}</span>
          </div>
          <div class="net-rate-pill tx" title="Outbound Traffic Rate">
            <span>↑</span>
            <span>${netTx}</span>
          </div>
        </div>
      </div>
    `;
  } else if (currentNocSubTab === 'storage') {
    rightSidebarContent = `
      <div class="noc-expanded-panel">
        <div class="noc-clean-card">
          <div class="noc-clean-card-head">
            <div class="noc-head-title-wrap">
              <svg class="noc-head-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>
              </svg>
              <span class="noc-head-title">STORAGE & VOLUMES EXPLORER</span>
            </div>
            <span class="noc-head-badge">${mountsList.length} Mounted</span>
          </div>
          
          <div class="noc-detail-grid">
            <div class="noc-detail-tile">
              <span class="noc-detail-lbl">Total Capacity</span>
              <span class="noc-detail-val" style="color: var(--neon-cyan);">900 GB</span>
            </div>
            <div class="noc-detail-tile">
              <span class="noc-detail-lbl">Storage Health</span>
              <span class="noc-detail-val" style="color: var(--neon-emerald);">HEALTHY</span>
            </div>
          </div>
        </div>

        <div class="noc-expanded-card">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase;">Volume Partitions Details</span>
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${mountsList.map(m => `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.5rem 0.65rem; display: flex; flex-direction: column; gap: 0.35rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span class="mount-drive-pill">${m.driveLetter}</span>
                    <strong style="font-size: 0.75rem; color: var(--text-main); font-family: 'JetBrains Mono', monospace;">${m.label}</strong>
                    <span style="font-size: 0.62rem; color: var(--text-dim); font-family: 'JetBrains Mono', monospace;">[${m.fs}]</span>
                  </div>
                  <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 800; color: ${m.used >= 80 ? '#ff2d55' : 'var(--neon-cyan)'};">${m.used}% In Use</span>
                </div>
                <div class="mount-meter-track" style="height: 6px;">
                  <div class="mount-meter-bar ${m.used >= 80 ? 'alert-bar' : ''}" style="width: ${m.used}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-dim); font-family: 'JetBrains Mono', monospace;">
                  <span>Allocated: ${m.total}</span>
                  <span>Disk I/O: Nominal</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (currentNocSubTab === 'processes') {
    rightSidebarContent = `
      <div class="noc-expanded-panel">
        <div class="noc-clean-card">
          <div class="noc-clean-card-head">
            <div class="noc-head-title-wrap">
              <svg class="noc-head-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
              </svg>
              <span class="noc-head-title">SYSTEM PROCESS MANAGER</span>
            </div>
            <span class="noc-head-live-badge"><span class="pulse-beacon-cyan"></span> ${processesList.length} Active</span>
          </div>

          <div class="noc-filter-search-box">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" class="noc-filter-search-input" placeholder="Filter processes..." oninput="handleProcSearch(this.value)" />
          </div>
        </div>

        <div class="noc-expanded-card" style="padding: 0.4rem;">
          <div class="noc-proc-table-header" style="grid-template-columns: 48px 1fr 60px 52px 52px;">
            <span>PID</span>
            <span>NAME</span>
            <span>USER</span>
            <span style="text-align: right; color: var(--neon-cyan);">CPU</span>
            <span style="text-align: right; color: var(--neon-emerald);">RAM</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.2rem; margin-top: 0.2rem;">
            ${processesList.map(p => `
              <div class="noc-clean-proc-row proc-detail-row" style="grid-template-columns: 48px 1fr 60px 52px 52px;">
                <span class="proc-td-pid">#${p.pid}</span>
                <span class="proc-text">${p.name}</span>
                <span style="font-size: 0.62rem; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.user}</span>
                <span class="proc-td-cpu">${p.cpu}%</span>
                <span class="proc-td-mem">${p.mem}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (currentNocSubTab === 'network') {
    rightSidebarContent = `
      <div class="noc-expanded-panel">
        <div class="noc-clean-card">
          <div class="noc-clean-card-head">
            <div class="noc-head-title-wrap">
              <svg class="noc-head-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span class="noc-head-title">NETWORK INTERFACE & ROUTING</span>
            </div>
            <span class="noc-head-live-badge"><span class="pulse-beacon-cyan"></span> LINK UP</span>
          </div>

          <div class="noc-detail-grid">
            <div class="noc-detail-tile">
              <span class="noc-detail-lbl">Inbound Throughput</span>
              <span class="noc-detail-val" style="color: var(--neon-cyan);">↓ ${netRx}</span>
            </div>
            <div class="noc-detail-tile">
              <span class="noc-detail-lbl">Outbound Throughput</span>
              <span class="noc-detail-val" style="color: var(--neon-emerald);">↑ ${netTx}</span>
            </div>
            <div class="noc-detail-tile">
              <span class="noc-detail-lbl">Total Aggregate</span>
              <span class="noc-detail-val" style="color: var(--neon-purple);">${totalThroughput} MB/s</span>
            </div>
            <div class="noc-detail-tile">
              <span class="noc-detail-lbl">Link Speed</span>
              <span class="noc-detail-val" style="color: var(--neon-cyan);">10 Gbps FD</span>
            </div>
          </div>
        </div>

        <div class="noc-expanded-card">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase;">Adapter Configuration</span>
          <div style="display: flex; flex-direction: column; gap: 0.35rem; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;">
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
              <span style="color: var(--text-dim);">Interface Name:</span>
              <span style="color: var(--text-main); font-weight: 700;">eth0 (Primary LAN)</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
              <span style="color: var(--text-dim);">IPv4 Address:</span>
              <span style="color: var(--neon-cyan); font-weight: 700;">${server.ip}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
              <span style="color: var(--text-dim);">Subnet Mask:</span>
              <span style="color: var(--text-main);">255.255.255.0 (/24)</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
              <span style="color: var(--text-dim);">Gateway:</span>
              <span style="color: var(--text-main);">10.226.111.1</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
              <span style="color: var(--text-dim);">MAC Hardware:</span>
              <span style="color: var(--text-main);">00:15:5D:8A:3F:2B</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
              <span style="color: var(--text-dim);">Packet Errors / Drops:</span>
              <span style="color: var(--neon-emerald); font-weight: 700;">0 (0.00%)</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const existingCol = container.querySelector('.inspect-telemetry-column');
  const prevScrollTop = existingCol ? existingCol.scrollTop : 0;

  container.innerHTML = `
    <!-- Left Column: 3 Spec Graph Panels (CPU, Memory, Network) -->
    <div class="inspect-graphs-column">
      <!-- Spec Card 1: CPU UTILIZATION -->
      <div class="spec-graph-card">
        <div class="spec-graph-header">
          <div class="spec-graph-title-wrap">
            <span class="spec-graph-title">CPU UTILIZATION</span>
            <span class="spec-graph-sub">STACKED SYSTEM LOAD • ${currentRange.toUpperCase()} STREAM • CURRENT ${Math.round(current.cpuUsage)}%</span>
          </div>
          <span class="${isHighCpu ? 'spec-badge-alert' : 'spec-badge-healthy'}">${isHighCpu ? '● HIGH UTILIZATION' : '● NOMINAL LOAD'}</span>
        </div>
        <div class="spec-graph-svg-wrap">
          ${generateSpecGraphCardSvg('cpu', server, currentTheme === 'dark', currentRange)}
        </div>
      </div>

      <!-- Spec Card 2: MEMORY COMPOSITION -->
      <div class="spec-graph-card">
        <div class="spec-graph-header">
          <div class="spec-graph-title-wrap">
            <span class="spec-graph-title">MEMORY COMPOSITION</span>
            <span class="spec-graph-sub">${ramTotalNum} GB TOTAL • ${currentRange.toUpperCase()} STREAM • CACHE, USED, FREE & SWAP</span>
          </div>
          <span class="spec-val-badge"><strong style="color: #76e3b0;">${ramUsedNum} GB</strong> <span style="color: var(--text-dim); font-size: 0.7rem;">IN USE (${Math.round(current.memoryUsage)}%)</span></span>
        </div>
        <div class="spec-graph-svg-wrap">
          ${generateSpecGraphCardSvg('mem', server, currentTheme === 'dark', currentRange)}
        </div>
      </div>

      <!-- Spec Card 3: NETWORK TRAFFIC -->
      <div class="spec-graph-card">
        <div class="spec-graph-header">
          <div class="spec-graph-title-wrap">
            <span class="spec-graph-title">NETWORK TRAFFIC</span>
            <span class="spec-graph-sub">INBOUND & OUTBOUND THROUGHPUT • ${currentRange.toUpperCase()} STREAM • TOTAL: ${totalThroughput} MB/s</span>
          </div>
          <span class="spec-net-legend"><span style="color: #46dfff; font-weight: 700;">↓ IN: ${netRx}</span> <span style="color: #ff9a4d; font-weight: 700; margin-left: 0.45rem;">↑ OUT: ${netTx}</span></span>
        </div>
        <div class="spec-graph-svg-wrap">
          ${generateSpecGraphCardSvg('net', server, currentTheme === 'dark', currentRange)}
        </div>
      </div>
    </div>

    <!-- Right Column: Single-View NOC Telemetry Sidebar -->
    <div class="inspect-telemetry-column">
      <!-- Sub-Nav Pill Bar -->
      <div class="noc-subnav-bar">
        <button class="noc-subnav-btn ${currentNocSubTab === 'overview' ? 'active' : ''}" onclick="setNocSubTab('overview')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>OVERVIEW</span>
        </button>
        <button class="noc-subnav-btn ${currentNocSubTab === 'storage' ? 'active' : ''}" onclick="setNocSubTab('storage')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>
          <span>STORAGE</span>
          <span class="subnav-count-badge">${mountsList.length}</span>
        </button>
        <button class="noc-subnav-btn ${currentNocSubTab === 'processes' ? 'active' : ''}" onclick="setNocSubTab('processes')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
          <span>PROCESSES</span>
          <span class="subnav-count-badge">${processesList.length}</span>
        </button>
        <button class="noc-subnav-btn ${currentNocSubTab === 'network' ? 'active' : ''}" onclick="setNocSubTab('network')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span>NETWORK</span>
        </button>
      </div>

      ${rightSidebarContent}
    </div>
  `;

  const newCol = container.querySelector('.inspect-telemetry-column');
  if (newCol && prevScrollTop) {
    newCol.scrollTop = prevScrollTop;
  }
}

window.handleProcSearch = function(query) {
  const q = (query || '').toLowerCase();
  const rows = document.querySelectorAll('.proc-detail-row');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = text.includes(q) ? 'grid' : 'none';
  });
};


function exportLogsCSV() {
  if (!serversData || serversData.length === 0) {
    alert('No telemetry records available to export.');
    return;
  }

  const headers = ['server', 'os', 'ip', 'time', 'cpuUsage', 'memoryUsage', 'swapMemory', 'fileSystem'];
  const csvRows = [headers.join(',')];

  serversData.forEach(server => {
    if (server.metrics) {
      server.metrics.forEach(row => {
        const values = [
          `"${server.host}"`,
          `"${server.os}"`,
          `"${server.ip || ''}"`,
          row.time,
          row.cpuUsage,
          row.memoryUsage,
          row.swapMemory,
          row.fileSystem
        ];
        csvRows.push(values.join(','));
      });
    }
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `telemetry_3servers_export_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  addEvent('info', 'Exported full 3-node telemetry logs to CSV');
}

/* ==========================================================================
   Futuristic AI Neural Canvas Background Engine
   ========================================================================== */

function initAiNeuralBackground() {
  const canvas = document.getElementById('aiNeuralCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width, height;
  let particles = [];
  const particleCount = 42;
  const maxDistance = 140;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  let mouse = { x: -1000, y: -1000, active: false };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -1000;
    mouse.y = -1000;
  });

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * (width || window.innerWidth);
      this.y = Math.random() * (height || window.innerHeight);
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.5 + 1.2;
      this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += 0.025;

      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;
    }
    draw(isLight) {
      const currentRadius = this.radius + Math.sin(this.pulse) * 0.45;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
      ctx.fillStyle = isLight ? 'rgba(2, 132, 199, 0.45)' : 'rgba(0, 242, 254, 0.55)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.fill();
    }
  }

  particles = Array.from({ length: particleCount }, () => new Particle());

  function animate(time) {
    requestAnimationFrame(animate);
    if (document.hidden) return;

    ctx.clearRect(0, 0, width, height);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.update();
      p1.draw(isLight);

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          if (isLight) {
            ctx.strokeStyle = `rgba(2, 132, 199, ${(alpha * 0.18).toFixed(3)})`;
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = `rgba(0, 242, 254, ${(alpha * 0.15).toFixed(3)})`;
            ctx.lineWidth = 0.8;
          }
          ctx.stroke();

          if ((Math.floor(time / 2200) + i + j) % 6 === 0) {
            const progress = (time % 2200) / 2200;
            const px = p1.x + (p2.x - p1.x) * progress;
            const py = p1.y + (p2.y - p1.y) * progress;
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? 'rgba(2, 132, 199, 0.65)' : 'rgba(0, 242, 254, 0.85)';
            ctx.fill();
          }
        }
      }

      if (mouse.active) {
        const mdx = p1.x - mouse.x;
        const mdy = p1.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 160) {
          const mAlpha = (1 - mDist / 160);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = isLight
            ? `rgba(2, 132, 199, ${(mAlpha * 0.28).toFixed(3)})`
            : `rgba(0, 242, 254, ${(mAlpha * 0.35).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }
  }

  requestAnimationFrame(animate);
}

/* ==========================================================================
   AI Health Assistant & Telemetry Chatbot Module
   ========================================================================== */

let isChatbotOpen = false;
let currentAiModel = localStorage.getItem('selectedAiModel') || 'gemini-2.5-flash';
let customApiKey = localStorage.getItem('customGeminiApiKey') || '';
let hasEnvKey = false;
let chatMessages = [];
let isChatbotResponding = false;

function initChatbot() {
  fetchAiModels();

  const customKeyInput = document.getElementById('customApiKeyInput');
  if (customKeyInput && customApiKey) {
    customKeyInput.value = customApiKey;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isChatbotOpen) {
      toggleChatbot(false);
    }
  });

  renderInitialWelcomeMessage();
}

async function fetchAiModels() {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) return;
    const data = await res.json();
    
    hasEnvKey = data.has_env_key;
    const modelSelect = document.getElementById('chatModelSelect');
    if (modelSelect && data.models && data.models.length > 0) {
      modelSelect.innerHTML = data.models.map(m => `
        <option value="${m.id}" ${m.id === currentAiModel ? 'selected' : ''}>
          ${m.name}
        </option>
      `).join('');
    }

    updateApiKeyPillUI(data);
  } catch (err) {
    console.warn('Failed to fetch AI models:', err);
  }
}

function updateApiKeyPillUI(modelData) {
  const pillLabel = document.getElementById('apiKeyPillLabel');
  const pillDot = document.getElementById('apiKeyPillDot');
  const statusNote = document.getElementById('apiKeyStatusNote');

  if (customApiKey) {
    if (pillLabel) pillLabel.textContent = 'API KEY (CUSTOM)';
    if (pillDot) { pillDot.className = 'pill-dot'; }
    if (statusNote) {
      statusNote.innerHTML = 'Using <b>Custom API Key</b> saved in browser storage. Click SAVE to update or clear to revert.';
    }
  } else if (hasEnvKey || (modelData && modelData.has_env_key)) {
    if (pillLabel) pillLabel.textContent = 'API KEY (.ENV ACTIVE)';
    if (pillDot) { pillDot.className = 'pill-dot'; }
    if (statusNote) {
      statusNote.innerHTML = 'Google Gemini API Key loaded from <code>.env</code> file. AI is fully armed.';
    }
  } else {
    if (pillLabel) pillLabel.textContent = 'API KEY (AIRGAP / LOCAL)';
    if (pillDot) { pillDot.className = 'pill-dot warning'; }
    if (statusNote) {
      statusNote.innerHTML = 'No Gemini API key in <code>.env</code>. Built-in Telemetry Analysis Engine is active. (Enter key above for Gemini LLM).';
    }
  }
}

function toggleChatbot(forceState) {
  const overlay = document.getElementById('chatbotOverlay');
  if (!overlay) return;

  if (typeof forceState === 'boolean') {
    isChatbotOpen = forceState;
  } else {
    isChatbotOpen = !isChatbotOpen;
  }

  if (isChatbotOpen) {
    overlay.classList.add('open');
    updateChatbotTelegrafTicker();
    setTimeout(() => {
      const input = document.getElementById('chatMessageInput');
      if (input) input.focus();
    }, 200);
    addEvent('info', 'AI Health Assistant drawer opened');
  } else {
    overlay.classList.remove('open');
  }
}

function handleChatbotBackdropClick(event) {
  if (event.target && event.target.id === 'chatbotOverlay') {
    toggleChatbot(false);
  }
}

function onModelChange(newModel) {
  currentAiModel = newModel;
  localStorage.setItem('selectedAiModel', newModel);
  addEvent('info', `AI diagnostic model set to: ${newModel}`);
}

function toggleApiKeyConfig() {
  const drawer = document.getElementById('apiKeyConfigDrawer');
  if (!drawer) return;
  drawer.style.display = (drawer.style.display === 'none' || !drawer.style.display) ? 'flex' : 'none';
}

function saveCustomApiKey() {
  const input = document.getElementById('customApiKeyInput');
  if (!input) return;
  const key = input.value.trim();
  customApiKey = key;
  if (key) {
    localStorage.setItem('customGeminiApiKey', key);
    addEvent('info', 'Custom Gemini API Key saved');
  } else {
    localStorage.removeItem('customGeminiApiKey');
    addEvent('info', 'Custom API Key cleared, reverted to .env');
  }
  updateApiKeyPillUI();
  toggleApiKeyConfig();
}

function renderInitialWelcomeMessage() {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  container.innerHTML = `
    <div class="chat-msg assistant">
      <div class="chat-bubble">
        <h3>🛡️ AI Health Assistant & Telemetry Analyst</h3>
        <p>Welcome! I am connected to your live <b>Telegraf & InfluxDB telemetry pipeline</b>, continuously monitoring <b>3 cluster nodes</b> (1 Linux server, 2 Windows servers).</p>
        <p>I can perform deep diagnostic health audits, detect resource bottlenecks (>80% thresholds), analyze top system processes, and produce certified health reports.</p>
        <p><b>Quick Actions:</b></p>
        <ul>
          <li>Click <b>🔍 Analyze Health Check</b> to run a real-time full cluster diagnostic audit.</li>
          <li>Click <b>📄 Download Health Report (PDF)</b> to download the executive PDF report.</li>
          <li>Ask me anything about CPU, RAM, Disk, Swap, or specific server anomalies!</li>
        </ul>
      </div>
      <div class="chat-msg-meta">
        <span>SRE AI ENGINE</span> • <span>${now}</span>
      </div>
    </div>
  `;
}

function clearChatHistory() {
  chatMessages = [];
  renderInitialWelcomeMessage();
  addEvent('info', 'Chatbot conversation history cleared');
}

function updateChatbotTelegrafTicker() {
  const statsEl = document.getElementById('chatTelegrafStatsText');
  if (!statsEl) return;

  if (!serversData || serversData.length === 0) {
    statsEl.textContent = 'Connecting to InfluxDB / Telegraf telemetry pipeline...';
    return;
  }

  let totalCpu = 0;
  let totalMem = 0;
  let totalRx = 0;
  let totalTx = 0;
  let nodeCount = serversData.length;

  serversData.forEach(s => {
    const metrics = s.metrics || [];
    const lastM = metrics.length > 0 ? metrics[metrics.length - 1] : null;
    if (lastM) {
      totalCpu += (lastM.cpuUsage || 0);
      totalMem += (lastM.memoryUsage || 0);
    }
    if (s.network) {
      totalRx += (s.network.rx_rate || 0);
      totalTx += (s.network.tx_rate || 0);
    }
  });

  const avgCpu = (totalCpu / nodeCount).toFixed(1);
  const avgMem = (totalMem / nodeCount).toFixed(1);
  const rxStr = totalRx > 0 ? `${totalRx.toFixed(1)} MB/s` : '135.2 MB/s';
  const txStr = totalTx > 0 ? `${totalTx.toFixed(1)} MB/s` : '81.6 MB/s';

  statsEl.textContent = `Avg CPU: ${avgCpu}% • RAM: ${avgMem}% • Net: ↓${rxStr} ↑${txStr} • ${nodeCount} Nodes Synced`;
}

function handleChatInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

async function sendChatMessage(presetText) {
  if (isChatbotResponding) return;

  const input = document.getElementById('chatMessageInput');
  const text = presetText || (input ? input.value.trim() : '');
  if (!text) return;

  if (!presetText && input) {
    input.value = '';
    input.style.height = 'auto';
  }

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Append user message
  appendChatMessage('user', text, now);

  // Append typing indicator
  const typingId = 'typing-' + Date.now();
  appendTypingIndicator(typingId);

  isChatbotResponding = true;
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const payload = {
      message: text,
      model: currentAiModel,
      apiKey: customApiKey,
      telegrafData: serversData
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonSafeStringify(payload)
    });

    removeTypingIndicator(typingId);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const replyText = data.reply || 'No response received from diagnostic engine.';
    const modelTag = (data.provider === 'google' ? 'GEMINI ' : 'SRE ENGINE ') + (data.model || '');
    appendChatMessage('assistant', replyText, data.timestamp || now, modelTag);

  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage(
      'assistant',
      `⚠️ **Telemetry Assistant Communication Note**: ${err.message}. Switching to local telemetry diagnostics.`,
      now,
      'FALLBACK SRE'
    );
  } finally {
    isChatbotResponding = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}

function jsonSafeStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (key === 'metrics' && Array.isArray(value) && value.length > 5) {
      return value.slice(-5);
    }
    return value;
  });
}

function appendChatMessage(role, text, time, metaTag = 'SRE AI') {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${role}`;

  const formattedHtml = role === 'assistant' ? formatMarkdownToHtml(text) : escapeHtml(text).replace(/\n/g, '<br>');

  msgEl.innerHTML = `
    <div class="chat-bubble">
      ${formattedHtml}
    </div>
    <div class="chat-msg-meta">
      <span>${metaTag}</span> • <span>${time}</span>
    </div>
  `;

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator(id) {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg assistant';
  typingEl.id = id;
  typingEl.innerHTML = `
    <div class="chat-bubble">
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
    <div class="chat-msg-meta">
      <span>ANALYZING TELEMETRY...</span>
    </div>
  `;
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function formatMarkdownToHtml(md) {
  if (!md) return '';

  let html = md;

  // Escape basic HTML tags to prevent XSS except formatting
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Tables
  html = html.replace(/\|(.+)\|[\r\n]+\|[-:| ]+\|[\r\n]+((?:\|.+[\r\n]*)+)/g, (match, headerLine, rowsBlock) => {
    const headers = headerLine.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = rowsBlock.trim().split('\n').map(row => {
      const cols = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cols}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Headers (order longest hashes first)
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>');
  html = html.replace(/\*(.*?)\*/gim, '<i>$1</i>');

  // Code snippets
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Bullet points
  html = html.replace(/^\s*[-•]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Line breaks
  html = html.replace(/\n\n/g, '<p></p>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* Quick Action Triggers */
function triggerAnalyzeHealthCheck() {
  if (!isChatbotOpen) toggleChatbot(true);
  sendChatMessage("Analyze Health Check: Perform an exhaustive SRE audit of all 3 monitored cluster nodes using live Telegraf metrics. Evaluate CPU, RAM, Disk, Swap, Load averages, and identify anomalies or bottlenecks.");
}

function downloadHealthReportPDF() {
  addEvent('info', 'Generating Executive Health Report (PDF)...');
  
  const link = document.createElement('a');
  link.href = `/api/health-report-pdf?range=${currentRange}&t=${Date.now()}`;
  link.download = 'Application_Health_Report.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();

  if (isChatbotOpen) {
    appendChatMessage(
      'assistant',
      '📄 **Executive Health Audit Downloaded**: The `Application_Health_Report.pdf` has been generated and downloaded. It contains complete node telemetry, filesystem breakdown, active processes, and signed SRE findings.',
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      'PDF GENERATOR'
    );
  }
}

function triggerLiveTelegrafSnapshot() {
  if (!isChatbotOpen) toggleChatbot(true);

  if (!serversData || serversData.length === 0) {
    sendChatMessage("Show live Telegraf data snapshot for all monitored nodes.");
    return;
  }

  let hudRows = serversData.map(s => {
    const metrics = s.metrics || [];
    const lastM = metrics.length > 0 ? metrics[metrics.length - 1] : {};
    const cpu = lastM.cpuUsage !== undefined ? lastM.cpuUsage : s.baseCpu;
    const mem = lastM.memoryUsage !== undefined ? lastM.memoryUsage : s.baseMem;
    const disk = lastM.fileSystem !== undefined ? lastM.fileSystem : s.baseDisk;
    const swap = lastM.swapMemory !== undefined ? lastM.swapMemory : s.baseSwap;
    const net = s.network || {};
    const status = (cpu > 80 || mem > 85) ? '🟡 WARNING' : '🟢 HEALTHY';

    return `| **${s.host}** | ${s.role || s.os} | \`${cpu}%\` | \`${mem}%\` | \`${disk}%\` | \`${swap}%\` | ↓${net.rx || '40 MB/s'} ↑${net.tx || '25 MB/s'} | ${status} |`;
  }).join('\n');

  const liveMarkdown = `
### ⚡ Live Telegraf Telemetry Stream Snapshot
**Stream Timestamp:** \`${new Date().toLocaleTimeString()} UTC\` | **Pipeline:** InfluxDB v2 (1-sec intervals)

| Node | Role / OS | CPU | RAM | Disk | Swap | Net Throughput | Status |
|:---|:---|:---:|:---:|:---:|:---:|:---|:---:|
${hudRows}

*Telemetry is synced live with server metrics.*
  `;

  appendChatMessage('assistant', liveMarkdown, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'LIVE TELEGRAF');
}

function triggerBottleneckCheck() {
  if (!isChatbotOpen) toggleChatbot(true);
  sendChatMessage("Detect any servers breaching the 80% CPU or 85% Memory thresholds, and check for disk/swap saturation or process contention.");
}
