// State Management
let currentData = null;
let activeTab = 'tab-dashboard';
let activeCharts = {};
let sortState = {
  campaigns: { column: null, direction: 'desc' },
  adsets: { column: null, direction: 'desc' },
  daily: { column: 'date', direction: 'asc' }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Load Default Data or Local Storage data
  const cachedData = localStorage.getItem('fb_ads_dashboard_data');
  if (cachedData) {
    try {
      currentData = JSON.parse(cachedData);
    } catch (e) {
      console.error('Failed to parse cached data, falling back to default', e);
      currentData = DEFAULT_DASHBOARD_DATA;
    }
  } else {
    currentData = DEFAULT_DASHBOARD_DATA;
  }

  // Setup Theme
  initTheme();
  
  // Render App Components
  initDashboard();

  // Setup Event Listeners
  setupEventListeners();
  
  // Refresh Lucide Icons
  lucide.createIcons();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    document.getElementById('theme-icon').setAttribute('data-lucide', 'moon');
    document.getElementById('theme-text').innerText = 'Giao diện Tối';
  } else {
    document.body.classList.remove('light-theme');
    document.getElementById('theme-icon').setAttribute('data-lucide', 'sun');
    document.getElementById('theme-text').innerText = 'Giao diện Sáng';
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  
  const iconEl = document.getElementById('theme-icon');
  const textEl = document.getElementById('theme-text');
  
  if (isLight) {
    iconEl.setAttribute('data-lucide', 'moon');
    textEl.innerText = 'Giao diện Tối';
  } else {
    iconEl.setAttribute('data-lucide', 'sun');
    textEl.innerText = 'Giao diện Sáng';
  }
  lucide.createIcons();
  
  // Re-create charts with new theme colors
  recreateCharts();
}

// Event Listeners Setup
function setupEventListeners() {
  // Theme Toggle Button
  document.querySelector('.theme-toggle-btn').addEventListener('click', toggleTheme);

  // Tab Navigation Links
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Export Buttons
  document.getElementById('btn-export-pdf').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);

  // Search & Filter Listeners for Campaigns
  document.getElementById('camp-search').addEventListener('input', renderCampaigns);
  document.getElementById('camp-status-filter').addEventListener('change', renderCampaigns);

  // Search & Filter Listeners for Ad Sets
  document.getElementById('adset-search').addEventListener('input', renderAdSets);
  document.getElementById('adset-campaign-filter').addEventListener('change', renderAdSets);

  // Excel Drag and Drop Uploader
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('excel-file-input');

  uploadZone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleExcelFile(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    }, false);
  });

  uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleExcelFile(files[0]);
    }
  }, false);
}

