import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  BabyProfile,
  BabyRecord,
  ActiveSleepSession,
  DayAlertColor,
  DayColorsMap,
  GrowthRecord,
} from './types';

export interface SharedDiaryData {
  code: string;
  babyProfile?: BabyProfile;
  activeSleep?: ActiveSleepSession | null;
  dayColors?: DayColorsMap;
  growthRecords?: GrowthRecord[];
  growthUpdatedAt?: number;
  updatedAt?: number;
  createdAt?: number;
}

export interface CloudGrowthRecordDoc extends GrowthRecord {
  type: 'crescimento';
}

export function isGrowthRecordDoc(value: unknown): value is CloudGrowthRecordDoc {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'crescimento' &&
    typeof obj.id === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.weightKg === 'number' &&
    typeof obj.heightCm === 'number'
  );
}

export function docToGrowthRecord(docData: CloudGrowthRecordDoc): GrowthRecord {
  const cleanNotes = typeof docData.notes === 'string' ? docData.notes.trim() : '';
  return {
    id: docData.id,
    date: docData.date,
    weightKg: docData.weightKg,
    heightCm: docData.heightCm,
    createdAt: typeof docData.createdAt === 'number' ? docData.createdAt : Date.now(),
    ...(cleanNotes ? { notes: cleanNotes } : {}),
  };
}

export function growthRecordToDoc(entry: GrowthRecord): CloudGrowthRecordDoc {
  const cleanNotes = typeof entry.notes === 'string' ? entry.notes.trim() : '';
  return sanitizeForFirestore({
    id: entry.id,
    type: 'crescimento' as const,
    date: entry.date,
    weightKg: entry.weightKg,
    heightCm: entry.heightCm,
    createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
    ...(cleanNotes ? { notes: cleanNotes } : {}),
  });
}

/**
 * Recursively removes keys with `undefined` values so Firestore setDoc() never
 * rejects a document or array item with "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeForFirestore(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

/**
 * Normalizes diary identifier: preserves Firebase UIDs while standardizing family codes
 */
