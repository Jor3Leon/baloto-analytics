/* Generador de Reporte PDF Profesional - Baloto Analytics
   Usa jsPDF + jsPDF-AutoTable para crear dashboards exportables. */

function generatePDFReport() {
  try {
    const draws = typeof loadDraws === 'function' ? loadDraws() : [];
    if (!draws.length) {
      if (typeof showNotice === 'function') showNotice("No hay datos para generar el reporte.", "warning");
      return;
    }

    const model = buildModel(draws);
    const { pairCounts, tripleCounts } = analyzePatterns(draws);
    
    // Referencia robusta a jsPDF (UMD vs Global)
    if (!window.jsPDF && window.jspdf && window.jspdf.jsPDF) {
      window.jsPDF = window.jspdf.jsPDF;
    }
    
    const jsPDFConstructor = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
    if (!jsPDFConstructor) {
      throw new Error("Librería jsPDF no encontrada. Verifique su conexión a internet.");
    }
    
    const doc = new jsPDFConstructor({ orientation: "p", unit: "mm", format: "a4" });

    // Asegurar que autoTable esté disponible
    if (!doc.autoTable) {
      console.warn("jsPDF-AutoTable no detectado automáticamente.");
      // En algunas versiones UMD el plugin se registra de forma distinta
    }

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const MARGIN = 14;
    const CONTENT_W = W - MARGIN * 2;
    let y = 0;

    // ── Colores del diseño (RGB para máxima compatibilidad) ──
    const DARK      = [15, 23, 42];
    const ACCENT    = [212, 255, 0];
    const CYAN      = [0, 200, 255];
    const WHITE     = [255, 255, 255];
    const GRAY      = [148, 163, 184];
    const CARD_BG   = [30, 41, 59];
    const RED_HOT   = [239, 68, 68];
    const BLUE_COLD = [59, 130, 246];
    const AMBER     = [251, 191, 36];
    const DARK_GRID = [20, 30, 48];

    function applyPageStyle() {
      doc.setFillColor(DARK[0], DARK[1], DARK[2]);
      doc.rect(0, 0, W, H, "F");
      doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      doc.rect(0, 0, W, 2, "F");
    }

    function addFooter(pageNum, totalPages) {
      doc.setFontSize(7);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text(`BALOTO ANALYTICS — Reporte generado el ${new Date().toLocaleString('es-CO')}`, MARGIN, H - 6);
      doc.text(`Página ${pageNum} de ${totalPages}`, W - MARGIN, H - 6, { align: "right" });
    }

    function checkPageBreak(needed) {
      if (y + needed > H - 20) {
        doc.addPage();
        applyPageStyle();
        y = 15;
        return true;
      }
      return false;
    }

    function drawRoundedRect(x, yPos, w, h, r, fillColor) {
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.roundedRect(x, yPos, w, h, r, r, "F");
    }

    function drawNumberBall(x, yPos, num, bgColor, textColor, radius) {
      radius = radius || 5;
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.circle(x, yPos, radius, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(String(num), x, yPos + 1, { align: "center" });
    }

    // ═══════════════════════════════════════════════════
    // PÁGINA 1: PORTADA
    // ═══════════════════════════════════════════════════
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(0, 0, W, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("BALOTO", W / 2, 65, { align: "center" });
    doc.setFontSize(28);
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text("ANALYTICS", W / 2, 78, { align: "center" });

    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.setLineWidth(0.5);
    doc.line(W / 2 - 30, 85, W / 2 + 30, 85);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text("REPORTE ESTADÍSTICO COMPLETO", W / 2, 95, { align: "center" });

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(11);
    doc.text(dateStr.toUpperCase(), W / 2, 105, { align: "center" });

    drawRoundedRect(MARGIN + 15, 125, CONTENT_W - 30, 50, 4, CARD_BG);

    const statsX = W / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text(String(model.totalDraws), statsX, 147, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text("SORTEOS ANALIZADOS", statsX, 157, { align: "center" });

    const miniY = 167;
    const col1 = MARGIN + 35, col2 = W / 2, col3 = W - MARGIN - 35;
    doc.setFontSize(8);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);

    const hot = Object.entries(model.freq).sort((a, b) => b[1] - a[1]);
    const cold = Object.entries(model.freq).sort((a, b) => a[1] - b[1]);

    if (hot.length) {
      doc.text("MÁS CALIENTE", col1, miniY + 8, { align: "center" });
      doc.setFontSize(18);
      doc.setTextColor(RED_HOT[0], RED_HOT[1], RED_HOT[2]);
      doc.text(hot[0][0], col1, miniY + 1, { align: "center" });
    }

    if (cold.length) {
      doc.setFontSize(8);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text("MÁS FRÍO", col2, miniY + 8, { align: "center" });
      doc.setFontSize(18);
      doc.setTextColor(BLUE_COLD[0], BLUE_COLD[1], BLUE_COLD[2]);
      doc.text(cold[0][0], col2, miniY + 1, { align: "center" });
    }

    const superSorted = Object.entries(model.superFreq).sort((a, b) => b[1] - a[1]);
    if (superSorted.length) {
      doc.setFontSize(8);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text("SUPERBALOTA TOP", col3, miniY + 8, { align: "center" });
      doc.setFontSize(18);
      doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      doc.text(superSorted[0][0], col3, miniY + 1, { align: "center" });
    }

    doc.setFontSize(7);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text("Generado por Baloto Analytics — Motor Estadístico v1.0", W / 2, H - 15, { align: "center" });
    doc.text("Este reporte es de uso informativo. No garantiza resultados.", W / 2, H - 10, { align: "center" });

    // ═══════════════════════════════════════════════════
    // PÁGINA 2: NÚMEROS CALIENTES & FRÍOS + FRECUENCIAS
    // ═══════════════════════════════════════════════════
    doc.addPage();
    applyPageStyle();
    y = 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("ANÁLISIS DE FRECUENCIAS", MARGIN, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(RED_HOT[0], RED_HOT[1], RED_HOT[2]);
    doc.text("🔥 NÚMEROS CALIENTES — Top 10", MARGIN, y);
    y += 2;

    const hotTop10 = hot.slice(0, 10);
    drawRoundedRect(MARGIN, y, CONTENT_W, 22, 3, CARD_BG);
    y += 6;

    const ballSpacing = CONTENT_W / 12;
    hotTop10.forEach((entry, i) => {
      const bx = MARGIN + ballSpacing * (i + 0.5) + 3;
      drawNumberBall(bx, y + 3, entry[0], RED_HOT, WHITE, 5);
      doc.setFontSize(6);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text(`×${Math.round(entry[1])}`, bx, y + 11, { align: "center" });
    });

    if (superSorted.length) {
      const topSuper = superSorted[0];
      const sbx = MARGIN + ballSpacing * (10 + 0.5) + 3;
      drawNumberBall(sbx, y + 3, topSuper[0], ACCENT, DARK, 5);
      doc.setFontSize(6);
      doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      doc.text("SUPER", sbx, y + 11, { align: "center" });
    }
    
    y += 22;

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(BLUE_COLD[0], BLUE_COLD[1], BLUE_COLD[2]);
    doc.text("❄️ NÚMEROS FRÍOS — Top 10", MARGIN, y);
    y += 2;

    const coldTop10 = cold.slice(0, 10);
    drawRoundedRect(MARGIN, y, CONTENT_W, 22, 3, CARD_BG);
    y += 6;

    coldTop10.forEach((entry, i) => {
      const bx = MARGIN + ballSpacing * (i + 0.5) + 3;
      drawNumberBall(bx, y + 3, entry[0], BLUE_COLD, WHITE, 5);
      doc.setFontSize(6);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text(`×${Math.round(entry[1])}`, bx, y + 11, { align: "center" });
    });

    if (superSorted.length) {
      const worstSuper = superSorted[superSorted.length - 1];
      const wbx = MARGIN + ballSpacing * (10 + 0.5) + 3;
      drawNumberBall(wbx, y + 3, worstSuper[0], [55, 65, 81], WHITE, 5);
      doc.setFontSize(6);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      doc.text("SUPER", wbx, y + 11, { align: "center" });
    }

    y += 25;

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("⭐ SUPERBALOTA — Frecuencias (1-16)", MARGIN, y);
    y += 2;

    drawRoundedRect(MARGIN, y, CONTENT_W, 22, 3, CARD_BG);
    y += 6;

    const sMax = (typeof SUPER_MAX !== 'undefined') ? SUPER_MAX : 16;
    const superSpacing = CONTENT_W / (sMax + 1);
    for (let i = 1; i <= sMax; i++) {
      const bx = MARGIN + superSpacing * (i - 0.5) + 3;
      const isTop = superSorted.length && i === Number(superSorted[0][0]);
      const bg = isTop ? ACCENT : [55, 65, 81];
      const tc = isTop ? DARK : WHITE;
      drawNumberBall(bx, y + 3, i, bg, tc, 4.5);
      doc.setFontSize(5);
      doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      const sFreq = (model.superFreq && model.superFreq[i]) ? Math.round(model.superFreq[i]) : 0;
      doc.text(`${sFreq}`, bx, y + 10, { align: "center" });
    }
    y += 25;

    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("📊 TABLA DE FRECUENCIAS COMPLETA (1-43)", MARGIN, y);
    y += 5;

    const nMax = (typeof NUM_MAX !== 'undefined') ? NUM_MAX : 43;
    const freqData = [];
    for (let i = 1; i <= nMax; i++) {
      const count = model.counts[i] || 0;
      const pct = model.totalDraws > 0 ? ((count / model.totalDraws) * 100).toFixed(1) : "0.0";
      const lastSeenVal = model.lastSeen[i] !== undefined ? model.lastSeen[i] : "-";
      freqData.push([String(i), String(count), `${pct}%`, String(lastSeenVal)]);
    }

    const colSize = Math.ceil(nMax / 3);
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

    if (doc.autoTable) {
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
          fillColor: DARK_GRID
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
    }

    // ═══════════════════════════════════════════════════
    // PÁGINA 3: PATRONES + DÍAS DE ATRASO
    // ═══════════════════════════════════════════════════
    doc.addPage();
    applyPageStyle();
    y = 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("PATRONES Y COMBINACIONES", MARGIN, y);
    y += 10;

    const topPairs = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    doc.setFontSize(10);
    doc.setTextColor(CYAN[0], CYAN[1], CYAN[2]);
    doc.text("🔗 TOP 15 PAREJAS MÁS FRECUENTES", MARGIN, y);
    y += 5;

    const pairsTableData = topPairs.map(([pair, count], i) => {
      const pct = model.totalDraws > 0 ? ((count / model.totalDraws) * 100).toFixed(1) : "0";
      return [String(i + 1), pair.replace("-", " — "), String(count), `${pct}%`];
    });

    if (doc.autoTable) {
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
        alternateRowStyles: { fillColor: DARK_GRID },
        margin: { left: MARGIN, right: MARGIN },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 }
        }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    checkPageBreak(60);
    const topTriples = Object.entries(tripleCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    doc.setFontSize(10);
    doc.setTextColor(CYAN[0], CYAN[1], CYAN[2]);
    doc.text("🔗 TOP 15 TRIPLETAS MÁS FRECUENTES", MARGIN, y);
    y += 5;

    const triplesTableData = topTriples.map(([triple, count], i) => {
      const pct = model.totalDraws > 0 ? ((count / model.totalDraws) * 100).toFixed(1) : "0";
      return [String(i + 1), triple.split("-").join(" — "), String(count), `${pct}%`];
    });

    if (doc.autoTable) {
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
        alternateRowStyles: { fillColor: DARK_GRID },
        margin: { left: MARGIN, right: MARGIN },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 }
        }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    checkPageBreak(50);
    doc.setFontSize(10);
    doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.text("⏳ NÚMEROS CON MAYOR ATRASO (Días sin salir)", MARGIN, y);
    y += 5;

    const overdueAll = Object.entries(model.lastSeen)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const overdueData = overdueAll.map(([num, gap], i) => {
      const count = model.counts[num] || 0;
      return [String(i + 1), String(num), String(gap), String(count)];
    });

    if (doc.autoTable) {
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
          textColor: AMBER,
          fontStyle: "bold"
        },
        alternateRowStyles: { fillColor: DARK_GRID },
        margin: { left: MARGIN, right: MARGIN },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 30 },
          2: { cellWidth: 50 },
          3: { cellWidth: 40 }
        }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // ═══════════════════════════════════════════════════
    // PÁGINA 4: ÚLTIMOS SORTEOS
    // ═══════════════════════════════════════════════════
    doc.addPage();
    applyPageStyle();
    y = 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("ÚLTIMOS SORTEOS REGISTRADOS", MARGIN, y);
    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text(`Mostrando los últimos ${Math.min(draws.length, 30)} sorteos de ${draws.length} registrados`, MARGIN, y);
    y += 7;

    const recentDraws = draws.slice(-30).reverse();
    const drawsTableData = recentDraws.map((d, i) => {
      const label = d.dateLabel || d.date_label || `Sorteo ${draws.length - i}`;
      const dNums = (d.nums || []).join(" - ");
      const superBall = d.super || d.super_ball || "-";
      return [String(i + 1), label, dNums, String(superBall)];
    });

    if (doc.autoTable) {
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
        alternateRowStyles: { fillColor: DARK_GRID },
        margin: { left: MARGIN, right: MARGIN },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 70 },
          2: { cellWidth: 65 },
          3: { cellWidth: 20, halign: "center" }
        }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    checkPageBreak(45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("🎯 COMBINACIONES RECOMENDADAS POR EL MOTOR", MARGIN, y);
    y += 3;
    doc.setFontSize(7);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text("Basadas en análisis de frecuencia ponderada, balance par/impar y dispersión numérica.", MARGIN, y);
    y += 6;

    const recs = (typeof generateRecommendations === 'function') ? generateRecommendations(model.freq, model.superFreq) : [];
    const recsData = recs.map((r, i) => [
      String(i + 1),
      (r.numbers || []).join(" - "),
      String(r.super || "-"),
      (r.score || 0).toFixed(1),
      String(r.sum || 0),
      `${r.even || 0}/5`,
      String(r.spread || 0)
    ]);

    if (doc.autoTable) {
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
        alternateRowStyles: { fillColor: DARK_GRID },
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
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    const filename = `Baloto_Analytics_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    if (typeof showNotice === 'function') showNotice(`Reporte PDF "${filename}" generado exitosamente.`, "success");

  } catch (error) {
    console.error("PDF Error:", error);
    if (typeof showNotice === 'function') showNotice(`Error al generar PDF: ${error.message}`, "error");
  }
}

