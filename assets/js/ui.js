/* Capa de interfaz.
   Aqui se concentran el render, la importacion/exportacion y la lectura de formularios. */
function formatPills(values){
  if(!values.length) return `<span class="muted">${t('noData')}</span>`;
  return values.map(v => `<span class="pill">${v}</span>`).join("");
}

function formatPillsWithSuper(values, superNum, superColor){
  if(!values.length) return `<span class="muted">${t('noData')}</span>`;
  const pills = values.map(v => `<span class="pill">${v}</span>`).join("");
  const superBadge = superNum != null
    ? `<span class="pill pill-super" style="background:${superColor};color:#000;border-color:${superColor};" title="Superbalota">★ ${superNum}</span>`
    : "";
  return pills + superBadge;
}

function showNotice(message, type = "info"){
  const notice = document.getElementById("noticeBar");
  if(!notice) return;
  notice.className = `notice notice-${type}`;
  notice.textContent = message;
}


function renderModel(model){
  els.modeLabel.textContent = els.learn.checked ? t("weighted") : t("base");

  const hot = Object.entries(model.freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([n]) => n);

  const cold = Object.entries(model.freq)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([n]) => n);

  const overdue = Object.entries(model.lastSeen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([n, gap]) => `${n} (${gap})`);

  // Superbalota caliente (más frecuente) y fría (menos frecuente)
  const superSorted = Object.entries(model.superFreq).sort((a, b) => b[1] - a[1]);
  const hotSuper  = superSorted.length ? Number(superSorted[0][0]) : null;
  const coldSuper = superSorted.length ? Number(superSorted[superSorted.length - 1][0]) : null;

  els.hotNumbers.innerHTML  = formatPillsWithSuper(hot,  hotSuper,  "var(--primary)");
  els.coldNumbers.innerHTML = formatPillsWithSuper(cold, coldSuper, "var(--primary-2)");
  els.overdueNumbers.innerHTML = formatPills(overdue);

}

