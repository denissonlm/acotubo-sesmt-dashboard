import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertCircle, TrendingUp, Calendar, Printer, ShieldCheck, Layers, Upload, Monitor } from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights, generateTemporalInsights } from '../utils/dataLoader';
import { motion } from 'framer-motion';
import { LOGO_BASE64 } from '../constants';
import { TemporalAnalysis } from './TemporalAnalysis';
import { SafetyManagement } from './SafetyManagement';
import { Breakdown } from './Breakdown';
import { generateSafetyInsights } from '../utils/dataLoader';

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
  onReset, 
  onPrint, 
  onLandscapePrint,
  onBatchPrint 
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'temporal' | 'safety' | 'breakdown'>('monthly');
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);

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
            Análise Temporal
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
          >
            Gestão de Segurança
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
          >
            Breakdown
          </button>
        </div>
      </div>

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

        <main className="content-area">
          {activeTab === 'monthly' ? (
            <>
              {/* Monthly View Content */}
              <div className="panel-premium">
                <h2 style={{textAlign: 'center', marginBottom: '0.5rem', fontWeight: 900, color: 'var(--text)'}}>Comparativo <span style={{color: 'var(--primary)'}}>Mensal</span></h2>
                <p style={{textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem'}}>Distribuição histórica de acidentes no {yearsLabel.noun} selecionado</p>
                <div style={{ height: 350, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '1rem' }}>
                  <div style={{ 
                    minWidth: selectedYears.length > 2 ? `${selectedYears.length * 400}px` : '100%', 
                    height: '100%' 
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 25, right: 30, left: 0, bottom: 0 }}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} domain={[0, 'dataMax + 2']} />
                        <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: '1px solid var(--border)'}} />
                        <Legend verticalAlign="top" align="center" iconType="circle" />
                        {selectedYears.map((year, idx) => {
                          const colors = ['#B91C1C', '#94A3B8', '#0F172A', '#3B82F6', '#10B981', '#F59E0B'];
                          return (
                            <Bar 
                              key={year}
                              dataKey={String(year)} 
                              fill={colors[idx % colors.length]} 
                              radius={[4, 4, 0, 0]} 
                              barSize={selectedYears.length > 3 ? 12 : 20}
                              label={{ position: 'top', fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="panel-premium">
                <h2 style={{textAlign: 'center', marginBottom: '0.5rem', fontWeight: 900, color: 'var(--text)'}}>Mapa de <span style={{color: 'var(--primary)'}}>Intensidade</span></h2>
                <p style={{textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem'}}>Frequência mensal de ocorrências (Mapa de Calor)</p>
                <div className="heatmap-container">
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
                                style={{ background: getHeatmapColor(m.count), color: m.count > 4 ? 'white' : 'var(--text)' }}
                              >
                                <div>{m.count > 0 ? m.count : '-'}</div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            <SafetyManagement accidents={filteredAccidents} />
          ) : (
            <Breakdown accidents={filteredAccidents} />
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
      
      {filteredAccidents.length > 0 && (
        <div style={{marginTop: '2rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '0.5rem', border: '1px solid var(--primary)', color: 'var(--primary)', textAlign: 'center', fontWeight: 600}}>
           O dashboard está operando com filtros ativos. Os dados acima representam exclusivamente o cenário de {filterDivision === 'ALL' ? 'todas as unidades' : filterDivision}.
        </div>
      )}
    </div>
  );
};
