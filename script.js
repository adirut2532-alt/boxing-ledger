// --- BOXING BETTING LEDGER (สมุดบัญชีเล่นมวย) CORE LOGIC ---

// --- 1. Sound Generator (Subtle, Clean UI Chimes via Web Audio API) ---
class CleanSoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playSaveChime() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Smooth double bell chime
    const freqs = [880, 1109.73]; // A5 and C#6 (Clean Major third)
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  playDeleteSwoosh() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.12);
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.15);
  }
}

const sounds = new CleanSoundManager();

// --- 2. State Management & Seed Data ---
let ledgerState = {
  activeTab: 'dashboard',
  channels: [],       // 13 channels [{id: 1..13, name: "..."}]
  transactions: [],   // [{id, date, channelId, gross, commPct, net, isTransferred}]
  summaryRange: 'daily' // daily, weekly, monthly
};

// Seed initial channels & entries
function seedInitialBettingData() {
  // 13 default channels
  ledgerState.channels = [];
  const defaultNames = [
    'ช่องทางมวย 1 (สายด่วน)',
    'ช่องทางมวย 2 (สายเฮียเล้ง)',
    'ช่องทางมวย 3 (เว็บมวยไทย A)',
    'ช่องทางมวย 4 (ตู้น้ำมวยสด)',
    'ช่องทางมวย 5 (สายเสี่ยดำ)',
    'ช่องทางมวย 6 (เว็บแทงมวย B)',
    'ช่องทางมวย 7 (โต๊ะมวยเขากิเลน)',
    'ช่องทางมวย 8 (สายพี่รุ่ง)',
    'ช่องทางมวย 9 (เว็บมวยไทย C)',
    'ช่องทางมวย 10 (สายเฮียแดง)',
    'ช่องทางมวย 11 (สายเพชรยินดี)',
    'ช่องทางมวย 12 (สายลุมพินี)',
    'ช่องทางมวย 13 (สายราชดำเนิน)'
  ];
  
  for (let i = 1; i <= 13; i++) {
    ledgerState.channels.push({
      id: i,
      name: defaultNames[i - 1] || `ช่องทางมวย ${i}`,
      defaultComm: 5
    });
  }

  // Pre-seed mock transactions for demonstration
  const today = new Date();
  const getPastDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  ledgerState.transactions = [
    // Today
    { id: 't-1', date: getPastDateStr(0), channelId: 1, gross: 12000, commPct: 5, net: 11400, isTransferred: true },
    { id: 't-2', date: getPastDateStr(0), channelId: 2, gross: -4000, commPct: 5, net: -4000, isTransferred: false },
    { id: 't-3', date: getPastDateStr(0), channelId: 3, gross: 8500, commPct: 3, net: 8245, isTransferred: false },
    
    // Yesterday
    { id: 't-4', date: getPastDateStr(1), channelId: 5, gross: -6000, commPct: 5, net: -6000, isTransferred: true },
    { id: 't-5', date: getPastDateStr(1), channelId: 6, gross: 15000, commPct: 5, net: 14250, isTransferred: true },
    
    // 3 Days ago
    { id: 't-6', date: getPastDateStr(3), channelId: 10, gross: 20000, commPct: 5, net: 19000, isTransferred: true },
    { id: 't-7', date: getPastDateStr(3), channelId: 13, gross: -8000, commPct: 5, net: -8000, isTransferred: false },
    
    // 4 Days ago
    { id: 't-8', date: getPastDateStr(4), channelId: 2, gross: 5000, commPct: 5, net: 4750, isTransferred: true },
    
    // 7 Days ago
    { id: 't-9', date: getPastDateStr(7), channelId: 1, gross: 9000, commPct: 5, net: 8550, isTransferred: true },
    { id: 't-10', date: getPastDateStr(7), channelId: 7, gross: -2500, commPct: 5, net: -2500, isTransferred: true }
  ];
}

// Storage Helpers
function saveToStorage() {
  localStorage.setItem('BOXING_BET_LEDGER_STATE', JSON.stringify({
    channels: ledgerState.channels,
    transactions: ledgerState.transactions
  }));
}

