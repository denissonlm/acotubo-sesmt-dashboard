import React, { useMemo } from 'react';
import { Printer, ArrowLeft, FileText, ShieldCheck, Clock } from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights, calculateTemporalStats, generateTemporalInsights } from '../utils/dataLoader';
import { LOGO_BASE64 } from '../constants';

interface PrintViewProps {
  accidents: Accident[];
  selectedYears: number[];
  filterDivision: string;
  filterManager: string;
  filterArea: string;
  onBack: () => void;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const PrintView: React.FC<PrintViewProps> = ({ 
  accidents, 
  selectedYears, 
  filterDivision,
  filterManager,
  filterArea,
  onBack 
}) => {
  const filteredAccidents = useMemo(() => {
    return accidents.filter(a => {
      const matchesYear = selectedYears.includes(a.year);
      const matchesDivision = filterDivision === 'ALL' || a.division === filterDivision;
      const matchesManager = filterManager === 'ALL' || a.manager === filterManager;
      const matchesArea = filterArea === 'ALL' || a.area === filterArea;
      return matchesYear && matchesDivision && matchesManager && matchesArea;
    });
  }, [accidents, selectedYears, filterDivision, filterManager, filterArea]);

  const stats = useMemo(() => calculateStats(filteredAccidents, selectedYears), [filteredAccidents, selectedYears]);
  const insights = useMemo(() => generateInsights(filteredAccidents, selectedYears), [filteredAccidents, selectedYears]);
  const temporalStats = useMemo(() => calculateTemporalStats(filteredAccidents), [filteredAccidents]);
  const temporalInsights = useMemo(() => generateTemporalInsights(filteredAccidents), [filteredAccidents]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#F8FAFC';
    if (count <= 2) return '#FEE2E2';
    if (count <= 4) return '#FECACA';
    if (count <= 7) return '#F87171';
    return '#B91C1C';
  };

  const reportTitle = useMemo(() => {
    const yearsCount = selectedYears.length;
    switch (yearsCount) {
      case 1: return 'Relatório Anual';
      case 2: return 'Relatório Bienal';
      case 3: return 'Relatório Trienal';
      case 4: return 'Relatório Quadrienal';
      case 5: return 'Relatório Quinquenal';
      case 6: return 'Relatório Sexenal';
      default: return 'Relatório Estatístico';
    }
  }, [selectedYears]);

  return (
    <div className="print-container">
      <div className="print-controls no-print" style={{ 
        padding: '1rem 2rem', 
        background: 'rgba(15, 23, 42, 0.9)', 
        backdropFilter: 'blur(10px)',
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
            <ArrowLeft size={18} /> Voltar ao Painel
          </button>
          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Modo de Impressão Profissional (A4)</div>
        </div>
        <button onClick={() => window.print()} className="btn-pdf" style={{ padding: '0.6rem 2rem' }}>
          <Printer size={20} />
          <span>Confirmar e Imprimir</span>
        </button>
      </div>

      <div className="a4-portrait">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #B91C1C', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#B91C1C', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>{reportTitle}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>
                <FileText size={12} />
                <span>{filterDivision === 'ALL' ? 'Grupo Açotubo' : filterDivision} • {filterArea === 'ALL' ? 'Todas as Áreas' : filterArea} • {selectedYears.join(' - ')}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '36px' }} />
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Row: Panorama Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedYears.length}, 1fr)`, gap: '1rem' }}>
            {selectedYears.map(year => (
              <div key={year} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>ANO {year}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A' }}>{stats[year]?.total || 0}</div>
                <div style={{ fontSize: '0.65rem', color: '#B91C1C', fontWeight: 700 }}>{stats[year]?.avgPerMonth || 0} acidentes/mês</div>
              </div>
            ))}
          </div>

          {/* Monthly Comparison */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.25rem', color: '#0F172A' }}>COMPARATIVO MENSAL DE INCIDÊNCIA</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '6px', paddingBottom: '20px', position: 'relative' }}>
              {MONTH_NAMES.map((m, i) => {
                const maxVal = Math.max(...selectedYears.map(y => stats[y]?.monthly[i].count || 0), 1);
                return (
                  <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '110px', width: '100%' }}>
                      {selectedYears.map((y, yi) => {
                        const val = stats[y]?.monthly[i].count || 0;
                        const height = (val / (maxVal + 2)) * 110;
                        return (
                          <div key={y} style={{ 
                            flex: 1, 
                            height: `${height}px`, 
                            background: yi === 0 ? '#B91C1C' : yi === 1 ? '#64748B' : '#0F172A',
                            borderRadius: '2px 2px 0 0',
                          }}>
                            {val > 0 && <span style={{ position: 'absolute', top: '-14px', width: '100%', textAlign: 'center', fontSize: '8px', fontWeight: 900, color: '#0F172A' }}>{val}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#64748B' }}>{m}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
              {selectedYears.map((y, i) => (
                <div key={y} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 800 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: i === 0 ? '#B91C1C' : i === 1 ? '#64748B' : '#0F172A' }}></div>
                  {y}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem', color: '#0F172A' }}>MAPA DE INTENSIDADE CRÍTICA</h3>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '2px' }}>
              <thead>
                <tr>
                  <th></th>
                  {MONTH_NAMES.map(m => <th key={m} style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 800 }}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {selectedYears.map(y => (
                  <tr key={y}>
                    <td style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A' }}>{y}</td>
                    {stats[y]?.monthly.map((m, mi) => (
                      <td key={mi} style={{ 
                        height: '24px', 
                        background: getHeatmapColor(m.count), 
                        borderRadius: '3px',
                        textAlign: 'center',
                        fontSize: '9px',
                        fontWeight: 800,
                        color: m.count > 5 ? 'white' : '#0F172A',
                      }}>
                        {m.count > 0 ? m.count : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {insights.slice(0, 4).map((insight, idx) => {
              const styles = {
                danger: { bg: '#FFF1F2', border: '#FDA4AF', text: '#9F1239' },
                warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
                info: { bg: '#F0F9FF', border: '#BAE6FD', text: '#075985' },
                success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' }
              };
              const config = styles[insight.type as keyof typeof styles] || styles.info;
              return (
                <div key={idx} style={{ background: config.bg, border: `1px solid ${config.border}`, borderLeft: `3px solid ${config.text}`, padding: '0.75rem', borderRadius: '10px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: config.text, marginBottom: '0.15rem' }}>{insight.title}</h4>
                  <p style={{ fontSize: '0.65rem', color: config.text, lineHeight: '1.3' }}>{insight.text}</p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', background: '#0F172A', padding: '1rem', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={14} color="#B91C1C" />
              <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>VALIDAÇÃO SESMT AÇOTUBO</div>
            </div>
            <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>PÁGINA 01 / 02</div>
          </div>
        </div>
      </div>

      {/* Page 2: Temporal Analysis */}
      <div className="a4-portrait">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #3B82F6', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#3B82F6', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
              <Clock size={28} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Análise Temporal</h1>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Frequência por Horário e Dia da Semana</div>
            </div>
          </div>
          <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '36px' }} />
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A', textAlign: 'center' }}>DIA DA SEMANA</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '8px', paddingBottom: '20px', paddingTop: '25px' }}>
                {temporalStats.dayOfWeekStats.map(d => {
                  const maxVal = Math.max(...temporalStats.dayOfWeekStats.map(x => x.count), 1);
                  const barHeight = (d.count / (maxVal * 1.4)) * 120;
                  return (
                    <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '100%', height: `${barHeight}px`, background: '#3B82F6', borderRadius: '3px 3px 0 0', position: 'relative' }}>
                        {d.count > 0 && <span style={{ position: 'absolute', top: '-16px', width: '100%', textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#3B82F6' }}>{d.count}</span>}
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>{d.day.substring(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0F172A', textAlign: 'center' }}>PERÍODO DO DIA</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {temporalStats.periodStats.map(p => (
                  <div key={p.period} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{p.count}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: p.color }}>{p.period}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A', textAlign: 'center' }}>FLUXO HORÁRIO (24H)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '2px' }}>
              {temporalStats.hourlyStats.map((h, i) => {
                const maxVal = Math.max(...temporalStats.hourlyStats.map(x => x.count), 1);
                return (
                  <div key={i} style={{ flex: 1, height: `${(h.count / maxVal) * 100}%`, background: '#10B981', opacity: 0.8 }}></div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '8px', fontWeight: 800, color: '#94A3B8' }}>
              <span>00H</span><span>06H</span><span>12H</span><span>18H</span><span>23H</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>INSIGHTS TEMPORAIS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {temporalInsights.map((insight, idx) => (
                <div key={idx} style={{ padding: '0.85rem', borderLeft: '4px solid #3B82F6', background: '#F0F9FF', borderRadius: '0 8px 8px 0' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 900, margin: 0 }}>{insight.title}</h4>
                  <p style={{ fontSize: '0.65rem', margin: '4px 0 0', lineHeight: 1.4 }}>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

          <footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>DOCUMENTO TÉCNICO OFICIAL</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>PÁGINA 02 / 02</div>
          </footer>
        </div>
      </div>
    </div>
  );
};
