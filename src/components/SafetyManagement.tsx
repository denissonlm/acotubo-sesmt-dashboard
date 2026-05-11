import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine
} from 'recharts';
import { Trophy, Calendar, Target, AlertTriangle } from 'lucide-react';
import type { Accident } from '../types';
import { calculateSafetyRecords } from '../utils/dataLoader';
import { motion } from 'framer-motion';

interface SafetyManagementProps {
  accidents: Accident[];
}

export const SafetyManagement: React.FC<SafetyManagementProps> = ({ accidents }) => {
  const records = useMemo(() => calculateSafetyRecords(accidents), [accidents]);

  const chartData = useMemo(() => {
    return records.intervals.map(item => ({
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        
        {/* Current Streak */}
        <div className="panel-premium" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px', color: '#10B981' }}>
              <Target size={24} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', opacity: 0.8 }}>Status Atual</span>
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>{records.currentStreak}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem', color: '#10B981' }}>Dias sem Acidentes</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '1.5rem' }}>
            Última ocorrência: {records.lastAccidentDate ? records.lastAccidentDate.toLocaleDateString('pt-BR') : 'Nenhuma'}
          </div>
        </div>

        {/* Historical Record */}
        <div className="panel-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#FEE2E2', padding: '0.5rem', borderRadius: '8px', color: '#B91C1C' }}>
              <Trophy size={24} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#64748B' }}>Recorde Histórico</span>
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: '#0F172A' }}>{records.historicalRecord}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem', color: '#64748B' }}>Melhor Marca Alcançada</div>
          <div style={{ marginTop: '1.5rem', height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${(records.currentStreak / records.historicalRecord) * 100}%`, height: '100%', background: '#B91C1C' }}></div>
          </div>
        </div>

        {/* Next Goal / Indicator */}
        <div className="panel-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#DBEAFE', padding: '0.5rem', borderRadius: '8px', color: '#3B82F6' }}>
              <Calendar size={24} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#64748B' }}>Próxima Meta</span>
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: '#0F172A' }}>
            {records.currentStreak >= records.historicalRecord ? records.currentStreak + 30 : records.historicalRecord}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem', color: '#64748B' }}>
            {records.currentStreak >= records.historicalRecord ? 'Novo Objetivo (+30 dias)' : 'Meta para Superação'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 800 }}>
             <AlertTriangle size={14} />
             <span>Meta de Zero Acidentes</span>
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
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
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
