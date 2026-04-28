/* Punto de arranque.
   Este archivo conecta la UI con el motor estadistico y la persistencia. */
const els = {
  learn: document.getElementById("learn"),
  generateBtn: document.getElementById("generateBtn"),
  balotoNums: document.getElementById("balotoNums"),
  balotoSuper: document.getElementById("balotoSuper"),
  revanchaNums: document.getElementById("revanchaNums"),
  revanchaSuper: document.getElementById("revanchaSuper"),
  history: document.getElementById("history"),
  hotNumbers: document.getElementById("hotNumbers"),
  coldNumbers: document.getElementById("coldNumbers"),
  overdueNumbers: document.getElementById("overdueNumbers"),
  modeLabel: document.getElementById("modeLabel"),
  freqChart: document.getElementById("freqChart"),
  superChart: document.getElementById("superChart"),
  topPairs: document.getElementById("topPairs"),
  topTriples: document.getElementById("topTriples"),
  exportBtn: document.getElementById("exportBtn"),
  syncBtn: document.getElementById("syncBtn"),
  recommendations: document.getElementById("recommendations"),
  toggleChartsBtn: document.getElementById("toggleChartsBtn"),
  toggleRecommendationsBtn: document.getElementById("toggleRecommendationsBtn"),
  chartsPanel: document.getElementById("chartsPanel"),
  recommendationsPanel: document.getElementById("recommendationsPanel"),
  detailsPanelsHost: document.getElementById("detailsPanelsHost"),
  detailsModal: document.getElementById("detailsModal"),
  detailsModalBackdrop: document.getElementById("detailsModalBackdrop"),
  detailsModalTitle: document.getElementById("detailsModalTitle"),
  detailsModalBody: document.getElementById("detailsModalBody"),
  detailsModalClose: document.getElementById("detailsModalClose"),
  menuBtn: document.getElementById("menuBtn"),
  sidebar: document.getElementById("sidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  langEsBtn: document.getElementById("lang-es"),
  langEnBtn: document.getElementById("lang-en"),
  btnSync: document.getElementById("syncBtn"),
  btnExport: document.getElementById("exportBtn"),
  menuAbout: document.getElementById("menuAbout"),
  aboutPanel: document.getElementById("aboutPanel")
};

let currentDetailPanel = null;
const AUTO_SYNC_DAYS = new Set([1, 3, 6]); // Lunes, miercoles y sabado
const AUTO_SYNC_HOUR = 22; // 10:00 p. m.
const AUTO_SYNC_MINUTE = 10; // margen para esperar a que el resultado ya aparezca publicado

function drawKey(draw){
  return `${draw.nums.join("-")}|${draw.super}`;
}

function getAutoSyncWindowKey(date = new Date()){
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shouldAutoSyncNow(date = new Date()){
  if(!AUTO_SYNC_DAYS.has(date.getDay())) return false;
  if(date.getHours() > AUTO_SYNC_HOUR) return true;
  if(date.getHours() < AUTO_SYNC_HOUR) return false;
  return date.getMinutes() >= AUTO_SYNC_MINUTE;
}

function normalizeRemoteDraw(item){
  if(!item || !Array.isArray(item.nums) || item.nums.length !== PICK_COUNT) return null;

  const nums = uniqueSorted(item.nums.map(n => Number(n)).filter(Number.isFinite));
  const rawSuper = item.super !== undefined ? item.super : item.super_ball;
  const superValue = Number(rawSuper);
  const validNums = nums.length === PICK_COUNT && nums.every(n => n >= 1 && n <= NUM_MAX);
  const validSuper = Number.isInteger(superValue) && superValue >= 1 && superValue <= SUPER_MAX;

  if(!validNums || !validSuper){
    return null;
  }

  return {
    nums,
    super: superValue,
    dateLabel: item.dateLabel || item.date_label || "",
    source: item.source || "baloto.com"
  };
}

const SYNC_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:text-bottom;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;
const SPIN_ICON  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon" style="margin-right:4px; vertical-align:text-bottom;"><path d="M21 12a9 9 0 1 1-9-9"/></svg>`;

function setSyncLoading(loading) {
  const btn = document.getElementById("syncBtn");
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `${SPIN_ICON} SINCRONIZANDO...`
    : `${SYNC_ICON} SINCRO ONLINE`;
  btn.style.opacity = loading ? "0.7" : "";
}

async function syncFromBaloto({ silent = false } = {}){
  if(window.location.protocol === "file:"){
    if(!silent){
      showNotice("La sincronizacion automatica requiere abrir la app desde localhost o XAMPP.", "warning");
    }
    return false;
  }

  if (!silent) setSyncLoading(true);

  try{
    if(!silent){
      showNotice("Sincronizando resultados publicados en baloto.com...", "info");
    }

    const token = typeof getSyncToken === 'function' ? getSyncToken() : '';
    const syncUrl = `/api/sync?pages=2${token ? '&token=' + encodeURIComponent(token) : ''}`;
    const response = await fetch(syncUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Sync-Token': token
      }
    });

    const payload = await response.json();
    if(!response.ok || !payload.ok){
      throw new Error(payload.error || `No se pudo sincronizar. HTTP ${response.status}`);
    }

    const existing = loadDraws();
    const seen = new Set(existing.map(drawKey));
    const incoming = (payload.items || [])
      .map(normalizeRemoteDraw)
      .filter(Boolean)
      .reverse();

    let added = 0;
    incoming.forEach(draw => {
      const key = drawKey(draw);
      if(seen.has(key)) return;
      seen.add(key);
      existing.push(draw);
      added++;
    });

    if(added > 0){
      saveJson(STORAGE_REALES, existing);
      const model = buildModel(existing);
      refreshDashboard(model);
      showNotice(`${t('syncOnline')} ${t('noticeReady')}. +${added}`, "success");
    }else if(!silent){
      if (payload.items && payload.items.length === 0) {
        showNotice("No se encontraron sorteos nuevos en baloto.com. Revisa la conexion o el formato de la pagina.", "warning");
      } else {
        showNotice("Baloto ya estaba actualizado con los ultimos sorteos publicados.", "info");
      }
    }
    return true;
  }catch(error){
    if(!silent){
      showNotice(`No fue posible sincronizar: ${error.message}`, "warning");
    }
    return false;
  } finally {
    if (!silent) setSyncLoading(false);
  }
}

