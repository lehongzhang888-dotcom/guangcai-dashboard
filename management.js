// 广材管道 · 交付管理分析看板
var DATA = null;
var charts = [];
var nf = function(v) { return (Number(v)||0).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g,','); };
var nf0 = function(v) { return (Number(v)||0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,','); };

function initAll() {
  var d = DATA;
  var s = d.summary;

  // KPI
  document.getElementById('kpiRow').innerHTML =
    '<div class="kpi-card"><div class="kl">总金额</div><div class="kv g">'+nf0(s.total_amt)+'<span style="font-size:11px;color:#667799">万</span></div><div class="ks">'+s.total_orders+'笔订单</div></div>'+
    '<div class="kpi-card"><div class="kl">产品总数</div><div class="kv gn">'+s.total_products+'</div><div class="ks">个SKU品类</div></div>'+
    '<div class="kpi-card"><div class="kl">基地总数</div><div class="kv">'+s.total_bases+'</div><div class="ks">个发货基地</div></div>'+
    '<div class="kpi-card"><div class="kl">整体最优率</div><div class="kv '+(s.total_optimal_rate>=60?'gn':'y')+'">'+s.total_optimal_rate.toFixed(1)+'%</div><div class="ks">就近基地出货占比</div></div>'+
    '<div class="kpi-card"><div class="kl">总漏出金额</div><div class="kv r">'+nf0(s.total_leak)+'<span style="font-size:11px;color:#667799">万</span></div><div class="ks">非最优基地出货</div></div>';

  // Tabs
  var tabs = document.querySelectorAll('.tab');
  for (var ti = 0; ti < tabs.length; ti++) {
    tabs[ti].onclick = function() {
      var allTabs = document.querySelectorAll('.tab');
      for (var i = 0; i < allTabs.length; i++) allTabs[i].classList.remove('on');
      var allSec = document.querySelectorAll('.section');
      for (var i = 0; i < allSec.length; i++) allSec[i].classList.remove('on');
      this.classList.add('on');
      document.getElementById(this.dataset.t).classList.add('on');
      for (var i = 0; i < charts.length; i++) { try { charts[i].resize(); } catch(e) {} }
    };
  }

  renderTab1(d);
  renderTab2(d);
  renderTab3(d);
  renderTab4(d);
  renderTab5(d);
}

function renderTab1(d) {
  var prods = d.products;
  var catColors = {'A类·量大稳定':'#4ecdc4','B类·量大波动':'#ffd93d','C类·量小波动':'#ff6b6b','D类·中等规模':'#8899bb'};
  var cats = {};
  for (var i = 0; i < prods.length; i++) {
    var p = prods[i];
    if (!cats[p.category]) cats[p.category] = [];
    cats[p.category].push(p);
  }

  // Bubble
  var bDatasets = [];
  for (var i = 0; i < prods.length; i++) {
    var p = prods[i];
    bDatasets.push({
      label: p.product,
      data: [{x: p.avg_monthly, y: p.cv, r: Math.max(8, Math.sqrt(p.total_amt)*0.3)}],
      backgroundColor: catColors[p.category]+'88',
      borderColor: catColors[p.category],
      borderWidth: 1
    });
  }
  charts.push(new Chart(document.getElementById('bubbleChart'), {
    type: 'bubble', data: {datasets: bDatasets},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#ccd', boxWidth: 12, padding: 8, font: {size:10} } } },
      scales: {
        x: { title: { display: true, text: '月均金额(万)', color: '#8899bb' }, grid: { color: '#1a2f52' }, ticks: { color: '#8899bb' } },
        y: { title: { display: true, text: '波动性 CV(%)', color: '#8899bb' }, grid: { color: '#1a2f52' }, ticks: { color: '#8899bb' } }
      }
    }
  }));

  // Pie
  var catLabels = Object.keys(cats);
  var catData = [];
  var catBg = [];
  for (var i = 0; i < catLabels.length; i++) {
    catData.push(cats[catLabels[i]].length);
    catBg.push(catColors[catLabels[i]]);
  }
  charts.push(new Chart(document.getElementById('catPieChart'), {
    type: 'doughnut', data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: catBg, borderColor: '#112240', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#ccd', boxWidth: 12, padding: 6, font: {size:10} } } } }
  }));

  // Table
  var tbody = document.querySelector('#prodTable tbody');
  for (var i = 0; i < prods.length; i++) {
    var p = prods[i];
    var badge = p.category.indexOf('A')>=0 ? 'badge-a' : p.category.indexOf('B')>=0 ? 'badge-b' : p.category.indexOf('C')>=0 ? 'badge-c' : '';
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>'+p.product+'</td><td class="r gl">'+nf(p.total_amt)+'</td><td class="r">'+p.orders+'</td><td class="r">'+p.months_active+'</td><td class="r">'+nf(p.avg_monthly)+'</td><td class="r '+(p.cv>100?'rd':p.cv>60?'y':'g')+'">'+p.cv+'%</td><td class="r '+(p.optimal_rate>=90?'g':p.optimal_rate>=50?'y':'rd')+'">'+p.optimal_rate+'%</td><td class="r">'+nf(p.yes_amt)+' / '+nf(p.no_amt)+'</td><td><span class="badge '+badge+'">'+p.category+'</span></td>';
    tbody.appendChild(tr);
  }
}

