import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
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
        {/* أيقونة الصفحة غير موجودة */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
        >
          <FileQuestion className="h-10 w-10" style={{ color: '#D4AF37' }} />
        </div>

        {/* رقم 404 */}
        <h1
          className="text-7xl font-black"
          style={{ color: '#D4AF37' }}
        >
          404
        </h1>

        {/* العنوان والوصف */}
        <div className="space-y-2">
          <h2
            className="text-xl font-bold"
            style={{ color: '#EEEEEE' }}
          >
            الصفحة غير موجودة
          </h2>
          <p className="text-sm" style={{ color: '#999999' }}>
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر.
          </p>
        </div>

        {/* زر العودة */}
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-bold transition-all duration-200 hover:opacity-90"
          style={{
            backgroundColor: '#D4AF37',
            color: '#1A1A1A',
          }}
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  )
}
