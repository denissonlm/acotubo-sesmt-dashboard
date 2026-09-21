import { createClient } from '@supabase/supabase-js';
import type { Accident } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qpvdwrrfqpqgcpsawlrw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdmR3cnJmcXBxZ2Nwc2F3bHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDc4MTEsImV4cCI6MjEwNTU4MzgxMX0.1S4J6bvAn_t7VSntrdAnt_JVUzLR3dSWRlyiZOuyGus';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Converte um registro do banco de dados (snake_case) para a interface do frontend (camelCase)
 */
export const mapRowToAccident = (row: any): Accident => {
  const dateObj = row.date ? new Date(row.date + 'T12:00:00') : new Date();
  return {
    id: row.rim_ram || row.external_id || row.id,
    date: dateObj,
    year: row.year || dateObj.getFullYear(),
    month: row.month || (dateObj.getMonth() + 1),
    dayOfWeek: row.day_of_week ?? dateObj.getDay(),
    time: row.time || '00:00',
    hour: row.hour ?? 0,
    period: (row.period as 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada') || 'Madrugada',
    re: String(row.re || ''),
    employee: row.employee || 'Não informado',
    division: row.division || 'Geral',
    manager: row.manager || 'Não informado',
    area: row.area || 'Operacional',
    type: row.type || '',
    lostDays: Number(row.lost_days || 0),
    partAffected: row.part_affected || '',
    experienceYears: Number(row.experience_years || 0),
    experienceMonths: Number(row.experience_months || 0),
    unsafeAct: Boolean(row.unsafe_act),
    machineDeficiency: Boolean(row.machine_deficiency),
    functionDeviation: Boolean(row.function_deviation),
    hadTraining: Boolean(row.had_training),
    usedEPI: Boolean(row.used_epi),
    investigationLink: row.investigation_link || '',
    role: row.role || 'N/A',
    cat: row.cat || '',
    hasCat: Boolean(row.has_cat)
  };
};

/**
 * Converte um objeto Accident (camelCase) para inserção no banco de dados (snake_case)
 */
export const mapAccidentToRow = (a: Accident) => {
  const dateStr = a.date instanceof Date && !isNaN(a.date.getTime())
    ? a.date.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Gera chave única para evitar duplicações em re-uploads da mesma planilha
  const safeId = a.id ? a.id.trim() : '0';
  const safeRe = a.re ? a.re.trim() : '0';
  const external_id = `${safeRe}_${dateStr}_${safeId}`;

  return {
    external_id,
    rim_ram: a.id,
    date: dateStr,
    year: a.year || new Date(dateStr).getFullYear(),
    month: a.month || (new Date(dateStr).getMonth() + 1),
    day_of_week: a.dayOfWeek ?? 0,
    time: a.time || '00:00',
    hour: a.hour ?? 0,
    period: a.period || 'Madrugada',
    re: a.re || '',
    employee: a.employee || '',
    division: a.division || '',
    manager: a.manager || '',
    area: a.area || '',
    type: a.type || '',
    lost_days: a.lostDays || 0,
    part_affected: a.partAffected || '',
    experience_years: a.experienceYears || 0,
    experience_months: a.experienceMonths || 0,
    unsafe_act: a.unsafeAct,
    machine_deficiency: a.machineDeficiency,
    function_deviation: a.functionDeviation,
    had_training: a.hadTraining,
    used_epi: a.usedEPI,
    investigation_link: a.investigationLink || '',
    role: a.role || 'N/A',
    cat: a.cat || '',
    has_cat: a.hasCat,
    updated_at: new Date().toISOString()
  };
};

/**
 * Busca todos os acidentes cadastrados no Supabase
 */
export const fetchAccidentsFromSupabase = async (): Promise<{ data: Accident[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('accidents')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar dados do Supabase:', error.message);
      return { data: [], error: error.message };
    }

    const mapped = (data || []).map(mapRowToAccident);
    return { data: mapped };
  } catch (err: any) {
    console.warn('Exceção ao conectar com Supabase:', err);
    return { data: [], error: err.message || 'Erro de conexão' };
  }
};

/**
 * Envia uma lista de acidentes para o Supabase em lotes (batch upsert)
 */
export const upsertAccidentsToSupabase = async (
  accidents: Accident[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    if (!accidents || accidents.length === 0) {
      return { success: true, count: 0 };
    }

    const rows = accidents.map(mapAccidentToRow);
    const CHUNK_SIZE = 100;
    let processed = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('accidents')
        .upsert(chunk, { onConflict: 'external_id' });

      if (error) {
        throw error;
      }

      processed += chunk.length;
      if (onProgress) {
        onProgress(processed, rows.length);
      }
    }

    return { success: true, count: processed };
  } catch (err: any) {
    console.error('Erro ao salvar no Supabase:', err);
    return { success: false, count: 0, error: err.message || 'Erro ao persistir dados no Supabase' };
  }
};

/**
 * Verifica se a tabela 'accidents' está pronta e acessível
 */
export const checkSupabaseTableExists = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('accidents')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST205') {
      // Tabela não existe no schema
      return false;
    }
    return !error;
  } catch {
    return false;
  }
};
