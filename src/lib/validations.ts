import { z } from 'zod/v4'

// ============================
// 🎓 مخطط التحقق من بيانات الطالب
// ============================
export const studentSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, 'اسم الطالب مطلوب')
    .max(100, 'اسم الطالب يجب أن لا يتجاوز 100 حرف'),
  studyType: z
    .enum(['حضوري', 'الكتروني'], {
      error: 'نوع الدراسة يجب أن يكون: حضوري أو الكتروني',
    })
    .default('حضوري'),
  hasCard: z.boolean().default(false),
  hasBadge: z.boolean().default(false),
  status: z
    .enum(['مستمر', 'منسحب'], {
      error: 'الحالة يجب أن تكون: مستمر أو منسحب',
    })
    .default('مستمر'),
  barcode: z.string().optional(),
  notes: z.string().max(500, 'الملاحظات يجب أن لا تتجاوز 500 حرف').nullable().optional(),
})

export type StudentInput = z.infer<typeof studentSchema>

// ============================
// 👨‍🏫 مخطط التحقق من بيانات المدرس
// ============================
export const teacherSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, 'اسم المدرس مطلوب')
    .max(100, 'اسم المدرس يجب أن لا يتجاوز 100 حرف'),
  subject: z
    .string()
    .min(1, 'المادة مطلوبة')
    .max(100, 'المادة يجب أن لا تتجاوز 100 حرف'),
  totalFee: z
    .number({ error: 'الرسوم يجب أن تكون رقماً' })
    .min(0, 'الرسوم يجب أن تكون 0 أو أكبر')
    .optional()
    .default(0),
  institutePercentage: z
    .number({ error: 'نسبة المعهد يجب أن تكون رقماً' })
    .min(0, 'النسبة يجب أن تكون 0 أو أكبر')
    .max(100, 'النسبة يجب أن لا تتجاوز 100')
    .default(30),
  notes: z.string().max(500, 'الملاحظات يجب أن لا تتجاوز 500 حرف').nullable().optional(),
})

export type TeacherInput = z.infer<typeof teacherSchema>

// ============================
// 💰 مخطط التحقق من بيانات القسط
// ============================
export const installmentSchema = z.object({
  id: z.number().optional(),
  studentId: z.number({ error: 'معرف الطالب مطلوب' }).positive('معرف الطالب يجب أن يكون رقماً موجباً'),
  teacherId: z.number({ error: 'معرف المدرس مطلوب' }).positive('معرف المدرس يجب أن يكون رقماً موجباً'),
  amount: z
    .number({ error: 'المبلغ مطلوب' })
    .positive('المبلغ يجب أن يكون أكبر من صفر'),
  paymentDate: z.string().optional(),
  installmentType: z.string().default('القسط الأول'),
  notes: z.string().max(500, 'الملاحظات يجب أن لا تتجاوز 500 حرف').nullable().optional(),
})

export type InstallmentInput = z.infer<typeof installmentSchema>

// ============================
// 👤 مخطط التحقق من بيانات المستخدم
// ============================
export const userSchema = z.object({
  id: z.number().optional(),
  username: z
    .string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'اسم المستخدم يجب أن لا يتجاوز 50 حرف')
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط'),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(100, 'كلمة المرور يجب أن لا تتجاوز 100 حرف'),
  fullName: z
    .string()
    .min(1, 'الاسم الكامل مطلوب')
    .max(100, 'الاسم الكامل يجب أن لا يتجاوز 100 حرف'),
  role: z
    .enum(['admin', 'user', 'viewer'], {
      error: 'الصلاحية يجب أن تكون: admin أو user أو viewer',
    })
    .default('user'),
  isActive: z.boolean().default(true),
})

export type UserInput = z.infer<typeof userSchema>

// ============================
// 🔐 مخطط التحقق من تسجيل الدخول
// ============================
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'اسم المستخدم مطلوب')
    .max(50, 'اسم المستخدم يجب أن لا يتجاوز 50 حرف'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ============================
// 🏧 مخطط التحقق من السحب
// ============================
export const withdrawalSchema = z.object({
  id: z.number().optional(),
  teacherId: z.number({ error: 'معرف المدرس مطلوب' }).positive('معرف المدرس يجب أن يكون رقماً موجباً'),
  amount: z
    .number({ error: 'المبلغ مطلوب' })
    .positive('المبلغ يجب أن يكون أكبر من صفر'),
  withdrawalDate: z.string().optional(),
  notes: z.string().max(500, 'الملاحظات يجب أن لا تتجاوز 500 حرف').nullable().optional(),
})

export type WithdrawalInput = z.infer<typeof withdrawalSchema>

// ============================
// 🔗 مخطط التحقق من ربط الطالب بالمدرس
// ============================
export const studentTeacherSchema = z.object({
  studentId: z.number({ error: 'معرف الطالب مطلوب' }).positive('معرف الطالب يجب أن يكون رقماً موجباً'),
  teacherId: z.number({ error: 'معرف المدرس مطلوب' }).positive('معرف المدرس يجب أن يكون رقماً موجباً'),
})

export type StudentTeacherInput = z.infer<typeof studentTeacherSchema>

// ============================
// 🔍 مخطط التحقق من البحث
// ============================
export const searchSchema = z.object({
  search: z.string().max(100, 'كلمة البحث يجب أن لا تتجاوز 100 حرف').default(''),
})

export type SearchInput = z.infer<typeof searchSchema>
