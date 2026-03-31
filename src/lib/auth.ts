// ============================
// 🔐 أدوات المصادقة والصلاحيات
// نظام إدارة معهد صرح البنوك
// ============================

const STORAGE_KEY = 'srh_auth_user'

/**
 * واجهة بيانات المستخدم المخزنة
 */
export interface AuthUser {
  id: number
  username: string
  fullName: string
  role: string
  isActive: boolean
}

/**
 * قراءة بيانات المستخدم المخزنة من localStorage
 * @returns بيانات المستخدم أو null إذا لم يكن مسجلاً
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const user: AuthUser = JSON.parse(stored)

    // التحقق من صحة البيانات المخزنة
    if (!user.id || !user.username || !user.fullName || !user.role) {
      clearStoredUser()
      return null
    }

    return user
  } catch {
    clearStoredUser()
    return null
  }
}

/**
 * تخزين بيانات المستخدم في localStorage
 * @param user بيانات المستخدم المراد تخزينها
 */
export function setStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch (error) {
    console.error('فشل في تخزين بيانات المستخدم:', error)
  }
}

/**
 * حذف بيانات المستخدم من localStorage (تسجيل الخروج)
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('فشل في حذف بيانات المستخدم:', error)
  }
}

/**
 * التحقق مما إذا كان المستخدم مسجلاً ومفعلاً
 * @returns true إذا كان المستخدم مسجلاً ومفعلاً
 */
export function isAuthenticated(): boolean {
  const user = getStoredUser()
  return user !== null && user.isActive === true
}

/**
 * التحقق مما إذا كان المستخدم مديراً
 * @param user بيانات المستخدم
 * @returns true إذا كانت صلاحية المستخدم هي مدير
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin'
}

/**
 * التحقق مما إذا كان المستخدم يستطيع إدارة المستخدمين
 * (المدير فقط)
 * @param user بيانات المستخدم
 * @returns true إذا كان المستخدم مديراً
 */
export function canManageUsers(user: AuthUser): boolean {
  return user.role === 'admin'
}

/**
 * التحقق مما إذا كان المستخدم يستطيع التعديل
 * (المدير أو المستخدم العادي)
 * @param user بيانات المستخدم
 * @returns true إذا كانت صلاحية المستخدم تسمح بالتعديل
 */
export function canEdit(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'user'
}

/**
 * التحقق مما إذا كان المستخدم يستطيع المشاهدة
 * (جميع المستخدمين المفعلين)
 * @param user بيانات المستخدم
 * @returns true إذا كان المستخدم مفعلاً
 */
export function canView(user: AuthUser): boolean {
  return user.isActive === true
}

/**
 * الحصول على التسمية العربية للصلاحية
 * @param role رمز الصلاحية
 * @returns التسمية العربية
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'مدير',
    user: 'مستخدم',
    viewer: 'مشاهد',
  }
  return labels[role] || role
}
