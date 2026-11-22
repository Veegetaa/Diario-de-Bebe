'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  BabyProfile,
  BabyRecord,
  ActiveSleepSession,
  UndoAction,
  TabType,
  SleepRecord,
  NoteRecord,
  DayAlertColor,
  DayColorsMap,
  GrowthRecord,
} from '@/lib/types';
import {
  loadProfileFromStorage,
  saveProfileToStorage,
  loadRecordsFromStorage,
  saveRecordsToStorage,
  loadActiveSleepFromStorage,
  saveActiveSleepToStorage,
  loadThemeOverrideFromStorage,
  saveThemeOverrideToStorage,
  loadFamilyCodeFromStorage,
  saveFamilyCodeToStorage,
  loadDayColorsFromStorage,
  saveDayColorsToStorage,
  loadGrowthRecordsFromStorage,
  saveGrowthRecordsToStorage,
  loadGrowthUpdatedAtFromStorage,
  saveGrowthUpdatedAtToStorage,
} from '@/lib/storage';
import {
  getTodayDateString,
  getCurrentTimeString,
  calculateSleepDuration,
  getSleepMinutesForDate,
} from '@/lib/date-utils';
import { sortGrowthRecordsAsc } from '@/lib/growth-utils';
import {
  generateRandomFamilyCode,
  fetchDiaryByCode,
  fetchFullDiaryData,
  initializeDiaryInFirestore,
  saveRecordToCloud,
  deleteRecordFromCloud,
  updateProfileInCloud,
  updateActiveSleepInCloud,
  updateDayColorInCloud,
  updateGrowthRecordsInCloud,
  subscribeToSharedDiary,
  normalizeFamilyCode,
  syncLocalRecordsToCloud,
  SharedDiaryData,
} from '@/lib/firestore-sync';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  subscribeToAuth,
  getFriendlyAuthErrorMessage,
  AuthUser,
} from '@/lib/auth-service';
import { testConnection } from '@/lib/firebase';

