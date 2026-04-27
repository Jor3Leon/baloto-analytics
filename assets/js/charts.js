/* Render de graficas con Chart.js.
   Barras con degradado, tooltips interactivos y diseño responsive mobile-first. */

let freqChartInstance = null;
let superChartInstance = null;

function createGradient(ctx, chartArea, colorTop, colorBottom) {
  if (!chartArea) return colorTop;
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, colorBottom);
  gradient.addColorStop(1, colorTop);
  return gradient;
}

function buildChartConfig(labels, values, options = {}) {
  const {
    label = "Frecuencia",
    colorTop = "rgba(95, 213, 255, 0.9)",
    colorBottom = "rgba(95, 213, 255, 0.15)",
    borderColor = "rgba(95, 213, 255, 1)",
    hoverColor = "rgba(212, 255, 0, 0.85)",
    maxBarThickness = 28,
    aspectRatio = 2
  } = options;

  return {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return createGradient(ctx, chartArea, colorTop, colorBottom);
        },
        borderColor: borderColor,
        borderWidth: 1,
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: "bottom",
        hoverBackgroundColor: hoverColor,
        hoverBorderColor: hoverColor,
        hoverBorderWidth: 2,
        maxBarThickness
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio,
      animation: {
        duration: 600,
        easing: "easeOutQuart"
      },
      interaction: {
        mode: "index",
        intersect: false
      },
      layout: {
        padding: { top: 8, right: 12, bottom: 4, left: 4 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#d4ff00",
          titleFont: { family: "'Space Grotesk', sans-serif", size: 13, weight: "700" },
          bodyColor: "#f8fafc",
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
          borderColor: "rgba(255,255,255,0.12)",
          borderWidth: 1,
          cornerRadius: 10,
          padding: { top: 10, right: 14, bottom: 10, left: 14 },
          displayColors: false,
          callbacks: {
            title: function(items) {
              return "Número " + items[0].label;
            },
            label: function(item) {
              return "Apariciones: " + item.formattedValue;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          border: {
            color: "rgba(255,255,255,0.08)"
          },
          ticks: {
            color: "rgba(148, 163, 184, 0.85)",
            font: {
              family: "'Inter', sans-serif",
              size: 10,
              weight: "600"
            },
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 6
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255,255,255,0.04)",
            lineWidth: 1
          },
          border: {
            display: false
          },
          ticks: {
            color: "rgba(148, 163, 184, 0.65)",
            font: {
              family: "'Inter', sans-serif",
              size: 10
            },
            padding: 8,
            precision: 0
          }
        }
      }
    }
  };
}

function renderCharts(model) {
  const numberValues = [];
  const numberLabels = [];
  for (let i = 1; i <= NUM_MAX; i++) {
    numberLabels.push(String(i));
    numberValues.push(model.freq[i] || 0);
  }

  const superValues = [];
  const superLabels = [];
  for (let i = 1; i <= SUPER_MAX; i++) {
    superLabels.push(String(i));
    superValues.push(model.superFreq[i] || 0);
  }

  /* --- Gráfica de Frecuencia de Números --- */
  if (freqChartInstance) {
    freqChartInstance.data.labels = numberLabels;
    freqChartInstance.data.datasets[0].data = numberValues;
    freqChartInstance.update("none");
  } else if (els.freqChart) {
    const freqConfig = buildChartConfig(numberLabels, numberValues, {
      label: "Frecuencia por número",
      colorTop: "rgba(95, 213, 255, 0.85)",
      colorBottom: "rgba(95, 213, 255, 0.08)",
      borderColor: "rgba(95, 213, 255, 0.6)",
      hoverColor: "rgba(0, 229, 255, 0.9)",
      maxBarThickness: 18,
      aspectRatio: window.innerWidth < 640 ? 1.4 : 2.2
    });
    freqConfig.options.plugins.tooltip.callbacks.title = function(items) {
      return "Bola #" + items[0].label;
    };
    freqChartInstance = new Chart(els.freqChart, freqConfig);
  }

  /* --- Gráfica de Frecuencia de Superbalota --- */
  if (superChartInstance) {
    superChartInstance.data.labels = superLabels;
    superChartInstance.data.datasets[0].data = superValues;
    superChartInstance.update("none");
  } else if (els.superChart) {
    const superConfig = buildChartConfig(superLabels, superValues, {
      label: "Frecuencia por superbalota",
      colorTop: "rgba(212, 255, 0, 0.85)",
      colorBottom: "rgba(212, 255, 0, 0.08)",
      borderColor: "rgba(212, 255, 0, 0.5)",
      hoverColor: "rgba(212, 255, 0, 0.95)",
      maxBarThickness: 32,
      aspectRatio: window.innerWidth < 640 ? 1.6 : 2.5
    });
    superConfig.options.plugins.tooltip.callbacks.title = function(items) {
      return "Superbalota #" + items[0].label;
    };
    superChartInstance = new Chart(els.superChart, superConfig);
  }

  const chartNumbersLabel = document.getElementById("chartNumbersLabel");
  const chartSuperLabel = document.getElementById("chartSuperLabel");
  if (chartNumbersLabel) chartNumbersLabel.textContent = NUM_MAX + " bolas";
  if (chartSuperLabel) chartSuperLabel.textContent = SUPER_MAX + " superbalotas";
}
