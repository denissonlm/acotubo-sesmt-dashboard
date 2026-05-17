import React from 'react';
import { Printer, ArrowLeft, Clock, ShieldCheck, FileText, Target } from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights, calculateTemporalStats, generateTemporalInsights, calculateSafetyRecords } from '../utils/dataLoader';
import { LOGO_BASE64 } from '../constants';

interface BatchPrintViewProps {
  accidents: Accident[];
  configs: {
    years: number[];
    unit: string;
    area: string;
  }[];
  onBack: () => void;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const ReportPage: React.FC<{ accidents: Accident[], years: number[], unit: string, area: string, pageNum: number }> = ({ accidents, years, unit, area, pageNum }) => {
  const stats = calculateStats(accidents, years);
  const monthlyInsights = generateInsights(accidents, years);
  const temporalInsights = generateTemporalInsights(accidents);
  const temporalStats = calculateTemporalStats(accidents);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#F1F5F9';
    if (count <= 2) return '#FEE2E2';
    if (count <= 4) return '#FCA5A5';
    if (count <= 6) return '#EF4444';
    if (count <= 8) return '#B91C1C';
    return '#7F1D1D';
  };

  const reportTitle = React.useMemo(() => {
    const yearsCount = years.length;
    switch (yearsCount) {
      case 1: return 'Visão Anual';
      case 2: return 'Visão Bienal';
      case 3: return 'Visão Trienal';
      case 4: return 'Visão Quadrienal';
      case 5: return 'Visão Quinquenal';
      case 6: return 'Visão Sexenal';
      default: return 'Visão Mensal';
    }
  }, [years]);

