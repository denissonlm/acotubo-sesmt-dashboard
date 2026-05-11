import * as XLSX from 'xlsx';
import type { Accident, YearStats, MonthlyStats, Insight } from '../types';

export const loadAccidentData = async (filePath: string): Promise<Accident[]> => {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    return parseAccidentData(arrayBuffer);
  } catch (error) {
    console.error('Error loading accident data:', error);
    return [];
  }
};

export const parseAccidentData = (data: ArrayBuffer): Accident[] => {
  try {
    const workbook = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
    const sheetName = 'BD';
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    return jsonData.map((row, index) => {
      const rawDate = row['Data'];
      const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
      const rawTime = row['Hora'];
      let hour = 0;
      let timeStr = '00:00';

      if (rawTime) {
        if (typeof rawTime === 'string') {
          const parts = rawTime.split(':');
          hour = parseInt(parts[0], 10);
          timeStr = rawTime.substring(0, 5);
        } else if (rawTime instanceof Date) {
          hour = rawTime.getHours();
          timeStr = `${String(hour).padStart(2, '0')}:${String(rawTime.getMinutes()).padStart(2, '0')}`;
        } else if (typeof rawTime === 'number') {
          // Excel time is a fraction of a day
          const totalMinutes = Math.round(rawTime * 24 * 60);
          hour = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }

      let period: 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada' = 'Madrugada';
      if (hour >= 6 && hour < 12) period = 'Manhã';
      else if (hour >= 12 && hour < 18) period = 'Tarde';
      else if (hour >= 18 && hour < 24) period = 'Noite';

      return {
        id: row['RIM / RAM'] || `acc-${index}`,
        date,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        dayOfWeek: date.getDay(),
        time: timeStr,
        hour,
        period,
        re: String(row['RE']),
        employee: row['Colaborador / Equipamento'],
        division: row['Divisão'],
        manager: row['Superior Direto'],
        area: row['Área'],
        type: row['Tipo'],
        lostDays: Number(row['Dias Perdidos'] || 0),
        partAffected: row['Parte Atingida'],
        experienceYears: Number(row['Experiência Anos'] || 0),
        experienceMonths: Number(row['Experiência Meses'] || 0),
        unsafeAct: String(row['Ato inseguro?'] || '').toUpperCase() === 'SIM',
        machineDeficiency: String(row['Deficiência de M/E'] || '').toUpperCase() === 'SIM',
        functionDeviation: String(row['Desvio de Função'] || '').toUpperCase() === 'SIM',
        hadTraining: String(row['Havia capacitação?'] || '').toUpperCase() === 'SIM',
        usedEPI: String(row['Utilizava EPI?'] || '').toUpperCase() === 'SIM',
        investigationLink: row['Link'],
        role: (() => {
          const keys = Object.keys(row);
          const roleKey = keys.find(k => {
            const normalized = k.trim().toUpperCase();
            return normalized.includes('CARGO') || normalized.includes('FUNÇÃO') || normalized.includes('FUNCAO');
          });
          return roleKey ? String(row[roleKey]) : 'N/A';
        })()
      };
    }).filter(acc => !isNaN(acc.year));
  } catch (error) {
    console.error('Error parsing accident data:', error);
    return [];
  }
};

export const calculateStats = (accidents: Accident[], targetYears: number[]): Record<number, YearStats> => {
  const stats: Record<number, YearStats> = {};
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  targetYears.forEach(year => {
    const yearAccidents = accidents.filter(a => a.year === year);
    const monthly: MonthlyStats[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: yearAccidents.filter(a => a.month === i + 1).length
    }));

    let monthsToConsider = 12;
    if (year === currentYear) {
      monthsToConsider = currentMonth;
    } else if (year > currentYear) {
      monthsToConsider = 1; // Avoid division by zero
    }

    const total = yearAccidents.length;
    
    stats[year] = {
      year,
      total,
      monthly,
      avgPerMonth: Number((total / monthsToConsider).toFixed(1))
    };
  });
  
  return stats;
};

