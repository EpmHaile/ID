import React, { useEffect, useRef, useState } from 'react';
import {
  A6_HALF_HEIGHT_IN,
  A6_HEIGHT_IN,
  A6_WIDTH_IN,
  BlankLineStyle,
  FIELD_DEFINITIONS,
  FieldKey,
  HeaderConfig,
  LayoutConfig,
  PdfFontFamily,
} from '../types/idCard';

const DPI = 96;
const SHEET_W_PX = A6_WIDTH_IN * DPI; // 396.48px
const SHEET_H_PX = A6_HEIGHT_IN * DPI; // 559.68px
const HALF_Y_PX = A6_HALF_HEIGHT_IN * DPI; // 279.84px

function getCssFontFamily(pdfFont: PdfFontFamily): string {
  switch (pdfFont) {
    case 'times':
      return 'Georgia, "Times New Roman", Times, serif';
    case 'courier':
      return '"IBM Plex Mono", "Courier New", Courier, monospace';
    case 'helvetica':
    default:
      return 'Helvetica, Arial, "DM Sans", sans-serif';
  }
}

interface A6SheetCanvasProps {
  values: Partial<Record<FieldKey, string>>;
  layout: LayoutConfig;
  header: HeaderConfig;
  forceWritingLineStyle?: BlankLineStyle;
  showGuides?: boolean;
  forPrint?: boolean;
}

