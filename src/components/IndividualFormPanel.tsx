import React from 'react';
import { ChevronDown, Download, Plus, Printer, RotateCcw, Sparkles } from 'lucide-react';
import {
  CAMPUS_OPTIONS,
  DEPARTMENTS_BY_PROGRAM,
  ENROLLMENT_OPTIONS,
  FIELD_DEFINITIONS,
  FieldKey,
  PROGRAM_OPTIONS,
  ProgramOption,
  StudentRecord,
} from '../types/idCard';

interface IndividualFormPanelProps {
  student: StudentRecord;
  onChangeField: (key: FieldKey, value: string) => void;
  onClear: () => void;
  onFillSample: () => void;
  onAddToBatch: () => void;
  onExportSinglePdf: () => void;
  onPrintSingle: () => void;
  showWritingLineOnEmpty: boolean;
  onToggleWritingLineOnEmpty: (next: boolean) => void;
}

function isProgramOption(val: string): val is ProgramOption {
  return (PROGRAM_OPTIONS as readonly string[]).includes(val);
}

const SELECT_BASE_CLASS =
  'w-full h-10 pl-3 pr-9 text-sm bg-white border border-slate-200 rounded-md text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors cursor-pointer';

const INPUT_BASE_CLASS =
  'w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors';

