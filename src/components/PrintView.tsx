import React, { useMemo } from 'react';
import { Printer, ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import type { Accident } from '../types';
import { calculateStats, generateInsights } from '../utils/dataLoader';
import { LOGO_BASE64 } from '../constants';

interface PrintViewProps {
  accidents: Accident[];
  selectedYears: number[];
  onBack: () => void;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const PrintView: React.FC<PrintViewProps> = ({ accidents, selectedYears, onBack }) => {
  const stats = useMemo(() => calculateStats(accidents, selectedYears), [accidents, selectedYears]);
  const insights = useMemo(() => generateInsights(accidents, selectedYears), [accidents, selectedYears]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#F8FAFC';
    if (count <= 2) return '#FEE2E2';
    if (count <= 4) return '#FECACA';
    if (count <= 7) return '#F87171';
    return '#B91C1C';
  };

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
          <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Modo de Impressão Profissional</div>
        </div>
        <button onClick={() => window.print()} className="btn-pdf" style={{ padding: '0.6rem 2rem' }}>
          <Printer size={20} />
          <span>Confirmar e Imprimir</span>
        </button>
      </div>

      <div className="a4-landscape">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '2px solid #B91C1C', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ background: '#B91C1C', padding: '1rem', borderRadius: '12px', color: 'white' }}>
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Relatório Estatístico Trienal</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#64748B', fontWeight: 600 }}>
                <FileText size={14} />
                <span>Gestão de Segurança do Trabalho • {selectedYears.join(' - ')}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '48px', objectFit: 'contain' }} />
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>RELATÓRIO OFICIAL GRUPO AÇOTUBO</div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: '1.5rem' }}>
          {/* Left: Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Panorama Anual</div>
            {selectedYears.map(year => (
              <div key={year} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#B91C1C' }}></div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>ANO {year}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', margin: '0.25rem 0' }}>{stats[year]?.total || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 700 }}>{stats[year]?.avgPerMonth || 0} acidentes/mês</div>
              </div>
            ))}
          </div>

          {/* Center: Charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem', color: '#0F172A' }}>COMPARATIVO <span style={{ color: '#B91C1C' }}>MENSAL DE INCIDÊNCIA</span></h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '6px', paddingBottom: '25px', position: 'relative' }}>
                {MONTH_NAMES.map((m, i) => {
                  const maxVal = Math.max(...selectedYears.map(y => stats[y]?.monthly[i].count || 0), 1);
                  return (
                    <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '150px', width: '100%' }}>
                        {selectedYears.map((y, yi) => {
                          const val = stats[y]?.monthly[i].count || 0;
                          const height = (val / (maxVal + 2)) * 150;
                          return (
                            <div key={y} style={{ 
                              flex: 1, 
                              height: `${height}px`, 
                              background: yi === 0 ? '#B91C1C' : yi === 1 ? '#64748B' : '#0F172A',
                              borderRadius: '3px 3px 0 0',
                              position: 'relative',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                            }}>
                              {val > 0 && <span style={{ position: 'absolute', top: '-16px', left: 0, right: 0, textAlign: 'center', fontSize: '9px', fontWeight: 900, color: '#0F172A' }}>{val}</span>}
                            </div>
                          );
                        })}
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B' }}>{m}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.5rem' }}>
                {selectedYears.map((y, i) => (
                  <div key={y} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: i === 0 ? '#B91C1C' : i === 1 ? '#64748B' : '#0F172A' }}></div>
                    {y}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem', color: '#0F172A' }}>MAPA DE <span style={{ color: '#B91C1C' }}>INTENSIDADE CRÍTICA</span></h3>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
                <thead>
                  <tr>
                    <th></th>
                    {MONTH_NAMES.map(m => <th key={m} style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 800, paddingBottom: '5px' }}>{m}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {selectedYears.map(y => (
                    <tr key={y}>
                      <td style={{ fontSize: '10px', fontWeight: 900, color: '#0F172A', paddingRight: '8px' }}>{y}</td>
                      {stats[y]?.monthly.map((m, mi) => (
                        <td key={mi} style={{ 
                          height: '28px', 
                          background: getHeatmapColor(m.count), 
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: m.count > 5 ? 'white' : '#0F172A',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                          {m.count > 0 ? m.count : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>
                <span>MENOR INTENSIDADE</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ width: '20px', height: '8px', borderRadius: '2px', background: getHeatmapColor(i === 0 ? 0 : i === 1 ? 2 : i === 2 ? 4 : i === 3 ? 7 : 10) }}></div>)}
                </div>
                <span>MAIOR INTENSIDADE</span>
              </div>
            </div>
          </div>

          {/* Right: Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Análise de Segurança</div>
            {insights.map((insight, idx) => {
              const styles = {
                danger: { bg: '#FFF1F2', border: '#FDA4AF', text: '#9F1239' },
                warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
                info: { bg: '#F0F9FF', border: '#BAE6FD', text: '#075985' },
                success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' }
              };
              const config = styles[insight.type as keyof typeof styles];

              return (
                <div key={idx} style={{ 
                  background: config.bg, 
                  border: `1px solid ${config.border}`, 
                  borderLeft: `4px solid ${config.text}`, 
                  padding: '1rem', 
                  borderRadius: '12px',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: config.text, marginBottom: '0.25rem' }}>{insight.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: config.text, lineHeight: '1.4', fontWeight: 500 }}>{insight.text}</p>
                </div>
              );
            })}
            
            <div style={{ marginTop: 'auto', background: '#0F172A', padding: '1.25rem', borderRadius: '16px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: '#B91C1C', padding: '0.4rem', borderRadius: '6px' }}>
                  <ShieldCheck size={16} />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>VALIDAÇÃO SESMT</div>
              </div>
              <p style={{ fontSize: '0.65rem', opacity: 0.7, lineHeight: '1.4' }}>Este documento é de uso interno e contém dados confidenciais de segurança do trabalho do Grupo Açotubo.</p>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.6rem', color: '#94A3B8', textAlign: 'center' }}>
                DOCUMENTO GERADO DIGITALMENTE EM {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
