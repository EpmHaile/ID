import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Printer,
} from 'lucide-react';
import { A6SheetCanvas, A6SheetPreview } from './components/A6SheetPreview';
import { BlankTemplatePanel } from './components/BlankTemplatePanel';
import { ExcelMergePanel } from './components/ExcelMergePanel';
import { IndividualFormPanel } from './components/IndividualFormPanel';
import { PageSetupPanel } from './components/PageSetupPanel';
import {
  A6_HEIGHT_IN,
  A6_WIDTH_IN,
  BlankLineStyle,
  BlankTemplateConfig,
  createEmptyStudent,
  DEFAULT_BLANK_CONFIG,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_LAYOUT_CONFIG,
  FIELD_DEFINITIONS,
  FieldKey,
  HeaderConfig,
  LayoutConfig,
  StudentRecord,
  WorkspaceTab,
} from './types/idCard';
import { getDemoStudents } from './utils/excel';
import {
  exportBlankHandFillPdf,
  exportStudentsToA6Pdf,
} from './utils/pdfGenerator';

const STORAGE_LAYOUT_KEY = 'cardpress_a6_layout_v1';
const STORAGE_HEADER_KEY = 'cardpress_a6_header_v1';

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

const NAV_TABS: { id: WorkspaceTab; label: string }[] = [
  { id: 'excel', label: 'Excel Mail Merge' },
  { id: 'individual', label: 'Individual Student' },
  { id: 'blank', label: 'Blank Hand-Fill' },
  { id: 'setup', label: 'Page Setup' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('excel');

  // Batch roster state (initialized with demo students so live preview is immediately tangible)
  const [students, setStudents] = useState<StudentRecord[]>(() => getDemoStudents());
  const [importSourceLabel, setImportSourceLabel] = useState<string | null>(
    'Sample Roster (replace with your Excel file)'
  );
  const [activeStudentId, setActiveStudentId] = useState<string | null>(
    () => getDemoStudents()[0]?.id ?? null
  );

  // Individual manual student form state
  const [individualStudent, setIndividualStudent] = useState<StudentRecord>(() =>
    createEmptyStudent('individual-entry')
  );

  // Blank hand-fill template state
  const [blankConfig, setBlankConfig] = useState<BlankTemplateConfig>(DEFAULT_BLANK_CONFIG);

  // Persistent A6 calibration & top-half header state
  const [layout, setLayout] = useState<LayoutConfig>(() =>
    loadStoredJson(STORAGE_LAYOUT_KEY, DEFAULT_LAYOUT_CONFIG)
  );
  const [header, setHeader] = useState<HeaderConfig>(() => {
    const loaded = loadStoredJson(STORAGE_HEADER_KEY, DEFAULT_HEADER_CONFIG);
    if (loaded.institutionName === 'ST. MARY UNIVERSITY COLLEGE') {
      return { ...loaded, institutionName: 'UNITY UNIVERSITY' };
    }
    return loaded;
  });

  const [showGuides, setShowGuides] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'single' | 'batch' | 'blank'>('single');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(layout));
    } catch {
      // Ignore storage quota errors
    }
  }, [layout]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_HEADER_KEY, JSON.stringify(header));
    } catch {
      // Ignore storage quota errors (e.g. very large logo)
    }
  }, [header]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Active student lookup for Excel / Setup preview
  const activeStudentIndex = useMemo(() => {
    if (students.length === 0) return -1;
    const idx = students.findIndex((s) => s.id === activeStudentId);
    return idx >= 0 ? idx : 0;
  }, [students, activeStudentId]);

  const activeBatchStudent =
    activeStudentIndex >= 0 ? students[activeStudentIndex] : null;

  const selectedBatchStudents = useMemo(
    () => students.filter((s) => s.selected),
    [students]
  );

  // Handlers for Excel roster
  const handleReplaceStudents = (nextStudents: StudentRecord[], sourceLabel: string) => {
    setStudents(nextStudents);
    setImportSourceLabel(sourceLabel);
    setActiveStudentId(nextStudents[0]?.id ?? null);
    showToast(`Imported ${nextStudents.length} student records from ${sourceLabel}`);
  };

  const handleLoadDemo = () => {
    const demo = getDemoStudents();
    setStudents(demo);
    setImportSourceLabel('Sample Roster (5 students)');
    setActiveStudentId(demo[0]?.id ?? null);
    showToast('Loaded 5 sample student records.');
  };

  const handleUpdateStudent = (updated: StudentRecord) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast('Student record updated.');
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeStudentId === id) {
        setActiveStudentId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleToggleSelect = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleToggleSelectAll = (selectAll: boolean) => {
    setStudents((prev) => prev.map((s) => ({ ...s, selected: selectAll })));
  };

  const handleAddStudentRow = (newStudent: StudentRecord) => {
    setStudents((prev) => [newStudent, ...prev]);
    setActiveStudentId(newStudent.id);
  };

  // Handlers for Individual entry
  const handleIndividualFieldChange = (key: FieldKey, value: string) => {
    setIndividualStudent((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearIndividual = () => {
    setIndividualStudent(createEmptyStudent('individual-entry'));
  };

  const handleFillIndividualSample = () => {
    const filled = createEmptyStudent('individual-entry');
    for (const f of FIELD_DEFINITIONS) {
      filled[f.key] = f.sampleValue;
    }
    setIndividualStudent(filled);
  };

  const handleAddIndividualToBatch = () => {
    const copy: StudentRecord = {
      ...individualStudent,
      id: `manual-${Date.now()}`,
      selected: true,
    };
    setStudents((prev) => [copy, ...prev]);
    setActiveStudentId(copy.id);
    showToast(`Added ${copy.name || 'individual student'} to the batch roster.`);
  };

  // Export & Print handlers
  const handleExportBatchPdf = () => {
    const targets = selectedBatchStudents.length > 0 ? selectedBatchStudents : students;
    if (targets.length === 0) {
      showToast('Add or import at least one student before exporting.');
      return;
    }
    exportStudentsToA6Pdf(targets, layout, header, 'Student_IDs_A6_MailMerge.pdf');
    showToast(
      `Exported ${targets.length} A6 ${targets.length === 1 ? 'page' : 'pages'} (4.13" × 5.83").`
    );
  };

  const handleExportSingleCurrentPreview = () => {
    if (activeTab === 'blank') {
      exportBlankHandFillPdf(blankConfig, layout, header);
      showToast(
        `Exported ${blankConfig.copies} blank hand-fill A6 ${
          blankConfig.copies === 1 ? 'page' : 'pages'
        }.`
      );
      return;
    }

    const record =
      activeTab === 'individual'
        ? individualStudent
        : activeBatchStudent ?? createEmptyStudent();

    const safeName = (record.idNo || record.name || 'Student')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 32);

    exportStudentsToA6Pdf([record], layout, header, `ID_${safeName}_A6.pdf`);
    showToast(`Exported single A6 PDF for ${record.name || record.idNo || 'student'}.`);
  };

  const handlePrimaryTopBarExport = () => {
    if (activeTab === 'blank') {
      exportBlankHandFillPdf(blankConfig, layout, header);
      showToast(
        `Exported ${blankConfig.copies} blank hand-fill A6 ${
          blankConfig.copies === 1 ? 'page' : 'pages'
        }.`
      );
    } else if (activeTab === 'individual') {
      handleExportSingleCurrentPreview();
    } else {
      handleExportBatchPdf();
    }
  };

  const triggerBrowserPrint = (mode: 'single' | 'batch' | 'blank') => {
    setPrintMode(mode);
    window.setTimeout(() => {
      window.print();
    }, 60);
  };

  // Determine what the live A6 preview shows right now
  const previewPayload = useMemo<{
    values: Partial<Record<FieldKey, string>>;
    forceWritingLineStyle?: BlankLineStyle;
    caption: string;
  }>(() => {
    if (activeTab === 'blank') {
      return {
        values: blankConfig.prefilled,
        forceWritingLineStyle: blankConfig.lineStyle,
        caption: `Blank Hand-Fill Template · ${blankConfig.copies} ${
          blankConfig.copies === 1 ? 'copy' : 'copies'
        }`,
      };
    }
    if (activeTab === 'individual') {
      return {
        values: individualStudent,
        caption: individualStudent.name.trim()
          ? `Individual · ${individualStudent.name}`
          : 'Individual Student Sheet',
      };
    }
    if (activeBatchStudent) {
      return {
        values: activeBatchStudent,
        caption: `Student ${activeStudentIndex + 1} of ${students.length} · ${
          activeBatchStudent.name || activeBatchStudent.idNo || 'Untitled'
        }`,
      };
    }
    return {
      values: {},
      caption: 'Empty A6 Sheet Preview',
    };
  }, [
    activeTab,
    blankConfig,
    individualStudent,
    activeBatchStudent,
    activeStudentIndex,
    students.length,
  ]);

  const primaryCtaLabel = useMemo(() => {
    if (activeTab === 'blank') {
      return `Export Blank PDF (${blankConfig.copies})`;
    }
    if (activeTab === 'individual') {
      return 'Export Single A6 PDF';
    }
    const count = selectedBatchStudents.length;
    return count > 0 ? `Export A6 PDF (${count})` : 'Export A6 PDF';
  }, [activeTab, blankConfig.copies, selectedBatchStudents.length]);

  const handlePrevStudent = () => {
    if (students.length === 0) return;
    const prevIdx = (activeStudentIndex - 1 + students.length) % students.length;
    setActiveStudentId(students[prevIdx].id);
  };

  const handleNextStudent = () => {
    if (students.length === 0) return;
    const nextIdx = (activeStudentIndex + 1) % students.length;
    setActiveStudentId(students[nextIdx].id);
  };

  // Pages to render inside the print-only container when user invokes browser Print
  const printPages = useMemo<
    { key: string; values: Partial<Record<FieldKey, string>>; lineStyle?: BlankLineStyle }[]
  >(() => {
    if (printMode === 'blank') {
      const count = Math.max(1, Math.min(25, blankConfig.copies));
      return Array.from({ length: count }, (_, idx) => ({
        key: `blank-${idx}`,
        values: blankConfig.prefilled,
        lineStyle: blankConfig.lineStyle,
      }));
    }
    if (printMode === 'batch') {
      const list = selectedBatchStudents.length > 0 ? selectedBatchStudents : students;
      return list.map((s) => ({ key: s.id, values: s }));
    }
    return [
      {
        key: 'single-preview',
        values: previewPayload.values,
        lineStyle: previewPayload.forceWritingLineStyle,
      },
    ];
  }, [printMode, blankConfig, selectedBatchStudents, students, previewPayload]);

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#F6F7F9] text-slate-900 no-print">
        {/* Top Bar Contract: 3 zones, 1 row, clean typography */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
            {/* Zone 1: Brand Wordmark */}
            <button
              type="button"
              onClick={() => setActiveTab('excel')}
              className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              CardPress A6
            </button>

            {/* Zone 2: Clean Single-Line Nav Tabs */}
            <nav
              aria-label="Workspace modes"
              className="hidden md:flex items-center gap-7 text-sm font-medium"
            >
              {NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative h-14 inline-flex items-center transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-slate-950 font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: 1 Primary CTA */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={handlePrimaryTopBarExport}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {primaryCtaLabel}
              </button>
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <div className="md:hidden border-t border-slate-100 px-4 overflow-x-auto">
            <div className="flex items-center gap-5 h-10 text-xs font-medium">
              {NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-full inline-flex items-center border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-blue-700 text-slate-950 font-semibold'
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Main 2-Column Studio Workspace */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
          {/* Quiet Context Strip (unboxed metadata, no pills) */}
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900">
                {activeTab === 'excel' && 'Excel Mail Merge to A6 PDF'}
                {activeTab === 'individual' && 'Individual Student ID Card'}
                {activeTab === 'blank' && 'Blank Hand-Fill ID Template'}
                {activeTab === 'setup' && 'A6 Page Setup & Print Calibration'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">
                  Paper: A6 ({A6_WIDTH_IN}&quot; × {A6_HEIGHT_IN}&quot;)
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Top half:{' '}
                  {header.mode === 'preprinted'
                    ? 'Pre-printed (blank in PDF)'
                    : 'Digital header'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  Fields start at Y = {layout.startYIn.toFixed(2)}&quot;
                </span>
              </div>
            </div>

            {activeTab === 'excel' && students.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint('batch')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Selected ({selectedBatchStudents.length || students.length})
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Primary Workspace */}
            <section className="lg:col-span-7 min-w-0">
              {activeTab === 'excel' && (
                <ExcelMergePanel
                  students={students}
                  activeStudentId={activeBatchStudent?.id ?? null}
                  onSelectActiveStudent={(id) => setActiveStudentId(id)}
                  onReplaceStudents={handleReplaceStudents}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onAddStudentRow={handleAddStudentRow}
                  onLoadDemo={handleLoadDemo}
                  importSourceLabel={importSourceLabel}
                />
              )}

              {activeTab === 'individual' && (
                <IndividualFormPanel
                  student={individualStudent}
                  onChangeField={handleIndividualFieldChange}
                  onClear={handleClearIndividual}
                  onFillSample={handleFillIndividualSample}
                  onAddToBatch={handleAddIndividualToBatch}
                  onExportSinglePdf={handleExportSingleCurrentPreview}
                  onPrintSingle={() => triggerBrowserPrint('single')}
                  showWritingLineOnEmpty={layout.showWritingLineOnEmpty}
                  onToggleWritingLineOnEmpty={(next) =>
                    setLayout((prev) => ({ ...prev, showWritingLineOnEmpty: next }))
                  }
                />
              )}

              {activeTab === 'blank' && (
                <BlankTemplatePanel
                  config={blankConfig}
                  onChange={setBlankConfig}
                  onExportBlankPdf={handlePrimaryTopBarExport}
                  onPrintBlank={() => triggerBrowserPrint('blank')}
                />
              )}

              {activeTab === 'setup' && (
                <PageSetupPanel
                  layout={layout}
                  header={header}
                  onChangeLayout={setLayout}
                  onChangeHeader={setHeader}
                  onResetDefaults={() => {
                    setLayout(DEFAULT_LAYOUT_CONFIG);
                    setHeader(DEFAULT_HEADER_CONFIG);
                    showToast('Reset A6 calibration and header to default settings.');
                  }}
                />
              )}
            </section>

            {/* Right Sticky Live A6 Paper Preview */}
            <aside className="lg:col-span-5 lg:sticky lg:top-20">
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                {/* Preview Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900">
                      Live A6 Print Preview
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {previewPayload.caption}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGuides((g) => !g)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {showGuides ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide Guides
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Show Guides
                      </>
                    )}
                  </button>
                </div>

                {/* Paper Desk Stage */}
                <div className="bg-[#EAEEF3] px-4 py-6 flex flex-col items-center justify-center">
                  <A6SheetPreview
                    values={previewPayload.values}
                    layout={layout}
                    header={header}
                    forceWritingLineStyle={previewPayload.forceWritingLineStyle}
                    showGuides={showGuides}
                  />
                </div>

                {/* Preview Footer Controls */}
                <div className="px-4 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
                  {(activeTab === 'excel' || activeTab === 'setup') && students.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevStudent}
                        disabled={students.length <= 1}
                        className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        aria-label="Previous student"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono text-slate-600 px-1.5 tabular-nums">
                        {activeStudentIndex + 1} / {students.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextStudent}
                        disabled={students.length <= 1}
                        className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        aria-label="Next student"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">
                      1 student / A6 page
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        triggerBrowserPrint(activeTab === 'blank' ? 'blank' : 'single')
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Page
                    </button>
                    <button
                      type="button"
                      onClick={handleExportSingleCurrentPreview}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      This Page PDF
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* Subtle Action Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-md shadow-lg border border-slate-800"
          >
            {toastMessage}
          </div>
        )}
      </div>

      {/* Exact 4.13" x 5.83" A6 Print Output Container (only visible during window.print()) */}
      <div className="hidden print-only-container">
        {printPages.map((page) => (
          <div key={page.key} className="print-a6-page">
            <A6SheetCanvas
              values={page.values}
              layout={layout}
              header={header}
              forceWritingLineStyle={page.lineStyle}
              showGuides={false}
              forPrint={true}
            />
          </div>
        ))}
      </div>
    </>
  );
}
