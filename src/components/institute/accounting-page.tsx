'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrowRight, Search, Wallet, TrendingDown, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  fetchAllBalances,
  fetchTeacherBalance,
  fetchWithdrawals,
  createWithdrawal,
  formatCurrency,
  formatDate,
  type TeacherBalance,
} from '@/lib/api';

// ==================== INTERFACES ====================

interface AccountingPageProps {
  onBack: () => void;
}

interface TeacherBalanceRow extends TeacherBalance {
  id: number;
  name: string;
  subject: string;
}

interface WithdrawalRecord {
  id: number;
  teacherId: number;
  amount: number;
  notes: string | null;
  withdrawalDate: string;
}

// ==================== COMPONENT ====================

export default function AccountingPage({ onBack }: AccountingPageProps) {
  // ===== Data State =====
  const [allBalances, setAllBalances] = useState<TeacherBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== Search State =====
  const [searchQuery, setSearchQuery] = useState('');

  // ===== Selection State =====
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [selectedBalance, setSelectedBalance] = useState<TeacherBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // ===== Withdrawal State =====
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // ==========================================
  // FILTERED TEACHERS
  // ==========================================
  const filteredBalances = useMemo(() => {
    if (!searchQuery.trim()) return allBalances;
    const q = searchQuery.trim().toLowerCase();
    return allBalances.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }, [allBalances, searchQuery]);

  // ==========================================
  // FETCH ALL BALANCES
  // ==========================================
  const loadAllBalances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllBalances();
      setAllBalances(data);
    } catch {
      toast.error('فشل في تحميل بيانات المحاسبة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllBalances();
  }, [loadAllBalances]);

  // ==========================================
  // SELECT TEACHER & LOAD DETAILS
  // ==========================================
  const handleSelectTeacher = useCallback(async (teacher: TeacherBalanceRow) => {
    setSelectedTeacherId(teacher.id);
    setWithdrawAmount('');
    setWithdrawNotes('');
    setBalanceLoading(true);
    setWithdrawalsLoading(true);

    try {
      const [balanceData, withdrawalsData] = await Promise.all([
        fetchTeacherBalance(teacher.id),
        fetchWithdrawals(teacher.id),
      ]);
      setSelectedBalance(balanceData);
      setWithdrawals(withdrawalsData);
    } catch {
      toast.error('فشل في تحميل بيانات المدرس');
    } finally {
      setBalanceLoading(false);
      setWithdrawalsLoading(false);
    }
  }, []);

  // ==========================================
  // CREATE WITHDRAWAL
  // ==========================================
  const handleWithdraw = useCallback(async () => {
    if (!selectedTeacherId) return;

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (!selectedBalance) return;
    if (amount > selectedBalance.remaining) {
      toast.error(`المبلغ يتجاوز الرصيد المتبقي (${formatCurrency(selectedBalance.remaining)})`);
      return;
    }

    setWithdrawSubmitting(true);
    try {
      await createWithdrawal({
        teacherId: selectedTeacherId,
        amount,
        notes: withdrawNotes.trim() || undefined,
      });
      toast.success('تم تسجيل السحب بنجاح');
      setWithdrawAmount('');
      setWithdrawNotes('');

      // Refresh data
      const [balanceData, withdrawalsData, allBalancesData] = await Promise.all([
        fetchTeacherBalance(selectedTeacherId),
        fetchWithdrawals(selectedTeacherId),
        fetchAllBalances(),
      ]);
      setSelectedBalance(balanceData);
      setWithdrawals(withdrawalsData);
      setAllBalances(allBalancesData);
    } catch (error: any) {
      toast.error(error?.message || 'فشل في تسجيل السحب');
    } finally {
      setWithdrawSubmitting(false);
    }
  }, [selectedTeacherId, withdrawAmount, withdrawNotes, selectedBalance]);

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
          <Wallet className="h-6 w-6" />
          محاسبة المدرسين - السحوبات والرصيد
        </h1>
      </div>

      <div className="px-4 md:px-6 pb-8">
        {/* Two-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ===== LEFT: Teachers List ===== */}
          <div className="lg:w-[55%] xl:w-[60%] space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث باسم المدرس أو المادة..."
                className="bg-[#222] border-gray-600 text-white placeholder:text-gray-500 pr-10"
              />
            </div>

            {/* Teachers Table */}
            <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                </div>
              ) : filteredBalances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Wallet className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg">لا يوجد بيانات محاسبية</p>
                  <p className="text-sm mt-1">قم بإضافة مدرسين وربط الطلاب أولاً</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-280px)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-transparent">
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">اسم المدرس</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">المادة</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">الطلاب</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">الدافعين</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">المدفوع</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">خصم المعهد</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">مستحقات المدرس</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">المسحوب</TableHead>
                        <TableHead className="text-[#D4AF37] font-bold text-center text-xs">المتبقي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBalances.map((teacher) => (
                        <TableRow
                          key={teacher.id}
                          className={`border-gray-700 hover:bg-[#2a2a2a] cursor-pointer transition-colors ${
                            selectedTeacherId === teacher.id
                              ? 'bg-[#D4AF37]/10 border-[#D4AF37] border-r-2'
                              : ''
                          }`}
                          onClick={() => handleSelectTeacher(teacher)}
                        >
                          <TableCell className="text-center text-white font-medium text-sm">
                            {teacher.name}
                          </TableCell>
                          <TableCell className="text-center text-[#FFE38A] text-xs">
                            {teacher.subject}
                          </TableCell>
                          <TableCell className="text-center text-gray-300 text-xs">
                            {teacher.total_students}
                          </TableCell>
                          <TableCell className="text-center text-green-400 text-xs font-bold">
                            {teacher.paying_students_count}
                          </TableCell>
                          <TableCell className="text-center text-gray-300 text-xs">
                            {formatCurrency(teacher.total_paid)}
                          </TableCell>
                          <TableCell className="text-center text-[#CC4444] text-xs">
                            {formatCurrency(teacher.institute_deduction)}
                          </TableCell>
                          <TableCell className="text-center text-[#FFE38A] text-xs font-bold">
                            {formatCurrency(teacher.teacher_share)}
                          </TableCell>
                          <TableCell className="text-center text-orange-400 text-xs">
                            {formatCurrency(teacher.total_withdrawn)}
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold">
                            <span className={teacher.remaining >= 0 ? 'text-green-400' : 'text-[#CC4444]'}>
                              {formatCurrency(teacher.remaining)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* ===== RIGHT: Selected Teacher Details ===== */}
          <div className="lg:w-[45%] xl:w-[40%] space-y-6">
            {!selectedTeacherId ? (
              <div className="bg-[#222] border border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
                <Wallet className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg">اختر مدرساً من القائمة</p>
                <p className="text-sm mt-1">لعرض التفاصيل وتسجيل السحوبات</p>
              </div>
            ) : (
              <>
                {/* Teacher Header */}
                {(() => {
                  const teacher = allBalances.find((t) => t.id === selectedTeacherId);
                  return (
                    <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-5">
                      <h2 className="text-xl font-bold text-[#D4AF37]">{teacher?.name}</h2>
                      <p className="text-[#FFE38A] text-sm mt-1">{teacher?.subject}</p>
                    </div>
                  );
                })()}

                {/* Balance Info Card */}
                {balanceLoading ? (
                  <div className="bg-[#222] border border-gray-700 rounded-xl p-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  </div>
                ) : selectedBalance ? (
                  <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-5 space-y-4">
                    <h3 className="text-[#D4AF37] font-bold text-sm flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      معلومات الرصيد
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] mb-1">عدد الطلاب الكلي</p>
                        <p className="text-white font-bold text-lg">{selectedBalance.total_students}</p>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] mb-1">عدد الطلاب الدافعين</p>
                        <p className="text-green-400 font-bold text-lg">{selectedBalance.paying_students_count}</p>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] mb-1">إجمالي المدفوعات</p>
                        <p className="text-white font-bold">{formatCurrency(selectedBalance.total_paid)}</p>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] mb-1">خصم المعهد</p>
                        <p className="text-[#CC4444] font-bold">{formatCurrency(selectedBalance.institute_deduction)}</p>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] mb-1">مستحقات المدرس</p>
                        <p className="text-[#FFE38A] font-bold">{formatCurrency(selectedBalance.teacher_share)}</p>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-[10px] mb-1">المسحوب سابقاً</p>
                        <p className="text-orange-400 font-bold">{formatCurrency(selectedBalance.total_withdrawn)}</p>
                      </div>
                    </div>

                    {/* Remaining Balance - Large */}
                    <div className={`rounded-xl p-5 text-center border-2 ${
                      selectedBalance.remaining >= 0
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-red-500/5 border-[#CC4444]/30'
                    }`}>
                      <p className="text-gray-400 text-sm mb-2">الرصيد المتبقي</p>
                      <p className={`text-3xl font-bold ${
                        selectedBalance.remaining >= 0 ? 'text-green-400' : 'text-[#CC4444]'
                      }`}>
                        {formatCurrency(selectedBalance.remaining)}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Withdrawal Section */}
                {selectedBalance && (
                  <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-5 space-y-4">
                    <h3 className="text-[#D4AF37] font-bold text-sm flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      تسجيل سحب جديد
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">المبلغ المسحوب *</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1000"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="أدخل المبلغ..."
                          className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">ملاحظات</Label>
                        <Input
                          value={withdrawNotes}
                          onChange={(e) => setWithdrawNotes(e.target.value)}
                          placeholder="ملاحظات إضافية (اختياري)"
                          className="bg-[#1A1A1A] border-gray-600 text-white placeholder:text-gray-500"
                        />
                      </div>
                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawSubmitting || !withdrawAmount}
                        className="w-full bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold h-11"
                      >
                        {withdrawSubmitting ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 ml-2" />
                        )}
                        تسجيل السحب
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recent Withdrawals */}
                <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-5 space-y-3">
                  <h3 className="text-[#D4AF37] font-bold text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    السحوبات الأخيرة
                  </h3>
                  {withdrawalsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">لا توجد سحوبات سابقة</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-96">
                      <div className="space-y-2">
                        {withdrawals.slice(0, 10).map((w) => (
                          <div
                            key={w.id}
                            className="bg-[#333] border border-[#D4AF37]/30 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-sm">
                                {formatCurrency(w.amount)}
                              </p>
                              {w.notes && (
                                <p className="text-gray-400 text-xs mt-0.5 truncate">{w.notes}</p>
                              )}
                            </div>
                            <div className="text-left flex-shrink-0 mr-3">
                              <p className="text-gray-400 text-[10px]">{formatDate(w.withdrawalDate)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