// Tab Switching Logic
function switchTab(tabId) {
  activeTab = tabId;
  
  // Update Nav Active State
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Tab View Visibility
  document.querySelectorAll('.tab-view').forEach(view => {
    if (view.id === tabId) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Render or redraw elements specific to tabs
  if (tabId === 'tab-dashboard') {
    // Redraw sparklines
    setTimeout(renderSparklines, 50);
  } else if (tabId === 'tab-daily') {
    // ApexCharts needs a resize trigger when displaying from hidden state
    setTimeout(renderDailyCharts, 50);
  }
}

// Initialize and Render all data
function initDashboard() {
  renderClientInfo();
  renderKPIOverview();
  renderCampaigns();
  initAdSetCampaignDropdown();
  renderAdSets();
  renderDailyTrendsTable();
  renderInsights();
}

// Recreate Charts (called on theme change)
function recreateCharts() {
  // Destroy existing charts
  Object.keys(activeCharts).forEach(key => {
    if (activeCharts[key]) {
      activeCharts[key].destroy();
    }
  });
  activeCharts = {};

  if (activeTab === 'tab-dashboard') {
    renderSparklines();
  } else if (activeTab === 'tab-daily') {
    renderDailyCharts();
  }
}

// Formatting Utilities
function formatCurrency(val) {
  if (val === null || val === undefined) return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' ₫';
}

function formatPercent(val) {
  if (val === null || val === undefined) return '-';
  let num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
  if (isNaN(num)) return val;
  // If Excel returns percentage as 0.0184 instead of 1.84
  if (num > 0 && num < 1) num = num * 100;
  return num.toFixed(2) + '%';
}

function formatDecimal(val) {
  if (val === null || val === undefined) return '-';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
  if (isNaN(num)) return val;
  return num.toFixed(2) + 'x';
}

function formatInteger(val) {
  if (val === null || val === undefined) return '-';
  const num = typeof val === 'string' ? parseInt(val.replace(/[^0-9.-]/g, '')) : val;
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('vi-VN').format(num);
}

// Render Client & Report Info
function renderClientInfo() {
  const client = currentData.client_info;
  const report = currentData.report_info;

  // Sidebar profile
  document.getElementById('sidebar-client-name').innerText = client.name || '[Tên khách hàng]';
  document.getElementById('sidebar-report-period').innerText = report.period || 'Tháng 5/2026';

  // Client Details bar in Dashboard tab
  document.getElementById('client-name').innerText = client.name || '-';
  document.getElementById('client-id').innerText = client.id || '-';
  document.getElementById('client-contact').innerText = client.contact || '-';
  document.getElementById('client-email').innerText = client.email || '-';
  document.getElementById('client-phone').innerText = client.phone || '-';

  // Report Info bar
  document.getElementById('report-period').innerText = report.period || '-';
  document.getElementById('report-compare').innerText = report.compare || '-';
  document.getElementById('report-date').innerText = report.date || '-';
  document.getElementById('report-author').innerText = report.author || '-';
  document.getElementById('report-version').innerText = report.version || '-';
}

// Render KPI Cards and Comparison Table
function renderKPIOverview() {
  // We can fetch aggregates from comparison table or from daily trends
  const list = currentData.kpi_comparison;
  
  // Find key metrics
  const spendData = list.find(k => k.metric && k.metric.toLowerCase().includes('chi phí'));
  const revData = list.find(k => k.metric && k.metric.toLowerCase().includes('doanh thu'));
  const roasData = list.find(k => k.metric && k.metric.toLowerCase().includes('roas'));
  const cpaData = list.find(k => k.metric && k.metric.toLowerCase().includes('cpa'));
  const convData = list.find(k => k.metric && k.metric.toLowerCase().includes('chuyển đổi'));
  const ctrData = list.find(k => k.metric && k.metric.toLowerCase().includes('ctr'));
  const cpcData = list.find(k => k.metric && k.metric.toLowerCase().includes('cpc'));
  const imprData = list.find(k => k.metric && k.metric.toLowerCase().includes('impression'));

  // Update Core KPI cards
  updateKPICard('kpi-spend', spendData, formatCurrency);
  updateKPICard('kpi-revenue', revData, formatCurrency);
  updateKPICard('kpi-roas', roasData, formatDecimal);
  updateKPICard('kpi-cpa', cpaData, formatCurrency, true); // Lower is better

  // Update Secondary cards
  updateKPICard('kpi-conversions', convData, formatInteger);
  updateKPICard('kpi-ctr', ctrData, formatPercent);
  updateKPICard('kpi-cpc', cpcData, formatCurrency, true); // Lower is better
  updateKPICard('kpi-impressions', imprData, formatInteger);

  // Render Sparklines
  renderSparklines();

  // Render Highlights Card list
  const highlightsListEl = document.getElementById('highlights-list');
  highlightsListEl.innerHTML = '';
  if (currentData.highlights && currentData.highlights.length > 0) {
    currentData.highlights.forEach(h => {
      const item = document.createElement('div');
      item.className = 'highlight-item';
      item.innerHTML = `<i data-lucide="sparkles"></i> <span>${h}</span>`;
      highlightsListEl.appendChild(item);
    });
    lucide.createIcons();
  } else {
    highlightsListEl.innerHTML = '<p class="text-secondary">Không có dữ liệu nổi bật.</p>';
  }

  // Render Detailed Comparison Table
  const tableBody = document.getElementById('kpi-compare-table-body');
  tableBody.innerHTML = '';
  list.forEach(k => {
    // Determine Change Badge class
    let changeVal = parseFloat(k.change);
    let pctVal = parseFloat(k.percent_change);
    let classDelta = 'neutral';
    let icon = 'minus';
    
    // Some metrics are better when they decrease (CPA, CPC)
    const lowerIsBetter = k.metric.toLowerCase().includes('cpa') || k.metric.toLowerCase().includes('cpc');
    
    if (!isNaN(pctVal) && pctVal !== 0) {
      if (pctVal > 0) {
        classDelta = lowerIsBetter ? 'down' : 'up';
        icon = lowerIsBetter ? 'trending-down' : 'trending-up';
      } else {
        classDelta = lowerIsBetter ? 'up' : 'down';
        icon = lowerIsBetter ? 'trending-up' : 'trending-down';
      }
    }
    
    // Formatting values based on name
    let formatFn = formatInteger;
    if (k.metric.toLowerCase().includes('chi phí') || k.metric.toLowerCase().includes('doanh thu') || k.metric.toLowerCase().includes('cpa') || k.metric.toLowerCase().includes('cpc')) {
      formatFn = formatCurrency;
    } else if (k.metric.toLowerCase().includes('roas')) {
      formatFn = formatDecimal;
    } else if (k.metric.toLowerCase().includes('ctr')) {
      formatFn = formatPercent;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600;">${k.metric}</td>
      <td style="font-weight: 700; color: var(--text-primary);">${formatFn(k.current)}</td>
      <td style="color: var(--text-secondary);">${formatFn(k.previous)}</td>
      <td class="kpi-delta ${classDelta}">
        <i data-lucide="${icon}"></i> 
        ${!isNaN(pctVal) ? (pctVal * 100).toFixed(1) + '%' : k.change || '-'}
      </td>
      <td>
        <span class="badge ${k.evaluation.includes('tốt') || k.evaluation.includes('Giảm') || k.evaluation.includes('Cải thiện') ? 'badge-active' : k.evaluation.includes('kiểm soát') || k.evaluation.includes('tối ưu') ? 'badge-paused' : 'badge-neutral'}">
          ${k.evaluation}
        </span>
      </td>
    `;
    tableBody.appendChild(tr);
  });
  lucide.createIcons();
}

function updateKPICard(cardId, data, formatFn, lowerIsBetter = false) {
  if (!data) return;
  const card = document.getElementById(cardId);
  if (!card) return;

  card.querySelector('.kpi-value').innerText = formatFn(data.current);
  
  const pctVal = parseFloat(data.percent_change);
  const deltaContainer = card.querySelector('.kpi-delta');
  
  // Reset classes
  deltaContainer.classList.remove('up', 'down', 'neutral');
  
  let classDelta = 'neutral';
  let icon = 'minus';
  
  if (!isNaN(pctVal) && pctVal !== 0) {
    if (pctVal > 0) {
      classDelta = lowerIsBetter ? 'down' : 'up';
      icon = lowerIsBetter ? 'trending-down' : 'trending-up';
    } else {
      classDelta = lowerIsBetter ? 'up' : 'down';
      icon = lowerIsBetter ? 'trending-up' : 'trending-down';
    }
    deltaContainer.innerText = '';
    deltaContainer.innerHTML = `<i data-lucide="${icon}"></i> ${(pctVal * 100).toFixed(1)}%`;
  } else {
    deltaContainer.innerText = '-';
  }
  
  deltaContainer.classList.add(classDelta);
}

// Sparklines Rendering (Mini charts inside KPI cards)
function renderSparklines() {
  const dailyData = currentData.daily_trends || [];
  if (dailyData.length === 0) return;

  // Extract arrays for sparklines
  const costs = dailyData.map(d => parseFloat(d.cost) || 0);
  const revenues = dailyData.map(d => parseFloat(d.revenue) || 0);
  const roas = dailyData.map(d => parseFloat(d.roas) || 0);
  const cpa = dailyData.map(d => parseFloat(d.cpa) || 0);
  const dates = dailyData.map(d => d.date);

  const themeMode = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  const strokeColor = themeMode === 'light' ? '#3b82f6' : '#60a5fa';

  const sparklineOptions = {
    chart: {
      type: 'area',
      height: 40,
      sparkline: { enabled: true },
      animations: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: { opacity: 0.1 },
    tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } } },
    colors: [strokeColor]
  };

  // Spend Sparkline
  createSparkline('sparkline-spend', dates, costs, sparklineOptions, formatCurrency);
  // Revenue Sparkline
  createSparkline('sparkline-revenue', dates, revenues, sparklineOptions, formatCurrency);
  // ROAS Sparkline
  createSparkline('sparkline-roas', dates, roas, sparklineOptions, formatDecimal);
  // CPA Sparkline
  createSparkline('sparkline-cpa', dates, cpa, sparklineOptions, formatCurrency);
}

function createSparkline(containerId, categories, data, baseOptions, formatFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  
  // Clear container
  el.innerHTML = '';

  const options = {
    ...baseOptions,
    series: [{ data: data }],
    xaxis: { categories: categories },
    tooltip: {
      y: {
        formatter: (val) => formatFn(val)
      }
    }
  };

  const chart = new ApexCharts(el, options);
  chart.render();
  activeCharts[containerId] = chart;
}

// Render Campaigns Tab
function renderCampaigns() {
  const searchTerm = document.getElementById('camp-search').value.toLowerCase();
  const statusFilter = document.getElementById('camp-status-filter').value;
  
  let list = [...currentData.campaigns];

  // Filtering
  list = list.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm) || (c.notes && c.notes.toLowerCase().includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && c.status.includes('chạy')) || (statusFilter === 'paused' && c.status.includes('dừng'));
    return matchesSearch && matchesStatus;
  });

  // Sorting
  const sortCol = sortState.campaigns.column;
  const sortDir = sortState.campaigns.direction;
  if (sortCol) {
    list.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      
      // Parse numeric values
      if (['cost', 'revenue', 'roas', 'conversions', 'cpa', 'ctr', 'cpc', 'budget'].includes(sortCol)) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Update sorting indicators on headers
  updateSortHeaders('camp-table-headers', sortState.campaigns);

  // Render Table
  const tableBody = document.getElementById('camp-table-body');
  tableBody.innerHTML = '';

  let totalCost = 0;
  let totalRevenue = 0;
  let totalConversions = 0;
  let totalImpr = 0;

  list.forEach(c => {
    const cost = parseFloat(c.cost) || 0;
    const rev = parseFloat(c.revenue) || 0;
    const conv = parseInt(c.conversions) || 0;
    const impr = parseInt(c.impressions) || 0;

    totalCost += cost;
    totalRevenue += rev;
    totalConversions += conv;
    totalImpr += impr;

    // ROAS Progress Fill
    const roas = parseFloat(c.roas) || 0;
    const roasPct = Math.min((roas / 6) * 100, 100); // Scale relative to 6.0 ROAS max

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.stt}</td>
      <td style="font-weight: 700; white-space: normal; min-width: 200px;">${c.name}</td>
      <td>
        <span class="badge ${c.status.includes('chạy') ? 'badge-active' : 'badge-paused'}">
          <i class="dot-indicator"></i> ${c.status}
        </span>
      </td>
      <td style="font-weight: 600;">${formatCurrency(c.cost)}</td>
      <td style="font-weight: 600;">${formatCurrency(c.revenue)}</td>
      <td>
        <div class="progress-bar-container">
          <span style="font-weight: 700; min-width: 32px;">${formatDecimal(c.roas)}</span>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${roasPct}%;"></div>
          </div>
        </div>
      </td>
      <td style="font-weight: 600;">${formatInteger(c.conversions)}</td>
      <td>${formatCurrency(c.cpa)}</td>
      <td>${formatInteger(c.impressions)}</td>
      <td>${formatPercent(c.ctr)}</td>
      <td>${formatCurrency(c.cpc)}</td>
      <td>${formatCurrency(c.budget)}</td>
      <td style="white-space: normal; max-width: 200px; color: var(--text-secondary);">${c.notes || '-'}</td>
    `;
    tableBody.appendChild(tr);
  });

  // Render Totals Row
  if (list.length > 0) {
    const avgROAS = totalCost > 0 ? totalRevenue / totalCost : 0;
    const avgCPA = totalConversions > 0 ? totalCost / totalConversions : 0;
    const avgCTR = totalImpr > 0 ? (totalCost / 18500) / totalImpr : 0; // rough representation or standard average
    
    const trTotal = document.createElement('tr');
    trTotal.className = 'row-total';
    trTotal.innerHTML = `
      <td></td>
      <td>TỔNG CỘNG</td>
      <td></td>
      <td>${formatCurrency(totalCost)}</td>
      <td>${formatCurrency(totalRevenue)}</td>
      <td>
        <div class="progress-bar-container">
          <span style="font-weight: 700;">${formatDecimal(avgROAS)}</span>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.min((avgROAS / 6) * 100, 100)}%;"></div>
          </div>
        </div>
      </td>
      <td>${formatInteger(totalConversions)}</td>
      <td>${formatCurrency(avgCPA)}</td>
      <td>${formatInteger(totalImpr)}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    `;
    tableBody.appendChild(trTotal);
  } else {
    tableBody.innerHTML = '<tr><td colspan="13" style="text-align: center; padding: 30px; color: var(--text-muted);">Không tìm thấy chiến dịch phù hợp.</td></tr>';
  }
}

// Handle sorting triggers on table headers
function handleSort(tableKey, column) {
  if (sortState[tableKey].column === column) {
    // Toggle direction
    sortState[tableKey].direction = sortState[tableKey].direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortState[tableKey].column = column;
    sortState[tableKey].direction = 'desc'; // Default to desc for metrics
  }

  if (tableKey === 'campaigns') {
    renderCampaigns();
  } else if (tableKey === 'adsets') {
    renderAdSets();
  } else if (tableKey === 'daily') {
    renderDailyTrendsTable();
  }
}

function updateSortHeaders(headerRowId, currentSort) {
  const tr = document.getElementById(headerRowId);
  if (!tr) return;
  
  tr.querySelectorAll('th[data-col]').forEach(th => {
    const col = th.getAttribute('data-col');
    // Remove existing icon
    const existingIcon = th.querySelector('.sort-icon');
    if (existingIcon) existingIcon.remove();

    if (col === currentSort.column) {
      const iconName = currentSort.direction === 'asc' ? 'chevron-up' : 'chevron-down';
      const icon = document.createElement('i');
      icon.className = 'sort-icon';
      icon.setAttribute('data-lucide', iconName);
      th.appendChild(icon);
    }
  });
  lucide.createIcons();
}

// Populate Campaign Dropdown Filter in Ad Set view
function initAdSetCampaignDropdown() {
  const dropdown = document.getElementById('adset-campaign-filter');
  dropdown.innerHTML = '<option value="all">Tất cả chiến dịch</option>';
  
  // Extract unique campaign names
  const camps = [...new Set(currentData.adsets.map(a => a.campaign).filter(Boolean))];
  camps.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.innerText = c;
    dropdown.appendChild(opt);
  });
}

// Render Ad Set Tab
function renderAdSets() {
  const searchTerm = document.getElementById('adset-search').value.toLowerCase();
  const campFilter = document.getElementById('adset-campaign-filter').value;
  
  let list = [...currentData.adsets];

  // Filtering
  list = list.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm) || (a.notes && a.notes.toLowerCase().includes(searchTerm));
    const matchesCamp = campFilter === 'all' || a.campaign === campFilter;
    return matchesSearch && matchesCamp;
  });

  // Sorting
  const sortCol = sortState.adsets.column;
  const sortDir = sortState.adsets.direction;
  if (sortCol) {
    list.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      
      if (['cost', 'revenue', 'roas', 'conversions', 'cpa', 'ctr', 'cpc', 'impressions'].includes(sortCol)) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  updateSortHeaders('adset-table-headers', sortState.adsets);

  const tableBody = document.getElementById('adset-table-body');
  tableBody.innerHTML = '';

  let totalCost = 0;
  let totalRevenue = 0;
  let totalConversions = 0;
  let totalImpr = 0;

  list.forEach(a => {
    const cost = parseFloat(a.cost) || 0;
    const rev = parseFloat(a.revenue) || 0;
    const conv = parseInt(a.conversions) || 0;
    const impr = parseInt(a.impressions) || 0;

    totalCost += cost;
    totalRevenue += rev;
    totalConversions += conv;
    totalImpr += impr;

    const roas = parseFloat(a.roas) || 0;
    const roasPct = Math.min((roas / 6) * 100, 100);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.stt}</td>
      <td style="font-weight: 700; white-space: normal; min-width: 180px;">${a.name}</td>
      <td style="color: var(--text-secondary); white-space: normal; min-width: 150px;">${a.campaign}</td>
      <td style="font-weight: 600;">${formatCurrency(a.cost)}</td>
      <td style="font-weight: 600;">${formatCurrency(a.revenue)}</td>
      <td>
        <div class="progress-bar-container">
          <span style="font-weight: 700; min-width: 32px;">${formatDecimal(a.roas)}</span>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${roasPct}%;"></div>
          </div>
        </div>
      </td>
      <td style="font-weight: 600;">${formatInteger(a.conversions)}</td>
      <td>${formatCurrency(a.cpa)}</td>
      <td>${formatPercent(a.ctr)}</td>
      <td>${formatCurrency(a.cpc)}</td>
      <td>${formatInteger(a.impressions)}</td>
      <td style="white-space: normal; max-width: 150px; color: var(--text-muted);">${a.notes || '-'}</td>
    `;
    tableBody.appendChild(tr);
  });

  if (list.length > 0) {
    const avgROAS = totalCost > 0 ? totalRevenue / totalCost : 0;
    const avgCPA = totalConversions > 0 ? totalCost / totalConversions : 0;
    
    const trTotal = document.createElement('tr');
    trTotal.className = 'row-total';
    trTotal.innerHTML = `
      <td></td>
      <td>TỔNG CỘNG</td>
      <td></td>
      <td>${formatCurrency(totalCost)}</td>
      <td>${formatCurrency(totalRevenue)}</td>
      <td>
        <div class="progress-bar-container">
          <span style="font-weight: 700;">${formatDecimal(avgROAS)}</span>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.min((avgROAS / 6) * 100, 100)}%;"></div>
          </div>
        </div>
      </td>
      <td>${formatInteger(totalConversions)}</td>
      <td>${formatCurrency(avgCPA)}</td>
      <td>-</td>
      <td>-</td>
      <td>${formatInteger(totalImpr)}</td>
      <td></td>
    `;
    tableBody.appendChild(trTotal);
  } else {
    tableBody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 30px; color: var(--text-muted);">Không tìm thấy Ad Set phù hợp.</td></tr>';
  }
}

// Render Daily Trends Tab (Charts & Table)
function renderDailyCharts() {
  const dailyData = [...currentData.daily_trends] || [];
  if (dailyData.length === 0) return;

  const dates = dailyData.map(d => d.date);
  const costs = dailyData.map(d => parseFloat(d.cost) || 0);
  const revenues = dailyData.map(d => parseFloat(d.revenue) || 0);
  const roas = dailyData.map(d => parseFloat(d.roas) || 0);
  const cpa = dailyData.map(d => parseFloat(d.cpa) || 0);
  const conversions = dailyData.map(d => parseInt(d.conversions) || 0);

  const themeMode = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  const gridColor = themeMode === 'light' ? '#f1f5f9' : '#1e293b';
  const textColor = themeMode === 'light' ? '#475569' : '#94a3b8';

  // 1. Spend vs Revenue Chart
  const elCostRev = document.getElementById('chart-cost-revenue');
  if (elCostRev) {
    elCostRev.innerHTML = '';
    const optionsCostRev = {
      series: [
        { name: 'Doanh Thu', type: 'area', data: revenues },
        { name: 'Chi Phí', type: 'area', data: costs }
      ],
      chart: {
        height: 350,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: textColor
      },
      colors: ['#10b981', '#3b82f6'],
      stroke: { curve: 'smooth', width: [3, 3] },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: [0.35, 0.2],
          opacityTo: [0.05, 0.02],
          stops: [0, 90, 100]
        }
      },
      grid: { borderColor: gridColor, strokeDashArray: 4 },
      xaxis: {
        categories: dates,
        labels: {
          rotate: -45,
          style: { fontSize: '10px' }
        }
      },
      yaxis: [
        {
          title: { text: 'Doanh Thu (VND)' },
          labels: {
            formatter: (val) => formatCurrency(val)
          }
        },
        {
          opposite: true,
          title: { text: 'Chi Phí (VND)' },
          labels: {
            formatter: (val) => formatCurrency(val)
          }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val) => formatCurrency(val)
        }
      },
      legend: { position: 'top', horizontalAlign: 'right' }
    };
    const chart = new ApexCharts(elCostRev, optionsCostRev);
    chart.render();
    activeCharts['chart-cost-revenue'] = chart;
  }

  // 2. ROAS & CPA Chart
  const elRoasCpa = document.getElementById('chart-roas-cpa');
  if (elRoasCpa) {
    elRoasCpa.innerHTML = '';
    const optionsRoasCpa = {
      series: [
        { name: 'ROAS', type: 'line', data: roas },
        { name: 'CPA', type: 'line', data: cpa }
      ],
      chart: {
        height: 350,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: textColor
      },
      colors: ['#f59e0b', '#ef4444'],
      stroke: { curve: 'smooth', width: [3, 3] },
      grid: { borderColor: gridColor, strokeDashArray: 4 },
      xaxis: {
        categories: dates,
        labels: {
          rotate: -45,
          style: { fontSize: '10px' }
        }
      },
      yaxis: [
        {
          title: { text: 'ROAS (x)' },
          labels: {
            formatter: (val) => formatDecimal(val)
          }
        },
        {
          opposite: true,
          title: { text: 'CPA (VND)' },
          labels: {
            formatter: (val) => formatCurrency(val)
          }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        y: [
          { formatter: (val) => formatDecimal(val) },
          { formatter: (val) => formatCurrency(val) }
        ]
      },
      legend: { position: 'top', horizontalAlign: 'right' }
    };
    const chart = new ApexCharts(elRoasCpa, optionsRoasCpa);
    chart.render();
    activeCharts['chart-roas-cpa'] = chart;
  }
}

// Render Daily Trends Table
function renderDailyTrendsTable() {
  let list = [...currentData.daily_trends] || [];

  // Sorting
  const sortCol = sortState.daily.column;
  const sortDir = sortState.daily.direction;
  if (sortCol) {
    list.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      
      if (['cost', 'revenue', 'roas', 'conversions', 'ctr', 'cpc', 'impressions', 'cpa'].includes(sortCol)) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (sortCol === 'date') {
        // Date compare (05/01/2026 format)
        // convert to simple comparable string if formatted standardly
        valA = String(valA).split('/').reverse().join('');
        valB = String(valB).split('/').reverse().join('');
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  updateSortHeaders('daily-table-headers', sortState.daily);

  const tableBody = document.getElementById('daily-table-body');
  tableBody.innerHTML = '';

  let totalCost = 0;
  let totalRevenue = 0;
  let totalConversions = 0;
  let totalImpr = 0;

  list.forEach(d => {
    const cost = parseFloat(d.cost) || 0;
    const rev = parseFloat(d.revenue) || 0;
    const conv = parseInt(d.conversions) || 0;
    const impr = parseInt(d.impressions) || 0;

    totalCost += cost;
    totalRevenue += rev;
    totalConversions += conv;
    totalImpr += impr;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 700;">${d.date}</td>
      <td style="font-weight: 600;">${formatCurrency(d.cost)}</td>
      <td style="font-weight: 600;">${formatCurrency(d.revenue)}</td>
      <td style="font-weight: 700; color: var(--primary-color);">${formatDecimal(d.roas)}</td>
      <td>${formatInteger(d.conversions)}</td>
      <td>${formatPercent(d.ctr)}</td>
      <td>${formatCurrency(d.cpc)}</td>
      <td>${formatInteger(d.impressions)}</td>
      <td style="font-weight: 600;">${formatCurrency(d.cpa)}</td>
      <td style="color: var(--text-secondary); max-width: 150px; white-space: normal;">${d.notes || '-'}</td>
    `;
    tableBody.appendChild(tr);
  });

  if (list.length > 0) {
    const avgROAS = totalCost > 0 ? totalRevenue / totalCost : 0;
    const avgCPA = totalConversions > 0 ? totalCost / totalConversions : 0;

    const trTotal = document.createElement('tr');
    trTotal.className = 'row-total';
    trTotal.innerHTML = `
      <td>TỔNG CỘNG</td>
      <td>${formatCurrency(totalCost)}</td>
      <td>${formatCurrency(totalRevenue)}</td>
      <td>${formatDecimal(avgROAS)}</td>
      <td>${formatInteger(totalConversions)}</td>
      <td>-</td>
      <td>-</td>
      <td>${formatInteger(totalImpr)}</td>
      <td>${formatCurrency(avgCPA)}</td>
      <td></td>
    `;
    tableBody.appendChild(trTotal);
  }
}

