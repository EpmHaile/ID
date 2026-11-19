import * as XLSX from 'xlsx';
import {
  ColumnMapping,
  FIELD_DEFINITIONS,
  FieldKey,
  StudentRecord,
} from '../types/idCard';

export interface ParsedExcelResult {
  fileName: string;
  sheetName: string;
  headers: string[];
  rawRows: Record<string, string>[];
  suggestedMapping: ColumnMapping;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[:._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function autoMapHeaders(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    idNo: '',
    name: '',
    address: '',
    phoneNo: '',
    campus: '',
    department: '',
    program: '',
    enrollment: '',
  };

  const usedHeaders = new Set<string>();

  // Pass 1: exact normalized match against aliases
  for (const field of FIELD_DEFINITIONS) {
    const normalizedAliases = field.aliases.map(normalizeHeader);
    const exact = headers.find(
      (h) => !usedHeaders.has(h) && normalizedAliases.includes(normalizeHeader(h))
    );
    if (exact) {
      mapping[field.key] = exact;
      usedHeaders.add(exact);
    }
  }

  // Pass 2: partial substring match for remaining unmapped fields
  for (const field of FIELD_DEFINITIONS) {
    if (mapping[field.key]) continue;
    const normalizedAliases = field.aliases.map(normalizeHeader);
    const partial = headers.find((h) => {
      if (usedHeaders.has(h)) return false;
      const norm = normalizeHeader(h);
      return normalizedAliases.some((alias) => norm.includes(alias) || alias.includes(norm));
    });
    if (partial) {
      mapping[field.key] = partial;
      usedHeaders.add(partial);
    }
  }

  return mapping;
}

export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', raw: false });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The uploaded workbook contains no sheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (matrix.length < 2) {
    throw new Error('The spreadsheet needs a header row and at least one student row.');
  }

  // Find the first non-empty row to treat as headers
  const headerRowIndex = matrix.findIndex((row) =>
    row.some((cell) => String(cell ?? '').trim().length > 0)
  );
  if (headerRowIndex === -1) {
    throw new Error('Could not detect any column headers in the uploaded sheet.');
  }

  const rawHeaderRow = matrix[headerRowIndex];
  const headers: string[] = [];
  const headerCounts: Record<string, number> = {};

  rawHeaderRow.forEach((cell, idx) => {
    const base = String(cell ?? '').trim() || `Column ${idx + 1}`;
    if (headerCounts[base]) {
      headerCounts[base] += 1;
      headers.push(`${base} (${headerCounts[base]})`);
    } else {
      headerCounts[base] = 1;
      headers.push(base);
    }
  });

  const rawRows: Record<string, string>[] = [];
  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const rowArr = matrix[i];
    if (!rowArr) continue;
    const obj: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((header, colIdx) => {
      const val = String(rowArr[colIdx] ?? '').trim();
      if (val) hasValue = true;
      obj[header] = val;
    });
    if (hasValue) {
      rawRows.push(obj);
    }
  }

  if (rawRows.length === 0) {
    throw new Error('No student data rows were found below the header row.');
  }

  const suggestedMapping = autoMapHeaders(headers);

  return {
    fileName: file.name,
    sheetName,
    headers,
    rawRows,
    suggestedMapping,
  };
}

export function applyMappingToRows(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping
): StudentRecord[] {
  return rawRows.map((row, idx) => {
    const getVal = (key: FieldKey) => {
      const col = mapping[key];
      return col ? (row[col] ?? '').trim() : '';
    };

    return {
      id: `excel-row-${idx + 1}-${Date.now()}`,
      selected: true,
      idNo: getVal('idNo'),
      name: getVal('name'),
      address: getVal('address'),
      phoneNo: getVal('phoneNo'),
      campus: getVal('campus'),
      department: getVal('department'),
      program: getVal('program'),
      enrollment: getVal('enrollment'),
    };
  });
}

export function getDemoStudents(): StudentRecord[] {
  return [
    {
      id: 'demo-1',
      selected: true,
      idNo: 'STU-2026-0142',
      name: 'Selamawit Tesfaye Bekele',
      address: 'Bole Sub-City, Woreda 03, Addis Ababa',
      phoneNo: '+251 911 234 567',
      campus: 'Gerji',
      department: 'Computer Science',
      program: 'Undergraduate',
      enrollment: 'Regular',
    },
    {
      id: 'demo-2',
      selected: true,
      idNo: 'STU-2026-0143',
      name: 'Dawit Alemayehu Girma',
      address: 'Yeka Sub-City, Woreda 08, Addis Ababa',
      phoneNo: '+251 922 876 543',
      campus: 'Gerji',
      department: 'Architecture and Urban Planning',
      program: 'Undergraduate',
      enrollment: 'Regular',
    },
    {
      id: 'demo-3',
      selected: true,
      idNo: 'STU-2026-0144',
      name: 'Hanna Mekonnen Tadesse',
      address: 'Adama Kebele 04, Oromia',
      phoneNo: '+251 913 445 890',
      campus: 'Adama',
      department: 'Web Development and Database Administration',
      program: 'TVET',
      enrollment: 'Extension',
    },
    {
      id: 'demo-4',
      selected: true,
      idNo: 'STU-2026-0145',
      name: 'Yonas Hailemariam Desta',
      address: 'Burayu Sub-City, Woreda 02',
      phoneNo: '+251 911 654 321',
      campus: 'Burayu',
      department: 'Project Management',
      program: 'Postgraduate',
      enrollment: 'Distance',
    },
    {
      id: 'demo-5',
      selected: true,
      idNo: 'STU-2026-0146',
      name: 'Meron Solomon Abebe',
      address: 'Dessie Kebele 01, Amhara',
      phoneNo: '+251 930 112 778',
      campus: 'Dessie',
      department: 'Nursing',
      program: 'TVET',
      enrollment: 'Regular',
    },
  ];
}

export function downloadSampleExcelTemplate(): void {
  const sampleRows = getDemoStudents().map((s) => ({
    'ID.No': s.idNo,
    Name: s.name,
    Address: s.address,
    'Phone No': s.phoneNo,
    Campus: s.campus,
    Department: s.department,
    Program: s.program,
    Enrollment: s.enrollment,
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 26 },
    { wch: 36 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, 'Student_ID_Import_Template.xlsx');
}
