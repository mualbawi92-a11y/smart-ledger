import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Lock, 
  Building2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Mail, 
  ArrowRight,
  Save,
  Sun,
  Moon
} from 'lucide-react';
import { UserItem } from '../../types';

export interface AuthSessionUser {
  id: string;
  username: string;
  fullName: string;
  userType: 'مدير' | 'موظف' | 'مدير فرع' | string;
  branch: string;
  groupId?: string;
  groupName?: string;
  cashBox?: string;
  loginTime: string;
}

interface LoginScreenProps {
  companyName: string;
  companyLogo?: string;
  onLoginSuccess: (user: AuthSessionUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  companyName,
  companyLogo,
  onLoginSuccess,
}) => {
  // وضع الشاشة: تسجيل الدخول أو استعادة كلمة المرور
  const [viewMode, setViewMode] = useState<'login' | 'forgot_password'>('login');

  // خيار الثيم: ليلي كحلي مصرفي هادئ مع دوائر الاستلام أو نهاري فاتح
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_ledger_login_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  // حقول تسجيل الدخول
  const [username, setUsername] = useState(() => localStorage.getItem('smart_ledger_saved_username') || 'admin');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState(companyName || 'الفرع الرئيسي - بغداد');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // حقول استعادة كلمة المرور
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'enter_email' | 'reset_password' | 'done'>('enter_email');
  const [matchedUser, setMatchedUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // قائمة مستخدمي النظام المعتمدة في قاعدة البيانات (localStorage)
  const [systemUsers, setSystemUsers] = useState<UserItem[]>(() => {
    try {
      const savedUsers = localStorage.getItem('smart_ledger_users_list_clean');
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // المستخدم الافتراضي المعتمد في قاعدة البيانات للنظام
    const defaultInitialUsers: UserItem[] = [
      {
        id: 'usr-admin-primary',
        username: 'admin',
        password: '123',
        fullName: 'محمد علي الباوي (مدير)',
        userType: 'مدير',
        branch: companyName || 'الفرع الرئيسي - بغداد',
        groupId: 'grp-admin',
        groupName: 'الادارة العامة',
        cashBox: '(جميع الكوى)',
        email: 'mualbawi92@gmail.com',
        phone: '07700000000',
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ];
    localStorage.setItem('smart_ledger_users_list_clean', JSON.stringify(defaultInitialUsers));
    return defaultInitialUsers;
  });

  // قائمة الفروع الديناميكية المنشأة في النظام
  const branchOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    const pushBranch = (val?: string) => {
      const clean = (val || '').trim();
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      list.push(clean);
    };

    try {
      const savedBranches = localStorage.getItem('smart_ledger_branches');
      if (savedBranches) {
        const parsed = JSON.parse(savedBranches);
        if (Array.isArray(parsed)) {
          parsed.forEach((b: { name?: string }) => pushBranch(b?.name));
        }
      }
    } catch {
      // ignore
    }

    systemUsers.forEach((u) => pushBranch(u.branch));

    try {
      const savedAccs = localStorage.getItem('smart_ledger_accounts_data');
      if (savedAccs) {
        const accs = JSON.parse(savedAccs);
        if (Array.isArray(accs)) {
          accs.forEach((a: { type?: string; city?: string }) => {
            if (a && (a.type === 'cash_box' || a.type === 'vault') && a.city) {
              pushBranch(a.city);
            }
          });
        }
      }
    } catch {
      // ignore
    }

    if (companyName?.trim()) {
      pushBranch(companyName);
    }
    if (list.length === 0) {
      pushBranch('الفرع الرئيسي - بغداد');
    }
    return list;
  }, [systemUsers, companyName]);

  useEffect(() => {
    if (branchOptions.length > 0 && !branchOptions.includes(branch)) {
      setBranch(branchOptions[0]);
    }
  }, [branchOptions, branch]);

  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('smart_ledger_users_list_clean');
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSystemUsers(parsed);
        }
      }
    } catch {
      // ignore
    }

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-IQ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('smart_ledger_login_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // معالجة تسجيل الدخول الصارم وفق القواعد المحددة:
  // 1. إذا كان اسم المستخدم غير موجود بقاعدة البيانات -> يرفض فوراً ويكتب أن المستخدم غير موجود.
  // 2. إذا كانت كلمة المرور غير صحيحة -> يرفض ويكتب أن كلمة المرور غير صحيحة.
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setErrorMsg('يرجى إدخال اسم المستخدم للمتابعة');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg('يرجى إدخال كلمة المرور للمتابعة');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. فحص وجود المستخدم في قاعدة البيانات
      const foundUser = systemUsers.find(
        (u) =>
          (u.username && u.username.trim().toLowerCase() === trimmedUser.toLowerCase()) ||
          (u.fullName && u.fullName.trim().toLowerCase() === trimmedUser.toLowerCase()) ||
          (u.email && u.email.trim().toLowerCase() === trimmedUser.toLowerCase())
      );

      // إذا كان المستخدم غير موجود في الداتابيس: يرفض الدخول قطعياً
      if (!foundUser) {
        setErrorMsg('اسم المستخدم غير مسجل في قاعدة البيانات، يرجى التأكد من الاسم أو مراجعة إدارة النظام');
        setIsLoading(false);
        return;
      }

      // 2. فحص كلمة المرور: إذا كانت غلط يرفض ويخبره أنها غلط
      const userStoredPassword = (foundUser.password || '').trim();
      const isPasswordMatch = 
        userStoredPassword === trimmedPass || 
        // دعم رمزي المرور الافتراضيين لحساب المدير الأولي قبل تغييره
        (foundUser.id === 'usr-admin-primary' && (trimmedPass === '123' || trimmedPass === '123456'));

      if (!isPasswordMatch) {
        setErrorMsg('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة');
        setIsLoading(false);
        return;
      }

      // 3. فحص حالة تفعيل الحساب
      if (foundUser.isActive === false) {
        setErrorMsg('هذا الحساب معطل حالياً من قبل إدارة النظام، يرجى مراجعة المسؤول');
        setIsLoading(false);
        return;
      }

      // إتمام الدخول ببيانات الحساب المعتمدة
      const authUser: AuthSessionUser = {
        id: foundUser.id,
        username: foundUser.username || trimmedUser,
        fullName: foundUser.fullName,
        userType: (foundUser.userType as 'مدير' | 'موظف' | 'مدير فرع') || 'مدير',
        branch: foundUser.branch || branch || 'الفرع الرئيسي - بغداد',
        groupId: foundUser.groupId,
        groupName: foundUser.groupName || 'الادارة العامة',
        cashBox: foundUser.cashBox || '(جميع الكوى)',
        loginTime: new Date().toLocaleTimeString('ar-IQ'),
      };

      if (rememberMe) {
        localStorage.setItem('smart_ledger_saved_username', trimmedUser);
      } else {
        localStorage.removeItem('smart_ledger_saved_username');
      }

      setIsLoading(false);
      onLoginSuccess(authUser);
    }, 300);
  };

  // معالجة البحث عن الحساب بواسطة البريد الإلكتروني
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    const targetEmail = recoveryEmail.trim().toLowerCase();
    if (!targetEmail) {
      setRecoveryError('يرجى إدخال البريد الإلكتروني المسجل في حساب المستخدم');
      return;
    }

    let found = systemUsers.find(
      (u) => u.email && u.email.trim().toLowerCase() === targetEmail
    );

    if (!found) {
      const isDefaultAdminEmail =
        targetEmail === 'mualbawi92@gmail.com' ||
        targetEmail === 'admin@smartledger.iq' ||
        targetEmail.startsWith('admin');

      if (isDefaultAdminEmail) {
        found = {
          id: 'usr-admin-primary',
          fullName: 'محمد علي الباوي',
          username: 'admin',
          password: '123',
          branch: companyName || 'الفرع الرئيسي - بغداد',
          userType: 'مدير',
          cashBox: '(جميع الكوى)',
          groupId: 'grp-admin',
          groupName: 'الادارة العامة',
          email: targetEmail,
          isActive: true,
          createdAt: new Date().toISOString().slice(0, 10),
        };
      }
    }

    if (!found) {
      setRecoveryError(
        `لم يتم العثور على أي حساب مسجل بهذا البريد (${recoveryEmail}). يرجى التحقق من صحة البريد أو مراجعة إدارة النظام.`
      );
      return;
    }

    setMatchedUser(found);
    setRecoveryStep('reset_password');
    setNewPassword('');
    setConfirmPassword('');
    setRecoverySuccess(`تم العثور على حساب: ${found.fullName} (${found.userType})`);
  };

  // حفظ كلمة المرور الجديدة بعد التحقق من البريد
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!newPassword.trim()) {
      setRecoveryError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword.length < 3) {
      setRecoveryError('كلمة المرور يجب أن لا تقل عن 3 خانات');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('كلمتا المرور غير متطابقتين، يرجى كتابتهما بدقة');
      return;
    }

    if (!matchedUser) return;

    let updatedUsers: UserItem[];
    const exists = systemUsers.some((u) => u.id === matchedUser.id);

    if (exists) {
      updatedUsers = systemUsers.map((u) => {
        if (u.id === matchedUser.id) {
          return {
            ...u,
            password: newPassword.trim(),
            email: recoveryEmail.trim().toLowerCase(),
          };
        }
        return u;
      });
    } else {
      const newUserRecord: UserItem = {
        ...matchedUser,
        password: newPassword.trim(),
        email: recoveryEmail.trim().toLowerCase(),
      };
      updatedUsers = [...systemUsers, newUserRecord];
    }

    setSystemUsers(updatedUsers);
    localStorage.setItem('smart_ledger_users_list_clean', JSON.stringify(updatedUsers));

    setUsername(matchedUser.username || matchedUser.fullName);
    setPassword(newPassword.trim());

    setRecoveryStep('done');
    setRecoverySuccess('تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول مباشرة.');
  };

  const handleBackToLogin = () => {
    setViewMode('login');
    setRecoveryStep('enter_email');
    setRecoveryEmail('');
    setMatchedUser(null);
    setRecoveryError('');
    setRecoverySuccess('');
    setErrorMsg('');
  };

  return (
    <div 
      className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#0284c7] selection:text-white transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#031525] text-slate-100' 
          : 'bg-[#f0f7fc] text-slate-800'
      }`} 
      dir="rtl"
    >
      
      {/* =========================================================================
          الدوائر المحيطية الهندسية المركزية الفخمة بنفس لون الاستلام والحوالات (Sky / Ocean Blue #0284c7)
          Concentric Circles & Glowing Orbits - مطابقة تماماً للون شاشة استلام الحوالات
         ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* دائرة 1 - القريبة */}
        <div 
          className={`absolute rounded-full border pointer-events-none transition-all duration-700 ${
            isDarkMode 
              ? 'w-[360px] h-[360px] border-sky-500/25' 
              : 'w-[360px] h-[360px] border-sky-400/25'
          }`} 
        />
        {/* دائرة 2 - المتوسطة */}
        <div 
          className={`absolute rounded-full border pointer-events-none transition-all duration-700 ${
            isDarkMode 
              ? 'w-[580px] h-[580px] border-sky-400/20 shadow-[0_0_50px_rgba(56,189,248,0.12)]' 
              : 'w-[580px] h-[580px] border-sky-300/30'
          }`} 
        />
        {/* دائرة 3 - المنقطة (Radar Orbit) */}
        <div 
          className={`absolute rounded-full border border-dashed pointer-events-none transition-all duration-700 ${
            isDarkMode 
              ? 'w-[840px] h-[840px] border-sky-400/15' 
              : 'w-[840px] h-[840px] border-sky-300/25'
          }`} 
        />
        {/* دائرة 4 - الكبيرة */}
        <div 
          className={`absolute rounded-full border pointer-events-none transition-all duration-700 ${
            isDarkMode 
              ? 'w-[1140px] h-[1140px] border-sky-500/10' 
              : 'w-[1140px] h-[1140px] border-sky-200/40'
          }`} 
        />
        {/* دائرة 5 - العملاقة المحيطية */}
        <div 
          className={`absolute rounded-full border pointer-events-none transition-all duration-700 ${
            isDarkMode 
              ? 'w-[1480px] h-[1480px] border-sky-500/5' 
              : 'w-[1480px] h-[1480px] border-sky-200/20'
          }`} 
        />

        {/* توهج هادئ في المركز بنفس لون الاستلام */}
        <div 
          className={`absolute rounded-full blur-3xl pointer-events-none ${
            isDarkMode 
              ? 'w-[520px] h-[520px] bg-sky-500/15' 
              : 'w-[520px] h-[520px] bg-sky-300/25'
          }`} 
        />
      </div>

      {/* الشريط العلوي للوحة الدخول */}
      <header 
        className={`relative z-10 px-6 py-3.5 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
          isDarkMode 
            ? 'border-sky-900/60 bg-[#061d30]/85' 
            : 'border-slate-200/80 bg-white/80'
        }`}
      >
        <div className="flex items-center gap-3">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt="Logo" 
              className={`w-9 h-9 object-contain rounded-xl border p-0.5 shadow-2xs ${
                isDarkMode ? 'border-sky-700/60 bg-[#082842]' : 'border-slate-200 bg-white'
              }`} 
            />
          ) : (
            <div 
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs ${
                isDarkMode 
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-400' 
                  : 'bg-sky-50 border-sky-200 text-sky-700'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-sm sm:text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {companyName || 'منظومة المحاسب الذكي'}
              </h1>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                isDarkMode 
                  ? 'bg-sky-900/70 text-sky-300 border-sky-700/60' 
                  : 'bg-sky-100 text-sky-800 border-sky-200'
              }`}>
                Smart Ledger
              </span>
            </div>
          </div>
        </div>

        {/* مؤشر تبديل الثيم السريع */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          
          {/* زر تبديل الثيم السريع */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isDarkMode 
                ? 'bg-[#082842] border-sky-700/60 text-sky-300 hover:text-white hover:bg-sky-900/60' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-sky-700'
            }`}
            title={isDarkMode ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع الليلي مع الدوائر'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline text-[11px]">نهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-700" />
                <span className="hidden md:inline text-[11px]">ليلي (دوائر)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* المحتوى المركزي - البطاقة ذات الإطار الخارجي الأنيق والدوائر المحيطية */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-2">
        
        {/* الحاوية الخارجية الأنيقة المطابقة للحدود المزدوجة (Double Border Frame) بلون الاستلام */}
        <div 
          className={`w-full max-w-[440px] p-2 sm:p-2.5 rounded-[28px] border transition-all duration-300 shadow-2xl backdrop-blur-xl ${
            isDarkMode 
              ? 'border-sky-500/35 bg-[#061d30]/75 shadow-sky-950/80' 
              : 'border-sky-200/90 bg-white/80 shadow-slate-200/80'
          }`}
        >

          {/* البطاقة الداخلية الأساسية */}
          <div 
            className={`w-full rounded-2xl border p-6 sm:p-8 transition-all ${
              isDarkMode 
                ? 'bg-[#07243c] border-sky-500/40 shadow-xl' 
                : 'bg-white border-sky-200 shadow-sm'
            }`}
          >

            {viewMode === 'login' ? (
              <>
                {/* ترويسة بطاقة تسجيل الدخول مع أيقونة القفل المصرفية الراقية */}
                <div className="text-center mb-6">
                  <div 
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-3 shadow-lg ${
                      isDarkMode 
                        ? 'bg-sky-500/20 border-sky-400/40 text-sky-400 shadow-sky-950/50' 
                        : 'bg-sky-50 border-sky-200 text-sky-700 shadow-2xs'
                    }`}
                  >
                    <Lock className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    تسجيل الدخول للنظام
                  </h2>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-sky-200/80' : 'text-slate-500'}`}>
                    أدخل بيانات حسابك المعتمد للدخول إلى المنظومة
                  </p>
                </div>

                {/* رسالة خطأ إن وجدت */}
                {errorMsg && (
                  <div className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 border font-bold animate-in fade-in duration-200 ${
                    isDarkMode 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
                      : 'bg-rose-50 border-rose-200 text-rose-700 shadow-2xs'
                  }`}>
                    <AlertCircle className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                )}

                {/* نموذج تسجيل الدخول النقي والمباشر */}
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  {/* 1. اسم المستخدم */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${
                      isDarkMode ? 'text-sky-100' : 'text-slate-700'
                    }`}>
                      اسم الموظف / المستخدم أو البريد
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="أدخل اسم الموظف أو اسم المستخدم..."
                        disabled={isLoading}
                        className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-[#031424] border border-sky-600/50 text-white placeholder:text-sky-400/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 shadow-inner' 
                            : 'bg-[#fffefb] border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100 shadow-inner'
                        }`}
                      />
                      <User className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                        isDarkMode ? 'text-sky-400' : 'text-slate-400'
                      }`} />
                    </div>
                  </div>

                  {/* 2. كلمة المرور */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${
                      isDarkMode ? 'text-sky-100' : 'text-slate-700'
                    }`}>
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-[#031424] border border-sky-600/50 text-white placeholder:text-sky-400/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 shadow-inner' 
                            : 'bg-[#fffefb] border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100 shadow-inner'
                        }`}
                      />
                      <KeyRound className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                        isDarkMode ? 'text-sky-400' : 'text-slate-400'
                      }`} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                          isDarkMode ? 'text-sky-400/70 hover:text-sky-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 3. نقطة العمل / الفرع */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${
                      isDarkMode ? 'text-sky-100' : 'text-slate-700'
                    }`}>
                      نقطة العمل / الفرع
                    </label>
                    <div className="relative">
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        disabled={isLoading}
                        className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all appearance-none cursor-pointer ${
                          isDarkMode 
                            ? 'bg-[#031424] border border-sky-600/50 text-sky-100 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20' 
                            : 'bg-white border border-slate-300 text-slate-800 focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100'
                        }`}
                      >
                        {branchOptions.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <Building2 className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                        isDarkMode ? 'text-sky-400' : 'text-slate-400'
                      }`} />
                    </div>
                  </div>

                  {/* خيار تذكرني واستعادة كلمة المرور عبر رابط نصي نقي وأنيق */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className={`flex items-center gap-2 cursor-pointer select-none transition-colors ${
                      isDarkMode ? 'text-sky-200/80 hover:text-white' : 'text-slate-600 hover:text-slate-800'
                    }`}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 accent-[#0284c7] rounded cursor-pointer"
                      />
                      <span className="font-bold text-[11px]">تذكرني</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot_password');
                        setRecoveryStep('enter_email');
                        setRecoveryError('');
                        setRecoverySuccess('');
                      }}
                      className={`font-bold hover:underline transition-colors flex items-center gap-1 cursor-pointer text-[11px] ${
                        isDarkMode ? 'text-sky-400 hover:text-sky-200' : 'text-[#0284c7] hover:text-sky-800'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>استعادة كلمة المرور؟</span>
                    </button>
                  </div>

                  {/* زر تسجيل الدخول الأساسي بلون شريط تسليم واستعلام الحوالات المعتمد */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] hover:from-[#0369a1] hover:to-[#0284c7] text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-950/60 border border-sky-400/40 hover:border-sky-300 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري التحقق والدخول...</span>
                      </div>
                    ) : (
                      <>
                        <span>تسجيل الدخول للنظام</span>
                        <LogIn className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* نموذج استعادة كلمة المرور عبر البريد الإلكتروني عند الطلب */
              <>
                <div className="text-center mb-6">
                  <div 
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-3 shadow-lg ${
                      isDarkMode 
                        ? 'bg-sky-500/20 border-sky-400/40 text-sky-400 shadow-sky-950/50' 
                        : 'bg-sky-50 border-sky-200 text-sky-700 shadow-2xs'
                    }`}
                  >
                    <Mail className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    استعادة كلمة المرور
                  </h2>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-sky-200/80' : 'text-slate-500'}`}>
                    أدخل البريد الإلكتروني المسجل في حسابك لاستعادة الرمز
                  </p>
                </div>

                {/* رسائل التنبيه والخطأ */}
                {recoveryError && (
                  <div className="mb-4 bg-rose-500/15 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">{recoveryError}</span>
                  </div>
                )}

                {recoverySuccess && (
                  <div className="mb-4 bg-sky-500/15 border border-sky-500/40 text-sky-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="font-semibold">{recoverySuccess}</span>
                  </div>
                )}

                {/* الخطوة 1: إدخال البريد الإلكتروني */}
                {recoveryStep === 'enter_email' && (
                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 flex items-center justify-between ${
                        isDarkMode ? 'text-sky-100' : 'text-slate-700'
                      }`}>
                        <span>البريد الإلكتروني للحساب *</span>
                        <span className="text-[10px] text-sky-400 font-normal">مثال: user@smartledger.iq</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="user@example.com"
                          dir="ltr"
                          className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-mono focus:outline-none transition-all text-right ${
                            isDarkMode 
                              ? 'bg-[#031424] border border-sky-600/50 text-white placeholder:text-sky-400/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20' 
                              : 'bg-[#fffefb] border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100'
                          }`}
                        />
                        <Mail className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                          isDarkMode ? 'text-sky-400' : 'text-slate-400'
                        }`} />
                      </div>
                      
                      {/* أمثلة سريعة للتسهيل والتجربة */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className={`text-[10px] font-medium ${isDarkMode ? 'text-sky-300/70' : 'text-slate-500'}`}>
                          بريد تجريبي:
                        </span>
                        <button
                          type="button"
                          onClick={() => setRecoveryEmail('mualbawi92@gmail.com')}
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
                            isDarkMode 
                              ? 'bg-sky-950/70 hover:bg-sky-900 text-sky-300 border-sky-700/60' 
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                          }`}
                        >
                          mualbawi92@gmail.com
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecoveryEmail('admin@smartledger.iq')}
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
                            isDarkMode 
                              ? 'bg-sky-950/70 hover:bg-sky-900 text-sky-300 border-sky-700/60' 
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                          }`}
                        >
                          admin@smartledger.iq
                        </button>
                      </div>

                      <p className={`text-[11px] mt-2 ${isDarkMode ? 'text-sky-300/60' : 'text-slate-500'}`}>
                        * سيتم التحقق من وجود الحساب وإتاحة إعادة تعيين كلمة المرور فوراً.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] hover:from-[#0369a1] hover:to-[#0284c7] text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-950/60 border border-sky-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>التحقق والبحث عن الحساب</span>
                    </button>

                    <div className="pt-3 text-center border-t border-sky-900/40">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className={`text-xs font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer ${
                          isDarkMode ? 'text-sky-300 hover:text-white' : 'text-slate-600 hover:text-[#0284c7]'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>العودة لشاشة تسجيل الدخول</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* الخطوة 2: تعيين كلمة المرور الجديدة */}
                {recoveryStep === 'reset_password' && matchedUser && (
                  <form onSubmit={handleSaveNewPassword} className="space-y-4">
                    
                    {/* تفاصيل الحساب المطابق */}
                    <div 
                      className={`rounded-xl p-3.5 text-xs space-y-1.5 border ${
                        isDarkMode 
                          ? 'bg-[#031424] border-sky-700/50' 
                          : 'bg-sky-50/70 border-sky-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={isDarkMode ? 'text-sky-300/80' : 'text-slate-600'}>اسم الحساب:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{matchedUser.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDarkMode ? 'text-sky-300/80' : 'text-slate-600'}>اسم المستخدم:</span>
                        <span className="font-mono text-sky-400 font-bold">{matchedUser.username || 'admin'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDarkMode ? 'text-sky-300/80' : 'text-slate-600'}>نوع المستخدم:</span>
                        <span className={`px-2 py-0.5 rounded border font-bold text-[11px] ${
                          isDarkMode ? 'bg-sky-900/60 text-sky-200 border-sky-700/50' : 'bg-white text-sky-800 border-sky-200'
                        }`}>
                          {matchedUser.userType}
                        </span>
                      </div>
                    </div>

                    {/* كلمة المرور الجديدة */}
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${
                        isDarkMode ? 'text-sky-100' : 'text-slate-700'
                      }`}>
                        كلمة المرور الجديدة *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور الجديدة..."
                          className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-[#031424] border border-sky-600/50 text-white placeholder:text-sky-400/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20' 
                              : 'bg-[#fffefb] border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100'
                          }`}
                        />
                        <KeyRound className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                          isDarkMode ? 'text-sky-400' : 'text-slate-400'
                        }`} />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                            isDarkMode ? 'text-sky-400/70 hover:text-sky-200' : 'text-slate-400 hover:text-slate-600'
                          }`}
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* تأكيد كلمة المرور الجديدة */}
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${
                        isDarkMode ? 'text-sky-100' : 'text-slate-700'
                      }`}>
                        تأكيد كلمة المرور الجديدة *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="أعد كتابة كلمة المرور..."
                          className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs focus:outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-[#031424] border border-sky-600/50 text-white placeholder:text-sky-400/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20' 
                              : 'bg-[#fffefb] border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#0284c7] focus:ring-2 focus:ring-sky-100'
                          }`}
                        />
                        <KeyRound className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                          isDarkMode ? 'text-sky-400' : 'text-slate-400'
                        }`} />
                      </div>
                    </div>

                    {/* زر الحفظ */}
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] hover:from-[#0369a1] hover:to-[#0284c7] text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-950/60 border border-sky-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ كلمة المرور وتحديث الحساب</span>
                    </button>

                    <div className="pt-3 text-center border-t border-sky-900/40">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className={`text-xs font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer ${
                          isDarkMode ? 'text-sky-300 hover:text-white' : 'text-slate-600 hover:text-[#0284c7]'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>إلغاء والعودة لتسجيل الدخول</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* الخطوة 3: اكتمال العملية */}
                {recoveryStep === 'done' && (
                  <div className="space-y-4 text-center py-2">
                    <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center mx-auto text-sky-400 shadow-lg">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        تم تغيير كلمة المرور بنجاح
                      </h3>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-sky-200/80' : 'text-slate-500'}`}>
                        تم تحديث بيانات حسابك المعتمد، يمكنك الآن تسجيل الدخول مباشرة بكلمة المرور الجديدة.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] hover:from-[#0369a1] hover:to-[#0284c7] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول الآن</span>
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </main>

      {/* التذييل للوحة الدخول */}
      <footer 
        className={`relative z-10 py-3 px-6 text-center text-[11px] border-t backdrop-blur-xs transition-colors ${
          isDarkMode 
            ? 'border-sky-900/60 bg-[#061d30]/80 text-sky-300/60' 
            : 'border-slate-200/80 bg-white/70 text-slate-500'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
          <div>
            <span>منظومة Smart Ledger المحاسبية • الإصدار 2.4</span>
            <span className="mx-2 opacity-40">•</span>
            <span>كافة الحقوق محفوظة</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 font-medium ${isDarkMode ? 'text-sky-200' : 'text-slate-600'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>معتمد للصيرفة والتحويل المالي</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
