'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Edit, Trash2, Shield, LogIn, LogOut,
  ArrowRight, Loader2, Users, Eye, EyeOff, Check, X, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-IQ', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

const ROLE_MAP: Record<string, { label: string; color: string }> = {
  admin: { label: 'مدير', color: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/50' },
  user: { label: 'مستخدم', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  viewer: { label: 'مشاهد', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editUser, setEditUser] = useState<UserInfo | null>(null);

  // Form state
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<UserInfo | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast.error('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check localStorage for existing session
  useEffect(() => {
    const saved = localStorage.getItem('institute_user');
    if (saved) {
      try {
        setLoggedInUser(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    loadUsers();
  }, [loadUsers]);

  // Reset form
  const resetForm = () => {
    setFormFullName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('user');
    setFormIsActive(true);
    setShowPassword(false);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (user: UserInfo) => {
    setEditUser(user);
    setFormFullName(user.fullName);
    setFormUsername(user.username);
    setFormPassword('');
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setShowPassword(false);
  };

  // Save user (create or update)
  const saveUser = async () => {
    if (!formFullName.trim()) {
      toast.error('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!formUsername.trim()) {
      toast.error('يرجى إدخال اسم المستخدم');
      return;
    }
    if (!editUser && formPassword.length < 4) {
      toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }
    if (editUser && formPassword && formPassword.length < 4) {
      toast.error('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        fullName: formFullName.trim(),
        username: formUsername.trim(),
        role: formRole,
        isActive: formIsActive,
      };
      if (formPassword && formPassword.length >= 4) {
        body.password = formPassword;
      }

      if (editUser) {
        const res = await fetch(`/api/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'فشل التحديث');
        }
        toast.success('تم تحديث المستخدم بنجاح');
        setEditUser(null);
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, password: formPassword }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'فشل الإنشاء');
        }
        toast.success('تم إنشاء المستخدم بنجاح');
        setShowAddDialog(false);
      }

      resetForm();
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const deleteUser = async (user: UserInfo) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.fullName}"؟`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('تم حذف المستخدم بنجاح');
      // If deleted user is logged in, log out
      if (loggedInUser?.id === user.id) {
        setLoggedInUser(null);
        localStorage.removeItem('institute_user');
      }
      loadUsers();
    } catch {
      toast.error('فشل في حذف المستخدم');
    }
  };

  // Toggle user active status
  const toggleActive = async (user: UserInfo) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(user.isActive ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم');
      loadUsers();
    } catch {
      toast.error('فشل في تحديث الحالة');
    }
  };

  // Login
  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoggingIn(true);
    try {
      const res = await fetch('/api/users/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLoggedInUser(data);
      localStorage.setItem('institute_user', JSON.stringify(data));
      setLoginUsername('');
      setLoginPassword('');
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoggingIn(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('institute_user');
    toast.success('تم تسجيل الخروج');
  };

  // Seed admin user
  const seedAdmin = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin',
          fullName: 'مدير النظام',
          role: 'admin',
          isActive: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.error?.includes('موجود بالفعل')) {
          toast.info('المدير موجود بالفعل');
          return;
        }
        throw new Error(err.error);
      }
      toast.success('تم إنشاء حساب المدير (admin/admin)');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'فشل إنشاء المدير');
    }
  };

  const isAdmin = loggedInUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-4 md:p-8">
      {/* Login Bar */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-4">
          {loggedInUser ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-bold">{loggedInUser.fullName}</p>
                  <p className="text-[#999] text-sm">@{loggedInUser.username}</p>
                </div>
                <Badge className={ROLE_MAP[loggedInUser.role]?.color || ''}>
                  {ROLE_MAP[loggedInUser.role]?.label || loggedInUser.role}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}
                className="border-[#CC4444] text-[#CC4444] hover:bg-[#CC4444]/10">
                <LogOut className="w-4 h-4 ml-1" />
                تسجيل الخروج
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <LogIn className="w-5 h-5 text-[#D4AF37]" />
              <Input
                placeholder="اسم المستخدم"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="bg-[#1A1A1A] border-gray-600 text-white w-40"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="كلمة المرور"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600 text-white w-40"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-[#999] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={handleLogin} disabled={loggingIn}
                className="bg-[#D4AF37] hover:bg-[#c9a030] text-[#1A1A1A] font-bold">
                {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل الدخول'}
              </Button>
              <span className="text-[#999] text-sm mr-auto">قم بتسجيل الدخول للوصول الكامل</span>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/')}
            className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold px-6">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <h1 className="text-[#FFE38A] text-2xl font-bold">إدارة المستخدمين</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button onClick={openAddDialog}
              className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold">
              <UserPlus className="w-4 h-4 ml-1" />
              إضافة مستخدم
            </Button>
          )}
          {users.length === 0 && (
            <Button onClick={seedAdmin} variant="outline"
              className="border-[#555] text-[#999] hover:bg-[#333]">
              <KeyRound className="w-4 h-4 ml-1" />
              إنشاء مدير
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-6xl mx-auto bg-[#222] border border-[#D4AF37]/30 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-white font-bold">قائمة المستخدمين</span>
            <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] mr-2">{users.length}</Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#999]">
            <Users className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg mb-2">لا يوجد مستخدمين بعد</p>
            <p className="text-sm mb-4">اضغط على &quot;إنشاء مدير&quot; لإنشاء حساب المدير الأول</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-[#D4AF37]/30 hover:bg-transparent">
                  <TableHead className="text-[#D4AF37] text-center">الاسم الكامل</TableHead>
                  <TableHead className="text-[#D4AF37] text-center">اسم المستخدم</TableHead>
                  <TableHead className="text-[#D4AF37] text-center">الدور</TableHead>
                  <TableHead className="text-[#D4AF37] text-center">الحالة</TableHead>
                  <TableHead className="text-[#D4AF37] text-center">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-[#D4AF37] text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-b-[#333] hover:bg-[#333]/50">
                    <TableCell className="text-white text-center font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-[#999] text-center font-mono">{user.username}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={ROLE_MAP[user.role]?.color || ''}>
                        {ROLE_MAP[user.role]?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => isAdmin && toggleActive(user)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                      >
                        {user.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {user.isActive ? 'فعال' : 'معطل'}
                      </button>
                    </TableCell>
                    <TableCell className="text-[#999] text-center text-sm">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(user)}
                              className="text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user.role !== 'admin' && (
                              <Button size="sm" variant="ghost" onClick={() => deleteUser(user)}
                                className="text-[#CC4444] hover:bg-[#CC4444]/10 h-8 w-8 p-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Role Info Cards */}
      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#222] border border-[#D4AF37]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-[#FFE38A] font-bold">مدير</h3>
          </div>
          <p className="text-[#999] text-sm">صلاحيات كاملة: إدارة المستخدمين، الطلاب، المدرسين، الحسابات والتقارير</p>
        </div>
        <div className="bg-[#222] border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-blue-400 font-bold">مستخدم</h3>
          </div>
          <p className="text-[#999] text-sm">صلاحيات محدودة: إدارة الطلاب والمدرسين والأقساط بدون إدارة المستخدمين</p>
        </div>
        <div className="bg-[#222] border border-gray-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-gray-400" />
            <h3 className="text-gray-400 font-bold">مشاهد</h3>
          </div>
          <p className="text-[#999] text-sm">صلاحيات عرض فقط: يمكنه مشاهدة البيانات دون التعديل أو الإضافة</p>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-[#222] border-[#D4AF37]/30 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[#FFE38A] text-xl">إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">الاسم الكامل *</Label>
              <Input value={formFullName} onChange={(e) => setFormFullName(e.target.value)}
                className="bg-[#1A1A1A] border-gray-600 text-white" placeholder="أدخل الاسم الكامل" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">اسم المستخدم *</Label>
              <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
                className="bg-[#1A1A1A] border-gray-600 text-white font-mono" placeholder="مثال: teacher1" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">كلمة المرور * (4 أحرف على الأقل)</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600 text-white font-mono" placeholder="أدخل كلمة المرور" dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">الدور</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-gray-600">
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formIsActive} onCheckedChange={(v) => setFormIsActive(v === true)} />
              <Label className="text-gray-300">الحساب مفعل</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={saveUser} disabled={saving}
              className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowAddDialog(false); resetForm(); }}
              className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) { setEditUser(null); resetForm(); } }}>
        <DialogContent className="bg-[#222] border-[#D4AF37]/30 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-[#FFE38A] text-xl">تعديل المستخدم: {editUser?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">الاسم الكامل</Label>
              <Input value={formFullName} onChange={(e) => setFormFullName(e.target.value)}
                className="bg-[#1A1A1A] border-gray-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">اسم المستخدم</Label>
              <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
                className="bg-[#1A1A1A] border-gray-600 text-white font-mono" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">كلمة المرور الجديدة (اتركه فارغاً إذا لا تريد التغيير)</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="bg-[#1A1A1A] border-gray-600 text-white font-mono" placeholder="••••••" dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">الدور</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger className="bg-[#1A1A1A] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-gray-600">
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formIsActive} onCheckedChange={(v) => setFormIsActive(v === true)} />
              <Label className="text-gray-300">الحساب مفعل</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={saveUser} disabled={saving}
              className="bg-[#D4AF37] hover:bg-[#c9a030] text-black font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التعديلات'}
            </Button>
            <Button variant="ghost" onClick={() => { setEditUser(null); resetForm(); }}
              className="text-gray-400 hover:text-white">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
