import React from 'react';
import { Download, Printer, RotateCcw } from 'lucide-react';
import {
  BlankLineStyle,
  BlankTemplateConfig,
  FIELD_DEFINITIONS,
  FieldKey,
} from '../types/idCard';

interface BlankTemplatePanelProps {
  config: BlankTemplateConfig;
  onChange: (next: BlankTemplateConfig) => void;
  onExportBlankPdf: () => void;
  onPrintBlank: () => void;
}

const LINE_STYLE_OPTIONS: { value: BlankLineStyle; label: string }[] = [
  { value: 'dotted', label: 'Dotted Line' },
  { value: 'solid', label: 'Solid Line' },
  { value: 'none', label: 'Labels Only' },
];

const COPY_PRESETS = [1, 5, 10, 25];

export const BlankTemplatePanel: React.FC<BlankTemplatePanelProps> = ({
  config,
  onChange,
  onExportBlankPdf,
  onPrintBlank,
}) => {
  const handlePrefillChange = (key: FieldKey, value: string) => {
    const nextPrefilled = { ...config.prefilled };
    if (value === '') {
      delete nextPrefilled[key];
    } else {
      nextPrefilled[key] = value;
    }
    onChange({ ...config, prefilled: nextPrefilled });
  };

  const handleClearPrefills = () => {
    onChange({ ...config, prefilled: {} });
  };

  const prefilledCount = Object.values(config.prefilled).filter(
    (v) => (v ?? '').trim().length > 0
  ).length;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Blank Hand-Fill Print Template
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Print ready-to-write A6 sheets with all 8 labels below the half-page mark so staff can write individual student details by hand without Excel.
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* Writing Line Style & Copies Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <span className="block text-xs font-medium text-slate-700 mb-2">
                Hand-Writing Line Style
              </span>
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-md gap-1">
                {LINE_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...config, lineStyle: opt.value })}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      config.lineStyle === opt.value
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
                Pages in Exported PDF
              </span>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-md gap-1">
                  {COPY_PRESETS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onChange({ ...config, copies: num })}
                      className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        config.copies === num
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={config.copies}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    onChange({
                      ...config,
                      copies: Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(100, parsed)),
                    });
                  }}
                  aria-label="Custom copy count"
                  className="w-16 h-8 px-2 text-xs font-mono text-center bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Optional Shared Pre-fills */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-800">
                  Optional Pre-filled Fields (Leave Blank to Write by Hand)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  For example, pre-print Campus or Enrollment in bold while leaving Name, ID.No, and Phone blank for pen entry.
                </p>
              </div>
              {prefilledCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearPrefills}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIELD_DEFINITIONS.map((field) => (
                <label key={field.key} className="block">
                  <span className="block text-[11px] font-medium text-slate-600 mb-1">
                    {field.label}
                  </span>
                  <input
                    type="text"
                    value={config.prefilled[field.key] ?? ''}
                    onChange={(e) => handlePrefillChange(field.key, e.target.value)}
                    placeholder="Leave blank for handwriting"
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 tabular-nums">
              {config.copies} A6 {config.copies === 1 ? 'page' : 'pages'} · {8 - prefilledCount} blank hand-fill {8 - prefilledCount === 1 ? 'line' : 'lines'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrintBlank}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Blank Sheet
              </button>
              <button
                type="button"
                onClick={onExportBlankPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Blank A6 PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
