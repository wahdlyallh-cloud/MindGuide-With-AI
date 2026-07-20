import React, { useRef, useState } from 'react';
import { X, Cloud, Download, Upload, Share2, Mail, Send, RefreshCw, Smartphone } from 'lucide-react';

interface BackupSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEn: boolean;
  // Cloud states & functions passed from App.tsx
  isCloudSyncing: boolean;
  cloudSyncMessage: string | null;
  onCloudSync: () => void;
  onCloudRestore: () => void;
  // Local file export/import functions
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Email states & functions
  backupEmail: string;
  setBackupEmail: (email: string) => void;
  isSendingEmailBackup: boolean;
  onSendEmailBackup: () => void;
  emailBackupStatus: string | null;
  onClearEmailBackupStatus: () => void;
  // Auto backup settings
  autoBackupInterval: 'hourly' | 'daily' | 'weekly' | 'off';
  onChangeAutoBackupInterval: (interval: 'hourly' | 'daily' | 'weekly' | 'off') => void;
  onOpenWriteDiaryImport?: () => void;
}

export default function BackupSyncModal({
  isOpen,
  onClose,
  isEn,
  isCloudSyncing,
  cloudSyncMessage,
  onCloudSync,
  onCloudRestore,
  onExportBackup,
  onImportBackup,
  backupEmail,
  setBackupEmail,
  isSendingEmailBackup,
  onSendEmailBackup,
  emailBackupStatus,
  onClearEmailBackupStatus,
  autoBackupInterval,
  onChangeAutoBackupInterval,
  onOpenWriteDiaryImport
}: BackupSyncModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOtherAppsModal, setShowOtherAppsModal] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 font-sans" dir={isEn ? "ltr" : "rtl"}>
      <div className="bg-[#FAF8F5] border border-[#E2DCC8] rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <h4 className="font-black text-[#2B3E50] text-base md:text-lg flex items-center gap-2">
            <span>☁️</span>
            <span>{isEn ? "Backup & Cloud Synchronization" : "المزامنة والنسخ الاحتياطي ☁️"}</span>
          </h4>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-gray-600 font-extrabold leading-relaxed text-justify">
            {isEn 
              ? "Link your Google account to enable automatic cloud backup for your diaries and tasks and restore them instantly when switching to a new device, or use manual import/export options to share your entries." 
              : "قم بربط حساب Google لتفعيل المزامنة التلقائية للملاحظات والمهام واستعادتها بضغطة زر عند انتقالك لجهاز جديد، أو استخدم خيارات الاستيراد والتصدير اليدوي لمشاركة مذكراتك."}
          </p>

          {/* Blue Button: Link Google Account */}
          <button
            onClick={onCloudSync}
            disabled={isCloudSyncing}
            className="w-full py-4 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-blue-300 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isEn ? "Link Google Account (Cloud Sync) 🔑" : "ربط حساب Google سحابياً 🔑"}</span>
          </button>

          {/* Cloud Sync message widget */}
          {(cloudSyncMessage || isCloudSyncing) && (
            <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl space-y-2 text-center">
              <span className="text-[10px] text-blue-800 font-bold block leading-normal">
                {cloudSyncMessage || (isEn ? "Syncing in progress..." : "جاري تشغيل عملية المزامنة...")}
              </span>
              {!isCloudSyncing && (
                <button
                  onClick={onCloudRestore}
                  className="px-3 py-1 bg-white border border-blue-200 text-blue-600 rounded-lg text-[9px] font-bold shadow-3xs"
                >
                  {isEn ? "Restore Cloud Backup" : "استرجاع النسخة السحابية"}
                </button>
              )}
            </div>
          )}

          {/* Line separator with text header */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#E2DCC8]"></div>
            <span className="flex-shrink mx-3 text-[10px] font-black text-gray-400 flex items-center gap-1">
              <span>⚙️</span>
              <span>{isEn ? "Manual Export & Import" : "تصدير واستيراد المذكرات يدوياً"}</span>
            </span>
            <div className="flex-grow border-t border-[#E2DCC8]"></div>
          </div>

          {/* Export/Import Row buttons */}
          <div className="flex items-center gap-3">
            {/* Import Manual */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-white hover:bg-gray-50 border-2 border-[#E2DCC8] text-gray-600 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <span>📂</span>
              <span>{isEn ? "Import Manual" : "استيراد يدوي"}</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".json" 
              className="hidden" 
              onChange={onImportBackup} 
            />

            {/* Export and Share */}
            <button
              onClick={onExportBackup}
              className="flex-1 py-3 bg-[#4E685B] hover:bg-[#3F5449] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <span>📥</span>
              <span>{isEn ? "Export & Share" : "تصدير ومشاركة"}</span>
            </button>
          </div>

            {/* Prominent WriteDiary Import Option (Pink/Rose Theme) */}
            <button
              onClick={() => {
                if (onOpenWriteDiaryImport) {
                  onClose();
                  onOpenWriteDiaryImport();
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transform"
            >
              <span>📖</span>
              <span>{isEn ? "Import from old 'WriteDiary' App" : "استيراد من تطبيق يومياتي (WriteDiary) القديم 📖"}</span>
            </button>

            {/* Import other apps option */}
            <button
              onClick={() => setShowOtherAppsModal(true)}
              className="w-full py-3.5 bg-[#6D5D6E] hover:bg-[#4F3B51] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-3xs"
            >
              <span>🔌</span>
              <span>{isEn ? "Import notes/thoughts from other apps" : "استيراد مذكرات/خواطر من تطبيقات أخرى 🔌"}</span>
            </button>

            {/* Auto Backup Select Option */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2.5">
              <h5 className="font-extrabold text-[#5A5A40] text-[11px] flex items-center gap-1.5">
                <span>🔄</span>
                <span>{isEn ? "Auto Backup Frequency:" : "تكرار النسخ الاحتياطي التلقائي:"}</span>
              </h5>
              <select
                value={autoBackupInterval}
                onChange={(e) => onChangeAutoBackupInterval(e.target.value as any)}
                className="w-full bg-white border border-[#E2DCC8] rounded-xl px-3 py-2 text-xs text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-[#8B9D83] cursor-pointer"
              >
                <option value="hourly">{isEn ? "Hourly (Highly Recommended)" : "كل ساعة (توصية عيادية)"}</option>
                <option value="daily">{isEn ? "Daily on writing" : "يومياً عند التدوين"}</option>
                <option value="weekly">{isEn ? "Weekly" : "أسبوعياً"}</option>
                <option value="off">{isEn ? "Disable Auto Backup" : "إيقاف التكرار التلقائي"}</option>
              </select>
            </div>

            {/* Email backup section */}
            <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-2xl p-4 space-y-3">
              <h5 className="font-black text-indigo-950 text-[11px] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>{isEn ? "Secure Email Backup Archive:" : "النسخ الاحتياطي المشفر بالبريد الإلكتروني:"}</span>
              </h5>
              <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                {isEn 
                  ? "Receive an encrypted backup zip containing all diaries directly to your private email inbox."
                  : "أرسل أرشيف مذكراتك ومهامك بالكامل في ملف مشفر ومحمي مباشرة إلى بريدك الإلكتروني لتأمينها للغد."}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={isEn ? "email@domain.com" : "أدخل بريدك الإلكتروني هنا..."}
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  className="flex-grow bg-white border border-[#E2DCC8] rounded-xl px-3 py-2 text-xs text-[#2B3E50] focus:outline-none placeholder-gray-400 font-medium"
                />
                <button
                  onClick={onSendEmailBackup}
                  disabled={isSendingEmailBackup || !backupEmail.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3xs"
                >
                  {isSendingEmailBackup ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>{isEn ? "Send" : "إرسال"}</span>
                </button>
              </div>
              {emailBackupStatus && (
                <div className="bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-[10px] text-emerald-800 font-bold flex items-center justify-between">
                  <span>{emailBackupStatus}</span>
                  <button onClick={onClearEmailBackupStatus} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              )}
            </div>
          </div>
  
        </div>
  
        {/* Nested secondary mini-modal for importing from other apps */}
        {showOtherAppsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 font-sans" dir={isEn ? "ltr" : "rtl"}>
            <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <h5 className="font-black text-gray-800 text-sm flex items-center gap-1.5">
                  <span>🔌</span>
                  <span>{isEn ? "Import From Other Apps" : "استيراد من تطبيقات أخرى"}</span>
                </h5>
                <button onClick={() => setShowOtherAppsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                {isEn 
                  ? "This option allows you to import notes and journals exported from Notion, Day One, Apple Notes, or Diaro. Choose your app exported JSON/CSV files below to parse:" 
                  : "تتيح لك هذه الميزة استيراد نصوصك المكتوبة من تطبيقات شهيرة مثل Notion, Day One, Apple Notes و Diaro لتحويلها فورياً لمدونات يومية متكاملة."}
              </p>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setShowOtherAppsModal(false);
                    onClose();
                    if (onOpenWriteDiaryImport) onOpenWriteDiaryImport();
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 text-right px-4 cursor-pointer flex items-center justify-between"
                >
                  <span>📖 يومياتي (WriteDiary Backup)</span>
                  <span className="text-[9px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-black">مستحسن</span>
                </button>
                <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 text-right px-4 cursor-pointer">
                  📝 Notion Workspace (.json / .zip)
                </button>
                <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 text-right px-4 cursor-pointer">
                  📔 Day One Journal (.json)
                </button>
                <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 text-right px-4 cursor-pointer">
                  🍎 Apple Notes (.txt / .csv)
                </button>
              </div>
              <p className="text-[10px] text-amber-600 font-black">
                * ملاحظة: يتم فرز النصوص تلقائياً بواسطة خوارزمية الذكاء الاصطناعي لتوزيعها على تواريخها الصحيحة.
              </p>
              <button
                onClick={() => setShowOtherAppsModal(false)}
                className="w-full py-2.5 bg-[#4E685B] text-white text-xs font-black rounded-xl"
              >
                {isEn ? "Done" : "حسناً، فهمت"}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
