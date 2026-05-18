import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, CartesianGrid, ReferenceLine
} from 'recharts';
import { 
  Printer, ArrowLeft, ShieldCheck, Clock, Target, FileText, 
  AlertCircle, TrendingUp, Calendar, Trophy, Zap, Users, Activity, HardHat, GraduationCap, ClipboardList
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

interface LandscapePrintViewProps {
  accidents: Accident[];
  selectedYears: number[];
  filterDivision: string;
  filterManager: string;
  filterArea: string;
  onBack: () => void;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const LandscapePrintView: React.FC<LandscapePrintViewProps> = ({
  accidents,
  selectedYears,
  filterDivision,
  filterManager,
  filterArea,
  onBack
}) => {
  // 1. Filtered Accidents (only print those matching filters, as requested in users first request)
  const filteredAccidents = useMemo(() => {
    return accidents.filter(a => {
      const matchesYear = selectedYears.includes(a.year);
      const matchesDivision = filterDivision === 'ALL' || a.division === filterDivision;
      const matchesManager = filterManager === 'ALL' || a.manager === filterManager;
      const matchesArea = filterArea === 'ALL' || a.area === filterArea;
      return matchesYear && matchesDivision && matchesManager && matchesArea;
    });
  }, [accidents, selectedYears, filterDivision, filterManager, filterArea]);

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

  const occurrenceInsights = useMemo(() => [
    {
      title: 'Total de Ocorrências',
      text: `${filteredAccidents.length} acidentes registrados no período trienal analisado.`,
      type: 'info' as const
    },
    {
      title: 'Dias Perdidos',
      text: `${filteredAccidents.reduce((sum, a) => sum + a.lostDays, 0)} dias totais de afastamento acumulados no período.`,
      type: 'danger' as const
    },
    {
      title: 'Gravidade de Eventos',
      text: `${Math.round((filteredAccidents.filter(a => a.lostDays > 0).length / Math.max(filteredAccidents.length, 1)) * 100)}% dos acidentes resultaram em afastamento.`,
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
    for (let i = 0; i < sorted.length; i += 12) {
      chunks.push(sorted.slice(i, i + 12));
    }
    return chunks;
  }, [filteredAccidents]);

  const totalPages = useMemo(() => {
    return 4 + occurrenceChunks.length;
  }, [occurrenceChunks]);

  const employeeCounts = useMemo(() => {
    return filteredAccidents.reduce((acc, a) => {
      acc[a.employee] = (acc[a.employee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredAccidents]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#F8FAFC';
    if (count <= 1) return '#FEE2E2';
    if (count <= 2) return '#FCA5A5';
    if (count <= 4) return '#F87171';
    if (count <= 6) return '#EF4444';
    return '#B91C1C';
  };

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
          <div key={year} className="year-card" style={{ background: '#FFF', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '1px', padding: '0.35rem 0.55rem' }}>
            <h3 style={{ margin: 0, color: '#64748B', fontWeight: 800 }}>{year}</h3>
            <div className="count" style={{ lineHeight: 1, margin: '2px 0 1px 0' }}>{s.total}</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>acidentes</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#475569', marginTop: '1px' }}>média {s.avgPerMonth}/mês</div>
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
                {filterDivision === 'ALL' ? 'Grupo Açotubo' : filterDivision} • {filterArea === 'ALL' ? 'Todas as Áreas' : filterArea} • Anos: {selectedYears.join(', ')}
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
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '1px' }}>acidentes registrados</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{s.total}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569' }}>• méd. {s.avgPerMonth}/mês</span>
                  </div>
                </div>
              );
            })}
            
            {/* Streak de dias sem acidentes */}
            <div className="panel-premium" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 1rem', borderLeft: '5px solid #10B981', background: '#FFF' }}>
              <div>
                <h3 style={{ margin: 0, color: '#64748B', fontWeight: 800, fontSize: '0.75rem' }}>DIAS SEM ACIDENTES</h3>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '1px' }}>streak atual de segurança</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{safetyRecords.currentStreak}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569' }}>dias</span>
              </div>
            </div>
          </div>

          {/* Centro: Gráficos Lado a Lado (Comparativo Mensal e Mapa de Calor) */}
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
                    <Tooltip cursor={{ fill: '#F1F5F9' }} />
                    <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ fontSize: 8, paddingBottom: 3 }} />
                    {selectedYears.map((year, idx) => {
                      const colors = ['#B91C1C', '#94A3B8', '#0F172A', '#3B82F6', '#10B981'];
                      return (
                        <Bar 
                          key={year}
                          dataKey={String(year)} 
                          fill={colors[idx % colors.length]} 
                          radius={[3, 3, 0, 0]} 
                          barSize={selectedYears.length > 3 ? 8 : 12}
                          label={{ position: 'top', fill: '#64748B', fontSize: 8, fontWeight: 700 }}
                        />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mapa de Calor */}
            <div className="panel-premium heatmap-panel" style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text)', margin: '0 0 0.15rem 0', textAlign: 'center' }}>Mapa de Calor (Intensidade)</h2>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0', textAlign: 'center' }}>Concentração temporal de ocorrências por mês/ano</p>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <table className="heatmap-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '2px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '38px', minWidth: '38px' }}></th>
                      {MONTH_NAMES.map(m => <th key={m} style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>{m.toUpperCase()}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedYears.map(year => (
                      <tr key={year}>
                        <td style={{ fontSize: '9px', fontWeight: 900, color: '#334155', verticalAlign: 'middle', textAlign: 'center', padding: '2px 0', width: '38px', minWidth: '38px' }}>{year}</td>
                        {stats[year]?.monthly.map((m, i) => (
                          <td 
                            key={i} 
                            style={{ 
                              background: getHeatmapColor(m.count), 
                              color: m.count === 0 ? '#94A3B8' : m.count > 2 ? '#FFFFFF' : '#B91C1C',
                              height: '20px',
                              borderRadius: '3px',
                              fontSize: '9px',
                              fontWeight: 900,
                              textAlign: 'center',
                              verticalAlign: 'middle'
                            }}
                          >
                            {m.count > 0 ? m.count : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '0.4rem', fontSize: '7px', color: 'var(--text-muted)', fontWeight: 800 }}>
                  <span>Menos acidentes</span>
                  {[0, 1, 2, 4, 6].map(c => <div key={c} style={{ width: 14, height: 7, borderRadius: 1.5, backgroundColor: getHeatmapColor(c) }}></div>)}
                  <span>Mais acidentes</span>
                </div>
              </div>
            </div>
          </div>

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
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Identificação de Padrões por Período, Dia e Horários</div>
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
                        <Tooltip />
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
                      <Tooltip />
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
                    <Tooltip />
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
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Recordes de Dias Sem Acidentes e Cronologia de Incidentes</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>FOLHA 03 / {String(totalPages).padStart(2, '0')}</span>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: 'calc(100% - 60px)', marginTop: '0.65rem' }}>
          {/* Extremo Superior: Year Cards + Safety KPIs */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Year Cards */}
            {selectedYears.slice(0, 3).map(year => {
              const s = stats[year];
              if (!s) return null;
              return (
                <div key={year} className="panel-premium" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 1rem', borderLeft: '4px solid var(--primary)', background: '#FFF' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#64748B', fontWeight: 800, fontSize: '0.75rem' }}>ANO {year}</h3>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>acidentes</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{s.total}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569' }}>({s.avgPerMonth}/m)</span>
                  </div>
                </div>
              );
            })}

            {/* KPI 1 */}
            <div className="panel-premium" style={{ flex: 1, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Target size={12} color="#10B981" /> <span>Sem Ocorrências</span>
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '1px' }}>dias atuais</div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{safetyRecords.currentStreak}</div>
            </div>

            {/* KPI 2 */}
            <div className="panel-premium" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 1rem', background: '#FFF' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Trophy size={12} color="#F59E0B" /> <span>Recorde DSA</span>
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '1px' }}>histórico</div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{safetyRecords.historicalRecord}</div>
            </div>

            {/* KPI 3 */}
            <div className="panel-premium" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 1rem', background: '#FFF' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Calendar size={12} color="#3B82F6" /> <span>Intervalo DSA</span>
                </div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginTop: '1px' }}>média dias</div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                {safetyRecords.intervals.length > 0 
                  ? Math.round(safetyRecords.intervals.reduce((sum, item) => sum + item.days, 0) / safetyRecords.intervals.length)
                  : '-'}
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
                  <Tooltip />
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

      {/* PAGE 4: Breakdown de Causas */}
      <div className="a4-landscape">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8B5CF6', paddingBottom: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ background: '#8B5CF6', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{reportTitle} — Breakdown de Causas</h1>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Análise Comportamental, Capacitação e Perfil das Ocorrências</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>FOLHA 04 / {String(totalPages).padStart(2, '0')}</span>
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

      {/* Dynamic PAGE 5+: Detalhamento Geral de Ocorrências */}
      {occurrenceChunks.map((chunk, chunkIdx) => {
        const pageNum = 5 + chunkIdx;
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
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>Detalhamento Geral de Ocorrências Registradas</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>{pageLabel}</span>
              </div>
            </header>

            <div className="grid-main">
              {renderLeftSidebar()}

              <main className="content-area">
                <div className="panel-premium" style={{ height: '490px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 900, margin: '0 0 0.6rem 0' }}>Detalhamento de Acidentes e Afastamentos (Parte {chunkIdx + 1})</h3>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '6px 8px', fontWeight: 900, width: '75px' }}>DATA</th>
                          <th style={{ padding: '6px 8px', fontWeight: 900 }}>COLABORADOR</th>
                          <th style={{ padding: '6px 8px', fontWeight: 900 }}>CARGO</th>
                          <th style={{ padding: '6px 8px', fontWeight: 900 }}>ÁREA</th>
                          <th style={{ padding: '6px 8px', fontWeight: 900 }}>TIPO</th>
                          <th style={{ padding: '6px 8px', fontWeight: 900, width: '50px', textAlign: 'center' }}>AFAS.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chunk.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhum evento registrado.</td>
                          </tr>
                        ) : (
                          chunk.map((a, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', height: '28px' }}>
                              <td style={{ padding: '4px 8px', fontWeight: 700 }}>{a.date.toLocaleDateString('pt-BR')}</td>
                              <td style={{ padding: '4px 8px', fontWeight: 800 }}>
                                {a.employee}
                                {employeeCounts[a.employee] > 1 && (
                                  <span style={{ marginLeft: '6px', background: '#FEE2E2', color: '#B91C1C', padding: '1.5px 4.5px', borderRadius: '4px', fontSize: '8px', fontWeight: 950 }}>
                                    {employeeCounts[a.employee]}x
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '4px 8px', color: '#475569' }}>{a.role}</td>
                              <td style={{ padding: '4px 8px', color: '#475569' }}>{a.area}</td>
                              <td style={{ padding: '4px 8px' }}>{a.type}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 900, color: a.lostDays > 0 ? '#B91C1C' : '#475569' }}>
                                {a.lostDays > 0 ? `${a.lostDays}d` : '0d'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </main>

              {renderRightSidebar('Detalhamento de', 'Casos', 'Resumo de dias de afastamento e gravidade', occurrenceInsights)}
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
