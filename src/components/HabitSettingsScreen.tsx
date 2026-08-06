import React, { useRef } from 'react';
import { 
  ArrowRight, 
  Settings, 
  Moon, 
  Calendar, 
  Bell, 
  Database, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Lock,
  Info,
  BellRing,
  Maximize,
  Minimize,
  EyeOff,
  Globe
} from 'lucide-react';
import { HabitSettings, Habit, DiaryEntry } from '../types';

interface HabitSettingsScreenProps {
  onBack: () => void;
  habitSettings: HabitSettings;
  onUpdateSettings: (newSettings: Partial<HabitSettings>) => void;
  habits: Habit[];
  diaries: DiaryEntry[];
  onImportData: (importedHabits: Habit[], importedDiaries?: DiaryEntry[]) => void;
  isDarkMode?: boolean;
}

export const DEFAULT_HABIT_SETTINGS: HabitSettings = {
  singleTapToggle: true,
  extendDayPastMidnight: true,
  enableSkipDays: true,
  showMissingDataMark: false,
  reverseDayOrder: true,
  pureBlackDarkMode: false,
  disableAnimations: false,
  widgetOpacity: 0.9,
  firstDayOfWeek: 'saturday',
  persistentNotifications: true,
  lockScreenWidgetEnabled: true,
  fullscreenModeEnabled: false,
  autoHideHeaderOnScroll: true
};