async function syncAfterDrawIfNeeded(){
  const now = new Date();
  if(!shouldAutoSyncNow(now)) return;

  const windowKey = `auto-sync-${getAutoSyncWindowKey(now)}`;
  if(localStorage.getItem(windowKey) === "done") return;

  const success = await syncFromBaloto({ silent: true });
  if(success){
    localStorage.setItem(windowKey, "done");
  }
}

function openDetailWindow(panel, title){
  if(currentDetailPanel && currentDetailPanel !== panel){
    closeDetailWindow();
  }

  panel.classList.remove("hidden-panel");
  els.detailsModalTitle.textContent = title;
  els.detailsModalBody.appendChild(panel);
  els.detailsModal.classList.add("open");
  els.detailsModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  currentDetailPanel = panel;

  if(panel === els.chartsPanel){
    window.requestAnimationFrame(() => {
      if(typeof freqChartInstance !== "undefined" && freqChartInstance){ freqChartInstance.destroy(); freqChartInstance = null; }
      if(typeof superChartInstance !== "undefined" && superChartInstance){ superChartInstance.destroy(); superChartInstance = null; }
      renderCharts(buildModel(loadDraws()));
    });
  }
}

function closeDetailWindow(){
  if(!currentDetailPanel){
    return;
  }

  currentDetailPanel.classList.add("hidden-panel");
  els.detailsPanelsHost.appendChild(currentDetailPanel);
  els.detailsModal.classList.remove("open");
  els.detailsModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  currentDetailPanel = null;
}

