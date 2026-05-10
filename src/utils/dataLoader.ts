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
        partAffected: row['Parte Atingida']
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

  // 2. Sazonalidade (Mês com mais acidentes somando os 3 anos)
  const monthTotals = Array(12).fill(0);
  accidents.forEach(a => {
    if (targetYears.includes(a.year)) {
      monthTotals[a.month - 1]++;
    }
  });
  
  const topMonthIndex = monthTotals.indexOf(Math.max(...monthTotals));
  if (monthTotals[topMonthIndex] > 0) {
    insights.push({
      title: `${monthNames[topMonthIndex]} - Risco Recorrente`,
      text: `O mês de ${monthNames[topMonthIndex]} concentra o maior acúmulo de ocorrências no triênio, sugerindo um padrão sazonal de risco.`,
      type: 'warning'
    });
  }

  // 3. Tendência Recente (Último ano vs Anterior)
  const sortedYears = [...targetYears].sort((a: number, b: number) => b - a);
  if (sortedYears.length >= 2) {
    const lastYear = sortedYears[0];
    const prevYear = sortedYears[1];
    const lastTotal = accidents.filter(a => a.year === lastYear).length;
    const prevTotal = accidents.filter(a => a.year === prevYear).length;
    
    if (lastTotal < prevTotal && lastTotal > 0) {
      insights.push({
        title: `Tendência de Queda em ${lastYear}`,
        text: `Redução de ${prevTotal - lastTotal} ocorrências em relação a ${prevYear}. As medidas de prevenção estão surtindo efeito.`,
        type: 'success'
      });
    } else if (lastTotal > prevTotal) {
      insights.push({
        title: `Alerta de Elevação em ${lastYear}`,
        text: `Houve um aumento de ${lastTotal - prevTotal} acidentes comparado a ${prevYear}. Recomendado intensificar inspeções de campo.`,
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