function renderPatterns(model){
  const { pairCounts, tripleCounts } = analyzePatterns(model.draws);
  const noData = `<span class="muted">${t('noData')}</span>`;

  function makeRows(entries, maxCount) {
    if (!entries.length) return noData;
    return entries.map(([key, count], i) => {
      const pct = Math.round((count / maxCount) * 100);
      const nums = key.split('-').map(n => `<span class="pat-num">${n}</span>`).join('');
      return `
        <div class="pattern-row">
          <span class="pat-rank">#${i + 1}</span>
          <div class="pat-nums">${nums}</div>
          <div class="pat-bar-wrap">
            <div class="pat-bar" style="width:${pct}%"></div>
          </div>
          <span class="pat-count">${count}x</span>
        </div>`;
    }).join('');
  }

  const topPairsRaw = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topTriplesRaw = Object.entries(tripleCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxPair = topPairsRaw[0]?.[1] || 1;
  const maxTriple = topTriplesRaw[0]?.[1] || 1;

  els.topPairs.innerHTML = makeRows(topPairsRaw, maxPair);
  els.topTriples.innerHTML = makeRows(topTriplesRaw, maxTriple);
}

function renderRecommendations(model){
  const list = generateRecommendations(model.freq, model.superFreq);
  if(!list.length){
    els.recommendations.innerHTML = `<span class="muted">${t('noData')}</span>`;
    return;
  }

  els.recommendations.innerHTML = `<div class="rec-list">${list.map(item => `
    <div class="rec-card">
      <div class="numbers-display" style="justify-content: flex-start;">
        <div class="result-nums">
          ${item.numbers.map(n => `<span>${n}</span>`).join('')}
        </div>
        <div class="super-num" style="background-color: var(--primary);">${item.super}</div>
      </div>
      <div class="pill-list" style="margin-top: 12px;">
        <span>${t('score')}: ${item.score.toFixed(2)}</span>
        <span>${t('sum')}: ${item.sum}</span>
        <span>${t('even')}: ${item.even}</span>
        <span>${t('low')}: ${item.low}</span>
        <span>${t('range')}: ${item.spread}</span>
      </div>
    </div>
  `).join("")}</div>`;
}

function refreshDashboard(model){
  renderModel(model);
  renderCharts(model);
  renderPatterns(model);
  renderRecommendations(model);
}

function renderHistory(){
  const history = loadHistory();
  const badge   = document.getElementById("historyCount");
  const clearBtn = document.getElementById("clearHistoryBtn");

  if (badge)    badge.textContent = history.length > 0 ? history.length : "";
  if (clearBtn) clearBtn.style.display = history.length > 0 ? "flex" : "none";

  if(!history.length){
    els.history.innerHTML = `
      <div class="history-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3; margin-bottom:8px;">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="muted">${t('noHistory')}</span>
      </div>`;
    return;
  }

  els.history.innerHTML = history.map((entry, idx) => {
    const bNums  = entry.b.map(n => `<span class="hball">${n}</span>`).join('');
    const rNums  = entry.r.map(n => `<span class="hball">${n}</span>`).join('');
    const copyPayload = `Baloto: ${entry.b.join('-')} + ${entry.bs} | Revancha: ${entry.r.join('-')} + ${entry.rs}`;
    return `
      <div class="hcard">
        <div class="hcard-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${entry.d}</span>
          <button class="btn-copy-history icon-btn" title="Copiar" style="margin-left:auto; padding:3px; opacity:0.5;"
            data-payload="${copyPayload.replace(/"/g,'&quot;')}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        <div class="hcard-panels">
          <div class="hpanel hpanel--baloto">
            <div class="hpanel-label">BALOTO</div>
            <div class="hballs-row">
              ${bNums}
              <span class="hball hball--super hball--baloto-s">${entry.bs}</span>
            </div>
          </div>
          <div class="hpanel hpanel--revancha">
            <div class="hpanel-label">REVANCHA</div>
            <div class="hballs-row">
              ${rNums}
              <span class="hball hball--super hball--revancha-s">${entry.rs}</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('.btn-copy-history').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.getAttribute('data-payload')).then(() => {
        btn.style.opacity = "1"; btn.style.color = "var(--accent)";
        setTimeout(() => { btn.style.opacity = "0.5"; btn.style.color = ""; }, 1500);
      }).catch(() => showNotice("No se pudo copiar.", "warning"));
    });
  });
}


async function clearHistory() {
  if (!confirm("¿Eliminar todo el historial de combinaciones generadas?")) return;
  await saveToCloud(STORAGE_HISTORY, []);
  renderHistory();
  showNotice("Historial limpiado.", "info");
}

async function saveHistory(b, bs, r, rs){
  const history = loadHistory();
  history.unshift({
    d: new Date().toLocaleString(),
    b,
    bs,
    r,
    rs
  });
  await saveToCloud(STORAGE_HISTORY, history);
  renderHistory();
}

function exportCsv(){
  const draws = loadDraws();
  if(!draws.length){
    showNotice("No hay sorteos para exportar.", "warning");
    return;
  }

  const lines = ["nums,super"];
  draws.forEach(draw => {
    lines.push(`${draw.nums.join("-")},${draw.super}`);
  });

  const blob = new Blob([lines.join("\n")], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "baloto_historico.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsvText(text){
  const rows = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const imported = [];
  const seen = new Set();

  rows.forEach((row, index) => {
    if(index === 0 && /nums/i.test(row) && /super/i.test(row)) return;
    const parts = row.split(/[;,]/).map(part => part.trim()).filter(Boolean);
    if(parts.length < 2) return;

    const nums = uniqueSorted(parts[0].split(/[-\s]+/).map(Number).filter(Number.isFinite));
    const superValue = Number(parts[1]);
    const key = `${nums.join("-")}|${superValue}`;

    if(nums.length === PICK_COUNT &&
      nums.every(n => n >= 1 && n <= NUM_MAX) &&
      Number.isInteger(superValue) &&
      superValue >= 1 &&
      superValue <= SUPER_MAX &&
      !seen.has(key)){
      seen.add(key);
      imported.push({ nums, super: superValue });
    }
  });

  return imported;
}

function handleCsvImport(file){
  if(!file){
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const imported = parseCsvText(String(reader.result || ""));
    if(!imported.length){
      showNotice("No se encontraron filas validas en el CSV.", "warning");
      return;
    }

    const draws = loadDraws();
    const existing = new Set(draws.map(d => `${d.nums.join("-")}|${d.super}`));
    let added = 0;

    imported.forEach(draw => {
      const key = `${draw.nums.join("-")}|${draw.super}`;
      if(existing.has(key)) return;
      existing.add(key);
      draws.push(draw);
      added++;
    });

    saveJson(STORAGE_REALES, draws);
    refreshDashboard(buildModel(draws));
    els.csvFile.value = "";
    showNotice(`CSV importado correctamente. Se agregaron ${added} sorteos.`, "success");
  };
  reader.readAsText(file);
}
