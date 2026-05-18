import React, { useMemo } from 'react';
import { Printer, ArrowLeft, FileText, ShieldCheck, Clock, Target } from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights, calculateTemporalStats, generateTemporalInsights, calculateSafetyRecords } from '../utils/dataLoader';
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
    if (count === 0) return '#F1F5F9';
    if (count <= 2) return '#FEE2E2';
    if (count <= 4) return '#FCA5A5';
    if (count <= 6) return '#EF4444';
    if (count <= 8) return '#B91C1C';
    return '#7F1D1D';
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

  const { breakdownPages, counts } = useMemo(() => {
    const accCounts = filteredAccidents.reduce((acc, a) => {
      acc[a.employee] = (acc[a.employee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedAccidents = [...filteredAccidents].sort((a, b) => {
      if (accCounts[b.employee] !== accCounts[a.employee]) {
        return accCounts[b.employee] - accCounts[a.employee];
      }
      if (a.employee !== b.employee) {
        return a.employee.localeCompare(b.employee);
      }
      return b.date.getTime() - a.date.getTime();
    });

    const pages = [];
    if (sortedAccidents.length === 0) {
      pages.push([]);
    } else {
      let currentIndex = 0;
      // First page can fit fewer rows due to the summary header blocks
      const rowsPerPageFirst = 10;
      const rowsPerPageRest = 14;
      
      pages.push(sortedAccidents.slice(0, rowsPerPageFirst));
      currentIndex += rowsPerPageFirst;
      
      while (currentIndex < sortedAccidents.length) {
        pages.push(sortedAccidents.slice(currentIndex, currentIndex + rowsPerPageRest));
        currentIndex += rowsPerPageRest;
      }
    }
    return { breakdownPages: pages, counts: accCounts };
  }, [filteredAccidents]);

  const totalPages = 3 + breakdownPages.length;
  const formatPageNum = (n: number) => n < 10 ? `0${n}` : n;

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
                            position: 'relative'
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
                        color: m.count > 4 ? 'white' : '#0F172A',
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
            <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>PÁGINA 01 / {formatPageNum(totalPages)}</div>
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
                        <div style={{ width: '100%', height: `${barHeight}px`, background: '#3B82F6', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: '-18px', left: 0, right: 0, textAlign: 'center', fontSize: '10px', fontWeight: 900, color: '#3B82F6' }}>{d.count}</span>
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
                const isPeak = h.count === maxVal && maxVal > 0;
                return (
                  <div key={i} style={{ flex: 1, height: `${(h.count / maxVal) * 100}%`, background: isPeak ? '#B91C1C' : '#3B82F6', opacity: 0.8, position: 'relative' }}>
                    {isPeak && <span style={{ position: 'absolute', top: '-14px', left: 0, right: 0, textAlign: 'center', fontSize: '6px', fontWeight: 900, color: '#B91C1C' }}>{h.count}</span>}
                  </div>
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
            <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>PÁGINA 02 / {formatPageNum(totalPages)}</div>
          </footer>
        </div>
      </div>

      {/* Page 3: Safety Records */}
      <div className="a4-portrait">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #10B981', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#10B981', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
              <Target size={28} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Gestão de Records</h1>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Metas e Indicadores de Dias Sem Acidentes</div>
            </div>
          </div>
          <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '36px' }} />
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: '#0F172A', padding: '1.5rem', borderRadius: '16px', color: 'white' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, marginBottom: '0.5rem' }}>STATUS ATUAL</div>
               <div style={{ fontSize: '3rem', fontWeight: 900 }}>{calculateSafetyRecords(filteredAccidents).currentStreak}</div>
               <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981' }}>Dias sem Acidentes</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', marginBottom: '0.5rem' }}>RECORDE HISTÓRICO</div>
               <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0F172A' }}>{calculateSafetyRecords(filteredAccidents).historicalRecord}</div>
               <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B91C1C' }}>Marca de Referência</div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A', textAlign: 'center' }}>HISTÓRICO DE ESPAÇAMENTO (D.S.A)</h3>
            {(() => {
              const records = calculateSafetyRecords(filteredAccidents);
              const displayIntervals = records.intervals.slice(-25);
              const maxVal = Math.max(...records.intervals.map(x => x.days), 1);
              
              if (displayIntervals.length === 0) {
                return (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700, background: '#F8FAFC', borderRadius: '12px' }}>
                    Sem histórico de registros para o período.
                  </div>
                );
              }

              return (
                <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '3px', background: '#F8FAFC', padding: '12px', borderRadius: '12px' }}>
                  {displayIntervals.map((item, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        flex: 1, 
                        background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)', 
                        height: `${Math.max(4, (item.days / maxVal) * 100)}%`, 
                        borderRadius: '3px 3px 0 0',
                        position: 'relative'
                      }}
                    >
                      <span style={{ position: 'absolute', top: '-14px', left: 0, right: 0, textAlign: 'center', fontSize: '7px', fontWeight: 900, color: '#059669' }}>
                        {item.days}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748B', marginTop: '0.5rem', fontWeight: 700 }}>Fluxo cronológico dos intervalos entre ocorrências</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>METAS E DIRETRIZES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div style={{ padding: '0.85rem', borderLeft: '4px solid #10B981', background: '#F0FDF4', borderRadius: '0 8px 8px 0' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, margin: 0 }}>Cultura Zero Acidentes</h4>
                  <p style={{ fontSize: '0.65rem', margin: '4px 0 0' }}>A manutenção do recorde exige vigilância constante e reporte de quase-acidentes.</p>
               </div>
               <div style={{ padding: '0.85rem', borderLeft: '4px solid #B91C1C', background: '#FEF2F2', borderRadius: '0 8px 8px 0' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, margin: 0 }}>Análise de Desvio</h4>
                  <p style={{ fontSize: '0.65rem', margin: '4px 0 0' }}>Qualquer reinicialização do contador deve ser seguida de um plano de ação robusto.</p>
               </div>
            </div>
          </div>

          <footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>DOCUMENTO TÉCNICO OFICIAL - GRUPO AÇOTUBO</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>PÁGINA 03 / {formatPageNum(totalPages)}</div>
          </footer>
        </div>
      </div>

      {/* Page 4+: Breakdown Details */}
      {breakdownPages.map((pageAccidents, pageIdx) => (
        <div key={`breakdown-page-${pageIdx}`} className="a4-portrait">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #8B5CF6', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: '#8B5CF6', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
                <FileText size={28} />
              </div>
              <div>
                <h1 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Análise de Breakdown</h1>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Fatores Causais e Recorrência Individual {breakdownPages.length > 1 ? `(Parte ${pageIdx + 1})` : ''}</div>
              </div>
            </div>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '36px' }} />
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {pageIdx === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Ato Inseguro', val: (filteredAccidents.filter(a => a.unsafeAct).length / Math.max(filteredAccidents.length, 1)) * 100 },
                  { label: 'Defic. M/E', val: (filteredAccidents.filter(a => a.machineDeficiency).length / Math.max(filteredAccidents.length, 1)) * 100 },
                  { label: 'Desvio Fun.', val: (filteredAccidents.filter(a => a.functionDeviation).length / Math.max(filteredAccidents.length, 1)) * 100 },
                  { label: 'Capacitado', val: (filteredAccidents.filter(a => a.hadTraining).length / Math.max(filteredAccidents.length, 1)) * 100 },
                  { label: 'EPI OK', val: (filteredAccidents.filter(a => a.usedEPI).length / Math.max(filteredAccidents.length, 1)) * 100 }
                ].map(item => (
                  <div key={item.label} style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>{Math.round(item.val)}%</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #F1F5F9' }}>
                    <th style={{ padding: '6px' }}>DATA</th>
                    <th style={{ padding: '6px' }}>COLABORADOR / CARGO</th>
                    <th style={{ padding: '6px' }}>RE</th>
                    <th style={{ padding: '6px', textAlign: 'center' }}>FREQ.</th>
                  </tr>
                </thead>
                <tbody>
                  {pageAccidents.map((a, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px', fontWeight: 700 }}>{a.date.toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '6px' }}>
                        <div style={{ fontWeight: 800, color: counts[a.employee] > 1 ? '#B91C1C' : 'inherit' }}>{a.employee}</div>
                        <div style={{ fontSize: '0.55rem', color: '#64748B' }}>{a.role}</div>
                      </td>
                      <td style={{ padding: '6px' }}>{a.re}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 900, color: counts[a.employee] > 1 ? '#B91C1C' : '#64748B' }}>{counts[a.employee]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageIdx === breakdownPages.length - 1 && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0', marginTop: 'auto' }}>
                 <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0F172A' }}>PERFIL DE EXPERIÊNCIA</h3>
                 <div style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.5 }}>
                   Média de tempo de casa: <strong>{(filteredAccidents.reduce((sum, a) => sum + (a.experienceYears + a.experienceMonths/12), 0) / Math.max(filteredAccidents.length, 1)).toFixed(1)} anos</strong>.
                 </div>
              </div>
            )}

            <footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>DOCUMENTO TÉCNICO OFICIAL - GRUPO AÇOTUBO</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900 }}>PÁGINA {formatPageNum(4 + pageIdx)} / {formatPageNum(totalPages)}</div>
            </footer>
          </div>
        </div>
      ))}
    </div>
  );
};