export const IndividualFormPanel: React.FC<IndividualFormPanelProps> = ({
  student,
  onChangeField,
  onClear,
  onFillSample,
  onAddToBatch,
  onExportSinglePdf,
  onPrintSingle,
  showWritingLineOnEmpty,
  onToggleWritingLineOnEmpty,
}) => {
  const filledCount = FIELD_DEFINITIONS.filter(
    (f) => student[f.key].trim().length > 0
  ).length;

  const activeProgram: ProgramOption | null = isProgramOption(student.program)
    ? student.program
    : null;

  const filteredDepartments: readonly string[] = activeProgram
    ? DEPARTMENTS_BY_PROGRAM[activeProgram]
    : [];

  const handleProgramChange = (nextProgram: string) => {
    onChangeField('program', nextProgram);
    if (isProgramOption(nextProgram)) {
      const validDepts = DEPARTMENTS_BY_PROGRAM[nextProgram];
      if (student.department && !validDepts.includes(student.department)) {
        onChangeField('department', '');
      }
    }
  };

  const renderBlankHint = (val: string) =>
    val.trim().length === 0 && showWritingLineOnEmpty ? (
      <span className="text-[11px] font-normal text-slate-400">
        Prints writing line
      </span>
    ) : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Individual Student Entry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in one student directly without Excel. Values print in bold directly in front of each label below the half-page line.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onFillSample}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            Sample Data
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ID.No */}
          <label className="block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>ID.No:</span>
              {renderBlankHint(student.idNo)}
            </span>
            <input
              type="text"
              value={student.idNo}
              onChange={(e) => onChangeField('idNo', e.target.value)}
              placeholder="e.g. STU-2026-0142"
              className={`${INPUT_BASE_CLASS} font-mono text-[13px]`}
            />
          </label>

          {/* Phone No */}
          <label className="block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>Phone No:</span>
              {renderBlankHint(student.phoneNo)}
            </span>
            <input
              type="text"
              value={student.phoneNo}
              onChange={(e) => onChangeField('phoneNo', e.target.value)}
              placeholder="e.g. +251 911 234 567"
              className={`${INPUT_BASE_CLASS} font-mono text-[13px]`}
            />
          </label>

          {/* Name */}
          <label className="sm:col-span-2 block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>Name:</span>
              {renderBlankHint(student.name)}
            </span>
            <input
              type="text"
              value={student.name}
              onChange={(e) => onChangeField('name', e.target.value)}
              placeholder="e.g. Selamawit Tesfaye Bekele"
              className={INPUT_BASE_CLASS}
            />
          </label>

          {/* Address */}
          <label className="sm:col-span-2 block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>Address:</span>
              {renderBlankHint(student.address)}
            </span>
            <input
              type="text"
              value={student.address}
              onChange={(e) => onChangeField('address', e.target.value)}
              placeholder="e.g. Bole Sub-City, Woreda 03, Addis Ababa"
              className={INPUT_BASE_CLASS}
            />
          </label>

          {/* Campus Dropdown (Gerji 1st) */}
          <label className="block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>Campus:</span>
              {renderBlankHint(student.campus)}
            </span>
            <div className="relative">
              <select
                value={student.campus}
                onChange={(e) => onChangeField('campus', e.target.value)}
                className={`${SELECT_BASE_CLASS} ${
                  student.campus ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <option value="">Select campus...</option>
                {CAMPUS_OPTIONS.map((campus) => (
                  <option key={campus} value={campus} className="text-slate-900">
                    {campus}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </label>

          {/* Enrollment Dropdown */}
          <label className="block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>Enrollment:</span>
              {renderBlankHint(student.enrollment)}
            </span>
            <div className="relative">
              <select
                value={student.enrollment}
                onChange={(e) => onChangeField('enrollment', e.target.value)}
                className={`${SELECT_BASE_CLASS} ${
                  student.enrollment ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <option value="">Select enrollment...</option>
                {ENROLLMENT_OPTIONS.map((enrollment) => (
                  <option key={enrollment} value={enrollment} className="text-slate-900">
                    {enrollment}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </label>

          {/* Program Dropdown */}
          <label className="block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>Program:</span>
              {renderBlankHint(student.program)}
            </span>
            <div className="relative">
              <select
                value={student.program}
                onChange={(e) => handleProgramChange(e.target.value)}
                className={`${SELECT_BASE_CLASS} ${
                  student.program ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <option value="">Select program...</option>
                {PROGRAM_OPTIONS.map((program) => (
                  <option key={program} value={program} className="text-slate-900">
                    {program}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </label>

          {/* Department Dropdown (Filtered by Program) */}
          <label className="block">
            <span className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>
                Department:
                {activeProgram && (
                  <span className="font-normal text-slate-400 ml-1">
                    ({activeProgram})
                  </span>
                )}
              </span>
              {renderBlankHint(student.department)}
            </span>
            <div className="relative">
              <select
                value={student.department}
                onChange={(e) => onChangeField('department', e.target.value)}
                className={`${SELECT_BASE_CLASS} ${
                  student.department ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <option value="">
                  {activeProgram
                    ? `Select ${activeProgram} department...`
                    : 'Select program first or choose department...'}
                </option>
                {activeProgram
                  ? filteredDepartments.map((dept) => (
                      <option key={dept} value={dept} className="text-slate-900">
                        {dept}
                      </option>
                    ))
                  : PROGRAM_OPTIONS.map((prog) => (
                      <optgroup key={prog} label={prog} className="text-slate-700 font-semibold">
                        {DEPARTMENTS_BY_PROGRAM[prog].map((dept) => (
                          <option
                            key={`${prog}-${dept}`}
                            value={dept}
                            className="text-slate-900 font-normal"
                          >
                            {dept}
                          </option>
                        ))}
                      </optgroup>
                    ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </label>
        </div>

        {/* Hybrid Pen-Fill Helper Toggle */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-800">
              Draw hand-writing lines on empty fields
            </p>
            <p className="text-[11px] text-slate-500">
              Leave any field empty to print a clean pen line next to its label (useful for partial hand-fill cards).
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showWritingLineOnEmpty}
            onClick={() => onToggleWritingLineOnEmpty(!showWritingLineOnEmpty)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              showWritingLineOnEmpty ? 'bg-blue-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                showWritingLineOnEmpty ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Action Row */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500 tabular-nums">
            {filledCount} of 8 fields filled · 1 A6 page (4.13&quot; × 5.83&quot;)
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddToBatch}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Batch Roster
            </button>
            <button
              type="button"
              onClick={onPrintSingle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print A6
            </button>
            <button
              type="button"
              onClick={onExportSinglePdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Single A6 PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
