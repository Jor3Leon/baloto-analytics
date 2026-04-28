/* Generador de Reporte PDF Profesional - Baloto Analytics
   Usa jsPDF + jsPDF-AutoTable para crear dashboards exportables. */

function generatePDFReport() {
  const draws = loadDraws();
  if (!draws.length) {
    showNotice("No hay datos para generar el reporte.", "warning");
    return;
  }

  const model = buildModel(draws);
  const { pairCounts, tripleCounts } = analyzePatterns(draws);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const MARGIN = 14;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  // ── Colores del diseño ──
  const DARK    = [15, 23, 42];    // #0f172a
  const ACCENT  = [212, 255, 0];   // #d4ff00
  const CYAN    = [0, 200, 255];   // #00c8ff
  const WHITE   = [255, 255, 255];
  const GRAY    = [148, 163, 184]; // #94a3b8
  const CARD_BG = [30, 41, 59];   // #1e293b
  const RED_HOT = [239, 68, 68];
  const BLUE_COLD = [59, 130, 246];

  function addFooter(pageNum, totalPages) {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`BALOTO ANALYTICS — Reporte generado el ${new Date().toLocaleString('es-CO')}`, MARGIN, H - 6);
    doc.text(`Página ${pageNum} de ${totalPages}`, W - MARGIN, H - 6, { align: "right" });
  }

  function checkPageBreak(needed) {
    if (y + needed > H - 20) {
      doc.addPage();
      y = 15;
      return true;
    }
    return false;
  }

  function drawRoundedRect(x, yPos, w, h, r, fillColor) {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, yPos, w, h, r, r, "F");
  }

  function drawNumberBall(x, yPos, num, bgColor, textColor, radius) {
    radius = radius || 5;
    doc.setFillColor(...bgColor);
    doc.circle(x, yPos, radius, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textColor);
    doc.text(String(num), x, yPos + 1, { align: "center" });
  }

  // ═══════════════════════════════════════════════════
  // PÁGINA 1: PORTADA
  // ═══════════════════════════════════════════════════
  // Fondo oscuro completo
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");

  // Barra de acento superior
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 3, "F");

  // Logotipo / Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...ACCENT);
  doc.text("BALOTO", W / 2, 65, { align: "center" });
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text("ANALYTICS", W / 2, 78, { align: "center" });

  // Línea decorativa
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 30, 85, W / 2 + 30, 85);

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...GRAY);
  doc.text("REPORTE ESTADÍSTICO COMPLETO", W / 2, 95, { align: "center" });

  // Fecha
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(11);
  doc.text(dateStr.toUpperCase(), W / 2, 105, { align: "center" });

  // Stats card central
  drawRoundedRect(MARGIN + 15, 125, CONTENT_W - 30, 50, 4, CARD_BG);

  const statsX = W / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...ACCENT);
  doc.text(String(model.totalDraws), statsX, 147, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text("SORTEOS ANALIZADOS", statsX, 157, { align: "center" });

  // 3 mini stats
  const miniY = 167;
  const col1 = MARGIN + 35, col2 = W / 2, col3 = W - MARGIN - 35;
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  const hot = Object.entries(model.freq).sort((a, b) => b[1] - a[1]);
  const cold = Object.entries(model.freq).sort((a, b) => a[1] - b[1]);

  doc.text("MÁS CALIENTE", col1, miniY + 8, { align: "center" });
  doc.setFontSize(18);
  doc.setTextColor(...RED_HOT);
  doc.text(hot[0][0], col1, miniY + 1, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("MÁS FRÍO", col2, miniY + 8, { align: "center" });
  doc.setFontSize(18);
  doc.setTextColor(...BLUE_COLD);
  doc.text(cold[0][0], col2, miniY + 1, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("SUPERBALOTA TOP", col3, miniY + 8, { align: "center" });
  const superSorted = Object.entries(model.superFreq).sort((a, b) => b[1] - a[1]);
  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  doc.text(superSorted[0][0], col3, miniY + 1, { align: "center" });

  // Footer portada
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("Generado por Baloto Analytics — Motor Estadístico v1.0", W / 2, H - 15, { align: "center" });
  doc.text("Este reporte es de uso informativo. No garantiza resultados.", W / 2, H - 10, { align: "center" });

  // ═══════════════════════════════════════════════════
  // PÁGINA 2: NÚMEROS CALIENTES & FRÍOS + FRECUENCIAS
  // ═══════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 2, "F");
  y = 15;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ACCENT);
  doc.text("ANÁLISIS DE FRECUENCIAS", MARGIN, y);
  y += 10;

  // ── Top 10 Calientes ──
  doc.setFontSize(10);
  doc.setTextColor(...RED_HOT);
  doc.text("🔥 NÚMEROS CALIENTES — Top 10", MARGIN, y);
  y += 2;

  const hotTop10 = hot.slice(0, 10);
  drawRoundedRect(MARGIN, y, CONTENT_W, 22, 3, CARD_BG);
  y += 6;

  const ballSpacing = CONTENT_W / 12; // Un espacio más para la superbalota
  hotTop10.forEach((entry, i) => {
    const bx = MARGIN + ballSpacing * (i + 0.5) + 3;
    drawNumberBall(bx, y + 3, entry[0], RED_HOT, WHITE, 5);
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text(`×${Math.round(entry[1])}`, bx, y + 11, { align: "center" });
  });

  // Agregar la Superbalota más caliente al final de la lista hot
  const topSuper = superSorted[0];
  const sbx = MARGIN + ballSpacing * (10 + 0.5) + 3;
  drawNumberBall(sbx, y + 3, topSuper[0], ACCENT, DARK, 5);
  doc.setFontSize(6);
  doc.setTextColor(...ACCENT);
  doc.text("SUPER", sbx, y + 11, { align: "center" });
  
  y += 22;

  // ── Top 10 Fríos ──
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(...BLUE_COLD);
  doc.text("❄️ NÚMEROS FRÍOS — Top 10", MARGIN, y);
  y += 2;

  const coldTop10 = cold.slice(0, 10);
  drawRoundedRect(MARGIN, y, CONTENT_W, 22, 3, CARD_BG);
  y += 6;

  coldTop10.forEach((entry, i) => {
    const bx = MARGIN + ballSpacing * (i + 0.5) + 3;
    drawNumberBall(bx, y + 3, entry[0], BLUE_COLD, WHITE, 5);
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text(`×${Math.round(entry[1])}`, bx, y + 11, { align: "center" });
  });

  // Agregar la Superbalota más fría al final de la lista cold
  const worstSuper = superSorted[superSorted.length - 1];
  const wbx = MARGIN + ballSpacing * (10 + 0.5) + 3;
  drawNumberBall(wbx, y + 3, worstSuper[0], [55, 65, 81], WHITE, 5);
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.text("SUPER", wbx, y + 11, { align: "center" });

  y += 25;

  // ── Superbalota Top ──
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text("⭐ SUPERBALOTA — Frecuencias (1-16)", MARGIN, y);
  y += 2;

  drawRoundedRect(MARGIN, y, CONTENT_W, 22, 3, CARD_BG);
  y += 6;

  const superSpacing = CONTENT_W / 17;
  for (let i = 1; i <= SUPER_MAX; i++) {
    const bx = MARGIN + superSpacing * (i - 0.5) + 3;
    const isTop = i === Number(superSorted[0][0]);
    const bg = isTop ? ACCENT : [55, 65, 81];
    const tc = isTop ? DARK : WHITE;
    drawNumberBall(bx, y + 3, i, bg, tc, 4.5);
    doc.setFontSize(5);
    doc.setTextColor(...GRAY);
    doc.text(`${Math.round(model.superFreq[i] || 0)}`, bx, y + 10, { align: "center" });
  }
  y += 25;

  // ── Tabla de frecuencias completa ──
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text("📊 TABLA DE FRECUENCIAS COMPLETA (1-43)", MARGIN, y);
  y += 5;

  // Preparar datos para tabla
  const freqData = [];
  for (let i = 1; i <= NUM_MAX; i++) {
    const count = model.counts[i] || 0;
    const pct = model.totalDraws > 0 ? ((count / model.totalDraws) * 100).toFixed(1) : "0.0";
    const lastSeenVal = model.lastSeen[i] !== undefined ? model.lastSeen[i] : "-";
    freqData.push([String(i), String(count), `${pct}%`, String(lastSeenVal)]);
  }

  // Dividir en 3 columnas lado a lado
  const colSize = Math.ceil(NUM_MAX / 3);
  const tableData = [];
  for (let r = 0; r < colSize; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      const idx = r + c * colSize;
      if (idx < freqData.length) {
        row.push(...freqData[idx]);
      } else {
        row.push("", "", "", "");
      }
    }
    tableData.push(row);
  }

  doc.autoTable({
    startY: y,
    head: [["#", "Frec", "%", "Atraso", "#", "Frec", "%", "Atraso", "#", "Frec", "%", "Atraso"]],
    body: tableData,
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: WHITE,
      fontSize: 6.5,
      cellPadding: 1.5,
      lineColor: [55, 65, 81],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: ACCENT,
      fontStyle: "bold",
      fontSize: 6.5
    },
    alternateRowStyles: {
      fillColor: [20, 30, 48]
    },
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    columnStyles: {
      0: { cellWidth: 8 }, 1: { cellWidth: 10 }, 2: { cellWidth: 12 }, 3: { cellWidth: 12 },
      4: { cellWidth: 8 }, 5: { cellWidth: 10 }, 6: { cellWidth: 12 }, 7: { cellWidth: 12 },
      8: { cellWidth: 8 }, 9: { cellWidth: 10 }, 10: { cellWidth: 12 }, 11: { cellWidth: 12 }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  // ═══════════════════════════════════════════════════
  // PÁGINA 3: PATRONES + DÍAS DE ATRASO
  // ═══════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 2, "F");
  y = 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ACCENT);
  doc.text("PATRONES Y COMBINACIONES", MARGIN, y);
  y += 10;

  // ── Top Parejas ──
  const topPairs = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  doc.setFontSize(10);
  doc.setTextColor(...CYAN);
  doc.text("🔗 TOP 15 PAREJAS MÁS FRECUENTES", MARGIN, y);
  y += 5;

  const pairsTableData = topPairs.map(([pair, count], i) => {
    const pct = model.totalDraws > 0 ? ((count / model.totalDraws) * 100).toFixed(1) : "0";
    return [String(i + 1), pair.replace("-", " — "), String(count), `${pct}%`];
  });

  doc.autoTable({
    startY: y,
    head: [["#", "Pareja", "Apariciones", "% del total"]],
    body: pairsTableData,
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: WHITE,
      fontSize: 7,
      cellPadding: 2,
      lineColor: [55, 65, 81],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: CYAN,
      fontStyle: "bold"
    },
    alternateRowStyles: { fillColor: [20, 30, 48] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Top Tripletas ──
  checkPageBreak(60);
  const topTriples = Object.entries(tripleCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  doc.setFontSize(10);
  doc.setTextColor(...CYAN);
  doc.text("🔗 TOP 15 TRIPLETAS MÁS FRECUENTES", MARGIN, y);
  y += 5;

  const triplesTableData = topTriples.map(([triple, count], i) => {
    const pct = model.totalDraws > 0 ? ((count / model.totalDraws) * 100).toFixed(1) : "0";
    return [String(i + 1), triple.split("-").join(" — "), String(count), `${pct}%`];
  });

  doc.autoTable({
    startY: y,
    head: [["#", "Tripleta", "Apariciones", "% del total"]],
    body: triplesTableData,
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: WHITE,
      fontSize: 7,
      cellPadding: 2,
      lineColor: [55, 65, 81],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: CYAN,
      fontStyle: "bold"
    },
    alternateRowStyles: { fillColor: [20, 30, 48] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Números con Mayor Atraso ──
  checkPageBreak(50);
  doc.setFontSize(10);
  doc.setTextColor([251, 191, 36]); // amber
  doc.text("⏳ NÚMEROS CON MAYOR ATRASO (Días sin salir)", MARGIN, y);
  y += 5;

  const overdueAll = Object.entries(model.lastSeen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const overdueData = overdueAll.map(([num, gap], i) => {
    const count = model.counts[num] || 0;
    return [String(i + 1), String(num), String(gap), String(count)];
  });

  doc.autoTable({
    startY: y,
    head: [["#", "Número", "Sorteos sin salir", "Apariciones totales"]],
    body: overdueData,
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: WHITE,
      fontSize: 7,
      cellPadding: 2,
      lineColor: [55, 65, 81],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: [251, 191, 36],
      fontStyle: "bold"
    },
    alternateRowStyles: { fillColor: [20, 30, 48] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // ═══════════════════════════════════════════════════
  // PÁGINA 4: ÚLTIMOS SORTEOS
  // ═══════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 2, "F");
  y = 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ACCENT);
  doc.text("ÚLTIMOS SORTEOS REGISTRADOS", MARGIN, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Mostrando los últimos ${Math.min(draws.length, 30)} sorteos de ${draws.length} registrados`, MARGIN, y);
  y += 7;

  const recentDraws = draws.slice(-30).reverse();
  const drawsTableData = recentDraws.map((d, i) => {
    const label = d.dateLabel || d.date_label || `Sorteo ${draws.length - i}`;
    const nums = (d.nums || []).join(" - ");
    const superBall = d.super || d.super_ball || "-";
    return [String(i + 1), label, nums, String(superBall)];
  });

  doc.autoTable({
    startY: y,
    head: [["#", "Fecha / Sorteo", "Números", "Super"]],
    body: drawsTableData,
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: WHITE,
      fontSize: 7,
      cellPadding: 2,
      lineColor: [55, 65, 81],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: ACCENT,
      fontStyle: "bold"
    },
    alternateRowStyles: { fillColor: [20, 30, 48] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 65 },
      3: { cellWidth: 20, halign: "center" }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Recomendaciones del motor ──
  checkPageBreak(45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ACCENT);
  doc.text("🎯 COMBINACIONES RECOMENDADAS POR EL MOTOR", MARGIN, y);
  y += 3;
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("Basadas en análisis de frecuencia ponderada, balance par/impar y dispersión numérica.", MARGIN, y);
  y += 6;

  const recs = generateRecommendations(model.freq, model.superFreq);
  const recsData = recs.map((r, i) => [
    String(i + 1),
    r.numbers.join(" - "),
    String(r.super),
    r.score.toFixed(1),
    String(r.sum),
    `${r.even}/5`,
    String(r.spread)
  ]);

  doc.autoTable({
    startY: y,
    head: [["#", "Números", "Super", "Score", "Suma", "Pares", "Rango"]],
    body: recsData,
    theme: "plain",
    styles: {
      fillColor: CARD_BG,
      textColor: WHITE,
      fontSize: 7,
      cellPadding: 2,
      lineColor: [55, 65, 81],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: ACCENT,
      fontStyle: "bold"
    },
    alternateRowStyles: { fillColor: [20, 30, 48] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' }
    }
  });

  // ═══════════════════════════════════════════════════
  // AGREGAR FOOTERS A TODAS LAS PÁGINAS
  // ═══════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // ═══════════════════════════════════════════════════
  // DESCARGAR
  // ═══════════════════════════════════════════════════
  const filename = `Baloto_Analytics_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  showNotice(`Reporte PDF "${filename}" generado exitosamente.`, "success");
}
