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
  cat?: string;
  hasCat: boolean;
}

export interface MonthlyStats {
  month: number;
  count: number;
}

export interface YearStats {
  year: number;
  total: number;
  monthly: MonthlyStats[];
  avgPerMonth: number;
  vsPrevious?: number;
}

export interface Insight {
  title: string;
  text: string;
  type: 'danger' | 'warning' | 'info' | 'success';
}

export type OITClassification = 'MUITO BOA' | 'BOA' | 'REGULAR' | 'RUIM' | 'PÉSSIMA';

export interface MonthlyRateRecord {
  month: number;
  monthName: string;
  year: number;
  accidents: number; // N = Número de acidentados
  lostDays: number; // T = Tempo computado (dias de afastamento)
  hht: number; // H = Horas-Homem de exposição ao risco (ex: 1.311.627,54 h)
  previsto: number; // Para compatibilidade
  horasAusencia?: number; // Total de horas de ausência/desvios (ex: 42.016,95 h)
  frequencyRate: number; // F = (N * 1.000.000) / H
  frequencyStatus: OITClassification;
  severityRate: number; // G = (T * 1.000.000) / H
  severityStatus: OITClassification;
}

export interface UnitRateRecord {
  unitName: string;
  hht: number; // H = Horas-Homem de exposição ao risco
  previsto: number; // Para compatibilidade
  horasAusencia?: number;
  accidents: number; // N
  lostDays: number; // T
  frequencyRate: number; // F
  frequencyStatus: OITClassification;
  severityRate: number; // G
  severityStatus: OITClassification;
}

export interface FrequencySeverityOverview {
  totalAccidents: number; // N
  totalLostDays: number; // T
  totalHHT: number; // H = Horas-Homem de exposição ao risco
  totalPrevisto: number;
  totalHorasAusencia?: number;
  overallFrequencyRate: number; // F
  overallFrequencyStatus: OITClassification;
  overallSeverityRate: number; // G
  overallSeverityStatus: OITClassification;
  monthlyRecords: MonthlyRateRecord[];
  unitRecords: UnitRateRecord[];
}

