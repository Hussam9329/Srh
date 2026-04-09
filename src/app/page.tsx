'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard, GraduationCap, Users, Wallet, Receipt, FileText,
  Plus, Search, Trash2, Download, Printer, Eye, Menu, X,
  ChevronLeft, DollarSign, Building2, UserCheck, CreditCard, TrendingUp,
  Phone, CalendarDays, BookOpen
} from 'lucide-react';

// ============ TYPES ============
interface Teacher {
  id: string; name: string; subject: string; percentage: number;
  balance: number; students?: { student: { id: string; name: string } }[];
  withdrawals?: Withdrawal[];
  _count?: { students: number };
}

interface Student {
  id: string; name: string; studyType: string; qrCode: string;
  createdAt: string; teachers: { teacher: Teacher }[];
  payments: Payment[];
}

interface Payment {
  id: string; studentId: string; amount: number; instituteAmount: number;
  teacherAmount: number; description: string | null; createdAt: string;
  teacherDistributions: string; student?: { name: string };
}

interface Withdrawal {
  id: string; teacherId: string; amount: number; note: string | null;
  createdAt: string; teacher?: Teacher;
}

interface DashboardData {
  totalStudents: number; totalTeachers: number;
  instituteIncome: number; totalWithdrawn: number;
  teacherBalancesRemaining: number; recentPayments: Payment[];
}

interface TeacherReport {
  teacher: Teacher; totalReceived: number; totalWithdrawn: number;
  currentBalance: number; students: any[]; withdrawals: Withdrawal[];
}

type Page = 'dashboard' | 'teachers' | 'students' | 'payments' | 'settlements' | 'reports';

