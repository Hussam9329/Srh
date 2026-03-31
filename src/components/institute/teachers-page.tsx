'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, ArrowRight, GraduationCap, Users, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  fetchTeachers, fetchTeacher, createTeacher, updateTeacher, deleteTeacher,
  fetchTeacherStudents, fetchTeacherReport,
  formatCurrency, formatDate,
  type Teacher
} from '@/lib/api';
import type { TeacherWithCount } from '@/lib/api';

// ==================== INTERFACES ====================

interface TeachersPageProps {
  onBack: () => void;
}

interface TeacherFormData {
  name: string;
  subject: string;
  totalFee: string;
  institutePercentage: string;
  notes: string;
}

interface TeacherStudent {
  studentId: number;
  studentName: string;
  studentBarcode: string;
  studyType: string;
  status: string;
  totalPaid: number;
  installmentCount: number;
  installments: any[];
}

interface TeacherDetailsData {
  teacher: TeacherWithCount & {
    totalPaid: number;
    totalStudents: number;
    payingStudentsCount: number;
    instituteDeduction: number;
    teacherShare: number;
    totalWithdrawn: number;
    netBalance: number;
  };
  students: TeacherStudent[];
  withdrawals: any[];
  paymentsByType: Record<string, number>;
}

interface SubjectGroup {
  subject: string;
  teachers: TeacherWithCount[];
}

const emptyForm: TeacherFormData = {
  name: '',
  subject: '',
  totalFee: '',
  institutePercentage: '30',
  notes: '',
};

// ==================== COMPONENT ====================

