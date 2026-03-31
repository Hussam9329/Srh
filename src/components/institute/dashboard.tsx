'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Shield,
} from 'lucide-react';
import { fetchStats, formatCurrency, type DashboardStats } from '@/lib/api';

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
  {
    title: 'إدارة المستخدمين',
    description: 'إدارة حسابات المستخدمين والصلاحيات والمستويات',
    icon: <Shield className="text-5xl" />,
    page: 'users',
  },
];

function formatStatValue(value: number | undefined, format?: 'number' | 'currency'): string {
  if (value === undefined || value === null) return '—';
  if (format === 'currency') return formatCurrency(value);
  return value.toLocaleString('ar-IQ');
}

const pageRoutes: Record<string, string> = {
  students: '/students',
  teachers: '/teachers',
  accounting: '/accounting',
  stats: '/stats',
  users: '/users',
};

export default function Dashboard() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#1A1A1A] text-white">
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
            {statCards.map((card, index) => {
              const value = stats ? (stats[card.key] as number) : 0;
              return (
                <div
                  key={card.key}
                  className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:border-[#D4AF37]/60 transition-all duration-300 animate-[fadeIn_0.5s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 80}ms` }}
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

      {/* Navigation Cards */}
      <section className="max-w-6xl mx-auto px-4 mb-12">
        <div className="flex flex-wrap justify-center gap-6">
          {navCards.map((card) => (
            <div
              key={card.page}
              onClick={() => router.push(pageRoutes[card.page])}
              className="group w-full max-w-[280px] min-h-[300px] bg-[#222] border-2 border-[#D4AF37] rounded-[20px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#FFE38A] hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all duration-300 px-6"
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
      <footer className="text-center py-8 border-t border-[#333]">
        <p className="text-[#999] text-sm">
          &copy; 2025-2026 معهد صرح البنوك. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
