export interface Accident {
  id: string;
  date: Date;
  year: number;
  month: number;
  dayOfWeek: number; // 0-6
  time: string;
  hour: number;
  period: 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';
  re: string;
  employee: string;
  division: string;
  manager: string;
  area: string;
  type: string;
  lostDays: number;
  partAffected: string;
  experienceYears: number;
  experienceMonths: number;
  unsafeAct: boolean;
  machineDeficiency: boolean;
  functionDeviation: boolean;
  hadTraining: boolean;
  usedEPI: boolean;
  investigationLink?: string;
  role: string;
}

export interface MonthlyStats {
  month: number;
  count: number;
}

export interface YearStats {
  year: number;
  total: number;
  totalLostDays: number;
  monthly: MonthlyStats[];
  avgPerMonth: number;
  vsPrevious?: number;
}

export interface Insight {
  title: string;
  text: string;
  type: 'danger' | 'warning' | 'info' | 'success';
}

export interface GroupSafetyRecord {
  name: string;
  days: number;
  lastDate: Date | null;
  neverHad: boolean;
  totalAccidents: number;
  lastAccident?: Accident;
}

