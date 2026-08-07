import { useState, useEffect } from 'react';

export interface PendingOfflineAction {
  id: string;
  type: 'CREATE_DIARY' | 'UPDATE_DIARY' | 'DELETE_DIARY' | 'ADD_CBT' | 'UPDATE_HABIT' | 'WATER_LOG' | 'CUSTOM';
  payload: any;
  timestamp: string;
}

const STORAGE_KEY = 'hayat_offline_pending_queue';

export function getOfflineQueue(): PendingOfflineAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline queue from localStorage:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: PendingOfflineAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error writing offline queue to localStorage:', e);
  }
}

export function enqueueOfflineAction(type: PendingOfflineAction['type'], payload: any): PendingOfflineAction {
  const newAction: PendingOfflineAction = {
    id: 'offline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  const queue = getOfflineQueue();
  queue.push(newAction);
  saveOfflineQueue(queue);

  // Trigger custom event so reactive UI updates immediately
  window.dispatchEvent(new Event('hayat_offline_queue_updated'));

  return newAction;
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('hayat_offline_queue_updated'));
}

export async function processOfflineQueue(
  handler: (action: PendingOfflineAction) => Promise<boolean>
): Promise<{ processedCount: number; success: boolean }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { processedCount: 0, success: true };
  }

  let processedCount = 0;
  const remainingQueue: PendingOfflineAction[] = [];

  for (const item of queue) {
    try {
      const ok = await handler(item);
      if (ok) {
        processedCount++;
      } else {
        remainingQueue.push(item);
      }
    } catch (err) {
      console.warn('Failed to process offline action:', item, err);
      remainingQueue.push(item);
    }
  }

  saveOfflineQueue(remainingQueue);
  window.dispatchEvent(new Event('hayat_offline_queue_updated'));

  return { processedCount, success: remainingQueue.length === 0 };
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingQueue, setPendingQueue] = useState<PendingOfflineAction[]>(getOfflineQueue());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueChange = () => setPendingQueue(getOfflineQueue());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('hayat_offline_queue_updated', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hayat_offline_queue_updated', handleQueueChange);
    };
  }, []);

  return {
    isOnline,
    pendingCount: pendingQueue.length,
    pendingQueue,
    enqueue: enqueueOfflineAction,
    clearQueue: clearOfflineQueue,
  };
}
