export interface Accident {
  id: string;
  date: Date;
  year: number;
  month: number;
  re: string;
  employee: string;
  division: string;
  manager: string;
  area: string;
  type: string;
  lostDays: number;
  partAffected: string;
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
