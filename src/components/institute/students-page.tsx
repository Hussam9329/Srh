'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Edit, Trash2, Eye, ArrowRight, Unlink, CreditCard,
  FileText, Check, Loader2, Printer, X, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  fetchStudents, fetchStudent, createStudent, updateStudent, deleteStudent,
  fetchTeachers, fetchInstallments, createInstallment, updateInstallment, deleteInstallment,
  linkStudentTeacher, unlinkStudentTeacher, fetchStudentReport,
  formatCurrency, formatDate,
  type Student
} from '@/lib/api';
import type { StudentWithExtras, Teacher } from '@/lib/api';

interface TeacherPaymentInfo {
  teacherId: number;
  teacherName: string;
  subject: string;
  totalFee: number;
  totalPaid: number;
  remaining: number;
  installments: any[];
}

interface StudentFormData {
  name: string;
  studyType: string;
  status: string;
  hasCard: boolean;
  hasBadge: boolean;
  notes: string;
}

interface PaymentFormData {
  amount: string;
  installmentType: string;
  notes: string;
}

interface EditPaymentFormData {
  amount: string;
  installmentType: string;
  notes: string;
}

const emptyForm: StudentFormData = {
  name: '',
  studyType: 'حضوري',
  status: 'مستمر',
  hasCard: false,
  hasBadge: false,
  notes: '',
};

const emptyPaymentForm: PaymentFormData = {
  amount: '',
  installmentType: 'القسط الأول',
  notes: '',
};

