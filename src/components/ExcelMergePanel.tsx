import React, { useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ColumnMapping,
  createEmptyStudent,
  FIELD_DEFINITIONS,
  FieldKey,
  StudentRecord,
} from '../types/idCard';
import {
  applyMappingToRows,
  downloadSampleExcelTemplate,
  ParsedExcelResult,
  parseExcelFile,
} from '../utils/excel';

interface ExcelMergePanelProps {
  students: StudentRecord[];
  activeStudentId: string | null;
  onSelectActiveStudent: (id: string) => void;
  onReplaceStudents: (students: StudentRecord[], sourceLabel: string) => void;
  onUpdateStudent: (student: StudentRecord) => void;
  onDeleteStudent: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (selectAll: boolean) => void;
  onAddStudentRow: (student: StudentRecord) => void;
  onLoadDemo: () => void;
  importSourceLabel: string | null;
}

export const ExcelMergePanel: React.FC<ExcelMergePanelProps> = ({
  students,
  activeStudentId,
  onSelectActiveStudent,
  onReplaceStudents,
  onUpdateStudent,
  onDeleteStudent,
  onToggleSelect,
  onToggleSelectAll,
  onAddStudentRow,
  onLoadDemo,
  importSourceLabel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedExcel, setParsedExcel] = useState<ParsedExcelResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    try {
      const result = await parseExcelFile(file);
      setParsedExcel(result);
      setColumnMapping(result.suggestedMapping);
      const mappedStudents = applyMappingToRows(result.rawRows, result.suggestedMapping);
      onReplaceStudents(mappedStudents, `${result.fileName} (${result.sheetName})`);

      // Auto-open mapper only if fewer than 6 of 8 fields auto-matched
      const matchedCount = Object.values(result.suggestedMapping).filter(Boolean).length;
      setShowMapper(matchedCount < 6);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Unable to read this Excel or CSV file.'
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleMappingChange = (fieldKey: FieldKey, headerName: string) => {
    if (!parsedExcel || !columnMapping) return;
    const nextMapping: ColumnMapping = {
      ...columnMapping,
      [fieldKey]: headerName,
    };
    setColumnMapping(nextMapping);
    const remapped = applyMappingToRows(parsedExcel.rawRows, nextMapping);
    onReplaceStudents(remapped, `${parsedExcel.fileName} (${parsedExcel.sheetName})`);
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.idNo, s.name, s.campus, s.department, s.program, s.phoneNo, s.enrollment, s.address]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [students, searchQuery]);

  const selectedCount = useMemo(
    () => students.filter((s) => s.selected).length,
    [students]
  );

  const allSelected = students.length > 0 && selectedCount === students.length;

  const handleAddEmptyRow = () => {
    const newRow = createEmptyStudent();
    onAddStudentRow(newRow);
    setEditingStudent(newRow);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    onUpdateStudent(editingStudent);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-5">
      {/* Import Dropzone Bar */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border transition-colors p-5 bg-white ${
          isDragging
            ? 'border-blue-600 bg-blue-50/40'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                Import Student Excel Sheet
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Drop an .xlsx, .xls, or .csv roster here. Each row generates one separate A6 page (4.13&quot; × 5.83&quot;).
              </p>
              {importSourceLabel && (
                <p className="text-xs text-slate-600 mt-1.5 font-mono truncate">
                  Active source: {importSourceLabel} · {students.length} rows
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Excel
            </button>
            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Sample .xlsx
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 pt-3 border-t border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
            <span>Import error: {uploadError}</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Column Mapping Section (appears once an Excel file is parsed) */}
      {parsedExcel && columnMapping && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMapper((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-900">Excel Column Mapping</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 tabular-nums">
                {Object.values(columnMapping).filter(Boolean).length} of 8 fields linked
              </span>
            </div>
            <span className="text-slate-500 flex items-center gap-1 text-xs">
              {showMapper ? 'Hide' : 'Adjust columns'}
              {showMapper ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </span>
          </button>

          {showMapper && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FIELD_DEFINITIONS.map((field) => (
                <label key={field.key} className="block">
                  <span className="block text-[11px] font-medium text-slate-600 mb-1">
                    {field.label}
                  </span>
                  <select
                    value={columnMapping[field.key]}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    <option value="">— Unmapped (blank) —</option>
                    {parsedExcel.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Roster Table Card */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 whitespace-nowrap">
              Merged Student Roster
            </h3>
            <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
              {selectedCount} of {students.length} selected for PDF
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, name, dept..."
                className="h-8 pl-8 pr-3 w-48 sm:w-56 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <button
              type="button"
              onClick={handleAddEmptyRow}
              className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          </div>
        </div>

        {/* Table Content or Empty State */}
        {students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              No student records imported yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Upload your Excel spreadsheet containing ID.No, Name, Address, Phone No, Campus, Department, Program, and Enrollment—or load a sample roster to preview the A6 mail merge right away.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer"
              >
                Choose Excel File
              </button>
              <button
                type="button"
                onClick={onLoadDemo}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
              >
                Load 5 Sample Students
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[470px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 pl-4 pr-2 w-9">
                    <button
                      type="button"
                      onClick={() => onToggleSelectAll(!allSelected)}
                      className="text-slate-500 hover:text-slate-900 flex items-center cursor-pointer"
                      aria-label={allSelected ? 'Deselect all students' : 'Select all students'}
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-2 w-10 text-right font-mono">#</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">ID.No</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Name</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Department</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Campus</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap">Program</th>
                  <th className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((student, index) => {
                  const isActive = student.id === activeStudentId;
                  return (
                    <tr
                      key={student.id}
                      onClick={() => onSelectActiveStudent(student.id)}
                      className={`cursor-pointer transition-colors ${
                        isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td
                        className="py-2.5 pl-4 pr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleSelect(student.id)}
                          className="text-slate-400 hover:text-slate-800 flex items-center cursor-pointer"
                          aria-label={`Select ${student.name || 'student'}`}
                        >
                          {student.selected ? (
                            <CheckSquare className="w-4 h-4 text-blue-700" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {student.idNo || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2.5 font-medium text-slate-900 max-w-[170px] truncate">
                        {student.name || <span className="text-slate-400 font-normal">Untitled</span>}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 max-w-[150px] truncate">
                        {student.department || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                        {student.campus || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 max-w-[130px] truncate">
                        {student.program || <span className="text-slate-300">—</span>}
                      </td>
                      <td
                        className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectActiveStudent(student.id);
                              setEditingStudent({ ...student });
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                            title="Edit student fields"
                            aria-label="Edit student"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStudent(student.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove row"
                            aria-label="Delete student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                      No students match &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline Edit Modal */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setEditingStudent(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Edit Student Record
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {FIELD_DEFINITIONS.map((field) => (
                  <label
                    key={field.key}
                    className={field.key === 'address' || field.key === 'name' ? 'sm:col-span-2 block' : 'block'}
                  >
                    <span className="block text-xs font-medium text-slate-700 mb-1">
                      {field.label}
                    </span>
                    <input
                      type="text"
                      value={editingStudent[field.key]}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </label>
                ))}
              </div>
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
