'use client';

import { useState } from 'react';
import Dashboard from '@/components/institute/dashboard';
import StudentsPage from '@/components/institute/students-page';
import TeachersPage from '@/components/institute/teachers-page';
import AccountingPage from '@/components/institute/accounting-page';
import StatsPage from '@/components/institute/stats-page';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    setCurrentPage('dashboard');
  };

  return (
    <main className="min-h-screen bg-[#1A1A1A]">
      {currentPage === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} />
      )}
      {currentPage === 'students' && (
        <StudentsPage onBack={handleBack} />
      )}
      {currentPage === 'teachers' && (
        <TeachersPage onBack={handleBack} />
      )}
      {currentPage === 'accounting' && (
        <AccountingPage onBack={handleBack} />
      )}
      {currentPage === 'stats' && (
        <StatsPage onBack={handleBack} />
      )}
    </main>
  );
}