function generateAll(){
  const draws = loadDraws();
  const model = buildModel(draws);

  const freq = els.learn.checked ? model.freq : baseFreq;
  const superFreq = els.learn.checked ? model.superFreq : baseSuperFreq;

  const baloto = generateBestCombination(freq);
  const revancha = generateBestCombination(freq);
  const balotoSuper = chooseSuper(superFreq);
  const revanchaSuper = chooseDistinctSuper(superFreq, balotoSuper);

  els.balotoNums.innerHTML = baloto.map(n => `<span>${n}</span>`).join("");
  els.balotoSuper.textContent = balotoSuper;
  els.revanchaNums.innerHTML = revancha.map(n => `<span>${n}</span>`).join("");
  els.revanchaSuper.textContent = revanchaSuper;

  refreshDashboard(model);
  saveHistory(baloto, balotoSuper, revancha, revanchaSuper);
}



async function init(){
  // Inicializar Supabase (carga credenciales desde el servidor)
  if (typeof initSupabase === 'function') await initSupabase();

  // Intentar sincronizar con la nube (Supabase) al inicio
  const draws = await syncDrawsFromCloud();
  await syncHistoryFromCloud();

  refreshDashboard(buildModel(draws));
  renderHistory();
  
  els.generateBtn.addEventListener("click", generateAll);
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", clearHistory);
  els.learn.addEventListener("change", () => refreshDashboard(buildModel(loadDraws())));
  els.exportBtn.addEventListener("click", exportCsv);
  els.syncBtn.addEventListener("click", () => syncFromBaloto());
  els.toggleChartsBtn.addEventListener("click", () => {
    openDetailWindow(els.chartsPanel, t("trendCharts"));
  });
  els.toggleRecommendationsBtn.addEventListener("click", () => {
    openDetailWindow(els.recommendationsPanel, t("aiRecs"));
  });
  els.detailsModalBackdrop.addEventListener("click", closeDetailWindow);
  els.detailsModalClose.addEventListener("click", closeDetailWindow);
  window.addEventListener("keydown", event => {
    if(event.key === "Escape"){
      closeDetailWindow();
    }
  });

  function toggleSidebar() {
    els.sidebar.classList.toggle('open');
    els.sidebarBackdrop.classList.toggle('open');
    if (els.sidebar.classList.contains('open')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  if (els.menuBtn) els.menuBtn.addEventListener('click', toggleSidebar);
  if (els.closeSidebarBtn) els.closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (els.sidebarBackdrop) els.sidebarBackdrop.addEventListener('click', toggleSidebar);

  if (els.langEsBtn) {
    els.langEsBtn.addEventListener('click', () => {
      setLanguage('es');
      toggleSidebar();
    });
  }
  if (els.langEnBtn) {
    els.langEnBtn.addEventListener('click', () => {
      setLanguage('en');
      toggleSidebar();
    });
  }

  if (els.btnSync) {
    els.btnSync.addEventListener("click", () => {
      syncFromBaloto({ silent: false });
    });
  }
  if (els.btnExport) {
    els.btnExport.addEventListener("click", () => {
      const draws = loadDraws();
      const csv = "Sorteo,Fecha,Num1,Num2,Num3,Num4,Num5,Super\n" + 
        draws.map(d => `${d.id},${d.date},${d.nums.join(",")},${d.super}`).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `baloto_export_${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
    });
  }

  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    if (link.id === 'menuAbout') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
      showNotice(`Opción ${e.target.textContent.trim()} seleccionada (En desarrollo)`, "info");
    });
  });

  if (els.menuAbout) {
    els.menuAbout.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
      const aboutTitle = (typeof t === "function" && t("about")) ? t("about") : "Acerca de la App";
      openDetailWindow(els.aboutPanel, aboutTitle);
    });
  }
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if(typeof freqChartInstance !== "undefined" && freqChartInstance){ freqChartInstance.destroy(); freqChartInstance = null; }
      if(typeof superChartInstance !== "undefined" && superChartInstance){ superChartInstance.destroy(); superChartInstance = null; }
      refreshDashboard(buildModel(loadDraws()));
    }, 300);
  });
  
  // Sincronización en segundo plano
  syncFromBaloto({ silent: true });
  syncAfterDrawIfNeeded();
  window.setInterval(syncAfterDrawIfNeeded, 5 * 60 * 1000);
}

init();