function renderTab2(d) {
  var bases = d.bases;
  var bNames = [], bRates = [], bYes = [], bNo = [], bColors = [];
  for (var i = 0; i < bases.length; i++) {
    bNames.push(bases[i].name);
    bRates.push(bases[i].optimal_rate);
    bYes.push(bases[i].yes_amt);
    bNo.push(bases[i].no_amt);
    bColors.push(bases[i].optimal_rate >= 90 ? '#4ecdc4' : bases[i].optimal_rate >= 50 ? '#ffd93d' : '#ff6b6b');
  }
  charts.push(new Chart(document.getElementById('baseRateChart'), {
    type: 'bar', data: { labels: bNames, datasets: [{ label: '最优率 %', data: bRates, backgroundColor: bColors, borderRadius: 3 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { min: 0, max: 100, grid: { color: '#1a2f52' }, ticks: { color: '#8899bb', callback: function(v) { return v+'%'; } } }, y: { grid: { display: false }, ticks: { color: '#ccd', font: { size: 11 } } } } }
  }));
  charts.push(new Chart(document.getElementById('baseStackChart'), {
    type: 'bar', data: { labels: bNames, datasets: [{ label: '最优金额', data: bYes, backgroundColor: '#4ecdc4', borderRadius: 3 }, { label: '非最优金额', data: bNo, backgroundColor: '#ff6b6b', borderRadius: 3 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      scales: { x: { stacked: true, grid: { color: '#1a2f52' }, ticks: { color: '#8899bb', callback: function(v) { return nf0(v); } } }, y: { stacked: true, grid: { display: false }, ticks: { color: '#ccd', font: { size: 11 } } } },
      plugins: { legend: { labels: { color: '#ccd', boxWidth: 12, padding: 8 } } } }
  }));
  var tbody = document.querySelector('#baseTable tbody');
  for (var i = 0; i < bases.length; i++) {
    var b = bases[i];
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>'+b.name+'</td><td class="r gl">'+nf(b.total_amt)+'</td><td class="r">'+b.orders+'</td><td class="r '+(b.optimal_rate>=90?'g':b.optimal_rate>=50?'y':'rd')+'">'+b.optimal_rate+'%</td><td class="r">'+nf(b.yes_amt)+'</td><td class="r">'+nf(b.no_amt)+'</td><td class="r">'+(b.products||0)+'</td><td class="r">'+(b.regions||0)+'</td><td>'+(b.optimal_rate>=90?'🟢 优秀':b.optimal_rate>=70?'🟡 良好':b.optimal_rate>=50?'🟠 一般':'🔴 待改进')+'</td>';
    tbody.appendChild(tr);
  }
}

function renderTab3(d) {
  var leak = d.leakage;
  var entries = [];
  for (var k in leak) {
    if (!leak.hasOwnProperty(k)) continue;
    var total = 0;
    for (var k2 in leak[k]) { if (leak[k].hasOwnProperty(k2)) total += leak[k][k2]; }
    entries.push({base: k, total: total, acts: leak[k]});
  }
  entries.sort(function(a,b) { return b.total - a.total; });

  var tbody = document.querySelector('#leakTable tbody');
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var acts = [];
    for (var k in e.acts) { if (e.acts.hasOwnProperty(k)) acts.push({name: k, amt: e.acts[k]}); }
    acts.sort(function(a,b) { return b.amt - a.amt; });
    var tr = document.createElement('tr');
    var html = '<td>'+e.base+'</td><td class="r rd">'+nf(e.total)+'</td>';
    for (var j = 0; j < 3; j++) {
      if (j < acts.length) html += '<td>'+acts[j].name+'</td><td class="r">'+nf(acts[j].amt)+'</td>';
      else html += '<td>-</td><td class="r">-</td>';
    }
    html += '<td style="font-size:11px;color:#ffd93d">'+(e.total>500?'⚠ 严重：需紧急调整':'需关注')+'</td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  }

  var lLabels = [], lData = [];
  for (var i = 0; i < entries.length; i++) { lLabels.push(entries[i].base); lData.push(entries[i].total); }
  charts.push(new Chart(document.getElementById('leakChart'), {
    type: 'bar', data: { labels: lLabels, datasets: [{ label: '漏出金额(万)', data: lData, backgroundColor: '#ff6b6b', borderRadius: 3 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { color: '#1a2f52' }, ticks: { color: '#8899bb', callback: function(v) { return nf0(v); } } }, y: { grid: { display: false }, ticks: { color: '#ccd' } } } }
  }));
}

function renderTab4(d) {
  var monthly = d.monthly_detail || {};
  var peData = monthly['PE（100）给水管'] || {};
  var peMonths = Object.keys(peData).sort();
  var peAmt = [];
  for (var i = 0; i < peMonths.length; i++) {
    peAmt.push(Math.round(peData[peMonths[i]] / 100) / 10);
  }
  charts.push(new Chart(document.getElementById('mPeChart'), {
    type: 'bar', data: { labels: peMonths, datasets: [{ label: 'PE给水管 月金额(万)', data: peAmt, backgroundColor: peAmt.map(function(a) { return a>30?'#4ecdc4':a>10?'#c9a84c':'#ff6b6b'; }), borderRadius: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false }, ticks: { color: '#8899bb', font: { size: 9 }, maxTicksLimit: 12 } }, y: { grid: { color: '#1a2f52' }, ticks: { color: '#8899bb', callback: function(v) { return nf0(v); } } } } }
  }));

  // Other products line chart
  var prods = d.products;
  var colors = ['#ffd93d','#ff6b6b','#4ecdc4','#c9a84c','#8899bb','#45b7aa','#e05555'];
  var oDatasets = [];
  var ci = 0;
  for (var i = 0; i < prods.length; i++) {
    var p = prods[i];
    if (p.product === 'PE（100）给水管' || p.total_amt <= 10) continue;
    var mp = monthly[p.product] || {};
    var data = [];
    for (var j = 0; j < peMonths.length; j++) {
      var v = mp[peMonths[j]] || 0;
      data.push(Math.round(v / 100) / 10);
    }
    oDatasets.push({
      label: p.product.length > 8 ? p.product.slice(0,8)+'…' : p.product,
      data: data,
      borderColor: colors[ci % colors.length],
      tension: 0.3, pointRadius: 1, borderWidth: 2, fill: false
    });
    ci++;
  }
  charts.push(new Chart(document.getElementById('mOtherChart'), {
    type: 'line', data: { labels: peMonths, datasets: oDatasets },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#ccd', boxWidth: 10, padding: 6, font: { size: 9 } } } },
      scales: { x: { grid: { color: '#1a2f52' }, ticks: { color: '#8899bb', font: { size: 8 }, maxTicksLimit: 12 } }, y: { grid: { color: '#1a2f52' }, ticks: { color: '#8899bb', callback: function(v) { return nf0(v); } } } } }
  }));
}

function renderTab5(d) {
  document.getElementById('recContent').innerHTML =
    '<div class="rec-card"><h4>🔴 紧急：堵住长春基地 994 万漏出</h4><p>长春基地仅 26.4% 最优率，是最大漏洞。994 万流向 8040 工厂（656万）和 8060 工厂（306万）。</p><ul><li>将 8040/8060 对应的「辽宁省」「吉林省」订单强制路由到长春基地</li><li>设定长春基地最低出货量 KPI，每月监控最优率变化</li><li>目标：3 个月内将长春最优率提升至 60%+</li></ul></div>'+
    '<div class="rec-card"><h4>🔴 紧急：天津基地 + 黄石基地 最优率 &lt; 10%</h4><p>天津 7.3%（漏出 447 万）、黄石 7.5%（漏出 258 万）。合计漏出 705 万，占总量 16%。</p><ul><li>排查天津/黄石的出货是否在最优路径范围内</li><li>如不在范围，考虑调整最优基地映射，而非强制路由</li></ul></div>'+
    '<div class="rec-card"><h4>🟡 PE给水管（3894万，CV=89%）— 量大但波动</h4><p>主力产品，但月度波动大。建议：</p><ul><li>建立月度需求预测机制，提前 1 个月锁定基地产能</li><li>当某月预测 &gt;300 万时，提前协调佛山+渭南双基地备货</li></ul></div>'+
    '<div class="rec-card"><h4>🟡 C类产品：量小波动大 — 采用 1-3 个月周期管理</h4><p>8 个产品合计仅 216 万（占 4.8%），但 CV 高达 88%-203%。建议：</p><ul><li>按季度合并采购计划，集中到佛山/渭南基地统一发货</li><li>设定安全库存水位（1 个月用量），减少紧急调货</li></ul></div>'+
    '<div class="rec-card"><h4>🟢 巩固：佛山基地（98.7%）+ 渭南基地（96.2%）</h4><p>两基地承担 36% 金额且最优率极高。建议：</p><ul><li>优先将新订单分配给佛山/渭南，作为品质标杆</li><li>将佛山/渭南的经验向长春/天津推广</li></ul></div>'+
    '<div class="rec-card"><h4>📊 管理 KPI 建议</h4><ul><li>月度监控：各基地最优率趋势（目标：整体 &gt;65%）</li><li>漏出金额月度环比（目标：每月降低 10%）</li><li>PE给水管月度量预测准确率</li><li>C类产品合并采购完成率</li></ul></div>';
}

// Load data and init
fetch('management_data.json?_t=' + Date.now())
  .then(function(r) { return r.json(); })
  .then(function(d) { DATA = d; initAll(); })
  .catch(function(e) {
    document.body.innerHTML = '<div style="text-align:center;padding:80px;color:#ff6b6b"><h2>⚠ 数据加载失败</h2><p>'+e.message+'</p><button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#c9a84c;color:#0a1628;border:none;border-radius:4px;font-weight:700;cursor:pointer">重新加载</button></div>';
  });
