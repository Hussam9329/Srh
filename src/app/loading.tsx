export default function Loading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6"
      style={{ backgroundColor: '#1A1A1A' }}
    >
      {/* سبينر ذهبي */}
      <div className="relative flex items-center justify-center">
        {/* الحلقة الخارجية */}
        <div
          className="h-16 w-16 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderTopColor: '#D4AF37',
            borderRightColor: 'rgba(212, 175, 55, 0.3)',
            animationDuration: '0.8s',
          }}
        />
        {/* الحلقة الداخلية */}
        <div
          className="absolute h-8 w-8 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderBottomColor: '#D4AF37',
            borderLeftColor: 'rgba(212, 175, 55, 0.3)',
            animationDuration: '1.2s',
            animationDirection: 'reverse',
          }}
        />
      </div>

      {/* نص التحميل */}
      <p
        className="text-lg font-medium animate-pulse"
        style={{ color: '#D4AF37' }}
      >
        جاري التحميل...
      </p>
    </div>
  )
}