export const generateInsights = (accidents: Accident[], targetYears: number[]): Insight[] => {
  const insights: Insight[] = [];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  if (accidents.length === 0) {
    return [{
      title: 'Sem Ocorrências',
      text: 'Não foram encontrados registros para os filtros selecionados no triênio.',
      type: 'success'
    }];
  }

  // 1. Pico Histórico
  let maxCount = -1;
  let maxMonth = -1;
  let maxYear = -1;
  
  targetYears.forEach(year => {
    for (let m = 1; m <= 12; m++) {
      const count = accidents.filter(a => a.year === year && a.month === m).length;
      if (count > maxCount) {
        maxCount = count;
        maxMonth = m;
        maxYear = year;
      }
    }
  });

  if (maxCount > 0) {
    insights.push({
      title: `${monthNames[maxMonth - 1]}/${maxYear} - Pico Histórico`,
      text: `${maxCount} acidentes em um único mês representa o maior volume identificado neste cenário filtrado.`,
      type: 'danger'
    });
  }

  // 2. Evolução Histórica (Comparativo 2024-2025 ou anos base)
  const sortedYearsAsc = [...targetYears].sort((a: number, b: number) => a - b);
  if (sortedYearsAsc.length >= 2) {
    const year1 = sortedYearsAsc[0];
    const year2 = sortedYearsAsc[1];
    
    const count1 = accidents.filter(a => a.year === year1).length;
    const count2 = accidents.filter(a => a.year === year2).length;
    
    if (count1 > 0 && count2 < count1) {
      const dropPercent = Math.round(((count1 - count2) / count1) * 100);
      insights.push({
        title: `Evolução Positiva ${year1}-${year2}`,
        text: `Houve uma redução substancial de ${dropPercent}% no volume de acidentes (de ${count1} para ${count2} ocorrências) entre ${year1} e ${year2}, refletindo a maturação e efetividade das campanhas preventivas adotadas.`,
        type: 'success'
      });
    } else if (count2 > count1 && count1 > 0) {
      const incPercent = Math.round(((count2 - count1) / count1) * 100);
      insights.push({
        title: `Alerta de Crescimento ${year1}-${year2}`,
        text: `Houve um aumento de ${incPercent}% nas ocorrências (de ${count1} para ${count2}) entre ${year1} e ${year2}, indicando a necessidade de revisão nas estratégias de contenção de riscos.`,
        type: 'warning'
      });
    } else if (count1 > 0) {
      insights.push({
        title: `Estabilidade ${year1}-${year2}`,
        text: `O número de acidentes manteve-se constante entre ${year1} e ${year2}, com ${count1} ocorrências registradas em ambos os anos.`,
        type: 'info'
      });
    }
  }

  // 3. Tendência Recente (Último ano vs Anterior)
  const sortedYears = [...targetYears].sort((a: number, b: number) => b - a);
  if (sortedYears.length >= 2) {
    const lastYear = sortedYears[0];
    const prevYear = sortedYears[1];
    const lastTotal = accidents.filter(a => a.year === lastYear).length;
    const prevTotal = accidents.filter(a => a.year === prevYear).length;
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    let lastTotalProjected = lastTotal;
    let isProjected = false;

    if (lastYear === currentYear && currentMonth < 12 && currentMonth > 0) {
      const avgPerMonth = lastTotal / currentMonth;
      lastTotalProjected = Math.round(avgPerMonth * 12);
      isProjected = true;
    }

    if (lastTotalProjected < prevTotal && lastTotal > 0) {
      insights.push({
        title: `Tendência de Queda em ${lastYear}`,
        text: isProjected 
          ? `Projeção de ${lastTotalProjected} ocorrências até o fim do ano (vs ${prevTotal} em ${prevYear}). O ritmo atual indica melhora.`
          : `Redução de ${prevTotal - lastTotal} ocorrências em relação a ${prevYear}. As medidas de prevenção estão surtindo efeito.`,
        type: 'success'
      });
    } else if (lastTotalProjected > prevTotal) {
      insights.push({
        title: `Alerta de Elevação em ${lastYear}`,
        text: isProjected
          ? `Projeção de ${lastTotalProjected} acidentes até o final do ano (vs ${prevTotal} em ${prevYear}). Recomendado intervenção para reverter a tendência.`
          : `Houve um aumento de ${lastTotal - prevTotal} acidentes comparado a ${prevYear}. Recomendado intensificar inspeções de campo.`,
        type: 'danger'
      });
    }
  }

  // 4. Insight de Área/Unidade se houver predominância
  const areas = [...new Set(accidents.map(a => a.area))];
  if (areas.length > 1) {
    const areaCounts = areas.map(area => ({
      area,
      count: accidents.filter(a => a.area === area).length
    })).sort((a: any, b: any) => b.count - a.count);
    
    if (areaCounts[0].count > accidents.length * 0.4) {
      insights.push({
        title: `Foco Crítico: ${areaCounts[0].area}`,
        text: `Esta área representa ${Math.round((areaCounts[0].count / accidents.length) * 100)}% das ocorrências filtradas. Necessária atenção direcionada.`,
        type: 'info'
      });
    }
  }

  return insights.slice(0, 3); // Return top 3 insights
};

export const calculateTemporalStats = (accidents: Accident[]) => {
  const dayOfWeekStats = Array(7).fill(0).map((_, i) => ({
    day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i],
    count: accidents.filter((a: Accident) => a.dayOfWeek === i).length
  }));

  const periodStats = [
    { period: 'Madrugada', count: accidents.filter((a: Accident) => a.period === 'Madrugada').length, color: '#1E293B' },
    { period: 'Manhã', count: accidents.filter((a: Accident) => a.period === 'Manhã').length, color: '#F59E0B' },
    { period: 'Tarde', count: accidents.filter((a: Accident) => a.period === 'Tarde').length, color: '#EA580C' },
    { period: 'Noite', count: accidents.filter((a: Accident) => a.period === 'Noite').length, color: '#4338CA' }
  ];

  const hourlyStats = Array(24).fill(0).map((_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: accidents.filter((a: Accident) => a.hour === i).length
  }));

  return { dayOfWeekStats, periodStats, hourlyStats };
};

