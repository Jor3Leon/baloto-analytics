const translations = {
  es: {
    engineStatus: "ESTADO DEL MOTOR MATEMÁTICO",
    activeAnalysis: "ANÁLISIS ACTIVO",
    probDensity: "DENSIDAD DE PROBABILIDAD",
    drawCount: "CONTEO DE SORTEOS",
    realDrawSim: "SIMULACIÓN DE SORTEO REAL",
    generateBtn: "GENERAR COMBINACIÓN",
    manualReg: "Registro Manual",
    discard: "DESCARTAR",
    saveHistory: "GUARDAR EN HISTORIAL",
    trendCharts: "GRÁFICOS DE TENDENCIA",
    aiRecs: "COMBINACIONES RECOMENDADAS",
    patternsData: "PATRONES Y DATOS",
    topPairs: "PARES PRINCIPALES",
    topTriples: "TRIPLES PRINCIPALES",
    importCsv: "IMPORTAR CSV",
    export: "EXPORTAR",
    syncOnline: "SINCRO ONLINE",
    recentActivity: "ACTIVIDAD RECIENTE",
    menu: "MENÚ",
    home: "Inicio",
    settings: "Ajustes",
    about: "Acerca de",
    idioma: "IDIOMA / LANGUAGE",
    // UI strings
    noData: "Sin datos suficientes",
    weighted: "Ponderado",
    base: "Base",
    score: "Puntaje",
    sum: "Suma",
    even: "Pares",
    low: "Bajos",
    range: "Rango",
    noHistory: "Aún no se ha generado ningún resultado.",
    baloto: "Baloto:",
    revancha: "Revancha:",
    hotNums: "NÚMEROS CALIENTES",
    coldNums: "NÚMEROS FRÍOS",
    overdueDays: "DÍAS ATRASADOS",
    freqNum: "FRECUENCIA POR NÚMERO",
    freqSuper: "FRECUENCIA SUPERBALOTA",
    ready: "Listo para analizar sorteos.",
    draw: "SORTEO",
    historyTitle: "Historial de Resultados"
  },
  en: {
    engineStatus: "MATHEMATICAL ENGINE STATUS",
    activeAnalysis: "ACTIVE ANALYSIS",
    probDensity: "PROBABILITY DENSITY",
    drawCount: "DRAW COUNT",
    realDrawSim: "REAL DRAW SIMULATION",
    generateBtn: "GENERATE COMBINATION",
    manualReg: "Manual Registration",
    discard: "DISCARD",
    saveHistory: "SAVE TO HISTORY",
    trendCharts: "TREND ANALYSIS CHARTS",
    aiRecs: "RECOMMENDED COMBINATIONS",
    patternsData: "PATTERNS & DATA",
    topPairs: "TOP PAIRS",
    topTriples: "TOP TRIPLES",
    importCsv: "IMPORT CSV",
    export: "EXPORT",
    syncOnline: "SYNC ONLINE",
    recentActivity: "RECENT ACTIVITY",
    menu: "MENU",
    home: "Home",
    settings: "Settings",
    about: "About",
    idioma: "LANGUAGE / IDIOMA",
    // UI strings
    noData: "Not enough data",
    weighted: "Weighted",
    base: "Base",
    score: "Score",
    sum: "Sum",
    even: "Pairs",
    low: "Low",
    range: "Spread",
    noHistory: "No results generated yet.",
    baloto: "Baloto:",
    revancha: "Revancha:",
    hotNums: "HOT NUMBERS",
    coldNums: "COLD NUMBERS",
    overdueDays: "OVERDUE DAYS",
    freqNum: "NUMBER FREQUENCY",
    freqSuper: "SUPERBALL FREQUENCY",
    ready: "Ready to analyze draws.",
    draw: "DRAW",
    historyTitle: "Results History"
  }
};

let currentLang = localStorage.getItem('appLang') || 'es';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) ? translations[currentLang][key] : key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  updateUIStrings();
  
  // Trigger a full UI refresh if possible
  if (typeof refreshDashboard === 'function' && typeof loadDraws === 'function' && typeof buildModel === 'function') {
    refreshDashboard(buildModel(loadDraws()));
  }
  if (typeof renderHistory === 'function') {
    renderHistory();
  }
}

function updateUIStrings() {
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    const translation = t(key);
    
    // Check if it's an input placeholder
    if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
      // We might need a separate attribute for placeholders if needed, 
      // but let's assume data-t handles textContent or placeholder based on element
      if (key.includes('placeholder')) {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    } else {
      // Handle elements with icons (SVG)
      // If the element has an SVG, we don't want to overwrite it.
      // We should put the text in a span or check if there's an SVG child.
      const svg = el.querySelector('svg');
      if (svg) {
        // Keep the SVG and update only the text node
        // This is a bit tricky, let's assume data-t is on the text container
        const textNode = Array.from(el.childNodes).find(node => node.nodeType === 3 && node.textContent.trim() !== "");
        if (textNode) {
          textNode.textContent = " " + translation;
        } else {
          // If no text node found, maybe it's inside another span
          const span = el.querySelector('span');
          if (span) {
            span.textContent = translation;
          } else {
            // Last resort: append a text node
            el.appendChild(document.createTextNode(" " + translation));
          }
        }
      } else {
        el.textContent = translation;
      }
    }
  });

  // Update HTML lang attribute
  document.documentElement.lang = currentLang;

  // Update active state of buttons in selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.id === 'lang-' + currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Auto-init on load if script is included
document.addEventListener('DOMContentLoaded', () => {
  updateUIStrings();
});
