import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, CartesianGrid, ReferenceLine
} from 'recharts';
import { 
  Printer, ArrowLeft, ShieldCheck, Clock, Target, FileText, 
  AlertCircle, TrendingUp, Calendar, Trophy, Zap, Users, Activity, HardHat, GraduationCap, ClipboardList,
  Gauge
} from 'lucide-react';
import type { Accident } from '../types';
import { 
  calculateStats, 
  calculateTemporalStats, 
  generateInsights,
  generateTemporalInsights, 
  calculateSafetyRecords,
  generateSafetyInsights
} from '../utils/dataLoader';
import { LOGO_BASE64 } from '../constants';
import { 
  processFrequencyAndSeverity, 
  generateFrequencySeverityStory, 
  loadHHTStore,
  matchAccidentToSourceUnit,
  getFrequencyRateColor,
  getSeverityRateColor,
  SOURCE_UNITS
} from '../utils/frequencySeverityLoader';

interface LandscapePrintViewProps {
  accidents: Accident[];
  selectedYears: number[];
  filterDivision: string;
  filterManager: string;
  filterArea?: string;
  filterAreas?: string[];
  onBack: () => void;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const LandscapePrintView: React.FC<LandscapePrintViewProps> = ({
  accidents,
  selectedYears,
  filterDivision,
  filterManager,
  filterArea,
  filterAreas,
  onBack
}) => {
  const activeAreas = useMemo(() => {
    if (filterAreas && filterAreas.length > 0) {
      if (filterAreas.includes('ALL')) return [];
      return filterAreas;
    }
    if (filterArea && filterArea !== 'ALL') return [filterArea];
    return [];
  }, [filterAreas, filterArea]);

  // 1. Filtered Accidents (only print those matching filters, as requested in users first request)
  const filteredAccidents = useMemo(() => {
    return accidents.filter(a => {
      const matchesYear = selectedYears.includes(a.year);
      const matchesDivision = filterDivision === 'ALL' || a.division === filterDivision;
      const matchesManager = filterManager === 'ALL' || a.manager === filterManager;
      const matchesArea = activeAreas.length === 0 || activeAreas.includes(a.area);
      return matchesYear && matchesDivision && matchesManager && matchesArea;
    });
  }, [accidents, selectedYears, filterDivision, filterManager, activeAreas]);

  // 2. Calculations
  const stats = useMemo(() => calculateStats(filteredAccidents, selectedYears), [filteredAccidents, selectedYears]);
  const temporalStats = useMemo(() => calculateTemporalStats(filteredAccidents), [filteredAccidents]);
  const safetyRecords = useMemo(() => calculateSafetyRecords(filteredAccidents), [filteredAccidents]);

  // 3. Insights
  const monthlyInsights = useMemo(() => generateInsights(filteredAccidents, selectedYears), [filteredAccidents, selectedYears]);
  const temporalInsights = useMemo(() => generateTemporalInsights(filteredAccidents), [filteredAccidents]);
  const safetyInsights = useMemo(() => generateSafetyInsights(filteredAccidents), [filteredAccidents]);
  
  const breakdownInsights = useMemo(() => [
    { 
      title: 'Perfil de Risco', 
      text: `Média de experiência de ${(filteredAccidents.reduce((s,a) => s + (a.experienceYears + a.experienceMonths/12), 0) / Math.max(filteredAccidents.length, 1)).toFixed(1)} anos nos acidentados.`,
      type: 'info' as const
    },
    { 
      title: 'Fator Predominante', 
      text: `${Math.round((filteredAccidents.filter(a => a.unsafeAct).length / Math.max(filteredAccidents.length, 1)) * 100)}% das causas ligadas a Ato Inseguro.`,
      type: 'danger' as const
    },
    { 
      title: 'Conformidade EPI', 
      text: `${Math.round((filteredAccidents.filter(a => a.usedEPI).length / Math.max(filteredAccidents.length, 1)) * 100)}% utilizavam EPI no momento.`,
      type: 'success' as const
    },
    { 
      title: 'Ação Necessária', 
      text: `${filteredAccidents.filter(a => a.lostDays > 30).length} casos críticos com mais de 30 dias de afastamento.`,
      type: 'warning' as const
    }
  ], [filteredAccidents]);

  const reportTitle = useMemo(() => {
    const yearsCount = selectedYears.length;
    switch (yearsCount) {
      case 1: return 'Relatório Anual';
      case 2: return 'Relatório Bienal';
      case 3: return 'Relatório Trienal';
      default: return 'Relatório Estatístico';
    }
  }, [selectedYears]);

  const yearsLabel = useMemo(() => {
    const count = selectedYears.length;
    switch (count) {
      case 1: return { adj: 'anual', noun: 'ano' };
      case 2: return { adj: 'bienal', noun: 'biênio' };
      case 3: return { adj: 'trienal', noun: 'triênio' };
      default: return { adj: 'estatística', noun: 'período' };
    }
  }, [selectedYears]);


  const occurrenceChunks = useMemo(() => {
    const sorted = [...filteredAccidents].sort((a, b) => b.date.getTime() - a.date.getTime());
    if (sorted.length === 0) return [[]];
    const chunks: typeof filteredAccidents[] = [];
    for (let i = 0; i < sorted.length; i += 15) {
      chunks.push(sorted.slice(i, i + 15));
    }
    return chunks;
  }, [filteredAccidents]);

  const totalPages = useMemo(() => {
    return 5 + occurrenceChunks.length;
  }, [occurrenceChunks]);

  const hhtStore = useMemo(() => loadHHTStore(), []);

  const primaryYear = useMemo(() => {
    if (selectedYears.length === 1) return selectedYears[0];
    const storeYears = Object.keys(hhtStore).map(Number);
    const matched = selectedYears.filter(y => storeYears.includes(y));
    if (matched.length > 0) return Math.max(...matched);
    if (selectedYears.length > 0) return Math.max(...selectedYears);
    if (storeYears.length > 0) return Math.max(...storeYears);
    return 2026;
  }, [hhtStore, selectedYears]);

  const filterSubtitle = useMemo(() => {
    const parts: string[] = [];
    parts.push(filterDivision === 'ALL' ? 'Grupo Açotubo' : filterDivision);
    if (activeAreas.length > 0) {
      if (activeAreas.length <= 3) {
        parts.push(`Áreas: ${activeAreas.join(', ')}`);
      } else {
        parts.push(`${activeAreas.length} Áreas Selecionadas`);
      }
    } else {
      parts.push('Todas as Áreas');
    }
    if (filterManager !== 'ALL') parts.push(`Sup: ${filterManager}`);
    parts.push(`Anos: ${selectedYears.join(', ')}`);
    return parts.join(' • ');
  }, [filterDivision, activeAreas, filterManager, selectedYears]);

  const availableMonths = useMemo(() => {
    const yearObj = hhtStore[primaryYear] || {};
    const hhtMonths = Object.keys(yearObj).map(Number);
    const accidentMonths = filteredAccidents
      .filter(a => a.year === primaryYear)
      .map(a => a.month);
    const allMonths = Array.from(new Set([...hhtMonths, ...accidentMonths])).sort((a, b) => a - b);
    return allMonths.length > 0 ? allMonths : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [hhtStore, primaryYear, filteredAccidents]);

  const unitForRates = useMemo(() => {
    if (filterDivision === 'ALL') return 'ALL';
    if (SOURCE_UNITS.includes(filterDivision)) return filterDivision;
    const firstArea = activeAreas.length === 1 ? activeAreas[0] : undefined;
    return matchAccidentToSourceUnit(filterDivision, firstArea) || 'ALL';
  }, [filterDivision, activeAreas]);

  const freqOverview = useMemo(() => {
    return processFrequencyAndSeverity(filteredAccidents, primaryYear, availableMonths, unitForRates, hhtStore);
  }, [filteredAccidents, primaryYear, availableMonths, unitForRates, hhtStore]);

  const freqStory = useMemo(() => {
    return generateFrequencySeverityStory(freqOverview, primaryYear);
  }, [freqOverview, primaryYear]);

  const monthlyFreqRates12 = useMemo(() => {
    const map = new Map(freqOverview.monthlyRecords.map(m => [m.month, m]));
    return MONTH_NAMES.map((name, i) => {
      const monthNum = i + 1;
      const rec = map.get(monthNum);
      return {
        month: monthNum,
        monthName: name,
        frequencyRate: rec ? rec.frequencyRate : 0,
        severityRate: rec ? rec.severityRate : 0,
        accidents: rec ? rec.accidents : 0,
        lostDays: rec ? rec.lostDays : 0,
        hht: rec ? rec.hht : 0,
        hasData: Boolean(rec && rec.hht > 0)
      };
    });
  }, [freqOverview.monthlyRecords]);

  const getOITStatusColor = (status: string): string => {
    switch (status) {
      case 'MUITO BOA':
      case 'MUITO BOM':
        return '#10B981'; // Muito boa = Verde
      case 'BOA':
      case 'BOM':
        return '#10B981'; // Boa = Verde também
      case 'RUIM':
      case 'REGULAR':
        return '#D97706'; // Ruim = Amarelo
      case 'PÉSSIMA':
      case 'PÉSSIMO':
        return '#EF4444'; // Péssima = Vermelho
      default:
        return '#64748B';
    }
  };

  const getOITStatusBg = (status: string): string => {
    switch (status) {
      case 'MUITO BOA':
      case 'MUITO BOM':
      case 'BOA':
      case 'BOM':
        return '#ECFDF5';
      case 'RUIM':
      case 'REGULAR':
        return '#FEFCE8';
      case 'PÉSSIMA':
      case 'PÉSSIMO':
        return '#FEF2F2';
      default:
        return '#F1F5F9';
    }
  };

  const employeeCounts = useMemo(() => {
    return filteredAccidents.reduce((acc, a) => {
      acc[a.employee] = (acc[a.employee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredAccidents]);

  // Recharts specific formatters & maps
  const monthlyChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthData: any = { month: MONTH_NAMES[i] };
      selectedYears.forEach(year => {
        monthData[year] = stats[year]?.monthly[i].count || 0;
      });
      return monthData;
    });
  }, [stats, selectedYears]);

  const safetyChartData = useMemo(() => {
    return safetyRecords.intervals.map((item, index) => ({
      id: index,
      date: item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      days: item.days
    }));
  }, [safetyRecords]);

  // Page 4 employee & experience ranking (limited for print)
  const employeeRanking = useMemo(() => {
    const counts: Record<string, { count: number, division: string, re: string }> = {};
    filteredAccidents.forEach(a => {
      if (!counts[a.employee]) {
        counts[a.employee] = { count: 0, division: a.division, re: a.re };
      }
      counts[a.employee].count++;
    });
    return Object.entries(counts)
      .filter(([, data]) => data.count > 1)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3);
  }, [filteredAccidents]);

  const experienceRanking = useMemo(() => {
    const areas: Record<string, { totalExp: number, count: number }> = {};
    filteredAccidents.forEach(a => {
      const exp = a.experienceYears + (a.experienceMonths / 12);
      if (!areas[a.area]) areas[a.area] = { totalExp: 0, count: 0 };
      areas[a.area].totalExp += exp;
      areas[a.area].count++;
    });
    return Object.entries(areas)
      .map(([area, data]) => ({ area, avgExp: data.totalExp / data.count }))
      .sort((a, b) => b.avgExp - a.avgExp)
      .slice(0, 4);
  }, [filteredAccidents]);

  const page4Stats = useMemo(() => {
    if (filteredAccidents.length === 0) return null;
    const count = filteredAccidents.length;
    return {
      unsafeAct: (filteredAccidents.filter(a => a.unsafeAct).length / count) * 100,
      machineDeficiency: (filteredAccidents.filter(a => a.machineDeficiency).length / count) * 100,
      functionDeviation: (filteredAccidents.filter(a => a.functionDeviation).length / count) * 100,
      hadTraining: (filteredAccidents.filter(a => a.hadTraining).length / count) * 100,
      usedEPI: (filteredAccidents.filter(a => a.usedEPI).length / count) * 100,
    };
  }, [filteredAccidents]);

  // Sidebar Renders (Panorama Geral Panel Sidebar)
  const renderLeftSidebar = () => (
    <aside className="panorama-panel">
      <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Panorama Geral</h2>
      {selectedYears.map(year => {
        const s = stats[year];
        if (!s) return null;
        return (
          <div key={year} className="year-card" style={{ background: '#FFF', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.4rem 0.5rem' }}>
            <h3 style={{ margin: 0, color: '#64748B', fontWeight: 800, fontSize: '0.75rem', textAlign: 'center' }}>{year}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', textAlign: 'center', marginTop: '2px' }}>
              <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: '0.25rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{s.total}</div>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>acd.</div>
              </div>
              <div style={{ paddingLeft: '0.25rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#475569', lineHeight: 1 }}>{s.totalLostDays}</div>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>dias</div>
              </div>
            </div>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#475569', marginTop: '4px', textAlign: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: '2px' }}>média {s.avgPerMonth}/mês</div>
          </div>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '0.4rem', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', color: '#64748B', fontSize: '0.55rem', display: 'flex', gap: '0.25rem', lineHeight: 1.3 }}>
        <AlertCircle size={12} style={{ flexShrink: 0, color: '#94A3B8' }} />
        <span>
          <strong>Nota Técnica:</strong> Registros operacionais de filiais contabilizados a partir de outubro de 2025.
        </span>
      </div>
    </aside>
  );

  // Insight List Renders
  const renderRightSidebar = (title: string, subtitle: string, desc: string, insights: Array<{ title: string, text: string, type: 'danger' | 'warning' | 'info' | 'success' }>) => (
    <aside className="insights-panel">
      <div>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
          {title} <span style={{ color: 'var(--primary)' }}>{subtitle}</span>
        </h2>
        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: 500, margin: 0 }}>
          {desc}
        </p>
      </div>

      {insights.slice(0, 3).map((insight, idx) => {
        const colors = {
          danger: { bg: '#FEE2E2', text: '#EF4444', icon: <AlertCircle color="#EF4444" /> },
          warning: { bg: '#FEF3C7', text: '#F59E0B', icon: <Calendar color="#F59E0B" /> },
          info: { bg: '#DBEAFE', text: '#3B82F6', icon: <TrendingUp color="#3B82F6" /> },
          success: { bg: '#D1FAE5', text: '#10B981', icon: <ShieldCheck color="#10B981" /> }
        };
        const config = colors[insight.type];

        return (
          <div key={idx} className="insight-card" style={{ borderLeft: `4px solid ${config.text}` }}>
            <div className="insight-icon" style={{ backgroundColor: config.bg }}>
              {config.icon}
            </div>
            <div className="insight-content">
              <h4>{insight.title}</h4>
              <p>{insight.text}</p>
            </div>
          </div>
        );
      })}
    </aside>
  );

  return (
    <div className="print-landscape-container" style={{ padding: '4.5rem 1.2rem 1.2rem', background: '#F1F5F9', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* Print Toolbar controls */}
      <div className="print-controls no-print" style={{ 
        padding: '0.8rem 2rem', 
        background: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(10px)',
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 2000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 700 }}>
            <ArrowLeft size={16} /> Voltar ao Painel
          </button>
          <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0' }}>Modo Impressão do Quadro de Gestão à Vista (A4 Paisagem)</div>
        </div>
        <button onClick={() => window.print()} className="btn-pdf" style={{ padding: '0.5rem 1.8rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
          <Printer size={18} />
          <span>Confirmar e Imprimir</span>
        </button>
      </div>

      {/* PAGE 1: Panorama Geral */}
      <div className="a4-landscape">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #B91C1C', paddingBottom: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ background: '#B91C1C', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{reportTitle} — Panorama Geral</h1>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>
                {filterSubtitle}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>FOLHA 01 / {String(totalPages).padStart(2, '0')}</span>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: 'calc(100% - 60px)', marginTop: '0.65rem' }}>
          {/* Extremo Superior: Panorama Geral Cards */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {selectedYears.slice(0, 3).map(year => {
              const s = stats[year];
              if (!s) return null;
              return (
                <div key={year} className="panel-premium" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 1rem', borderLeft: '5px solid var(--primary)', background: '#FFF' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#64748B', fontWeight: 800, fontSize: '0.75rem' }}>ANO {year}</h3>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '1px' }}>méd {s.avgPerMonth}/mês</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{s.total}</div>
                      <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px' }}>acd.</div>
                    </div>
                    <div style={{ height: '28px', width: '1px', background: '#E2E8F0' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#475569', lineHeight: 1 }}>{s.totalLostDays}</div>
                      <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px' }}>dias</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Centro: Gráficos Lado a Lado ou Painel Único com Tabela Vertical quando 1 ano selecionado */}
          {selectedYears.length === 1 ? (
            <div className="panel-premium" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem', minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>
                  Evolução Mensal de Acidentes e Afastamentos — Ano {selectedYears[0]}
                </h2>
                <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>
                  Total: <strong style={{ color: '#B91C1C' }}>{stats[selectedYears[0]]?.total || 0} acidentes</strong> • <strong style={{ color: '#0284C7' }}>{stats[selectedYears[0]]?.totalLostDays || 0} dias perdidos</strong>
                </span>
              </div>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0' }}>
                Distribuição cronológica mensal de acidentes e gravidade no período
              </p>

              <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: '0.85rem', alignItems: 'stretch' }}>
                {/* Gráfico de Barras */}
                <div style={{ height: '100%', minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748B' }} />
                      <Tooltip 
                        cursor={{ fill: '#F1F5F9' }} 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} 
                        itemStyle={{ color: '#0F172A', fontWeight: 600 }} 
                        labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '2px' }} 
                      />
                      <Bar 
                        dataKey={selectedYears[0]} 
                        name={`Ano ${selectedYears[0]}`} 
                        fill="#B91C1C" 
                        radius={[3, 3, 0, 0]} 
                        label={{ position: 'top', fill: '#0F172A', fontSize: 9, fontWeight: 900 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabela Vertical com mesma altura do gráfico */}
                <div style={{
                  height: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '3px 6px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: '7px',
                    fontWeight: 900,
                    color: '#0F172A',
                    textAlign: 'center',
                    letterSpacing: '0.3px'
                  }}>
                    CONSOLIDADO MENSAL ({selectedYears[0]})
                  </div>
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px', height: '100%' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '2px 5px', textAlign: 'left', fontWeight: 900, color: '#475569', fontSize: '6.8px' }}>MÊS</th>
                          <th style={{ padding: '2px 5px', textAlign: 'center', fontWeight: 900, color: '#475569', fontSize: '6.8px' }}>ACIDENTES</th>
                          <th style={{ padding: '2px 5px', textAlign: 'right', fontWeight: 900, color: '#475569', fontSize: '6.8px' }}>DIAS AFAST.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MONTH_NAMES.map((mName, idx) => {
                          const mStats = stats[selectedYears[0]]?.monthly[idx];
                          const count = mStats?.count || 0;
                          const lost = mStats?.lostDays || 0;
                          return (
                            <tr key={mName} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '1.5px 5px', fontWeight: count > 0 ? 800 : 600, color: count > 0 ? '#0F172A' : '#94A3B8' }}>
                                {mName}
                              </td>
                              <td style={{ padding: '1.5px 5px', textAlign: 'center', fontWeight: 900, color: count > 0 ? '#B91C1C' : '#CBD5E1' }}>
                                {count > 0 ? count : '—'}
                              </td>
                              <td style={{ padding: '1.5px 5px', textAlign: 'right', fontWeight: 800, color: lost > 0 ? '#0284C7' : '#CBD5E1' }}>
                                {lost > 0 ? `${lost}d` : '0d'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#F8FAFC', borderTop: '1.5px solid #CBD5E1' }}>
                          <td style={{ padding: '2.5px 5px', fontWeight: 950, color: '#0F172A' }}>TOTAL</td>
                          <td style={{ padding: '2.5px 5px', textAlign: 'center', fontWeight: 950, color: '#B91C1C' }}>
                            {stats[selectedYears[0]]?.total || 0}
                          </td>
                          <td style={{ padding: '2.5px 5px', textAlign: 'right', fontWeight: 950, color: '#0284C7' }}>
                            {stats[selectedYears[0]]?.totalLostDays || 0}d
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '0.75rem', flex: 1, minHeight: 0 }}>
              {/* Comparativo Mensal */}
              <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text)', margin: '0 0 0.15rem 0', textAlign: 'center' }}>Comparativo Mensal</h2>
                <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0', textAlign: 'center' }}>Distribuição de acidentes no período selecionado</p>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748B' }} />
                      <Tooltip 
                        cursor={{ fill: '#F1F5F9' }} 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} 
                        itemStyle={{ color: '#0F172A', fontWeight: 600 }} 
                        labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '2px' }} 
                      />
                      <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ fontSize: 8, paddingBottom: 3 }} />
                      {selectedYears.map((year, idx) => {
                        const colors = ['#B91C1C', '#3B82F6', '#10B981', '#F59E0B'];
                        return (
                          <Bar 
                            key={year} 
                            dataKey={year} 
                            name={String(year)} 
                            fill={colors[idx % colors.length]} 
                            radius={[3, 3, 0, 0]} 
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mapa de Intensidade */}
              <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text)', margin: '0 0 0.15rem 0', textAlign: 'center' }}>
                  Mapa de <span style={{ color: 'var(--primary)' }}>Intensidade</span>
                </h2>
                <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0', textAlign: 'center' }}>
                  Frequência mensal de ocorrências (Mapa de Calor)
                </p>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <table className="heatmap-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '42px', minWidth: '42px', fontSize: '8px', fontWeight: 800, color: '#64748B', textAlign: 'center' }}></th>
                        {MONTH_NAMES.map(m => (
                          <th key={m} style={{ fontSize: '8px', fontWeight: 800, color: '#64748B', textAlign: 'center', padding: '1px' }}>
                            {m.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedYears.map(year => {
                        const s = stats[year];
                        if (!s) return null;
                        return (
                          <tr key={year}>
                            <td style={{ fontSize: '9px', fontWeight: 900, color: '#334155', verticalAlign: 'middle', textAlign: 'center', padding: '2px 0', width: '42px', minWidth: '42px' }}>
                              {year}
                            </td>
                            {s.monthly.map((m, i) => (
                              <td 
                                key={i} 
                                style={{ 
                                  background: '#FFFFFF', 
                                  border: m.count > 0 ? '1.5px solid #FECACA' : '1px solid #F1F5F9',
                                  color: m.count > 0 ? '#B91C1C' : '#CBD5E1',
                                  height: '22px',
                                  borderRadius: '4px',
                                  fontSize: '9.5px',
                                  fontWeight: 900,
                                  textAlign: 'center',
                                  verticalAlign: 'middle',
                                  boxShadow: m.count > 0 ? '0 1px 2px rgba(185, 28, 28, 0.05)' : 'none'
                                }}
                              >
                                <div>{m.count > 0 ? m.count : '-'}</div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '0.45rem', fontSize: '7.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid #FECACA', background: '#FFFFFF', color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8.5px', fontWeight: 900 }}>
                        N
                      </div>
                      <span>Ocorrências registradas no mês (em vermelho com fundo branco)</span>
                    </div>
                    <span style={{ marginLeft: 8, color: '#94A3B8' }}>— fora do período</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Extremo Inferior: Períodos de Atenção Storytelling */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0F172A', margin: 0, paddingLeft: '0.15rem' }}>
              Períodos de <span style={{ color: 'var(--primary)' }}>Atenção</span> • <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Padrões na comparação {yearsLabel.adj}</span>
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {monthlyInsights.slice(0, 3).map((insight, idx) => {
                const colors = {
                  danger: { bg: '#FEE2E2', text: '#EF4444', icon: <AlertCircle color="#EF4444" size={16} /> },
                  warning: { bg: '#FEF3C7', text: '#F59E0B', icon: <Calendar color="#F59E0B" size={16} /> },
                  info: { bg: '#DBEAFE', text: '#3B82F6', icon: <TrendingUp color="#3B82F6" size={16} /> },
                  success: { bg: '#D1FAE5', text: '#10B981', icon: <ShieldCheck color="#10B981" size={16} /> }
                };
                const config = colors[insight.type];

                return (
                  <div key={idx} className="panel-premium" style={{ flex: 1, display: 'flex', gap: '0.6rem', padding: '0.45rem 0.65rem', borderLeft: `4px solid ${config.text}`, background: '#FFF' }}>
                    <div style={{ backgroundColor: config.bg, width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {config.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.65rem', fontWeight: 900, color: '#0F172A' }}>{insight.title}</h4>
                      <p style={{ margin: '1px 0 0 0', fontSize: '0.55rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{insight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem', fontSize: '0.55rem', color: '#94A3B8', fontWeight: 800, marginTop: 'auto' }}>
          <span>QUADRO DE GESTÃO À VISTA — GRUPO AÇOTUBO</span>
          <span>SISTEMA DE SEGURANÇA E MEDICINA DO TRABALHO (SESMT)</span>
        </footer>
      </div>

      {/* PAGE 2: Análise Temporal */}
      <div className="a4-landscape">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #3B82F6', paddingBottom: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ background: '#3B82F6', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{reportTitle} — Análise Temporal</h1>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>
                Identificação de Padrões por Período, Dia e Horários • {filterSubtitle}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>FOLHA 02 / {String(totalPages).padStart(2, '0')}</span>
          </div>
        </header>

        <div className="grid-main">
          {renderLeftSidebar()}

          <main className="content-area">
            {/* Dia e Turnos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0.75rem', height: '270px' }}>
              {/* Ocorrências por Turno (PieChart) */}
              <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 900, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} color="#3B82F6" /> Ocorrências por Turno</h3>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', alignItems: 'center', minHeight: 0 }}>
                  <div style={{ height: '100%', minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={temporalStats.periodStats}
                          innerRadius={35}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {temporalStats.periodStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} 
                          itemStyle={{ color: '#0F172A', fontWeight: 600 }} 
                          labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '2px' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingRight: '0.25rem' }}>
                    {temporalStats.periodStats.map((p) => (
                      <div key={p.period} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: p.color }}></div>
                          <span style={{ fontWeight: 700, color: '#475569' }}>{p.period}</span>
                        </div>
                        <span style={{ fontWeight: 900, color: '#0F172A' }}>{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dia da Semana (BarChart) */}
              <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 900, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} color="#3B82F6" /> Ocorrências por Dia</h3>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={temporalStats.dayOfWeekStats} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tickFormatter={(val) => val.substring(0, 3)} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} />
                      <Tooltip 
                        cursor={{ fill: '#F1F5F9' }} 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} 
                        itemStyle={{ color: '#0F172A', fontWeight: 600 }} 
                        labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '2px' }} 
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[3, 3, 0, 0]} barSize={15} label={{ position: 'top', fontSize: 8, fontWeight: 900, fill: '#3B82F6' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Linha do Tempo 24 Horas */}
            <div className="panel-premium" style={{ height: '210px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 900, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={14} color="#10B981" /> Detalhamento por Horário (Frequência 24h)</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={temporalStats.hourlyStats} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="printColorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} 
                      itemStyle={{ color: '#0F172A', fontWeight: 600 }} 
                      labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '2px' }} 
                    />
                    <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#printColorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>

          {renderRightSidebar('Análise de', 'Padrões', 'Storytelling baseado em horários e dias', temporalInsights)}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem', fontSize: '0.55rem', color: '#94A3B8', fontWeight: 800 }}>
          <span>QUADRO DE GESTÃO À VISTA — GRUPO AÇOTUBO</span>
          <span>SISTEMA DE SEGURANÇA E MEDICINA DO TRABALHO (SESMT)</span>
        </footer>
      </div>

      {/* PAGE 3: Gestão de Records */}
      <div className="a4-landscape">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #10B981', paddingBottom: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ background: '#10B981', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <Target size={20} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{reportTitle} — Gestão de Segurança</h1>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Recordes de Dias Sem Acidentes e Cronologia de Incidentes • {filterSubtitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>FOLHA 03 / {String(totalPages).padStart(2, '0')}</span>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: 'calc(100% - 60px)', marginTop: '0.65rem' }}>
          {/* Extremo Superior: Year Cards + Safety KPIs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Year Cards */}
            {selectedYears.slice(0, 3).map(year => {
              const s = stats[year];
              if (!s) return null;
              return (
                <div 
                  key={year} 
                  className="panel-premium safety-top-card" 
                  style={{ 
                    flex: 1, 
                    minWidth: 0, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    borderLeft: '4px solid var(--primary)', 
                    background: '#FFF' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 900, color: '#1E293B', fontSize: '0.8rem', lineHeight: 1 }}>{year}</span>
                    <span style={{ fontSize: '0.56rem', fontWeight: 800, color: '#64748B' }}>{s.avgPerMonth}/mês</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{s.total}</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>acidentes</span>
                  </div>
                </div>
              );
            })}

            {/* KPI 1 */}
            <div 
              className="panel-premium safety-top-card" 
              style={{ 
                flex: 1, 
                minWidth: 0, 
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
                border: 'none', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', color: '#10B981', fontSize: '0.64rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                <Target size={12} color="#10B981" style={{ flexShrink: 0 }} /> <span>Sem Ocorrências</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{safetyRecords.currentStreak}</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>dias atuais</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div 
              className="panel-premium safety-top-card" 
              style={{ 
                flex: 1, 
                minWidth: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                borderLeft: '4px solid #F59E0B', 
                background: '#FFF' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', color: '#F59E0B', fontSize: '0.64rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                <Trophy size={12} color="#F59E0B" style={{ flexShrink: 0 }} /> <span>Recorde DSA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{safetyRecords.historicalRecord}</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>histórico</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div 
              className="panel-premium safety-top-card" 
              style={{ 
                flex: 1, 
                minWidth: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                borderLeft: '4px solid #3B82F6', 
                background: '#FFF' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', color: '#3B82F6', fontSize: '0.64rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                <Calendar size={12} color="#3B82F6" style={{ flexShrink: 0 }} /> <span>Intervalo DSA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                  {safetyRecords.intervals.length > 0 
                    ? Math.round(safetyRecords.intervals.reduce((sum, item) => sum + item.days, 0) / safetyRecords.intervals.length)
                    : '-'}
                </span>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>média dias</span>
              </div>
            </div>
          </div>

          {/* Centro: Histórico DSA Gráfico em Largura Total */}
          <div className="panel-premium" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem', minHeight: 0 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, margin: '0 0 0.15rem 0', color: '#0F172A' }}>Espaçamento de Dias Sem Acidentes entre Ocorrências</h3>
            <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0' }}>Linha do tempo cronológica com a contagem de dias entre eventos consecutivos vs recorde de segurança</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safetyChartData} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748B', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} 
                    itemStyle={{ color: '#0F172A', fontWeight: 600 }} 
                    labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '2px' }} 
                  />
                  <ReferenceLine y={safetyRecords.historicalRecord} stroke="#B91C1C" strokeDasharray="4 4" label={{ position: 'right', value: 'Recorde', fill: '#B91C1C', fontSize: 8, fontWeight: 900 }} />
                  <Line 
                    type="monotone" 
                    dataKey="days" 
                    stroke="#0F172A" 
                    strokeWidth={3} 
                    dot={{ fill: '#B91C1C', strokeWidth: 1.5, r: 3.5, stroke: '#FFF' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Extremo Inferior: Gestão de Indicadores Storytelling */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0F172A', margin: 0, paddingLeft: '0.15rem' }}>
              Gestão de <span style={{ color: 'var(--primary)' }}>Indicadores</span> • <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Fatores críticos de performance de segurança</span>
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {safetyInsights.slice(0, 3).map((insight, idx) => {
                const colors = {
                  danger: { bg: '#FEE2E2', text: '#EF4444', icon: <AlertCircle color="#EF4444" size={16} /> },
                  warning: { bg: '#FEF3C7', text: '#F59E0B', icon: <Calendar color="#F59E0B" size={16} /> },
                  info: { bg: '#DBEAFE', text: '#3B82F6', icon: <TrendingUp color="#3B82F6" size={16} /> },
                  success: { bg: '#D1FAE5', text: '#10B981', icon: <ShieldCheck color="#10B981" size={16} /> }
                };
                const config = colors[insight.type];
                return (
                  <div key={idx} className="insight-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0.75rem', borderLeft: `4px solid ${config.text}`, background: '#FFF' }}>
                    <div className="insight-icon" style={{ backgroundColor: config.bg, width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                      {config.icon}
                    </div>
                    <div className="insight-content" style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.72rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>{insight.title}</h4>
                      <p style={{ fontSize: '0.62rem', margin: '2px 0 0 0', color: '#64748B', lineHeight: 1.2 }}>{insight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem', fontSize: '0.55rem', color: '#94A3B8', fontWeight: 800, marginTop: 'auto' }}>
          <span>QUADRO DE GESTÃO À VISTA — GRUPO AÇOTUBO</span>
          <span>SISTEMA DE SEGURANÇA E MEDICINA DO TRABALHO (SESMT)</span>
        </footer>
      </div>

      {/* PAGE 4: Indicadores Regulamentares (NBR 14280 / OIT) */}
      <div className="a4-landscape">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0284C7', paddingBottom: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ background: '#0284C7', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <Gauge size={20} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{reportTitle} — Indicadores Regulamentares (NBR 14280 / OIT)</h1>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Taxas Oficiais de Frequência (F) e Gravidade (G) • Exercício {primaryYear} • {filterSubtitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>FOLHA 04 / {String(totalPages).padStart(2, '0')}</span>
          </div>
        </header>

        <div className="slide4-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: 'calc(100% - 60px)', marginTop: '0.65rem' }}>
          {/* Top Row: 4 KPI Cards */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Card 1: Frequência */}
            <div className="panel-premium" style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: '0.5rem 0.85rem', 
              borderLeft: '4px solid #0284C7', 
              background: '#FFF', 
              borderRadius: '8px', 
              minWidth: 0 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                <span style={{ color: '#475569', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  Frequência
                </span>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: '4px', background: getOITStatusBg(freqOverview.overallFrequencyStatus), color: getOITStatusColor(freqOverview.overallFrequencyStatus), whiteSpace: 'nowrap' }}>
                  {freqOverview.overallFrequencyStatus}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F172A', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {freqOverview.overallFrequencyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  N: {freqOverview.totalAccidents} acd • Meta ≤ 20
                </div>
              </div>
            </div>

            {/* Card 2: Gravidade */}
            <div className="panel-premium" style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: '0.5rem 0.85rem', 
              borderLeft: '4px solid #F59E0B', 
              background: '#FFF', 
              borderRadius: '8px', 
              minWidth: 0 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                <span style={{ color: '#475569', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  Gravidade
                </span>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: '4px', background: getOITStatusBg(freqOverview.overallSeverityStatus), color: getOITStatusColor(freqOverview.overallSeverityStatus), whiteSpace: 'nowrap' }}>
                  {freqOverview.overallSeverityStatus}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F172A', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {freqOverview.overallSeverityRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  T: {freqOverview.totalLostDays} dias • Meta ≤ 500
                </div>
              </div>
            </div>

            {/* Card 3: Horas Trabalhadas */}
            <div className="panel-premium" style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: '0.5rem 0.85rem', 
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
              border: 'none', 
              color: 'white', 
              borderRadius: '8px', 
              minWidth: 0 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <Clock size={12} color="#38BDF8" /> <span>Horas Trabalhadas</span>
                </div>
                <span style={{ fontSize: '0.56rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.18)', color: '#38BDF8', whiteSpace: 'nowrap' }}>
                  HH EFETIVO
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {freqOverview.totalHHT.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>h</span>
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  exposição ao risco
                </div>
              </div>
            </div>

            {/* Card 4: Média Afastamento */}
            <div className="panel-premium" style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: '0.5rem 0.85rem', 
              borderLeft: '4px solid #10B981', 
              background: '#FFF', 
              borderRadius: '8px', 
              minWidth: 0 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <TrendingUp size={12} color="#10B981" /> <span>Média Afastamento</span>
                </div>
                <span style={{ fontSize: '0.56rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#ECFDF5', color: '#059669', whiteSpace: 'nowrap' }}>
                  SEVERIDADE
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F172A', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {freqOverview.totalAccidents > 0 ? (freqOverview.totalLostDays / freqOverview.totalAccidents).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0'}
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', marginLeft: '3px' }}>d/acd</span>
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {freqOverview.monthlyRecords.length} meses apurados
                </div>
              </div>
            </div>
          </div>

          {/* Main Area: 2 Columns -> Left: Stacked Charts (F & G) | Right: Unit Ranking (Expanded) */}
          <div className="slide4-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: '0.75rem', flex: 1, minHeight: 0, width: '100%' }}>
            {/* Left Column: Stacked Charts (Frequência em cima, Gravidade embaixo - Jan a Dez) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: 0, minWidth: 0, height: '100%', overflow: 'hidden' }}>
              
              {/* Gráfico Superior: Frequência Mensal (F) */}
              <div className="panel-premium" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.55rem 0.85rem', minHeight: 0, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284C7', flexShrink: 0 }}></div>
                    <h3 style={{ fontSize: '0.78rem', fontWeight: 900, margin: 0, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                      Evolução Mensal da Taxa de Frequência (F)
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#0284C7', background: '#F0F9FF', padding: '1px 7px', borderRadius: '4px', border: '1px solid #BAE6FD', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    F = (N × 10⁶) / HHT
                  </span>
                </div>
                <div style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 600, margin: '0 0 0.25rem 0.85rem' }}>
                  Acidentados por milhão de horas trabalhadas • Janeiro a Dezembro
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyFreqRates12} margin={{ top: 14, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748B' }} />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.72rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                        formatter={(val: any) => [`${Number(val).toFixed(2)}`, 'Frequência (F)']}
                        labelFormatter={(lbl: any) => `Mês: ${lbl}`}
                      />
                      <Bar 
                        dataKey="frequencyRate" 
                        radius={[3, 3, 0, 0]} 
                        barSize={16} 
                        label={{ 
                          position: 'top', 
                          fill: '#334155', 
                          fontSize: 8, 
                          fontWeight: 800, 
                          formatter: (v: any) => Number(v) > 0 ? Number(v).toFixed(1) : '' 
                        }} 
                      >
                        {monthlyFreqRates12.map((m, idx) => (
                          <Cell key={`f-cell-${idx}`} fill={getFrequencyRateColor(m.frequencyRate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico Inferior: Gravidade Mensal (G) */}
              <div className="panel-premium" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.55rem 0.85rem', minHeight: 0, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706', flexShrink: 0 }}></div>
                    <h3 style={{ fontSize: '0.78rem', fontWeight: 900, margin: 0, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                      Evolução Mensal da Taxa de Gravidade (G)
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#D97706', background: '#FFFBEB', padding: '1px 7px', borderRadius: '4px', border: '1px solid #FDE68A', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    G = (T × 10⁶) / HHT
                  </span>
                </div>
                <div style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 600, margin: '0 0 0.25rem 0.85rem' }}>
                  Dias perdidos por milhão de horas trabalhadas • Janeiro a Dezembro
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyFreqRates12} margin={{ top: 14, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748B' }} />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.72rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                        formatter={(val: any) => [`${Number(val).toFixed(0)}`, 'Gravidade (G)']}
                        labelFormatter={(lbl: any) => `Mês: ${lbl}`}
                      />
                      <Bar 
                        dataKey="severityRate" 
                        radius={[3, 3, 0, 0]} 
                        barSize={16} 
                        label={{ 
                          position: 'top', 
                          fill: '#334155', 
                          fontSize: 8, 
                          fontWeight: 800, 
                          formatter: (v: any) => Number(v) > 0 ? Number(v).toFixed(0) : '' 
                        }} 
                      >
                        {monthlyFreqRates12.map((m, idx) => (
                          <Cell key={`g-cell-${idx}`} fill={getSeverityRateColor(m.severityRate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: Ranking Crítico por Unidade */}
            <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column', padding: '0.65rem 0.85rem', minHeight: 0, minWidth: 0, height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem', minWidth: 0 }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 900, margin: 0, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  Ranking por Unidade
                </h3>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#475569', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', border: '1px solid #E2E8F0' }}>
                  {freqOverview.unitRecords.filter(u => u.accidents > 0).length} C/ OCORRÊNCIA
                </span>
              </div>
              <p style={{ fontSize: '0.58rem', color: '#64748B', margin: '0 0 0.4rem 0' }}>
                Classificação por severidade e taxas no período
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflow: 'hidden' }}>
                {[...freqOverview.unitRecords]
                  .sort((a, b) => b.frequencyRate - a.frequencyRate || b.severityRate - a.severityRate)
                  .slice(0, 6)
                  .map((u, idx) => (
                    <div 
                      key={u.unitName} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '0.35rem 0.65rem', 
                        background: idx < 2 && u.accidents > 0 ? '#FEF2F2' : '#F8FAFC', 
                        borderRadius: '6px', 
                        border: idx < 2 && u.accidents > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        fontSize: '0.62rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                          <span style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '50%', 
                            background: idx < 2 && u.accidents > 0 ? '#B91C1C' : '#475569', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 900, 
                            fontSize: '0.62rem', 
                            flexShrink: 0 
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ whiteSpace: 'nowrap', fontWeight: 800, color: '#0F172A', fontSize: '0.68rem' }}>
                            {u.unitName}
                          </span>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <span style={{ color: '#475569', fontSize: '0.58rem', fontWeight: 800, whiteSpace: 'nowrap', background: '#F1F5F9', padding: '1px 6px', borderRadius: '3px', border: '1px solid #E2E8F0' }}>
                            {u.accidents} acd • {u.lostDays} d
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1px' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#0284C7', background: '#F0F9FF', padding: '1px 6px', borderRadius: '3px', border: '1px solid #BAE6FD', whiteSpace: 'nowrap' }}>
                            F: {u.frequencyRate.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </span>
                          <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#D97706', background: '#FFFBEB', padding: '1px 6px', borderRadius: '3px', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>
                            G: {u.severityRate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.56rem', fontWeight: 900, color: getOITStatusColor(u.frequencyStatus), background: getOITStatusBg(u.frequencyStatus), padding: '1px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                          {u.frequencyStatus}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Bottom Banner: Parecer Técnico e Gradações Regulamentares (NBR 14280) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.35fr', gap: '0.65rem', background: '#FFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981', borderRadius: '8px', padding: '0.4rem 0.75rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                <ShieldCheck size={13} color="#10B981" />
                <span style={{ fontSize: '0.64rem', fontWeight: 900, color: '#0F172A', textTransform: 'uppercase' }}>Parecer Técnico Regulamentar (NBR 14280)</span>
              </div>
              <p style={{ fontSize: '0.56rem', color: '#475569', margin: '0 0 2px 0', lineHeight: 1.25 }}>
                {freqStory}
              </p>
              <div style={{ fontSize: '0.51rem', color: '#64748B', lineHeight: 1.2, fontStyle: 'italic' }}>
                * Ref.: NBR 14280 (parâmetros referenciais não estipulados pela OIT; ambientes laborais variam mesmo em segmentos similares). Fórmulas: TF = (N × 10⁶) / HHT | TG = (T + Débitos) × 10⁶ / HHT.
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontWeight: 900, fontSize: '0.58rem', color: '#0F172A', textTransform: 'uppercase' }}>Limites de Graduação e Cores Regulamentares:</span>
                <span style={{ fontSize: '0.52rem', fontWeight: 700, color: '#64748B' }}>Barras & Tabelas</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: '#F8FAFC', padding: '3px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.54rem', fontWeight: 800, color: '#0284C7', marginBottom: '1px' }}>TAXA DE FREQUÊNCIA (TF):</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '0.51rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Até 20,00:</span> <strong style={{ color: '#10B981' }}>Muito bom (Verde)</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• 20,1 a 40,0:</span> <strong style={{ color: '#10B981' }}>Bom (Verde)</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• 40,1 a 60,0:</span> <strong style={{ color: '#D97706' }}>Ruim (Amarelo)</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• &gt; 60,0:</span> <strong style={{ color: '#EF4444' }}>Péssima (Vermelho)</strong></div>
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '0.4rem' }}>
                  <div style={{ fontSize: '0.54rem', fontWeight: 800, color: '#D97706', marginBottom: '1px' }}>TAXA DE GRAVIDADE (TG):</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '0.51rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• Até 500:</span> <strong style={{ color: '#10B981' }}>Muito bom (Verde)</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• 500,1 a 1.000:</span> <strong style={{ color: '#10B981' }}>Bom (Verde)</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• 1.000,1 a 2.000:</span> <strong style={{ color: '#D97706' }}>Ruim (Amarelo)</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>• &gt; 2.000:</span> <strong style={{ color: '#EF4444' }}>Péssima (Vermelho)</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem', fontSize: '0.55rem', color: '#94A3B8', fontWeight: 800, marginTop: 'auto' }}>
          <span>QUADRO DE GESTÃO À VISTA — GRUPO AÇOTUBO</span>
          <span>SISTEMA DE SEGURANÇA E MEDICINA DO TRABALHO (SESMT)</span>
        </footer>
      </div>

      {/* PAGE 5: Breakdown de Causas */}
      <div className="a4-landscape">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8B5CF6', paddingBottom: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ background: '#8B5CF6', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{reportTitle} — Breakdown de Causas</h1>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Análise Comportamental, Capacitação e Perfil das Ocorrências • {filterSubtitle}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>FOLHA 05 / {String(totalPages).padStart(2, '0')}</span>
          </div>
        </header>

        <div className="grid-main">
          {renderLeftSidebar()}

          <main className="content-area">
            {/* Causal Indicators Panels */}
            {page4Stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', height: '85px' }}>
                {[
                  { label: 'Ato Inseguro', value: page4Stats.unsafeAct, icon: <AlertCircle size={14} />, color: '#EF4444' },
                  { label: 'Defic. M/E', value: page4Stats.machineDeficiency, icon: <Activity size={14} />, color: '#F59E0B' },
                  { label: 'Desvio Função', value: page4Stats.functionDeviation, icon: <ShieldCheck size={14} />, color: '#3B82F6' },
                  { label: 'Treinado', value: page4Stats.hadTraining, icon: <GraduationCap size={14} />, color: '#10B981' },
                  { label: 'Uso EPI', value: page4Stats.usedEPI, icon: <HardHat size={14} />, color: '#8B5CF6' }
                ].map((item, idx) => (
                  <div key={idx} className="panel-premium" style={{ padding: '0.4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ color: item.color, marginBottom: '2px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>{item.value?.toFixed(0)}%</div>
                    <div style={{ fontSize: '0.5rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginTop: '2px', whiteSpace: 'nowrap' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recorrência e Média por Área */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem', height: '390px' }}>
              {/* Recorrência Colaborador */}
              <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="var(--primary)" /> Recorrência por Colaborador
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflow: 'hidden' }}>
                  {employeeRanking.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', padding: '2rem', color: '#64748B', fontWeight: 700 }}>Nenhum colaborador com recorrência.</div>
                  ) : (
                    employeeRanking.slice(0, 4).map(([name, data], idx) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ width: '22px', height: '22px', background: idx === 0 ? 'var(--primary)' : '#E2E8F0', color: idx === 0 ? 'white' : '#64748B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem' }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0F172A' }}>{name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>{data.division} • RE: {data.re}</div>
                        </div>
                        <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {data.count} acidentes
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Experiência por Área */}
              <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="var(--primary)" /> Média Experiência por Área
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', flex: 1, overflow: 'hidden' }}>
                  {experienceRanking.slice(0, 5).map(({ area, avgExp }) => (
                    <div key={area}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, marginBottom: '3px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{area}</span>
                        <span style={{ color: avgExp < 1 ? '#EF4444' : '#475569', fontWeight: 900 }}>{avgExp.toFixed(1)}a</span>
                      </div>
                      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (avgExp / 10) * 100)}%`, height: '100%', background: avgExp < 1 ? '#EF4444' : 'var(--primary)' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {renderRightSidebar('Detalhes de', 'Causas', 'Fatores causais e perfil de experiência', breakdownInsights)}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem', fontSize: '0.55rem', color: '#94A3B8', fontWeight: 800 }}>
          <span>QUADRO DE GESTÃO À VISTA — GRUPO AÇOTUBO</span>
          <span>SISTEMA DE SEGURANÇA E MEDICINA DO TRABALHO (SESMT)</span>
        </footer>
      </div>

      {/* Dynamic PAGE 6+: Detalhamento Geral de Ocorrências */}
      {occurrenceChunks.map((chunk, chunkIdx) => {
        const pageNum = 6 + chunkIdx;
        const pageLabel = `FOLHA ${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;
        
        return (
          <div key={chunkIdx} className="a4-landscape">
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #6366F1', paddingBottom: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <div style={{ background: '#6366F1', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h1 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{reportTitle} — Cronologia Geral</h1>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Detalhamento Geral de Ocorrências Registradas • {filterSubtitle}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>{pageLabel}</span>
              </div>
            </header>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '0.75rem', minHeight: 0 }}>
              <div className="panel-premium" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0.85rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 900, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1', display: 'inline-block' }}></span>
                    Detalhamento de Acidentes e Afastamentos (Parte {chunkIdx + 1} de {occurrenceChunks.length})
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 9px', borderRadius: '6px' }}>
                    Ocorrências {chunkIdx * 15 + 1} a {Math.min((chunkIdx + 1) * 15, filteredAccidents.length)} de {filteredAccidents.length}
                  </span>
                </div>

                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ padding: '6px 8px', fontWeight: 900, width: '75px', color: '#475569' }}>DATA</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, width: '200px', color: '#475569' }}>COLABORADOR</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, color: '#475569' }}>CARGO</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, width: '110px', color: '#475569' }}>DIVISÃO</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, width: '110px', color: '#475569' }}>ÁREA / SETOR</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, width: '85px', color: '#475569' }}>TIPO</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, color: '#475569' }}>PARTE ATINGIDA</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, width: '55px', textAlign: 'center', color: '#475569' }}>CAT</th>
                        <th style={{ padding: '6px 8px', fontWeight: 900, width: '65px', textAlign: 'center', color: '#475569' }}>AFAST.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>Nenhum evento registrado.</td>
                        </tr>
                      ) : (
                        chunk.map((a, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', height: '29px' }}>
                            <td style={{ padding: '4px 8px', fontWeight: 700, color: '#0F172A' }}>
                              {a.date.toLocaleDateString('pt-BR')}
                            </td>
                            <td style={{ padding: '4px 8px', fontWeight: 800, color: '#0F172A' }}>
                              {a.employee}
                              {employeeCounts[a.employee] > 1 && (
                                <span style={{ marginLeft: '6px', background: '#FEE2E2', color: '#B91C1C', padding: '1.5px 4.5px', borderRadius: '4px', fontSize: '8px', fontWeight: 950 }}>
                                  {employeeCounts[a.employee]}x
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '4px 8px', color: '#475569' }}>{a.role || 'N/A'}</td>
                            <td style={{ padding: '4px 8px', color: '#475569' }}>{a.division}</td>
                            <td style={{ padding: '4px 8px', color: '#475569' }}>{a.area}</td>
                            <td style={{ padding: '4px 8px', color: '#334155' }}>
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.68rem', 
                                fontWeight: 700,
                                background: a.type?.toLowerCase().includes('trajeto') ? '#F1F5F9' : '#FEF2F2',
                                color: a.type?.toLowerCase().includes('trajeto') ? '#475569' : '#991B1B'
                              }}>
                                {a.type || 'TÍPICO'}
                              </span>
                            </td>
                            <td style={{ padding: '4px 8px', color: '#475569' }}>{a.partAffected || '—'}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                              <span style={{ 
                                padding: '1.5px 5px', 
                                borderRadius: '4px', 
                                fontSize: '0.66rem', 
                                fontWeight: 800,
                                background: a.hasCat ? '#ECFDF5' : '#F8FAFC',
                                color: a.hasCat ? '#059669' : '#94A3B8',
                                border: '1px solid ' + (a.hasCat ? '#A7F3D0' : '#E2E8F0')
                              }}>
                                {a.hasCat ? (a.cat && a.cat.length > 3 ? a.cat : 'SIM') : 'NÃO'}
                              </span>
                            </td>
                            <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 900, color: a.lostDays > 0 ? '#B91C1C' : '#64748B' }}>
                              {a.lostDays > 0 ? (
                                <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1.5px 5px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                  {a.lostDays}d
                                </span>
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>0d</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <footer style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem', fontSize: '0.55rem', color: '#94A3B8', fontWeight: 800 }}>
              <span>QUADRO DE GESTÃO À VISTA — GRUPO AÇOTUBO</span>
              <span>SISTEMA DE SEGURANÇA E MEDICINA DO TRABALHO (SESMT)</span>
            </footer>
          </div>
        );
      })}

    </div>
  );
};
