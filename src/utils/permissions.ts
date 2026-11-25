import { AuthSessionUser } from '../components/web/LoginScreen';

/**
 * فحص صلاحية المستخدم للوصول إلى أوبشن أو شاشة معينة في النظام
 * قاعدة النظام:
 * 1. المدير ومجموعة الإدارة ومدير الفرع وحساب admin يمتلكون كافة الصلاحيات بنسبة 100%.
 * 2. الموظف تظهر له حصراً الصلاحيات التي تم منحها له أو لقسمه في مصفوفة الصلاحيات.
 * 3. في حال عدم تحديد مستخدم، يتم إظهار كافة الأوبشنات كخيار افتراضي آمن لضمان عدم اختفاء القائمة الجانبية.
 */
export function canUserAccessScreen(user: AuthSessionUser | null, screenKey: string): boolean {
  // محاولة استرجاع جلسة المستخدم من التخزين المحلي في حال عدم تمريرها
  if (!user) {
    try {
      const saved = localStorage.getItem('smart_ledger_current_auth_user');
      if (saved) {
        user = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  // إذا لم يكن هناك أي مستخدم مسجل إطلاقاً، نسمح بجميع الشاشات التشغيلية لضمان عمل الواجهة
  if (!user) {
    return true;
  }

  // المدير أو مدير الفرع أو الإدارة العامة أو admin يمتلكون كافة الصلاحيات بدون أي قيود
  const role = (user.userType || '').trim().toLowerCase();
  const username = (user.username || '').toLowerCase().trim();
  if (
    !role ||
    role === 'مدير' || 
    role === 'مدير فرع' ||
    role.includes('مدير') || 
    role.includes('ادارة') ||
    role.includes('إدارة') ||
    role === 'admin' ||
    username === 'admin'
  ) {
    return true;
  }

  // شاشات إدارية فائقة الحساسية لا تظهر للموظف إلا بصلاحية صريحة
  const isSuperAdminScreen = screenKey === 'users' || screenKey === 'settings';

  try {
    const rawMap = localStorage.getItem('smart_ledger_permissions_map');
    if (!rawMap) {
      if (isSuperAdminScreen) return false;
      // الصلاحيات التشغيلية الافتراضية للموظف قبل تخصيص الصلاحيات
      return true;
    }

    const permissionsMap = JSON.parse(rawMap);

    // فحص صلاحيات المستخدم المحددة مباشرة usr_${user.id}
    const userPerms = permissionsMap[`usr_${user.id}`];
    // فحص صلاحيات مجموعة المستخدم grp_${user.groupId}
    const groupPerms = user.groupId ? permissionsMap[`grp_${user.groupId}`] : null;

    const targetPerms = userPerms || groupPerms;

    if (!targetPerms) {
      if (isSuperAdminScreen) return false;
      return true;
    }

    const categoryRows = targetPerms[screenKey];
    if (!categoryRows || !Array.isArray(categoryRows) || categoryRows.length === 0) {
      // إذا لم يكن هناك تخصيص صريح لهذا القسم، نسمح بالأقسام التشغيلية
      return !isSuperAdminScreen;
    }

    // هل يمتلك أي صلاحية إيجابية مفعّلة في هذا القسم؟
    const hasAnyActivePermission = categoryRows.some((row: any) => 
      Boolean(row.createEntry || row.editEntry || row.deleteEntry || row.cancelEntry || row.printEntry || row.logEntry)
    );

    return hasAnyActivePermission;
  } catch {
    return true;
  }
}
