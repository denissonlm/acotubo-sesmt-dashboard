import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer 
} from 'recharts';
import { 
  Printer, ArrowLeft, ShieldCheck, Calendar, Clock, CheckCircle2 
} from 'lucide-react';
import type { Accident } from '../types';
import { LOGO_BASE64 } from '../constants';

interface MonthDrilldownPrintViewProps {
  accidents: Accident[];
  year: number;
  month: number;
  metric: 'accidents' | 'lostDays';
  filterDivision?: string;
  filterManager?: string;
  filterArea?: string;
  filterAreas?: string[];
  onBack: () => void;
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const MonthDrilldownPrintView: React.FC<MonthDrilldownPrintViewProps> = ({
  accidents,
  year,
  month,
  metric,
  filterDivision = 'ALL',
  filterManager = 'ALL',
  filterArea = 'ALL',
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

  // Filtragem baseada nos filtros globais ativos
  const filteredAccidents = useMemo(() => {
    return accidents.filter(a => {
      const matchesDivision = filterDivision === 'ALL' || a.division === filterDivision;
      const matchesManager = filterManager === 'ALL' || a.manager === filterManager;
      const matchesArea = activeAreas.length === 0 || activeAreas.includes(a.area);
      return matchesDivision && matchesManager && matchesArea;
    });
  }, [accidents, filterDivision, filterManager, activeAreas]);

  // Ocorrências específicas do mês e ano selecionados
  const monthAccidents = useMemo(() => {
    return filteredAccidents
      .filter(a => a.year === year && a.month === month)
      .sort((a, b) => {
        const da = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
        const db = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
        return da - db;
      });
  }, [filteredAccidents, year, month]);

  // Estatísticas do mês
  const totalAccidents = monthAccidents.length;
  const totalLostDays = monthAccidents.reduce((sum, a) => sum + (Number(a.lostDays) || 0), 0);
  const catCount = monthAccidents.filter(a => a.hasCat).length;
  const catPercent = totalAccidents > 0 ? Math.round((catCount / totalAccidents) * 100) : 0;
  const unsafeActCount = monthAccidents.filter(a => a.unsafeAct).length;
  const unsafeActPercent = totalAccidents > 0 ? Math.round((unsafeActCount / totalAccidents) * 100) : 0;

  // Dados diários do gráfico
  const dailyChartData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayAccs = monthAccidents.filter(a => {
        const dObj = a.date instanceof Date ? a.date : new Date(a.date);
        return dObj.getDate() === d;
      });
      const count = dayAccs.length;
      const lost = dayAccs.reduce((sum, a) => sum + (Number(a.lostDays) || 0), 0);
      data.push({
        day: String(d).padStart(2, '0'),
        dayNum: d,
        count,
        lostDays: lost,
        value: metric === 'accidents' ? count : lost,
        hasMultiple: count > 1,
        accidents: dayAccs
      });
    }
    return data;
  }, [monthAccidents, year, month, metric]);

  // Dia de pico
  const peakDay = useMemo(() => {
    if (dailyChartData.length === 0) return null;
    return [...dailyChartData].sort((a, b) => b.value - a.value)[0];
  }, [dailyChartData]);

  const filterSubtitle = useMemo(() => {
    const parts = [];
    if (filterDivision !== 'ALL') parts.push(`Divisão: ${filterDivision}`);
    if (filterManager !== 'ALL') parts.push(`Gestor: ${filterManager}`);
    if (activeAreas.length > 0) parts.push(`Área: ${activeAreas.join(', ')}`);
    return parts.length > 0 ? parts.join(' • ') : 'Todas as Unidades e Divisões';
  }, [filterDivision, filterManager, activeAreas]);

  return (
    <div className="print-landscape-container" style={{ padding: '4.5rem 1.2rem 1.2rem', background: '#F1F5F9', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* Barra superior de controle (oculta na impressão) */}
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
          <button 
            onClick={onBack} 
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.8rem', 
              fontWeight: 700 
            }}
          >
            <ArrowLeft size={16} /> Voltar ao Painel
          </button>
          <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0' }}>
            Quadro de Gestão à Vista — Detalhamento Mensal ({MONTH_NAMES[month - 1]} de {year})
          </div>
        </div>
        <button 
          onClick={() => window.print()} 
          className="btn-pdf" 
          style={{ 
            padding: '0.5rem 1.8rem', 
            background: '#10B981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' 
          }}
        >
          <Printer size={18} />
          <span>Confirmar e Imprimir</span>
        </button>
      </div>

      {/* FOLHA ÚNICA: A4 Paisagem */}
      <div className="a4-landscape" style={{ height: '200mm', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        
        {/* Cabeçalho Oficial Açotubo */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #B91C1C', paddingBottom: '0.35rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ background: '#B91C1C', padding: '0.4rem', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 style={{ color: '#0F172A', fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                Quadro de Gestão à Vista — {MONTH_NAMES[month - 1]} de {year}
              </h1>
              <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>
                {filterSubtitle} • Métrica ativa: {metric === 'accidents' ? 'Volume de Ocorrências' : 'Dias de Afastamento'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={LOGO_BASE64} alt="Açotubo" style={{ height: '22px' }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', color: '#475569' }}>
              FOLHA ÚNICA / QUADRO MENSAL
            </span>
          </div>
        </header>

        {/* Conteúdo da Folha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, minHeight: 0, marginTop: '0.45rem' }}>
          
          {/* 1. KPIs Consolidados do Mês */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', flexShrink: 0 }}>
            {/* Card 1: Total de Acidentes */}
            <div className="panel-premium" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #B91C1C' }}>
              <div>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>TOTAL ACIDENTES</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#B91C1C', lineHeight: 1, marginTop: '2px' }}>
                  {totalAccidents}
                </div>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748B', background: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                {catPercent}% com CAT
              </span>
            </div>

            {/* Card 2: Dias de Afastamento */}
            <div className="panel-premium" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #0284C7' }}>
              <div>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>DIAS PERDIDOS</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284C7', lineHeight: 1, marginTop: '2px' }}>
                  {totalLostDays}
                </div>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748B', background: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                Média {totalAccidents > 0 ? (totalLostDays / totalAccidents).toFixed(1) : 0}d/acd
              </span>
            </div>

            {/* Card 3: Pico do Mês */}
            <div className="panel-premium" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #F59E0B' }}>
              <div>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>MAIOR OCORRÊNCIA</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#D97706', lineHeight: 1.1, marginTop: '2px' }}>
                  {peakDay && peakDay.value > 0 ? `Dia ${peakDay.day}` : '—'}
                </div>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748B', background: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                {peakDay && peakDay.value > 0 ? `${peakDay.value} ${metric === 'accidents' ? 'acd' : 'dias'}` : 'Sem picos'}
              </span>
            </div>

            {/* Card 4: Fator Causal */}
            <div className="panel-premium" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #10B981' }}>
              <div>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>CAUSA PREDOMINANTE</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>
                  {totalAccidents > 0 
                    ? (unsafeActPercent >= 50 ? `${unsafeActPercent}% Ato Inseguro` : `${100 - unsafeActPercent}% Condição`)
                    : 'Sem ocorrências'}
                </div>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                {totalAccidents > 0 ? `${monthAccidents.filter(a => a.usedEPI).length} c/ EPI` : '100% Seguro'}
              </span>
            </div>
          </div>

          {/* 2. Gráfico Diário do Mês */}
          <div className="panel-premium monthly-evolution-panel" style={{ padding: '0.45rem 0.75rem', display: 'flex', flexDirection: 'column', flex: '0 0 170px', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="var(--primary)" />
                Distribuição Cronológica Dia a Dia ({MONTH_NAMES[month - 1]} de {year})
              </span>
              <span style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 700 }}>
                {metric === 'accidents' ? 'Volume de acidentes registrados por dia' : 'Dias de afastamento acumulados por dia'}
              </span>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 12, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 7.5, fontWeight: 700, fill: '#64748B' }} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 7.5, fill: '#64748B' }} allowDecimals={false} />
                  <Bar 
                    dataKey="value" 
                    fill={metric === 'accidents' ? '#B91C1C' : '#0284C7'} 
                    radius={[3, 3, 0, 0]}
                    label={{ 
                      position: 'top', 
                      fill: '#0F172A', 
                      fontSize: 8, 
                      fontWeight: 900,
                      formatter: (val: any) => Number(val) > 0 ? val : ''
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Colaboradores Acidentados no Mês (Lista Achatada e Completa) */}
          <div className="panel-premium" style={{ padding: '0.45rem 0.75rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="var(--primary)" />
                Relação de Ocorrências e Detalhamento dos Colaboradores ({totalAccidents})
              </span>
              <span style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 700 }}>
                {totalAccidents > 0 ? 'Exibição completa das ocorrências do período' : 'Quadro zerado'}
              </span>
            </div>

            {totalAccidents === 0 ? (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: '#F0FDF4', 
                border: '1px solid #BBF7D0', 
                borderRadius: '8px', 
                color: '#15803D',
                padding: '0.75rem'
              }}>
                <CheckCircle2 size={24} color="#16A34A" />
                <div style={{ fontWeight: 900, fontSize: '0.82rem', marginTop: '4px' }}>
                  Nenhum acidente registrado em {MONTH_NAMES[month - 1]} de {year}!
                </div>
                <div style={{ fontSize: '0.62rem', color: '#166534', marginTop: '2px' }}>
                  Meta Zero Acidentes cumprida no período para os filtros selecionados.
                </div>
              </div>
            ) : (
              <div style={{ 
                flex: 1, 
                minHeight: 0, 
                display: 'grid', 
                gridTemplateColumns: totalAccidents <= 3 ? '1fr' : totalAccidents <= 6 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
                gap: '0.35rem', 
                overflow: 'hidden' 
              }}>
                {monthAccidents.slice(0, 9).map((acc, idx) => {
                  const empName = acc.employee && acc.employee.trim() && acc.employee !== 'N/A' && acc.employee !== 'Não informado'
                    ? acc.employee
                    : (acc.re ? `Colaborador (RE: ${acc.re})` : `Ocorrência #${idx + 1}`);

                  const dateStr = (() => {
                    const d = acc.date instanceof Date ? acc.date : new Date(acc.date);
                    return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : `${String(month).padStart(2, '0')}/${year}`;
                  })();

                  return (
                    <div
                      key={acc.id || idx}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '0.35rem 0.55rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2.5px',
                        borderLeft: `3.5px solid ${acc.lostDays > 0 ? '#B91C1C' : '#10B981'}`,
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Linha 1: Nome, RE e Data */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                          <span style={{ fontWeight: 900, fontSize: '0.72rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {empName}
                          </span>
                          {acc.re && acc.re !== 'N/A' && (
                            <span style={{ fontSize: '0.58rem', color: '#64748B', fontWeight: 700, background: '#F1F5F9', padding: '1px 4px', borderRadius: '3px', flexShrink: 0 }}>
                              RE {acc.re}
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: 800, 
                          background: '#F8FAFC', 
                          border: '1px solid #E2E8F0',
                          padding: '1px 4px', 
                          borderRadius: '3px', 
                          color: '#334155',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          📅 {dateStr}
                        </span>
                      </div>

                      {/* Linha 2: Cargo, Área e Gestor */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.role && acc.role !== 'N/A' && <strong style={{ color: '#1E293B' }}>{acc.role} • </strong>}
                        <span>{acc.area || 'Operacional'} ({acc.division || 'Geral'})</span>
                        {acc.manager && acc.manager !== 'N/A' && acc.manager !== 'Não informado' && (
                          <span style={{ color: '#64748B' }}> • Gestor: {acc.manager}</span>
                        )}
                      </div>

                      {/* Linha 3: Tipo e Parte Afetada */}
                      {(acc.type || acc.partAffected) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.type && <span>Tipo: <strong style={{ color: '#334155' }}>{acc.type}</strong></span>}
                          {acc.type && acc.partAffected && <span>•</span>}
                          {acc.partAffected && <span>Parte: <strong style={{ color: '#334155' }}>{acc.partAffected}</strong></span>}
                        </div>
                      )}

                      {/* Linha 4: Badges e Afastamento */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px', borderTop: '1px dashed #F1F5F9', paddingTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            padding: '0.5px 4px',
                            borderRadius: '3px',
                            background: acc.hasCat ? '#DCFCE7' : '#F1F5F9',
                            color: acc.hasCat ? '#15803D' : '#64748B',
                            border: acc.hasCat ? '1px solid #BBF7D0' : '1px solid #E2E8F0'
                          }}>
                            {acc.hasCat ? 'CAT' : 'Sem CAT'}
                          </span>
                          <span style={{
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            padding: '0.5px 4px',
                            borderRadius: '3px',
                            background: acc.unsafeAct ? '#FEF2F2' : '#F0FDF4',
                            color: acc.unsafeAct ? '#991B1B' : '#166534',
                            border: acc.unsafeAct ? '1px solid #FECACA' : '1px solid #DCFCE7'
                          }}>
                            {acc.unsafeAct ? 'Ato Inseguro' : 'Condição'}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.64rem',
                          fontWeight: 900,
                          color: acc.lostDays > 0 ? '#B91C1C' : '#10B981',
                          background: acc.lostDays > 0 ? '#FEF2F2' : '#F0FDF4',
                          padding: '0.5px 5px',
                          borderRadius: '3px',
                          border: acc.lostDays > 0 ? '1px solid #FECACA' : '1px solid #BBF7D0'
                        }}>
                          {acc.lostDays > 0 ? `${acc.lostDays} dias afast.` : 'Sem afast.'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Quadro */}
        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #CBD5E1', paddingTop: '0.25rem', marginTop: '0.25rem', flexShrink: 0 }}>
          <div style={{ fontSize: '0.55rem', color: '#64748B', fontWeight: 600 }}>
            Grupo Açotubo • Sistema Integrado SESMT • Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: '0.55rem', color: '#B91C1C', fontWeight: 800 }}>
            Segurança do Trabalho é Compromisso de Todos
          </div>
        </footer>

      </div>
    </div>
  );
};