// Render Comments & Insights Tab
function renderInsights() {
  const comm = currentData.comments;
  
  // Strengths
  const strengthsEl = document.getElementById('insight-strengths');
  strengthsEl.innerHTML = '';
  if (comm.strengths && comm.strengths.length > 0) {
    comm.strengths.forEach(s => {
      const el = document.createElement('div');
      el.className = 'insight-bullet strength-bullet';
      el.innerHTML = `<i data-lucide="check-circle-2"></i> <span>${s}</span>`;
      strengthsEl.appendChild(el);
    });
  } else {
    strengthsEl.innerHTML = '<p class="text-secondary">Không có ghi nhận điểm mạnh.</p>';
  }

  // Weaknesses / Improvement Points
  const weaknessesEl = document.getElementById('insight-weaknesses');
  weaknessesEl.innerHTML = '';
  if (comm.weaknesses && comm.weaknesses.length > 0) {
    comm.weaknesses.forEach(w => {
      const el = document.createElement('div');
      el.className = 'insight-bullet weakness-bullet';
      el.innerHTML = `<i data-lucide="alert-triangle"></i> <span>${w}</span>`;
      weaknessesEl.appendChild(el);
    });
  } else {
    weaknessesEl.innerHTML = '<p class="text-secondary">Không có điểm cần cải thiện nào được lưu ý.</p>';
  }

  // Recommendations Checklist
  const recEl = document.getElementById('insight-recommendations');
  recEl.innerHTML = '';
  if (comm.recommendations && comm.recommendations.length > 0) {
    comm.recommendations.forEach((r, idx) => {
      // Strip starting number if exists e.g., "1. Tăng ngân sách" -> "Tăng ngân sách"
      let cleanText = r.replace(/^\d+\.\s*/, '');
      
      const item = document.createElement('div');
      item.className = 'checklist-item';
      item.innerHTML = `
        <div class="checklist-checkbox"><i data-lucide="check"></i></div>
        <div class="checklist-text">${cleanText}</div>
      `;
      
      // Checklist interactive toggle
      item.addEventListener('click', () => {
        item.classList.toggle('checked');
      });
      
      recEl.appendChild(item);
    });
  } else {
    recEl.innerHTML = '<p class="text-secondary">Không có đề xuất hành động.</p>';
  }

  // Conclusion Text
  document.getElementById('insight-conclusion').innerText = comm.conclusion || 'Tổng kết báo cáo.';

  lucide.createIcons();
}

