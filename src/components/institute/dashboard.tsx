'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingDown,
  Building,
  Monitor,
  Calculator,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { fetchStats, formatCurrency, type DashboardStats } from '@/lib/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface StatCard {
  label: string;
  key: keyof DashboardStats;
  icon: React.ReactNode;
  format?: 'number' | 'currency';
}

const statCards: StatCard[] = [
  { label: 'إجمالي الطلاب', key: 'total_students', icon: <Users className="text-2xl" />, format: 'number' },
  { label: 'الطلاب النشطين', key: 'active_students', icon: <UserCheck className="text-2xl" />, format: 'number' },
  { label: 'إجمالي المدرسين', key: 'total_teachers', icon: <GraduationCap className="text-2xl" />, format: 'number' },
  { label: 'المواد الدراسية', key: 'unique_subjects', icon: <BookOpen className="text-2xl" />, format: 'number' },
  { label: 'إجمالي المدفوعات', key: 'total_payments_received', icon: <DollarSign className="text-2xl" />, format: 'currency' },
  { label: 'إجمالي المسحوبات', key: 'total_withdrawn', icon: <TrendingDown className="text-2xl" />, format: 'currency' },
  { label: 'طلاب حضوري', key: 'offline_students_count', icon: <Building className="text-2xl" />, format: 'number' },
  { label: 'طلاب إلكتروني', key: 'online_students_count', icon: <Monitor className="text-2xl" />, format: 'number' },
];

interface NavCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  page: string;
}

const navCards: NavCard[] = [
  {
    title: 'إدارة الطلاب',
    description: 'إضافة وتعديل الطلاب وربطهم بالمدرسين ومتابعة كارتات الحجز',
    icon: <Users className="text-5xl" />,
    page: 'students',
  },
  {
    title: 'إدارة المدرسين',
    description: 'تسجيل وتعديل المدرسين وتحديد المواد والأقساط والنسب',
    icon: <GraduationCap className="text-5xl" />,
    page: 'teachers',
  },
  {
    title: 'إدارة الحسابات',
    description: 'متابعة الأقساط والمدفوعات والمتبقي للطلاب والمدرسين',
    icon: <Calculator className="text-5xl" />,
    page: 'accounting',
  },
  {
    title: 'الإحصائيات والتقارير',
    description: 'تقارير وإحصائيات دقيقة لنتائج وأداء المعهد',
    icon: <BarChart3 className="text-5xl" />,
    page: 'stats',
  },
];

function formatStatValue(value: number | undefined, format?: 'number' | 'currency'): string {
  if (value === undefined || value === null) return '—';
  if (format === 'currency') return formatCurrency(value);
  return value.toLocaleString('ar-IQ');
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
        setError('فشل في تحميل الإحصائيات');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Header Section */}
      <header className="flex flex-col items-center justify-center pt-10 pb-8 px-4">
        <p className="text-[#D4AF37] text-3xl font-bold mb-2">
          نظام إدارة معهد صرح البنوك
        </p>
        <h1 className="text-[#FFE38A] text-5xl font-bold mb-4">
          لوحة تحكم المعهد
        </h1>
        <p className="text-[#999] text-base text-center max-w-2xl leading-relaxed">
          منصة شاملة لإدارة الطلاب والمدرسين والحسابات المالية ومتابعة أداء المعهد
          بكفاءة وسهولة
        </p>
      </header>

      {/* Stats Grid */}
      <section className="max-w-6xl mx-auto px-4 mb-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-3 animate-pulse"
              >
                <div className="w-8 h-8 bg-[#D4AF37]/20 rounded-full" />
                <div className="w-20 h-4 bg-[#D4AF37]/10 rounded" />
                <div className="w-16 h-6 bg-[#D4AF37]/10 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-[#CC4444] text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#D4AF37] underline text-sm hover:text-[#FFE38A] transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const value = stats ? (stats[card.key] as number) : 0;
              return (
                <div
                  key={card.key}
                  className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:border-[#D4AF37]/60 transition-all duration-300"
                >
                  <div className="text-[#D4AF37]">{card.icon}</div>
                  <span className="text-[#999] text-sm text-center">{card.label}</span>
                  <span className="text-[#FFE38A] text-2xl font-bold">
                    {formatStatValue(value, card.format)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Loading spinner overlay for initial load */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="text-[#D4AF37] animate-spin h-6 w-6" />
          <span className="text-[#999] text-sm">جاري تحميل البيانات...</span>
        </div>
      )}

      {/* Navigation Cards */}
      <section className="max-w-6xl mx-auto px-4 mb-12">
        <div className="flex flex-wrap justify-center gap-6">
          {navCards.map((card) => (
            <div
              key={card.page}
              onClick={() => onNavigate(card.page)}
              className="w-full max-w-[280px] h-[350px] bg-[#222] border-2 border-[#D4AF37] rounded-[20px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#FFE38A] hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all duration-300 px-6"
            >
              <div className="text-[#D4AF37] transition-transform duration-300 group-hover:scale-110">
                {card.icon}
              </div>
              <h3 className="text-[#FFE38A] text-xl font-bold text-center">
                {card.title}
              </h3>
              <p className="text-[#999] text-sm text-center leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-[#222]">
        <p className="text-[#999] text-sm">
          &copy; 2025-2026 معهد صرح البنوك. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
