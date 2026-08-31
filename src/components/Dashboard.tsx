import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  AlertCircle, TrendingUp, Calendar, Printer, ShieldCheck, Layers, Upload, Monitor, X, ExternalLink,
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Clock, FileSpreadsheet
} from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights, generateTemporalInsights } from '../utils/dataLoader';
import { motion } from 'framer-motion';
import { LOGO_BASE64 } from '../constants';
import { TemporalAnalysis } from './TemporalAnalysis';
import { SafetyManagement } from './SafetyManagement';
import { Breakdown } from './Breakdown';
import { generateSafetyInsights } from '../utils/dataLoader';
import { ExpandableChart } from './ExpandableChart';

const MonthlyTooltip = ({ active, payload, label, drillDownYear }: any) => {
  if (active && payload && payload.length) {
    if (drillDownYear) {
      return (
        <div style={{ background: 'white', padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{label} {drillDownYear}</h4>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px', color: '#B91C1C' }}>
            {payload[0].value} Acidente{payload[0].value !== 1 ? 's' : ''}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, fontStyle: 'italic', background: '#F8FAFC', padding: '4px 6px', borderRadius: '4px' }}>
            Clique na barra para detalhes completos
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ background: 'white', padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{label}</h4>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ color: entry.color, fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>
              {entry.name}: {entry.value}
            </div>
          ))}
          <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, fontStyle: 'italic', background: '#F8FAFC', padding: '4px 6px', borderRadius: '4px' }}>
            Clique na barra para detalhar o ano
          </div>
        </div>
      );
    }
  }
  return null;
};

interface DashboardProps {
  accidents: Accident[];
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  filterDivision: string;
  onDivisionChange: (val: string) => void;
  filterManager: string;
  onManagerChange: (val: string) => void;
  filterArea: string[];
  onAreaChange: (val: string[]) => void;
  safetyGroupBy: 'area' | 'division';
  onSafetyGroupByChange: (val: 'area' | 'division') => void;
  onReset: () => void;
  onPrint: () => void;
  onLandscapePrint: () => void;
  onBatchPrint: () => void;
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
  safetyGroupBy,
  onSafetyGroupByChange,
  onReset, 
  onPrint, 
  onLandscapePrint,
  onBatchPrint 
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'temporal' | 'safety' | 'breakdown'>('monthly');
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const [drillDownYear, setDrillDownYear] = useState<number | null>(null);
  const [monthDetailsModal, setMonthDetailsModal] = useState<{ monthIndex: number } | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  // Modal Sorting & Filtering states
  const [modalSortKey, setModalSortKey] = useState<'date' | 'employee' | 'role' | 'area' | 'unsafeAct' | 'type' | 'lostDays'>('date');
  const [modalSortDirection, setModalSortDirection] = useState<'asc' | 'desc'>('asc');
  const [modalSearchText, setModalSearchText] = useState('');
  const [modalFilterCause, setModalFilterCause] = useState<'ALL' | 'UNSAFE_ACT' | 'UNSAFE_COND'>('ALL');
  const [modalFilterType, setModalFilterType] = useState<'ALL' | string>('ALL');
  const [modalFilterLostDays, setModalFilterLostDays] = useState<'ALL' | 'WITH_LOST_DAYS' | 'NO_LOST_DAYS'>('ALL');

  const handleModalSort = (key: 'date' | 'employee' | 'role' | 'area' | 'unsafeAct' | 'type' | 'lostDays') => {
    if (modalSortKey === key) {
      setModalSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setModalSortKey(key);
      setModalSortDirection('asc');
    }
  };

  const resetModalFilters = () => {
    setModalSearchText('');
    setModalFilterCause('ALL');
    setModalFilterType('ALL');
    setModalFilterLostDays('ALL');
    setModalSortKey('date');
    setModalSortDirection('asc');
  };

  const sortedSelectedYears = useMemo(() => {
    return [...selectedYears].sort((a, b) => a - b);
  }, [selectedYears]);