function loadFromStorage() {
  const data = localStorage.getItem('BOXING_BET_LEDGER_STATE');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      ledgerState.channels = parsed.channels || [];
      ledgerState.transactions = parsed.transactions || [];
      
      // Safety check: Ensure we have exactly 13 channels
      if (ledgerState.channels.length < 13) {
        const missingCount = 13 - ledgerState.channels.length;
        for (let i = 1; i <= missingCount; i++) {
          const nextId = ledgerState.channels.length + 1;
          ledgerState.channels.push({ id: nextId, name: `ช่องทางมวย ${nextId}`, defaultComm: 5 });
        }
      }
      ledgerState.channels.forEach(ch => {
        if (ch.defaultComm === undefined) ch.defaultComm = 5;
      });
    } catch (e) {
      console.error("Storage corrupt, seeding defaults.", e);
      seedInitialBettingData();
    }
  } else {
    seedInitialBettingData();
  }
}

// --- 3. UI Helpers ---
function formatBaht(value) {
  const isNeg = value < 0;
  const absVal = Math.floor(Math.abs(value));
  return `${isNeg ? '-' : ''}฿${absVal.toLocaleString('th-TH')}`;
}

function showToast(message) {
  const toast = document.getElementById('toast-banner');
  const toastText = document.getElementById('toast-banner-text');
  
  toastText.innerText = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// --- 4. Main Calculations & Aggregators ---
function calculateBetFinancials() {
  let totalNet = 0;       // Net Win/Loss (after commission on profits)
  let totalComm = 0;      // Total commission deducted
  let totalSettled = 0;   // Net amount already transferred (IsTransferred = true)
  let totalPending = 0;   // Net amount not yet transferred (IsTransferred = false)
  let countSettled = 0;   // Number of settled entries
  let countPending = 0;   // Number of pending entries

  ledgerState.transactions.forEach(t => {
    const commission = t.gross > 0 ? t.gross * (t.commPct / 100) : 0;
    totalNet += t.net;
    totalComm += commission;

    if (t.isTransferred) {
      totalSettled += t.net;
      countSettled++;
    } else {
      totalPending += t.net;
      countPending++;
    }
  });

  return {
    totalNet,
    totalComm,
    totalSettled,
    totalPending,
    countSettled,
    countPending
  };
}

// Helper to get calendar week range string (e.g. "สัปดาห์: 12 มิ.ย. - 18 มิ.ย. 2570")
function getWeekRangeString(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  // Adjust Monday start index
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(d.setDate(diff + 6));
  
  return `${monday.toLocaleDateString('th-TH', {day:'numeric', month:'short'})} - ${sunday.toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'})}`;
}

// Helper to get month string (e.g. "มิถุนายน 2570")
function getMonthString(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', {month: 'long', year: 'numeric'});
}

// --- 5. DOM Renderers ---

// A. Render Dashboard Widgets & Visual Column Chart
function renderDashboard() {
  const stats = calculateBetFinancials();
  
  document.getElementById('total-net-balance').innerText = formatBaht(stats.totalNet);
  document.getElementById('total-comm-deducted').innerText = formatBaht(stats.totalComm);
  document.getElementById('total-settled-balance').innerText = formatBaht(stats.totalSettled);
  
  const pendingEl = document.getElementById('total-pending-balance');
  pendingEl.innerText = formatBaht(stats.totalPending);
  
  // Highlight pending in red/amber if there are outstanding funds to settle
  if (stats.totalPending > 0) {
    pendingEl.style.color = 'var(--pending-color)';
  } else if (stats.totalPending < 0) {
    pendingEl.style.color = 'var(--loss-color)';
  } else {
    pendingEl.style.color = 'var(--primary)';
  }

  // Update dynamic description texts with item counts
  const totalCount = ledgerState.transactions.length;
  document.getElementById('balance-desc').innerText = `สุทธิจากรายการเล่นทั้งหมด ${totalCount} รายการ`;
  document.getElementById('settled-desc').innerText = `โอนเคลียร์เรียบร้อยแล้ว ${stats.countSettled} รายการ`;
  document.getElementById('pending-desc').innerText = `ค้างโอนสะสมอยู่ ${stats.countPending} รายการ`;

  // Render recent 8 active days column bars
  renderDailyChart();
}

// B. Render simple dynamic columns chart
function renderDailyChart() {
  const chartContainer = document.getElementById('dashboard-bars-chart');
  chartContainer.innerHTML = '';

  // Group transactions by date
  const dayTotals = {};
  ledgerState.transactions.forEach(t => {
    if (!dayTotals[t.date]) dayTotals[t.date] = 0;
    dayTotals[t.date] += t.net;
  });

  // Sort dates ascending, take latest 8
  const sortedDates = Object.keys(dayTotals).sort((a,b) => new Date(a) - new Date(b)).slice(-8);

  if (sortedDates.length === 0) {
    chartContainer.innerHTML = `<p style="color:var(--muted); text-align:center; padding: 40px; width: 100%;">ไม่มีข้อมูลรายการธุรกรรมเพื่อสร้างกราฟ</p>`;
    return;
  }

  const maxVal = Math.max(...sortedDates.map(d => Math.abs(dayTotals[d])), 1000);

  sortedDates.forEach(dateStr => {
    const net = dayTotals[dateStr];
    const isProfit = net >= 0;
    const absVal = Math.abs(net);
    const heightPercent = Math.min((absVal / maxVal) * 85, 85);

    // Format date string for label (e.g. 14 มิ.ย.)
    const dateObj = new Date(dateStr);
    const label = dateObj.toLocaleDateString('th-TH', {day: 'numeric', month: 'short'});

    const col = document.createElement('div');
    col.className = 'column-col';
    col.innerHTML = `
      <div class="column-fill ${isProfit ? 'profit' : 'loss'}" style="height: ${heightPercent}%">
        <span class="column-val">${net !== 0 ? (isProfit ? '+' : '-') + absVal.toLocaleString() : '0'}</span>
      </div>
      <span class="column-label">${label}</span>
    `;
    chartContainer.appendChild(col);
  });
}

// C. Render Daily Ledger Table
function renderLedgerTable() {
  const tbody = document.getElementById('ledger-table-rows');
  tbody.innerHTML = '';
  
  const mobileContainer = document.getElementById('ledger-mobile-cards');
  if (mobileContainer) mobileContainer.innerHTML = '';

  const filterChannel = document.getElementById('filter-ledger-channel').value;
  const filterStatus = document.getElementById('filter-ledger-status').value;
  const filterDate = document.getElementById('filter-ledger-date').value;

  // Filter list
  const filtered = ledgerState.transactions.filter(t => {
    const matchesChannel = filterChannel === 'all' || t.channelId === parseInt(filterChannel);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'transferred' && t.isTransferred) || 
      (filterStatus === 'pending' && !t.isTransferred);
    const matchesDate = !filterDate || t.date === filterDate;
    
    return matchesChannel && matchesStatus && matchesDate;
  });

  // Sort by date desc
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--muted); padding:32px;">ไม่พบรายการบัญชีมวยที่ระบุ</td></tr>`;
    if (mobileContainer) {
      mobileContainer.innerHTML = `<p style="text-align:center; color:var(--muted); padding:24px;">ไม่พบรายการบัญชีมวยที่ระบุ</p>`;
    }
    return;
  }

  filtered.forEach(t => {
    const channel = ledgerState.channels.find(c => c.id === t.channelId);
    const channelName = channel ? channel.name : `ช่องทางมวย ${t.channelId}`;

    const grossText = t.gross >= 0 ? `+${t.gross.toLocaleString()}` : t.gross.toLocaleString();
    const grossClass = t.gross >= 0 ? 'text-profit' : 'text-loss';
    
    const netText = t.net >= 0 ? `+${t.net.toLocaleString()}` : t.net.toLocaleString();
    const netClass = t.net >= 0 ? 'text-profit' : 'text-loss';

    const statusBadge = t.isTransferred ? 
      `<div class="table-checkbox-label transferred" data-id="${t.id}">✔️ โอนแล้ว</div>` :
      `<div class="table-checkbox-label pending" data-id="${t.id}">❌ ยังไม่โอน</div>`;

    // 1. Desktop Table Row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:var(--font-en); font-size:0.8rem; font-weight:600;">${t.date}</td>
      <td style="font-weight: 500">${channelName}</td>
      <td style="text-align: right;" class="${grossClass}">${grossText}</td>
      <td style="text-align: right; font-family:var(--font-en); color:var(--primary-light)">${t.gross > 0 ? t.commPct + '%' : '-'}</td>
      <td style="text-align: right;" class="${netClass}">${netText}</td>
      <td style="text-align: center">${statusBadge}</td>
      <td style="text-align: center">
        <button class="btn-delete-row btn-delete-bet" data-id="${t.id}" title="ลบรายการ">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);

    // 2. Mobile Card
    if (mobileContainer) {
      const cardEl = document.createElement('div');
      const isProfitCard = t.net >= 0;
      cardEl.className = `ledger-mobile-card ${isProfitCard ? 'profit-card' : 'loss-card'}`;
      
      const commDeductedVal = t.gross > 0 ? Math.round(t.gross * (t.commPct / 100)) : 0;
      const formattedCommDeducted = commDeductedVal > 0 ? `-${commDeductedVal.toLocaleString()}` : '-';

      const mobileStatusBadge = t.isTransferred ? 
        `<div class="mobile-status-btn transferred" data-id="${t.id}">🟢 โอนแล้ว</div>` :
        `<div class="mobile-status-btn pending" data-id="${t.id}">🔴 ยังไม่โอน</div>`;

      cardEl.innerHTML = `
        <div class="ledger-mobile-card-header">
          <span class="ledger-mobile-card-date">📅 ${t.date}</span>
          <button class="btn-delete-mobile btn-delete-bet" data-id="${t.id}">🗑️ ลบ</button>
        </div>
        
        <div class="ledger-mobile-card-body">
          <div class="ledger-mobile-card-info">
            <div class="ledger-mobile-card-channel">🥊 ${channelName}</div>
            <div class="ledger-mobile-card-comm-tag">ค่าคอมมิชชั่น ${t.commPct}%</div>
          </div>
          <div class="ledger-mobile-card-net">
            <span class="ledger-mobile-card-net-label">ยอดสุทธิ</span>
            <span class="ledger-mobile-card-net-val ${netClass}">${netText}</span>
          </div>
        </div>
        
        <div class="ledger-mobile-card-details">
          <div class="ledger-mobile-card-detail-item">
            <span class="ledger-mobile-card-detail-label">ยอดดิบ (Gross)</span>
            <span class="ledger-mobile-card-detail-val ${grossClass}">${grossText}</span>
          </div>
          <div class="ledger-mobile-card-detail-item" style="text-align: right;">
            <span class="ledger-mobile-card-detail-label">โดนหักคอม</span>
            <span class="ledger-mobile-card-detail-val" style="color:var(--loss-color);">${formattedCommDeducted}</span>
          </div>
        </div>
        
        <div class="ledger-mobile-card-footer">
          <span style="font-size: 0.72rem; color: var(--muted);">แตะปุ่มเพื่อเปลี่ยนสถานะ</span>
          ${mobileStatusBadge}
        </div>
      `;
      mobileContainer.appendChild(cardEl);
    }
  });

  // Inline Status Click Toggle (Supports both Desktop labels and Mobile tactile buttons)
  document.querySelectorAll('.table-checkbox-label, .mobile-status-btn').forEach(label => {
    label.addEventListener('click', (e) => {
      sounds.playClick();
      const id = e.currentTarget.dataset.id;
      const tx = ledgerState.transactions.find(t => t.id === id);
      if (tx) {
        tx.isTransferred = !tx.isTransferred;
        saveToStorage();
        renderLedgerTable();
        renderDashboard();
        showToast(tx.isTransferred ? "อัปเดตสถานะ: โอนแล้ว!" : "อัปเดตสถานะ: ยังไม่โอน!");
      }
    });
  });

  // Delete Transaction Click
  document.querySelectorAll('.btn-delete-bet').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sounds.playDeleteSwoosh();
      const id = e.currentTarget.dataset.id;
      ledgerState.transactions = ledgerState.transactions.filter(t => t.id !== id);
      saveToStorage();
      renderLedgerTable();
      renderDashboard();
      showToast("ลบรายการบัญชีเล่นมวยสำเร็จ!");
    });
  });
}

