import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useOfflineStatus, processOfflineQueue } from '../lib/offlineSync';
import { AppLanguage, getTranslation } from '../lib/languages';

interface OfflineSyncBannerProps {
  appLanguage: AppLanguage;
  onSyncTrigger?: () => Promise<boolean>;
  className?: string;
}

export default function OfflineSyncBanner({
  appLanguage = 'ar',
  onSyncTrigger,
  className = '',
}: OfflineSyncBannerProps) {
  const { isOnline, pendingCount } = useOfflineStatus();
  const t = getTranslation(appLanguage);
  const isRtl = appLanguage === 'ar' || appLanguage === 'ur';

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const res = await processOfflineQueue(async (action) => {
        if (onSyncTrigger) {
          return await onSyncTrigger();
        }
        // Simulated process time for offline items
        await new Promise((resolve) => setTimeout(resolve, 400));
        return true;
      });

      if (res.success) {
        setSyncSuccessMsg(true);
        setTimeout(() => setSyncSuccessMsg(false), 3000);
      }
    } catch (e) {
      console.error('Manual sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Only show if offline OR if there are pending actions in queue OR just successfully synced
  if (isOnline && pendingCount === 0 && !syncSuccessMsg) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className={`w-full z-40 ${className}`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl border text-xs font-bold shadow-lg flex items-center justify-between gap-3 transition-colors ${
            !isOnline
              ? 'bg-amber-900/90 border-amber-500/50 text-amber-100 backdrop-blur-md'
              : pendingCount > 0
              ? 'bg-slate-900/90 border-slate-700 text-slate-100 backdrop-blur-md'
              : 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {!isOnline ? (
              <div className="p-1.5 bg-amber-500/30 text-amber-300 rounded-xl animate-pulse">
                <WifiOff className="w-4 h-4" />
              </div>
            ) : pendingCount > 0 ? (
              <div className="p-1.5 bg-sky-500/30 text-sky-300 rounded-xl">
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
            ) : (
              <div className="p-1.5 bg-emerald-500/30 text-emerald-300 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            <div>
              {!isOnline ? (
                <span>
                  {t.offlineStatusOffline || (isRtl ? 'وضع عدم الاتصال بالإنترنت - يتم الحفظ محلياً بآمان' : 'Offline Mode - Saving state locally')}
                </span>
              ) : pendingCount > 0 ? (
                <span>
                  {isRtl
                    ? `توجد ${pendingCount} عمليات في انتظار المزامنة مع السحابة`
                    : `${pendingCount} offline actions pending cloud synchronization`}
                </span>
              ) : (
                <span>
                  {t.offlineSyncSuccess || (isRtl ? 'تمت مزامنة جميع البيانات المحفوظة محلياً بنجاح ✨' : 'All offline data synced successfully ✨')}
                </span>
              )}
            </div>
          </div>

          {isOnline && pendingCount > 0 && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (isRtl ? 'جاري المزامنة...' : 'Syncing...') : (isRtl ? 'مزامنة الآن 🔄' : 'Sync Now 🔄')}</span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
