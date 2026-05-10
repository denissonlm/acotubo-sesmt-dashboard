import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, AlertCircle, ShieldCheck, HardHat, 
  GraduationCap, ExternalLink, Activity, Clock
} from 'lucide-react';
import type { Accident } from '../types';

interface BreakdownProps {
  accidents: Accident[];
}

export const Breakdown: React.FC<BreakdownProps> = ({ accidents }) => {
  
  const stats = useMemo(() => {
    if (accidents.length === 0) return null;
    
    const count = accidents.length;
    return {
      unsafeAct: (accidents.filter(a => a.unsafeAct).length / count) * 100,
      machineDeficiency: (accidents.filter(a => a.machineDeficiency).length / count) * 100,
      functionDeviation: (accidents.filter(a => a.functionDeviation).length / count) * 100,
      hadTraining: (accidents.filter(a => a.hadTraining).length / count) * 100,
      usedEPI: (accidents.filter(a => a.usedEPI).length / count) * 100,
    };
  }, [accidents]);

  const employeeRanking = useMemo(() => {
    const counts: Record<string, { count: number, division: string, re: string, link?: string }> = {};
    accidents.forEach(a => {
      if (!counts[a.employee]) {
        counts[a.employee] = { count: 0, division: a.division, re: a.re, link: a.investigationLink };
      }
      counts[a.employee].count++;
    });
    return Object.entries(counts)
      .filter(([, data]) => data.count > 1)
      .sort(([, a], [, b]) => b.count - a.count);
  }, [accidents]);

  const experienceRanking = useMemo(() => {
    const areas: Record<string, { totalExp: number, count: number }> = {};
    accidents.forEach(a => {
      const exp = a.experienceYears + (a.experienceMonths / 12);
      if (!areas[a.area]) areas[a.area] = { totalExp: 0, count: 0 };
      areas[a.area].totalExp += exp;
      areas[a.area].count++;
    });
    return Object.entries(areas)
      .map(([area, data]) => ({ area, avgExp: data.totalExp / data.count }))
      .sort((a, b) => b.avgExp - a.avgExp);
  }, [accidents]);

  const getLostDaysColor = (days: number) => {
    if (days === 0) return 'transparent';
    if (days <= 3) return '#F0FDF4'; 
    if (days <= 15) return '#FFF7ED'; 
    if (days <= 45) return '#FEF2F2'; 
    return '#7F1D1D'; 
  };

  const getLostDaysTextColor = (days: number) => {
    if (days > 45) return 'white';
    return 'inherit';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Causal Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Ato Inseguro', value: stats?.unsafeAct, icon: <AlertCircle size={18} />, color: '#EF4444' },
          { label: 'Defic. M/E', value: stats?.machineDeficiency, icon: <Activity size={18} />, color: '#F59E0B' },
          { label: 'Desvio Função', value: stats?.functionDeviation, icon: <ShieldCheck size={18} />, color: '#3B82F6' },
          { label: 'Com Treinamento', value: stats?.hadTraining, icon: <GraduationCap size={18} />, color: '#10B981' },
          { label: 'Utilizava EPI', value: stats?.usedEPI, icon: <HardHat size={18} />, color: '#8B5CF6' }
        ].map((item, idx) => (
          <div key={idx} className="panel-premium" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ color: item.color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>{item.value?.toFixed(0)}%</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginTop: '0.25rem' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        
        {/* Top Employees Ranking */}
        <div className="panel-premium" style={{ display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--primary)" /> Recorrência por Colaborador ({employeeRanking.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {employeeRanking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontWeight: 700 }}>Nenhum colaborador com mais de uma ocorrência.</div>
            ) : (
              employeeRanking.map(([name, data], idx) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '12px' }}>
                  <div style={{ width: '28px', height: '28px', background: idx === 0 ? 'var(--primary)' : '#E2E8F0', color: idx === 0 ? 'white' : '#64748B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{data.division} • RE: {data.re}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, color: 'var(--primary)' }}>{data.count} Acidentes</div>
                    {data.link && (
                      <a href={data.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.65rem', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                        Investigação <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Experience by Area */}
        <div className="panel-premium">
          <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--primary)" /> Média de Experiência por Área
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {experienceRanking.slice(0, 8).map(({ area, avgExp }) => (
              <div key={area} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>{area}</span>
                  <span style={{ color: avgExp < 1 ? '#EF4444' : '#64748B' }}>{avgExp.toFixed(1)} anos</span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (avgExp / 10) * 100)}%`, height: '100%', background: avgExp < 1 ? '#EF4444' : 'var(--primary)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Detailed Table */}
      <div className="panel-premium" style={{ overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.5rem' }}>Detalhamento Geral de Ocorrências</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #F1F5F9' }}>
              <th style={{ padding: '0.75rem' }}>DATA</th>
              <th style={{ padding: '0.75rem' }}>COLABORADOR</th>
              <th style={{ padding: '0.75rem' }}>DIVISÃO / ÁREA</th>
              <th style={{ padding: '0.75rem' }}>EXPERIÊNCIA</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>ATO INS.</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>EPI</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>AFAST.</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>LINK</th>
            </tr>
          </thead>
          <tbody>
            {accidents.slice().sort((a,b) => b.date.getTime() - a.date.getTime()).map((a, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontWeight: 700 }}>{a.date.toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 800 }}>{a.employee}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>RE: {a.re}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div>{a.division}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{a.area}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>{Math.floor(a.experienceYears)}a {Math.floor(a.experienceMonths)}m</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', background: a.unsafeAct ? '#FEE2E2' : '#F0FDF4', color: a.unsafeAct ? '#EF4444' : '#10B981', fontWeight: 900, fontSize: '0.6rem' }}>
                    {a.unsafeAct ? 'SIM' : 'NÃO'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                   <span style={{ color: a.usedEPI ? '#10B981' : '#EF4444' }}>{a.usedEPI ? 'SIM' : 'NÃO'}</span>
                </td>
                <td style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  background: getLostDaysColor(a.lostDays), 
                  color: getLostDaysTextColor(a.lostDays),
                  fontWeight: 900 
                }}>
                  {a.lostDays}d
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {a.investigationLink ? (
                    <a href={a.investigationLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      <ExternalLink size={14} />
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