// D. Render 13 Channel Cards & inline name editor
function renderChannels() {
  const container = document.getElementById('channels-cards-container');
  container.innerHTML = '';

  ledgerState.channels.forEach(ch => {
    // Calculate stats for this specific channel
    let totalGross = 0;
    let totalComm = 0;
    let totalNet = 0;
    let pendingTransfers = 0;

    ledgerState.transactions.forEach(t => {
      if (t.channelId === ch.id) {
        totalGross += t.gross;
        totalNet += t.net;
        totalComm += t.gross > 0 ? t.gross * (t.commPct / 100) : 0;
        
        if (!t.isTransferred) {
          pendingTransfers += t.net;
        }
      }
    });

    const card = document.createElement('div');
    card.className = 'channel-card';
    card.innerHTML = `
      <div class="channel-card-header">
        <div class="channel-num-badge">${ch.id}</div>
        <div class="channel-card-name" contenteditable="true" data-id="${ch.id}" title="คลิกเพื่อแก้ไขชื่อสายมวย">${ch.name}</div>
        <span style="font-size:0.75rem;">✏️</span>
      </div>
      <div class="channel-stats-row">
        <span>ยอดได้เสียสุทธิ:</span>
        <span style="color:${totalNet >= 0 ? 'var(--profit-color)' : 'var(--loss-color)'}">${totalNet >= 0 ? '+' : ''}${totalNet.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row">
        <span>โดนหักคอมสะสม:</span>
        <span style="color:var(--loss-color)">-${totalComm.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row" style="border-top:1px dashed var(--border-color); margin-top:6px; padding-top:6px;">
        <span>ค้างโอนสะสม:</span>
        <span style="color:${pendingTransfers > 0 ? 'var(--pending-color)' : pendingTransfers < 0 ? 'var(--loss-color)' : 'var(--muted)'}">${pendingTransfers.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed var(--border-color);">
        <span>ค่าคอมปกติ:</span>
        <select class="select-channel-comm" data-id="${ch.id}" style="background:#f1f5f9; border:1px solid var(--border-color); border-radius:4px; padding:2px 6px; font-family:var(--font-th); font-size:0.75rem; color:var(--primary); cursor:pointer; outline:none;">
          <option value="0" ${ch.defaultComm === 0 ? 'selected' : ''}>0%</option>
          <option value="1" ${ch.defaultComm === 1 ? 'selected' : ''}>1%</option>
          <option value="2" ${ch.defaultComm === 2 ? 'selected' : ''}>2%</option>
          <option value="3" ${ch.defaultComm === 3 ? 'selected' : ''}>3%</option>
          <option value="5" ${ch.defaultComm === 5 ? 'selected' : ''}>5%</option>
          <option value="7" ${ch.defaultComm === 7 ? 'selected' : ''}>7%</option>
          <option value="10" ${ch.defaultComm === 10 ? 'selected' : ''}>10%</option>
          <option value="15" ${ch.defaultComm === 15 ? 'selected' : ''}>15%</option>
          <option value="20" ${ch.defaultComm === 20 ? 'selected' : ''}>20%</option>
        </select>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach inline name editor listener
  document.querySelectorAll('.channel-card-name').forEach(el => {
    el.addEventListener('blur', (e) => {
      const id = parseInt(e.target.dataset.id);
      const newName = e.target.innerText.trim();
      
      const ch = ledgerState.channels.find(c => c.id === id);
      if (ch && newName) {
        ch.name = newName;
        saveToStorage();
        updateChannelDropdown(); // Keep select updated
        showToast(`บันทึกชื่อช่องทางที่ ${id} ใหม่แล้ว!`);
      }
    });

    // Handle enter key to blur
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    });
  });

  // Attach channel default commission select listener
  document.querySelectorAll('.select-channel-comm').forEach(el => {
    el.addEventListener('change', (e) => {
      sounds.playClick();
      const id = parseInt(e.target.dataset.id);
      const newComm = parseFloat(e.target.value);
      
      const ch = ledgerState.channels.find(c => c.id === id);
      if (ch) {
        ch.defaultComm = newComm;
        saveToStorage();
        showToast(`บันทึกค่าคอมเริ่มต้นสาย ${ch.name} เป็น ${newComm}% แล้ว!`);
      }
    });
  });
}

// E. Update dropdown menus with custom channel names
function updateChannelDropdown() {
  const formsSelect = document.getElementById('bet-channel');
  const savedVal = formsSelect.value;
  formsSelect.innerHTML = '<option value="" disabled selected>-- เลือกช่องทาง --</option>';

  const filterSelect = document.getElementById('filter-ledger-channel');
  const savedFilterVal = filterSelect.value;
  filterSelect.innerHTML = '<option value="all">กรอง: ทุกช่องทาง</option>';

  ledgerState.channels.forEach(ch => {
    // Form Select options
    const opt = document.createElement('option');
    opt.value = ch.id;
    opt.innerText = `${ch.id}. ${ch.name}`;
    formsSelect.appendChild(opt);

    // Filter select options
    const filterOpt = document.createElement('option');
    filterOpt.value = ch.id;
    filterOpt.innerText = `${ch.id}. ${ch.name}`;
    filterSelect.appendChild(filterOpt);
  });

  if (savedVal) formsSelect.value = savedVal;
  if (savedFilterVal) filterSelect.value = savedFilterVal;
}

// F. Render Periodic summaries (Daily, Weekly, Monthly)
function renderPeriodSummaries() {
  const container = document.getElementById('summary-cards-container');
  container.innerHTML = '';

  const range = ledgerState.summaryRange; // daily, weekly, monthly
  const groups = {};

  ledgerState.transactions.forEach(t => {
    let key = '';
    let label = '';
    
    if (range === 'daily') {
      key = t.date;
      const dObj = new Date(t.date);
      label = dObj.toLocaleDateString('th-TH', {day: 'numeric', month: 'long', year: 'numeric'});
    } else if (range === 'weekly') {
      key = getWeekRangeString(t.date);
      label = key;
    } else { // monthly
      key = getMonthString(t.date);
      label = key;
    }

    if (!groups[key]) {
      groups[key] = {
        label: label,
        grossProfit: 0,
        grossLoss: 0,
        comm: 0,
        net: 0,
        pending: 0,
        settled: 0,
        entriesCount: 0
      };
    }

    groups[key].entriesCount++;
    groups[key].net += t.net;
    groups[key].comm += t.gross > 0 ? t.gross * (t.commPct / 100) : 0;
    
    if (t.gross > 0) groups[key].grossProfit += t.gross;
    else groups[key].grossLoss += t.gross;

    if (t.isTransferred) {
      groups[key].settled += t.net;
    } else {
      groups[key].pending += t.net;
    }
  });

  // Sort groups by date/week range descending
  const sortedKeys = Object.keys(groups).sort((a,b) => {
    // If range is daily or monthly, we can parse or estimate dates
    if (range === 'daily') return new Date(b) - new Date(a);
    return b.localeCompare(a); // Alphabetic sorting as fallback
  });

  if (sortedKeys.length === 0) {
    container.innerHTML = `<p style="grid-column: span 3; text-align:center; color:var(--muted); padding:40px;">ไม่มีข้อมูลบัญชีมวยในการสรุปผล</p>`;
    return;
  }

  sortedKeys.forEach(key => {
    const g = groups[key];
    const card = document.createElement('div');
    card.className = 'summary-period-card';

    const netClass = g.net >= 0 ? 'text-profit' : 'text-loss';
    const netText = g.net >= 0 ? `+${g.net.toLocaleString()}` : g.net.toLocaleString();

    card.innerHTML = `
      <div class="summary-period-header">
        <span>${g.label}</span>
        <span style="font-size:0.7rem; font-weight:normal; color:var(--muted)">(${g.entriesCount} รายการ)</span>
      </div>
      <div class="channel-stats-row">
        <span>ยอดได้รวม (บวก):</span>
        <span class="text-profit">+${g.grossProfit.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row">
        <span>ยอดเสียรวม (ลบ):</span>
        <span class="text-loss">${g.grossLoss.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row">
        <span>หักคอมมิชชั่นสะสม:</span>
        <span style="color:var(--loss-color)">-${g.comm.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row">
        <span>โอนจ่ายเคลียร์แล้ว:</span>
        <span style="color:var(--transferred-color)">${g.settled.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row">
        <span>ยังค้างโอนสะสม:</span>
        <span style="color:${g.pending > 0 ? 'var(--pending-color)' : g.pending < 0 ? 'var(--loss-color)' : 'var(--muted)'}">${g.pending.toLocaleString()}</span>
      </div>
      <div class="channel-stats-row" style="border-top:1px solid var(--border-color); margin-top:10px; padding-top:10px; font-weight:700;">
        <span>ยอดได้เสียสุทธิ:</span>
        <span class="${netClass}">${netText} THB</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Function to sync sound buttons state (Desktop & Mobile)
function updateSoundButtonsUI(isSound) {
  const soundBtn = document.getElementById('btn-audio-toggle');
  const soundBtnMobile = document.getElementById('btn-audio-toggle-mobile');
  
  if (soundBtn) {
    if (isSound) {
      soundBtn.classList.add('active');
      soundBtn.innerHTML = '<span>🔔 เสียงสังเคราะห์: เปิด</span>';
    } else {
      soundBtn.classList.remove('active');
      soundBtn.innerHTML = '<span>🔕 ปิดเสียงเงียบ</span>';
    }
  }
  
  if (soundBtnMobile) {
    if (isSound) {
      soundBtnMobile.classList.remove('muted');
      soundBtnMobile.innerHTML = '🔔';
    } else {
      soundBtnMobile.classList.add('muted');
      soundBtnMobile.innerHTML = '🔕';
    }
  }
}

// --- 6. Event Listeners & Hooks Binding ---
window.addEventListener('load', () => {
  // Load state
  loadFromStorage();
  
  // Set default Date to today
  document.getElementById('bet-date').value = new Date().toISOString().split('T')[0];

  // Render initial panels
  updateChannelDropdown();

  // Auto-populate commission rate when selecting channel in transaction form
  document.getElementById('bet-channel').addEventListener('change', (e) => {
    const chId = parseInt(e.target.value);
    const ch = ledgerState.channels.find(c => c.id === chId);
    if (ch) {
      document.getElementById('bet-comm-pct').value = ch.defaultComm;
    }
  });
  renderDashboard();
  renderLedgerTable();
  renderChannels();
  renderPeriodSummaries();

  // Tab switching links click
  document.querySelectorAll('.nav-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      sounds.playClick();
      
      // Update sidebar highlight
      document.querySelectorAll('.nav-menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Show tab content
      const tabName = item.dataset.tab;
      document.querySelectorAll('.panel-section').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${tabName}`).classList.add('active');

      // Update Page titles
      const tabTitles = {
        dashboard: 'แดชบอร์ดสรุปรายรับ-รายจ่ายมวย',
        ledger: 'บันทึกรายการบัญชีการเงินมวย',
        channels: 'ข้อมูลสรุปแยกรายค่ายมวย (13 สาย)',
        summaries: 'สรุปงบการเงินรายคาบ'
      };
      document.getElementById('current-page-title').innerText = tabTitles[tabName] || 'สมุดบัญชีมวย';

      // Refresh data
      if (tabName === 'dashboard') renderDashboard();
      else if (tabName === 'ledger') renderLedgerTable();
      else if (tabName === 'channels') renderChannels();
      else if (tabName === 'summaries') renderPeriodSummaries();
    });
  });

  // Initial sync of sound buttons
  updateSoundButtonsUI(sounds.enabled);

  // Sound Synth toggle click (Desktop & Mobile sync)
  const toggleSoundFunc = () => {
    const isSound = sounds.toggle();
    updateSoundButtonsUI(isSound);
    if (isSound) {
      sounds.playSaveChime();
    }
  };

  const soundBtn = document.getElementById('btn-audio-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', toggleSoundFunc);
  }

  const soundBtnMobile = document.getElementById('btn-audio-toggle-mobile');
  if (soundBtnMobile) {
    soundBtnMobile.addEventListener('click', toggleSoundFunc);
  }

  // Add Bet Entry submit
  document.getElementById('form-add-bet').addEventListener('submit', (e) => {
    e.preventDefault();
    sounds.playSaveChime();

    const date = document.getElementById('bet-date').value;
    const channelId = parseInt(document.getElementById('bet-channel').value);
    const gross = parseFloat(document.getElementById('bet-amount').value);
    const commPct = parseFloat(document.getElementById('bet-comm-pct').value);
    const isTransferred = document.getElementById('bet-is-transferred').checked;

    if (isNaN(channelId)) {
      alert("กรุณาเลือกช่องทางการเงิน!");
      return;
    }

    // Commission only applies on POSITIVE gross earnings
    const commission = gross > 0 ? gross * (commPct / 100) : 0;
    const net = gross - commission;

    ledgerState.transactions.push({
      id: 't-' + Date.now(),
      date,
      channelId,
      gross,
      commPct,
      net,
      isTransferred
    });

    saveToStorage();
    renderDashboard();
    renderLedgerTable();
    showToast("บันทึกรายการรายรับ-รายจ่ายมวยสำเร็จ!");

    // Reset Form (keep date and commission percent as defaults)
    document.getElementById('bet-amount').value = '';
    document.getElementById('bet-is-transferred').checked = false;
    document.getElementById('status-toggle-text').innerText = '🔴 ยังไม่โอน (Pending Transfer)';
    document.getElementById('bet-status-toggle').style.borderColor = 'var(--border-color)';
    document.getElementById('bet-status-toggle').style.background = '#f8fafc';
  });

  // Transaction form status toggle style synchronization
  const statusToggle = document.getElementById('bet-status-toggle');
  const statusCheckbox = document.getElementById('bet-is-transferred');
  
  // Make the wrapper wrapper clickable
  statusToggle.addEventListener('click', (e) => {
    if (e.target !== statusCheckbox) {
      sounds.playClick();
      statusCheckbox.checked = !statusCheckbox.checked;
    }
    updateStatusToggleVisuals();
  });

  statusCheckbox.addEventListener('change', () => {
    updateStatusToggleVisuals();
  });

  function updateStatusToggleVisuals() {
    const labelText = document.getElementById('status-toggle-text');
    if (statusCheckbox.checked) {
      labelText.innerText = '🟢 โอนเคลียร์เรียบร้อย (Settled)';
      statusToggle.style.borderColor = 'var(--transferred-color)';
      statusToggle.style.backgroundColor = '#ecfdf5';
    } else {
      labelText.innerText = '🔴 ยังไม่โอน (Pending Transfer)';
      statusToggle.style.borderColor = 'var(--border-color)';
      statusToggle.style.backgroundColor = '#f8fafc';
    }
  }

  // Summary ranges filters
  document.querySelectorAll('.summary-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sounds.playClick();
      document.querySelectorAll('.summary-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      ledgerState.summaryRange = btn.dataset.range;
      renderPeriodSummaries();
    });
  });

  // Bookkeeping Ledger filter binds
  document.getElementById('filter-ledger-channel').addEventListener('change', renderLedgerTable);
  document.getElementById('filter-ledger-status').addEventListener('change', renderLedgerTable);
  document.getElementById('filter-ledger-date').addEventListener('change', renderLedgerTable);

  // Reset channel names back to default
  document.getElementById('btn-reset-channels-names').addEventListener('click', () => {
    if (confirm("ยืนยันรีเซ็ตชื่อช่องทางทั้ง 13 ช่องทางกลับเป็นค่าเริ่มต้นหรือไม่?")) {
      sounds.playDeleteSwoosh();
      
      const defaultNames = [
        'ช่องทางมวย 1 (สายด่วน)',
        'ช่องทางมวย 2 (สายเฮียเล้ง)',
        'ช่องทางมวย 3 (เว็บมวยไทย A)',
        'ช่องทางมวย 4 (ตู้น้ำมวยสด)',
        'ช่องทางมวย 5 (สายเสี่ยดำ)',
        'ช่องทางมวย 6 (เว็บแทงมวย B)',
        'ช่องทางมวย 7 (โต๊ะมวยเขากิเลน)',
        'ช่องทางมวย 8 (สายพี่รุ่ง)',
        'ช่องทางมวย 9 (เว็บมวยไทย C)',
        'ช่องทางมวย 10 (สายเฮียแดง)',
        'ช่องทางมวย 11 (สายเพชรยินดี)',
        'ช่องทางมวย 12 (สายลุมพินี)',
        'ช่องทางมวย 13 (สายราชดำเนิน)'
      ];

      ledgerState.channels.forEach((ch, idx) => {
        ch.name = defaultNames[idx] || `ช่องทางมวย ${idx + 1}`;
      });

      saveToStorage();
      renderChannels();
      updateChannelDropdown();
      showToast("รีเซ็ตรายชื่อเป็นสายมวยเริ่มต้นแล้ว!");
    }
  });

  // Clear all data (Reset names + delete all transactions)
  document.getElementById('btn-clear-all-data').addEventListener('click', () => {
    if (confirm("⚠️ คุณต้องการล้างรายการยอดได้เสียและรีเซ็ตชื่อช่องทางทั้งหมดใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)")) {
      sounds.playDeleteSwoosh();
      
      // Clear transactions
      ledgerState.transactions = [];
      
      // Reset channel names to blank/simple templates
      ledgerState.channels.forEach((ch, idx) => {
        ch.name = `ช่องทางมวยที่ ${idx + 1}`;
        ch.defaultComm = 5;
      });

      saveToStorage();
      
      // Update UI panels
      renderDashboard();
      renderLedgerTable();
      renderChannels();
      renderPeriodSummaries();
      updateChannelDropdown();
      
      showToast("ล้างข้อมูลทั้งหมดในบัญชีเรียบร้อย!");
    }
  });

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered Successfully', reg.scope))
      .catch(err => console.log('Service Worker Registration Failed', err));
  }

  // Standalone / iOS Installation Tip Controller
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const installTip = document.getElementById('ios-install-tip');
  const closeInstallTipBtn = document.getElementById('btn-close-install-tip');

  // Check if tip has been closed before using localstorage
  const isTipDismissed = localStorage.getItem('IOS_INSTALL_TIP_DISMISSED') === 'true';

  if (isIOS && !isStandalone && !isTipDismissed) {
    if (installTip) installTip.style.display = 'block';
  }

  if (closeInstallTipBtn && installTip) {
    closeInstallTipBtn.addEventListener('click', () => {
      sounds.playClick();
      installTip.style.display = 'none';
      localStorage.setItem('IOS_INSTALL_TIP_DISMISSED', 'true');
    });
  }
});
