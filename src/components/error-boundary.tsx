'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('خطأ في التطبيق:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

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
                حدث خطأ غير متوقع!
              </h2>
              <p className="text-sm" style={{ color: '#999999' }}>
                عذراً، حدث خطأ أثناء تشغيل التطبيق. يرجى المحاولة مرة أخرى.
              </p>
            </div>

            {/* رسالة الخطأ */}
            {this.state.error && (
              <div
                className="w-full rounded-lg p-4 text-right text-sm font-mono"
                style={{
                  backgroundColor: 'rgba(204, 68, 68, 0.1)',
                  border: '1px solid rgba(204, 68, 68, 0.3)',
                  color: '#CC4444',
                  direction: 'ltr',
                  textAlign: 'left',
                }}
              >
                <p className="mb-1 font-bold" style={{ color: '#CC4444' }}>
                  تفاصيل الخطأ:
                </p>
                <p className="break-words opacity-80">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* زر إعادة المحاولة */}
            <Button
              onClick={this.handleReset}
              className="mt-2 cursor-pointer px-8 py-3 text-base font-bold transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: '#D4AF37',
                color: '#1A1A1A',
              }}
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
