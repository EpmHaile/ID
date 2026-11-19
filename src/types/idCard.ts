export type FieldKey =
  | 'idNo'
  | 'name'
  | 'address'
  | 'phoneNo'
  | 'campus'
  | 'department'
  | 'program'
  | 'enrollment';

export interface FieldDefinition {
  key: FieldKey;
  label: string; // Printed exact label including colon
  shortLabel: string;
  placeholder: string;
  sampleValue: string;
  aliases: string[];
}

export const A6_WIDTH_IN = 4.13;
export const A6_HEIGHT_IN = 5.83;
export const A6_HALF_HEIGHT_IN = A6_HEIGHT_IN / 2; // 2.915 in

export const PROGRAM_OPTIONS = ['TVET', 'Undergraduate', 'Postgraduate'] as const;
export type ProgramOption = (typeof PROGRAM_OPTIONS)[number];

export const CAMPUS_OPTIONS = ['Gerji', 'Adama', 'Burayu', 'Dessie'] as const;

export const ENROLLMENT_OPTIONS = ['Regular', 'Extension', 'Distance'] as const;

export const DEPARTMENTS_BY_PROGRAM: Record<ProgramOption, readonly string[]> = {
  TVET: [
    'Accounting and Finance',
    'Hardware and Networking',
    'Marketing and Sales Management',
    'Nursing',
    'Purchasing & Supply Management',
    'Human Resources Management',
    'Midwifery',
    'Pharmacy',
    'Web Development and Database Administration',
    'Building Electrical Installation',
  ],
  Undergraduate: [
    'Accounting and Finance',
    'Economics',
    'Management',
    'Marketing Management',
    'Sociology and Social Anthropology',
    'Business Administration',
    'Architecture and Urban Planning',
    'Civil Engineering',
    'Computer Science',
    'Nursing',
    'Public Health',
    'Medical Laboratory Science',
  ],
  Postgraduate: [
    'Masters of Business Administration General',
    'Development Economics',
    'Project Management',
  ],
};

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    key: 'idNo',
    label: 'ID.No:',
    shortLabel: 'ID.No',
    placeholder: 'e.g. STU-2026-0142',
    sampleValue: 'STU-2026-0142',
    aliases: ['id.no', 'id no', 'idno', 'id_no', 'id', 'student id', 'student_id', 'id number', 'id.no:'],
  },
  {
    key: 'name',
    label: 'Name:',
    shortLabel: 'Name',
    placeholder: 'e.g. Selamawit Tesfaye Bekele',
    sampleValue: 'Selamawit Tesfaye Bekele',
    aliases: ['name', 'full name', 'fullname', 'student name', 'student_name', 'full_name', 'name:'],
  },
  {
    key: 'address',
    label: 'Address:',
    shortLabel: 'Address',
    placeholder: 'e.g. Bole Sub-City, Woreda 03, Addis Ababa',
    sampleValue: 'Bole Sub-City, Woreda 03, Addis Ababa',
    aliases: ['address', 'home address', 'residence', 'location', 'city', 'street', 'address:'],
  },
  {
    key: 'phoneNo',
    label: 'Phone No:',
    shortLabel: 'Phone No',
    placeholder: 'e.g. +251 911 234 567',
    sampleValue: '+251 911 234 567',
    aliases: ['phone no', 'phone', 'phoneno', 'phone_no', 'phone number', 'mobile', 'tel', 'telephone', 'contact', 'phone no:'],
  },
  {
    key: 'campus',
    label: 'Campus:',
    shortLabel: 'Campus',
    placeholder: 'Select campus',
    sampleValue: 'Gerji',
    aliases: ['campus', 'branch', 'site', 'college campus', 'campus:'],
  },
  {
    key: 'department',
    label: 'Department:',
    shortLabel: 'Department',
    placeholder: 'Select department',
    sampleValue: 'Computer Science',
    aliases: ['department', 'dept', 'dept.', 'faculty', 'school', 'department:'],
  },
  {
    key: 'program',
    label: 'Program:',
    shortLabel: 'Program',
    placeholder: 'Select program',
    sampleValue: 'Undergraduate',
    aliases: ['program', 'programme', 'degree', 'course', 'major', 'study program', 'program:'],
  },
  {
    key: 'enrollment',
    label: 'Enrollment:',
    shortLabel: 'Enrollment',
    placeholder: 'Select enrollment',
    sampleValue: 'Regular',
    aliases: ['enrollment', 'enrolment', 'enrollment type', 'admission', 'batch', 'intake', 'year', 'status', 'enrollment:'],
  },
];

export interface StudentRecord {
  id: string;
  selected: boolean;
  idNo: string;
  name: string;
  address: string;
  phoneNo: string;
  campus: string;
  department: string;
  program: string;
  enrollment: string;
}

export type ColumnMapping = Record<FieldKey, string>;

export type WorkspaceTab = 'excel' | 'individual' | 'blank' | 'setup';

export type ValueAlignment = 'inline' | 'column';
export type PdfFontFamily = 'helvetica' | 'times' | 'courier';
export type BlankLineStyle = 'solid' | 'dotted' | 'none';
export type TopHalfMode = 'preprinted' | 'digital';

export interface HeaderConfig {
  mode: TopHalfMode;
  logoDataUrl: string | null;
  institutionName: string;
  subHeading: string;
  cardTitle: string;
  academicYear: string;
  accentColor: string;
  showPhotoPlaceholder: boolean;
}

export interface LayoutConfig {
  startYIn: number; // Default 3.05" (below exact 2.915" midpoint)
  marginXIn: number; // Left & right margin in inches
  fontSizePt: number; // 8 - 13pt
  lineGapIn: number; // Vertical step between fields
  valueAlignment: ValueAlignment; // 'inline' puts bold value directly in front of label
  labelColumnWidthIn: number; // Used when valueAlignment === 'column'
  fontFamily: PdfFontFamily;
  showMidlineRule: boolean; // Print thin rule at 2.915"
  showOuterBorder: boolean; // Optional subtle print border
  showWritingLineOnEmpty: boolean; // If a value is empty, draw a hand-write line
  writingLineStyle: BlankLineStyle;
}

export interface BlankTemplateConfig {
  copies: number;
  lineStyle: BlankLineStyle;
  prefilled: Partial<Record<FieldKey, string>>;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  startYIn: 3.08,
  marginXIn: 0.34,
  fontSizePt: 10,
  lineGapIn: 0.30,
  valueAlignment: 'inline',
  labelColumnWidthIn: 1.05,
  fontFamily: 'helvetica',
  showMidlineRule: false,
  showOuterBorder: false,
  showWritingLineOnEmpty: true,
  writingLineStyle: 'dotted',
};

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  mode: 'preprinted',
  logoDataUrl: null,
  institutionName: 'UNITY UNIVERSITY',
  subHeading: 'Office of the Registrar',
  cardTitle: 'STUDENT IDENTIFICATION CARD',
  academicYear: '2026 / 2027 Academic Year',
  accentColor: '#1E3A5F',
  showPhotoPlaceholder: true,
};

export const DEFAULT_BLANK_CONFIG: BlankTemplateConfig = {
  copies: 1,
  lineStyle: 'dotted',
  prefilled: {},
};

export function createEmptyStudent(id?: string): StudentRecord {
  return {
    id: id ?? `stu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    selected: true,
    idNo: '',
    name: '',
    address: '',
    phoneNo: '',
    campus: '',
    department: '',
    program: '',
    enrollment: '',
  };
}