  return (
    <div className="batch-report-group">
      {/* Separator / Cover Page */}
      <div className="a4-portrait" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white', pageBreakAfter: 'always' }}>
        <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '80px', marginBottom: '3rem', filter: 'brightness(0) invert(1)' }} />
        <div style={{ height: '4px', width: '120px', background: '#B91C1C', marginBottom: '2rem' }}></div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', margin: '0 2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {unit !== 'ALL' ? unit : area}
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.7, marginTop: '1.5rem', fontWeight: 600 }}>RELATÓRIO ESTATÍSTICO DE ACIDENTES</p>
        <div style={{ marginTop: '4rem', padding: '1rem 2rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '1rem', fontWeight: 700 }}>
          {years.join(' • ')}
        </div>
        <div style={{ position: 'absolute', bottom: '3rem', fontSize: '0.8rem', opacity: 0.5 }}>SESMT GRUPO AÇOTUBO</div>
      </div>

      {/* Page 1: Monthly View */}
      <div className="a4-portrait" style={{ pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #B91C1C', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#B91C1C', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>{reportTitle}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: '#64748B', fontWeight: 700, fontSize: '0.75rem' }}>
                <span style={{ color: '#B91C1C' }}>{unit === 'ALL' ? 'Geral' : unit}</span>
                <span style={{ opacity: 0.3 }}>•</span>
                <span>{area === 'ALL' ? 'Todas as Áreas' : area}</span>
              </div>
            </div>
          </div>
          <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '36px' }} />
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A', textAlign: 'center' }}>COMPARATIVO MENSAL</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '6px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
              {MONTH_NAMES.map((m, i) => {
                 const maxVal = Math.max(...years.flatMap(y => stats[y]?.monthly.map(x => x.count) || []), 1);
                 return (
                  <div key={m} style={{ flex: 1, display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%', position: 'relative' }}>
                    {years.map((year, idx) => {
                      const count = stats[year]?.monthly[i].count || 0;
                      const colors = ['#B91C1C', '#64748B', '#0F172A'];
                      return (
                        <div key={year} style={{ flex: 1, height: `${(count / (maxVal + 2)) * 100}%`, background: colors[idx % 3], borderRadius: '2px 2px 0 0', position: 'relative' }}>
                          {count > 0 && <span style={{ position: 'absolute', top: '-14px', left: 0, right: 0, textAlign: 'center', fontSize: '8px', fontWeight: 900, color: colors[idx % 3] }}>{count}</span>}
                        </div>
                      );
                    })}
                    <span style={{ position: 'absolute', bottom: '-20px', left: 0, right: 0, textAlign: 'center', fontSize: '8px', fontWeight: 800, color: '#94A3B8' }}>{m}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
              {years.map((y, i) => (
                <div key={y} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 800 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: i === 0 ? '#B91C1C' : i === 1 ? '#64748B' : '#0F172A' }}></div>
                  {y}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A', textAlign: 'center' }}>MAPA DE CALOR</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px' }}></th>
                  {MONTH_NAMES.map(m => <th key={m} style={{ padding: '4px', color: '#64748B' }}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {years.map(year => (
                  <tr key={year}>
                    <td style={{ padding: '4px', fontWeight: 800 }}>{year}</td>
                    {stats[year]?.monthly.map((m, idx) => (
                      <td key={idx} style={{ padding: '4px', background: getHeatmapColor(m.count), border: '1px solid white', textAlign: 'center', color: m.count > 4 ? 'white' : 'black', fontWeight: 700, height: '24px' }}>
                        {m.count > 0 ? m.count : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>INSIGHTS ANALÍTICOS</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {monthlyInsights.slice(0, 4).map((insight, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderLeft: '4px solid #B91C1C', background: '#F8FAFC', borderRadius: '0 8px 8px 0' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0 }}>{insight.title}</h4>
                  <p style={{ fontSize: '0.65rem', margin: '4px 0 0', lineHeight: 1.3 }}>{insight.text}</p>
                </div>
              ))}
             </div>
          </div>
        </div>
        
        <footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>
          <span>Página {pageNum}</span>
          <span>© GRUPO AÇOTUBO - DOCUMENTO OFICIAL</span>
        </footer>
      </div>

      {/* Page 2: Temporal View */}
      <div className="a4-portrait" style={{ pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #3B82F6', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#3B82F6', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
              <Clock size={28} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Padrões Temporais</h1>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>{unit} • {area}</div>
            </div>
          </div>
          <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '36px' }} />
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', textAlign: 'center', color: '#64748B' }}>DIA DA SEMANA</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '110px', gap: '8px', paddingBottom: '20px', paddingTop: '25px' }}>
                {temporalStats.dayOfWeekStats.map(d => {
                   const maxVal = Math.max(...temporalStats.dayOfWeekStats.map(x => x.count), 1);
                   const barHeight = (d.count / (maxVal * 1.4)) * 110;
                   return (
                     <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '100%', height: `${barHeight}px`, background: '#3B82F6', borderRadius: '3px 3px 0 0', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: '-16px', left: 0, right: 0, textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#3B82F6' }}>{d.count}</span>
                        </div>
                       <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>{d.day.substring(0, 3)}</span>
                     </div>
                   );
                })}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center', color: '#64748B' }}>PERÍODO</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {temporalStats.periodStats.map(p => (
                  <div key={p.period} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{p.count}</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: p.color }}>{p.period}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', textAlign: 'center', color: '#64748B' }}>FLUXO 24H</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '80px', gap: '2px', position: 'relative', paddingTop: '20px' }}>
              {temporalStats.hourlyStats.map((h, i) => {
                const maxVal = Math.max(...temporalStats.hourlyStats.map(x => x.count), 1);
                const isPeak = h.count === maxVal && h.count > 0;
                return (
                  <div key={i} style={{ flex: 1, height: `${(h.count / maxVal) * 100}%`, background: isPeak ? '#B91C1C' : '#10B981', opacity: 0.8, position: 'relative' }}>
                    {isPeak && <span style={{ position: 'absolute', top: '-14px', left: 0, right: 0, textAlign: 'center', fontSize: '6px', fontWeight: 900, color: '#B91C1C' }}>{h.count}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '7px', fontWeight: 800, color: '#94A3B8' }}>
              <span>00H</span><span>06H</span><span>12H</span><span>18H</span><span>23H</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>ANÁLISE DE SEGURANÇA</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {temporalInsights.map((insight, idx) => (
                <div key={idx} style={{ padding: '0.75rem', borderLeft: '4px solid #3B82F6', background: '#F0F9FF', borderRadius: '0 8px 8px 0' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0 }}>{insight.title}</h4>
                  <p style={{ fontSize: '0.65rem', margin: '4px 0 0', lineHeight: 1.3 }}>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>
          <span>Página {pageNum + 1}</span>
          <span>DOCUMENTO OFICIAL GRUPO AÇOTUBO</span>
        </footer>
      </div>

      {/* Page 3: Safety Records */}
      <div className="a4-portrait" style={{ pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' }}>
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
               <div style={{ fontSize: '3rem', fontWeight: 900 }}>{calculateSafetyRecords(accidents).currentStreak}</div>
               <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981' }}>Dias sem Acidentes</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', marginBottom: '0.5rem' }}>RECORDE HISTÓRICO</div>
               <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0F172A' }}>{calculateSafetyRecords(accidents).historicalRecord}</div>
               <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B91C1C' }}>Marca de Referência</div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A', textAlign: 'center' }}>ESPAÇAMENTO MÉDIO ENTRE OCORRÊNCIAS</h3>
            {(() => {
              const records = calculateSafetyRecords(accidents);
              const displayIntervals = records.intervals.slice(-20);
              const maxVal = Math.max(...records.intervals.map(x => x.days), 1);
              
              if (displayIntervals.length === 0) {
                return (
                  <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.7rem', fontWeight: 700, background: '#F8FAFC', borderRadius: '12px' }}>
                    Dados insuficientes para gerar histórico de records.
                  </div>
                );
              }

              return (
                <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '4px', background: '#F8FAFC', padding: '10px', borderRadius: '12px' }}>
                  {displayIntervals.map((item, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          flex: 1, 
                          background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)', 
                          height: `${Math.max(5, (item.days / maxVal) * 100)}%`, 
                          borderRadius: '4px 4px 0 0',
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
            <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#64748B', marginTop: '0.75rem', fontWeight: 700 }}>Intervalos de dias sem acidentes entre cada ocorrência</div>
          </div>

          <div style={{ padding: '1rem', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
             <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0369A1', marginBottom: '0.25rem' }}>Compromisso com a Vida</h4>
             <p style={{ fontSize: '0.65rem', color: '#0369A1', lineHeight: 1.4 }}>Este indicador reflete o sucesso das barreiras de prevenção implementadas na unidade. O objetivo é a superação contínua do recorde histórico.</p>
          </div>
        </div>

        <footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>
          <span>Página {pageNum + 2}</span>
          <span>© GRUPO AÇOTUBO - DOCUMENTO OFICIAL</span>
        </footer>
      </div>

      {/* Combined Breakdown Summary + Detailed List */}
      {(() => {
        const counts = accidents.reduce((acc, a) => {
          acc[a.employee] = (acc[a.employee] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedAccidents = [...accidents].sort((a, b) => {
          if (counts[b.employee] !== counts[a.employee]) {
            return counts[b.employee] - counts[a.employee];
          }
          if (a.employee !== b.employee) {
            return a.employee.localeCompare(b.employee);
          }
          return b.date.getTime() - a.date.getTime();
        });

        // Rows for the first page (with summary cards)
        const rowsFirstPage = 7;
        const rowsSubsequentPages = 11;
        
        const pages = [];
        if (sortedAccidents.length > 0) {
          pages.push(sortedAccidents.slice(0, rowsFirstPage));
          for (let i = rowsFirstPage; i < sortedAccidents.length; i += rowsSubsequentPages) {
            pages.push(sortedAccidents.slice(i, i + rowsSubsequentPages));
          }
        } else {
          // Even if no accidents, show the summary page
          pages.push([]);
        }

        return pages.map((pageAccidents, pageIdx) => (
          <div key={pageIdx} className="a4-portrait" style={{ pageBreakAfter: 'always', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #8B5CF6', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ background: '#8B5CF6', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
                  <FileText size={28} />
                </div>
                <div>
                  <h1 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Breakdown de Causas</h1>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>{pageIdx === 0 ? 'Análise Detalhada de Fatores e Comportamento' : `Detalhamento de Ocorrências - Parte ${pageIdx + 1}`}</div>
                </div>
              </div>
              <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '36px' }} />
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              {pageIdx === 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[
                    { label: 'Ato Inseguro', val: (accidents.filter(a => a.unsafeAct).length / Math.max(accidents.length, 1)) * 100 },
                    { label: 'Deficiência M/E', val: (accidents.filter(a => a.machineDeficiency).length / Math.max(accidents.length, 1)) * 100 },
                    { label: 'Desvio Função', val: (accidents.filter(a => a.functionDeviation).length / Math.max(accidents.length, 1)) * 100 }
                  ].map(item => (
                    <div key={item.label} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>{Math.round(item.val)}%</div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {pageAccidents.length > 0 && (
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    {pageIdx === 0 ? 'OCORRÊNCIAS REGISTRADAS' : 'CONTINUAÇÃO DAS OCORRÊNCIAS'}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '2px solid #F1F5F9', background: '#F8FAFC' }}>
                        <th style={{ padding: '8px' }}>DATA</th>
                        <th style={{ padding: '8px' }}>COLABORADOR / CARGO</th>
                        <th style={{ padding: '8px' }}>RE</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>FREQ.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageAccidents.map((a, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px', fontWeight: 700 }}>{a.date.toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ fontWeight: 800, color: counts[a.employee] > 1 ? '#B91C1C' : '#1E293B' }}>{a.employee}</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 600 }}>{a.role}</div>
                          </td>
                          <td style={{ padding: '8px' }}>{a.re}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ background: counts[a.employee] > 1 ? '#FEE2E2' : '#F1F5F9', color: counts[a.employee] > 1 ? '#B91C1C' : '#64748B', padding: '3px 8px', borderRadius: '10px', display: 'inline-block', fontWeight: 900 }}>
                              {counts[a.employee]}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {pageIdx === pages.length - 1 && (
                <div style={{ marginTop: 'auto', padding: '1.25rem', background: '#F5F3FF', borderRadius: '16px', border: '1px solid #DDD6FE' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#5B21B6', marginBottom: '0.5rem' }}>Análise Consolidada</h4>
                  <p style={{ fontSize: '0.7rem', color: '#5B21B6', lineHeight: 1.5 }}>
                    Média de experiência dos envolvidos: <strong>{(accidents.reduce((sum, a) => sum + (a.experienceYears + a.experienceMonths/12), 0) / Math.max(accidents.length, 1)).toFixed(1)} anos</strong>. Relatório gerado para fins de auditoria interna SESMT.
                  </p>
                </div>
              )}
            </div>

            <footer style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>
              <span>Página {pageNum + 3 + pageIdx}</span>
              <span>© GRUPO AÇOTUBO - DOCUMENTO OFICIAL</span>
            </footer>
          </div>
        ));
      })()}
    </div>
  );
};

export const BatchPrintView: React.FC<BatchPrintViewProps> = ({ accidents, configs, onBack }) => {
  return (
    <div className="batch-print-container">
      <div className="print-controls no-print" style={{ 
        padding: '1rem 2rem', 
        background: 'rgba(15, 23, 42, 0.95)', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0, left: 0, right: 0, zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Cancelar
          </button>
          <div style={{ fontWeight: 800 }}>Modo Massa (A4) • {configs.length} Relatórios</div>
        </div>
        <button onClick={() => window.print()} className="btn-pdf" style={{ padding: '0.6rem 2.5rem' }}>
          <Printer size={20} />
          <span>Gerar PDF Consolidado</span>
        </button>
      </div>

      <div className="batch-content-flow" style={{ width: '100%', paddingTop: '80px' }}>
        {/* Ranked Summary Table Calculation */}
        {(() => {
          const summaryData = configs.map(config => {
            const filtered = accidents.filter(a => {
              const yearMatch = config.years.includes(a.year);
              const unitMatch = config.unit === 'ALL' || a.division === config.unit;
              const areaMatch = config.area === 'ALL' || a.area === config.area;
              return yearMatch && unitMatch && areaMatch;
            });
            const total = filtered.length;
            const lostDays = filtered.reduce((sum, a) => sum + (a.lostDays || 0), 0);
            const temporal = calculateTemporalStats(filtered);
            const peakPeriod = [...temporal.periodStats].sort((a, b) => b.count - a.count)[0]?.period || '-';
            const peakDay = [...temporal.dayOfWeekStats].sort((a, b) => b.count - a.count)[0]?.day || '-';
            
            return {
              config,
              total,
              lostDays,
              peakPeriod,
              peakDay,
              avg: (total / (config.years.length * 12)).toFixed(2)
            };
          }).sort((a, b) => b.lostDays - a.lostDays || b.total - a.total);

          // Chunk summary data into pages of 14 items for Portrait
          const chunks = [];
          for (let i = 0; i < summaryData.length; i += 14) {
            chunks.push(summaryData.slice(i, i + 14));
          }

          return chunks.map((chunk, chunkIdx) => (
            <div key={`summary-${chunkIdx}`} className="a4-portrait" style={{ 
              padding: '2.5rem 2rem', 
              display: 'flex', 
              flexDirection: 'column',
              background: 'white',
              pageBreakAfter: 'always',
              marginBottom: '2rem'
            }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '4px solid var(--primary)', paddingBottom: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>SUMÁRIO ANALÍTICO {chunks.length > 1 ? `(P. ${chunkIdx + 1})` : ''}</h1>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>RANKING POR DIAS PERDIDOS • GRUPO AÇOTUBO</p>
                </div>
                <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '32px' }} />
              </header>

              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                  <thead>
                    <tr style={{ background: '#0F172A', color: 'white' }}>
                      <th style={{ padding: '0.6rem', textAlign: 'left', borderRadius: '4px 0 0 0' }}>SEGMENTO</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>QTD</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>D.P.</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>CRÍTICO</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right', borderRadius: '0 4px 0 0' }}>PÁGINA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, idx) => {
                      const originalIdx = configs.findIndex(c => c === item.config);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'transparent' : '#F8FAFC' }}>
                          <td style={{ padding: '0.6rem', fontWeight: 800, color: '#1E293B' }}>
                            {item.config.unit !== 'ALL' ? item.config.unit : item.config.area}
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700 }}>{item.total}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 900, color: 'var(--primary)' }}>{item.lostDays}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase' }}>{item.peakPeriod}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 900, color: '#94A3B8' }}>P. {(() => {
                            // Calculate the start page for this specific config
                            let p = Math.ceil(configs.length / 14) + 1;
                            for (let i = 0; i < originalIdx; i++) {
                              const c = configs[i];
                              const f = accidents.filter(a => (c.years.includes(a.year) && (c.unit === 'ALL' || a.division === c.unit) && (c.area === 'ALL' || a.area === c.area)));
                              let bCount = 1;
                              if (f.length > 7) bCount = 1 + Math.ceil((f.length - 7) / 11);
                              p += 4 + bCount;
                            }
                            return p;
                          })()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {chunkIdx === chunks.length - 1 && (() => {
                const totalFilteredAccidents = accidents.filter(a => {
                  const yearsInConfigs = Array.from(new Set(configs.flatMap(c => c.years)));
                  return yearsInConfigs.includes(a.year);
                }).length;

                return (
                  <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#F1F5F9', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748B' }}>VOLUME TOTAL</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900 }}>{totalFilteredAccidents} Registros</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: '#0F172A', borderRadius: '10px', color: 'white', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.7 }}>RANKING</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900 }}>{configs.length} Áreas</div>
                    </div>
                  </div>
                );
              })()}

              <footer style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.5rem', color: '#94A3B8', fontWeight: 700 }}>
                DOCUMENTO OFICIAL GRUPO AÇOTUBO
              </footer>
            </div>
          ));
        })()}

        {(() => {
          const summaryPages = Math.ceil(configs.length / 14);
          let currentPageNum = summaryPages + 1;

          return configs.map((config, idx) => {
            const filtered = accidents.filter(a => {
              const yearMatch = config.years.includes(a.year);
              const unitMatch = config.unit === 'ALL' || a.division === config.unit;
              const areaMatch = config.area === 'ALL' || a.area === config.area;
              return yearMatch && unitMatch && areaMatch;
            });

            const rowsFirstPage = 7;
            const rowsSubsequentPages = 11;
            let breakdownPagesCount = 1;
            if (filtered.length > rowsFirstPage) {
              breakdownPagesCount = 1 + Math.ceil((filtered.length - rowsFirstPage) / rowsSubsequentPages);
            }

            const startPage = currentPageNum;
            currentPageNum += 4 + breakdownPagesCount; // Cover + 3 fixed + breakdown pages

            return (
              <ReportPage 
                key={idx} 
                accidents={filtered} 
                years={config.years} 
                unit={config.unit} 
                area={config.area} 
                pageNum={startPage} 
              />
            );
          });
        })()}
      </div>
    </div>
  );
};
