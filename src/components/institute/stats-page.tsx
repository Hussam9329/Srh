'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, UserCheck, UserX, GraduationCap, BookOpen, DollarSign,
  TrendingDown, CreditCard, ArrowRight, Loader2, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  fetchStats,
  fetchStudents,
  fetchTeachers,
  fetchAllBalances,
  formatCurrency,
  type DashboardStats,
} from '@/lib/api';

// ==================== INTERFACES ====================

interface StatsPageProps {
  onBack: () => void;
}

interface ReportData {
  stats: DashboardStats;
  students: any[];
  teachers: any[];
  balances: any[];
}

// ==================== COMPONENT ====================

export default function StatsPage({ onBack }: StatsPageProps) {
  // ===== Data State =====
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  // ==========================================
  // FETCH STATS
  // ==========================================
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch {
      toast.error('فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ==========================================
  // GENERATE STUDENT REPORT
  // ==========================================
  const generateStudentReport = async () => {
    setReportLoading('students');
    try {
      const [statsData, students] = await Promise.all([
        fetchStats(),
        fetchStudents(),
      ]);

      const activeStudents = students.filter((s) => s.status === 'مستمر');
      const withdrawnStudents = students.filter((s) => s.status === 'منسحب');
      const onlineStudents = students.filter((s) => s.studyType === 'الكتروني');
      const offlineStudents = students.filter((s) => s.studyType === 'حضوري');
      const withCard = students.filter((s) => s.hasCard);

      const studentRows = students.map((s, idx) => `
        <tr>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${idx + 1}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;">${s.name}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${s.barcode}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">
            <span style="padding:2px 8px;border-radius:12px;font-size:11px;${s.status === 'مستمر' ? 'background:#e8f5e9;color:#2e7d32;' : 'background:#ffebee;color:#c62828;'}">${s.status}</span>
          </td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${s.studyType}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${s.hasCard ? '✅' : '❌'}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${s.hasBadge ? '✅' : '❌'}</td>
        </tr>
      `).join('');

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير شامل للطلاب — معهد صرح البنوك</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #D4AF37; font-size: 24px; margin: 0 0 5px; }
    .header h2 { color: #333; font-size: 18px; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 25px; }
    .summary-card { padding: 14px; background: #f9f9f9; border-radius: 8px; border-right: 3px solid #D4AF37; text-align: center; }
    .summary-card .label { font-size: 12px; color: #666; margin-bottom: 4px; }
    .summary-card .value { font-size: 22px; font-weight: bold; color: #D4AF37; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f5f0e0; color: #D4AF37; }
    th, td { padding: 8px 10px; border: 1px solid #ddd; text-align: center; font-size: 13px; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 13px; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:left;margin-bottom:10px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#D4AF37;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ طباعة التقرير</button>
  </div>
  <div class="header">
    <h1>معهد صرح البنوك</h1>
    <h2>تقرير شامل للطلاب</h2>
  </div>
  <div class="summary-grid">
    <div class="summary-card"><div class="label">إجمالي الطلاب</div><div class="value">${statsData.total_students}</div></div>
    <div class="summary-card"><div class="label">الطلاب النشطين</div><div class="value" style="color:#2e7d32;">${statsData.active_students}</div></div>
    <div class="summary-card"><div class="label">المنسحبين</div><div class="value" style="color:#c62828;">${statsData.withdrawn_students}</div></div>
    <div class="summary-card"><div class="label">حضوري</div><div class="value" style="color:#1565c0;">${statsData.offline_students_count}</div></div>
    <div class="summary-card"><div class="label">إلكتروني</div><div class="value" style="color:#7b1fa2;">${statsData.online_students_count}</div></div>
    <div class="summary-card"><div class="label">مع كارت</div><div class="value">${statsData.students_with_card}</div></div>
  </div>
  <h3 style="color:#D4AF37;margin-bottom:10px;">قائمة الطلاب</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>الاسم</th>
        <th>الباركود</th>
        <th>الحالة</th>
        <th>نوع الدراسة</th>
        <th>كارت</th>
        <th>باج</th>
      </tr>
    </thead>
    <tbody>${studentRows}</tbody>
  </table>
  <div class="footer">
    <p>تم إنشاء التقرير بتاريخ: ${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
    <p>معهد صرح البنوك — نظام الإدارة</p>
  </div>
</body>
</html>`;

      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    } catch {
      toast.error('فشل في توليد التقرير');
    } finally {
      setReportLoading(null);
    }
  };

  // ==========================================
  // GENERATE TEACHER REPORT
  // ==========================================
  const generateTeacherReport = async () => {
    setReportLoading('teachers');
    try {
      const [statsData, teachers, balances] = await Promise.all([
        fetchStats(),
        fetchTeachers(),
        fetchAllBalances(),
      ]);

      const teacherRows = teachers.map((t, idx) => {
        const bal = balances.find((b: any) => b.id === t.id);
        return `
          <tr>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${idx + 1}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;">${t.name}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${t.subject}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${bal?.total_students || 0}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${bal?.paying_students_count || 0}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;">${formatCurrency(bal?.total_paid || 0)}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#CC4444;">${formatCurrency(bal?.institute_deduction || 0)}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#2e7d32;">${formatCurrency(bal?.teacher_share || 0)}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#e65100;">${formatCurrency(bal?.total_withdrawn || 0)}</td>
            <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;color:${(bal?.remaining || 0) >= 0 ? '#2e7d32' : '#c62828'};">${formatCurrency(bal?.remaining || 0)}</td>
          </tr>
        `;
      }).join('');

      const totalPaid = balances.reduce((sum: number, b: any) => sum + (b.total_paid || 0), 0);
      const totalDeduction = balances.reduce((sum: number, b: any) => sum + (b.institute_deduction || 0), 0);
      const totalTeacherShare = balances.reduce((sum: number, b: any) => sum + (b.teacher_share || 0), 0);
      const totalWithdrawn = balances.reduce((sum: number, b: any) => sum + (b.total_withdrawn || 0), 0);

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير شامل للمدرسين — معهد صرح البنوك</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #D4AF37; font-size: 24px; margin: 0 0 5px; }
    .header h2 { color: #333; font-size: 18px; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 25px; }
    .summary-card { padding: 14px; background: #f9f9f9; border-radius: 8px; border-right: 3px solid #D4AF37; text-align: center; }
    .summary-card .label { font-size: 12px; color: #666; margin-bottom: 4px; }
    .summary-card .value { font-size: 20px; font-weight: bold; color: #D4AF37; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f5f0e0; color: #D4AF37; }
    th, td { padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-size: 12px; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 13px; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:left;margin-bottom:10px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#D4AF37;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ طباعة التقرير</button>
  </div>
  <div class="header">
    <h1>معهد صرح البنوك</h1>
    <h2>تقرير شامل للمدرسين</h2>
  </div>
  <div class="summary-grid">
    <div class="summary-card"><div class="label">إجمالي المدرسين</div><div class="value">${statsData.total_teachers}</div></div>
    <div class="summary-card"><div class="label">المواد الدراسية</div><div class="value">${statsData.unique_subjects}</div></div>
    <div class="summary-card"><div class="label">إجمالي المدفوعات</div><div class="value">${formatCurrency(totalPaid)}</div></div>
    <div class="summary-card"><div class="label">خصم المعهد</div><div class="value" style="color:#c62828;">${formatCurrency(totalDeduction)}</div></div>
    <div class="summary-card"><div class="label">حصة المدرسين</div><div class="value" style="color:#2e7d32;">${formatCurrency(totalTeacherShare)}</div></div>
    <div class="summary-card"><div class="label">إجمالي المسحوبات</div><div class="value" style="color:#e65100;">${formatCurrency(totalWithdrawn)}</div></div>
  </div>
  <h3 style="color:#D4AF37;margin-bottom:10px;">تفاصيل المدرسين</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>الاسم</th>
        <th>المادة</th>
        <th>الطلاب</th>
        <th>الدافعين</th>
        <th>المدفوع</th>
        <th>خصم المعهد</th>
        <th>حصة المدرس</th>
        <th>المسحوب</th>
        <th>المتبقي</th>
      </tr>
    </thead>
    <tbody>${teacherRows}</tbody>
  </table>
  <div class="footer">
    <p>تم إنشاء التقرير بتاريخ: ${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
    <p>معهد صرح البنوك — نظام الإدارة</p>
  </div>
</body>
</html>`;

      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    } catch {
      toast.error('فشل في توليد التقرير');
    } finally {
      setReportLoading(null);
    }
  };

  // ==========================================
  // GENERATE FINANCIAL REPORT
  // ==========================================
  const generateFinancialReport = async () => {
    setReportLoading('financial');
    try {
      const [statsData, balances] = await Promise.all([
        fetchStats(),
        fetchAllBalances(),
      ]);

      const totalPaid = balances.reduce((sum: number, b: any) => sum + (b.total_paid || 0), 0);
      const totalDeduction = balances.reduce((sum: number, b: any) => sum + (b.institute_deduction || 0), 0);
      const totalTeacherShare = balances.reduce((sum: number, b: any) => sum + (b.teacher_share || 0), 0);
      const totalWithdrawn = balances.reduce((sum: number, b: any) => sum + (b.total_withdrawn || 0), 0);
      const totalRemaining = balances.reduce((sum: number, b: any) => sum + (b.remaining || 0), 0);
      const instituteNet = totalDeduction - totalWithdrawn;

      const balanceRows = balances.map((b: any, idx: number) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${idx + 1}</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;">${b.name}</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${b.subject}</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">${formatCurrency(b.total_paid)}</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#CC4444;">${formatCurrency(b.institute_deduction)}</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#2e7d32;">${formatCurrency(b.teacher_share)}</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;color:#e65100;">${formatCurrency(b.total_withdrawn)}</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;color:${(b.remaining || 0) >= 0 ? '#2e7d32' : '#c62828'};">${formatCurrency(b.remaining || 0)}</td>
        </tr>
      `).join('');

      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير مالي شامل — معهد صرح البنوك</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #D4AF37; font-size: 24px; margin: 0 0 5px; }
    .header h2 { color: #333; font-size: 18px; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 25px; }
    .summary-card { padding: 16px; background: #f9f9f9; border-radius: 8px; border-right: 4px solid #D4AF37; text-align: center; }
    .summary-card .label { font-size: 12px; color: #666; margin-bottom: 4px; }
    .summary-card .value { font-size: 20px; font-weight: bold; color: #D4AF37; }
    .institute-balance { background: ${instituteNet >= 0 ? '#e8f5e9' : '#ffebee'}; border: 2px solid ${instituteNet >= 0 ? '#4CAF50' : '#c62828'}; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
    .institute-balance .label { font-size: 14px; color: #555; margin-bottom: 6px; }
    .institute-balance .value { font-size: 28px; font-weight: bold; color: ${instituteNet >= 0 ? '#2e7d32' : '#c62828'}; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f5f0e0; color: #D4AF37; }
    th, td { padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-size: 12px; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 13px; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:left;margin-bottom:10px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#D4AF37;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ طباعة التقرير</button>
  </div>
  <div class="header">
    <h1>معهد صرح البنوك</h1>
    <h2>التقرير المالي الشامل</h2>
  </div>
  <div class="summary-grid">
    <div class="summary-card"><div class="label">إجمالي المدفوعات</div><div class="value">${formatCurrency(totalPaid)}</div></div>
    <div class="summary-card"><div class="label">خصم المعهد</div><div class="value" style="color:#c62828;">${formatCurrency(totalDeduction)}</div></div>
    <div class="summary-card"><div class="label">حصة المدرسين</div><div class="value" style="color:#2e7d32;">${formatCurrency(totalTeacherShare)}</div></div>
    <div class="summary-card"><div class="label">إجمالي المسحوبات</div><div class="value" style="color:#e65100;">${formatCurrency(totalWithdrawn)}</div></div>
  </div>
  <div class="institute-balance">
    <div class="label">صافي رصيد المعهد (الخصومات - المسحوبات)</div>
    <div class="value">${formatCurrency(instituteNet)}</div>
  </div>
  <h3 style="color:#D4AF37;margin-bottom:10px;">تفاصيل أرصدة المدرسين</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>المدرس</th>
        <th>المادة</th>
        <th>المدفوع</th>
        <th>خصم المعهد</th>
        <th>حصة المدرس</th>
        <th>المسحوب</th>
        <th>المتبقي</th>
      </tr>
    </thead>
    <tbody>${balanceRows}</tbody>
  </table>
  <div class="footer">
    <p>تم إنشاء التقرير بتاريخ: ${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
    <p>معهد صرح البنوك — نظام الإدارة</p>
  </div>
</body>
</html>`;

      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    } catch {
      toast.error('فشل في توليد التقرير');
    } finally {
      setReportLoading(null);
    }
  };

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const studyTypeOffline = stats ? stats.offline_students_count : 0;
  const studyTypeOnline = stats ? stats.online_students_count : 0;
  const studyTypeTotal = studyTypeOffline + studyTypeOnline;
  const offlinePercent = studyTypeTotal > 0 ? ((studyTypeOffline / studyTypeTotal) * 100) : 0;
  const onlinePercent = studyTypeTotal > 0 ? ((studyTypeOnline / studyTypeTotal) * 100) : 0;

  const statusActive = stats ? stats.active_students : 0;
  const statusWithdrawn = stats ? stats.withdrawn_students : 0;
  const statusTotal = statusActive + statusWithdrawn;
  const activePercent = statusTotal > 0 ? ((statusActive / statusTotal) * 100) : 0;
  const withdrawnPercent = statusTotal > 0 ? ((statusWithdrawn / statusTotal) * 100) : 0;

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
        <h1 className="text-xl md:text-2xl font-bold text-[#FFE38A] flex items-center gap-2">
          <FileText className="h-6 w-6" />
          الإحصائيات والتقارير
        </h1>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-6">
        {/* ===== Summary Stats Grid ===== */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Students */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">إجمالي الطلاب</p>
                    <p className="text-[#D4AF37] text-2xl font-bold">{stats.total_students}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Active Students */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">الطلاب النشطين</p>
                    <p className="text-green-400 text-2xl font-bold">{stats.active_students}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawn Students */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <UserX className="h-6 w-6 text-[#CC4444]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">الطلاب المنسحبين</p>
                    <p className="text-[#CC4444] text-2xl font-bold">{stats.withdrawn_students}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Teachers */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">إجمالي المدرسين</p>
                    <p className="text-[#D4AF37] text-2xl font-bold">{stats.total_teachers}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Unique Subjects */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">المواد الدراسية</p>
                    <p className="text-[#D4AF37] text-2xl font-bold">{stats.unique_subjects}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Payments */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">إجمالي المدفوعات</p>
                    <p className="text-[#D4AF37] text-2xl font-bold">{formatCurrency(stats.total_payments_received)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Total Withdrawn */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">إجمالي المسحوبات</p>
                    <p className="text-orange-400 text-2xl font-bold">{formatCurrency(stats.total_withdrawn)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Students with Card */}
              <Card className="bg-[#222] border border-[#D4AF37]/30 rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-6 w-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">طلاب مع كارت</p>
                    <p className="text-[#D4AF37] text-2xl font-bold">{stats.students_with_card}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="bg-[#D4AF37]/20" />

            {/* ===== Study Type Distribution ===== */}
            <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-6">
              <h3 className="text-[#D4AF37] font-bold text-lg mb-5 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                توزيع أنواع الدراسة
              </h3>
              <div className="space-y-4">
                {/* Offline */}
                <div className="bg-[#1A1A1A] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-300 text-sm font-medium">طلاب حضوري</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{studyTypeOffline}</span>
                      <span className="text-blue-400 text-sm font-bold">{offlinePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${offlinePercent}%` }}
                    />
                  </div>
                </div>

                {/* Online */}
                <div className="bg-[#1A1A1A] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-gray-300 text-sm font-medium">طلاب إلكتروني</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{studyTypeOnline}</span>
                      <span className="text-purple-400 text-sm font-bold">{onlinePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${onlinePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Student Status Distribution ===== */}
            <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-6">
              <h3 className="text-[#D4AF37] font-bold text-lg mb-5 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                توزيع حالة الطلاب
              </h3>
              <div className="space-y-4">
                {/* Active */}
                <div className="bg-[#1A1A1A] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-300 text-sm font-medium">مستمر</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{statusActive}</span>
                      <span className="text-green-400 text-sm font-bold">{activePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${activePercent}%` }}
                    />
                  </div>
                </div>

                {/* Withdrawn */}
                <div className="bg-[#1A1A1A] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-gray-300 text-sm font-medium">منسحب</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{statusWithdrawn}</span>
                      <span className="text-red-400 text-sm font-bold">{withdrawnPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${withdrawnPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-[#D4AF37]/20" />

            {/* ===== Quick Report Buttons ===== */}
            <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-6">
              <h3 className="text-[#D4AF37] font-bold text-lg mb-5 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                التقارير السريعة
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={generateStudentReport}
                  disabled={reportLoading === 'students'}
                  className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold h-12 text-sm"
                >
                  {reportLoading === 'students' ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 ml-2" />
                  )}
                  تقرير شامل للطلاب
                </Button>
                <Button
                  onClick={generateTeacherReport}
                  disabled={reportLoading === 'teachers'}
                  className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold h-12 text-sm"
                >
                  {reportLoading === 'teachers' ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <GraduationCap className="h-4 w-4 ml-2" />
                  )}
                  تقرير شامل للمدرسين
                </Button>
                <Button
                  onClick={generateFinancialReport}
                  disabled={reportLoading === 'financial'}
                  className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold h-12 text-sm"
                >
                  {reportLoading === 'financial' ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4 ml-2" />
                  )}
                  تقرير مالي شامل
                </Button>
              </div>
            </div>

            <Separator className="bg-[#D4AF37]/20" />

            {/* ===== Financial Overview ===== */}
            <FinancialOverview stats={stats} />
          </>
        ) : null}
      </div>
    </div>
  );
}

// ==================== FINANCIAL OVERVIEW SUB-COMPONENT ====================

interface FinancialOverviewProps {
  stats: DashboardStats;
}

function FinancialOverview({ stats }: FinancialOverviewProps) {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAllBalances();
        setBalances(data);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalDeductions = balances.reduce((sum, b) => sum + (b.institute_deduction || 0), 0);
  const totalWithdrawn = balances.reduce((sum, b) => sum + (b.total_withdrawn || 0), 0);
  const instituteNet = totalDeductions - totalWithdrawn;

  return (
    <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-6">
      <h3 className="text-[#D4AF37] font-bold text-lg mb-5 flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        نظرة مالية عامة
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1A1A1A] rounded-xl p-5 text-center border border-green-500/20">
              <p className="text-gray-400 text-sm mb-2">إجمالي المدفوعات</p>
              <p className="text-green-400 text-xl font-bold">{formatCurrency(stats.total_payments_received)}</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-5 text-center border border-[#CC4444]/20">
              <p className="text-gray-400 text-sm mb-2">إجمالي الخصومات</p>
              <p className="text-[#CC4444] text-xl font-bold">{formatCurrency(totalDeductions)}</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-5 text-center border border-orange-500/20">
              <p className="text-gray-400 text-sm mb-2">إجمالي المسحوبات</p>
              <p className="text-orange-400 text-xl font-bold">{formatCurrency(totalWithdrawn)}</p>
            </div>
          </div>

          {/* Institute Net Balance */}
          <div className={`rounded-xl p-5 text-center border-2 ${
            instituteNet >= 0
              ? 'bg-green-500/5 border-green-500/30'
              : 'bg-red-500/5 border-[#CC4444]/30'
          }`}>
            <p className="text-gray-400 text-sm mb-2">صافي رصيد المعهد (الخصومات - المسحوبات)</p>
            <p className={`text-3xl font-bold ${
              instituteNet >= 0 ? 'text-green-400' : 'text-[#CC4444]'
            }`}>
              {formatCurrency(instituteNet)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