export const generateTemporalInsights = (accidents: Accident[]): Insight[] => {
  const insights: Insight[] = [];
  const { dayOfWeekStats, periodStats, hourlyStats } = calculateTemporalStats(accidents);
  
  if (accidents.length === 0) return [];

  // 1. Dia Crítico
  const peakDay = [...dayOfWeekStats].sort((a, b) => b.count - a.count)[0];
  if (peakDay.count > 0) {
    insights.push({
      title: `${peakDay.day} - Alerta de Frequência`,
      text: `Identificamos uma concentração de ${peakDay.count} ocorrências às ${peakDay.day}s. Sugerimos reforçar os diálogos de segurança (DDS) no início desta jornada.`,
      type: 'danger'
    });
  }

  // 2. Horário de Pico
  const peakHour = [...hourlyStats].sort((a, b) => b.count - a.count)[0];
  if (peakHour.count > 0) {
    insights.push({
      title: `Janela Crítica: ${peakHour.hour}`,
      text: `O horário das ${peakHour.hour} apresenta o maior índice de incidentes. Este padrão pode estar associado a picos de fadiga ou trocas de turno.`,
      type: 'warning'
    });
  }

  // 3. Período Predominante
  const peakPeriod = [...periodStats].sort((a, b) => b.count - a.count)[0];
  if (peakPeriod.count > 0) {
    const percentage = Math.round((peakPeriod.count / accidents.length) * 100);
    insights.push({
      title: `Predomínio: ${peakPeriod.period}`,
      text: `O período da ${peakPeriod.period} concentra ${percentage}% das ocorrências filtradas. Atenção redobrada na supervisão durante este intervalo.`,
      type: 'info'
    });
  }

  // 4. Madrugada (se houver)
  const dawnAccidents = periodStats.find(p => p.period === 'Madrugada')?.count || 0;
  if (dawnAccidents > 0) {
    insights.push({
      title: 'Risco em Terceiro Turno',
      text: `Detectamos ${dawnAccidents} ocorrências durante a madrugada. A baixa visibilidade e o ritmo biológico exigem protocolos de segurança mais rígidos.`,
      type: 'danger'
    });
  }

  return insights.slice(0, 4);
};

export const calculateSafetyRecords = (accidents: Accident[]) => {
  if (accidents.length === 0) {
    return {
      currentStreak: 0,
      historicalRecord: 0,
      lastAccidentDate: null,
      intervals: []
    };
  }

  const sorted = [...accidents].sort((a, b) => a.date.getTime() - b.date.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastAccident = sorted[sorted.length - 1];
  const lastAccidentDate = new Date(lastAccident.date);
  lastAccidentDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastAccidentDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Rule: Today - LastDate - 1. If today, result 0.
  let currentStreak = Math.max(0, diffDays - 1);
  if (diffDays === 0) currentStreak = 0;

  let historicalRecord = currentStreak;
  const intervals: { date: Date, days: number, employee: string, role: string }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i-1].date);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(sorted[i].date);
    d2.setHours(0, 0, 0, 0);
    
    const interval = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) - 1;
    const cleanInterval = Math.max(0, interval);
    
    intervals.push({ 
      date: d2, 
      days: cleanInterval,
      employee: sorted[i].employee,
      role: sorted[i].role
    });
    if (cleanInterval > historicalRecord) {
      historicalRecord = cleanInterval;
    }
  }

  return {
    currentStreak,
    historicalRecord,
    lastAccidentDate: lastAccident.date,
    intervals
  };
};

export const generateSafetyInsights = (accidents: Accident[]): Insight[] => {
  const records = calculateSafetyRecords(accidents);
  const insights: Insight[] = [];

  if (records.currentStreak > records.historicalRecord * 0.8 && records.currentStreak < records.historicalRecord) {
    insights.push({
      title: 'Próximo ao Recorde',
      text: `Estamos a apenas ${records.historicalRecord - records.currentStreak} dias de superar nosso recorde histórico de segurança. Mantenha o foco!`,
      type: 'success'
    });
  }

  if (records.currentStreak === 0) {
    insights.push({
      title: 'Alerta de Reinicialização',
      text: 'Ocorreu um acidente recentemente. Realize a análise de causa raiz e compartilhe as lições aprendidas imediatamente.',
      type: 'danger'
    });
  }

  const avgInterval = records.intervals.length > 0 
    ? Math.round(records.intervals.reduce((sum, i) => sum + i.days, 0) / records.intervals.length)
    : 0;

  if (avgInterval > 0) {
    insights.push({
      title: 'Espaçamento Médio',
      text: `O tempo médio entre ocorrências é de ${avgInterval} dias. Nosso objetivo é aumentar este intervalo continuamente.`,
      type: 'info'
    });
  }

  return insights;
};
