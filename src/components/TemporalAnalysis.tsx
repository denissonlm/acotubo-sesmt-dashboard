import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Clock, Calendar, Zap } from 'lucide-react';
import type { Accident } from '../types';
import { calculateTemporalStats } from '../utils/dataLoader';
import { motion } from 'framer-motion';

interface TemporalAnalysisProps {
  accidents: Accident[];
}

export const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({ accidents }) => {
  const stats = useMemo(() => calculateTemporalStats(accidents), [accidents]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div className="grid-temporal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Distribuição por Período */}
        <div className="panel-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
              <Clock size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Ocorrências por Período</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'center' }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.periodStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats.periodStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.periodStats.map((p) => (
                <div key={p.period} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: p.color }}></div>
                    <span style={{ fontWeight: 600 }}>{p.period}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribuição por Dia da Semana */}
        <div className="panel-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#3B82F6', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
              <Calendar size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Incidência por Dia da Semana</h3>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dayOfWeekStats} margin={{ top: 25, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                  label={{ position: 'top', fontSize: 10, fontWeight: 800 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Linha do Tempo por Hora */}
      <div className="panel-premium">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#10B981', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
            <Zap size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Detalhamento por Horário (24h)</h3>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.hourlyStats}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} />
              <YAxis axisLine={false} tickLine={false} hide />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </motion.div>
  );
};
