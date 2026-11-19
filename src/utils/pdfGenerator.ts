import { jsPDF } from 'jspdf';
import {
  A6_HALF_HEIGHT_IN,
  A6_HEIGHT_IN,
  A6_WIDTH_IN,
  BlankLineStyle,
  BlankTemplateConfig,
  FIELD_DEFINITIONS,
  HeaderConfig,
  LayoutConfig,
  StudentRecord,
} from '../types/idCard';

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return [30, 58, 95];
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [
    Number.isNaN(r) ? 30 : r,
    Number.isNaN(g) ? 58 : g,
    Number.isNaN(b) ? 95 : b,
  ];
}

function drawWritingRule(
  doc: jsPDF,
  x1: number,
  x2: number,
  y: number,
  style: BlankLineStyle
) {
  if (style === 'none' || x2 <= x1) return;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.008);
  if (style === 'dotted') {
    doc.setLineDashPattern([0.025, 0.035], 0);
  } else {
    doc.setLineDashPattern([], 0);
  }
  doc.line(x1, y + 0.03, x2, y + 0.03);
  doc.setLineDashPattern([], 0);
}

function drawDigitalHeader(
  doc: jsPDF,
  header: HeaderConfig,
  layout: LayoutConfig
) {
  const [r, g, b] = hexToRgb(header.accentColor);
  const centerX = A6_WIDTH_IN / 2;

  // Top accent strip
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, A6_WIDTH_IN, 0.14, 'F');

  let cursorY = 0.34;

  // Uploaded logo or subtle geometric crest
  if (header.logoDataUrl) {
    try {
      const imgProps = doc.getImageProperties(header.logoDataUrl);
      const maxLogoW = 0.85;
      const maxLogoH = 0.72;
      const ratio = Math.min(maxLogoW / imgProps.width, maxLogoH / imgProps.height);
      const drawW = imgProps.width * ratio;
      const drawH = imgProps.height * ratio;
      const format = header.logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(
        header.logoDataUrl,
        format,
        centerX - drawW / 2,
        cursorY,
        drawW,
        drawH
      );
      cursorY += drawH + 0.16;
    } catch {
      cursorY += 0.12;
    }
  } else {
    // Clean minimal institutional crest
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.018);
    doc.circle(centerX, cursorY + 0.24, 0.24, 'S');
    doc.setLineWidth(0.008);
    doc.circle(centerX, cursorY + 0.24, 0.19, 'S');
    doc.setFont(layout.fontFamily, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(r, g, b);
    doc.text('ID', centerX, cursorY + 0.285, { align: 'center' });
    cursorY += 0.64;
  }

  // Institution Name
  doc.setFont(layout.fontFamily, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const instLines = doc.splitTextToSize(
    header.institutionName.trim() || 'INSTITUTION NAME',
    A6_WIDTH_IN - layout.marginXIn * 2
  );
  doc.text(instLines, centerX, cursorY, { align: 'center' });
  cursorY += instLines.length * 0.18;

  // Subheading
  if (header.subHeading.trim()) {
    doc.setFont(layout.fontFamily, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(header.subHeading.trim(), centerX, cursorY, { align: 'center' });
    cursorY += 0.17;
  }

  // Card Title bar
  if (header.cardTitle.trim()) {
    const barW = A6_WIDTH_IN - layout.marginXIn * 2;
    const barH = 0.24;
    doc.setFillColor(r, g, b);
    doc.roundedRect(layout.marginXIn, cursorY, barW, barH, 0.03, 0.03, 'F');
    doc.setFont(layout.fontFamily, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(header.cardTitle.trim(), centerX, cursorY + 0.155, { align: 'center' });
    cursorY += barH + 0.14;
  }

  // Optional Photo placeholder & Academic Year row within top half
  const remainingH = A6_HALF_HEIGHT_IN - 0.14 - cursorY;
  if (header.showPhotoPlaceholder && remainingH >= 0.55) {
    const boxW = Math.min(0.86, remainingH * 0.85);
    const boxH = Math.min(0.95, remainingH - 0.06);
    const boxX = centerX - boxW / 2;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.01);
    doc.setLineDashPattern([0.04, 0.04], 0);
    doc.rect(boxX, cursorY, boxW, boxH, 'S');
    doc.setLineDashPattern([], 0);
    doc.setFont(layout.fontFamily, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('PHOTO', centerX, cursorY + boxH / 2 + 0.03, { align: 'center' });
  } else if (header.academicYear.trim() && remainingH >= 0.15) {
    doc.setFont(layout.fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(header.academicYear.trim(), centerX, cursorY + 0.12, { align: 'center' });
  }
}

function drawCardPage(
  doc: jsPDF,
  values: Partial<Record<string, string>>,
  layout: LayoutConfig,
  header: HeaderConfig,
  options: { forceWritingLineStyle?: BlankLineStyle }
) {
  // Optional outer frame border
  if (layout.showOuterBorder) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.01);
    doc.rect(0.14, 0.14, A6_WIDTH_IN - 0.28, A6_HEIGHT_IN - 0.28, 'S');
  }

  // Top Half (only printed if digital mode is enabled; preprinted mode leaves top half completely blank!)
  if (header.mode === 'digital') {
    drawDigitalHeader(doc, header, layout);
  }

  // Optional Midline Divider at exact 2.915"
  if (layout.showMidlineRule) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.008);
    doc.line(
      layout.marginXIn,
      A6_HALF_HEIGHT_IN,
      A6_WIDTH_IN - layout.marginXIn,
      A6_HALF_HEIGHT_IN
    );
  }

  // Lower Half Fields
  const leftX = layout.marginXIn;
  const rightX = A6_WIDTH_IN - layout.marginXIn;
  const usableWidth = rightX - leftX;
  const fontSizePt = layout.fontSizePt;
  const wrappedLineStepIn = (fontSizePt / 72) * 1.32;

  let currentY = layout.startYIn;
  const maxBottomY = A6_HEIGHT_IN - 0.22;

  for (const field of FIELD_DEFINITIONS) {
    if (currentY > maxBottomY) break;

    const labelText = field.label;
    const rawValue = (values[field.key] ?? '').trim();

    // Draw Regular Label
    doc.setFont(layout.fontFamily, 'normal');
    doc.setFontSize(fontSizePt);
    doc.setTextColor(30, 41, 59);
    doc.text(labelText, leftX, currentY);

    const labelWidth = doc.getTextWidth(labelText);
    const gapAfterLabel = 0.08;

    const valueStartX =
      layout.valueAlignment === 'column'
        ? Math.max(leftX + layout.labelColumnWidthIn, leftX + labelWidth + gapAfterLabel)
        : leftX + labelWidth + gapAfterLabel;

    const availableValueWidth = Math.max(0.6, rightX - valueStartX);

    if (rawValue.length > 0) {
      // Draw Bold Value directly in front of the label
      doc.setFont(layout.fontFamily, 'bold');
      doc.setFontSize(fontSizePt);
      doc.setTextColor(15, 23, 42);

      const lines: string[] = doc.splitTextToSize(rawValue, availableValueWidth);
      const maxLines = 2;
      const clippedLines = lines.slice(0, maxLines);

      clippedLines.forEach((line, lineIdx) => {
        const yPos = currentY + lineIdx * wrappedLineStepIn;
        const xPos = lineIdx === 0 ? valueStartX : valueStartX;
        doc.text(line, xPos, yPos);
      });

      const extraLines = Math.max(0, clippedLines.length - 1);
      currentY += layout.lineGapIn + extraLines * (wrappedLineStepIn * 0.88);
    } else {
      // Empty value: optionally draw clean hand-writing line
      const lineStyle =
        options.forceWritingLineStyle ??
        (layout.showWritingLineOnEmpty ? layout.writingLineStyle : 'none');

      drawWritingRule(doc, valueStartX, rightX, currentY, lineStyle);
      currentY += layout.lineGapIn;
    }

    // Prevent unused variable warning
    void usableWidth;
  }
}

