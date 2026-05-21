import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine, BarChart, Bar, Cell
} from 'recharts';
import { Medal, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Accident, GroupSafetyRecord } from '../types';
import { calculateSafetyRecords, calculateSafetyRanking } from '../utils/dataLoader';
import { motion } from 'framer-motion';

interface SafetyManagementProps {
  accidents: Accident[];
  groupBy: 'area' | 'division';
  onGroupByChange: (val: 'area' | 'division') => void;
}

export const SafetyManagement: React.FC<SafetyManagementProps> = ({ accidents, groupBy, onGroupByChange }) => {
  const [hoveredAccident, setHoveredAccident] = useState<{ accident: Accident, x: number, y: number } | null>(null);

  const records = useMemo(() => calculateSafetyRecords(accidents), [accidents]);
  const ranking = useMemo(() => calculateSafetyRanking(accidents, groupBy), [accidents, groupBy]);

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
  const lineChartWidth = Math.max(800, chartData.length * 50);

  const halfLength = Math.ceil(ranking.length / 2);
  const leftRanking = ranking.slice(0, halfLength);
  const rightRanking = ranking.slice(halfLength);

  const handleMouseEnter = (e: React.MouseEvent, accident?: Accident) => {
    if (accident) {
      setHoveredAccident({
        accident,
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredAccident) {
      setHoveredAccident(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredAccident(null);
  };

  const renderTable = (data: GroupSafetyRecord[], offset: number) => {
    return (
      <table className="ranking-table-premium" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center', padding: '6px 4px', fontSize: '0.75rem' }}>Pos</th>
            <th style={{ padding: '6px 4px', fontSize: '0.75rem' }}>{groupBy === 'area' ? 'Área' : 'Divisão'}</th>
            <th style={{ textAlign: 'center', padding: '6px 4px', fontSize: '0.75rem' }}>Dias</th>
            <th style={{ textAlign: 'center', width: '80px', padding: '6px 4px', fontSize: '0.75rem' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, localIdx) => {
            const idx = localIdx + offset;
            const isTop3 = idx < 3;
            let positionContent: React.ReactNode = <span>{idx + 1}º</span>;
            if (idx === 0) positionContent = <Medal color="#EAB308" size={16} />;
            if (idx === 1) positionContent = <Medal color="#94A3B8" size={16} />;
            if (idx === 2) positionContent = <Medal color="#B45309" size={16} />;

            let statusBadge = null;
            if (row.neverHad) {
              statusBadge = <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}><ShieldCheck size={12} /> Seguro</span>;
            } else if (row.days >= 180) {
              statusBadge = <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900 }}>Excelente</span>;
            } else if (row.days >= 90) {
              statusBadge = <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900 }}>Bom</span>;
            } else {
              statusBadge = <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}><ShieldAlert size={12} /> Atenção</span>;
            }

            const maxDays = Math.max(365, ranking[0]?.days || 365);
            const progressWidth = Math.min(100, Math.max(2, (row.days / maxDays) * 100));

            return (
              <tr 
                key={row.name}
                onMouseEnter={(e) => handleMouseEnter(e, row.lastAccident)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: row.lastAccident ? 'pointer' : 'default' }}
              >
                <td style={{ textAlign: 'center', fontWeight: 900, color: isTop3 ? '#0F172A' : '#64748B', padding: '6px 4px' }}>
                  {positionContent}
                </td>
                <td style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.75rem', padding: '6px 4px' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {row.name}
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: row.neverHad ? '#10B981' : '#0F172A' }}>
                      {row.neverHad ? `+${row.days}` : row.days}
                    </span>
                    <div style={{ width: '60px', height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressWidth}%`, height: '100%', background: row.neverHad ? '#10B981' : (row.days > 90 ? '#3B82F6' : '#EF4444'), borderRadius: '2px' }}></div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                  {statusBadge}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="safety-records"
    >
      {hoveredAccident && (
        <div 
          style={{
            position: 'fixed',
            left: hoveredAccident.x + 15,
            top: hoveredAccident.y + 15,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            pointerEvents: 'none',
            minWidth: '240px'
          }}
        >
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Ocorrência</div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', marginBottom: '8px' }}>{hoveredAccident.accident.employee}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '4px', fontSize: '0.75rem', color: '#475569' }}>
            <span style={{ fontWeight: 700 }}>RE:</span> <span>{hoveredAccident.accident.re}</span>
            <span style={{ fontWeight: 700 }}>Cargo:</span> <span>{hoveredAccident.accident.role}</span>
            <span style={{ fontWeight: 700 }}>Área:</span> <span>{hoveredAccident.accident.area}</span>
          </div>
        </div>
      )}

      {/* Ranking and Toggle */}
      <div className="panel-premium" style={{ marginBottom: '1.5rem', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Ranking de Segurança
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
              Classificação abrangente por dias sem acidentes
            </p>
          </div>
          <div className="toggle-switch-container">
            <button 
              className={`toggle-btn ${groupBy === 'area' ? 'active' : ''}`}
              onClick={() => onGroupByChange('area')}
            >
              Por Área
            </button>
            <button 
              className={`toggle-btn ${groupBy === 'division' ? 'active' : ''}`}
              onClick={() => onGroupByChange('division')}
            >
              Por Divisão
            </button>
          </div>
        </div>

        {/* 3-Column Parallel Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Table */}
          <div style={{ overflowX: 'auto', background: '#F8FAFC', borderRadius: '12px', padding: '0.5rem', border: '1px solid #E2E8F0' }} className="custom-scrollbar">
            {renderTable(leftRanking, 0)}
          </div>
          
          {/* Right Table */}
          <div style={{ overflowX: 'auto', background: '#F8FAFC', borderRadius: '12px', padding: '0.5rem', border: '1px solid #E2E8F0' }} className="custom-scrollbar">
            {renderTable(rightRanking, halfLength)}
          </div>

          {/* Bar Chart */}
          <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.5rem 1rem 1rem 0', border: '1px solid #E2E8F0', height: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', marginBottom: '1rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desempenho Geral</h3>
            <div style={{ flex: 1, minHeight: Math.max(300, ranking.length * 35) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#F1F5F9' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '0.8rem', fontWeight: 700 }}
                    formatter={(value: any) => [`${value} dias`, 'Dias sem acidentes']}
                  />
                  <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={20}>
                    {ranking.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.neverHad ? '#10B981' : (entry.days > 90 ? '#3B82F6' : '#EF4444')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
          <div style={{ width: lineChartWidth, height: 300 }}>
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
                <RechartsTooltip content={({ active, payload }) => {
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