interface BabyContextType {
  profile: BabyProfile;
  updateProfile: (updated: Partial<BabyProfile>) => void;
  records: BabyRecord[];
  activeSleep: ActiveSleepSession | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  resetToToday: () => void;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  // Undo system
  undoAction: UndoAction | null;
  triggerUndo: () => void;
  dismissUndo: () => void;
  // Themes
  themeMode: 'auto' | 'light' | 'dark';
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: 'auto' | 'light' | 'dark') => void;
  // Calendar dropdown
  isCalendarDropdownOpen: boolean;
  toggleCalendarDropdown: () => void;
  closeCalendarDropdown: () => void;
  // Sheets & Modals
  activeSheet: 'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota' | 'edit' | 'sono_anterior' | 'profile' | 'sync' | 'esquecido' | 'calendario_registrar' | null;
  openSheet: (sheet: 'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota' | 'edit' | 'sono_anterior' | 'profile' | 'sync' | 'esquecido' | 'calendario_registrar') => void;
  closeSheet: () => void;
  editingRecord: BabyRecord | null;
  setEditingRecord: (record: BabyRecord | null) => void;
  viewingRecord: BabyRecord | null;
  setViewingRecord: (record: BabyRecord | null) => void;
  // CRUD
  addRecord: (record: BabyRecord, successMessage?: string) => void;
  addRecordsBatch: (newRecords: BabyRecord[], successMessage?: string) => void;
  updateRecord: (updated: BabyRecord, successMessage?: string) => void;
  deleteRecord: (id: string, successMessage?: string) => void;
  toggleFavoriteNote: (id: string) => void;
  // Sleep actions
  startSleepSession: (startDate?: string, startTime?: string) => void;
  finishSleepSession: (endDate?: string, endTime?: string) => void;
  cancelSleepSession: () => void;
  // Computed helpers for current or selected date
  recordsForSelectedDate: BabyRecord[];
  totalSleepMinutesForSelectedDate: number;
  lastFeeding: { text: string; record?: BabyRecord } | null;
  lastDiaper: { text: string; record?: BabyRecord } | null;
  // Direct jump from search to calendar
  jumpToDate: (date: string) => void;
  // Family Auth & Real-Time Cloud Synchronization
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  loginEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  familyCode: string | null;
  isCloudConnected: boolean;
  isSyncing: boolean;
  syncError: string | null;
  createOrShareFamilyCode: () => Promise<string>;
  joinFamilyCode: (code: string) => Promise<{ success: boolean; message?: string }>;
  disconnectFamilyCode: () => void;
  // Manual refresh & Pull to refresh
  refreshData: () => Promise<boolean>;
  isManualRefreshing: boolean;
  // Day Alert Colors (amarelo / vermelho)
  dayColors: DayColorsMap;
  setDayColor: (dateStr: string, color: DayAlertColor | null) => void;
  // Baby Growth Measurements (peso e altura)
  growthRecords: GrowthRecord[];
  addGrowthRecord: (entry: GrowthRecord) => void;
  updateGrowthRecord: (updated: GrowthRecord) => void;
  deleteGrowthRecord: (id: string) => void;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BabyProfile>(() => loadProfileFromStorage());
  const [records, setRecords] = useState<BabyRecord[]>(() => loadRecordsFromStorage());
  const [activeSleep, setActiveSleep] = useState<ActiveSleepSession | null>(() => loadActiveSleepFromStorage());
  const [dayColors, setDayColors] = useState<DayColorsMap>(() => loadDayColorsFromStorage());
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>(() =>
    sortGrowthRecordsAsc(loadGrowthRecordsFromStorage())
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [currentTab, setCurrentTab] = useState<TabType>('hoje');
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [themeMode, setThemeModeState] = useState<'auto' | 'light' | 'dark'>(() =>
    loadThemeOverrideFromStorage()
  );
  const effectiveTheme: 'light' | 'dark' = themeMode === 'light' ? 'light' : 'dark';
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  const [activeSheet, setActiveSheet] = useState<
    'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota' | 'edit' | 'sono_anterior' | 'profile' | 'sync' | 'esquecido' | 'calendario_registrar' | null
  >(null);
  const [editingRecord, setEditingRecord] = useState<BabyRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<BabyRecord | null>(null);

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Cloud Synchronization state
  const [familyCode, setFamilyCode] = useState<string | null>(() => loadFamilyCodeFromStorage());
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Effective sync ID: Prefer authenticated user UID, fallback to familyCode
  const effectiveSyncId = useMemo(() => {
    return authUser ? authUser.uid : familyCode;
  }, [authUser, familyCode]);

  const isSavingRef = useRef(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordsRef = useRef<BabyRecord[]>(records);
  const growthRecordsRef = useRef<GrowthRecord[]>(growthRecords);
  const lastPushedGrowthRef = useRef<{ ts: number; at: number }>({ ts: 0, at: 0 });

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    growthRecordsRef.current = growthRecords;
  }, [growthRecords]);

  // Initial connection test
  useEffect(() => {
    testConnection();
  }, []);

  // Reconcile cloud vs local growth measurements safely:
  // - Rescues any pre-existing unsynced local measurements (localTs === 0) by merging and uploading them.
  // - Uses growthUpdatedAt timestamps once synced so edits and deletions propagate cleanly across devices.
  const reconcileGrowthRecords = useCallback(
    (diaryData: SharedDiaryData | null, syncId: string) => {
      const localGrowth = sortGrowthRecordsAsc(loadGrowthRecordsFromStorage());
      const localTs = loadGrowthUpdatedAtFromStorage();
      const hasCloudArray =
        diaryData?.growthRecords !== undefined && Array.isArray(diaryData.growthRecords);
      const cloudGrowth = hasCloudArray ? sortGrowthRecordsAsc(diaryData!.growthRecords!) : [];
      const cloudTs =
        typeof diaryData?.growthUpdatedAt === 'number' ? diaryData.growthUpdatedAt : 0;

      // Case 1: Legacy local measurements created before growthUpdatedAt existed (never synced to cloud)
      if (localGrowth.length > 0 && localTs === 0) {
        const mergedMap = new Map<string, GrowthRecord>();
        localGrowth.forEach((item) => mergedMap.set(item.id, item));
        cloudGrowth.forEach((item) => mergedMap.set(item.id, item));
        const merged = sortGrowthRecordsAsc(Array.from(mergedMap.values()));

        const now = Math.max(Date.now(), cloudTs + 1);
        growthRecordsRef.current = merged;
        setGrowthRecords(merged);
        saveGrowthRecordsToStorage(merged);
        saveGrowthUpdatedAtToStorage(now);

        if (syncId) {
          lastPushedGrowthRef.current = { ts: now, at: Date.now() };
          updateGrowthRecordsInCloud(syncId, merged, now).catch((e) =>
            console.error('Error syncing rescued local growth records to cloud:', e)
          );
        }
        return;
      }

      // Case 2: Cloud has no growthUpdatedAt yet
      if (cloudTs === 0) {
        if (localGrowth.length === 0 && cloudGrowth.length === 0) {
          return;
        }
        const mergedMap = new Map<string, GrowthRecord>();
        cloudGrowth.forEach((item) => mergedMap.set(item.id, item));
        localGrowth.forEach((item) => mergedMap.set(item.id, item));
        const merged = sortGrowthRecordsAsc(Array.from(mergedMap.values()));

        growthRecordsRef.current = merged;
        setGrowthRecords(merged);
        saveGrowthRecordsToStorage(merged);

        if (merged.length > 0 && syncId) {
          const ts = localTs > 0 ? localTs : Date.now();
          saveGrowthUpdatedAtToStorage(ts);
          if (
            lastPushedGrowthRef.current.ts !== ts ||
            Date.now() - lastPushedGrowthRef.current.at > 5000
          ) {
            lastPushedGrowthRef.current = { ts, at: Date.now() };
            updateGrowthRecordsInCloud(syncId, merged, ts).catch((e) =>
              console.error('Error uploading merged growth records to cloud:', e)
            );
          }
        }
        return;
      }

      // Case 3: Modern synced cloud (cloudTs > 0)
      if (localTs > cloudTs) {
        // Local device has newer changes (e.g. offline edit or write still in flight)
        if (
          syncId &&
          (lastPushedGrowthRef.current.ts !== localTs ||
            Date.now() - lastPushedGrowthRef.current.at > 5000)
        ) {
          lastPushedGrowthRef.current = { ts: localTs, at: Date.now() };
          updateGrowthRecordsInCloud(syncId, localGrowth, localTs).catch((e) =>
            console.error('Error pushing newer local growth records to cloud:', e)
          );
        }
        return;
      }

      // Cloud is equal or newer: accept cloud state as authoritative (propagates edits and deletions cleanly)
      growthRecordsRef.current = cloudGrowth;
      setGrowthRecords(cloudGrowth);
      saveGrowthRecordsToStorage(cloudGrowth);
      saveGrowthUpdatedAtToStorage(cloudTs);
    },
    []
  );

  // Shared resilient method to merge cloud data with local records without ever wiping local state
  const applyCloudData = useCallback(
    (diaryData: SharedDiaryData | null, cloudRecords: BabyRecord[], syncId: string) => {
      if (diaryData?.babyProfile) {
        setProfile(diaryData.babyProfile);
        saveProfileToStorage(diaryData.babyProfile);
      }
      if (diaryData?.activeSleep !== undefined) {
        setActiveSleep(diaryData.activeSleep);
        saveActiveSleepToStorage(diaryData.activeSleep);
      }
      if (diaryData?.dayColors !== undefined) {
        setDayColors(diaryData.dayColors || {});
        saveDayColorsToStorage(diaryData.dayColors || {});
      }
      reconcileGrowthRecords(diaryData, syncId);

      // Merge cloud records with any local records that might still be unsynced
      const localRecs = loadRecordsFromStorage();
      const cloudIds = new Set(cloudRecords.map((r) => r.id));
      const unsyncedLocals = localRecs.filter((r) => !cloudIds.has(r.id));

      if (unsyncedLocals.length > 0 && syncId) {
        syncLocalRecordsToCloud(syncId, unsyncedLocals).catch(console.warn);
      }

      const merged = [...cloudRecords, ...unsyncedLocals].sort((a, b) => b.createdAt - a.createdAt);
      setRecords(merged);
      saveRecordsToStorage(merged);
    },
    [reconcileGrowthRecords]
  );

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setAuthUser(user);
      setIsAuthLoading(false);
      if (user) {
        setIsCloudConnected(true);
        // Automatically fetch cloud data and safely sync
        fetchFullDiaryData(user.uid)
          .then((res) => {
            if (res.success) {
              applyCloudData(res.diaryData, res.records, user.uid);
            } else {
              console.warn('Auto fetch on auth was not successful, preserving local records');
            }
          })
          .catch((e) => console.warn('Auto fetch on auth error:', e));
      }
    });
    return unsub;
  }, [applyCloudData]);

  // Real-time Firestore synchronization whenever effectiveSyncId is active
  useEffect(() => {
    if (!effectiveSyncId) {
      return;
    }

    const unsubscribe = subscribeToSharedDiary(effectiveSyncId, {
      onDiaryData: (diaryData) => {
        setIsCloudConnected(true);
        setIsSyncing(false);
        if (diaryData.babyProfile) {
          setProfile(diaryData.babyProfile);
          saveProfileToStorage(diaryData.babyProfile);
        }
        if (diaryData.activeSleep !== undefined) {
          setActiveSleep(diaryData.activeSleep);
          saveActiveSleepToStorage(diaryData.activeSleep);
        }
        if (diaryData.dayColors !== undefined) {
          setDayColors(diaryData.dayColors || {});
          saveDayColorsToStorage(diaryData.dayColors || {});
        }
        reconcileGrowthRecords(diaryData, effectiveSyncId);
      },
      onRecords: (cloudRecords) => {
        setIsCloudConnected(true);
        setIsSyncing(false);
        const safeRecords = Array.isArray(cloudRecords) ? cloudRecords : [];

        // Preserve any recent local records that haven't propagated to Firestore yet
        const localRecs = loadRecordsFromStorage();
        const cloudIds = new Set(safeRecords.map((r) => r.id));
        const pendingLocals = localRecs.filter(
          (r) => !cloudIds.has(r.id) && Date.now() - r.createdAt < 45000
        );

        const finalRecords = [...safeRecords, ...pendingLocals].sort(
          (a, b) => b.createdAt - a.createdAt
        );
        setRecords(finalRecords);
        saveRecordsToStorage(finalRecords);
      },
      onError: (err) => {
        setIsSyncing(false);
        setSyncError('Falha temporária ao sincronizar com a nuvem');
        console.warn('Sync connection warning:', err);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [effectiveSyncId, reconcileGrowthRecords]);

  // Re-sync on iOS Safari wakeup (unlock phone, switch tabs, reconnect internet)
  useEffect(() => {
    if (!effectiveSyncId) return;

    let isPulling = false;
    const syncFromCloud = async () => {
      if (isPulling) return;
      isPulling = true;
      try {
        const res = await fetchFullDiaryData(effectiveSyncId);
        if (res.success) {
          applyCloudData(res.diaryData, res.records, effectiveSyncId);
          setIsCloudConnected(true);
        }
      } catch (err) {
        console.warn('Background sync check warning:', err);
      } finally {
        isPulling = false;
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromCloud();
      }
    };

    // Heartbeat sync every 15s when active in foreground to guarantee real-time parity on iOS
    const heartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromCloud();
      }
    }, 15000);

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', syncFromCloud);
      window.addEventListener('online', syncFromCloud);
    }

    return () => {
      clearInterval(heartbeat);
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', syncFromCloud);
        window.removeEventListener('online', syncFromCloud);
      }
    };
  }, [effectiveSyncId, applyCloudData]);

  // Toggle between dark night starry theme and soft pastel pink light theme
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', effectiveTheme === 'dark' ? '#121224' : '#FFF8FA');
    }
  }, [effectiveTheme]);

  const setThemeMode = useCallback((mode: 'auto' | 'light' | 'dark') => {
    setThemeModeState(mode);
    saveThemeOverrideToStorage(mode);
  }, []);

  // Update profile
  const updateProfile = useCallback(
    (updated: Partial<BabyProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...updated };
        saveProfileToStorage(next);
        if (effectiveSyncId) {
          updateProfileInCloud(effectiveSyncId, next).catch((e) => console.warn(e));
        }
        return next;
      });
    },
    [effectiveSyncId]
  );

  // Set undo with auto dismissal after 6 seconds
  const showUndo = useCallback((message: string, undoCallback: () => void) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    const action: UndoAction = {
      id: String(Date.now()),
      message,
      timestamp: Date.now(),
      undo: undoCallback,
    };
    setUndoAction(action);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoAction(null);
    }, 6000);
  }, []);

  const triggerUndo = useCallback(() => {
    if (undoAction) {
      undoAction.undo();
      setUndoAction(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    }
  }, [undoAction]);

  const dismissUndo = useCallback(() => {
    setUndoAction(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  }, []);

  // CRUD operations
  const addRecord = useCallback(
    (record: BabyRecord, successMessage = 'Registro salvo') => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setTimeout(() => {
        isSavingRef.current = false;
      }, 400);

      // Ensure every record has a 24h time and hasSpecificTime is true
      const normalizedRecord: BabyRecord =
        record.type === 'sono'
          ? record
          : {
              ...record,
              hasSpecificTime: true,
              time: record.time || getCurrentTimeString(),
            };

      const previousRecords = [...records];
      const nextRecords = [normalizedRecord, ...records];
      setRecords(nextRecords);
      saveRecordsToStorage(nextRecords);

      if (effectiveSyncId) {
        saveRecordToCloud(effectiveSyncId, normalizedRecord).catch((e) => console.warn(e));
      }

      showUndo(successMessage, () => {
        setRecords(previousRecords);
        saveRecordsToStorage(previousRecords);
        if (effectiveSyncId) {
          deleteRecordFromCloud(effectiveSyncId, normalizedRecord.id).catch((e) => console.warn(e));
        }
      });
    },
    [records, effectiveSyncId, showUndo]
  );

  const addRecordsBatch = useCallback(
    (newRecords: BabyRecord[], successMessage = 'Registros salvos') => {
      if (newRecords.length === 0) return;

      const normalizedBatch: BabyRecord[] = newRecords.map((record) =>
        record.type === 'sono'
          ? record
          : {
              ...record,
              hasSpecificTime: true,
              time: record.time || getCurrentTimeString(),
            }
      );

      const previousRecords = [...records];
      const nextRecords = [...normalizedBatch, ...records];
      setRecords(nextRecords);
      saveRecordsToStorage(nextRecords);

      if (effectiveSyncId) {
        syncLocalRecordsToCloud(effectiveSyncId, normalizedBatch).catch((e) => console.warn(e));
      }

      showUndo(successMessage, () => {
        setRecords(previousRecords);
        saveRecordsToStorage(previousRecords);
        if (effectiveSyncId) {
          normalizedBatch.forEach((rec) => {
            deleteRecordFromCloud(effectiveSyncId, rec.id).catch((e) => console.warn(e));
          });
        }
      });
    },
    [records, effectiveSyncId, showUndo]
  );

  const updateRecord = useCallback(
    (updated: BabyRecord, successMessage = 'Registro atualizado') => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setTimeout(() => {
        isSavingRef.current = false;
      }, 400);

      const normalizedUpdated: BabyRecord =
        updated.type === 'sono'
          ? updated
          : {
              ...updated,
              hasSpecificTime: true,
              time: updated.time || getCurrentTimeString(),
            };

      const previousRecords = [...records];
      const originalRecord = records.find((r) => r.id === normalizedUpdated.id);
      const nextRecords = records.map((r) => (r.id === normalizedUpdated.id ? normalizedUpdated : r));
      setRecords(nextRecords);
      saveRecordsToStorage(nextRecords);

      if (effectiveSyncId) {
        saveRecordToCloud(effectiveSyncId, normalizedUpdated).catch((e) => console.warn(e));
      }

      // If this record was in viewing, update viewing
      if (viewingRecord && viewingRecord.id === normalizedUpdated.id) {
        setViewingRecord(normalizedUpdated);
      }

      showUndo(successMessage, () => {
        setRecords(previousRecords);
        saveRecordsToStorage(previousRecords);
        if (effectiveSyncId && originalRecord) {
          saveRecordToCloud(effectiveSyncId, originalRecord).catch((e) => console.warn(e));
        }
      });
    },
    [records, viewingRecord, effectiveSyncId, showUndo]
  );

  const deleteRecord = useCallback(
    (id: string, successMessage = 'Registro removido') => {
      const targetRecord = records.find((r) => r.id === id);
      if (!targetRecord) return;

      const previousRecords = [...records];
      const nextRecords = records.filter((r) => r.id !== id);
      setRecords(nextRecords);
      saveRecordsToStorage(nextRecords);

      if (effectiveSyncId) {
        deleteRecordFromCloud(effectiveSyncId, id).catch((e) => console.warn(e));
      }

      if (viewingRecord && viewingRecord.id === id) {
        setViewingRecord(null);
      }

      showUndo(successMessage, () => {
        setRecords(previousRecords);
        saveRecordsToStorage(previousRecords);
        if (effectiveSyncId) {
          saveRecordToCloud(effectiveSyncId, targetRecord).catch((e) => console.warn(e));
        }
      });
    },
    [records, viewingRecord, effectiveSyncId, showUndo]
  );

  const toggleFavoriteNote = useCallback(
    (id: string) => {
      const target = records.find((r) => r.id === id);
      if (!target || target.type !== 'nota') return;

      const updated: NoteRecord = {
        ...target,
        isFavorite: !target.isFavorite,
      };
      const nextRecords = records.map((r) => (r.id === id ? updated : r));
      setRecords(nextRecords);
      saveRecordsToStorage(nextRecords);

      if (effectiveSyncId) {
        saveRecordToCloud(effectiveSyncId, updated).catch((e) => console.warn(e));
      }

      if (viewingRecord && viewingRecord.id === id) {
        setViewingRecord(updated);
      }
    },
    [records, viewingRecord, effectiveSyncId]
  );

  // Sleep session workflow
  const startSleepSession = useCallback(
    (startDate = getTodayDateString(), startTime = getCurrentTimeString()) => {
      const newSession: ActiveSleepSession = {
        id: `sleep-session-${Date.now()}`,
        startDate,
        startTime,
        startedAtTimestamp: Date.now(),
      };
      setActiveSleep(newSession);
      saveActiveSleepToStorage(newSession);

      if (effectiveSyncId) {
        updateActiveSleepInCloud(effectiveSyncId, newSession).catch((e) => console.warn(e));
      }
    },
    [effectiveSyncId]
  );

  const finishSleepSession = useCallback(
    (endDate = getTodayDateString(), endTime = getCurrentTimeString()) => {
      if (!activeSleep) return;

      const durationMinutes = calculateSleepDuration(
        activeSleep.startDate,
        activeSleep.startTime,
        endDate,
        endTime
      );

      const newSleepRecord: SleepRecord = {
        id: `rec-sleep-${Date.now()}`,
        type: 'sono',
        startDate: activeSleep.startDate,
        startTime: activeSleep.startTime,
        endDate,
        endTime,
        durationMinutes: Math.max(0, durationMinutes),
        createdAt: Date.now(),
      };

      const previousRecords = [...records];
      const previousActive = activeSleep;

      setActiveSleep(null);
      saveActiveSleepToStorage(null);

      const nextRecords = [newSleepRecord, ...records];
      setRecords(nextRecords);
      saveRecordsToStorage(nextRecords);

      if (effectiveSyncId) {
        updateActiveSleepInCloud(effectiveSyncId, null).catch((e) => console.warn(e));
        saveRecordToCloud(effectiveSyncId, newSleepRecord).catch((e) => console.warn(e));
      }

      showUndo('Sono registrado', () => {
        setActiveSleep(previousActive);
        saveActiveSleepToStorage(previousActive);
        setRecords(previousRecords);
        saveRecordsToStorage(previousRecords);
        if (effectiveSyncId) {
          updateActiveSleepInCloud(effectiveSyncId, previousActive).catch((e) => console.warn(e));
          deleteRecordFromCloud(effectiveSyncId, newSleepRecord.id).catch((e) => console.warn(e));
        }
      });
    },
    [activeSleep, records, effectiveSyncId, showUndo]
  );

  const cancelSleepSession = useCallback(() => {
    if (!activeSleep) return;
    const previous = activeSleep;
    setActiveSleep(null);
    saveActiveSleepToStorage(null);

    if (effectiveSyncId) {
      updateActiveSleepInCloud(effectiveSyncId, null).catch((e) => console.warn(e));
    }

    showUndo('Sessão de sono cancelada', () => {
      setActiveSleep(previous);
      saveActiveSleepToStorage(previous);
      if (effectiveSyncId) {
        updateActiveSleepInCloud(effectiveSyncId, previous).catch((e) => console.warn(e));
      }
    });
  }, [activeSleep, effectiveSyncId, showUndo]);

  // Auth & Family Account handlers
  const loginEmail = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const user = await loginWithEmail(email, pass);
        setAuthUser(user);
        setIsCloudConnected(true);

        // Instantly hydrate full cloud data to state and storage safely
        const res = await fetchFullDiaryData(user.uid);
        if (res.success) {
          applyCloudData(res.diaryData, res.records, user.uid);
        }

        return { success: true };
      } catch (err: unknown) {
        const anyErr = err as { code?: string; message?: string };
        const msg = getFriendlyAuthErrorMessage(anyErr?.code || anyErr?.message || '');
        setSyncError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [applyCloudData]
  );

  const registerEmail = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const user = await registerWithEmail(email, pass);
        setAuthUser(user);
        setIsCloudConnected(true);
        await initializeDiaryInFirestore(
          user.uid,
          profile,
          records,
          activeSleep,
          growthRecords,
          dayColors
        );
        if (growthRecords.length > 0) {
          const now = Date.now();
          saveGrowthUpdatedAtToStorage(now);
          lastPushedGrowthRef.current = { ts: now, at: now };
        }
        return { success: true };
      } catch (err: unknown) {
        const anyErr = err as { code?: string; message?: string };
        const msg = getFriendlyAuthErrorMessage(anyErr?.code || anyErr?.message || '');
        setSyncError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [profile, records, activeSleep, growthRecords, dayColors]
  );

  const loginGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const user = await loginWithGoogle();
      setAuthUser(user);
      setIsCloudConnected(true);

      const res = await fetchFullDiaryData(user.uid);
      if (res.success) {
        applyCloudData(res.diaryData, res.records, user.uid);
      }

      return { success: true };
    } catch (err: unknown) {
      const anyErr = err as { code?: string; message?: string };
      const msg = getFriendlyAuthErrorMessage(anyErr?.code || anyErr?.message || '');
      setSyncError(msg);
      return { success: false, error: msg };
    } finally {
      setIsSyncing(false);
    }
  }, [applyCloudData]);

  // Manual refresh / pull to refresh handler
  const refreshData = useCallback(async (): Promise<boolean> => {
    setIsManualRefreshing(true);
    setSyncError(null);
    try {
      await testConnection();
      if (effectiveSyncId) {
        const res = await fetchFullDiaryData(effectiveSyncId);
        if (res.success) {
          applyCloudData(res.diaryData, res.records, effectiveSyncId);
        }
      }
      setIsCloudConnected(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {
          // Ignore
        }
      }
      return true;
    } catch (err) {
      console.warn('Manual refresh error:', err);
      setSyncError('Não foi possível atualizar agora. Verifique a internet.');
      return false;
    } finally {
      setIsManualRefreshing(false);
    }
  }, [effectiveSyncId, applyCloudData]);

  // Set day alert color (amarelo / vermelho / null)
  const setDayColor = useCallback(
    (dateStr: string, color: DayAlertColor | null) => {
      setDayColors((prev) => {
        const next = { ...prev };
        if (color) {
          next[dateStr] = color;
        } else {
          delete next[dateStr];
        }
        saveDayColorsToStorage(next);
        if (effectiveSyncId) {
          updateDayColorInCloud(effectiveSyncId, dateStr, color).catch((e) =>
            console.warn('Error saving day color to cloud:', e)
          );
        }
        return next;
      });
    },
    [effectiveSyncId]
  );

  // Baby Growth Measurements CRUD (Peso e Altura)
  const commitGrowthRecords = useCallback(
    (next: GrowthRecord[]) => {
      const sorted = sortGrowthRecordsAsc(next);
      const ts = Date.now();
      growthRecordsRef.current = sorted;
      setGrowthRecords(sorted);
      saveGrowthRecordsToStorage(sorted);
      saveGrowthUpdatedAtToStorage(ts);
      if (effectiveSyncId) {
        lastPushedGrowthRef.current = { ts, at: Date.now() };
        updateGrowthRecordsInCloud(effectiveSyncId, sorted, ts).catch((e) =>
          console.error('Error syncing growth records to cloud:', e)
        );
      }
    },
    [effectiveSyncId]
  );

  const addGrowthRecord = useCallback(
    (entry: GrowthRecord) => {
      const next = [...growthRecordsRef.current, entry];
      commitGrowthRecords(next);

      showUndo('Medição de peso e altura salva', () => {
        const reverted = growthRecordsRef.current.filter((item) => item.id !== entry.id);
        commitGrowthRecords(reverted);
      });
    },
    [commitGrowthRecords, showUndo]
  );

  const updateGrowthRecord = useCallback(
    (updated: GrowthRecord) => {
      const previous = growthRecordsRef.current.find((item) => item.id === updated.id);
      const next = growthRecordsRef.current.map((item) =>
        item.id === updated.id ? updated : item
      );
      commitGrowthRecords(next);

      if (previous) {
        const snapshot = previous;
        showUndo('Medição atualizada', () => {
          const reverted = growthRecordsRef.current.map((item) =>
            item.id === snapshot.id ? snapshot : item
          );
          commitGrowthRecords(reverted);
        });
      }
    },
    [commitGrowthRecords, showUndo]
  );

  const deleteGrowthRecord = useCallback(
    (id: string) => {
      const removed = growthRecordsRef.current.find((item) => item.id === id);
      const next = growthRecordsRef.current.filter((item) => item.id !== id);
      commitGrowthRecords(next);

      if (removed) {
        const restored = removed;
        showUndo('Medição removida', () => {
          const reverted = [...growthRecordsRef.current, restored];
          commitGrowthRecords(reverted);
        });
      }
    },
    [commitGrowthRecords, showUndo]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
      setAuthUser(null);
      setIsCloudConnected(false);
      setRecords([]);
      saveRecordsToStorage([]);
      growthRecordsRef.current = [];
      setGrowthRecords([]);
      saveGrowthRecordsToStorage([]);
      saveGrowthUpdatedAtToStorage(0);
      setDayColors({});
      saveDayColorsToStorage({});
    } catch (err) {
      console.warn('Logout warning:', err);
    }
  }, []);

  const resetUserPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await resetPassword(email);
        return { success: true };
      } catch (err: unknown) {
        const anyErr = err as { code?: string; message?: string };
        const msg = getFriendlyAuthErrorMessage(anyErr?.code || anyErr?.message || '');
        return { success: false, error: msg };
      }
    },
    []
  );

  // Family Code Actions (legacy and code sharing)
  const createOrShareFamilyCode = useCallback(async (): Promise<string> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const code = familyCode || generateRandomFamilyCode();
      await initializeDiaryInFirestore(
        code,
        profile,
        records,
        activeSleep,
        growthRecords,
        dayColors
      );
      if (growthRecords.length > 0) {
        const now = Date.now();
        saveGrowthUpdatedAtToStorage(now);
        lastPushedGrowthRef.current = { ts: now, at: now };
      }
      setFamilyCode(code);
      saveFamilyCodeToStorage(code);
      setIsCloudConnected(true);
      return code;
    } catch (e) {
      setSyncError('Falha ao registrar código na nuvem');
      throw e;
    } finally {
      setIsSyncing(false);
    }
  }, [familyCode, profile, records, activeSleep, growthRecords, dayColors]);

  const joinFamilyCode = useCallback(
    async (rawCode: string): Promise<{ success: boolean; message?: string }> => {
      const norm = normalizeFamilyCode(rawCode);
      if (!norm || norm.length < 4) {
        return {
          success: false,
          message: 'Digite um código válido com pelo menos 4 caracteres.',
        };
      }
      setIsSyncing(true);
      setSyncError(null);
      try {
        const diary = await fetchDiaryByCode(norm);
        if (!diary) {
          return {
            success: false,
            message: 'Código não encontrado. Verifique se o código foi digitado corretamente.',
          };
        }
        setFamilyCode(norm);
        saveFamilyCodeToStorage(norm);
        if (diary.babyProfile) {
          setProfile(diary.babyProfile);
          saveProfileToStorage(diary.babyProfile);
        }
        if (diary.activeSleep !== undefined) {
          setActiveSleep(diary.activeSleep);
          saveActiveSleepToStorage(diary.activeSleep);
        }
        if (diary.dayColors !== undefined) {
          setDayColors(diary.dayColors || {});
          saveDayColorsToStorage(diary.dayColors || {});
        }
        reconcileGrowthRecords(diary, norm);
        setIsCloudConnected(true);
        return { success: true };
      } catch (e) {
        setSyncError('Erro de conexão com o banco de dados');
        return {
          success: false,
          message: 'Falha ao conectar. Verifique sua conexão com a internet.',
        };
      } finally {
        setIsSyncing(false);
      }
    },
    [reconcileGrowthRecords]
  );

  const disconnectFamilyCode = useCallback(() => {
    setFamilyCode(null);
    saveFamilyCodeToStorage(null);
    if (!authUser) {
      setIsCloudConnected(false);
    }
  }, [authUser]);

  // Calendar dropdown controls
  const toggleCalendarDropdown = useCallback(() => {
    setIsCalendarDropdownOpen((prev) => !prev);
  }, []);

  const closeCalendarDropdown = useCallback(() => {
    setIsCalendarDropdownOpen(false);
  }, []);

  const resetToToday = useCallback(() => {
    setSelectedDate(getTodayDateString());
    setIsCalendarDropdownOpen(false);
  }, []);

  const jumpToDate = useCallback((date: string) => {
    setSelectedDate(date);
    setCurrentTab('calendario');
  }, []);

  // Filter records for selectedDate (including cross-midnight sleep!)
  const recordsForSelectedDate = useMemo(() => {
    return records.filter((r) => {
      if (r.type === 'sono') {
        return selectedDate >= r.startDate && selectedDate <= r.endDate;
      }
      return r.date === selectedDate;
    });
  }, [records, selectedDate]);

  // Calculate total sleep minutes in selectedDate
  const totalSleepMinutesForSelectedDate = useMemo(() => {
    return records.reduce((acc, r) => {
      if (r.type === 'sono') {
        return acc + getSleepMinutesForDate(r, selectedDate);
      }
      return acc;
    }, 0);
  }, [records, selectedDate]);

  // Summaries for Hoje: Last feeding and Last diaper
  const todayDate = getTodayDateString();
  const lastFeeding = useMemo(() => {
    // Find all feedings (peito, mamadeira)
    const feedings = records.filter((r) => r.type === 'peito' || r.type === 'mamadeira');
    if (feedings.length === 0) return null;

    // Sort by date desc, then by time or createdAt
    const sorted = [...feedings].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      if (a.hasSpecificTime && b.hasSpecificTime && a.time && b.time) {
        return b.time.localeCompare(a.time);
      }
      if (a.hasSpecificTime) return -1;
      if (b.hasSpecificTime) return 1;
      return b.createdAt - a.createdAt;
    });

    const latest = sorted[0];
    let timeLabel = '';
    if (latest.date === todayDate) {
      timeLabel = latest.hasSpecificTime && latest.time ? `às ${latest.time.replace(':', 'h')}` : 'Hoje · sem horário';
    } else {
      const [y, m, d] = latest.date.split('-');
      timeLabel = latest.hasSpecificTime && latest.time ? `${d}/${m} às ${latest.time.replace(':', 'h')}` : `${d}/${m} · sem horário`;
    }

    if (latest.type === 'peito') {
      const sideText =
        latest.side === 'esquerdo'
          ? 'Esquerdo'
          : latest.side === 'direito'
          ? 'Direito'
          : 'Ambos os peitos';
      return {
        text: `Peito · ${sideText} ${timeLabel}`,
        record: latest,
      };
    } else {
      const volText = latest.volumeMl !== null ? `${latest.volumeMl} ml` : 'Sem volume';
      return {
        text: `Mamadeira · ${volText} ${timeLabel}`,
        record: latest,
      };
    }
  }, [records, todayDate]);

  const lastDiaper = useMemo(() => {
    const diapers = records.filter((r) => r.type === 'fralda');
    if (diapers.length === 0) return null;

    const sorted = [...diapers].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      if (a.hasSpecificTime && b.hasSpecificTime && a.time && b.time) {
        return b.time.localeCompare(a.time);
      }
      if (a.hasSpecificTime) return -1;
      if (b.hasSpecificTime) return 1;
      return b.createdAt - a.createdAt;
    });

    const latest = sorted[0];
    let typeName = 'Troca';
    if (latest.type === 'fralda') {
      if (latest.diaperType === 'xixi') typeName = 'Xixi';
      else if (latest.diaperType === 'coco') typeName = 'Cocô';
      else if (latest.diaperType === 'ambos') typeName = 'Xixi e Cocô';
    }

    let timeLabel = '';
    if (latest.date === todayDate) {
      timeLabel = latest.hasSpecificTime && latest.time ? `às ${latest.time.replace(':', 'h')}` : 'Hoje · sem horário';
    } else {
      const [y, m, d] = latest.date.split('-');
      timeLabel = latest.hasSpecificTime && latest.time ? `${d}/${m} às ${latest.time.replace(':', 'h')}` : `${d}/${m} · sem horário`;
    }

    return {
      text: `${typeName} ${timeLabel}`,
      record: latest,
    };
  }, [records, todayDate]);

  const openSheet = useCallback(
    (sheet: 'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota' | 'edit' | 'sono_anterior' | 'profile' | 'sync' | 'esquecido' | 'calendario_registrar') => {
      setActiveSheet(sheet);
    },
    []
  );

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  return (
    <BabyContext.Provider
      value={{
        profile,
        updateProfile,
        records,
        activeSleep,
        selectedDate,
        setSelectedDate,
        resetToToday,
        currentTab,
        setCurrentTab,
        undoAction,
        triggerUndo,
        dismissUndo,
        themeMode,
        effectiveTheme,
        setThemeMode,
        isCalendarDropdownOpen,
        toggleCalendarDropdown,
        closeCalendarDropdown,
        activeSheet,
        openSheet,
        closeSheet,
        editingRecord,
        setEditingRecord,
        viewingRecord,
        setViewingRecord,
        addRecord,
        addRecordsBatch,
        updateRecord,
        deleteRecord,
        toggleFavoriteNote,
        startSleepSession,
        finishSleepSession,
        cancelSleepSession,
        recordsForSelectedDate,
        totalSleepMinutesForSelectedDate,
        lastFeeding,
        lastDiaper,
        jumpToDate,
        authUser,
        isAuthLoading,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
        resetUserPassword,
        familyCode,
        isCloudConnected,
        isSyncing,
        syncError,
        createOrShareFamilyCode,
        joinFamilyCode,
        disconnectFamilyCode,
        refreshData,
        isManualRefreshing,
        dayColors,
        setDayColor,
        growthRecords,
        addGrowthRecord,
        updateGrowthRecord,
        deleteGrowthRecord,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBaby must be used within a BabyProvider');
  }
  return context;
}
