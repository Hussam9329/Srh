'use client'

import { use } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: '#1A1A1A' }}
    >
      <div
        className="flex flex-col items-center gap-6 rounded-2xl border p-8 text-center max-w-md w-full"
        style={{
          backgroundColor: '#222222',
          borderColor: '#444444',
        }}
      >
        {/* أيقونة التحذير */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
        >
          <AlertTriangle className="h-10 w-10" style={{ color: '#D4AF37' }} />
        </div>

        {/* العنوان */}
        <div className="space-y-2">
          <h2
            className="text-2xl font-bold"
            style={{ color: '#D4AF37' }}
          >
            حدث خطأ!
          </h2>
          <p className="text-sm" style={{ color: '#999999' }}>
            عذراً، حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
          </p>
        </div>

        {/* رسالة الخطأ */}
        <div
          className="w-full rounded-lg p-4 text-right text-sm"
          style={{
            backgroundColor: 'rgba(204, 68, 68, 0.1)',
            border: '1px solid rgba(204, 68, 68, 0.3)',
            color: '#CC4444',
          }}
        >
          {error.message || 'خطأ غير معروف'}
        </div>

        {/* أزرار */}
        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="cursor-pointer px-6 py-3 font-bold transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: '#D4AF37',
              color: '#1A1A1A',
            }}
          >
            إعادة المحاولة
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="cursor-pointer px-6 py-3 font-bold transition-all duration-200"
            style={{
              borderColor: '#444444',
              color: '#EEEEEE',
            }}
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  )
}