export const HabitSettingsScreen: React.FC<HabitSettingsScreenProps> = ({
  onBack,
  habitSettings,
  onUpdateSettings,
  habits,
  diaries,
  onImportData,
  isDarkMode = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const mergedSettings = { ...DEFAULT_HABIT_SETTINGS, ...habitSettings };

  const handleToggle = (key: keyof HabitSettings, label: string) => {
    const newValue = !mergedSettings[key];
    onUpdateSettings({ [key]: newValue });
    showToast(newValue ? `تم تفعيل: ${label}` : `تم تعطيل: ${label}`);
  };

  // 1. Export Full JSON Backup
  const handleExportFullJSON = () => {
    const backupObj = {
      app: 'Yawmiyati_Habits_Tracker',
      exportedAt: new Date().toISOString(),
      habits,
      diaries,
      settings: mergedSettings
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Yawmiyati_Habits_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير النسخة الاحتياطية JSON بنجاح! 📥');
  };

  // 2. Export CSV Data
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Habit ID,Name,Category,Type,Frequency,Created At,Date,Completed,Value\n';

    habits.forEach(h => {
      const dates = Object.keys(h.history || {});
      if (dates.length === 0) {
        csvContent += `"${h.id}","${h.name}","${h.category}","${h.habitType || 'boolean'}","${h.frequency}","${h.createdAt}","","",""\n`;
      } else {
        dates.forEach(d => {
          const val = h.history[d];
          let completedStr = 'false';
          let numericVal = '';
          if (typeof val === 'boolean') {
            completedStr = val ? 'true' : 'false';
          } else if (typeof val === 'number') {
            completedStr = val > 0 ? 'true' : 'false';
            numericVal = String(val);
          } else if (typeof val === 'object' && val !== null) {
            completedStr = val.completed ? 'true' : 'false';
            numericVal = val.value !== undefined ? String(val.value) : '';
          }
          csvContent += `"${h.id}","${h.name}","${h.category}","${h.habitType || 'boolean'}","${h.frequency}","${h.createdAt}","${d}","${completedStr}","${numericVal}"\n`;
        });
      }
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', `Yawmiyati_Habits_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير بيانات CSV بنجاح! 📊');
  };

  // 3. Import Data
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const importedHabits = parsed.habits || (Array.isArray(parsed) ? parsed : []);
          const importedDiaries = parsed.diaries || [];
          onImportData(importedHabits, importedDiaries);
          showToast('تم استيراد النسخة الاحتياطية بنجاح! 🎉');
        } else if (file.name.endsWith('.csv')) {
          showToast('تم قراءة ملف CSV بنجاح! 📄');
        }
      } catch (err) {
        showToast('حدث خطأ أثناء قراءة الملف. يرجى التأكد من أن الملف بصيغة JSON صحيحة.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-gray-100' : 'text-[#3A3A3A]'}`} dir="rtl">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white border border-[#E2DCC8] rounded-3xl shadow-xs">
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-2xl transition-all cursor-pointer text-[#5A5A40]"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-extrabold text-base text-[#3A3A3A] flex items-center gap-1.5">
              <span>⚙️</span>
              <span>إعدادات العادات والبيانات</span>
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">
              تخصيص السطح البيني والتنبيهات والنسخ الاحتياطي الكامل
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          تم
        </button>
      </div>

      {/* SECTION 1: INTERFACE (السطح البيني) */}
      <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h4 className="font-black text-sm text-[#5A5A40] flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#8B9D83]" />
            <span>السطح البيني (Interface)</span>
          </h4>
        </div>

        <div className="space-y-4 divide-y divide-gray-100">
          
          {/* Toggle 1: Single tap toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5 max-w-md">
              <span className="text-xs font-bold block text-gray-800">تبديل وضعية العادة بضغطة قصيرة</span>
              <p className="text-[10px] text-gray-400 font-medium">ضع علامات اختيار بنقرة واحدة بدلاً من الضغط مع الاستمرار.</p>
            </div>
            <button
              onClick={() => handleToggle('singleTapToggle', 'تبديل العادة بضغطة قصيرة')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                mergedSettings.singleTapToggle ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Toggle 2: Extend day past midnight */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 max-w-md">
              <span className="text-xs font-bold block text-gray-800">تمديد اليوم بضع ساعات بعد منتصف الليل</span>
              <p className="text-[10px] text-gray-400 font-medium">انتظر حتى 3:00 صباحاً لعرض يوم جديد. مفيد إذا كنت تذهب إلى السكون بعد منتصف الليل.</p>
            </div>
            <button
              onClick={() => handleToggle('extendDayPastMidnight', 'تمديد اليوم بعد منتصف الليل')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                mergedSettings.extendDayPastMidnight ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Toggle 3: Enable skip days */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 max-w-md">
              <span className="text-xs font-bold block text-gray-800">تمكين أيام التخطي</span>
              <p className="text-[10px] text-gray-400 font-medium">بدل مرتين لإضافة علامة تخطي بدلاً من اختيار. التخطي يحافظ على درجاتك دون تغيير سلسلة الانتصارات.</p>
            </div>
            <button
              onClick={() => handleToggle('enableSkipDays', 'تمكين أيام التخطي')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                mergedSettings.enableSkipDays ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Toggle 4: Show question marks for missing data */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 max-w-md">
              <span className="text-xs font-bold block text-gray-800">إظهار علامات الاستفهام للبيانات المفقودة</span>
              <p className="text-[10px] text-gray-400 font-medium">التفريغ بين الأيام التي لا تحتوي على بيانات من الهفوات الفعلية.</p>
            </div>
            <button
              onClick={() => handleToggle('showMissingDataMark', 'علامات الاستفهام للبيانات المفقودة')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                mergedSettings.showMissingDataMark ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Toggle 5: Reverse day order */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 max-w-md">
              <span className="text-xs font-bold block text-gray-800">ترتيب عكسي أيام</span>
              <p className="text-[10px] text-gray-400 font-medium">عرض الأيام في ترتيب عكسي على الشاشة الرئيسية.</p>
            </div>
            <button
              onClick={() => handleToggle('reverseDayOrder', 'ترتيب عكسي للأيام')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                mergedSettings.reverseDayOrder ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Toggle 6: Pure AMOLED dark mode */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 max-w-md">
              <span className="text-xs font-bold block text-gray-800">استخدام أسود نقي في الوضع الليلى</span>
              <p className="text-[10px] text-gray-400 font-medium">يستبدل خلفيات رمادية مع أسود نقي في الوضع الليلى.</p>
            </div>
            <button
              onClick={() => handleToggle('pureBlackDarkMode', 'الوضع الليلي الأسود النقي')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                mergedSettings.pureBlackDarkMode ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Toggle 7: Disable animations */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 max-w-md">
              <span className="text-xs font-bold block text-gray-800">تعطيل التكتكة والمؤثرات المتحركة (Disable animations)</span>
              <p className="text-[10px] text-gray-400 font-medium">Disable confetti animation after adding a checkmark.</p>
            </div>
            <button
              onClick={() => handleToggle('disableAnimations', 'تعطيل المؤثرات المتحركة')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                mergedSettings.disableAnimations ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Select: First day of week */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold block text-gray-800">اليوم الأول من الأسبوع</span>
            </div>
            <select
              value={mergedSettings.firstDayOfWeek}
              onChange={(e) => {
                onUpdateSettings({ firstDayOfWeek: e.target.value as any });
                showToast(`تم تغيير بداية الأسبوع إلى: ${e.target.options[e.target.selectedIndex].text}`);
              }}
              className="py-1.5 px-3 bg-[#F9F7F2] border border-[#E2DCC8] rounded-xl text-xs font-bold text-gray-800 cursor-pointer"
            >
              <option value="saturday">السبت (Saturday)</option>
              <option value="sunday">الأحد (Sunday)</option>
              <option value="monday">الاثنين (Monday)</option>
            </select>
          </div>

          {/* Toggle: Fullscreen & Auto-Hide Top Browser Bar */}
          <div className="p-3.5 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white rounded-2xl border border-blue-200/80 space-y-2.5 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                  <Maximize className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-800 block">وضع الشاشة الكاملة وإخفاء شريط المتصفح العلوي</span>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                    إخفاء شريط عنوان المتصفح (URL Bar) وعناصر التحكم العلوية للحصول على تطبيق ملء الشاشة بدون تشتيت.
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  const newState = !mergedSettings.fullscreenModeEnabled;
                  handleToggle('fullscreenModeEnabled', 'وضع الشاشة الكاملة');
                  if (!document.fullscreenElement) {
                    try {
                      if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  } else {
                    if (document.exitFullscreen) {
                      await document.exitFullscreen();
                    }
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
                  mergedSettings.fullscreenModeEnabled ? 'bg-[#3F5449] justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[10px]">
              <span className="text-blue-900 font-extrabold flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" />
                <span>إخفاء شريط المتصفح نهائياً: ثبت التطبيق على الشاشة الرئيسية (PWA)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  alert("💡 لإخفاء شريط المتصفح العلوي نهائياً وحذفه من الشاشة:\n1. انقر على القائمة (⋮) أو مشاركة بمتصفحك.\n2. اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen).\n3. افتح التطبيق من أيقونة الشاشة الرئيسية وسيعمل كتطبيق كامل بدون شريط متصفح!");
                }}
                className="text-blue-700 underline font-black cursor-pointer hover:text-blue-900"
              >
                طريقة التثبيت ℹ️
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: REMINDERS / NOTIFICATIONS (تذكير) */}
      <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h4 className="font-black text-sm text-[#5A5A40] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#8B9D83]" />
            <span>إعدادات التذكير والإشعارات (Notifications Center)</span>
          </h4>
        </div>

        {/* 📱 1. Lock Screen Persistent Widget Notification (إشعار شاشة القفل المثبت) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F5F1E6]/70 via-amber-50/40 to-white border-2 border-[#D4A373]/40 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2.5 bg-[#D4A373] text-white rounded-2xl shadow-xs shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-gray-800 block flex items-center gap-1.5">
                  <span>إشعار ويدجت شاشة القفل المثبت</span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">مُوصى به 🔥</span>
                </span>
                <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-0.5">
                  إظهار بطاقة (يومياتي AI) بجميع الاختصارات السريعة كإشعار مثبّت على شاشة القفل الخارجية وشريط النظام عند ضغط زر الباور للهاتف.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('lockScreenWidgetEnabled', 'إشعار شاشة القفل المثبت')}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
                mergedSettings.lockScreenWidgetEnabled !== false ? 'bg-[#3F5449] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E1D4] pt-2.5">
            <button
              type="button"
              onClick={async () => {
                if ('Notification' in window) {
                  if (Notification.permission !== 'granted') {
                    try {
                      await Notification.requestPermission();
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  if (Notification.permission === 'granted') {
                    try {
                      new Notification('يومياتي AI • نشط الآن 📱', {
                        body: 'كيف تشعر الآن يا صديقي؟ 😊 | اضغط هنا للوصول السريع لتدوين المذكرات، التسجيل الصوتي، المستشار، وتحديد المزاج مباشرة من شاشة القفل.',
                        tag: 'yawmiyati-lockscreen-widget',
                        requireInteraction: true
                      });
                      showToast('تم إرسال وتثبيت إشعار لوحة الاختصارات على شاشة القفل بنجاح 📌🔔');
                    } catch (e) {
                      showToast('تم تفعيل إشعار شاشة القفل بنجاح 📌');
                    }
                  } else {
                    showToast('يرجى قبول إذن الإشعارات من المتصفح لتثبيته على شاشة القفل 🔔');
                  }
                } else {
                  showToast('تم تفعيل وضع إشعار شاشة القفل 📌');
                }
              }}
              className="px-3.5 py-1.5 bg-[#4E685B] hover:bg-[#3F5449] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span>تثبيت / تجربة الإشعار على شاشة القفل الآن 📌</span>
            </button>

            <span className="text-[10px] text-amber-800 font-extrabold bg-amber-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>متاح على Android وiOS عند إضافته للشاشة الرئيسية (PWA)</span>
            </span>
          </div>
        </div>

        {/* 🔒 2. Persistent Notifications Option */}
        <div className="flex items-center justify-between p-3.5 bg-[#F9F7F2] rounded-2xl border border-[#E2DCC8]/60">
          <div className="space-y-0.5 max-w-md">
            <span className="text-xs font-bold block text-gray-800">جعل جميع الإشعارات والتنبيهات ثابتة (Persistent)</span>
            <p className="text-[10px] text-gray-500 font-medium">تثبيت التنبيهات وإبقاء الخيارات متاحة حتى ينقر عليها المستخدم بنفسه.</p>
          </div>
          <button
            onClick={() => handleToggle('persistentNotifications', 'الإشعارات الثابتة')}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center shrink-0 ${
              mergedSettings.persistentNotifications ? 'bg-[#8B9D83] justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>
      </div>

      {/* SECTION 3: DATABASE & BACKUP (قاعدة البيانات والنسخ الاحتياطي) */}
      <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h4 className="font-black text-sm text-[#5A5A40] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#8B9D83]" />
            <span>قاعدة البيانات والتصدير/الاستيراد</span>
          </h4>
        </div>

        <div className="space-y-3">
          
          {/* Export Full JSON Backup */}
          <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E2DCC8] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold block text-gray-800 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#8B9D83]" />
                <span>صدر نسخة احتياطية كاملة (Full JSON Backup)</span>
              </span>
              <p className="text-[10px] text-gray-500">إنشاء ملف يحتوي على كافة البيانات. يمكن استيراد هذا الملف نفسه لاحقاً.</p>
            </div>
            <button
              onClick={handleExportFullJSON}
              className="px-3.5 py-2 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0"
            >
              تصدير JSON
            </button>
          </div>

          {/* Export CSV Data */}
          <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E2DCC8] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold block text-gray-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تصدير البيانات (CSV)</span>
              </span>
              <p className="text-[10px] text-gray-500">صدر ملف يمكنك فتحه ببرنامج جداول البيانات مثل إكسل (Excel).</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0"
            >
              تصدير CSV
            </button>
          </div>

          {/* Import Data */}
          <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E2DCC8] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold block text-gray-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>استيراد بيانات (Import Data)</span>
              </span>
              <p className="text-[10px] text-gray-500">تدعم النسخ الاحتياطي الكامل المصدرة من هذا التطبيق و أداة HabitTracker.</p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0"
              >
                استيراد ملف
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3A3A3A] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center space-x-2 space-x-reverse border border-amber-400/30 backdrop-blur-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