export default function TeachersPage({ onBack }: TeachersPageProps) {
  // ===== Teachers List State =====
  const [teachers, setTeachers] = useState<TeacherWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== Form Dialog State =====
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithCount | null>(null);
  const [prefillSubject, setPrefillSubject] = useState('');
  const [formData, setFormData] = useState<TeacherFormData>(emptyForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // ===== Delete Confirm State =====
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===== Teacher Details Dialog State =====
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<TeacherDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ===== Print Report State =====
  const [reportLoading, setReportLoading] = useState(false);

  // ==========================================
  // GROUP TEACHERS BY SUBJECT
  // ==========================================
  const subjectGroups: SubjectGroup[] = useMemo(() => {
    const groupMap = new Map<string, TeacherWithCount[]>();
    teachers.forEach((teacher) => {
      const key = teacher.subject;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(teacher);
    });
    const groups: SubjectGroup[] = [];
    groupMap.forEach((groupTeachers, subject) => {
      groups.push({ subject, teachers: groupTeachers });
    });
    // Sort alphabetically by subject
    groups.sort((a, b) => a.subject.localeCompare(b.subject, 'ar'));
    return groups;
  }, [teachers]);

  // ==========================================
  // FETCH TEACHERS
  // ==========================================
  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeachers();
      setTeachers(data);
    } catch {
      toast.error('فشل في تحميل قائمة المدرسين');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // ==========================================
  // ADD / EDIT TEACHER FORM
  // ==========================================
  const openAddForm = (prefillSubjectValue?: string) => {
    setEditingTeacher(null);
    setPrefillSubject(prefillSubjectValue || '');
    setFormData({
      ...emptyForm,
      subject: prefillSubjectValue || '',
    });
    setFormDialogOpen(true);
  };

  const openEditForm = (teacher: TeacherWithCount) => {
    setEditingTeacher(teacher);
    setPrefillSubject('');
    setFormData({
      name: teacher.name,
      subject: teacher.subject,
      totalFee: teacher.totalFee ? String(teacher.totalFee) : '',
      institutePercentage: String(teacher.institutePercentage),
      notes: teacher.notes || '',
    });
    setFormDialogOpen(true);
  };

  const handleSaveForm = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المدرس');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('يرجى إدخال المادة');
      return;
    }

    const totalFee = formData.totalFee ? parseFloat(formData.totalFee) : 0;
    if (formData.totalFee && (isNaN(totalFee) || totalFee < 0)) {
      toast.error('يرجى إدخال الأجر الكلي بشكل صحيح');
      return;
    }

    const percentage = formData.institutePercentage ? parseInt(formData.institutePercentage, 10) : 30;
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('نسبة المعهد يجب أن تكون بين 0 و 100');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, {
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          totalFee,
          institutePercentage: percentage,
          notes: formData.notes.trim() || null,
        });
        toast.success('تم تحديث بيانات المدرس بنجاح');
      } else {
        await createTeacher({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          totalFee: totalFee || undefined,
          institutePercentage: percentage,
          notes: formData.notes.trim() || undefined,
        });
        toast.success('تم إضافة المدرس بنجاح');
      }
      setFormDialogOpen(false);
      loadTeachers();
    } catch (error: any) {
      toast.error(error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ==========================================
  // DELETE TEACHER
  // ==========================================
  const confirmDelete = (teacher: TeacherWithCount) => {
    setTeacherToDelete(teacher);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    setDeleting(true);
    try {
      await deleteTeacher(teacherToDelete.id);
      toast.success('تم حذف المدرس بنجاح');
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
      loadTeachers();
    } catch (error: any) {
      toast.error(error?.message || 'فشل في حذف المدرس');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // TEACHER DETAILS
  // ==========================================
  const openDetails = async (teacher: TeacherWithCount) => {
    setDetailsLoading(true);
    setDetailsDialogOpen(true);
    setDetailsData(null);
    try {
      const reportData = await fetchTeacherReport(teacher.id);
      setDetailsData(reportData as TeacherDetailsData);
    } catch {
      toast.error('فشل في تحميل بيانات المدرس');
      setDetailsDialogOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // PRINT TEACHER REPORT
  // ==========================================
  const generateReport = async (teacher: TeacherWithCount) => {
    setReportLoading(true);
    try {
      const report = await fetchTeacherReport(teacher.id);
      const t = report.teacher;
      const students = report.students || [];
      const withdrawals = report.withdrawals || [];
      const paymentsByType = report.paymentsByType || {};
      const INSTITUTE_DEDUCTION_PER_STUDENT = 50000;

      // Student cards with payment details
      const studentCards = students.map((s: any, idx: number) => {
        const instRows = (s.installments || []).map((inst: any) =>
          `<tr>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${formatCurrency(inst.amount)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${inst.installmentType || ''}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${formatDate(inst.paymentDate)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${inst.notes || ''}</td>
          </tr>`
        ).join('');

        return `
          <div style="border:1px solid #D4AF37;border-radius:8px;overflow:hidden;margin-bottom:15px;page-break-inside:avoid;">
            <div style="background:#D4AF37;color:#fff;padding:8px 15px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:bold;">الطالب ${idx + 1}: ${s.studentName}</span>
              <span>${s.studentBarcode}</span>
            </div>
            <div style="padding:12px;">
              <div style="display:flex;gap:20px;margin-bottom:8px;font-size:13px;">
                <span>نوع الدراسة: <strong>${s.studyType}</strong></span>
                <span>الحالة: <strong>${s.status}</strong></span>
                <span>المبلغ المدفوع: <strong style="color:${s.hasPaid ? 'green' : '#CC4444'}">${formatCurrency(s.totalPaid)}</strong></span>
              </div>
              ${s.installments && s.installments.length > 0 ? `
                <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                  <thead>
                    <tr style="background:#f5f5f5;">
                      <th style="padding:6px 10px;border:1px solid #ddd;">المبلغ</th>
                      <th style="padding:6px 10px;border:1px solid #ddd;">نوع القسط</th>
                      <th style="padding:6px 10px;border:1px solid #ddd;">التاريخ</th>
                      <th style="padding:6px 10px;border:1px solid #ddd;">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>${instRows}</tbody>
                </table>
              ` : '<p style="color:#888;font-size:13px;">لا توجد أقساط مسجلة</p>'}
            </div>
          </div>
        `;
      }).join('');

      // Installment type breakdown table
      const typeEntries = Object.entries(paymentsByType);
      const typeTableRows = typeEntries.length > 0
        ? typeEntries.map(([type, amount]) =>
            `<tr>
              <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${type}</td>
              <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;font-weight:bold;">${formatCurrency(amount)}</td>
            </tr>`
          ).join('')
        : '<tr><td colspan="2" style="padding:10px;text-align:center;color:#888;">لا توجد بيانات</td></tr>';

      // Recent withdrawals table (last 5)
      const recentWithdrawals = (withdrawals || []).slice(0, 5);
      const withdrawalRows = recentWithdrawals.length > 0
        ? recentWithdrawals.map((w: any) =>
            `<tr>
              <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${formatCurrency(w.amount)}</td>
              <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${formatDate(w.withdrawalDate)}</td>
              <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${w.notes || '-'}</td>
            </tr>`
          ).join('')
        : '<tr><td colspan="3" style="padding:10px;text-align:center;color:#888;">لا توجد مسحوبات</td></tr>';

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير المدرس — ${t.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #D4AF37; font-size: 24px; margin: 0 0 5px; }
    .header h2 { color: #333; font-size: 18px; margin: 0; }
    .teacher-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 25px; }
    .info-item { padding: 10px 14px; background: #f9f9f9; border-radius: 6px; border-right: 3px solid #D4AF37; }
    .info-item label { font-weight: bold; color: #555; font-size: 13px; display: block; }
    .info-item span { display: block; margin-top: 3px; font-size: 15px; }
    .section-title { color: #D4AF37; font-size: 18px; font-weight: bold; margin: 25px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .financial-summary { background: #f5f0e0; padding: 18px; border-radius: 10px; text-align: center; margin: 20px 0; }
    .financial-summary p { margin: 6px 0; font-size: 16px; }
    .balance-card { border: 2px solid ${t.netBalance >= 0 ? '#4CAF50' : '#CC4444'}; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; background: ${t.netBalance >= 0 ? '#f0fff0' : '#fff0f0'}; }
    .balance-card .label { font-size: 14px; color: #555; margin-bottom: 5px; }
    .balance-card .value { font-size: 28px; font-weight: bold; color: ${t.netBalance >= 0 ? '#4CAF50' : '#CC4444'}; }
    table { width: 100%; border-collapse: collapse; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 13px; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:left;margin-bottom:10px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#D4AF37;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
      🖨️ طباعة التقرير
    </button>
  </div>

  <div class="header">
    <h1>معهد صرح البنوك</h1>
    <h2>تقرير المدرس المالي</h2>
  </div>

  <!-- Teacher Info -->
  <div class="teacher-info">
    <div class="info-item">
      <label>اسم المدرس</label>
      <span>${t.name}</span>
    </div>
    <div class="info-item">
      <label>المادة</label>
      <span>${t.subject}</span>
    </div>
    <div class="info-item">
      <label>عدد الطلاب الكلي</label>
      <span>${t.totalStudents}</span>
    </div>
    <div class="info-item">
      <label>عدد الطلاب الدافعين</label>
      <span>${t.payingStudentsCount}</span>
    </div>
    <div class="info-item">
      <label>الأجر الكلي</label>
      <span>${formatCurrency(t.totalFee)}</span>
    </div>
    <div class="info-item">
      <label>نسبة المعهد</label>
      <span>${t.institutePercentage}%</span>
    </div>
    ${t.notes ? `<div class="info-item" style="grid-column:span 2;">
      <label>ملاحظات</label>
      <span>${t.notes}</span>
    </div>` : ''}
  </div>

  <!-- Financial Summary -->
  <h3 class="section-title">الملخص المالي</h3>
  <div class="financial-summary">
    <p><strong>إجمالي الأقساط المحصلة:</strong> ${formatCurrency(t.totalPaid)}</p>
    <p><strong>خصم المعهد (${INSTITUTE_DEDUCTION_PER_STUDENT.toLocaleString()} × ${t.payingStudentsCount} طالب):</strong> <span style="color:#CC4444;">${formatCurrency(t.instituteDeduction)}</span></p>
    <p><strong>حصة المدرس:</strong> <span style="color:#4CAF50;">${formatCurrency(t.teacherShare)}</span></p>
  </div>

  <!-- Installment Type Breakdown -->
  <h3 class="section-title">تفصيل الأقساط حسب النوع</h3>
  <table style="margin-bottom:20px;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px 12px;border:1px solid #ddd;">نوع القسط</th>
        <th style="padding:8px 12px;border:1px solid #ddd;">المبلغ الإجمالي</th>
      </tr>
    </thead>
    <tbody>${typeTableRows}</tbody>
  </table>

  <!-- Student Cards -->
  <h3 class="section-title">بطاقات الطلاب وتفاصيل الدفع</h3>
  ${studentCards || '<p style="color:#888;">لا يوجد طلاب مسجلين لهذا المدرس</p>'}

  <!-- Withdrawals -->
  <h3 class="section-title">المسحوبات الأخيرة (آخر 5)</h3>
  <table style="margin-bottom:20px;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px 12px;border:1px solid #ddd;">المبلغ</th>
        <th style="padding:8px 12px;border:1px solid #ddd;">التاريخ</th>
        <th style="padding:8px 12px;border:1px solid #ddd;">ملاحظات</th>
      </tr>
    </thead>
    <tbody>${withdrawalRows}</tbody>
  </table>

  <!-- Final Balance -->
  <div class="balance-card">
    <div class="label">الرصيد المتبقي للمدرس</div>
    <div class="value">${formatCurrency(t.netBalance)}</div>
    <p style="font-size:13px;color:#777;margin-top:8px;">
      (حصة المدرس ${formatCurrency(t.teacherShare)} - المسحوبات ${formatCurrency(t.totalWithdrawn)})
    </p>
  </div>

  <div class="footer">
    <p>تم إنشاء التقرير بتاريخ: ${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
    <p>معهد صرح البنوك — نظام الإدارة</p>
  </div>
</body>
</html>`;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch {
      toast.error('فشل في توليد التقرير');
    } finally {
      setReportLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div dir="rtl" className="min-h-screen bg-[#1A1A1A] text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <Button
          onClick={onBack}
          className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold px-6"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للوحة التحكم
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-[#FFE38A]">إدارة المدرسين</h1>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-6">
        {/* Add Teacher Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => openAddForm()}
            className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold h-11 px-6"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مدرس جديد
          </Button>
        </div>

        {/* Teachers by Subject */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <GraduationCap className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-xl mb-2">لا توجد مواد مدرجة بعد</p>
            <p className="text-sm mb-6">ابدأ بإضافة مدرسين لعرضهم حسب المادة</p>
            <Button
              onClick={() => openAddForm()}
              className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold px-6"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مدرس جديد
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {subjectGroups.map((group) => (
              <div
                key={group.subject}
                className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-5"
              >
                {/* Subject Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#D4AF37]">{group.subject}</h2>
                      <p className="text-xs text-gray-400">{group.teachers.length} مدرس</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddForm(group.subject)}
                    className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#FFE38A] text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 ml-1" />
                    إضافة مدرس لهذه المادة
                  </Button>
                </div>

                <Separator className="bg-[#D4AF37]/20 mb-4" />

                {/* Teachers Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 #333' }}>
                  {group.teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex-shrink-0 w-64 bg-[#1A1A1A] border border-gray-700 rounded-xl p-4 hover:border-[#D4AF37]/50 transition-colors cursor-pointer group"
                      onClick={() => openDetails(teacher)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate">{teacher.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{teacher.subject}</p>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm(teacher);
                            }}
                            className="p-1 rounded hover:bg-[#D4AF37]/10 text-[#D4AF37]"
                            title="تعديل"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(teacher);
                            }}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400"
                            title="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Users className="h-3.5 w-3.5" />
                          <span className="text-xs">{teacher._studentCount || 0} طالب</span>
                        </div>
                        <div className="text-xs text-[#FFE38A]">
                          {teacher.institutePercentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== ADD/EDIT TEACHER DIALOG ===== */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">
              {editingTeacher ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-300">اسم المدرس *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم المدرس"
                className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">المادة *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="مثال: المحاسبة، اللغة الإنجليزية"
                className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">الأجر الكلي</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.totalFee}
                  onChange={(e) => setFormData({ ...formData, totalFee: e.target.value })}
                  placeholder="0"
                  className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">نسبة المعهد (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.institutePercentage}
                  onChange={(e) => setFormData({ ...formData, institutePercentage: e.target.value })}
                  placeholder="30"
                  className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">ملاحظات</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية (اختياري)"
                className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setFormDialogOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveForm}
              disabled={formSubmitting}
              className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold"
            >
              {formSubmitting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              {editingTeacher ? 'حفظ التعديلات' : 'إضافة المدرس'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE TEACHER CONFIRM DIALOG ===== */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#CC4444] text-xl">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300 py-2">
            هل أنت متأكد من حذف المدرس &quot;{teacherToDelete?.name}&quot؛؟
            <br />
            <span className="text-red-400 text-sm">سيتم حذف جميع البيانات المرتبطة بالمدرس نهائياً.</span>
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
            <Button onClick={handleDeleteTeacher} disabled={deleting} className="bg-[#CC4444] hover:bg-[#b33a3a] text-white font-bold">
              {deleting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== TEACHER DETAILS DIALOG ===== */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">تفاصيل المدرس</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
          ) : detailsData ? (
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-2">
              <div className="space-y-5">
                {/* Teacher Info Card */}
                <div className="bg-[#222] rounded-xl border border-gray-700 p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-gray-400 text-xs">اسم المدرس</span>
                      <p className="text-white font-bold text-lg">{detailsData.teacher.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">المادة</span>
                      <p className="text-[#FFE38A] font-medium">{detailsData.teacher.subject}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">الأجر الكلي</span>
                      <p className="text-white">{formatCurrency(detailsData.teacher.totalFee)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">نسبة المعهد</span>
                      <p className="text-white">{detailsData.teacher.institutePercentage}%</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">عدد الطلاب</span>
                      <p className="text-white font-bold">{detailsData.teacher.totalStudents}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">الطلاب الدافعون</span>
                      <p className="text-green-400 font-bold">{detailsData.teacher.payingStudentsCount}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">إجمالي المحصل</span>
                      <p className="text-green-400">{formatCurrency(detailsData.teacher.totalPaid)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">حصة المدرس</span>
                      <p className="text-[#FFE38A]">{formatCurrency(detailsData.teacher.teacherShare)}</p>
                    </div>
                  </div>
                  {detailsData.teacher.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <span className="text-gray-400 text-xs">ملاحظات</span>
                      <p className="text-gray-300 text-sm mt-1">{detailsData.teacher.notes}</p>
                    </div>
                  )}
                </div>

                {/* Financial Summary Card */}
                <div className="bg-[#222] rounded-xl border border-[#D4AF37]/30 p-5">
                  <h3 className="text-[#D4AF37] font-bold mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                    الملخص المالي
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">إجمالي الأقساط</p>
                      <p className="text-white font-bold">{formatCurrency(detailsData.teacher.totalPaid)}</p>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">خصم المعهد</p>
                      <p className="text-[#CC4444] font-bold">{formatCurrency(detailsData.teacher.instituteDeduction)}</p>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">المسحوبات</p>
                      <p className="text-orange-400 font-bold">{formatCurrency(detailsData.teacher.totalWithdrawn)}</p>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">الرصيد المتبقي</p>
                      <p className={`font-bold ${detailsData.teacher.netBalance >= 0 ? 'text-green-400' : 'text-[#CC4444]'}`}>
                        {formatCurrency(detailsData.teacher.netBalance)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Students Table */}
                <div className="bg-[#222] rounded-xl border border-gray-700 overflow-hidden">
                  <div className="p-4 pb-2">
                    <h3 className="text-[#D4AF37] font-bold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      الطلاب المرتبطون ({detailsData.students.length})
                    </h3>
                  </div>
                  {detailsData.students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Users className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">لا يوجد طلاب مرتبطون بهذا المدرس</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700 hover:bg-transparent">
                            <TableHead className="text-[#D4AF37] font-bold text-center">الاسم</TableHead>
                            <TableHead className="text-[#D4AF37] font-bold text-center">الحالة</TableHead>
                            <TableHead className="text-[#D4AF37] font-bold text-center">نوع الدراسة</TableHead>
                            <TableHead className="text-[#D4AF37] font-bold text-center">المدفوع</TableHead>
                            <TableHead className="text-[#D4AF37] font-bold text-center">الأقساط</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailsData.students.map((student) => (
                            <TableRow key={student.studentId} className="border-gray-700 hover:bg-[#2a2a2a]">
                              <TableCell className="text-center text-white font-medium">
                                {student.studentName}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  student.status === 'مستمر'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                }`}>
                                  {student.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-center text-gray-300 text-sm">
                                {student.studyType}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={student.hasPaid ? 'text-green-400 font-bold' : 'text-gray-500'}>
                                  {formatCurrency(student.totalPaid)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center text-gray-400 text-sm">
                                {student.installmentCount}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => {
                      const t = detailsData.teacher;
                      openEditForm({
                        ...t,
                        _studentCount: t.totalStudents,
                      });
                    }}
                    className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold flex-1"
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل بيانات المدرس
                  </Button>
                  <Button
                    onClick={() => generateReport(detailsData.teacher)}
                    disabled={reportLoading}
                    variant="outline"
                    className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#FFE38A] flex-1"
                  >
                    {reportLoading ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 ml-2" />
                    )}
                    طباعة تقرير
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
