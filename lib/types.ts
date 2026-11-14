export type RecordType = 'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota';

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'menina' | 'menino' | 'neutro';
  notes?: string;
}

export interface BreastfeedingRecord {
  id: string;
  type: 'peito';
  date: string; // YYYY-MM-DD
  hasSpecificTime: boolean;
  time?: string; // HH:mm
  side: 'esquerdo' | 'direito' | 'ambos';
  createdAt: number;
  notes?: string;
}

export interface BottleRecord {
  id: string;
  type: 'mamadeira';
  date: string; // YYYY-MM-DD
  hasSpecificTime: boolean;
  time?: string; // HH:mm
  volumeMl: number | null; // null represents "sem volume" (unmeasured), 0..350 represents registered volume
  createdAt: number;
  notes?: string;
}

export interface SleepRecord {
  id: string;
  type: 'sono';
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  durationMinutes: number;
  createdAt: number;
  notes?: string;
}

export interface DiaperRecord {
  id: string;
  type: 'fralda';
  date: string; // YYYY-MM-DD
  hasSpecificTime: boolean;
  time?: string; // HH:mm
  diaperType: 'xixi' | 'coco' | 'ambos';
  createdAt: number;
  notes?: string;
}

export interface NoteRecord {
  id: string;
  type: 'nota';
  date: string; // YYYY-MM-DD
  hasSpecificTime: boolean;
  time?: string; // HH:mm
  content: string;
  isFavorite: boolean;
  createdAt: number;
}

export type BabyRecord =
  | BreastfeedingRecord
  | BottleRecord
  | SleepRecord
  | DiaperRecord
  | NoteRecord;

export interface ActiveSleepSession {
  id: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  startedAtTimestamp: number;
}

export interface UndoAction {
  id: string;
  message: string;
  timestamp: number;
  undo: () => void;
}

export type TabType = 'hoje' | 'calendario' | 'buscar';

export type DayAlertColor = 'amarelo' | 'vermelho';
export type DayColorsMap = Record<string, DayAlertColor>;