export default function StudentsPage() {
  const router = useRouter();
  // ===== Students List State =====
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ===== Form Dialog State =====
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(emptyForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // ===== Profile Dialog State =====
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithExtras | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [teacherPayments, setTeacherPayments] = useState<TeacherPaymentInfo[]>([]);

  // ===== Delete Confirm State =====
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===== Payment Dialog State =====
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTeacher, setPaymentTeacher] = useState<{ id: number; name: string } | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(emptyPaymentForm);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // ===== Payment Details Dialog State =====
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [paymentDetailsTeacher, setPaymentDetailsTeacher] = useState<{
    id: number; name: string; subject: string; totalFee: number;
  } | null>(null);
  const [paymentDetailsList, setPaymentDetailsList] = useState<any[]>([]);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);

  // ===== Edit Payment Dialog State =====
  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editPaymentForm, setEditPaymentForm] = useState<EditPaymentFormData>({
    amount: '', installmentType: 'القسط الأول', notes: '',
  });
  const [editPaymentSubmitting, setEditPaymentSubmitting] = useState(false);

  // ===== Link Teacher Dialog State =====
  const [linkTeacherDialogOpen, setLinkTeacherDialogOpen] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherSearchResults, setTeacherSearchResults] = useState<Teacher[]>([]);
  const [teacherSearchLoading, setTeacherSearchLoading] = useState(false);
  const [linking, setLinking] = useState<number | null>(null);

  // ===== Unlink Confirm State =====
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ studentId: number; teacherId: number; teacherName: string } | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // ===== Delete Payment Confirm =====
  const [deletePaymentConfirmOpen, setDeletePaymentConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // ==========================================
  // FETCH STUDENTS
  // ==========================================
  const loadStudents = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const data = await fetchStudents(search);
      setStudents(data);
    } catch (error) {
      toast.error('فشل في تحميل قائمة الطلاب');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ==========================================
  // DEBOUNCED SEARCH
  // ==========================================
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadStudents(value || undefined);
    }, 300);
  }, [loadStudents]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    loadStudents();
  }, [loadStudents]);

  // ==========================================
  // STUDENT FORM (ADD / EDIT)
  // ==========================================
  const openAddForm = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
    setFormDialogOpen(true);
  };

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      studyType: student.studyType,
      status: student.status,
      hasCard: student.hasCard,
      hasBadge: student.hasBadge,
      notes: student.notes || '',
    });
    setFormDialogOpen(true);
  };

  const handleSaveForm = async () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم الطالب');
      return;
    }
    setFormSubmitting(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name: formData.name.trim(),
          studyType: formData.studyType,
          status: formData.status,
          hasCard: formData.hasCard,
          hasBadge: formData.hasBadge,
          notes: formData.notes || null,
        });
        toast.success('تم تحديث بيانات الطالب بنجاح');
      } else {
        await createStudent({
          name: formData.name.trim(),
          studyType: formData.studyType,
          status: formData.status,
          hasCard: formData.hasCard,
          hasBadge: formData.hasBadge,
          notes: formData.notes || undefined,
        });
        toast.success('تم إضافة الطالب بنجاح');
      }
      setFormDialogOpen(false);
      loadStudents(searchTerm || undefined);
    } catch (error: any) {
      toast.error(error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ==========================================
  // DELETE STUDENT
  // ==========================================
  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await deleteStudent(studentToDelete.id);
      toast.success('تم حذف الطالب بنجاح');
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
      loadStudents(searchTerm || undefined);
    } catch (error: any) {
      toast.error(error?.message || 'فشل في حذف الطالب');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // STUDENT PROFILE
  // ==========================================
  const openProfile = async (student: Student) => {
    setProfileLoading(true);
    setProfileDialogOpen(true);
    setSelectedStudent(null);
    setTeacherPayments([]);
    try {
      const data = await fetchStudent(student.id);
      if (data) {
        setSelectedStudent(data);
        // Build teacher payment info
        const linkedTeachers = data.teachers || [];
        const tpInfo = await Promise.all(
          linkedTeachers.map(async (link: any) => {
            const installments = await fetchInstallments(student.id, link.teacher.id);
            const totalPaid = installments.reduce((sum: number, inst: any) => sum + inst.amount, 0);
            return {
              teacherId: link.teacher.id,
              teacherName: link.teacher.name,
              subject: link.teacher.subject,
              totalFee: link.teacher.totalFee,
              totalPaid,
              remaining: link.teacher.totalFee - totalPaid,
              installments,
            };
          })
        );
        setTeacherPayments(tpInfo);
      }
    } catch (error) {
      toast.error('فشل في تحميل بيانات الطالب');
    } finally {
      setProfileLoading(false);
    }
  };

  // ==========================================
  // ADD PAYMENT
  // ==========================================
  const openPaymentDialog = (teacher: { id: number; name: string }) => {
    setPaymentTeacher(teacher);
    setPaymentForm(emptyPaymentForm);
    setPaymentDialogOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedStudent || !paymentTeacher) return;
    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    setPaymentSubmitting(true);
    try {
      await createInstallment({
        studentId: selectedStudent.id,
        teacherId: paymentTeacher.id,
        amount,
        installmentType: paymentForm.installmentType,
        notes: paymentForm.notes || undefined,
      });
      toast.success('تم إضافة القسط بنجاح');
      setPaymentDialogOpen(false);
      // Refresh profile data
      if (selectedStudent) {
        await openProfile(selectedStudent);
      }
    } catch (error: any) {
      toast.error(error?.message || 'فشل في إضافة القسط');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // ==========================================
  // PAYMENT DETAILS
  // ==========================================
  const openPaymentDetails = async (teacher: {
    id: number; name: string; subject: string; totalFee: number;
  }) => {
    if (!selectedStudent) return;
    setPaymentDetailsTeacher(teacher);
    setPaymentDetailsOpen(true);
    setPaymentDetailsLoading(true);
    setPaymentDetailsList([]);
    try {
      const installments = await fetchInstallments(selectedStudent.id, teacher.id);
      setPaymentDetailsList(installments);
    } catch (error) {
      toast.error('فشل في تحميل الأقساط');
    } finally {
      setPaymentDetailsLoading(false);
    }
  };

  // ==========================================
  // EDIT PAYMENT
  // ==========================================
  const openEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setEditPaymentForm({
      amount: String(payment.amount),
      installmentType: payment.installmentType || 'القسط الأول',
      notes: payment.notes || '',
    });
    setEditPaymentDialogOpen(true);
  };

  const handleSaveEditPayment = async () => {
    if (!editingPayment) return;
    const amount = parseFloat(editPaymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    setEditPaymentSubmitting(true);
    try {
      await updateInstallment(editingPayment.id, {
        amount,
        installmentType: editPaymentForm.installmentType,
        notes: editPaymentForm.notes || null,
      });
      toast.success('تم تحديث القسط بنجاح');
      setEditPaymentDialogOpen(false);
      // Refresh payment details
      if (paymentDetailsTeacher && selectedStudent) {
        const installments = await fetchInstallments(selectedStudent.id, paymentDetailsTeacher.id);
        setPaymentDetailsList(installments);
      }
      // Also refresh profile
      if (selectedStudent) {
        const data = await fetchStudent(selectedStudent.id);
        if (data) {
          setSelectedStudent(data);
          const linkedTeachers = data.teachers || [];
          const tpInfo = await Promise.all(
            linkedTeachers.map(async (link: any) => {
              const inst = await fetchInstallments(selectedStudent.id, link.teacher.id);
              const totalPaid = inst.reduce((sum: number, i: any) => sum + i.amount, 0);
              return {
                teacherId: link.teacher.id,
                teacherName: link.teacher.name,
                subject: link.teacher.subject,
                totalFee: link.teacher.totalFee,
                totalPaid,
                remaining: link.teacher.totalFee - totalPaid,
                installments: inst,
              };
            })
          );
          setTeacherPayments(tpInfo);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'فشل في تحديث القسط');
    } finally {
      setEditPaymentSubmitting(false);
    }
  };

  // ==========================================
  // DELETE PAYMENT
  // ==========================================
  const confirmDeletePayment = (payment: any) => {
    setPaymentToDelete(payment);
    setDeletePaymentConfirmOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setDeletingPayment(true);
    try {
      await deleteInstallment(paymentToDelete.id);
      toast.success('تم حذف القسط بنجاح');
      setDeletePaymentConfirmOpen(false);
      setPaymentToDelete(null);
      // Refresh payment details
      if (paymentDetailsTeacher && selectedStudent) {
        const installments = await fetchInstallments(selectedStudent.id, paymentDetailsTeacher.id);
        setPaymentDetailsList(installments);
      }
      // Also refresh profile
      if (selectedStudent) {
        const data = await fetchStudent(selectedStudent.id);
        if (data) {
          setSelectedStudent(data);
          const linkedTeachers = data.teachers || [];
          const tpInfo = await Promise.all(
            linkedTeachers.map(async (link: any) => {
              const inst = await fetchInstallments(selectedStudent.id, link.teacher.id);
              const totalPaid = inst.reduce((sum: number, i: any) => sum + i.amount, 0);
              return {
                teacherId: link.teacher.id,
                teacherName: link.teacher.name,
                subject: link.teacher.subject,
                totalFee: link.teacher.totalFee,
                totalPaid,
                remaining: link.teacher.totalFee - totalPaid,
                installments: inst,
              };
            })
          );
          setTeacherPayments(tpInfo);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'فشل في حذف القسط');
    } finally {
      setDeletingPayment(false);
    }
  };

  // ==========================================
  // LINK / UNLINK TEACHER
  // ==========================================
  const openLinkTeacher = () => {
    setTeacherSearchTerm('');
    setTeacherSearchResults([]);
    setLinkTeacherDialogOpen(true);
  };

  const searchTeachers = useCallback(async (term: string) => {
    if (term.length < 1) {
      setTeacherSearchResults([]);
      return;
    }
    setTeacherSearchLoading(true);
    try {
      const data = await fetchTeachers(term);
      setTeacherSearchResults(data);
    } catch (error) {
      toast.error('فشل في البحث عن المدرسين');
    } finally {
      setTeacherSearchLoading(false);
    }
  }, []);

  const handleTeacherSearchChange = (value: string) => {
    setTeacherSearchTerm(value);
    searchTeachers(value);
  };

  const isTeacherLinked = (teacherId: number): boolean => {
    return teacherPayments.some(tp => tp.teacherId === teacherId);
  };

  const handleLinkTeacher = async (teacherId: number, teacherName: string) => {
    if (!selectedStudent) return;
    if (isTeacherLinked(teacherId)) {
      toast.info('هذا المدرس مرتبط بالطالب بالفعل');
      return;
    }
    setLinking(teacherId);
    try {
      await linkStudentTeacher(selectedStudent.id, teacherId);
      toast.success(`تم ربط المدرس ${teacherName} بنجاح`);
      setLinkTeacherDialogOpen(false);
      // Refresh profile
      await openProfile(selectedStudent);
    } catch (error: any) {
      toast.error(error?.message || 'فشل في ربط المدرس');
    } finally {
      setLinking(null);
    }
  };

  const confirmUnlink = (teacherId: number, teacherName: string) => {
    if (!selectedStudent) return;
    setUnlinkTarget({ studentId: selectedStudent.id, teacherId, teacherName });
    setUnlinkConfirmOpen(true);
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    try {
      await unlinkStudentTeacher(unlinkTarget.studentId, unlinkTarget.teacherId);
      toast.success(`تم فك ربط المدرس ${unlinkTarget.teacherName}`);
      setUnlinkConfirmOpen(false);
      setUnlinkTarget(null);
      // Refresh profile
      if (selectedStudent) {
        await openProfile(selectedStudent);
      }
    } catch (error: any) {
      toast.error(error?.message || 'فشل في فك الربط');
    } finally {
      setUnlinking(false);
    }
  };

  // ==========================================
  // GENERATE REPORT
  // ==========================================
  const generateReport = async () => {
    if (!selectedStudent) return;
    try {
      const report = await fetchStudentReport(selectedStudent.id);
      const student = report.student;
      const teachers = report.teachers || [];
      const summary = report.summary || {};

      const teacherRows = teachers.map((t: any) => {
        const instRows = (t.installments || []).map((inst: any) =>
          `<tr>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${formatCurrency(inst.amount)}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${inst.installmentType || ''}</td>
            <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${formatDate(inst.paymentDate)}</td>
          </tr>`
        ).join('');

        return `
          <div style="margin-bottom:20px;border:1px solid #D4AF37;border-radius:8px;overflow:hidden;">
            <div style="background:#D4AF37;color:#fff;padding:10px 15px;font-weight:bold;">
              ${t.teacherName} — ${t.subject}
            </div>
            <div style="padding:10px;">
              <p style="margin:5px 0;">الرسوم الكلية: <strong>${formatCurrency(t.totalFee)}</strong></p>
              <p style="margin:5px 0;">المبلغ المدفوع: <strong style="color:green;">${formatCurrency(t.totalPaid)}</strong></p>
              <p style="margin:5px 0;">المبلغ المتبقي: <strong style="color:red;">${formatCurrency(t.remaining)}</strong></p>
              ${t.installments && t.installments.length > 0 ? `
                <table style="width:100%;border-collapse:collapse;margin-top:10px;">
                  <thead>
                    <tr style="background:#f5f5f5;">
                      <th style="padding:6px 10px;border:1px solid #ddd;">المبلغ</th>
                      <th style="padding:6px 10px;border:1px solid #ddd;">نوع القسط</th>
                      <th style="padding:6px 10px;border:1px solid #ddd;">تاريخ الدفع</th>
                    </tr>
                  </thead>
                  <tbody>${instRows}</tbody>
                </table>
              ` : '<p style="color:#888;margin-top:8px;">لا توجد أقساط مسجلة</p>'}
            </div>
          </div>
        `;
      }).join('');

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير الطالب — ${student.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #D4AF37; font-size: 24px; margin: 0 0 5px; }
    .header h2 { color: #333; font-size: 18px; margin: 0; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .info-item { padding: 8px 12px; background: #f9f9f9; border-radius: 6px; border-right: 3px solid #D4AF37; }
    .info-item label { font-weight: bold; color: #555; font-size: 13px; }
    .info-item span { display: block; margin-top: 3px; font-size: 15px; }
    .summary { background: #f5f0e0; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; }
    .summary p { margin: 5px 0; font-size: 16px; }
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
    <h2>تقرير الطالب</h2>
  </div>
  <div class="student-info">
    <div class="info-item">
      <label>اسم الطالب</label>
      <span>${student.name}</span>
    </div>
    <div class="info-item">
      <label>الباركود</label>
      <span>${student.barcode}</span>
    </div>
    <div class="info-item">
      <label>الحالة</label>
      <span>${student.status}</span>
    </div>
    <div class="info-item">
      <label>نوع الدراسة</label>
      <span>${student.studyType}</span>
    </div>
    <div class="info-item">
      <label>كارت الحجز</label>
      <span>${student.hasCard ? 'نعم' : 'لا'}</span>
    </div>
    <div class="info-item">
      <label>الباج</label>
      <span>${student.hasBadge ? 'نعم' : 'لا'}</span>
    </div>
  </div>
  ${student.notes ? `<p style="margin-bottom:20px;"><strong>ملاحظات:</strong> ${student.notes}</p>` : ''}
  ${teacherRows}
  <div class="summary">
    <p><strong>إجمالي عدد المدرسين:</strong> ${summary.totalTeachers || 0}</p>
    <p><strong>إجمالي الرسوم:</strong> ${formatCurrency(summary.overallTotalFee || 0)}</p>
    <p><strong>إجمالي المدفوع:</strong> <span style="color:green;">${formatCurrency(summary.overallTotalPaid || 0)}</span></p>
    <p><strong>إجمالي المتبقي:</strong> <span style="color:red;">${formatCurrency(summary.overallRemaining || 0)}</span></p>
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
    } catch (error) {
      toast.error('فشل في توليد التقرير');
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <Button
          onClick={() => router.push('/')}
          className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold px-6"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للوحة التحكم
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-[#FFE38A]">إدارة الطلاب</h1>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-6">
        {/* Search + Add */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ابحث باسم الطالب، الباركود، الحالة أو نوع الدراسة"
              className="bg-[#222] border-gray-600 text-white pr-10 placeholder:text-gray-500 h-11"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={openAddForm}
            className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold h-11 px-6"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة طالب جديد
          </Button>
        </div>

        {/* Students Table */}
        <div className="bg-[#222] rounded-xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-lg">لا يوجد طلاب</p>
              <p className="text-sm mt-1">اضغط على &quot;إضافة طالب جديد&quot; لبدء إضافة الطلاب</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-250px)]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-[#D4AF37] font-bold text-center">الباركود</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">الاسم</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">الحالة</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">نوع الدراسة</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">كارت</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">الباج</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} className="border-gray-700 hover:bg-[#2a2a2a]">
                        <TableCell className="text-center text-gray-300 text-sm">{student.barcode}</TableCell>
                        <TableCell className="text-center text-white font-medium">{student.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={student.status === 'مستمر'
                              ? 'border-green-500 text-green-400 bg-green-500/10'
                              : 'border-red-500 text-red-400 bg-red-500/10'
                            }
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-gray-300">{student.studyType}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={student.hasCard ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-500 bg-gray-600/10'}>
                            {student.hasCard ? 'نعم' : 'لا'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={student.hasBadge ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-500 bg-gray-600/10'}>
                            {student.hasBadge ? 'نعم' : 'لا'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openProfile(student)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8 p-0"
                              title="بروفايل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditForm(student)}
                              className="text-[#D4AF37] hover:text-[#FFE38A] hover:bg-[#D4AF37]/10 h-8 w-8 p-0"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(student)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* ===== ADD/EDIT STUDENT DIALOG ===== */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">
              {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-300">الاسم *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الطالب"
                className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">نوع الدراسة</Label>
                <Select value={formData.studyType} onValueChange={(v) => setFormData({ ...formData, studyType: v })}>
                  <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#222] border-gray-600">
                    <SelectItem value="حضوري">حضوري</SelectItem>
                    <SelectItem value="الكتروني">الكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">حالة الطالب</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#222] border-gray-600">
                    <SelectItem value="مستمر">مستمر</SelectItem>
                    <SelectItem value="منسحب">منسحب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.hasCard}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasCard: checked === true })}
                  className="border-gray-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                />
                <Label className="text-gray-300 cursor-pointer">كارت الحجز</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.hasBadge}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasBadge: checked === true })}
                  className="border-gray-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                />
                <Label className="text-gray-300 cursor-pointer">الباج</Label>
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
              {editingStudent ? 'حفظ التعديلات' : 'إضافة الطالب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE STUDENT CONFIRM DIALOG ===== */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#CC4444] text-xl">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300 py-2">
            هل أنت متأكد من حذف الطالب &quot;{studentToDelete?.name}&quot؛؟<br />
            <span className="text-red-400 text-sm">سيتم حذف جميع البيانات المرتبطة بالطالب نهائياً.</span>
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
            <Button onClick={handleDeleteStudent} disabled={deleting} className="bg-[#CC4444] hover:bg-[#b33a3a] text-white font-bold">
              {deleting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== STUDENT PROFILE DIALOG ===== */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">بروفايل الطالب</DialogTitle>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
          ) : selectedStudent ? (
            <div className="space-y-4">
              {/* Student Info Card */}
              <div className="bg-[#222] rounded-xl border border-gray-700 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-400 text-xs">الاسم</span>
                    <p className="text-white font-bold">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">الباركود</span>
                    <p className="text-[#FFE38A] font-mono">{selectedStudent.barcode}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">الحالة</span>
                    <p>
                      <Badge variant="outline" className={
                        selectedStudent.status === 'مستمر'
                          ? 'border-green-500 text-green-400 bg-green-500/10'
                          : 'border-red-500 text-red-400 bg-red-500/10'
                      }>
                        {selectedStudent.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">نوع الدراسة</span>
                    <p className="text-gray-300">{selectedStudent.studyType}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">كارت الحجز</span>
                    <p>
                      <Badge variant="outline" className={selectedStudent.hasCard ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-500'}>
                        {selectedStudent.hasCard ? 'نعم' : 'لا'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">الباج</span>
                    <p>
                      <Badge variant="outline" className={selectedStudent.hasBadge ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-500'}>
                        {selectedStudent.hasBadge ? 'نعم' : 'لا'}
                      </Badge>
                    </p>
                  </div>
                </div>
                {selectedStudent.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <span className="text-gray-400 text-xs">ملاحظات</span>
                    <p className="text-gray-300 text-sm">{selectedStudent.notes}</p>
                  </div>
                )}
              </div>

              {/* Teachers Section */}
              <div className="flex items-center justify-between">
                <h3 className="text-[#D4AF37] font-bold text-lg">المدرسين المرتبطين ({teacherPayments.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateReport}
                    className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs"
                  >
                    <Printer className="h-3 w-3 ml-1" />
                    توليد تقرير
                  </Button>
                  <Button
                    size="sm"
                    onClick={openLinkTeacher}
                    className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold text-xs"
                  >
                    <Plus className="h-3 w-3 ml-1" />
                    ربط مدرس
                  </Button>
                </div>
              </div>

              <ScrollArea className="max-h-[40vh]">
                <div className="space-y-3">
                  {teacherPayments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      لا يوجد مدرسين مرتبطين بالطالب
                    </div>
                  ) : (
                    teacherPayments.map((tp) => (
                      <div key={tp.teacherId} className="bg-[#222] rounded-xl border border-gray-700 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-bold">{tp.teacherName}</p>
                            <p className="text-gray-400 text-sm">{tp.subject}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmUnlink(tp.teacherId, tp.teacherName)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                            title="حذف الربط"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-[#1A1A1A] rounded-lg p-2 text-center">
                            <span className="text-gray-400 text-xs block">الرسوم الكلية</span>
                            <span className="text-[#FFE38A] font-bold text-sm">{formatCurrency(tp.totalFee)}</span>
                          </div>
                          <div className="bg-[#1A1A1A] rounded-lg p-2 text-center">
                            <span className="text-gray-400 text-xs block">المدفوع</span>
                            <span className="text-green-400 font-bold text-sm">{formatCurrency(tp.totalPaid)}</span>
                          </div>
                          <div className="bg-[#1A1A1A] rounded-lg p-2 text-center">
                            <span className="text-gray-400 text-xs block">المتبقي</span>
                            <span className="text-red-400 font-bold text-sm">{formatCurrency(tp.remaining)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog({ id: tp.teacherId, name: tp.teacherName })}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1"
                          >
                            <CreditCard className="h-3 w-3 ml-1" />
                            إضافة قسط
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentDetails({
                              id: tp.teacherId, name: tp.teacherName,
                              subject: tp.subject, totalFee: tp.totalFee,
                            })}
                            className="border-gray-500 text-gray-300 hover:bg-gray-700 text-xs flex-1"
                          >
                            <FileText className="h-3 w-3 ml-1" />
                            تفاصيل الأقساط
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لم يتم تحميل البيانات</div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== ADD PAYMENT DIALOG ===== */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">إضافة قسط</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-[#1A1A1A] rounded-lg p-3">
              <span className="text-gray-400 text-xs">المدرس</span>
              <p className="text-white font-bold">{paymentTeacher?.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">المبلغ *</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="أدخل المبلغ"
                className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">نوع القسط</Label>
              <Select value={paymentForm.installmentType} onValueChange={(v) => setPaymentForm({ ...paymentForm, installmentType: v })}>
                <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-gray-600">
                  <SelectItem value="القسط الأول">القسط الأول</SelectItem>
                  <SelectItem value="القسط الثاني">القسط الثاني</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">ملاحظات</Label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="ملاحظات (اختياري)"
                className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setPaymentDialogOpen(false)} className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
            <Button onClick={handleSavePayment} disabled={paymentSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold">
              {paymentSubmitting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حفظ القسط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== PAYMENT DETAILS DIALOG ===== */}
      <Dialog open={paymentDetailsOpen} onOpenChange={setPaymentDetailsOpen}>
        <DialogContent className="bg-[#1A1A1A] border-gray-700 text-white max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">تفاصيل الأقساط</DialogTitle>
          </DialogHeader>
          {paymentDetailsTeacher && (
            <div className="bg-[#222] rounded-lg p-3 mb-3">
              <span className="text-gray-400 text-xs">المدرس</span>
              <p className="text-white font-bold">{paymentDetailsTeacher.name} — {paymentDetailsTeacher.subject}</p>
            </div>
          )}

          {paymentDetailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
            </div>
          ) : paymentDetailsList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">لا توجد أقساط مسجلة</div>
          ) : (
            <div className="space-y-3">
              <ScrollArea className="max-h-[50vh]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-[#D4AF37] font-bold text-center">المبلغ</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">نوع القسط</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">تاريخ الدفع</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">ملاحظات</TableHead>
                      <TableHead className="text-[#D4AF37] font-bold text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentDetailsList.map((payment) => (
                      <TableRow key={payment.id} className="border-gray-700 hover:bg-[#2a2a2a]">
                        <TableCell className="text-center text-green-400 font-bold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="text-center text-gray-300">{payment.installmentType || ''}</TableCell>
                        <TableCell className="text-center text-gray-400 text-sm">{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell className="text-center text-gray-400 text-sm">{payment.notes || '—'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPayment(payment)}
                              className="text-[#D4AF37] hover:text-[#FFE38A] hover:bg-[#D4AF37]/10 h-7 w-7 p-0"
                              title="تعديل"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDeletePayment(payment)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                              title="حذف"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <Separator className="bg-gray-700" />
              <div className="flex justify-between items-center bg-[#222] rounded-lg p-3">
                <span className="text-gray-400 font-medium">إجمالي المدفوع</span>
                <span className="text-green-400 font-bold text-lg">
                  {formatCurrency(paymentDetailsList.reduce((sum, p) => sum + p.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== EDIT PAYMENT DIALOG ===== */}
      <Dialog open={editPaymentDialogOpen} onOpenChange={setEditPaymentDialogOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">تعديل القسط</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-300">المبلغ *</Label>
              <Input
                type="number"
                value={editPaymentForm.amount}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                className="bg-[#1A1A1A] border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">نوع القسط</Label>
              <Select value={editPaymentForm.installmentType} onValueChange={(v) => setEditPaymentForm({ ...editPaymentForm, installmentType: v })}>
                <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-gray-600">
                  <SelectItem value="القسط الأول">القسط الأول</SelectItem>
                  <SelectItem value="القسط الثاني">القسط الثاني</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">ملاحظات</Label>
              <Input
                value={editPaymentForm.notes}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })}
                className="bg-[#1A1A1A] border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditPaymentDialogOpen(false)} className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
            <Button onClick={handleSaveEditPayment} disabled={editPaymentSubmitting} className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold">
              {editPaymentSubmitting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE PAYMENT CONFIRM DIALOG ===== */}
      <Dialog open={deletePaymentConfirmOpen} onOpenChange={setDeletePaymentConfirmOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#CC4444] text-xl">تأكيد حذف القسط</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300 py-2">
            هل أنت متأكد من حذف هذا القسط بقيمة <span className="text-[#FFE38A] font-bold">{paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''}</span>؟
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeletePaymentConfirmOpen(false)} className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
            <Button onClick={handleDeletePayment} disabled={deletingPayment} className="bg-[#CC4444] hover:bg-[#b33a3a] text-white font-bold">
              {deletingPayment && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== LINK TEACHER DIALOG ===== */}
      <Dialog open={linkTeacherDialogOpen} onOpenChange={setLinkTeacherDialogOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37] text-xl">ربط مدرس بالطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={teacherSearchTerm}
                onChange={(e) => handleTeacherSearchChange(e.target.value)}
                placeholder="ابحث عن المدرس بالاسم..."
                className="bg-[#1A1A1A] border-gray-600 text-white pr-10 placeholder:text-gray-500"
              />
            </div>
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2">
                {teacherSearchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
                  </div>
                ) : teacherSearchResults.length === 0 && teacherSearchTerm ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد نتائج
                  </div>
                ) : teacherSearchTerm === '' ? (
                  <div className="text-center py-8 text-gray-500">
                    اكتب اسم المدرس للبحث
                  </div>
                ) : (
                  teacherSearchResults.map((teacher) => {
                    const linked = isTeacherLinked(teacher.id);
                    return (
                      <button
                        key={teacher.id}
                        onClick={() => handleLinkTeacher(teacher.id, teacher.name)}
                        disabled={linked || linking === teacher.id}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          linked
                            ? 'bg-green-500/10 border-green-500/30 cursor-default'
                            : 'bg-[#1A1A1A] border-gray-700 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5'
                        }`}
                      >
                        <div className="text-right">
                          <p className="text-white font-medium">{teacher.name}</p>
                          <p className="text-gray-400 text-sm">{teacher.subject}</p>
                        </div>
                        {linking === teacher.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                        ) : linked ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Plus className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkTeacherDialogOpen(false)} className="text-gray-400 hover:text-white">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== UNLINK TEACHER CONFIRM DIALOG ===== */}
      <Dialog open={unlinkConfirmOpen} onOpenChange={setUnlinkConfirmOpen}>
        <DialogContent className="bg-[#222] border-gray-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#CC4444] text-xl">تأكيد فك الربط</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300 py-2">
            هل أنت متأكد من فك ربط المدرس &quot;{unlinkTarget?.teacherName}&quot؛؟<br />
            <span className="text-red-400 text-sm">سيتم حذف جميع الأقساط المرتبطة أيضاً.</span>
          </p>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setUnlinkConfirmOpen(false)} className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
            <Button onClick={handleUnlink} disabled={unlinking} className="bg-[#CC4444] hover:bg-[#b33a3a] text-white font-bold">
              {unlinking && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              فك الربط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