export const A6SheetCanvas: React.FC<A6SheetCanvasProps> = ({
  values,
  layout,
  header,
  forceWritingLineStyle,
  showGuides = true,
  forPrint = false,
}) => {
  const fontFamily = getCssFontFamily(layout.fontFamily);
  const marginXPx = layout.marginXIn * DPI;
  const startYPx = layout.startYIn * DPI;
  const lineGapPx = layout.lineGapIn * DPI;
  const fontSizePx = (layout.fontSizePt / 72) * DPI;
  const labelColWidthPx = layout.labelColumnWidthIn * DPI;

  // Approximate baseline-to-top offset so HTML preview aligns with jsPDF text baseline
  const baselineOffsetPx = fontSizePx * 0.82;

  const containerStyle: React.CSSProperties = forPrint
    ? {
        width: `${A6_WIDTH_IN}in`,
        height: `${A6_HEIGHT_IN}in`,
        fontFamily,
      }
    : {
        width: `${SHEET_W_PX}px`,
        height: `${SHEET_H_PX}px`,
        fontFamily,
      };

  const scaleFactor = forPrint ? 1 / DPI : 1;
  const u = (px: number) => (forPrint ? `${(px * scaleFactor).toFixed(4)}in` : `${px}px`);
  const fontPt = `${layout.fontSizePt}pt`;

  const resolvedLineStyle = (val: string): BlankLineStyle => {
    if (val.trim().length > 0) return 'none';
    if (forceWritingLineStyle) return forceWritingLineStyle;
    return layout.showWritingLineOnEmpty ? layout.writingLineStyle : 'none';
  };

  return (
    <div
      className="relative bg-white text-slate-900 overflow-hidden select-none"
      style={containerStyle}
    >
      {/* Optional printable outer border */}
      {layout.showOuterBorder && (
        <div
          className="pointer-events-none absolute border border-slate-300"
          style={{
            top: u(0.14 * DPI),
            left: u(0.14 * DPI),
            right: u(0.14 * DPI),
            bottom: u(0.14 * DPI),
          }}
        />
      )}

      {/* TOP HALF: Digital Header OR Pre-printed Non-Printing Guide */}
      {header.mode === 'digital' ? (
        <div
          className="absolute top-0 left-0 right-0 flex flex-col items-center text-center"
          style={{
            height: u(HALF_Y_PX),
            paddingLeft: u(marginXPx),
            paddingRight: u(marginXPx),
          }}
        >
          {/* Top accent stripe */}
          <div
            className="w-full shrink-0"
            style={{
              height: u(0.14 * DPI),
              backgroundColor: header.accentColor,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          />

          <div
            className="w-full flex flex-col items-center"
            style={{ paddingTop: u(0.32 * DPI) }}
          >
            {header.logoDataUrl ? (
              <img
                src={header.logoDataUrl}
                alt="Institution Logo"
                referrerPolicy="no-referrer"
                className="object-contain"
                style={{
                  maxWidth: u(0.85 * DPI),
                  maxHeight: u(0.72 * DPI),
                  marginBottom: u(0.10 * DPI),
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full font-bold"
                style={{
                  width: u(0.48 * DPI),
                  height: u(0.48 * DPI),
                  border: `1.5px solid ${header.accentColor}`,
                  color: header.accentColor,
                  fontSize: '10pt',
                  marginBottom: u(0.12 * DPI),
                }}
              >
                ID
              </div>
            )}

            <div
              className="font-bold text-slate-900 leading-tight"
              style={{ fontSize: '11pt', marginBottom: u(0.04 * DPI) }}
            >
              {header.institutionName.trim() || 'INSTITUTION NAME'}
            </div>

            {header.subHeading.trim() && (
              <div
                className="text-slate-600 leading-tight"
                style={{ fontSize: '8.5pt', marginBottom: u(0.08 * DPI) }}
              >
                {header.subHeading}
              </div>
            )}

            {header.cardTitle.trim() && (
              <div
                className="w-full flex items-center justify-center font-bold text-white rounded-[3px]"
                style={{
                  height: u(0.24 * DPI),
                  backgroundColor: header.accentColor,
                  fontSize: '8.5pt',
                  marginBottom: u(0.10 * DPI),
                }}
              >
                {header.cardTitle}
              </div>
            )}

            {header.showPhotoPlaceholder ? (
              <div
                className="flex items-center justify-center border border-dashed border-slate-400 text-slate-400"
                style={{
                  width: u(0.76 * DPI),
                  height: u(0.78 * DPI),
                  fontSize: '7pt',
                }}
              >
                PHOTO
              </div>
            ) : (
              header.academicYear.trim() && (
                <div
                  className="text-slate-500"
                  style={{ fontSize: '8pt', marginTop: u(0.04 * DPI) }}
                >
                  {header.academicYear}
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        showGuides &&
        !forPrint && (
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 flex flex-col items-center justify-center text-center px-6"
            style={{
              height: `${HALF_Y_PX}px`,
              backgroundImage:
                'repeating-linear-gradient(-45deg, rgba(148,163,184,0.06), rgba(148,163,184,0.06) 8px, transparent 8px, transparent 16px)',
            }}
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] font-mono text-slate-400 mb-2">
              LOGO
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Pre-printed Top Half
            </p>
            <p className="text-[10px] text-slate-400/90 mt-0.5 max-w-[240px]">
              Kept completely blank in the exported PDF for your pre-printed logo and header.
            </p>
          </div>
        )
      )}

      {/* Printable Midline Divider */}
      {layout.showMidlineRule && (
        <div
          className="pointer-events-none absolute border-t border-slate-300"
          style={{
            top: u(HALF_Y_PX),
            left: u(marginXPx),
            right: u(marginXPx),
          }}
        />
      )}

      {/* Non-printing Halfway Guideline */}
      {showGuides && !forPrint && (
        <div
          className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-blue-400/75"
          style={{ top: `${HALF_Y_PX}px` }}
        >
          <span className="absolute right-2 -top-[16px] bg-white/95 px-1 text-[9px] font-mono text-blue-600">
            Half page · 2.915&quot;
          </span>
        </div>
      )}

      {/* LOWER HALF: 8 Required Student Fields */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: u(startYPx - baselineOffsetPx),
          paddingLeft: u(marginXPx),
          paddingRight: u(marginXPx),
        }}
      >
        <div className="flex flex-col">
          {FIELD_DEFINITIONS.map((field) => {
            const rawVal = (values[field.key] ?? '').trim();
            const lineStyle = resolvedLineStyle(rawVal);

            return (
              <div
                key={field.key}
                className="flex items-baseline"
                style={{
                  minHeight: u(lineGapPx),
                  fontSize: fontPt,
                  lineHeight: 1.32,
                  paddingBottom: u(Math.max(2, lineGapPx - fontSizePx * 1.32)),
                }}
              >
                {/* Field Label (Regular weight) */}
                <span
                  className="shrink-0 font-normal text-slate-800 whitespace-nowrap"
                  style={{
                    minWidth:
                      layout.valueAlignment === 'column' ? u(labelColWidthPx) : undefined,
                    marginRight: u(0.08 * DPI),
                  }}
                >
                  {field.label}
                </span>

                {/* Bold Value directly in front, OR hand-write rule when empty */}
                {rawVal.length > 0 ? (
                  <span
                    className="font-bold text-slate-950 break-words flex-1 min-w-0"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {rawVal}
                  </span>
                ) : (
                  <span
                    className="flex-1 min-w-0 self-baseline"
                    style={{
                      height: '0.85em',
                      borderBottom:
                        lineStyle === 'dotted'
                          ? '1px dotted #64748B'
                          : lineStyle === 'solid'
                          ? '1px solid #64748B'
                          : 'none',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface A6SheetPreviewProps {
  values: Partial<Record<FieldKey, string>>;
  layout: LayoutConfig;
  header: HeaderConfig;
  forceWritingLineStyle?: BlankLineStyle;
  showGuides: boolean;
}

export const A6SheetPreview: React.FC<A6SheetPreviewProps> = ({
  values,
  layout,
  header,
  forceWritingLineStyle,
  showGuides,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableW = el.clientWidth - 28; // leave space for left inch ruler
      const nextScale = Math.min(1.06, Math.max(0.55, availableW / SHEET_W_PX));
      setScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaledW = SHEET_W_PX * scale;
  const scaledH = SHEET_H_PX * scale;
  const inchMarks = [0, 1, 2, 2.915, 4, 5, 5.83];

  return (
    <div ref={wrapperRef} className="w-full flex flex-col items-center">
      {/* Top width indicator */}
      <div
        className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5 pl-7"
        style={{ width: `${scaledW + 28}px` }}
      >
        <span>0&quot;</span>
        <span>A6 Width · 4.13&quot; (105 mm)</span>
        <span>4.13&quot;</span>
      </div>

      <div className="flex items-start">
        {/* Left vertical inch ruler */}
        <div
          className="relative w-7 shrink-0 select-none"
          style={{ height: `${scaledH}px` }}
        >
          {inchMarks.map((mark) => {
            const topPct = (mark / A6_HEIGHT_IN) * 100;
            const isHalf = mark === 2.915;
            return (
              <div
                key={mark}
                className="absolute right-1.5 flex items-center gap-1 -translate-y-1/2"
                style={{ top: `${topPct}%` }}
              >
                <span
                  className={`text-[9px] font-mono leading-none ${
                    isHalf ? 'text-blue-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {isHalf ? '½' : `${mark}"`}
                </span>
                <span
                  className={`block h-px ${
                    isHalf ? 'w-2 bg-blue-500' : 'w-1.5 bg-slate-300'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Crisp Paper Sheet Container */}
        <div
          className="relative bg-white border border-slate-300/90 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.12)] overflow-hidden"
          style={{
            width: `${scaledW}px`,
            height: `${scaledH}px`,
          }}
        >
          <div
            style={{
              width: `${SHEET_W_PX}px`,
              height: `${SHEET_H_PX}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <A6SheetCanvas
              values={values}
              layout={layout}
              header={header}
              forceWritingLineStyle={forceWritingLineStyle}
              showGuides={showGuides}
              forPrint={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
