import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine
} from 'recharts';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import type { Accident } from '../types';
import { calculateSafetyRecords } from '../utils/dataLoader';
import { motion } from 'framer-motion';

interface SafetyManagementProps {
  accidents: Accident[];
}

export const SafetyManagement: React.FC<SafetyManagementProps> = ({ accidents }) => {
  const records = useMemo(() => calculateSafetyRecords(accidents), [accidents]);

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
    </motion.div>
  );
};
