import { jsPDF } from 'jspdf';
import { getNCTypeName } from './ncHelpers';
import { getBayDescription } from './rackHelpers';

/**
 * Layout PDF export (Doc 1 §5.9, §6.5–6.8).
 *
 * Generates a multi-page vector PDF for a working area:
 *   - Page 1: Cover (customer, area, inspection metadata, rack count)
 *   - Page 2: Layout snapshot (high-res PNG from Konva stage)
 *   - Page 3+: Rack list table with bay descriptions + NC summary
 *   - Last page: Non-conformity detail list
 *
 * The Konva stage is snapshotted via `stage.toDataURL()` at 2x pixel ratio so
 * the embedded image stays crisp when printed on A4.
 */
export function exportLayoutPDF({
  stage,
  inspection,
  area,
  racks,
  nonConformities,
  suppliers = [],
}) {
  if (!stage) {
    throw new Error('Layout PDF export requires a Konva stage reference.');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  const supplierNameById = Object.fromEntries(
    suppliers.map((s) => [s.id, s.name])
  );

  const areaRacks = racks.filter((r) => r.areaId === area.id);
  const areaRackIds = new Set(areaRacks.map((r) => r.id));
  const areaNCs = nonConformities.filter((nc) => areaRackIds.has(nc.rackId));

  const ncBySeverity = { red: 0, yellow: 0, green: 0 };
  areaNCs.forEach((nc) => {
    if (ncBySeverity[nc.severity] != null) ncBySeverity[nc.severity] += 1;
  });

  const dateStr = new Date().toLocaleDateString();

  // ─── Page 1: cover ────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Layout Report', margin, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let y = margin + 18;
  const line = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value ?? '-'), margin + 45, y);
    y += 6;
  };

  line('Customer', inspection?.endCustomer || '-');
  line('Inspection', inspection?.name || inspection?.id || '-');
  line('Working Area', area?.name || '-');
  line('Racks', areaRacks.length);
  line('Non-conformities', areaNCs.length);
  line('Critical (red)', ncBySeverity.red);
  line('Warning (yellow)', ncBySeverity.yellow);
  line('Info (green)', ncBySeverity.green);
  line('Generated', dateStr);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('RackVision — Layout Report', margin, pageH - margin);
  doc.setTextColor(0);

  // ─── Page 2: layout snapshot ─────────────────────────────────────
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Layout — ${area?.name || ''}`, margin, margin + 6);

  let imgDataUrl = null;
  try {
    imgDataUrl = stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png',
    });
  } catch (err) {
    console.error('Failed to snapshot layout', err);
  }

  if (imgDataUrl) {
    const stageW = stage.width();
    const stageH = stage.height();
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2 - 10;
    const ratio = Math.min(availW / stageW, availH / stageH);
    const drawW = stageW * ratio;
    const drawH = stageH * ratio;
    const drawX = margin + (availW - drawW) / 2;
    const drawY = margin + 10 + (availH - drawH) / 2;
    doc.addImage(imgDataUrl, 'PNG', drawX, drawY, drawW, drawH);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Layout snapshot unavailable.', margin, margin + 20);
  }

  // ─── Page 3+: rack list table ────────────────────────────────────
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Racks', margin, margin + 6);

  const headers = ['#', 'Name', 'Supplier', 'Bays', 'Bay Description', 'Levels', 'NCs'];
  const colX = [margin, margin + 10, margin + 55, margin + 95, margin + 108, margin + 180, margin + 200];

  let rowY = margin + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  headers.forEach((h, i) => doc.text(h, colX[i], rowY));
  rowY += 2;
  doc.setLineWidth(0.2);
  doc.line(margin, rowY, pageW - margin, rowY);
  rowY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  areaRacks.forEach((rack, idx) => {
    if (rowY > pageH - margin - 8) {
      doc.addPage();
      rowY = margin + 10;
    }
    const rackNCs = areaNCs.filter((nc) => nc.rackId === rack.id);
    const supplierName =
      supplierNameById[rack.supplierId] ||
      rack.supplierName ||
      rack.manufacturer ||
      '-';
    doc.text(String(idx + 1), colX[0], rowY);
    doc.text(truncate(rack.name || 'Unnamed', 28), colX[1], rowY);
    doc.text(truncate(supplierName, 22), colX[2], rowY);
    doc.text(String(rack.numberOfBays ?? '-'), colX[3], rowY);
    doc.text(truncate(getBayDescription(rack) || `${rack.bayLength || 0}`, 36), colX[4], rowY);
    doc.text(String(rack.levels ?? '-'), colX[5], rowY);
    doc.text(String(rackNCs.length), colX[6], rowY);
    rowY += 5;
  });

  // ─── NC detail list ──────────────────────────────────────────────
  if (areaNCs.length > 0) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Non-conformities', margin, margin + 6);

    let ncY = margin + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    areaNCs.forEach((nc, idx) => {
      if (ncY > pageH - margin - 10) {
        doc.addPage();
        ncY = margin + 10;
      }
      const rack = areaRacks.find((r) => r.id === nc.rackId);
      const rackName = rack?.name || 'Unknown rack';
      const typeName = getNCTypeName(nc.ncTypeId) || nc.ncTypeId || 'Unknown';
      const severity = (nc.severity || 'green').toUpperCase();
      const element = nc.elementType ? ` · ${nc.elementType}` : '';
      const face = nc.face ? ` · ${String(nc.face).toUpperCase()}` : '';
      const qty = nc.quantity > 1 ? ` · x${nc.quantity}` : '';
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. [${severity}] ${typeName}`, margin, ncY);
      doc.setFont('helvetica', 'normal');
      ncY += 4;
      doc.text(
        truncate(`${rackName}${element}${face}${qty}`, 110),
        margin + 4,
        ncY
      );
      ncY += 4;
      if (nc.notes) {
        const noteLines = doc.splitTextToSize(nc.notes, pageW - margin * 2 - 6);
        doc.setTextColor(90);
        noteLines.forEach((ln) => {
          if (ncY > pageH - margin - 6) {
            doc.addPage();
            ncY = margin + 10;
          }
          doc.text(ln, margin + 4, ncY);
          ncY += 4;
        });
        doc.setTextColor(0);
      }
      ncY += 2;
    });
  }

  // ─── Footer page numbers ─────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageW - margin,
      pageH - margin + 4,
      { align: 'right' }
    );
    doc.setTextColor(0);
  }

  const customerSlug = (inspection?.endCustomer || 'inspection').replace(
    /\s+/g,
    '-'
  );
  const areaSlug = (area?.name || 'area').replace(/\s+/g, '-');
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `${customerSlug}-${areaSlug}-layout-${date}.pdf`;

  doc.save(fileName);
}

function truncate(str, max) {
  const s = String(str ?? '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
