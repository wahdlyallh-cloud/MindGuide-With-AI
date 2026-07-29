import React, { useState } from 'react';
import { User, Mail, Lock, LogIn, UserPlus, LogOut, Cloud, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token: string, userData?: any) => void;
  onLogout: () => void;
  onManualSync: () => void;
  onManualRestore: () => void;
  isSyncing: boolean;
  syncMessage: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onManualSync,
  onManualRestore,
  isSyncing,
  syncMessage
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني وكلمة المرور بشكل صحيح.');
      return;
    }

    setIsLoading(true);
    try {
      let isServerSuccess = false;
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.success && data.user && data.token) {
              isServerSuccess = true;
              setSuccessMsg('تم تسجيل الدخول بنجاح! جاري تحميل واستعادة مذكراتك...');
              setTimeout(() => {
                onLoginSuccess(data.user, data.token, data.userData);
                onClose();
              }, 600);
              return;
            } else if (data.error) {
              setErrorMsg(data.error);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        // Backend API unreachable or static export - fall through to local auth fallback
      }

      if (!isServerSuccess) {
        // Local Authentication Fallback (for static exports like Vercel)
        const localUsersRaw = localStorage.getItem('yawmiyati_local_auth_users');
        const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];
        const foundUser = localUsers.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());

        if (foundUser) {
          if (foundUser.password === password) {
            const localToken = `local_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            setSuccessMsg('تم تسجيل الدخول بنجاح عبر الحساب المحلي! 🎉');
            setTimeout(() => {
              onLoginSuccess({ id: foundUser.id, name: foundUser.name, email: foundUser.email, createdAt: foundUser.createdAt }, localToken);
              onClose();
            }, 600);
            return;
          } else {
            setErrorMsg('كلمة المرور غير صحيحة. يرجى التثبت والمحاولة مجدداً.');
            setIsLoading(false);
            return;
          }
        }

        // If no user exists locally, allow instant registration or auto-login with email
        setErrorMsg('البريد الإلكتروني غير مسجل بعد. يرجى النقر على "حساب جديد" لإنشائه.');
      }
    } catch (err: any) {
      setErrorMsg('عفواً، متعذر الاتصال بالخادم. يرجى التثبت من البيانات والمحاولة مجدداً.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 خانات لحماية معلوماتك.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);
    try {
      let isServerSuccess = false;
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || email.split('@')[0],
            email: email.trim(),
            password
          })
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.success && data.user && data.token) {
              isServerSuccess = true;
              setSuccessMsg('تم إنشاء حسابك الشخصي وتفعيل التزامن السحابي بنجاح! 🎉');
              setTimeout(() => {
                onLoginSuccess(data.user, data.token);
                onClose();
              }, 800);
              return;
            } else if (data.error) {
              setErrorMsg(data.error);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        // Backend API unreachable or static export - fall through to local register fallback
      }

      if (!isServerSuccess) {
        // Local Authentication Registration Fallback (for static exports like Vercel)
        const localUsersRaw = localStorage.getItem('yawmiyati_local_auth_users');
        const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];
        const existingUser = localUsers.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());

        if (existingUser) {
          setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول به.');
          setIsLoading(false);
          return;
        }

        const newUser = {
          id: `local_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          password,
          createdAt: new Date().toISOString()
        };

        localUsers.push(newUser);
        localStorage.setItem('yawmiyati_local_auth_users', JSON.stringify(localUsers));

        const localToken = `local_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        setSuccessMsg('تم إنشاء حسابك وحفظ بياناتك بنجاح! 🎉');
        setTimeout(() => {
          onLoginSuccess({ id: newUser.id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt }, localToken);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg('تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md overflow-hidden relative transition-all transform scale-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-7 h-7 text-teal-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">الحساب الشخصي والتزامن السحابي</h2>
              <p className="text-xs text-teal-100/90 mt-0.5">
                احفظ بياناتك ومذكراتك سحابياً وافتحها من أي جهاز بنفس الحساب
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6">
          {currentUser ? (
            /* Logged in view */
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg truncate text-stone-900 dark:text-white">{currentUser.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      <Cloud className="w-3 h-3 ml-1" />
                      متصل ومزامن
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Sync controls */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  خيارات المزامنة الحالية
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-medium text-sm shadow-sm transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>رفع المزامنة الآن</span>
                  </button>

                  <button
                    onClick={onManualRestore}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.98] text-stone-700 dark:text-stone-200 font-medium text-sm transition-all disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>استعادة البيانات</span>
                  </button>
                </div>

                {syncMessage && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{syncMessage}</span>
                  </div>
                )}
              </div>

              {/* Logout button */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login / Register Forms */
            <div>
              {/* Tabs header */}
              <div className="flex bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'login'
                      ? 'bg-white dark:bg-stone-900 text-teal-700 dark:text-teal-400 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'register'
                      ? 'bg-white dark:bg-stone-900 text-teal-700 dark:text-teal-400 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>حساب جديد</span>
                </button>
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200/80 dark:border-rose-800/60 flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1.5">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1.5">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-stone-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                      >
                        {showPassword ? 'إخفاء' : 'إظهار'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>دخول ومزامنة مذكراتي</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      الاسم الشخصي
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute right-3.5 top-3.5 text-stone-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: أحمد مصطفى"
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      كلمة المرور (6 حروف أو أرقام على الأقل)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-stone-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                      >
                        {showPassword ? 'إخفاء' : 'إظهار'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      تأكيد كلمة المرور
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-stone-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>إنشاء الحساب وتفعيل المزامنة</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