// Display Toast Notifications
function showNotification(title, message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.backgroundColor = type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#f59e0b';
  toast.style.color = '#fff';
  toast.style.padding = '16px 24px';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
  toast.style.zIndex = '9999';
  toast.style.display = 'flex';
  toast.style.flexDirection = 'column';
  toast.style.gap = '4px';
  toast.style.animation = 'fadeIn 0.2s ease forwards';
  
  toast.innerHTML = `
    <span style="font-weight:700; font-size:0.95rem;">${title}</span>
    <span style="font-size:0.85rem; opacity:0.9;">${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.2s ease reverse forwards';
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

// Excel Import Handler using SheetJS (xlsx.full.min.js)
function handleExcelFile(file) {
  if (!file) return;
  const name = file.name;
  if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
    showNotification('Lỗi định dạng', 'Vui lòng chọn file Excel (.xlsx hoặc .xls)', 'danger');
    return;
  }

  showNotification('Đang xử lý', 'Đang đọc và phân tích file báo cáo...', 'warning');

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const parsedData = parseExcelWorkbook(workbook);
      
      // Update State
      currentData = parsedData;
      
      // Save to localStorage
      localStorage.setItem('fb_ads_dashboard_data', JSON.stringify(currentData));
      
      // Re-initialize UI
      initDashboard();
      
      // Go to dashboard tab
      switchTab('tab-dashboard');
      
      showNotification('Thành công', `Đã tải thành công dữ liệu báo cáo: ${file.name}`);
    } catch (err) {
      console.error(err);
      showNotification('Lỗi xử lý', 'Không thể đọc cấu trúc file Excel. Vui lòng kiểm tra lại định dạng file báo cáo.', 'danger');
    }
  };
  reader.readAsArrayBuffer(file);
}

// Excel Parsing Logic (Mirroring the Python Extraction logic)
function parseExcelWorkbook(workbook) {
  // Ensure required sheets are present
  const sheetNames = workbook.SheetNames;
  
  // Find sheets mapping
  const findSheet = (keywords) => {
    return sheetNames.find(name => keywords.some(k => name.toLowerCase().includes(k.toLowerCase())));
  };

  const sheetBia = findSheet(['bia', 'cover', '01_Trang_bia']);
  const sheetKpi = findSheet(['kpi', 'tong_quan', '02_Tong_quan_KPI']);
  const sheetCamp = findSheet(['chien_dich', 'campaign', '03_Hieu_suat_Chien_dich']);
  const sheetAdset = findSheet(['adset', 'ad_set', '04_Hieu_suat_AdSet']);
  const sheetDaily = findSheet(['ngay', 'daily', '05_Xu_huong_Ngay']);
  const sheetComments = findSheet(['nhan_xet', 'comment', 'recommend', '06_Nhan_xet_Khuyen_nghi']);

  if (!sheetKpi || !sheetCamp || !sheetDaily) {
    throw new Error('Missing core sheets');
  }

  // Helper to convert sheet to 2D array
  const sheetToArray = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  };

  const clean = (val) => {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    if (s === '' || s.toLowerCase() === 'nan' || s.toLowerCase() === 'null') return null;
    return val;
  };

  // 1. Parse Cover Sheet
  const client_info = {};
  const report_info = {};
  const highlights = [];
  
  if (sheetBia) {
    const rows = sheetToArray(sheetBia);
    rows.forEach((row, rIdx) => {
      const c0 = row[0];
      const c1 = row[1];
      const c5 = row[5];
      const c6 = row[6];

      if (c0 && String(c0).includes('Tên khách hàng:')) client_info.name = clean(c1);
      if (c0 && String(c0).includes('Mã khách hàng:')) client_info.id = clean(c1);
      if (c0 && String(c0).includes('Người liên hệ:')) client_info.contact = clean(c1);
      if (c0 && String(c0).includes('Email:')) client_info.email = clean(c1);
      if (c0 && String(c0).includes('Số điện thoại:')) client_info.phone = clean(c1);

      if (c5 && String(c5).includes('Khoảng thời gian:')) report_info.period = clean(c6);
      if (c5 && String(c5).includes('Kỳ so sánh:')) report_info.compare = clean(c6);
      if (c5 && String(c5).includes('Ngày lập báo cáo:')) report_info.date = clean(c6);
      if (c5 && String(c5).includes('Người lập:')) report_info.author = clean(c6);
      if (c5 && String(c5).includes('Phiên bản:')) report_info.version = clean(c6);

      // Highlights (rIdx 19 to 25)
      if (rIdx >= 19 && rIdx < 26 && c0) {
        let hText = String(c0).trim();
        if (hText.startsWith('•') || hText.startsWith('-') || hText.length > 5) {
          if (c1 && String(c1).trim() !== '') {
            hText += ' - ' + String(c1).trim();
          }
          highlights.append ? highlights.append(hText) : highlights.push(hText);
        }
      }
    });
  }

  // 2. Parse KPI Overview
  const kpi_comparison = [];
  if (sheetKpi) {
    const rows = sheetToArray(sheetKpi);
    // Find where comparison table starts. Row 19 has headers
    // Metrics starting from row 20
    for (let r = 20; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0] || String(row[0]).trim() === '') continue;
      kpi_comparison.push({
        metric: clean(row[0]),
        current: clean(row[1]),
        previous: clean(row[2]),
        change: clean(row[3]),
        percent_change: clean(row[4]),
        evaluation: clean(row[5]) || '-'
      });
    }
  }

  // 3. Parse Campaigns
  const campaigns = [];
  if (sheetCamp) {
    const rows = sheetToArray(sheetCamp);
    // Row 3 headers, Row 4 data
    for (let r = 4; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0] || String(row[0]).trim() === '') continue;
      if (String(row[1]).includes('TỔNG')) continue; // skip total row
      campaigns.push({
        stt: clean(row[0]),
        name: clean(row[1]),
        status: clean(row[2]),
        cost: clean(row[3]),
        revenue: clean(row[4]),
        roas: clean(row[5]),
        conversions: clean(row[6]),
        cpa: clean(row[7]),
        impressions: clean(row[8]),
        ctr: clean(row[9]),
        cpc: clean(row[10]),
        budget: clean(row[11]),
        notes: clean(row[12]) || ''
      });
    }
  }

  // 4. Parse Ad Sets
  const adsets = [];
  if (sheetAdset) {
    const rows = sheetToArray(sheetAdset);
    for (let r = 4; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0] || String(row[0]).trim() === '') continue;
      if (String(row[1]).includes('TỔNG')) continue;
      adsets.push({
        stt: clean(row[0]),
        name: clean(row[1]),
        campaign: clean(row[2]),
        cost: clean(row[3]),
        revenue: clean(row[4]),
        roas: clean(row[5]),
        conversions: clean(row[6]),
        cpa: clean(row[7]),
        ctr: clean(row[8]),
        cpc: clean(row[9]),
        impressions: clean(row[10]),
        notes: clean(row[11]) || ''
      });
    }
  }

  // 5. Parse Daily Trends
  const daily_trends = [];
  if (sheetDaily) {
    const rows = sheetToArray(sheetDaily);
    for (let r = 4; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0] || String(row[0]).trim() === '') continue;
      if (String(row[0]).includes('TỔNG')) continue;
      
      daily_trends.push({
        date: clean(row[0]),
        cost: clean(row[1]),
        revenue: clean(row[2]),
        roas: clean(row[3]),
        conversions: clean(row[4]),
        ctr: clean(row[5]),
        cpc: clean(row[6]),
        impressions: clean(row[7]),
        cpa: clean(row[8]),
        notes: clean(row[9]) || ''
      });
    }
  }

  // 6. Parse Comments
  const comments = { strengths: [], weaknesses: [], recommendations: [], conclusion: '' };
  if (sheetComments) {
    const rows = sheetToArray(sheetComments);
    let section = null;
    
    rows.forEach(row => {
      if (!row || !row[0]) return;
      const text = String(row[0]).trim();
      
      if (text.includes('1. ĐIỂM MẠNH TRONG KỲ')) {
        section = 'strengths';
      } else if (text.includes('2. ĐIỂM CẦN CẢI THIỆN')) {
        section = 'weaknesses';
      } else if (text.includes('3. KHUYẾN NGHỊ HÀNH ĐỘNG CỤ THỂ')) {
        section = 'recommendations';
      } else if (text.includes('4. KẾT LUẬN')) {
        section = 'conclusion';
      } else if (text.includes('Người lập báo cáo')) {
        section = null;
      } else {
        if (section === 'strengths' && (text.startsWith('•') || text.startsWith('-'))) {
          comments.strengths.push(text.replace(/^[•-\s]+/, ''));
        } else if (section === 'weaknesses' && (text.startsWith('•') || text.startsWith('-'))) {
          comments.weaknesses.push(text.replace(/^[•-\s]+/, ''));
        } else if (section === 'recommendations') {
          comments.recommendations.push(text);
        } else if (section === 'conclusion') {
          if (comments.conclusion) {
            comments.conclusion += '\n' + text;
          } else {
            comments.conclusion = text;
          }
        }
      }
    });
  }

  return {
    client_info: client_info.name ? client_info : DEFAULT_DASHBOARD_DATA.client_info,
    report_info: report_info.period ? report_info : DEFAULT_DASHBOARD_DATA.report_info,
    highlights: highlights.length > 0 ? highlights : DEFAULT_DASHBOARD_DATA.highlights,
    kpi_comparison: kpi_comparison.length > 0 ? kpi_comparison : DEFAULT_DASHBOARD_DATA.kpi_comparison,
    campaigns: campaigns.length > 0 ? campaigns : DEFAULT_DASHBOARD_DATA.campaigns,
    adsets: adsets.length > 0 ? adsets : DEFAULT_DASHBOARD_DATA.adsets,
    daily_trends: daily_trends.length > 0 ? daily_trends : DEFAULT_DASHBOARD_DATA.daily_trends,
    comments: comments.strengths.length > 0 ? comments : DEFAULT_DASHBOARD_DATA.comments
  };
}

// Export parsed/current data back to Excel
function exportToExcel() {
  try {
    const wb = XLSX.utils.book_new();
    
    // 1. Client & Report Info Sheet
    const coverData = [
      ['THÔNG TIN KHÁCH HÀNG', '', '', '', '', 'THÔNG TIN BÁO CÁO'],
      ['Tên khách hàng:', currentData.client_info.name, '', '', '', 'Khoảng thời gian:', currentData.report_info.period],
      ['Mã khách hàng:', currentData.client_info.id, '', '', '', 'Kỳ so sánh:', currentData.report_info.compare],
      ['Người liên hệ:', currentData.client_info.contact, '', '', '', 'Ngày lập báo cáo:', currentData.report_info.date],
      ['Email:', currentData.client_info.email, '', '', '', 'Người lập:', currentData.report_info.author],
      ['Số điện thoại:', currentData.client_info.phone, '', '', '', 'Phiên bản:', currentData.report_info.version],
      [],
      ['ĐIỂM NỔI BẬT TRONG KỲ']
    ];
    currentData.highlights.forEach(h => {
      coverData.push([h]);
    });
    const wsCover = XLSX.utils.aoa_to_sheet(coverData);
    XLSX.utils.book_append_sheet(wb, wsCover, '01_Trang_bia');

    // 2. KPI Overview
    const kpiHeaders = [['Chỉ số', 'Tháng hiện tại', 'Tháng so sánh', 'Thay đổi', '% Thay đổi', 'Đánh giá']];
    const kpiRows = currentData.kpi_comparison.map(k => [
      k.metric, k.current, k.previous, k.change, k.percent_change, k.evaluation
    ]);
    const wsKpi = XLSX.utils.aoa_to_sheet([...kpiHeaders, ...kpiRows]);
    XLSX.utils.book_append_sheet(wb, wsKpi, '02_Tong_quan_KPI');

    // 3. Campaigns
    const campHeaders = [['STT', 'Tên Chiến Dịch', 'Trạng Thái', 'Chi Phí (VND)', 'Doanh Thu (VND)', 'ROAS', 'Chuyển Đổi', 'CPA (VND)', 'Impressions', 'CTR (%)', 'CPC (VND)', 'Ngân Sách/Ngày', 'Ghi Chú']];
    const campRows = currentData.campaigns.map(c => [
      c.stt, c.name, c.status, c.cost, c.revenue, c.roas, c.conversions, c.cpa, c.impressions, c.ctr, c.cpc, c.budget, c.notes
    ]);
    const wsCamp = XLSX.utils.aoa_to_sheet([...campHeaders, ...campRows]);
    XLSX.utils.book_append_sheet(wb, wsCamp, '03_Hieu_suat_Chien_dich');

    // 4. Ad Sets
    const adsetHeaders = [['STT', 'Tên Ad Set', 'Chiến Dịch', 'Chi Phí', 'Doanh Thu', 'ROAS', 'Chuyển Đổi', 'CPA', 'CTR', 'CPC', 'Impressions', 'Ghi chú']];
    const adsetRows = currentData.adsets.map(a => [
      a.stt, a.name, a.campaign, a.cost, a.revenue, a.roas, a.conversions, a.cpa, a.ctr, a.cpc, a.impressions, a.notes
    ]);
    const wsAdset = XLSX.utils.aoa_to_sheet([...adsetHeaders, ...adsetRows]);
    XLSX.utils.book_append_sheet(wb, wsAdset, '04_Hieu_suat_AdSet');

    // 5. Daily Trends
    const dailyHeaders = [['Ngày', 'Chi Phí', 'Doanh Thu', 'ROAS', 'Chuyển Đổi', 'CTR', 'CPC', 'Impressions', 'CPA', 'Ghi chú']];
    const dailyRows = currentData.daily_trends.map(d => [
      d.date, d.cost, d.revenue, d.roas, d.conversions, d.ctr, d.cpc, d.impressions, d.cpa, d.notes
    ]);
    const wsDaily = XLSX.utils.aoa_to_sheet([...dailyHeaders, ...dailyRows]);
    XLSX.utils.book_append_sheet(wb, wsDaily, '05_Xu_huong_Ngay');

    // Save File
    XLSX.writeFile(wb, `Bao_cao_FBAds_Export_${Date.now()}.xlsx`);
    showNotification('Thành công', 'Đã xuất dữ liệu ra file Excel thành công!');
  } catch (err) {
    console.error(err);
    showNotification('Lỗi', 'Không thể xuất file Excel. Vui lòng thử lại.', 'danger');
  }
}
