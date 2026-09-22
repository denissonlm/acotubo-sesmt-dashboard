import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine
} from 'recharts';
import { Trophy, Target, TrendingUp, ShieldCheck } from 'lucide-react';
import type { Accident } from '../types';
import { calculateSafetyRecords, calculateDaysWithoutAccidentsRanking } from '../utils/dataLoader';
import { motion } from 'framer-motion';

interface SafetyManagementProps {
  accidents: Accident[];
}

export const SafetyManagement: React.FC<SafetyManagementProps> = ({ accidents }) => {
  const [rankingType, setRankingType] = useState<'area' | 'division'>('area');
  const records = useMemo(() => calculateSafetyRecords(accidents), [accidents]);

  const areaRanking = useMemo(() => calculateDaysWithoutAccidentsRanking(accidents, 'area'), [accidents]);
  const divisionRanking = useMemo(() => calculateDaysWithoutAccidentsRanking(accidents, 'division'), [accidents]);
  const currentRanking = rankingType === 'area' ? areaRanking : divisionRanking;
  const maxDays = useMemo(() => {
    if (currentRanking.length === 0) return 1;
    return Math.max(...currentRanking.map(r => r.daysWithout), 1);
  }, [currentRanking]);

  const avgInterval = useMemo(() => {
    if (records.intervals.length === 0) return 0;
    return Math.round(records.intervals.reduce((sum, item) => sum + item.days, 0) / records.intervals.length);
  }, [records.intervals]);

  const lastCycleDays = useMemo(() => {
    if (records.intervals.length === 0) return null;
    return records.intervals[records.intervals.length - 1].days;
  }, [records.intervals]);

  const progressPercent = useMemo(() => {
    if (records.historicalRecord <= 0) return 0;
    return Math.min(100, Math.round((records.currentStreak / records.historicalRecord) * 100));
  }, [records.currentStreak, records.historicalRecord]);

  const isRecordBroken = records.currentStreak >= records.historicalRecord && records.historicalRecord > 0;

  const chartData = useMemo(() => {
    return records.intervals.map((item, index) => ({
      id: index,
      date: item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      days: item.days,
      employee: item.employee,
      role: item.role
    }));
  }, [records]);

  // Calculate dynamic width based on number of points to prevent squishing
  const chartWidth = Math.max(800, chartData.length * 50);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="safety-records"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Card 1: Status Atual */}
        <div 
          className="panel-premium" 
          style={{ 
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
            color: 'white', 
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.35rem 1.5rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px', color: '#10B981' }}>
                  <Target size={22} />
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF', display: 'block', lineHeight: 1.2 }}>
                    Status Atual
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                    Ciclo em andamento
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#10B981',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                Ativo
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '3.3rem', fontWeight: 900, lineHeight: 1 }}>{records.currentStreak}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981' }}>dias</span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '0.35rem', color: '#10B981' }}>
              Dias sem Acidentes
            </div>
          </div>

          <div style={{ 
            marginTop: '1.25rem', 
            paddingTop: '0.65rem', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            fontSize: '0.7rem', 
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Última ocorrência:</span>
            <strong style={{ color: '#F1F5F9' }}>
              {records.lastAccidentDate ? records.lastAccidentDate.toLocaleDateString('pt-BR') : 'Nenhuma'}
            </strong>
          </div>
        </div>

        {/* Card 2: Recorde Histórico & Meta de Superação (Unificado) */}
        <div 
          className="panel-premium" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            padding: '1.35rem 1.5rem',
            borderLeft: '4px solid #B91C1C'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: '#FEE2E2', padding: '0.5rem', borderRadius: '8px', color: '#B91C1C' }}>
                  <Trophy size={22} />
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', display: 'block', lineHeight: 1.2 }}>
                    Recorde & Próxima Meta
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
                    Melhor marca e alvo
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#B91C1C',
                background: '#FEF2F2',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #FECACA'
              }}>
                Meta: {isRecordBroken ? `${records.currentStreak + 30}d` : `> ${records.historicalRecord}d`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '3.3rem', fontWeight: 900, lineHeight: 1, color: '#0F172A' }}>
                {records.historicalRecord}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#64748B' }}>dias</span>
            </div>

            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginTop: '0.35rem', color: isRecordBroken ? '#15803D' : '#64748B' }}>
              {isRecordBroken 
                ? '🎉 Recorde histórico superado na sequência atual!' 
                : `Faltam ${records.historicalRecord - records.currentStreak} dias para superar a melhor marca`}
            </div>
          </div>

          {/* Barra de Progresso Rumo ao Recorde */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', marginBottom: '5px' }}>
              <span>Progresso Atual: <strong>{records.currentStreak}d</strong></span>
              <span><strong>{progressPercent}%</strong> da Meta</span>
            </div>
            <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <div style={{ 
                width: `${progressPercent}%`, 
                height: '100%', 
                background: isRecordBroken ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #EF4444, #B91C1C)',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Espaçamento Médio (MTBC - Mean Time Between Incidents) */}
        <div 
          className="panel-premium" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            padding: '1.35rem 1.5rem',
            borderLeft: '4px solid #2563EB'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: '#EFF6FF', padding: '0.5rem', borderRadius: '8px', color: '#2563EB' }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', display: 'block', lineHeight: 1.2 }}>
                    Espaçamento Médio
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
                    Tempo médio entre eventos (MTBC)
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#1D4ED8',
                background: '#DBEAFE',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #BFDBFE'
              }}>
                {records.intervals.length} ciclos
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '3.3rem', fontWeight: 900, lineHeight: 1, color: '#0F172A' }}>
                {avgInterval}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#64748B' }}>dias / evento</span>
            </div>

            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginTop: '0.35rem', color: '#64748B' }}>
              {lastCycleDays !== null ? (
                <span>Ciclo anterior concluído em <strong>{lastCycleDays} dias</strong></span>
              ) : (
                <span>Média histórica entre ocorrências</span>
              )}
            </div>
          </div>

          <div style={{ 
            marginTop: '1.25rem', 
            padding: '0.45rem 0.65rem', 
            background: '#F8FAFC', 
            borderRadius: '6px', 
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.7rem'
          }}>
            <span style={{ color: '#64748B', fontWeight: 700 }}>Ritmo Atual vs Média:</span>
            <span style={{ 
              fontWeight: 900, 
              color: records.currentStreak >= avgInterval ? '#15803D' : '#D97706' 
            }}>
              {records.currentStreak >= avgInterval 
                ? `Acima da média (+${records.currentStreak - avgInterval}d)` 
                : `Abaixo da média (${records.currentStreak}/${avgInterval}d)`}
            </span>
          </div>
        </div>
      </div>

      {/* Spacing Chart */}
      <div className="panel-premium">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Espaçamento entre Ocorrências</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>Histórico de dias trabalhados com segurança entre cada acidente</p>
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }} className="custom-scrollbar">
          <div style={{ width: chartWidth, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="id" 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => chartData[val]?.date || ''}
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: 'white', padding: '10px 14px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}>
                        <p style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px', margin: 0 }}>{data.date}</p>
                        <p style={{ margin: '0 0 4px 0', color: '#64748B' }}><span style={{ fontWeight: 700, color: '#0F172A' }}>Espaçamento:</span> {data.days} dias</p>
                        {data.employee && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                            <p style={{ margin: '0 0 2px 0', fontWeight: 800, color: '#1E293B' }}>{data.employee}</p>
                            <p style={{ margin: 0, color: '#64748B', fontSize: '0.7rem' }}>{data.role}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }} />
                <ReferenceLine y={records.historicalRecord} stroke="#B91C1C" strokeDasharray="5 5" label={{ position: 'right', value: 'Recorde', fill: '#B91C1C', fontSize: 10, fontWeight: 900 }} />
                <Line 
                  type="monotone" 
                  dataKey="days" 
                  stroke="#0F172A" 
                  strokeWidth={4} 
                  dot={{ fill: '#B91C1C', strokeWidth: 2, r: 4, stroke: '#FFF' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quadro Individual: Ranking de Dias Sem Acidentes */}
      <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
        {/* Header com Título, Regra de Cálculo e Toggle Switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#ECFDF5', padding: '0.55rem', borderRadius: '10px', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Ranking de Dias Sem Acidentes (DSA)
                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                  Ativo
                </span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Contagem ativa até hoje: <strong>Data de hoje - Data do último acidente - 1</strong>
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setRankingType('area')}
              style={{
                border: 'none',
                background: rankingType === 'area' ? '#FFFFFF' : 'transparent',
                color: rankingType === 'area' ? '#0F172A' : '#64748B',
                fontWeight: rankingType === 'area' ? 900 : 700,
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: '7px',
                cursor: 'pointer',
                boxShadow: rankingType === 'area' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Por Área</span>
              <span style={{
                fontSize: '0.68rem',
                background: rankingType === 'area' ? '#DCFCE7' : 'rgba(0,0,0,0.05)',
                color: rankingType === 'area' ? '#15803D' : '#64748B',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {areaRanking.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRankingType('division')}
              style={{
                border: 'none',
                background: rankingType === 'division' ? '#FFFFFF' : 'transparent',
                color: rankingType === 'division' ? '#0F172A' : '#64748B',
                fontWeight: rankingType === 'division' ? 900 : 700,
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: '7px',
                cursor: 'pointer',
                boxShadow: rankingType === 'division' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Por Unidade</span>
              <span style={{
                fontSize: '0.68rem',
                background: rankingType === 'division' ? '#DCFCE7' : 'rgba(0,0,0,0.05)',
                color: rankingType === 'division' ? '#15803D' : '#64748B',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {divisionRanking.length}
              </span>
            </button>
          </div>
        </div>

        {/* Pódio Top 3 (Líderes de Segurança) */}
        {currentRanking.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {currentRanking.slice(0, 3).map((item, idx) => {
              const medals = [
                { rank: '1º LUGAR', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', label: 'Líder Absoluto' },
                { rank: '2º LUGAR', color: '#475569', bg: '#F1F5F9', border: '#CBD5E1', label: 'Vice-Líder' },
                { rank: '3º LUGAR', color: '#C2410C', bg: '#FFEDD5', border: '#FDBA74', label: 'Bronze' }
              ];
              const m = medals[idx];
              return (
                <div 
                  key={item.name}
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${m.border}`,
                    borderRadius: '12px',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: m.color }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: m.color, background: m.bg, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                      {m.rank}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>
                      {item.totalAccidents} acidentes
                    </span>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0F172A', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.9rem', fontWeight: 950, lineHeight: 1, color: '#059669' }}>
                      {item.daysWithout}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>dias sem acidentes</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Última ocorrência:</span>
                    <strong style={{ color: '#334155' }}>{item.lastDate.toLocaleDateString('pt-BR')}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabela Completa do Ranking */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 14px', width: '50px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '10px 14px' }}>{rankingType === 'area' ? 'ÁREA / SETOR' : 'UNIDADE / DIVISÃO'}</th>
                <th style={{ padding: '10px 14px', width: '220px' }}>DIAS SEM ACIDENTES</th>
                <th style={{ padding: '10px 14px', width: '140px' }}>ÚLTIMO ACIDENTE</th>
                <th style={{ padding: '10px 14px', width: '130px', textAlign: 'center' }}>TOTAL NO PERÍODO</th>
                <th style={{ padding: '10px 14px', width: '130px', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {currentRanking.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Nenhum dado registrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                currentRanking.map((item, idx) => {
                  const pct = Math.min(100, Math.round((item.daysWithout / maxDays) * 100));
                  const isTop3 = idx < 3;
                  const rankBadgeBg = idx === 0 ? '#FEF3C7' : idx === 1 ? '#F1F5F9' : idx === 2 ? '#FFEDD5' : '#F8FAFC';
                  const rankBadgeColor = idx === 0 ? '#B45309' : idx === 1 ? '#475569' : idx === 2 ? '#C2410C' : '#64748B';

                  let statusBadge = { bg: '#DCFCE7', color: '#15803D', text: 'Excelente (>300d)' };
                  if (item.daysWithout < 30) {
                    statusBadge = { bg: '#FEE2E2', color: '#B91C1C', text: 'Alerta (<30d)' };
                  } else if (item.daysWithout < 100) {
                    statusBadge = { bg: '#FEF3C7', color: '#B45309', text: 'Atenção (<100d)' };
                  } else if (item.daysWithout < 300) {
                    statusBadge = { bg: '#E0F2FE', color: '#0369A1', text: 'Bom (>100d)' };
                  }

                  return (
                    <tr 
                      key={item.name} 
                      style={{ 
                        borderBottom: '1px solid #F1F5F9',
                        background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Posição */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: rankBadgeBg,
                          color: rankBadgeColor,
                          fontWeight: 950,
                          fontSize: '0.72rem',
                          border: isTop3 ? `1px solid ${rankBadgeColor}44` : '1px solid #E2E8F0'
                        }}>
                          {idx + 1}
                        </span>
                      </td>

                      {/* Nome */}
                      <td style={{ padding: '10px 14px', fontWeight: isTop3 ? 900 : 700, color: '#0F172A' }}>
                        {item.name}
                      </td>

                      {/* Dias Sem Acidentes + Barra Proporcional */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 950, fontSize: '0.95rem', color: '#059669' }}>
                            {item.daysWithout} <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>dias</span>
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: item.daysWithout >= 300 
                              ? 'linear-gradient(90deg, #10B981, #059669)' 
                              : item.daysWithout >= 60 
                                ? 'linear-gradient(90deg, #3B82F6, #2563EB)' 
                                : 'linear-gradient(90deg, #F59E0B, #EF4444)',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease'
                          }}></div>
                        </div>
                      </td>

                      {/* Último Acidente */}
                      <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          📅 {item.lastDate.toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      {/* Total no Período */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          background: '#F1F5F9',
                          color: '#334155',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {item.totalAccidents}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          {statusBadge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
