import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertCircle, TrendingUp, Calendar, Printer, ShieldCheck, Layers, Upload } from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights, generateTemporalInsights } from '../utils/dataLoader';
import { motion } from 'framer-motion';
import { LOGO_BASE64 } from '../constants';
import { TemporalAnalysis } from './TemporalAnalysis';

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
  onPrint: () => void;
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
  onBatchPrint 
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'temporal'>('monthly');

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
    <div className="dashboard">
      <header className="header no-print" style={{ padding: '0.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)', padding: '0.75rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(185, 28, 28, 0.2)' }}>
            <img src={LOGO_BASE64} alt="Logo" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 900 }}>{dashboardTitle}</h1>
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
            onClick={onReset} 
            className="btn-pdf" 
            title="Reenviar Excel"
            style={{ background: '#334155', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
          >
            <Upload size={20} />
          </button>
          <button 
            onClick={onBatchPrint}
            className="btn-pdf" 
            title="Relatórios em Massa"
            style={{ background: '#3B82F6', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
          >
            <Layers size={22} />
          </button>
          <button 
            onClick={onPrint} 
            className="btn-pdf" 
            title="Gerar Relatório PDF"
            style={{ background: 'var(--primary)', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
          >
            <Printer size={22} />
          </button>
        </div>
      </header>

      <div className="filters-bar no-print" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
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
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.4rem', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('monthly')}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'monthly' ? 'white' : 'transparent',
              color: activeTab === 'monthly' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.85rem',
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
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'temporal' ? 'white' : 'transparent',
              color: activeTab === 'temporal' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'temporal' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Análise por Horário / Dia
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
              >
                <h3>{year}</h3>
                <div className="count">{s.total}</div>
                <div className="stats-line">
                  <span>acidentes</span>
                  <strong>média {s.avgPerMonth}/mês</strong>
                </div>
              </motion.div>
            );
          })}

          <div style={{marginTop: '2rem', padding: '1.5rem', background: '#0F172A', borderRadius: '1rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
               <div style={{width: 24, height: 24, background: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                 <ShieldCheck size={14} color="white" />
               </div>
               <span style={{fontWeight: 800}}>SESMT Grupo Açotubo</span>
            </div>
            <p style={{fontSize: '0.75rem', opacity: 0.8, fontStyle: 'italic'}}>"Segurança é compromisso de todos."</p>
            <p style={{fontSize: '0.6rem', opacity: 0.5, marginTop: '1rem'}}>ANÁLISE OFICIAL · {new Date().getFullYear()}</p>
          </div>
        </aside>

        <main className="content-area">
          {activeTab === 'monthly' ? (
            <>
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
          ) : (
            <TemporalAnalysis accidents={filteredAccidents} />
          )}
        </main>

        {/* Right: Períodos de Atenção */}
        {/* Right: Insights / Storytelling */}
        {/* Right: Insights / Storytelling (Top 3) */}
        <aside className="insights-panel">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              {activeTab === 'monthly' ? 'Períodos de ' : 'Análise de '}
              <span style={{ color: 'var(--primary)' }}>{activeTab === 'monthly' ? 'Atenção' : 'Padrões'}</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
              {activeTab === 'monthly' ? `Padrões identificados na comparação ${yearsLabel.adj}` : 'Storytelling baseado em horários e dias'}
            </p>
          </div>
          
          {(activeTab === 'monthly' ? monthlyInsights : temporalInsights).slice(0, 3).map((insight, idx) => {
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
      {(activeTab === 'monthly' ? monthlyInsights : temporalInsights).length >= 4 && (
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
              {(activeTab === 'monthly' ? monthlyInsights : temporalInsights)[3].title}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#475569', fontWeight: 500 }}>
              {(activeTab === 'monthly' ? monthlyInsights : temporalInsights)[3].text}
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
