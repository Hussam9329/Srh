// API helper functions for the Institute Management System
import type { Student, Teacher, Installment, TeacherWithdrawal } from '@prisma/client';

const BASE = '';

// ============ STUDENTS ============

export interface StudentWithExtras extends Student {
  teachers: { teacher: Teacher }[];
  _paymentInfo?: {
    totalPaid: number;
    totalRemaining: number;
  };
}

export async function fetchStudents(search?: string): Promise<Student[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${BASE}/api/students${params}`);
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
}

export async function fetchStudent(id: number): Promise<StudentWithExtras | null> {
  const res = await fetch(`${BASE}/api/students/${id}`);
  if (!res.ok) throw new Error('Failed to fetch student');
  return res.json();
}

export async function createStudent(data: {
  name: string;
  studyType?: string;
  hasCard?: boolean;
  hasBadge?: boolean;
  status?: string;
  notes?: string;
}): Promise<Student> {
  const res = await fetch(`${BASE}/api/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create student');
  return res.json();
}

export async function updateStudent(id: number, data: Partial<Student>): Promise<Student> {
  const res = await fetch(`${BASE}/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update student');
  return res.json();
}

export async function deleteStudent(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/students/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete student');
}

// ============ TEACHERS ============

export interface TeacherWithCount extends Teacher {
  _studentCount?: number;
}

export async function fetchTeachers(search?: string): Promise<Teacher[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${BASE}/api/teachers${params}`);
  if (!res.ok) throw new Error('Failed to fetch teachers');
  return res.json();
}

export async function fetchTeacher(id: number): Promise<TeacherWithCount> {
  const res = await fetch(`${BASE}/api/teachers/${id}`);
  if (!res.ok) throw new Error('Failed to fetch teacher');
  return res.json();
}

export async function createTeacher(data: {
  name: string;
  subject: string;
  totalFee?: number;
  institutePercentage?: number;
  notes?: string;
}): Promise<Teacher> {
  const res = await fetch(`${BASE}/api/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create teacher');
  return res.json();
}

export async function updateTeacher(id: number, data: Partial<Teacher>): Promise<Teacher> {
  const res = await fetch(`${BASE}/api/teachers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update teacher');
  return res.json();
}

export async function deleteTeacher(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/teachers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete teacher');
}

export async function fetchTeacherStudents(teacherId: number) {
  const res = await fetch(`${BASE}/api/teachers/${teacherId}/students`);
  if (!res.ok) throw new Error('Failed to fetch teacher students');
  return res.json();
}

// ============ STUDENT-TEACHER LINKS ============

export async function linkStudentTeacher(studentId: number, teacherId: number): Promise<void> {
  const res = await fetch(`${BASE}/api/student-teacher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, teacherId }),
  });
  if (!res.ok) throw new Error('Failed to link student to teacher');
}

export async function unlinkStudentTeacher(studentId: number, teacherId: number): Promise<void> {
  const res = await fetch(
    `${BASE}/api/student-teacher?studentId=${studentId}&teacherId=${teacherId}`,
    { method: 'DELETE' }
  );
  if (!res.ok) throw new Error('Failed to unlink student from teacher');
}

// ============ INSTALLMENTS ============

export async function fetchInstallments(studentId: number, teacherId: number): Promise<Installment[]> {
  const res = await fetch(`${BASE}/api/installments?studentId=${studentId}&teacherId=${teacherId}`);
  if (!res.ok) throw new Error('Failed to fetch installments');
  return res.json();
}

export async function createInstallment(data: {
  studentId: number;
  teacherId: number;
  amount: number;
  notes?: string;
  installmentType?: string;
}): Promise<Installment> {
  const res = await fetch(`${BASE}/api/installments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create installment');
  return res.json();
}

export async function updateInstallment(id: number, data: Partial<Installment>): Promise<Installment> {
  const res = await fetch(`${BASE}/api/installments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update installment');
  return res.json();
}

export async function deleteInstallment(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/installments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete installment');
}

// ============ TEACHER WITHDRAWALS ============

export async function fetchWithdrawals(teacherId: number): Promise<TeacherWithdrawal[]> {
  const res = await fetch(`${BASE}/api/teacher-withdrawals?teacherId=${teacherId}`);
  if (!res.ok) throw new Error('Failed to fetch withdrawals');
  return res.json();
}

export async function createWithdrawal(data: {
  teacherId: number;
  amount: number;
  notes?: string;
}): Promise<TeacherWithdrawal> {
  const res = await fetch(`${BASE}/api/teacher-withdrawals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create withdrawal');
  return res.json();
}

// ============ ACCOUNTING ============

export interface TeacherBalance {
  total_paid: number;
  total_students: number;
  paying_students_count: number;
  institute_deduction: number;
  teacher_share: number;
  total_withdrawn: number;
  remaining: number;
}

export async function fetchTeacherBalance(teacherId: number): Promise<TeacherBalance> {
  const res = await fetch(`${BASE}/api/accounting/balance/${teacherId}`);
  if (!res.ok) throw new Error('Failed to fetch teacher balance');
  return res.json();
}

export async function fetchAllBalances(): Promise<(TeacherBalance & { id: number; name: string; subject: string })[]> {
  const res = await fetch(`${BASE}/api/accounting/all-balances`);
  if (!res.ok) throw new Error('Failed to fetch all balances');
  return res.json();
}

// ============ STATS ============

export interface DashboardStats {
  total_students: number;
  active_students: number;
  withdrawn_students: number;
  total_teachers: number;
  unique_subjects: number;
  total_payments_received: number;
  total_withdrawn: number;
  online_students_count: number;
  offline_students_count: number;
  students_with_card: number;
  students_with_badge: number;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// ============ REPORTS ============

export async function fetchStudentReport(id: number) {
  const res = await fetch(`${BASE}/api/reports/student/${id}`);
  if (!res.ok) throw new Error('Failed to fetch student report');
  return res.json();
}

export async function fetchTeacherReport(id: number) {
  const res = await fetch(`${BASE}/api/reports/teacher/${id}`);
  if (!res.ok) throw new Error('Failed to fetch teacher report');
  return res.json();
}

// ============ FORMAT HELPERS ============

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' دينار';
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}
