import React, { useRef } from 'react';
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import {
  A6_HALF_HEIGHT_IN,
  A6_HEIGHT_IN,
  A6_WIDTH_IN,
  HeaderConfig,
  LayoutConfig,
  PdfFontFamily,
  ValueAlignment,
} from '../types/idCard';

interface PageSetupPanelProps {
  layout: LayoutConfig;
  header: HeaderConfig;
  onChangeLayout: (next: LayoutConfig) => void;
  onChangeHeader: (next: HeaderConfig) => void;
  onResetDefaults: () => void;
}

export const PageSetupPanel: React.FC<PageSetupPanelProps> = ({
  layout,
  header,
  onChangeLayout,
  onChangeHeader,
  onResetDefaults,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeHeader({ ...header, logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isAboveMidline = layout.startYIn < A6_HALF_HEIGHT_IN;

  return (
    <div className="space-y-5">
      {/* Top Half Configuration */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Top Half of A6 Paper (0&quot; – 2.915&quot;)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep the top half blank for pre-printed ID paper, or print a digital logo and institution header.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
            {A6_WIDTH_IN}&quot; × {A6_HEIGHT_IN}&quot; A6
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChangeHeader({ ...header, mode: 'preprinted' })}
              className={`p-3.5 rounded-md border text-left transition-colors cursor-pointer ${
                header.mode === 'preprinted'
                  ? 'border-blue-700 bg-blue-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Pre-printed Paper (Blank Top Half)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Leaves 0&quot; to 2.915&quot; completely empty in the PDF so your pre-printed logo and header stay untouched.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChangeHeader({ ...header, mode: 'digital' })}
              className={`p-3.5 rounded-md border text-left transition-colors cursor-pointer ${
                header.mode === 'digital'
                  ? 'border-blue-700 bg-blue-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Print Digital Top Header
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Print your institution logo, title banner, and optional photo box onto plain blank A6 paper.
              </p>
            </button>
          </div>

          {header.mode === 'digital' && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              {/* Logo Upload */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {header.logoDataUrl ? (
                      <img
                        src={header.logoDataUrl}
                        alt="Uploaded logo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">LOGO</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">Institution Logo</p>
                    <p className="text-[11px] text-slate-500">PNG or JPG recommended</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {header.logoDataUrl ? 'Replace Logo' : 'Upload Logo'}
                  </button>
                  {header.logoDataUrl && (
                    <button
                      type="button"
                      onClick={() => onChangeHeader({ ...header, logoDataUrl: null })}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                      aria-label="Remove logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="sm:col-span-2 block">
                  <span className="block text-xs font-medium text-slate-700 mb-1">
                    Institution Name
                  </span>
                  <input
                    type="text"
                    value={header.institutionName}
                    onChange={(e) =>
                      onChangeHeader({ ...header, institutionName: e.target.value })
                    }
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-medium text-slate-700 mb-1">
                    Subtitle / Office
                  </span>
                  <input
                    type="text"
                    value={header.subHeading}
                    onChange={(e) =>
                      onChangeHeader({ ...header, subHeading: e.target.value })
                    }
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-medium text-slate-700 mb-1">
                    Card Banner Title
                  </span>
                  <input
                    type="text"
                    value={header.cardTitle}
                    onChange={(e) =>
                      onChangeHeader({ ...header, cardTitle: e.target.value })
                    }
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-medium text-slate-700 mb-1">
                    Accent Color
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={header.accentColor}
                      onChange={(e) =>
                        onChangeHeader({ ...header, accentColor: e.target.value })
                      }
                      className="h-9 w-11 p-0.5 rounded border border-slate-200 bg-white cursor-pointer"
                    />
                    <input
                      type="text"
                      value={header.accentColor}
                      onChange={(e) =>
                        onChangeHeader({ ...header, accentColor: e.target.value })
                      }
                      className="flex-1 h-9 px-2.5 text-xs font-mono bg-white border border-slate-200 rounded-md text-slate-900"
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between gap-2 pt-5">
                  <span className="text-xs font-medium text-slate-700">
                    Include Photo Box
                  </span>
                  <input
                    type="checkbox"
                    checked={header.showPhotoPlaceholder}
                    onChange={(e) =>
                      onChangeHeader({
                        ...header,
                        showPhotoPlaceholder: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lower Half Print Calibration */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Lower-Half Field Positioning &amp; Typography
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fine-tune vertical start position, margins, spacing, and bold value alignment for your printer.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Start Position from Top (Y)</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {layout.startYIn.toFixed(2)}&quot;
                </span>
              </div>
              <input
                type="range"
                min={2.6}
                max={3.75}
                step={0.02}
                value={layout.startYIn}
                onChange={(e) =>
                  onChangeLayout({ ...layout, startYIn: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-700 cursor-pointer"
              />
              <p
                className={`text-[11px] mt-1 ${
                  isAboveMidline ? 'text-amber-700 font-medium' : 'text-slate-400'
                }`}
              >
                {isAboveMidline
                  ? 'Above exact halfway mark (2.915"). Move ≥ 2.95" to stay below top half.'
                  : 'Starts cleanly below the 2.915" half-page mark.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Left &amp; Right Margin</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {layout.marginXIn.toFixed(2)}&quot;
                </span>
              </div>
              <input
                type="range"
                min={0.18}
                max={0.65}
                step={0.02}
                value={layout.marginXIn}
                onChange={(e) =>
                  onChangeLayout({ ...layout, marginXIn: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-700 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Printable text width: {(A6_WIDTH_IN - layout.marginXIn * 2).toFixed(2)}&quot;
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Font Size</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {layout.fontSizePt} pt
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={12.5}
                step={0.5}
                value={layout.fontSizePt}
                onChange={(e) =>
                  onChangeLayout({ ...layout, fontSizePt: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Row Spacing</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {layout.lineGapIn.toFixed(2)}&quot;
                </span>
              </div>
              <input
                type="range"
                min={0.22}
                max={0.38}
                step={0.01}
                value={layout.lineGapIn}
                onChange={(e) =>
                  onChangeLayout({ ...layout, lineGapIn: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Segmented Selectors */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Bold Value Placement
              </span>
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-md gap-1">
                {(
                  [
                    { value: 'inline', label: 'Directly in Front' },
                    { value: 'column', label: 'Aligned Column' },
                  ] as { value: ValueAlignment; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onChangeLayout({ ...layout, valueAlignment: opt.value })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      layout.valueAlignment === opt.value
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                PDF Typeface
              </span>
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-md gap-1">
                {(
                  [
                    { value: 'helvetica', label: 'Helvetica' },
                    { value: 'times', label: 'Times Serif' },
                    { value: 'courier', label: 'Courier Mono' },
                  ] as { value: PdfFontFamily; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onChangeLayout({ ...layout, fontFamily: opt.value })
                    }
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      layout.fontFamily === opt.value
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Print Ornament Checkboxes */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={layout.showMidlineRule}
                onChange={(e) =>
                  onChangeLayout({ ...layout, showMidlineRule: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
              />
              Print thin divider at 2.915&quot; midpoint
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={layout.showOuterBorder}
                onChange={(e) =>
                  onChangeLayout({ ...layout, showOuterBorder: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
              />
              Print subtle card border frame
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