  const filteredAccidents = useMemo(() => {
    return accidents.filter(a => {
      const matchesYear = selectedYears.includes(a.year);
      const matchesDivision = filterDivision === 'ALL' || a.division === filterDivision;
      const matchesManager = filterManager === 'ALL' || a.manager === filterManager;
      const matchesArea = filterArea.length === 0 || filterArea.includes(a.area);
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

  const baseMonthAccidents = useMemo(() => {
    if (!monthDetailsModal || !drillDownYear) return [];
    return filteredAccidents.filter(a => a.year === drillDownYear && (a.month - 1) === monthDetailsModal.monthIndex);
  }, [filteredAccidents, drillDownYear, monthDetailsModal]);

  const modalAvailableTypes = useMemo(() => {
    return Array.from(new Set(baseMonthAccidents.map(a => a.type).filter(Boolean))).sort();
  }, [baseMonthAccidents]);

  const modalProcessedAccidents = useMemo(() => {
    let list = [...baseMonthAccidents];

    if (modalSearchText.trim()) {
      const q = modalSearchText.toLowerCase();
      list = list.filter(a => 
        (a.employee && a.employee.toLowerCase().includes(q)) ||
        (a.role && a.role.toLowerCase().includes(q)) ||
        (a.area && a.area.toLowerCase().includes(q)) ||
        (a.type && a.type.toLowerCase().includes(q))
      );
    }

    if (modalFilterCause !== 'ALL') {
      list = list.filter(a => modalFilterCause === 'UNSAFE_ACT' ? a.unsafeAct : !a.unsafeAct);
    }

    if (modalFilterType !== 'ALL') {
      list = list.filter(a => a.type === modalFilterType);
    }

    if (modalFilterLostDays === 'WITH_LOST_DAYS') {
      list = list.filter(a => a.lostDays > 0);
    } else if (modalFilterLostDays === 'NO_LOST_DAYS') {
      list = list.filter(a => a.lostDays === 0);
    }

    list.sort((a, b) => {
      let valA: any = a[modalSortKey as keyof Accident];
      let valB: any = b[modalSortKey as keyof Accident];

      if (modalSortKey === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0;
        valB = b.date ? new Date(b.date).getTime() : 0;
      } else if (modalSortKey === 'unsafeAct') {
        valA = a.unsafeAct ? 1 : 0;
        valB = b.unsafeAct ? 1 : 0;
      } else if (typeof valA === 'string') {
        return modalSortDirection === 'asc' 
          ? valA.localeCompare(valB || '') 
          : (valB || '').localeCompare(valA);
      }

      if (valA < valB) return modalSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return modalSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [baseMonthAccidents, modalSearchText, modalFilterCause, modalFilterType, modalFilterLostDays, modalSortKey, modalSortDirection]);

  const formatDateBR = (dateVal: any) => {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  };

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthData: any = { month: MONTH_NAMES[i] };
      selectedYears.forEach(year => {
        monthData[year] = stats[year]?.monthly[i].count || 0;
      });
      return monthData;
    });
  }, [stats, selectedYears]);

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
    <div className="dashboard-container">
      <header className="header no-print">
        <div className="header-brand">
          <div className="brand-logo-container">
            <img src={LOGO_BASE64} alt="Logo" className="brand-logo" />
          </div>
          <div className="brand-title">
            <h1>{dashboardTitle}</h1>
            <p>Grupo Açotubo</p>
          </div>
        </div>

        <div className="header-years">
          <div className="years-btn-group">
            {allAvailableYears.map(year => (
              <button
                key={year}
                onClick={() => {
                  const newYears = selectedYears.includes(year)
                    ? selectedYears.filter(y => y !== year)
                    : [...selectedYears, year];
                  onYearsChange(newYears.sort((a, b) => a - b));
                }}
                className={`year-select-btn ${selectedYears.includes(year) ? 'active' : ''}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => setIsBreakdownModalOpen(true)}
            className="btn-action detail" 
            title="Detalhamento Geral de Ocorrências (Base Completa)"
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60A5FA',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
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
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.color = '#60A5FA';
              e.currentTarget.style.background = 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)';
            }}
          >
            <FileSpreadsheet size={22} />
          </button>
          <button 
            onClick={onReset} 
            className="btn-action reset" 
            title="Reenviar Excel"
          >
            <Upload size={20} />
          </button>
          <button 
            onClick={onBatchPrint}
            className="btn-action batch" 
            title="Relatórios em Massa"
          >
            <Layers size={22} />
          </button>
          <button 
            onClick={onLandscapePrint} 
            className="btn-action landscape" 
            title="Gerar Quadro Paisagem (Gestão à Vista)"
          >
            <Monitor size={22} />
          </button>
          <button 
            onClick={onPrint} 
            className="btn-action print" 
            title="Gerar Relatório PDF (Retrato)"
          >
            <Printer size={22} />
          </button>
        </div>
      </header>

      <div className="filters-bar no-print">
        <div className="filters-selectors">
          <div className="filter-group">
            <label><div className="filter-dot blue"></div>Unidade</label>
            <select value={filterDivision} onChange={e => onDivisionChange(e.target.value)}>
              <option value="ALL">Todas as Unidades</option>
              {uniqueDivisions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><div className="filter-dot green"></div>Superior Direto</label>
            <select value={filterManager} onChange={e => onManagerChange(e.target.value)}>
              <option value="ALL">Todos os Superiores</option>
              {uniqueManagers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="filter-group" style={{ position: 'relative' }}>
            <label><div className="filter-dot orange"></div>Área</label>
            <div 
              onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}
              style={{ padding: '0.4rem 0.75rem', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '160px', height: '34px' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {filterArea.length === 0 ? 'Todas as Áreas' : filterArea.length === 1 ? filterArea[0] : `${filterArea.length} áreas selec.`}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '8px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            {areaDropdownOpen && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                  onClick={() => setAreaDropdownOpen(false)}
                />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', width: '220px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50, maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer', borderBottom: '1px solid #E2E8F0', marginBottom: '0.25rem', fontWeight: 700 }}>
                    <input type="checkbox" checked={filterArea.length === 0} onChange={() => onAreaChange([])} />
                    <span>Todas as Áreas</span>
                  </label>
                  {uniqueAreas.map(a => (
                    <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: filterArea.includes(a) ? '#FFF7ED' : 'transparent' }}>
                      <input type="checkbox" checked={filterArea.includes(a)} onChange={() => {
                        if (filterArea.includes(a)) {
                          onAreaChange(filterArea.filter(item => item !== a));
                        } else {
                          onAreaChange([...filterArea, a]);
                        }
                      }} />
                      <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: filterArea.includes(a) ? 700 : 500 }}>{a}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="filters-tabs">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          >
            Visão Mensal
          </button>
          <button
            onClick={() => setActiveTab('temporal')}
            className={`tab-btn ${activeTab === 'temporal' ? 'active' : ''}`}
          >
            Análise de Períodos
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
          >
            Dias sem Acidentes
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
          >
            Breakdown
          </button>
        </div>
      </div>

      <div className={`grid-main ${activeTab === 'safety' ? 'grid-safety-layout' : ''}`}>
        {activeTab !== 'safety' && (
        <aside className="panorama-panel">
          <h2 style={{fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem'}}>Panorama Geral</h2>
          {sortedSelectedYears.map((year, i) => {
            const s = stats[year];
            if (!s) return null;
            return (
              <motion.div 
                key={year} 
                className="year-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '1rem' }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', textAlign: 'center', color: '#64748B', fontSize: '0.9rem', fontWeight: 800 }}>{year}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: '0.5rem' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.1 }}>{s.total}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase' }}>acidentes</div>
                  </div>
                  <div style={{ paddingLeft: '0.5rem' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#475569', lineHeight: 1.1 }}>{s.totalLostDays}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase' }}>dias afast.</div>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.5rem', fontSize: '0.65rem', color: '#64748B', textAlign: 'center', fontWeight: 700 }}>
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
        )}

        <main className="content-area">
          {activeTab === 'monthly' ? (
            <>
              {/* Monthly View Content */}
              <div className="panel-premium" style={{ position: 'relative' }}>
                <h2 style={{textAlign: 'center', marginBottom: '0.5rem', fontWeight: 900, color: 'var(--text)'}}>Comparativo <span style={{color: 'var(--primary)'}}>Mensal</span></h2>
                <p style={{textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem'}}>Distribuição histórica de acidentes no {yearsLabel.noun} selecionado</p>
                
                {drillDownYear && (
                  <button 
                    onClick={() => setDrillDownYear(null)}
                    style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: '#F1F5F9', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', color: '#475569', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', zIndex: 10 }}
                  >
                    ← Voltar para Visão Anual
                  </button>
                )}

                <div style={{ height: 350, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '1rem' }}>
                  <ExpandableChart title={drillDownYear ? `Detalhes Mensais de ${drillDownYear}` : "Comparativo Mensal"}>
                    {(isMaximized) => (
                      <div style={{ 
                        minWidth: (drillDownYear ? 1 : selectedYears.length) > 2 ? `${(drillDownYear ? 1 : selectedYears.length) * 400}px` : '100%', 
                        height: isMaximized ? '100%' : '100%' 
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 25, right: 30, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} domain={[0, 'dataMax + 2']} />
                            <Tooltip 
                              cursor={{fill: '#F1F5F9'}} 
                              content={<MonthlyTooltip drillDownYear={drillDownYear} />} 
                              wrapperStyle={{ pointerEvents: 'none', zIndex: 1000 }}
                            />
                            <Legend verticalAlign="top" align="center" iconType="circle" />
                            {(drillDownYear ? [drillDownYear] : sortedSelectedYears).map((year, idx) => {
                              const colors = drillDownYear ? ['#B91C1C'] : ['#B91C1C', '#94A3B8', '#0F172A', '#3B82F6', '#10B981', '#F59E0B'];
                              return (
                                <Bar 
                                  key={year}
                                  dataKey={String(year)} 
                                  fill={colors[idx % colors.length]} 
                                  radius={[4, 4, 0, 0]} 
                                  barSize={(drillDownYear ? 1 : selectedYears.length) > 3 ? 12 : (isMaximized ? 40 : 20)}
                                  label={{ position: 'top', fill: '#64748B', fontSize: isMaximized ? 14 : 10, fontWeight: 700 }}
                                  onClick={(entry: any, index: number) => {
                                    if (!drillDownYear) {
                                      setDrillDownYear(year);
                                    } else {
                                      const monthStr = entry?.payload?.month || entry?.month;
                                      const actualIndex = monthStr ? MONTH_NAMES.indexOf(monthStr) : -1;
                                      setMonthDetailsModal({ monthIndex: actualIndex !== -1 ? actualIndex : index });
                                    }
                                  }}
                                  style={{ cursor: 'pointer', outline: 'none' }}
                                />
                              );
                            })}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </ExpandableChart>
                </div>
              </div>

              <div className="panel-premium">
                <h2 style={{textAlign: 'center', marginBottom: '0.5rem', fontWeight: 900, color: 'var(--text)'}}>Mapa de <span style={{color: 'var(--primary)'}}>Intensidade</span></h2>
                <p style={{textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem'}}>Frequência mensal de ocorrências (Mapa de Calor)</p>
                <div className="heatmap-container">
                  <ExpandableChart title="Mapa de Calor (Intensidade)">
                    {(isMaximized) => (
                      <table className="heatmap-table" style={{ height: isMaximized ? '100%' : 'auto' }}>
                        <thead>
                          <tr>
                            <th></th>
                            {MONTH_NAMES.map(m => <th key={m}>{m.toUpperCase()}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSelectedYears.map(year => {
                            const yearStats = stats[year];
                            if (!yearStats) return null;
                            return (
                              <tr key={year}>
                                <td style={{fontWeight: 700, color: 'var(--text-muted)'}}>{year}</td>
                                {yearStats?.monthly.map((m, i) => (
                                  <td 
                                    key={i} 
                                    style={{ 
                                      background: getHeatmapColor(m.count), 
                                      color: m.count > 4 ? 'white' : 'var(--text)',
                                      fontSize: isMaximized ? '1.5rem' : 'inherit'
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
                    )}
                  </ExpandableChart>
                </div>
                
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
            <SafetyManagement 
              accidents={filteredAccidents} 
              groupBy={safetyGroupBy}
              onGroupByChange={onSafetyGroupByChange}
            />
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
        {activeTab !== 'safety' && (
        <aside className="insights-panel">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              {activeTab === 'monthly' ? 'Períodos de ' : activeTab === 'temporal' ? 'Análise de ' : 'Detalhes de '}
              <span style={{ color: 'var(--primary)' }}>
                {activeTab === 'monthly' ? 'Atenção' : activeTab === 'temporal' ? 'Padrões' : 'Causas'}
              </span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
              {activeTab === 'monthly' 
                ? `Padrões identificados na comparação ${yearsLabel.adj}` 
                : activeTab === 'temporal' 
                  ? 'Storytelling baseado em horários e dias' 
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
        )}
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

      {monthDetailsModal && drillDownYear && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMonthDetailsModal(null);
          }}
        >
          <div style={{ background: '#F8FAFC', borderRadius: '20px', width: '100%', maxWidth: '1050px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--text)', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '-0.02em' }}>
                  <Calendar color="var(--primary)" size={26} />
                  Ocorrências em {MONTH_NAMES[monthDetailsModal.monthIndex]} de {drillDownYear}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                  {modalProcessedAccidents.length} de {baseMonthAccidents.length} {baseMonthAccidents.length === 1 ? 'ocorrência' : 'ocorrências'} {baseMonthAccidents.length !== modalProcessedAccidents.length ? '(filtradas)' : 'registradas'}.
                </p>
              </div>
              <button 
                onClick={() => setMonthDetailsModal(null)}
                style={{ background: '#F1F5F9', border: 'none', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
                title="Fechar janela"
              >
                <X size={22} />
              </button>
            </div>

            {/* Quick Filters Toolbar */}
            <div style={{ padding: '0.75rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Text Search */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar colaborador, cargo, área..." 
                  value={modalSearchText}
                  onChange={(e) => setModalSearchText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    outline: 'none',
                    background: 'white'
                  }}
                />
              </div>

              {/* Cause Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={13} color="#64748B" />
                <select 
                  value={modalFilterCause}
                  onChange={(e) => setModalFilterCause(e.target.value as any)}
                  style={{
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: 'white',
                    color: '#334155'
                  }}
                >
                  <option value="ALL">Todas as Causas</option>
                  <option value="UNSAFE_ACT">Ato Inseguro</option>
                  <option value="UNSAFE_COND">Condição Insegura</option>
                </select>
              </div>

              {/* Type Filter */}
              {modalAvailableTypes.length > 1 && (
                <select 
                  value={modalFilterType}
                  onChange={(e) => setModalFilterType(e.target.value)}
                  style={{
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: 'white',
                    color: '#334155'
                  }}
                >
                  <option value="ALL">Todos os Tipos</option>
                  {modalAvailableTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}

              {/* Lost Days Filter */}
              <select 
                value={modalFilterLostDays}
                onChange={(e) => setModalFilterLostDays(e.target.value as any)}
                style={{
                  padding: '0.45rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: 'white',
                  color: '#334155'
                }}
              >
                <option value="ALL">Com e Sem Afast.</option>
                <option value="WITH_LOST_DAYS">Com Afastamento</option>
                <option value="NO_LOST_DAYS">Sem Afastamento</option>
              </select>

              {/* Reset button if filtered */}
              {(modalSearchText || modalFilterCause !== 'ALL' || modalFilterType !== 'ALL' || modalFilterLostDays !== 'ALL') && (
                <button
                  onClick={resetModalFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.45rem 0.75rem',
                    background: '#FEE2E2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={12} /> Limpar
                </button>
              )}
            </div>
            
            {/* Modal Body with Filterable & Sortable Table */}
            <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto' }} className="custom-scrollbar">
              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <tr>
                      {/* Data Column */}
                      <th 
                        onClick={() => handleModalSort('date')}
                        style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Data"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Data</span>
                          {modalSortKey === 'date' ? (
                            modalSortDirection === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                          ) : (
                            <ArrowUpDown size={12} color="#94A3B8" />
                          )}
                        </div>
                      </th>

                      {/* Colaborador Column */}
                      <th 
                        onClick={() => handleModalSort('employee')}
                        style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Colaborador"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Colaborador</span>
                          {modalSortKey === 'employee' ? (
                            modalSortDirection === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                          ) : (
                            <ArrowUpDown size={12} color="#94A3B8" />
                          )}
                        </div>
                      </th>

                      {/* Cargo & Área Column */}
                      <th 
                        onClick={() => handleModalSort('role')}
                        style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Cargo"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Cargo & Área</span>
                          {modalSortKey === 'role' ? (
                            modalSortDirection === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                          ) : (
                            <ArrowUpDown size={12} color="#94A3B8" />
                          )}
                        </div>
                      </th>

                      {/* Causa Raiz Column */}
                      <th 
                        onClick={() => handleModalSort('unsafeAct')}
                        style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Causa Raiz"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>Causa Raiz & Tipo</span>
                          {modalSortKey === 'unsafeAct' ? (
                            modalSortDirection === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                          ) : (
                            <ArrowUpDown size={12} color="#94A3B8" />
                          )}
                        </div>
                      </th>

                      {/* Afastamento Column */}
                      <th 
                        onClick={() => handleModalSort('lostDays')}
                        style={{ padding: '0.85rem 1.25rem', color: '#64748B', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para ordenar por Dias de Afastamento"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <span>Afastamento</span>
                          {modalSortKey === 'lostDays' ? (
                            modalSortDirection === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                          ) : (
                            <ArrowUpDown size={12} color="#94A3B8" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalProcessedAccidents.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                          <AlertCircle size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748B' }}>Nenhuma ocorrência encontrada</div>
                          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Tente ajustar os termos da busca ou os filtros aplicados.</div>
                          <button
                            onClick={resetModalFilters}
                            style={{
                              marginTop: '1rem',
                              padding: '0.4rem 1rem',
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#475569'
                            }}
                          >
                            Redefinir Filtros
                          </button>
                        </td>
                      </tr>
                    ) : (
                      modalProcessedAccidents.map((a, idx) => (
                        <tr 
                          key={idx} 
                          style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'default' }} 
                          onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} 
                          onMouseOut={e => e.currentTarget.style.background = 'white'}
                        >
                          {/* Data */}
                          <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.85rem' }}>
                                {formatDateBR(a.date)}
                              </span>
                              {a.time && (
                                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                  <Clock size={11} color="#94A3B8" /> {a.time} {a.period ? `(${a.period})` : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Colaborador */}
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem', border: '1px solid #BFDBFE', flexShrink: 0 }}>
                                {a.employee.split(' ').map(n => n[0]).slice(0,2).join('')}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>{a.employee}</span>
                                {a.investigationLink && (
                                  <a href={a.investigationLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#2563EB', fontWeight: 800, textDecoration: 'none', background: '#EFF6FF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BFDBFE', width: 'fit-content', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#DBEAFE'} onMouseOut={e => e.currentTarget.style.background = '#EFF6FF'}>
                                    <ExternalLink size={11} strokeWidth={3} /> Investigação
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Cargo & Área */}
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>{a.role}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                              <Layers size={13} color="#94A3B8" /> {a.area}
                            </div>
                          </td>

                          {/* Causa Raiz */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', background: a.unsafeAct ? '#FEF2F2' : '#F0FDF4', color: a.unsafeAct ? '#991B1B' : '#166534', fontWeight: 800, fontSize: '0.72rem', border: `1px solid ${a.unsafeAct ? '#FECACA' : '#BBF7D0'}` }}>
                                {a.unsafeAct ? <AlertCircle size={13} /> : <ShieldCheck size={13} />}
                                {a.unsafeAct ? 'Ato Inseguro' : 'Condição Insegura'}
                              </span>
                              <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                                {a.type}
                              </div>
                            </div>
                          </td>

                          {/* Afastamento */}
                          <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                            {a.lostDays > 0 ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ color: '#EF4444', fontWeight: 900, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <TrendingUp size={16} /> {a.lostDays} dias
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>afastado</span>
                              </div>
                            ) : (
                              <span style={{ display: 'inline-block', padding: '6px 10px', background: '#F8FAFC', color: '#94A3B8', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #E2E8F0' }}>
                                Sem Afastamento
                              </span>
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
        </div>
      )}

      {activeTab !== 'breakdown' && isBreakdownModalOpen && (
        <Breakdown 
          accidents={filteredAccidents} 
          isOpen={isBreakdownModalOpen} 
          onClose={() => setIsBreakdownModalOpen(false)} 
        />
      )}
      
      {filteredAccidents.length > 0 && (
        <div style={{marginTop: '2rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '0.5rem', border: '1px solid var(--primary)', color: 'var(--primary)', textAlign: 'center', fontWeight: 600}}>
           O dashboard está operando com filtros ativos. Os dados acima representam exclusivamente o cenário de {filterDivision === 'ALL' ? 'todas as unidades' : filterDivision}.
        </div>
      )}
    </div>
  );
};