function createA6Doc(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [A6_WIDTH_IN, A6_HEIGHT_IN],
    compress: true,
  });
}

export function exportStudentsToA6Pdf(
  students: StudentRecord[],
  layout: LayoutConfig,
  header: HeaderConfig,
  fileName = 'Student_IDs_A6_Batch.pdf'
): void {
  if (students.length === 0) return;

  const doc = createA6Doc();

  students.forEach((student, index) => {
    if (index > 0) {
      doc.addPage([A6_WIDTH_IN, A6_HEIGHT_IN], 'portrait');
    }
    drawCardPage(
      doc,
      {
        idNo: student.idNo,
        name: student.name,
        address: student.address,
        phoneNo: student.phoneNo,
        campus: student.campus,
        department: student.department,
        program: student.program,
        enrollment: student.enrollment,
      },
      layout,
      header,
      {}
    );
  });

  doc.save(fileName);
}

export function exportBlankHandFillPdf(
  blankConfig: BlankTemplateConfig,
  layout: LayoutConfig,
  header: HeaderConfig,
  fileName = 'Student_ID_A6_Blank_Template.pdf'
): void {
  const copies = Math.max(1, Math.min(100, Math.floor(blankConfig.copies || 1)));
  const doc = createA6Doc();

  for (let i = 0; i < copies; i++) {
    if (i > 0) {
      doc.addPage([A6_WIDTH_IN, A6_HEIGHT_IN], 'portrait');
    }
    drawCardPage(doc, blankConfig.prefilled, layout, header, {
      forceWritingLineStyle: blankConfig.lineStyle,
    });
  }

  doc.save(fileName);
}