// ============ HELPER ============
const fmt = (n: number) => n.toLocaleString('ar-IQ', { minimumFractionDigits: 0 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtDateTime = (d: string) => new Date(d).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ============ MAIN APP ============
export default function InstituteApp() {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'teachers', label: 'المدرسين', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'students', label: 'الطلاب', icon: <Users className="w-5 h-5" /> },
    { id: 'payments', label: 'استلام الأقساط', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'settlements', label: 'مستحقات المدرسين', icon: <Wallet className="w-5 h-5" /> },
    { id: 'reports', label: 'التقارير', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-64 bg-[#0D0D20] border-l border-border z-50 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:z-auto`}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">إدارة المعهد</h1>
              <p className="text-xs text-muted-foreground">نظام متكامل</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${page === item.id
                  ? 'bg-primary/15 text-primary shadow-lg shadow-primary/10'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-border">
          <div className="text-center text-xs text-muted-foreground">
            <p>نظام إدارة المعهد</p>
            <p className="mt-1">الإصدار 1.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0B0B1A]/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {navItems.find(n => n.id === page)?.label}
            </h2>
            <div className="w-8" />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'teachers' && <TeachersPage />}
          {page === 'students' && <StudentsPage />}
          {page === 'payments' && <PaymentsPage />}
          {page === 'settlements' && <SettlementsPage />}
          {page === 'reports' && <ReportsPage />}
        </div>
      </main>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await fetch('/api/init', { method: 'POST' });
        const res = await fetch('/api/dashboard');
        setData(await res.json());
      } catch { /* */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <p className="text-center text-muted-foreground">لا توجد بيانات</p>;

  const stats = [
    { label: 'إجمالي الطلاب', value: data.totalStudents, icon: <Users className="w-6 h-6" />, color: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/20 text-primary' },
    { label: 'إجمالي المدرسين', value: data.totalTeachers, icon: <GraduationCap className="w-6 h-6" />, color: 'from-[#7C6BFF]/20 to-[#7C6BFF]/5', iconBg: 'bg-[#7C6BFF]/20 text-[#7C6BFF]' },
    { label: 'إيرادات المعهد', value: fmt(data.instituteIncome), icon: <Building2 className="w-6 h-6" />, color: 'from-success/20 to-success/5', iconBg: 'bg-success/20 text-success', isMoney: true },
    { label: 'مستحقات المدرسين', value: fmt(data.teacherBalancesRemaining), icon: <Wallet className="w-6 h-6" />, color: 'from-warning/20 to-warning/5', iconBg: 'bg-warning/20 text-warning', isMoney: true },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="bg-gradient-to-br border-border hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-white">
                    {s.isMoney && <span className="text-lg ml-1">د.ع</span>}
                    {s.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  {s.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            آخر المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد مدفوعات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-right py-3 px-3 font-medium">الطالب</th>
                    <th className="text-right py-3 px-3 font-medium">المبلغ</th>
                    <th className="text-right py-3 px-3 font-medium">حصة المعهد</th>
                    <th className="text-right py-3 px-3 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-3 text-white">{p.student?.name || '—'}</td>
                      <td className="py-3 px-3 text-success font-semibold">{fmt(p.amount)} د.ع</td>
                      <td className="py-3 px-3 text-primary">{fmt(p.instituteAmount)} د.ع</td>
                      <td className="py-3 px-3 text-muted-foreground">{fmtDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <Card key={i} className="border-border animate-pulse">
          <CardContent className="p-5">
            <div className="h-4 bg-muted rounded w-24 mb-3" />
            <div className="h-8 bg-muted rounded w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============ TEACHERS ============
function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', percentage: '' });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTeachers = () => {
    fetch('/api/teachers').then(r => r.json()).then(data => { setTeachers(data); setLoading(false); });
  };

  useEffect(() => { loadTeachers(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.subject || !form.percentage) {
      toast({ title: 'تنبيه', description: 'جميع الحقول مطلوبة', variant: 'destructive' });
      return;
    }
    const res = await fetch('/api/teachers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast({ title: 'تم بنجاح', description: 'تم إضافة المدرس' });
      setOpen(false);
      setForm({ name: '', subject: '', percentage: '' });
      loadTeachers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدرس؟')) return;
    await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    toast({ title: 'تم الحذف', description: 'تم حذف المدرس' });
    loadTeachers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">{teachers.length} مدرس مسجل</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus className="w-4 h-4" /> إضافة مدرس
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="text-white">إضافة مدرس جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-muted-foreground">اسم المدرس</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أدخل اسم المدرس" className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">المادة</Label>
                <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="أدخل اسم المادة" className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">نسبة المعهد (%)</Label>
                <Input type="number" value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value })} placeholder="مثلاً: 30" className="bg-secondary border-border mt-1" />
                <p className="text-xs text-muted-foreground mt-1">النسبة التي يأخذها المعهد من كل قسط</p>
              </div>
              <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary/90 text-white">حفظ المدرس</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="border-border animate-pulse"><CardContent className="p-5 h-20" /></Card>)}</div>
      ) : teachers.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا يوجد مدرسين بعد. أضف أول مدرس!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {teachers.map(t => (
            <Card key={t.id} className="border-border hover:border-primary/20 transition-all duration-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.subject} · نسبة المعهد {t.percentage}% · {t._count?.students || t.students?.length || 0} طالب</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">الرصيد</p>
                    <p className="font-bold text-success">{fmt(t.balance)} <span className="text-xs">د.ع</span></p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ STUDENTS ============
function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', studyType: 'حضوري', teacherIds: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [badgeStudent, setBadgeStudent] = useState<Student | null>(null);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loadStudents = () => {
    Promise.all([fetch('/api/students'), fetch('/api/teachers')]).then(([sRes, tRes]) =>
      Promise.all([sRes.json(), tRes.json()]).then(([sData, tData]) => { setStudents(sData); setTeachers(tData); setLoading(false); })
    );
  };

  useEffect(() => { loadStudents(); }, []);

  const handleAdd = async () => {
    if (!form.name) {
      toast({ title: 'تنبيه', description: 'اسم الطالب مطلوب', variant: 'destructive' });
      return;
    }
    const res = await fetch('/api/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const newStudent = await res.json();
      toast({ title: 'تم بنجاح', description: `تم إضافة الطالب ${form.name} مع رمز QR` });
      setOpen(false);
      setForm({ name: '', studyType: 'حضوري', teacherIds: [] });
      setBadgeStudent(newStudent);
      setBadgeOpen(true);
      loadStudents();
    }
  };

  const toggleTeacher = (tid: string) => {
    setForm(f => ({
      ...f,
      teacherIds: f.teacherIds.includes(tid) ? f.teacherIds.filter(id => id !== tid) : [...f.teacherIds, tid]
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    toast({ title: 'تم الحذف' });
    loadStudents();
  };

  const downloadBadge = async (format: 'png' | 'pdf') => {
    if (!badgeRef.current || !badgeStudent) return;
    try {
      const canvas = await html2canvas(badgeRef.current, { backgroundColor: '#0D0D20', scale: 2 });
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `badge-${badgeStudent.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'credit-card');
        pdf.addImage(imgData, 'PNG', 0, 0, 86, 54);
        pdf.save(`badge-${badgeStudent.name}.pdf`);
      }
    } catch { toast({ title: 'خطأ', description: 'فشل في تحميل الباج', variant: 'destructive' }); }
  };

  const viewBadge = (student: Student) => {
    setBadgeStudent(student);
    setBadgeOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">{students.length} طالب مسجل</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus className="w-4 h-4" /> إضافة طالب
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle className="text-white">تسجيل طالب جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-muted-foreground">اسم الطالب</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أدخل اسم الطالب" className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">نوع الدراسة</Label>
                <Select value={form.studyType} onValueChange={v => setForm({ ...form, studyType: v })}>
                  <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="حضوري">حضوري</SelectItem>
                    <SelectItem value="إلكتروني">إلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">المدرسين</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {teachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">لا يوجد مدرسين. أضف مدرسين أولاً.</p>
                  ) : teachers.map(t => (
                    <label key={t.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${form.teacherIds.includes(t.id) ? 'bg-primary/15 border border-primary/30' : 'bg-secondary border border-transparent hover:border-border'}`}>
                      <input type="checkbox" checked={form.teacherIds.includes(t.id)} onChange={() => toggleTeacher(t.id)} className="accent-primary" />
                      <div>
                        <p className="text-sm text-white">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.subject}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary/90 text-white" disabled={teachers.length === 0}>
                حفظ وإنشاء QR
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Badge Dialog */}
      <Dialog open={badgeOpen} onOpenChange={setBadgeOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="text-white">باج الطالب</DialogTitle></DialogHeader>
          {badgeStudent && (
            <div className="space-y-4">
              <div ref={badgeRef} className="bg-[#0D0D20] rounded-2xl p-6 text-center" dir="rtl" style={{ width: '340px', margin: '0 auto' }}>
                {/* Badge Header */}
                <div className="bg-primary/10 border-b-2 border-primary pb-3 mb-4">
                  <h3 className="text-primary font-bold text-lg">نظام إدارة المعهد</h3>
                  <p className="text-xs text-muted-foreground">Institute Management System</p>
                </div>
                {/* Student Info */}
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary">{badgeStudent.name.charAt(0)}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">{badgeStudent.name}</h4>
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-0">{badgeStudent.studyType}</Badge>
                </div>
                {/* QR Code */}
                <div className="inline-block p-3 bg-white rounded-xl mb-3">
                  <QRCodeSVG value={badgeStudent.qrCode} size={100} />
                </div>
                <p className="text-xs text-muted-foreground mb-2 font-mono">{badgeStudent.qrCode}</p>
                {/* Date */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  <span>{fmtDate(badgeStudent.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => downloadBadge('png')} variant="outline" className="flex-1 border-border text-white hover:bg-secondary">
                  <Download className="w-4 h-4 ml-2" /> PNG
                </Button>
                <Button onClick={() => downloadBadge('pdf')} variant="outline" className="flex-1 border-border text-white hover:bg-secondary">
                  <Download className="w-4 h-4 ml-2" /> PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Students List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="border-border animate-pulse"><CardContent className="p-5 h-24" /></Card>)}</div>
      ) : students.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا يوجد طلاب بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {students.map(s => {
            const totalPaid = s.payments.reduce((sum, p) => sum + p.amount, 0);
            return (
              <Card key={s.id} className="border-border hover:border-primary/20 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#7C6BFF]/15 flex items-center justify-center text-[#7C6BFF]">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{s.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-secondary text-muted-foreground">{s.studyType}</Badge>
                          {s.teachers.map(ts => (
                            <span key={ts.teacher.id} className="text-xs text-muted-foreground">{ts.teacher.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-left hidden sm:block">
                        <p className="text-xs text-muted-foreground">الإجمالي المدفوع</p>
                        <p className="font-bold text-success">{fmt(totalPaid)} <span className="text-xs">د.ع</span></p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => viewBadge(s)} className="text-primary hover:text-primary hover:bg-primary/10" title="عرض الباج">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ PAYMENTS ============
function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showBreakdown, setShowBreakdown] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!search.trim()) return;
    const res = await fetch(`/api/students/search?q=${encodeURIComponent(search)}`);
    setResults(await res.json());
  };

  const selectStudent = (s: Student) => {
    setSelectedStudent(s);
    setResults([]);
    setSearch(s.name);
  };

  const handlePayment = async () => {
    if (!selectedStudent || !amount || parseFloat(amount) <= 0) {
      toast({ title: 'تنبيه', description: 'أدخل مبلغ صحيح', variant: 'destructive' });
      return;
    }
    const res = await fetch('/api/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent.id, amount, description })
    });
    if (res.ok) {
      const data = await res.json();
      setShowBreakdown(data);
      toast({ title: 'تم بنجاح', description: `تم تسجيل دفعة بقيمة ${amount} د.ع` });
      setAmount('');
      setDescription('');
      // Refresh student data
      const sRes = await fetch(`/api/students/${selectedStudent.id}`);
      setSelectedStudent(await sRes.json());
    } else {
      const err = await res.json();
      toast({ title: 'خطأ', description: err.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="ابحث بالاسم أو رمز QR..." className="bg-secondary border-border pr-10" dir="rtl" />
            </div>
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-white">بحث</Button>
          </div>
          {/* Search Results */}
          {results.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {results.map(s => (
                <button key={s.id} onClick={() => selectStudent(s)} className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-primary/10 transition-colors text-right">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">{s.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.studyType} · {s.teachers.length} مدرس</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Student Profile */}
      {selectedStudent && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                {selectedStudent.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">نوع الدراسة</p>
                  <p className="text-sm font-semibold text-white mt-1">{selectedStudent.studyType}</p>
                </div>
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">المدرسين</p>
                  <p className="text-sm font-semibold text-white mt-1">{selectedStudent.teachers.length} مدرس</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">المدرسين المرتبطين</p>
                <div className="space-y-1">
                  {selectedStudent.teachers.map(ts => (
                    <div key={ts.teacher.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg text-sm">
                      <span className="text-white">{ts.teacher.name} <span className="text-muted-foreground">({ts.teacher.subject})</span></span>
                      <Badge variant="secondary" className="bg-primary/15 text-primary">{ts.teacher.percentage}% للمعهد</Badge>
                    </div>
                  ))}
                </div>
              </div>
              {/* Payment Form */}
              <Separator className="bg-border" />
              <div className="space-y-3">
                <Label className="text-muted-foreground">تسجيل دفعة جديدة</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="المبلغ (د.ع)" className="bg-secondary border-border" />
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف اختياري..." className="bg-secondary border-border" />
                <Button onClick={handlePayment} className="w-full bg-success hover:bg-success/90 text-white gap-2">
                  <DollarSign className="w-4 h-4" /> تسجيل الدفعة
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Breakdown */}
            {showBreakdown && (
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-success text-base">تفاصيل التوزيع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">إجمالي الدفعة</span>
                    <span className="font-bold text-white">{fmt(showBreakdown.payment.amount)} د.ع</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">حصة المعهد</span>
                    <span className="font-bold text-primary">{fmt(showBreakdown.payment.instituteAmount)} د.ع</span>
                  </div>
                  <Separator className="bg-border" />
                  {showBreakdown.distributions.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{d.teacherName}</span>
                      <span className="font-bold text-success">{fmt(d.amount)} د.ع</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-white text-base">سجل المدفوعات</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStudent.payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">لا توجد مدفوعات</p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-success">{fmt(p.amount)} د.ع</p>
                          {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SETTLEMENTS ============
function SettlementsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTeachersSettle = () => {
    fetch('/api/teachers').then(r => r.json()).then(data => { setTeachers(data); setLoading(false); });
  };

  useEffect(() => { loadTeachersSettle(); }, []);

  const selectTeacher = async (id: string) => {
    setSelectedTeacherId(id);
    const res = await fetch(`/api/teachers/${id}`);
    const data = await res.json();
    setSelectedTeacher(data);
    setWithdrawals(data.withdrawals || []);
  };

  const handleWithdraw = async () => {
    if (!selectedTeacherId || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({ title: 'تنبيه', description: 'أدخل مبلغ صحيح', variant: 'destructive' });
      return;
    }
    const res = await fetch('/api/withdrawals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: selectedTeacherId, amount: withdrawAmount, note: withdrawNote })
    });
    if (res.ok) {
      toast({ title: 'تم بنجاح', description: 'تم تسجيل السحب' });
      setWithdrawAmount('');
      setWithdrawNote('');
      selectTeacher(selectedTeacherId);
      loadTeachersSettle(); // refresh balances
    } else {
      const err = await res.json();
      toast({ title: 'خطأ', description: err.error, variant: 'destructive' });
    }
  };

  const totalWithdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);

  return (
    <div className="space-y-6">
      {/* Teacher Selector */}
      <Card className="border-border">
        <CardContent className="p-5">
          <Label className="text-muted-foreground block mb-2">اختر المدرس</Label>
          <Select value={selectedTeacherId} onValueChange={selectTeacher}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="اختر مدرساً..." /></SelectTrigger>
            <SelectContent>
              {teachers.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.subject}) — رصيد: {fmt(t.balance)} د.ع
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTeacher && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Teacher Info & Withdraw Form */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                {selectedTeacher.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">المادة</p>
                  <p className="text-sm font-semibold text-white mt-1">{selectedTeacher.subject}</p>
                </div>
                <div className="bg-success/10 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">الرصيد المتاح</p>
                  <p className="text-sm font-bold text-success mt-1">{fmt(selectedTeacher.balance)} <span className="text-xs">د.ع</span></p>
                </div>
              </div>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <Label className="text-muted-foreground">تسجيل سحب</Label>
                <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="مبلغ السحب (د.ع)" className="bg-secondary border-border" />
                <Textarea value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} placeholder="ملاحظة اختيارية..." className="bg-secondary border-border" />
                <Button onClick={handleWithdraw} className="w-full bg-primary hover:bg-primary/90 text-white gap-2" disabled={parseFloat(withdrawAmount) > selectedTeacher.balance}>
                  <Wallet className="w-4 h-4" /> تسجيل السحب
                </Button>
                {parseFloat(withdrawAmount) > selectedTeacher.balance && (
                  <p className="text-xs text-destructive">المبلغ يتجاوز الرصيد المتاح</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center justify-between">
                <span>سجل السحوبات</span>
                <Badge variant="secondary" className="bg-primary/15 text-primary">{fmt(totalWithdrawn)} د.ع</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">لا توجد سحوبات</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {withdrawals.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-destructive">-{fmt(w.amount)} د.ع</p>
                        {w.note && <p className="text-xs text-muted-foreground">{w.note}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(w.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============ REPORTS ============
function ReportsPage() {
  const [tab, setTab] = useState<'teacher' | 'students'>('teacher');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [report, setReport] = useState<TeacherReport | null>(null);
  const [studentsReport, setStudentsReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/teachers');
      setTeachers(await res.json());
      const sRes = await fetch('/api/reports/students');
      setStudentsReport(await sRes.json());
    };
  }, []);

  const loadTeacherReport = async (id: string) => {
    setSelectedTeacherId(id);
    setLoading(true);
    const res = await fetch(`/api/reports/teacher/${id}`);
    setReport(await res.json());
    setLoading(false);
  };

  const printReport = (title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar"><head><title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #333; }
        h1 { color: #FF6347; border-bottom: 3px solid #FF6347; padding-bottom: 10px; }
        h2 { color: #0B0B1A; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #0B0B1A; color: white; padding: 10px; text-align: right; }
        td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f5f5f5; }
        .stat { display: inline-block; background: #f0f0f5; padding: 10px 20px; border-radius: 8px; margin: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #FF6347; }
        .stat-label { font-size: 12px; color: #666; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { border: none; margin: 0; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header"><h1>نظام إدارة المعهد</h1><p>تقرير مالي</p></div>
    `);

    if (tab === 'teacher' && report) {
      printWindow.document.write(`
        <h2>تقرير المدرس: ${report.teacher.name}</h2>
        <p>المادة: ${report.teacher.subject} | نسبة المعهد: ${report.teacher.percentage}%</p>
        <div style="margin:20px 0">
          <div class="stat"><div class="stat-value">${fmt(report.totalReceived)}</div><div class="stat-label">إجمالي المستلم (د.ع)</div></div>
          <div class="stat"><div class="stat-value">${fmt(report.totalWithdrawn)}</div><div class="stat-label">إجمالي المسحوب (د.ع)</div></div>
          <div class="stat"><div class="stat-value">${fmt(report.currentBalance)}</div><div class="stat-label">الرصيد الحالي (د.ع)</div></div>
        </div>
        <h2>السحوبات</h2>
        <table><thead><tr><th>المبلغ</th><th>ملاحظة</th><th>التاريخ</th></tr></thead><tbody>
        ${report.withdrawals.map(w => `<tr><td>${fmt(w.amount)} د.ع</td><td>${w.note || '-'}</td><td>${fmtDateTime(w.createdAt)}</td></tr>`).join('')}
        </tbody></table>
      `);
    }

    if (tab === 'students') {
      printWindow.document.write(`
        <h2>كشف حساب الطلاب</h2>
        <table><thead><tr><th>الاسم</th><th>نوع الدراسة</th><th>المدرسين</th><th>الإجمالي المدفوع</th><th>عدد الدفعات</th></tr></thead><tbody>
        ${studentsReport.map(s => `<tr><td>${s.name}</td><td>${s.studyType}</td><td>${s.teachers.join(', ')}</td><td>${fmt(s.totalPaid)} د.ع</td><td>${s.paymentsCount}</td></tr>`).join('')}
        </tbody></table>
      `);
    }

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant={tab === 'teacher' ? 'default' : 'outline'} onClick={() => setTab('teacher')} className={tab === 'teacher' ? 'bg-primary text-white' : 'border-border text-muted-foreground'}>
          تقرير المدرس
        </Button>
        <Button variant={tab === 'students' ? 'default' : 'outline'} onClick={() => setTab('students')} className={tab === 'students' ? 'bg-primary text-white' : 'border-border text-muted-foreground'}>
          كشف الطلاب
        </Button>
      </div>

      {tab === 'teacher' && (
        <div className="space-y-6">
          <Card className="border-border">
            <CardContent className="p-5">
              <Label className="text-muted-foreground block mb-2">اختر المدرس</Label>
              <Select value={selectedTeacherId} onValueChange={loadTeacherReport}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="اختر مدرساً..." /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.subject})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading && <p className="text-center text-muted-foreground">جاري التحميل...</p>}

          {report && !loading && (
            <>
              <Button onClick={() => printReport(`تقرير ${report.teacher.name}`)} className="bg-primary hover:bg-primary/90 text-white gap-2">
                <Printer className="w-4 h-4" /> طباعة التقرير
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border bg-gradient-to-br from-success/10 to-success/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">إجمالي المستلم</p>
                    <p className="text-2xl font-bold text-success mt-1">{fmt(report.totalReceived)}</p>
                    <p className="text-xs text-muted-foreground">د.ع</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-gradient-to-br from-destructive/10 to-destructive/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">إجمالي المسحوب</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{fmt(report.totalWithdrawn)}</p>
                    <p className="text-xs text-muted-foreground">د.ع</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                    <p className="text-2xl font-bold text-primary mt-1">{fmt(report.currentBalance)}</p>
                    <p className="text-xs text-muted-foreground">د.ع</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-white text-base">سجل السحوبات</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.withdrawals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">لا توجد سحوبات</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border text-muted-foreground">
                          <th className="text-right py-2 px-3">المبلغ</th>
                          <th className="text-right py-2 px-3">ملاحظة</th>
                          <th className="text-right py-2 px-3">التاريخ</th>
                        </tr></thead>
                        <tbody>
                          {report.withdrawals.map(w => (
                            <tr key={w.id} className="border-b border-border/50">
                              <td className="py-2 px-3 text-destructive font-semibold">{fmt(w.amount)} د.ع</td>
                              <td className="py-2 px-3 text-muted-foreground">{w.note || '—'}</td>
                              <td className="py-2 px-3 text-muted-foreground">{fmtDateTime(w.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === 'students' && (
        <>
          <Button onClick={() => printReport('كشف حساب الطلاب')} className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Printer className="w-4 h-4" /> طباعة الكشف
          </Button>
          <Card className="border-border">
            <CardContent className="p-0">
              {studentsReport.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">لا يوجد طلاب</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-muted-foreground">
                      <th className="text-right py-3 px-3">الاسم</th>
                      <th className="text-right py-3 px-3">نوع الدراسة</th>
                      <th className="text-right py-3 px-3">المدرسين</th>
                      <th className="text-right py-3 px-3">الإجمالي</th>
                      <th className="text-right py-3 px-3">الدفعات</th>
                    </tr></thead>
                    <tbody>
                      {studentsReport.map(s => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-3 text-white font-medium">{s.name}</td>
                          <td className="py-3 px-3"><Badge variant="secondary" className="bg-secondary text-muted-foreground">{s.studyType}</Badge></td>
                          <td className="py-3 px-3 text-muted-foreground">{s.teachers.join('، ') || '—'}</td>
                          <td className="py-3 px-3 text-success font-semibold">{fmt(s.totalPaid)} د.ع</td>
                          <td className="py-3 px-3 text-muted-foreground">{s.paymentsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
