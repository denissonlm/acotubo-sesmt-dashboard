import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  AlertCircle, TrendingUp, Calendar, ShieldCheck, Upload, Monitor, Gauge, 
  FileSpreadsheet, Clock, ChevronRight, ChevronLeft, ArrowLeft, ArrowUp, 
  Users, ExternalLink, Layers, Key 
} from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights, generateTemporalInsights } from '../utils/dataLoader';
import { motion } from 'framer-motion';
import { LOGO_BASE64 } from '../constants';
import { TemporalAnalysis } from './TemporalAnalysis';
import { SafetyManagement } from './SafetyManagement';
import { Breakdown } from './Breakdown';
import { FrequencySeverityTab } from './FrequencySeverityTab';
import { generateSafetyInsights } from '../utils/dataLoader';
import { TokenExpirationModal, checkTokenNeedsRenewal } from './TokenExpirationModal';

interface DashboardProps {
  accidents: Accident[];
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  filterDivision: string;
  onDivisionChange: (val: string) => void;
  filterManager: string;
  onManagerChange: (val: string) => void;
  filterArea: string;
  onAreaChange: (val: string) => void;
  onReset: () => void;
  onLandscapePrint: () => void;
  catOnly?: boolean;
  onToggleCatOnly?: () => void;
  dataSource?: 'supabase' | 'local' | 'none';
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  accidents, 
  selectedYears, 
  onYearsChange,
  filterDivision,
  onDivisionChange,
  filterManager,
  onManagerChange,
  filterArea,
  onAreaChange,
  onReset, 
  onLandscapePrint,
  catOnly = false,
  onToggleCatOnly,
  dataSource = 'none'
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'temporal' | 'safety' | 'breakdown' | 'frequency_severity'>('monthly');
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [monthlyMetric, setMonthlyMetric] = useState<'accidents' | 'lostDays'>('accidents');
  const [drillLevel, setDrillLevel] = useState<'yearly' | 'monthly' | 'daily'>('monthly');
  const [drillYear, setDrillYear] = useState<number>(() => selectedYears[0] || new Date().getFullYear());
  const [drillMonth, setDrillMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const tokenRenewalInfo = useMemo(() => checkTokenNeedsRenewal(), []);

  // Exibe popup automaticamente faltando 7 dias (ou se expirado), respeitando dispensa no dia
  useEffect(() => {
    if (tokenRenewalInfo.isExpiringSoon || tokenRenewalInfo.isExpired) {
      const todayStr = new Date().toISOString().split('T')[0];
      const dismissed = localStorage.getItem('token_renewal_dismissed_date');
      if (dismissed !== todayStr) {
        setIsTokenModalOpen(true);
      }
    }
  }, [tokenRenewalInfo]);

  useEffect(() => {
    if (selectedYears.length > 0 && !selectedYears.includes(drillYear)) {
      setDrillYear(selectedYears[0]);
    }
  }, [selectedYears, drillYear]);

  const filteredAccidents = useMemo(() => {
    return accidents.filter(a => {
      const matchesYear = selectedYears.includes(a.year);
      const matchesDivision = filterDivision === 'ALL' || a.division === filterDivision;
      const matchesManager = filterManager === 'ALL' || a.manager === filterManager;
      const matchesArea = filterArea === 'ALL' || a.area === filterArea;
      return matchesYear && matchesDivision && matchesManager && matchesArea;
    });
  }, [accidents, selectedYears, filterDivision, filterManager, filterArea]);

  const stats = useMemo(() => {
    return calculateStats(filteredAccidents, selectedYears);
  }, [filteredAccidents, selectedYears]);

  const monthlyInsights = useMemo(() => {
    return generateInsights(filteredAccidents, selectedYears);
  }, [filteredAccidents, selectedYears]);

  const temporalInsights = useMemo(() => {
    return generateTemporalInsights(filteredAccidents);
  }, [filteredAccidents]);

  const safetyInsights = useMemo(() => {
    return generateSafetyInsights(filteredAccidents);
  }, [filteredAccidents]);

  const breakdownInsights = useMemo(() => [
    { 
      title: 'Perfil de Risco', 
      text: `Média de experiência de ${(filteredAccidents.reduce((s,a) => s + (a.experienceYears + a.experienceMonths/12), 0) / Math.max(filteredAccidents.length, 1)).toFixed(1)} anos nos acidentados.`,
      type: 'info'
    },
    { 
      title: 'Fator Predominante', 
      text: `${Math.round((filteredAccidents.filter(a => a.unsafeAct).length / Math.max(filteredAccidents.length, 1)) * 100)}% das causas ligadas a Ato Inseguro.`,
      type: 'danger'
    },
    { 
      title: 'Conformidade EPI', 
      text: `${Math.round((filteredAccidents.filter(a => a.usedEPI).length / Math.max(filteredAccidents.length, 1)) * 100)}% utilizavam EPI no momento.`,
      type: 'success'
    },
    { 
      title: 'Ação Necessária', 
      text: `${filteredAccidents.filter(a => a.lostDays > 30).length} casos críticos com mais de 30 dias de afastamento.`,
      type: 'warning'
    }
  ], [filteredAccidents]);

  const currentInsights = useMemo(() => {
    if (activeTab === 'monthly') return monthlyInsights;
    if (activeTab === 'temporal') return temporalInsights;
    if (activeTab === 'safety') return safetyInsights;
    return breakdownInsights;
  }, [activeTab, monthlyInsights, temporalInsights, safetyInsights, breakdownInsights]);
  
  const allAvailableYears = useMemo(() => Array.from(new Set(accidents.map(a => a.year))).sort((a, b) => b - a), [accidents]);
  
  const uniqueDivisions = useMemo(() => Array.from(new Set(accidents.map(a => a.division))).sort(), [accidents]);
  const uniqueManagers = useMemo(() => Array.from(new Set(accidents.map(a => a.manager))).sort(), [accidents]);
  const uniqueAreas = useMemo(() => Array.from(new Set(accidents.map(a => a.area))).sort(), [accidents]);

  const yearlyChartData = useMemo(() => {
    const years = [...selectedYears].sort((a, b) => a - b);
    return years.map(year => {
      const s = stats[year];
      return {
        year: String(year),
        yearNum: year,
        value: monthlyMetric === 'accidents' ? (s?.total || 0) : (s?.totalLostDays || 0),
        total: s?.total || 0,
        totalLostDays: s?.totalLostDays || 0,
        avgPerMonth: s?.avgPerMonth || 0
      };
    });
  }, [selectedYears, stats, monthlyMetric]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthData: any = { 
        month: MONTH_NAMES[i],
        monthIndex: i + 1 
      };
      selectedYears.forEach(year => {
        const m = stats[year]?.monthly[i];
        monthData[year] = monthlyMetric === 'accidents' 
          ? (m?.count || 0) 
          : (m?.lostDays || 0);
      });
      return monthData;
    });
  }, [stats, selectedYears, monthlyMetric]);

  const dailyChartData = useMemo(() => {
    const numDays = new Date(drillYear, drillMonth, 0).getDate();
    return Array.from({ length: numDays }, (_, i) => {
      const dayNum = i + 1;
      const dayAccidents = filteredAccidents.filter(a => {
        return a.year === drillYear && a.month === drillMonth && a.date.getDate() === dayNum;
      });
      const count = dayAccidents.length;
      const lostDays = dayAccidents.reduce((sum, a) => sum + (a.lostDays || 0), 0);
      return {
        day: String(dayNum).padStart(2, '0'),
        dayNum,
        value: monthlyMetric === 'accidents' ? count : lostDays,
        count,
        lostDays,
        accidents: dayAccidents,
        hasMultiple: count > 1
      };
    });
  }, [filteredAccidents, drillYear, drillMonth, monthlyMetric]);

  const monthAccidentsList = useMemo(() => {
    const list = filteredAccidents.filter(a => a.year === drillYear && a.month === drillMonth);
    if (selectedDay !== null) {
      return list.filter(a => a.date.getDate() === selectedDay);
    }
    return [...list].sort((a, b) => a.date.getDate() - b.date.getDate());
  }, [filteredAccidents, drillYear, drillMonth, selectedDay]);

  // Handler robusto para Drill-Down a partir do Gráfico Anual (Drill-Up)
  const handleYearlyChartClick = (e: any) => {
    if (!e) return;
    let targetYear: number | null = null;

    if (e.activePayload && e.activePayload.length > 0) {
      targetYear = e.activePayload[0].payload?.yearNum || Number(e.activePayload[0].payload?.year);
    }
    const rawIdx = e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null 
      ? e.activeTooltipIndex 
      : e.activeIndex;
    if (!targetYear && rawIdx !== undefined && rawIdx !== null) {
      const idx = Number(rawIdx);
      if (!isNaN(idx) && yearlyChartData[idx]) {
        targetYear = yearlyChartData[idx].yearNum;
      }
    }
    if (!targetYear && e.activeLabel) {
      const parsed = Number(e.activeLabel);
      if (!isNaN(parsed) && parsed > 2000) {
        targetYear = parsed;
      }
    }

    if (targetYear) {
      setDrillYear(targetYear);
      setDrillLevel('monthly');
      setSelectedDay(null);
    }
  };

  // Handler robusto para Drill-Down a partir do Gráfico Mensal
  const handleMonthlyChartClick = (e: any) => {
    if (!e) return;
    let targetMonth: number | null = null;
    let targetYear: number | null = null;

    // 1. activePayload (se disponível)
    if (e.activePayload && e.activePayload.length > 0) {
      const p = e.activePayload[0];
      targetMonth = p.payload?.monthIndex || (MONTH_NAMES.findIndex(m => m.toLowerCase() === String(e.activeLabel).toLowerCase()) + 1);
      if (p.dataKey) {
        const parsedYear = Number(p.dataKey);
        if (!isNaN(parsedYear) && parsedYear > 2000) targetYear = parsedYear;
      }
    }

    // 2. activeTooltipIndex / activeIndex (Recharts 3.x)
    const rawIdx = e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null 
      ? e.activeTooltipIndex 
      : e.activeIndex;
    if (!targetMonth && rawIdx !== undefined && rawIdx !== null) {
      const idx = Number(rawIdx);
      if (!isNaN(idx) && idx >= 0 && idx < 12) {
        targetMonth = idx + 1;
      }
    }

    // 3. activeLabel ("Jan", "Fev", etc.)
    if (!targetMonth && e.activeLabel) {
      const found = MONTH_NAMES.findIndex(m => m.toLowerCase() === String(e.activeLabel).toLowerCase());
      if (found !== -1) {
        targetMonth = found + 1;
      }
    }

    // Identificar o ano clicado (dataKey)
    if (e.activeDataKey) {
      const parsedYear = Number(e.activeDataKey);
      if (!isNaN(parsedYear) && parsedYear > 2000 && selectedYears.includes(parsedYear)) {
        targetYear = parsedYear;
      }
    }

    if (targetMonth && targetMonth >= 1 && targetMonth <= 12) {
      setDrillMonth(targetMonth);
      if (targetYear) {
        setDrillYear(targetYear);
      } else if (!selectedYears.includes(drillYear) && selectedYears.length > 0) {
        setDrillYear(selectedYears[0]);
      }
      setDrillLevel('daily');
      setSelectedDay(null);
    }
  };

  // Handler robusto para Drill-Down no Gráfico Diário
  const handleDailyChartClick = (e: any) => {
    if (!e) return;
    let targetDay: number | null = null;

    if (e.activePayload && e.activePayload.length > 0) {
      targetDay = e.activePayload[0].payload?.dayNum;
    }
    const rawIdx = e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null 
      ? e.activeTooltipIndex 
      : e.activeIndex;
    if (targetDay === null && rawIdx !== undefined && rawIdx !== null) {
      const idx = Number(rawIdx);
      if (!isNaN(idx) && dailyChartData[idx]) {
        targetDay = dailyChartData[idx].dayNum;
      }
    }
    if (targetDay === null && e.activeLabel) {
      const parsed = Number(e.activeLabel);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
        targetDay = parsed;
      }
    }

    if (targetDay !== null && targetDay !== undefined) {
      setSelectedDay(prev => prev === targetDay ? null : targetDay);
    }
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#F1F5F9';
    if (count <= 2) return '#FEE2E2';
    if (count <= 4) return '#FCA5A5';
    if (count <= 6) return '#EF4444';
    if (count <= 8) return '#B91C1C';
    return '#7F1D1D';
  };

  const yearsLabel = useMemo(() => {
    const count = selectedYears.length;
    switch (count) {
      case 1: return { adj: 'anual', noun: 'ano' };
      case 2: return { adj: 'bienal', noun: 'biênio' };
      case 3: return { adj: 'trienal', noun: 'triênio' };
      case 4: return { adj: 'quadrienal', noun: 'quadriênio' };
      case 5: return { adj: 'quinquenal', noun: 'quinquênio' };
      case 6: return { adj: 'sexenal', noun: 'sexênio' };
      default: return { adj: 'estatística', noun: 'período' };
    }
  }, [selectedYears]);

  const dashboardTitle = useMemo(() => {
    const adj = yearsLabel.adj.charAt(0).toUpperCase() + yearsLabel.adj.slice(1);
    return `${adj} de Acidentes`;
  }, [yearsLabel]);

  return (
    <div className="dashboard">
      <header className="header no-print" style={{ padding: '0.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)', padding: '0.75rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(185, 28, 28, 0.2)' }}>
            <img src={LOGO_BASE64} alt="Logo" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 900 }}>{dashboardTitle}</h1>
              {dataSource === 'supabase' && (
                <button
                  onClick={() => setIsTokenModalOpen(true)}
                  title="Supabase Conectado - Clique para ver dados de acesso e renovação do Token MCP"
                  style={{ 
                    fontSize: '0.68rem', 
                    background: tokenRenewalInfo.isExpired 
                      ? 'rgba(239, 68, 68, 0.2)' 
                      : tokenRenewalInfo.isExpiringSoon 
                      ? 'rgba(245, 158, 11, 0.2)' 
                      : 'rgba(16, 185, 129, 0.15)', 
                    color: tokenRenewalInfo.isExpired 
                      ? '#f87171' 
                      : tokenRenewalInfo.isExpiringSoon 
                      ? '#fbbf24' 
                      : '#34d399', 
                    border: '1px solid ' + (tokenRenewalInfo.isExpired 
                      ? 'rgba(239, 68, 68, 0.4)' 
                      : tokenRenewalInfo.isExpiringSoon 
                      ? 'rgba(245, 158, 11, 0.4)' 
                      : 'rgba(16, 185, 129, 0.3)'), 
                    padding: '3px 10px', 
                    borderRadius: '12px', 
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s'
                  }}
                >
                  {tokenRenewalInfo.isExpired ? (
                    <>⚠️ Token MCP Expirado</>
                  ) : tokenRenewalInfo.isExpiringSoon ? (
                    <>⚠️ Renovar Token ({tokenRenewalInfo.daysRemaining}d)</>
                  ) : (
                    <>☁️ Supabase Conectado <Key size={11} style={{ opacity: 0.7 }} /></>
                  )}
                </button>
              )}
              {dataSource === 'local' && (
                <span style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  📁 Local
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>Grupo Açotubo</p>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {allAvailableYears.map(year => (
              <button
                key={year}
                onClick={() => {
                  const newYears = selectedYears.includes(year)
                    ? selectedYears.filter(y => y !== year)
                    : [...selectedYears, year];
                  onYearsChange(newYears.sort((a, b) => a - b));
                }}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid ' + (selectedYears.includes(year) ? 'var(--primary)' : '#334155'),
                  background: selectedYears.includes(year) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedYears.includes(year) ? '0 4px 12px rgba(185, 28, 28, 0.3)' : 'none'
                }}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setIsBreakdownModalOpen(true)}
            className="btn-action detail" 
            title="Detalhamento Geral de Ocorrências (Base Completa)"
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1.5px solid rgba(59, 130, 246, 0.45)',
              color: '#60A5FA',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              width: '42px',
              height: '42px',
              padding: 0,
              borderRadius: '12px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.08)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.6)';
              e.currentTarget.style.borderColor = '#60A5FA';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.45)';
              e.currentTarget.style.color = '#60A5FA';
              e.currentTarget.style.background = 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)';
            }}
          >
            <FileSpreadsheet size={22} color="currentColor" style={{ flexShrink: 0 }} />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 900,
              padding: '1px 5px',
              borderRadius: '999px',
              border: '2px solid #0F172A',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              pointerEvents: 'none'
            }}>
              {filteredAccidents.length}
            </span>
          </button>
          <button 
            onClick={onReset} 
            className="btn-pdf" 
            title="Reenviar Excel"
            style={{ background: '#334155', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
          >
            <Upload size={20} />
          </button>
          <button 
            onClick={onLandscapePrint} 
            className="btn-pdf" 
            title="Gerar Quadro Paisagem (Gestão à Vista)"
            style={{ background: '#10B981', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
          >
            <Monitor size={22} />
          </button>
          {onToggleCatOnly && (
            <button
              type="button"
              role="switch"
              aria-checked={catOnly}
              onClick={onToggleCatOnly}
              style={{
                position: 'relative',
                width: '42px',
                height: '24px',
                borderRadius: '999px',
                background: catOnly ? '#10B981' : '#334155',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                transition: 'all 0.25s ease',
                boxShadow: catOnly ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  transform: catOnly ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </button>
          )}
        </div>
      </header>

      <div className="filters-bar no-print" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {activeTab !== 'frequency_severity' ? (
            <>
              <div className="filter-group">
                <label><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', marginRight: '8px' }}></div>Unidade</label>
                <select value={filterDivision} onChange={e => onDivisionChange(e.target.value)}>
                  <option value="ALL">Todas as Unidades</option>
                  {uniqueDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', marginRight: '8px' }}></div>Superior Direto</label>
                <select value={filterManager} onChange={e => onManagerChange(e.target.value)}>
                  <option value="ALL">Todos os Superiores</option>
                  {uniqueManagers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', marginRight: '8px' }}></div>Área</label>
                <select value={filterArea} onChange={e => onAreaChange(e.target.value)}>
                  <option value="ALL">Todas as Áreas</option>
                  {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
              <span>Controle NBR 14280 / OIT • Filtros de Período e Unidade (Fonte) no painel abaixo</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.4rem', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('monthly')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'monthly' ? 'white' : 'transparent',
              color: activeTab === 'monthly' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'monthly' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Visão Mensal
          </button>
          <button
            onClick={() => setActiveTab('temporal')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'temporal' ? 'white' : 'transparent',
              color: activeTab === 'temporal' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'temporal' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Análise Temporal
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'safety' ? 'white' : 'transparent',
              color: activeTab === 'safety' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'safety' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Gestão de Segurança
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'breakdown' ? 'white' : 'transparent',
              color: activeTab === 'breakdown' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'breakdown' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileSpreadsheet size={15} />
            Breakdown
          </button>
          <button
            onClick={() => setActiveTab('frequency_severity')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'frequency_severity' ? 'white' : 'transparent',
              color: activeTab === 'frequency_severity' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'frequency_severity' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Gauge size={15} />
            Frequência e Gravidade
          </button>
        </div>
      </div>

      {activeTab === 'frequency_severity' ? (
        <FrequencySeverityTab accidents={filteredAccidents} availableYears={allAvailableYears} />
      ) : (
        <>
          <div className="grid-main">
            <aside className="panorama-panel">
          <h2 style={{fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem'}}>Panorama Geral</h2>
          {selectedYears.map((year, i) => {
            const s = stats[year];
            if (!s) return null;
            return (
              <motion.div 
                key={year} 
                className="year-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: '1rem 0.85rem',
                  background: 'white',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  marginBottom: '0.85rem'
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', textAlign: 'center', color: '#64748B', fontSize: '0.85rem', fontWeight: 800 }}>ANO {year}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center', width: '100%' }}>
                  <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: '0.4rem' }}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.1 }}>{s.total}</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, marginTop: '3px', textTransform: 'uppercase' }}>acidentes</div>
                  </div>
                  <div style={{ paddingLeft: '0.4rem' }}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#334155', lineHeight: 1.1 }}>{s.totalLostDays}</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, marginTop: '3px', textTransform: 'uppercase' }}>dias perdidos</div>
                  </div>
                </div>

                <div style={{ marginTop: '0.65rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.45rem', fontSize: '0.68rem', color: '#64748B', textAlign: 'center', fontWeight: 700, width: '100%' }}>
                  média {s.avgPerMonth} acid/mês
                </div>
              </motion.div>
            );
          })}

          <div style={{marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'transparent', border: '1px dashed #CBD5E1', borderRadius: '0.5rem', color: '#64748B', fontSize: '0.65rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem'}}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ lineHeight: 1.4 }}>
              <strong>Nota Técnica:</strong> Os Acidentes das Filiais foram computados a partir de outubro de 2025.
            </span>
          </div>
        </aside>

        <main className="content-area">
          {activeTab === 'monthly' ? (
            <>
              {/* Monthly View Content with Drill-Up & Drill-Down */}
              <div className="panel-premium">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    {/* Breadcrumbs de Navegação Multinível */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '6px' }}>
                      <button
                        type="button"
                        onClick={() => { setDrillLevel('yearly'); setSelectedDay(null); }}
                        style={{
                          background: drillLevel === 'yearly' ? 'rgba(185, 28, 28, 0.1)' : 'transparent',
                          color: drillLevel === 'yearly' ? 'var(--primary)' : '#64748B',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: drillLevel === 'yearly' ? 900 : 700,
                          transition: 'all 0.2s'
                        }}
                      >
                        Visão Anual
                      </button>
                      <ChevronRight size={13} color="#94A3B8" />
                      <button
                        type="button"
                        onClick={() => { setDrillLevel('monthly'); setSelectedDay(null); }}
                        style={{
                          background: drillLevel === 'monthly' ? 'rgba(185, 28, 28, 0.1)' : 'transparent',
                          color: drillLevel === 'monthly' ? 'var(--primary)' : '#64748B',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: drillLevel === 'monthly' ? 900 : 700,
                          transition: 'all 0.2s'
                        }}
                      >
                        Visão Mensal
                      </button>
                      {drillLevel === 'daily' && (
                        <>
                          <ChevronRight size={13} color="#94A3B8" />
                          <span
                            style={{
                              background: 'rgba(185, 28, 28, 0.1)',
                              color: 'var(--primary)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 900
                            }}
                          >
                            Diário ({MONTH_NAMES[drillMonth - 1]}/{drillYear})
                          </span>
                        </>
                      )}
                    </div>

                    <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--text)', fontSize: '1.25rem' }}>
                      {drillLevel === 'yearly' && (
                        <>Comparativo <span style={{ color: 'var(--primary)' }}>Anual</span> (Drill-Up)</>
                      )}
                      {drillLevel === 'monthly' && (
                        <>Comparativo <span style={{ color: 'var(--primary)' }}>Mensal</span></>
                      )}
                      {drillLevel === 'daily' && (
                        <>Detalhamento <span style={{ color: 'var(--primary)' }}>Diário</span> • {MONTH_NAMES[drillMonth - 1]} de {drillYear}</>
                      )}
                    </h2>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {drillLevel === 'yearly' && (
                        monthlyMetric === 'accidents'
                          ? 'Volume total consolidado de acidentes por ano • Clique em um ano para abrir os meses'
                          : 'Total consolidado de dias de afastamento por ano • Clique em um ano para abrir os meses'
                      )}
                      {drillLevel === 'monthly' && (
                        monthlyMetric === 'accidents' 
                          ? `Distribuição mensal de acidentes no ${yearsLabel.noun} selecionado • Clique em uma barra para detalhar os dias`
                          : `Distribuição mensal de dias de afastamento no ${yearsLabel.noun} selecionado • Clique em uma barra para detalhar os dias`
                      )}
                      {drillLevel === 'daily' && (
                        monthlyMetric === 'accidents'
                          ? `Ocorrências dia a dia em ${MONTH_NAMES[drillMonth - 1]}/${drillYear} • Clique em um dia para inspecionar os colaboradores`
                          : `Dias de afastamento dia a dia em ${MONTH_NAMES[drillMonth - 1]}/${drillYear} • Clique em um dia para inspecionar os colaboradores`
                      )}
                    </p>
                  </div>

                  {/* Controles do Cabeçalho: Navegação Drill & Toggle Métrica */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {drillLevel === 'monthly' && (
                      <button
                        type="button"
                        onClick={() => { setDrillLevel('yearly'); setSelectedDay(null); }}
                        title="Subir para visão comparativa entre anos"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#475569',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ArrowUp size={13} />
                        <span>Comparar Anos (Drill Up)</span>
                      </button>
                    )}

                    {drillLevel === 'yearly' && (
                      <button
                        type="button"
                        onClick={() => { setDrillLevel('monthly'); setSelectedDay(null); }}
                        title="Descer para visão comparativa entre meses"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#475569',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ArrowLeft size={13} />
                        <span>Voltar aos Meses</span>
                      </button>
                    )}

                    {drillLevel === 'daily' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (drillMonth === 1) {
                              setDrillMonth(12);
                              setDrillYear(prev => prev - 1);
                            } else {
                              setDrillMonth(prev => prev - 1);
                            }
                            setSelectedDay(null);
                          }}
                          title="Mês Anterior"
                          style={{
                            padding: '0.4rem 0.5rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#1E293B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <select
                          value={drillMonth}
                          onChange={(e) => { setDrillMonth(Number(e.target.value)); setSelectedDay(null); }}
                          style={{
                            padding: '0.4rem 0.55rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#1E293B',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          {MONTH_NAMES.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>

                        <select
                          value={drillYear}
                          onChange={(e) => { setDrillYear(Number(e.target.value)); setSelectedDay(null); }}
                          style={{
                            padding: '0.4rem 0.55rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#1E293B',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          {allAvailableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            if (drillMonth === 12) {
                              setDrillMonth(1);
                              setDrillYear(prev => prev + 1);
                            } else {
                              setDrillMonth(prev => prev + 1);
                            }
                            setSelectedDay(null);
                          }}
                          title="Próximo Mês"
                          style={{
                            padding: '0.4rem 0.5rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#1E293B',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <ChevronRight size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDrillLevel('monthly'); setSelectedDay(null); }}
                          title="Voltar para a visão mensal"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#475569',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginLeft: '2px'
                          }}
                        >
                          <ArrowLeft size={13} />
                          <span>Voltar aos Meses</span>
                        </button>
                      </div>
                    )}

                    {/* Toggle: Acidentes vs Dias de afastamento */}
                    <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', border: '1px solid #E2E8F0', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setMonthlyMetric('accidents')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '7px',
                          border: 'none',
                          background: monthlyMetric === 'accidents' ? '#FFFFFF' : 'transparent',
                          color: monthlyMetric === 'accidents' ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          boxShadow: monthlyMetric === 'accidents' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <AlertCircle size={14} />
                        <span>
                          {drillLevel === 'yearly' ? 'Total Acidentes' : drillLevel === 'daily' ? 'Acidentes/Dia' : 'Acidentes por Mês'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonthlyMetric('lostDays')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '7px',
                          border: 'none',
                          background: monthlyMetric === 'lostDays' ? '#FFFFFF' : 'transparent',
                          color: monthlyMetric === 'lostDays' ? '#0284C7' : 'var(--text-muted)',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          boxShadow: monthlyMetric === 'lostDays' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Clock size={14} />
                        <span>Dias de Afastamento</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1. NÍVEL ANUAL (DRILL-UP) */}
                {drillLevel === 'yearly' && (
                  <div>
                    <div style={{ height: 350, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '0.5rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={yearlyChartData} 
                          margin={{ top: 25, right: 30, left: 0, bottom: 0 }}
                          onClick={handleYearlyChartClick}
                          style={{ cursor: 'pointer' }}
                        >
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#334155', fontWeight: 800 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 'dataMax + 10']} />
                          <Tooltip 
                            cursor={{ fill: '#F1F5F9' }}
                            contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                            labelStyle={{ color: '#0F172A', fontWeight: 800, marginBottom: '4px' }}
                            formatter={(value: any, _, props: any) => [
                              monthlyMetric === 'accidents' 
                                ? `${value} acidentes (média ${props.payload?.avgPerMonth}/mês)` 
                                : `${value} dias de afastamento`,
                              'Consolidado Anual'
                            ]}
                          />
                          <Bar 
                            dataKey="value" 
                            name={monthlyMetric === 'accidents' ? 'Total de Acidentes' : 'Dias de Afastamento'}
                            fill={monthlyMetric === 'accidents' ? 'var(--primary)' : '#0284C7'}
                            radius={[6, 6, 0, 0]}
                            barSize={50}
                            cursor="pointer"
                            onClick={(data: any, barIndex: number) => {
                              const y = data?.yearNum || data?.payload?.yearNum || yearlyChartData[barIndex]?.yearNum || Number(data?.year);
                              if (y) {
                                setDrillYear(y);
                                setDrillLevel('monthly');
                                setSelectedDay(null);
                              }
                            }}
                            label={{ position: 'top', fill: '#0F172A', fontSize: 12, fontWeight: 900 }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Barra de Acesso Rápido por Ano */}
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px dashed #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'nowrap',
                      overflowX: 'auto'
                    }}>
                      <span style={{ fontSize: '0.73rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        💡 Selecione o ano para detalhar:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', flexShrink: 0 }}>
                        {yearlyChartData.map(item => (
                          <button
                            key={item.year}
                            type="button"
                            onClick={() => {
                              setDrillYear(item.yearNum);
                              setDrillLevel('monthly');
                              setSelectedDay(null);
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: 'var(--primary)',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            <span>Ano {item.year}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. NÍVEL MENSAL (PADRÃO) */}
                {drillLevel === 'monthly' && (
                  <div>
                    {/* Barra de Totais Superior quando apenas 1 ano selecionado */}
                    {selectedYears.length === 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.65rem',
                        padding: '0.4rem 0.85rem',
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155' }}>
                            Detalhamento Cronológico — Ano <strong>{selectedYears[0]}</strong>
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                            • Clique no mês da tabela ou na barra do gráfico para inspecionar os dias
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Consolidado:</span>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#991B1B'
                          }}>
                            <strong style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 900 }}>{stats[selectedYears[0]]?.total || 0}</strong> acidentes
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            background: '#F0F9FF',
                            border: '1px solid #BAE6FD',
                            borderRadius: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#075985'
                          }}>
                            <strong style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 900 }}>{stats[selectedYears[0]]?.totalLostDays || 0}</strong> dias perdidos
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      height: 350, 
                      display: selectedYears.length === 1 ? 'grid' : 'block',
                      gridTemplateColumns: selectedYears.length === 1 ? 'minmax(0, 1fr) 280px' : undefined,
                      gap: '1.25rem',
                      alignItems: 'stretch'
                    }}>
                      <div style={{ 
                        height: '100%',
                        minWidth: 0,
                        overflowX: selectedYears.length > 2 ? 'auto' : 'visible',
                        overflowY: 'hidden', 
                        background: selectedYears.length === 1 ? '#FFFFFF' : 'transparent',
                        border: selectedYears.length === 1 ? '1px solid #E2E8F0' : 'none',
                        borderRadius: selectedYears.length === 1 ? '12px' : '0px',
                        padding: selectedYears.length === 1 ? '0.75rem 0.5rem 0.25rem 0' : '0 0 0.5rem 0',
                        boxShadow: selectedYears.length === 1 ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ 
                          minWidth: selectedYears.length > 2 ? `${selectedYears.length * 400}px` : '100%', 
                          height: '100%' 
                        }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={chartData} 
                              margin={{ top: 25, right: 25, left: 0, bottom: 0 }}
                              onClick={handleMonthlyChartClick}
                              style={{ cursor: 'pointer' }}
                            >
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} domain={[0, monthlyMetric === 'accidents' ? 'dataMax + 2' : 'dataMax + 5']} />
                              <Tooltip 
                                cursor={{fill: '#F1F5F9'}} 
                                contentStyle={{backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 20px rgba(0,0,0,0.1)'}} 
                                itemStyle={{color: '#0F172A', fontWeight: 600}} 
                                labelStyle={{color: '#0F172A', fontWeight: 800, marginBottom: '4px'}} 
                                formatter={(value: any, name: any) => [
                                  monthlyMetric === 'accidents'
                                    ? `${value} acidente${Number(value) !== 1 ? 's' : ''}`
                                    : `${value} dia${Number(value) !== 1 ? 's' : ''} de afastamento`,
                                  `Ano ${name}`
                                ]}
                              />
                              <Legend verticalAlign="top" align="center" iconType="circle" />
                              {selectedYears.map((year, idx) => {
                                const colors = ['#B91C1C', '#94A3B8', '#0F172A', '#3B82F6', '#10B981', '#F59E0B'];
                                return (
                                  <Bar 
                                    key={year}
                                    dataKey={String(year)} 
                                    fill={colors[idx % colors.length]} 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={selectedYears.length > 3 ? 12 : selectedYears.length === 1 ? 36 : 20}
                                    cursor="pointer"
                                    onClick={(data: any, barIndex: number) => {
                                      let mIdx: number | null = null;
                                      if (data && data.monthIndex) {
                                        mIdx = data.monthIndex;
                                      } else if (data && data.payload && data.payload.monthIndex) {
                                        mIdx = data.payload.monthIndex;
                                      } else if (barIndex !== undefined && barIndex >= 0 && barIndex < 12) {
                                        mIdx = barIndex + 1;
                                      }
                                      if (mIdx) {
                                        setDrillMonth(mIdx);
                                        setDrillYear(year);
                                        setDrillLevel('daily');
                                        setSelectedDay(null);
                                      }
                                    }}
                                    label={{ position: 'top', fill: '#0F172A', fontSize: 11, fontWeight: 900 }}
                                  />
                                );
                              })}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Tabela Vertical nivelada à direita quando selecionado apenas 1 ano */}
                      {selectedYears.length === 1 && (
                        <div style={{
                          height: '100%',
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{
                            padding: '0.45rem 0.75rem',
                            background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                              Mês a Mês ({selectedYears[0]})
                            </span>
                            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748B' }}>
                              Consolidado Anual
                            </span>
                          </div>

                          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', tableLayout: 'fixed' }}>
                              <colgroup>
                                <col style={{ width: '30%' }} />
                                <col style={{ width: '38%' }} />
                                <col style={{ width: '32%' }} />
                              </colgroup>
                              <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', height: '22px' }}>
                                  <th style={{ padding: '0 8px', textAlign: 'left', fontWeight: 800, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                    MÊS
                                  </th>
                                  <th style={{ padding: '0 4px', textAlign: 'center', fontWeight: 800, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                    ACIDENTES
                                  </th>
                                  <th style={{ padding: '0 8px', textAlign: 'right', fontWeight: 800, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                    AFAST
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {MONTH_NAMES.map((mName, idx) => {
                                  const mStats = stats[selectedYears[0]]?.monthly[idx];
                                  const count = mStats?.count || 0;
                                  const lost = mStats?.lostDays || 0;
                                  const isSelectedDrill = drillMonth === (idx + 1);
                                  return (
                                    <tr 
                                      key={mName} 
                                      onClick={() => {
                                        setDrillMonth(idx + 1);
                                        setDrillYear(selectedYears[0]);
                                        setDrillLevel('daily');
                                        setSelectedDay(null);
                                      }}
                                      title="Clique para detalhar os dias deste mês"
                                      style={{
                                        borderBottom: '1px solid #F1F5F9',
                                        cursor: 'pointer',
                                        background: isSelectedDrill ? '#FEF2F2' : (count > 0 ? 'rgba(254, 242, 242, 0.45)' : (idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA')),
                                        transition: 'background 0.15s'
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = isSelectedDrill ? '#FEF2F2' : (count > 0 ? 'rgba(254, 242, 242, 0.45)' : (idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA')); }}
                                    >
                                      <td style={{ padding: '0 8px', fontWeight: count > 0 ? 800 : 600, color: count > 0 ? '#0F172A' : '#64748B', lineHeight: 1.15, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                        {mName}
                                      </td>
                                      <td style={{ padding: '0 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                        {count > 0 ? (
                                          <span style={{ 
                                            display: 'inline-block',
                                            background: '#FEF2F2', 
                                            color: 'var(--primary)', 
                                            padding: '1px 6px', 
                                            borderRadius: '4px', 
                                            fontWeight: 900, 
                                            fontSize: '0.72rem',
                                            border: '1px solid #FECACA',
                                            lineHeight: 1.1
                                          }}>
                                            {count}
                                          </span>
                                        ) : (
                                          <span style={{ color: '#CBD5E1', fontWeight: 600 }}>—</span>
                                        )}
                                      </td>
                                      <td style={{ padding: '0 8px', textAlign: 'right', verticalAlign: 'middle' }}>
                                        {lost > 0 ? (
                                          <span style={{ 
                                            display: 'inline-block',
                                            background: '#F0F9FF', 
                                            color: '#0284C7', 
                                            padding: '1px 6px', 
                                            borderRadius: '4px', 
                                            fontWeight: 800, 
                                            fontSize: '0.72rem',
                                            border: '1px solid #BAE6FD',
                                            lineHeight: 1.1
                                          }}>
                                            {lost}d
                                          </span>
                                        ) : (
                                          <span style={{ color: '#CBD5E1', fontWeight: 600 }}>0d</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: '#F8FAFC', borderTop: '2px solid #CBD5E1', height: '24px' }}>
                                  <td style={{ padding: '0 8px', fontWeight: 900, color: '#0F172A', fontSize: '0.72rem', textTransform: 'uppercase', verticalAlign: 'middle' }}>
                                    TOTAL
                                  </td>
                                  <td style={{ padding: '0 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    <span style={{ 
                                      display: 'inline-block',
                                      background: 'var(--primary)', 
                                      color: '#FFFFFF', 
                                      padding: '1px 7px', 
                                      borderRadius: '4px', 
                                      fontWeight: 950, 
                                      fontSize: '0.72rem',
                                      lineHeight: 1.1
                                    }}>
                                      {stats[selectedYears[0]]?.total || 0}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0 8px', textAlign: 'right', verticalAlign: 'middle' }}>
                                    <span style={{ 
                                      display: 'inline-block',
                                      background: '#0284C7', 
                                      color: '#FFFFFF', 
                                      padding: '1px 7px', 
                                      borderRadius: '4px', 
                                      fontWeight: 950, 
                                      fontSize: '0.72rem',
                                      lineHeight: 1.1
                                    }}>
                                      {stats[selectedYears[0]]?.totalLostDays || 0}d
                                    </span>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Barra de Acesso Rápido aos Meses (Drill-Down Imediato) */}
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px dashed #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'nowrap',
                      overflowX: 'auto'
                    }}>
                      <span style={{ fontSize: '0.73rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        🖱️ <strong>Drill-Down:</strong>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap', flexShrink: 0 }}>
                        {MONTH_NAMES.map((mName, idx) => {
                          const mIdx = idx + 1;
                          const monthAccs = selectedYears.reduce((sum, yr) => sum + (stats[yr]?.monthly[idx]?.count || 0), 0);
                          const monthLost = selectedYears.reduce((sum, yr) => sum + (stats[yr]?.monthly[idx]?.lostDays || 0), 0);
                          const hasAccs = monthAccs > 0;
                          return (
                            <button
                              key={mName}
                              type="button"
                              onClick={() => {
                                setDrillMonth(mIdx);
                                if (selectedYears.length > 0 && !selectedYears.includes(drillYear)) {
                                  setDrillYear(selectedYears[0]);
                                }
                                setDrillLevel('daily');
                                setSelectedDay(null);
                              }}
                              style={{
                                padding: '4px 9px',
                                borderRadius: '6px',
                                border: hasAccs ? '1px solid #FECACA' : '1px solid #E2E8F0',
                                background: hasAccs ? '#FEF2F2' : '#FFFFFF',
                                color: hasAccs ? '#991B1B' : '#64748B',
                                fontWeight: hasAccs ? 900 : 700,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              title={`${mName}: ${monthAccs} acidentes, ${monthLost} dias perdidos`}
                            >
                              <span>{mName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. NÍVEL DIÁRIO (DRILL-DOWN) */}
                {drillLevel === 'daily' && (
                  <div>
                    <div style={{ height: 320, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '0.5rem' }}>
                      <div style={{ minWidth: '760px', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={dailyChartData} 
                            margin={{ top: 25, right: 15, left: -15, bottom: 0 }}
                            onClick={handleDailyChartClick}
                            style={{ cursor: 'pointer' }}
                          >
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} domain={[0, monthlyMetric === 'accidents' ? 'dataMax + 1' : 'dataMax + 5']} />
                            <Tooltip 
                              cursor={{ fill: '#F1F5F9' }}
                              content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const dayAccs = data.accidents as Accident[];
                                return (
                                  <div style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    padding: '0.75rem 1rem',
                                    maxWidth: '320px'
                                  }}>
                                    <div style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.85rem', marginBottom: '2px' }}>
                                      Dia {data.day} de {MONTH_NAMES[drillMonth - 1]} de {drillYear}
                                    </div>
                                    <div style={{ 
                                      fontSize: '0.72rem', 
                                      color: data.count > 0 ? (data.hasMultiple ? '#DC2626' : 'var(--primary)') : '#64748B', 
                                      fontWeight: 800, 
                                      marginBottom: '6px' 
                                    }}>
                                      {data.count === 0 
                                        ? 'Nenhum acidente registrado'
                                        : `${data.count} acidente${data.count > 1 ? 's' : ''} ${data.hasMultiple ? '⚠️ (Múltiplas ocorrências)' : ''} • ${data.lostDays} dias afast.`}
                                    </div>
                                    {dayAccs.length > 0 && (
                                      <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {dayAccs.map((a, idx) => (
                                          <div key={a.id || idx} style={{ fontSize: '0.7rem', color: '#334155' }}>
                                            <div style={{ fontWeight: 800, color: '#0F172A' }}>• {a.employee}</div>
                                            <div style={{ color: '#64748B', fontSize: '0.65rem' }}>
                                              {a.role} • {a.area} ({a.division})
                                            </div>
                                            <div style={{ color: a.lostDays > 0 ? '#EF4444' : '#10B981', fontSize: '0.65rem', fontWeight: 700 }}>
                                              {a.lostDays > 0 ? `${a.lostDays} dias perdidos` : 'Sem afastamento'} • {a.hasCat ? 'Com CAT' : 'Sem CAT'}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              }}
                            />
                            <Bar 
                              dataKey="value"
                              radius={[4, 4, 0, 0]}
                              barSize={18}
                              cursor="pointer"
                              onClick={(data: any, barIndex: number) => {
                                const d = data?.dayNum || data?.payload?.dayNum || (barIndex !== undefined && dailyChartData[barIndex]?.dayNum);
                                if (d !== undefined && d !== null) {
                                  setSelectedDay(prev => prev === d ? null : d);
                                }
                              }}
                              label={{ 
                                position: 'top', 
                                fill: '#475569', 
                                fontSize: 10, 
                                fontWeight: 800,
                                formatter: (val: any) => Number(val) > 0 ? val : ''
                              }}
                            >
                              {dailyChartData.map((entry) => {
                                let fill = '#E2E8F0';
                                if (entry.count > 0) {
                                  if (entry.hasMultiple) {
                                    fill = '#DC2626'; // Vermelho intenso para múltiplos acidentes no mesmo dia
                                  } else {
                                    fill = monthlyMetric === 'accidents' ? 'var(--primary)' : '#0284C7';
                                  }
                                }
                                if (selectedDay === entry.dayNum) {
                                  fill = '#F59E0B'; // Âmbar para o dia filtrado
                                }
                                return (
                                  <Cell 
                                    key={`cell-${entry.dayNum}`} 
                                    fill={fill} 
                                    cursor="pointer"
                                    onClick={() => setSelectedDay(prev => prev === entry.dayNum ? null : entry.dayNum)}
                                  />
                                );
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Detalhamento dos Acidentados do Mês / Dia */}
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} color="var(--primary)" />
                          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0F172A' }}>
                            {selectedDay !== null 
                              ? `Colaboradores Acidentados no Dia ${String(selectedDay).padStart(2, '0')}/${String(drillMonth).padStart(2, '0')}/${drillYear}`
                              : `Colaboradores Acidentados em ${MONTH_NAMES[drillMonth - 1]} de ${drillYear}`}
                          </h3>
                          <span style={{ 
                            background: monthAccidentsList.length > 0 ? '#FEF2F2' : '#F1F5F9', 
                            color: monthAccidentsList.length > 0 ? '#991B1B' : '#64748B', 
                            fontSize: '0.7rem', 
                            fontWeight: 900, 
                            padding: '2px 8px', 
                            borderRadius: '999px',
                            border: monthAccidentsList.length > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0'
                          }}>
                            {monthAccidentsList.length} ocorrência{monthAccidentsList.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {selectedDay !== null && (
                          <button
                            type="button"
                            onClick={() => setSelectedDay(null)}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            ✕ Mostrar todos os dias do mês
                          </button>
                        )}
                      </div>

                      {monthAccidentsList.length === 0 ? (
                        <div style={{ padding: '1.25rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '10px', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>
                          Nenhum acidente registrado para esta data com os filtros atuais.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                          {monthAccidentsList.map((acc, idx) => (
                            <div
                              key={acc.id || idx}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                padding: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                borderLeft: `4px solid ${acc.lostDays > 0 ? '#EF4444' : '#10B981'}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0F172A' }}>{acc.employee}</div>
                                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>RE: {acc.re || 'N/A'} • {acc.role}</div>
                                </div>
                                <span style={{ 
                                  fontSize: '0.65rem', 
                                  fontWeight: 900, 
                                  background: '#F1F5F9', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  color: '#334155' 
                                }}>
                                  {acc.date.toLocaleDateString('pt-BR')}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#475569' }}>
                                <Layers size={13} color="#94A3B8" />
                                <span>{acc.area} • {acc.division}</span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px dashed #F1F5F9', paddingTop: '6px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: acc.hasCat ? '#DCFCE7' : '#F1F5F9',
                                    color: acc.hasCat ? '#15803D' : '#64748B'
                                  }}>
                                    {acc.hasCat ? 'CAT' : 'Sem CAT'}
                                  </span>
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: acc.unsafeAct ? '#FEF2F2' : '#F0FDF4',
                                    color: acc.unsafeAct ? '#991B1B' : '#166534'
                                  }}>
                                    {acc.unsafeAct ? 'Ato Inseguro' : 'Condição'}
                                  </span>
                                </div>

                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 900,
                                  color: acc.lostDays > 0 ? '#EF4444' : '#10B981'
                                }}>
                                  {acc.lostDays > 0 ? `${acc.lostDays} dias afast.` : 'Sem afast.'}
                                </span>
                              </div>

                              {acc.investigationLink && (
                                <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'flex-end' }}>
                                  <a
                                    href={acc.investigationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '0.65rem',
                                      color: '#2563EB',
                                      fontWeight: 800,
                                      textDecoration: 'none',
                                      background: '#EFF6FF',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #BFDBFE'
                                    }}
                                  >
                                    <ExternalLink size={10} /> Investigação
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="panel-premium">
                <h2 style={{textAlign: 'center', marginBottom: '0.5rem', fontWeight: 900, color: 'var(--text)'}}>Mapa de <span style={{color: 'var(--primary)'}}>Intensidade</span></h2>
                <p style={{textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem'}}>Frequência mensal de ocorrências (Mapa de Calor)</p>
                <table className="heatmap-table">
                  <thead>
                    <tr>
                      <th></th>
                      {MONTH_NAMES.map(m => <th key={m}>{m.toUpperCase()}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedYears.map(year => {
                      const s = stats[year];
                      if (!s) return null;
                      return (
                        <tr key={year}>
                          <td style={{fontWeight: 700, color: 'var(--text-muted)'}}>{year}</td>
                          {stats[year]?.monthly.map((m, i) => (
                            <td 
                              key={i} 
                              style={{ background: getHeatmapColor(m.count), color: m.count > 5 ? 'white' : 'var(--text)' }}
                            >
                              <div>{m.count > 0 ? m.count : '-'}</div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)'}}>
                  <span>Menos</span>
                  {[0, 2, 4, 6, 8, 10].map(c => <div key={c} style={{width: 20, height: 10, borderRadius: 2, backgroundColor: getHeatmapColor(c)}}></div>)}
                  <span>Mais</span>
                  <span style={{marginLeft: 16}}>— fora do período</span>
                </div>
              </div>
            </>
          ) : activeTab === 'temporal' ? (
            <TemporalAnalysis accidents={filteredAccidents} />
          ) : activeTab === 'safety' ? (
            <SafetyManagement accidents={filteredAccidents} />
          ) : (
            <Breakdown 
              accidents={filteredAccidents} 
              isOpen={isBreakdownModalOpen} 
              onClose={() => setIsBreakdownModalOpen(false)} 
            />
          )}
        </main>

        {/* Right: Períodos de Atenção */}
        {/* Right: Insights / Storytelling */}
        {/* Right: Insights / Storytelling (Top 3) */}
        <aside className="insights-panel">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              {activeTab === 'monthly' ? 'Períodos de ' : activeTab === 'temporal' ? 'Análise de ' : activeTab === 'safety' ? 'Gestão de ' : 'Detalhes de '}
              <span style={{ color: 'var(--primary)' }}>
                {activeTab === 'monthly' ? 'Atenção' : activeTab === 'temporal' ? 'Padrões' : activeTab === 'safety' ? 'Indicadores' : 'Causas'}
              </span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
              {activeTab === 'monthly' 
                ? `Padrões identificados na comparação ${yearsLabel.adj}` 
                : activeTab === 'temporal' 
                  ? 'Storytelling baseado em horários e dias' 
                  : activeTab === 'safety'
                    ? 'Fatores críticos de performance de segurança'
                    : 'Fatores causais e perfil de experiência'}
            </p>
          </div>
          
          {currentInsights.slice(0, 3).map((insight, idx) => {
            const colors = {
              danger: { bg: '#FEE2E2', text: '#EF4444', icon: <AlertCircle color="#EF4444" size={24} /> },
              warning: { bg: '#FEF3C7', text: '#F59E0B', icon: <Calendar color="#F59E0B" size={24} /> },
              info: { bg: '#DBEAFE', text: '#3B82F6', icon: <TrendingUp color="#3B82F6" size={24} /> },
              success: { bg: '#D1FAE5', text: '#10B981', icon: <ShieldCheck color="#10B981" size={24} /> }
            };
            const config = colors[insight.type as keyof typeof colors];

            return (
              <motion.div 
                key={`${activeTab}-${idx}`}
                className="insight-card" 
                style={{ borderLeft: `4px solid ${config.text}` }} 
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (idx * 0.1) }}
              >
                <div className="insight-icon" style={{ backgroundColor: config.bg }}>
                  {config.icon}
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.text}</p>
                </div>
              </motion.div>
            );
          })}
        </aside>
      </div>

      {/* Fourth Insight (Full Width Bottom) */}
      {currentInsights.length >= 4 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-premium"
          style={{ 
            marginTop: '2rem', 
            borderLeft: '8px solid var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2rem',
            background: 'linear-gradient(90deg, #FFF1F2 0%, #FFFFFF 100%)'
          }}
        >
          <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>
              {currentInsights[3].title}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#475569', fontWeight: 500 }}>
              {currentInsights[3].text}
            </p>
          </div>
        </motion.div>
      )}
        </>
      )}
      
      {filteredAccidents.length > 0 && (
        <div style={{marginTop: '2rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '0.5rem', border: '1px solid var(--primary)', color: 'var(--primary)', textAlign: 'center', fontWeight: 600}}>
           O dashboard está operando com filtros ativos. Os dados acima representam exclusivamente o cenário de {filterDivision === 'ALL' ? 'todas as unidades' : filterDivision}.
        </div>
      )}

      {activeTab !== 'breakdown' && isBreakdownModalOpen && (
        <Breakdown 
          accidents={filteredAccidents} 
          isOpen={isBreakdownModalOpen} 
          onClose={() => setIsBreakdownModalOpen(false)} 
        />
      )}

      <TokenExpirationModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />
    </div>
  );
};