export function normalizeFamilyCode(raw: string): string {
  const trimmed = raw.trim();
  // If it's a standard random code like BEBE-1234, uppercase it
  if (trimmed.toUpperCase().startsWith('BEBE-')) {
    return trimmed.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }
  // Otherwise preserve case for Firebase Auth UIDs and diary keys
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Uploads all local records to the cloud in batches of 500
 */
export async function syncLocalRecordsToCloud(
  diaryId: string,
  localRecords: BabyRecord[]
): Promise<void> {
  if (localRecords.length === 0) return;
  const norm = normalizeFamilyCode(diaryId);
  const path = `diaries/${norm}/records`;

  try {
    const batch = writeBatch(db);
    localRecords.forEach((rec) => {
      const recRef = doc(db, 'diaries', norm, 'records', rec.id);
      batch.set(recRef, sanitizeForFirestore(rec), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Generates a friendly, memorable 6-character code (e.g. BEBE-7429)
 */
export function generateRandomFamilyCode(prefix = 'BEBE'): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

/**
 * Verifies if a family code exists in Firestore
 */
export async function fetchDiaryByCode(code: string): Promise<SharedDiaryData | null> {
  const norm = normalizeFamilyCode(code);
  const path = `diaries/${norm}`;
  try {
    const snap = await getDoc(doc(db, 'diaries', norm));
    if (snap.exists()) {
      return snap.data() as SharedDiaryData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface FetchFullDiaryResult {
  success: boolean;
  diaryData: SharedDiaryData | null;
  records: BabyRecord[];
  growthRecords: GrowthRecord[];
  error?: string;
}

/**
 * Fetches the entire diary including profile, active sleep, routine records, and growth measurements
 */
export async function fetchFullDiaryData(diaryId: string): Promise<FetchFullDiaryResult> {
  const norm = normalizeFamilyCode(diaryId);
  try {
    const [diarySnap, recordsSnap] = await Promise.all([
      getDoc(doc(db, 'diaries', norm)),
      getDocs(collection(db, 'diaries', norm, 'records')),
    ]);

    const diaryData = diarySnap.exists() ? (diarySnap.data() as SharedDiaryData) : null;
    const records: BabyRecord[] = [];
    const growthRecords: GrowthRecord[] = [];
    recordsSnap.forEach((d) => {
      const data = d.data();
      if (isGrowthRecordDoc(data)) {
        growthRecords.push(docToGrowthRecord(data));
      } else {
        records.push(data as BabyRecord);
      }
    });

    return { success: true, diaryData, records, growthRecords };
  } catch (error) {
    console.warn('Error fetching full diary data:', error);
    return { success: false, diaryData: null, records: [], growthRecords: [], error: String(error) };
  }
}

/**
 * Initializes or updates a diary in Firestore
 */
export async function initializeDiaryInFirestore(
  code: string,
  profile: BabyProfile,
  initialRecords: BabyRecord[],
  activeSleep: ActiveSleepSession | null = null,
  growthRecords: GrowthRecord[] = [],
  dayColors: DayColorsMap = {}
): Promise<void> {
  const norm = normalizeFamilyCode(code);
  const diaryPath = `diaries/${norm}`;

  try {
    const now = Date.now();
    const diaryRef = doc(db, 'diaries', norm);
    const payload = sanitizeForFirestore({
      code: norm,
      babyProfile: profile,
      activeSleep: activeSleep || null,
      dayColors,
      growthRecords,
      growthUpdatedAt: growthRecords.length > 0 ? now : 0,
      updatedAt: now,
      createdAt: now,
    });
    await setDoc(diaryRef, payload, { merge: true });

    // Batch upload initial routine records and growth measurements if any
    if (initialRecords.length > 0 || growthRecords.length > 0) {
      const batch = writeBatch(db);
      initialRecords.forEach((rec) => {
        const recRef = doc(db, 'diaries', norm, 'records', rec.id);
        batch.set(recRef, sanitizeForFirestore(rec));
      });
      growthRecords.forEach((entry) => {
        const growthRef = doc(db, 'diaries', norm, 'records', entry.id);
        batch.set(growthRef, growthRecordToDoc(entry));
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, diaryPath);
  }
}

/**
 * Saves or updates a single record in the cloud
 */
export async function saveRecordToCloud(familyCode: string, record: BabyRecord): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}/records/${record.id}`;
  try {
    await setDoc(doc(db, 'diaries', norm, 'records', record.id), sanitizeForFirestore(record));
    // Also bump updatedAt on diary root
    await setDoc(
      doc(db, 'diaries', norm),
      { updatedAt: Date.now() },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a single record in the cloud
 */
export async function deleteRecordFromCloud(familyCode: string, recordId: string): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}/records/${recordId}`;
  try {
    await deleteDoc(doc(db, 'diaries', norm, 'records', recordId));
    await setDoc(
      doc(db, 'diaries', norm),
      { updatedAt: Date.now() },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves baby profile updates in the cloud
 */
export async function updateProfileInCloud(familyCode: string, profile: BabyProfile): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}`;
  try {
    await setDoc(
      doc(db, 'diaries', norm),
      sanitizeForFirestore({
        babyProfile: profile,
        updatedAt: Date.now(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Updates active sleep session in the cloud
 */
export async function updateActiveSleepInCloud(
  familyCode: string,
  session: ActiveSleepSession | null
): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}`;
  try {
    await setDoc(
      doc(db, 'diaries', norm),
      sanitizeForFirestore({
        activeSleep: session || null,
        updatedAt: Date.now(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Updates a day alert color in the cloud
 */
export async function updateDayColorInCloud(
  familyCode: string,
  dateStr: string,
  color: DayAlertColor | null
): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}`;
  try {
    const diaryRef = doc(db, 'diaries', norm);
    const snap = await getDoc(diaryRef);
    const currentColors: DayColorsMap = (snap.exists() && snap.data().dayColors) || {};
    const nextColors = { ...currentColors };

    if (color) {
      nextColors[dateStr] = color;
    } else {
      delete nextColors[dateStr];
    }

    await setDoc(
      diaryRef,
      sanitizeForFirestore({
        dayColors: nextColors,
        updatedAt: Date.now(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Saves or updates a single growth measurement document in the records subcollection
 */
export async function saveGrowthRecordToCloud(
  familyCode: string,
  entry: GrowthRecord
): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}/records/${entry.id}`;
  try {
    await setDoc(doc(db, 'diaries', norm, 'records', entry.id), growthRecordToDoc(entry));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Batch-uploads unsynced local growth measurements to the records subcollection
 */
export async function syncLocalGrowthRecordsToCloud(
  familyCode: string,
  entries: GrowthRecord[]
): Promise<void> {
  if (entries.length === 0) return;
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}/records`;
  try {
    const batch = writeBatch(db);
    entries.forEach((entry) => {
      const recRef = doc(db, 'diaries', norm, 'records', entry.id);
      batch.set(recRef, growthRecordToDoc(entry), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a single growth measurement document from the records subcollection
 */
export async function deleteGrowthRecordFromCloud(
  familyCode: string,
  growthId: string
): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}/records/${growthId}`;
  try {
    await deleteDoc(doc(db, 'diaries', norm, 'records', growthId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Mirrors baby growth measurements (peso & altura) array on the root diary document
 */
export async function updateGrowthRecordsInCloud(
  familyCode: string,
  growthRecords: GrowthRecord[],
  growthUpdatedAt: number = Date.now()
): Promise<void> {
  const norm = normalizeFamilyCode(familyCode);
  const path = `diaries/${norm}`;
  try {
    const sanitizedRecords = sanitizeForFirestore(growthRecords);
    await setDoc(
      doc(db, 'diaries', norm),
      {
        growthRecords: sanitizedRecords,
        growthUpdatedAt,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribes to real-time updates for a shared diary, its routine records, and its growth measurements
 */
export function subscribeToSharedDiary(
  familyCode: string,
  callbacks: {
    onDiaryData: (data: SharedDiaryData) => void;
    onRecords: (records: BabyRecord[]) => void;
    onGrowthRecords?: (growthRecords: GrowthRecord[]) => void;
    onError?: (err: unknown) => void;
  }
): () => void {
  const norm = normalizeFamilyCode(familyCode);

  // 1. Root diary listener (Profile + ActiveSleep + DayColors)
  const unsubDiary = onSnapshot(
    doc(db, 'diaries', norm),
    (snapshot) => {
      if (snapshot.exists()) {
        callbacks.onDiaryData(snapshot.data() as SharedDiaryData);
      }
    },
    (error) => {
      callbacks.onError?.(error);
      console.warn('Firestore onSnapshot diary listener warning:', error);
    }
  );

  // 2. Records subcollection listener (routine records + growth measurements)
  const unsubRecords = onSnapshot(
    collection(db, 'diaries', norm, 'records'),
    (snapshot) => {
      const recordsList: BabyRecord[] = [];
      const growthList: GrowthRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (isGrowthRecordDoc(data)) {
          growthList.push(docToGrowthRecord(data));
        } else {
          recordsList.push(data as BabyRecord);
        }
      });
      callbacks.onRecords(recordsList);
      callbacks.onGrowthRecords?.(growthList);
    },
    (error) => {
      callbacks.onError?.(error);
      console.warn('Firestore onSnapshot records listener warning:', error);
    }
  );

  return () => {
    unsubDiary();
    unsubRecords();
  };
}
