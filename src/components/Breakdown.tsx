import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { 
  Users, AlertCircle, ShieldCheck, HardHat, 
  GraduationCap, ExternalLink, Activity, Clock, Settings, X, Search,
  GripVertical, Layers, FileSpreadsheet,
  ArrowUpDown, ArrowUp, ArrowDown, RotateCcw
} from 'lucide-react';
import type { Accident } from '../types';

interface BreakdownProps {
  accidents: Accident[];
  isOpen?: boolean;
  onClose?: () => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ALL_COLUMNS = [
  { id: 'id', label: 'ID' },
  { id: 'date', label: 'DATA' },
  { id: 'time', label: 'HORA' },
  { id: 'period', label: 'PERÍODO' },
  { id: 'dayOfWeek', label: 'DIA DA SEMANA' },
  { id: 're', label: 'RE' },
  { id: 'employee', label: 'COLABORADOR' },
  { id: 'role', label: 'CARGO' },
  { id: 'division', label: 'DIVISÃO' },
  { id: 'area', label: 'ÁREA' },
  { id: 'manager', label: 'SUPERIOR' },
  { id: 'type', label: 'TIPO' },
  { id: 'partAffected', label: 'PARTE ATINGIDA' },
  { id: 'experience', label: 'EXPERIÊNCIA' },
  { id: 'lostDays', label: 'AFASTAMENTO' },
  { id: 'unsafeAct', label: 'ATO INSEGURO' },
  { id: 'machineDeficiency', label: 'DEFIC. M/E' },
  { id: 'functionDeviation', label: 'DESVIO FUNÇÃO' },
  { id: 'hadTraining', label: 'CAPACITAÇÃO' },
  { id: 'usedEPI', label: 'EPI' },
  { id: 'link', label: 'LINK' }
];

export const Breakdown: React.FC<BreakdownProps> = ({ accidents, isOpen, onClose }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMaximized = isOpen !== undefined ? isOpen : internalOpen;
  const setIsMaximized = (val: boolean) => {
    if (onClose && !val) onClose();
    setInternalOpen(val);
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('breakdown_visible_columns');
    return saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.id);
  });
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('breakdown_column_order');
    return saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.id);
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tableWidth, setTableWidth] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'month_year' | 'year' | 'division' | 'area' | 'role' | 'type' | 'unsafeAct'>(() => {
    return (localStorage.getItem('breakdown_group_by') as any) || 'none';
  });
  const [sortCol, setSortCol] = useState<string>(() => {
    return localStorage.getItem('breakdown_sort_col') || 'date';
  });
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => {
    return (localStorage.getItem('breakdown_sort_dir') as 'asc' | 'desc') || 'desc';
  });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('breakdown_column_filters');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('breakdown_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem('breakdown_column_order', JSON.stringify(columnOrder));
  }, [columnOrder]);

  useEffect(() => {
    localStorage.setItem('breakdown_group_by', groupBy);
  }, [groupBy]);

  useEffect(() => {
    localStorage.setItem('breakdown_sort_col', sortCol);
    localStorage.setItem('breakdown_sort_dir', sortDir);
  }, [sortCol, sortDir]);

  useEffect(() => {
    localStorage.setItem('breakdown_column_filters', JSON.stringify(columnFilters));
  }, [columnFilters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMaximized(false);
        setIsConfigOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSort = (colId: string) => {
    if (sortCol === colId) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colId);
      setSortDir('asc');
    }
  };

  const handleColumnFilterChange = (colId: string, value: string) => {
    setColumnFilters(prev => {
      const updated = { ...prev };
      if (!value) {
        delete updated[colId];
      } else {
        updated[colId] = value;
      }
      return updated;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
  };

  const hasActiveFilters = searchQuery.trim() !== '' || Object.keys(columnFilters).length > 0;

  const filteredTableData = useMemo(() => {
    let list = [...accidents];

    // Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => 
        (a.employee && a.employee.toLowerCase().includes(q)) ||
        (a.re && a.re.toLowerCase().includes(q)) ||
        (a.division && a.division.toLowerCase().includes(q)) ||
        (a.area && a.area.toLowerCase().includes(q)) ||
        (a.type && a.type.toLowerCase().includes(q)) ||
        (a.role && a.role.toLowerCase().includes(q)) ||
        (a.manager && a.manager.toLowerCase().includes(q)) ||
        (a.partAffected && a.partAffected.toLowerCase().includes(q))
      );
    }

    // Column-specific Filters
    Object.entries(columnFilters).forEach(([colId, filterVal]) => {
      if (!filterVal) return;
      const fVal = filterVal.toLowerCase().trim();
      list = list.filter(a => {
        switch (colId) {
          case 'id': return String(a.id).toLowerCase().includes(fVal);
          case 'date': return a.date ? a.date.toLocaleDateString('pt-BR').includes(fVal) : false;
          case 'time': return a.time ? a.time.toLowerCase().includes(fVal) : false;
          case 'period': return a.period ? a.period.toLowerCase().includes(fVal) : false;
          case 'dayOfWeek': return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][a.dayOfWeek]?.includes(fVal);
          case 're': return a.re ? a.re.toLowerCase().includes(fVal) : false;
          case 'employee': return a.employee ? a.employee.toLowerCase().includes(fVal) : false;
          case 'role': return a.role ? a.role.toLowerCase().includes(fVal) : false;
          case 'division': return a.division ? a.division.toLowerCase().includes(fVal) : false;
          case 'area': return a.area ? a.area.toLowerCase().includes(fVal) : false;
          case 'manager': return a.manager ? a.manager.toLowerCase().includes(fVal) : false;
          case 'type': return a.type ? a.type.toLowerCase().includes(fVal) : false;
          case 'partAffected': return a.partAffected ? a.partAffected.toLowerCase().includes(fVal) : false;
          case 'experience': return `${Math.floor(a.experienceYears)}a ${Math.floor(a.experienceMonths)}m`.toLowerCase().includes(fVal);
          case 'lostDays': return String(a.lostDays).includes(fVal);
          case 'unsafeAct': return (a.unsafeAct ? 'sim' : 'não').includes(fVal);
          case 'machineDeficiency': return (a.machineDeficiency ? 'sim' : 'não').includes(fVal);
          case 'functionDeviation': return (a.functionDeviation ? 'sim' : 'não').includes(fVal);
          case 'hadTraining': return (a.hadTraining ? 'sim' : 'não').includes(fVal);
          case 'usedEPI': return (a.usedEPI ? 'sim' : 'não').includes(fVal);
          default: return true;
        }
      });
    });

    // Sorting
    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortCol) {
        case 'id': valA = a.id; valB = b.id; break;
        case 'date': valA = a.date ? a.date.getTime() : 0; valB = b.date ? b.date.getTime() : 0; break;
        case 'time': valA = a.time || ''; valB = b.time || ''; break;
        case 'period': valA = a.period || ''; valB = b.period || ''; break;
        case 'dayOfWeek': valA = a.dayOfWeek; valB = b.dayOfWeek; break;
        case 're': valA = a.re || ''; valB = b.re || ''; break;
        case 'employee': valA = a.employee || ''; valB = b.employee || ''; break;
        case 'role': valA = a.role || ''; valB = b.role || ''; break;
        case 'division': valA = a.division || ''; valB = b.division || ''; break;
        case 'area': valA = a.area || ''; valB = b.area || ''; break;
        case 'manager': valA = a.manager || ''; valB = b.manager || ''; break;
        case 'type': valA = a.type || ''; valB = b.type || ''; break;
        case 'partAffected': valA = a.partAffected || ''; valB = b.partAffected || ''; break;
        case 'experience': valA = a.experienceYears * 12 + a.experienceMonths; valB = b.experienceYears * 12 + b.experienceMonths; break;
        case 'lostDays': valA = a.lostDays; valB = b.lostDays; break;
        case 'unsafeAct': valA = a.unsafeAct ? 1 : 0; valB = b.unsafeAct ? 1 : 0; break;
        case 'machineDeficiency': valA = a.machineDeficiency ? 1 : 0; valB = b.machineDeficiency ? 1 : 0; break;
        case 'functionDeviation': valA = a.functionDeviation ? 1 : 0; valB = b.functionDeviation ? 1 : 0; break;
        case 'hadTraining': valA = a.hadTraining ? 1 : 0; valB = b.hadTraining ? 1 : 0; break;
        case 'usedEPI': valA = a.usedEPI ? 1 : 0; valB = b.usedEPI ? 1 : 0; break;
        default: valA = a.date ? a.date.getTime() : 0; valB = b.date ? b.date.getTime() : 0; break;
      }

      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [accidents, searchQuery, columnFilters, sortCol, sortDir]);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (tableRef.current) {
      setTimeout(() => {
        if (tableRef.current) setTableWidth(tableRef.current.scrollWidth);
      }, 50);
    }
  }, [visibleColumns, accidents, isMaximized]);

  const handleTopScroll = () => {
    if (bottomScrollRef.current && topScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (bottomScrollRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const renderCell = (colId: string, a: Accident) => {
    switch (colId) {
      case 'id': return a.id;
      case 'date': return <span style={{ fontWeight: 700 }}>{a.date ? a.date.toLocaleDateString('pt-BR') : '-'}</span>;
      case 'time': return a.time;
      case 'period': return a.period;
      case 'dayOfWeek': return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][a.dayOfWeek];
      case 're': return a.re;
      case 'employee': return <span style={{ fontWeight: 800 }}>{a.employee}</span>;
      case 'role': return a.role;
      case 'division': return a.division;
      case 'area': return a.area;
      case 'manager': return a.manager;
      case 'type': return a.type;
      case 'partAffected': return a.partAffected;
      case 'experience': return `${Math.floor(a.experienceYears)}a ${Math.floor(a.experienceMonths)}m`;
      case 'lostDays': return (
        <div style={{ 
          padding: '0.25rem', textAlign: 'center', borderRadius: '4px',
          background: getLostDaysColor(a.lostDays), color: getLostDaysTextColor(a.lostDays), fontWeight: 900 
        }}>{a.lostDays}d</div>
      );
      case 'unsafeAct': return (
        <span style={{ padding: '2px 8px', borderRadius: '10px', background: a.unsafeAct ? '#FEE2E2' : '#F0FDF4', color: a.unsafeAct ? '#EF4444' : '#10B981', fontWeight: 900, fontSize: '0.6rem' }}>
          {a.unsafeAct ? 'SIM' : 'NÃO'}
        </span>
      );
      case 'machineDeficiency': return <span style={{ color: a.machineDeficiency ? '#EF4444' : '#64748B' }}>{a.machineDeficiency ? 'SIM' : 'NÃO'}</span>;
      case 'functionDeviation': return <span style={{ color: a.functionDeviation ? '#EF4444' : '#64748B' }}>{a.functionDeviation ? 'SIM' : 'NÃO'}</span>;
      case 'hadTraining': return <span style={{ color: a.hadTraining ? '#10B981' : '#EF4444' }}>{a.hadTraining ? 'SIM' : 'NÃO'}</span>;
      case 'usedEPI': return <span style={{ color: a.usedEPI ? '#10B981' : '#EF4444' }}>{a.usedEPI ? 'SIM' : 'NÃO'}</span>;
      case 'link': return a.investigationLink ? (
        <a href={a.investigationLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
          <ExternalLink size={14} />
        </a>
      ) : '-';
      default: return null;
    }
  };
  
  const groupedData = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups: Record<string, { label: string, sortKey: number | string, items: Accident[] }> = {};
    
    filteredTableData.forEach(acc => {
      let key = '';
      let label = '';
      let sortKey: number | string = '';

      if (groupBy === 'month_year') {
        const y = acc.year;
        const m = acc.month; // 1 to 12
        key = `${y}-${String(m).padStart(2, '0')}`;
        label = `${MONTH_NAMES[m - 1] || 'Mês ' + m} de ${y}`;
        sortKey = y * 100 + m; // Chronological key e.g. 202602 > 202601 > 202512
      } else if (groupBy === 'year') {
        key = String(acc.year);
        label = `Ano ${acc.year}`;
        sortKey = acc.year;
      } else if (groupBy === 'division') {
        key = acc.division;
        label = `Unidade: ${acc.division}`;
        sortKey = acc.division;
      } else if (groupBy === 'area') {
        key = acc.area;
        label = `Área: ${acc.area}`;
        sortKey = acc.area;
      } else if (groupBy === 'role') {
        key = acc.role;
        label = `Cargo: ${acc.role}`;
        sortKey = acc.role;
      } else if (groupBy === 'type') {
        key = acc.type;
        label = `Tipo: ${acc.type}`;
        sortKey = acc.type;
      } else if (groupBy === 'unsafeAct') {
        key = acc.unsafeAct ? 'ATO_INSEGURO' : 'CONDICAO_INSEGURA';
        label = acc.unsafeAct ? 'Causa: Ato Inseguro' : 'Causa: Condição Insegura';
        sortKey = acc.unsafeAct ? 1 : 0;
      }

      if (!groups[key]) {
        groups[key] = { label, sortKey, items: [] };
      }
      groups[key].items.push(acc);
    });

    // Sort groups
    const sortedEntries = Object.entries(groups).sort(([, a], [, b]) => {
      if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
        return b.sortKey - a.sortKey; // Chronological descending (newest first)
      }
      return String(a.label).localeCompare(String(b.label));
    });

    const result: Record<string, Accident[]> = {};
    sortedEntries.forEach(([, grp]) => {
      result[grp.label] = grp.items;
    });

    return result;
  }, [filteredTableData, groupBy]);

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
    <div className="breakdown-container">
      
      {/* Causal Indicators */}
      <div className="causal-indicators-grid">
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

      <div className="breakdown-rankings-grid">
        
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

      {/* Floating Action Button - Modern round icon button with effects */}
      <button
        onClick={() => setIsMaximized(true)}
        className="no-print fab-detalhamento"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#60A5FA',
          border: '1.5px solid rgba(59, 130, 246, 0.45)',
          cursor: 'pointer',
          boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.5), 0 0 15px rgba(37, 99, 235, 0.3)',
          zIndex: 999,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.12) translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 15px 30px -4px rgba(37, 99, 235, 0.6), 0 0 25px rgba(37, 99, 235, 0.6)';
          e.currentTarget.style.color = '#FFFFFF';
          e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
          e.currentTarget.style.borderColor = '#93C5FD';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(15, 23, 42, 0.5), 0 0 15px rgba(37, 99, 235, 0.3)';
          e.currentTarget.style.color = '#60A5FA';
          e.currentTarget.style.background = 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)';
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.45)';
        }}
        title="Detalhamento Geral de Ocorrências (Base Completa)"
      >
        <FileSpreadsheet size={24} />
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: 'white',
          fontSize: '0.65rem',
          fontWeight: 900,
          padding: '2px 6px',
          borderRadius: '999px',
          border: '2px solid #0F172A',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        }}>
          {filteredTableData.length}
        </span>
      </button>

      {/* Maximized Fullscreen Modal */}
      {isMaximized && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMaximized(false);
          }}
        >
          <div 
            className="panel-premium custom-scrollbar" 
            style={{ 
              width: '100%',
              maxWidth: '1700px',
              height: '94vh',
              background: 'white',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Detalhamento Geral de Ocorrências
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                    Exibindo {filteredTableData.length} de {accidents.length} ocorrências {hasActiveFilters ? '(filtradas)' : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Global Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ 
                      padding: '0.45rem 0.75rem 0.45rem 2rem', 
                      border: '1px solid #CBD5E1', 
                      borderRadius: '8px', 
                      fontSize: '0.8rem',
                      outline: 'none',
                      width: '200px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      background: '#F8FAFC'
                    }} 
                  />
                </div>
                
                {/* Group By with Chronological Month/Year option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', padding: '2px 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <Layers size={14} color="#64748B" />
                  <select 
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '0.8rem', 
                      fontWeight: 700, 
                      color: '#334155', 
                      outline: 'none',
                      cursor: 'pointer',
                      padding: '0.4rem 0'
                    }}
                  >
                    <option value="none">Sem Agrupamento</option>
                    <option value="month_year">Agrupar por Mês/Ano (Cronológico)</option>
                    <option value="year">Agrupar por Ano</option>
                    <option value="division">Agrupar por Unidade</option>
                    <option value="area">Agrupar por Área</option>
                    <option value="role">Agrupar por Cargo</option>
                    <option value="type">Agrupar por Tipo</option>
                    <option value="unsafeAct">Agrupar por Causa Raiz</option>
                  </select>
                </div>

                {/* Reset Filters button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.45rem 0.75rem',
                      background: '#FEE2E2',
                      border: '1px solid #FECACA',
                      color: '#991B1B',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Limpar todos os filtros"
                  >
                    <RotateCcw size={12} /> Limpar Filtros
                  </button>
                )}

                {/* Configure Columns Button */}
                <button 
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem', background: isConfigOpen ? '#E2E8F0' : '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#334155', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  <Settings size={14} /> Colunas
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setIsMaximized(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#F1F5F9', border: 'none', borderRadius: '10px', color: '#64748B', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'}
                  onMouseOut={e => e.currentTarget.style.background = '#F1F5F9'}
                  title="Fechar (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Column Config Dropdown Popup */}
            {isConfigOpen && (
              <div style={{ 
                position: 'absolute', 
                top: '5.2rem', 
                right: '2rem', 
                background: 'white', 
                border: '1px solid #E2E8F0', 
                borderRadius: '16px', 
                padding: '1.25rem', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)', 
                zIndex: 1100, 
                width: '320px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Ordem e Visibilidade</h4>
                  <button onClick={() => setIsConfigOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={16} /></button>
                </div>
                <Reorder.Group 
                  axis="y" 
                  values={columnOrder} 
                  onReorder={setColumnOrder}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem', listStyle: 'none', padding: 0 }}
                >
                  {columnOrder.map((colId) => {
                    const col = ALL_COLUMNS.find(c => c.id === colId);
                    if (!col) return null;
                    return (
                      <Reorder.Item 
                        key={colId} 
                        value={colId}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          padding: '0.4rem 0.5rem',
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          border: '1px solid #F1F5F9',
                          cursor: 'grab'
                        }}
                        whileDrag={{ 
                          scale: 1.02, 
                          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                          zIndex: 1200,
                          cursor: 'grabbing'
                        }}
                      >
                        <div style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                          <GripVertical size={14} />
                        </div>
                        <input 
                          type="checkbox" 
                          checked={visibleColumns.includes(colId)} 
                          onChange={() => toggleColumn(colId)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 600, color: visibleColumns.includes(colId) ? '#0F172A' : '#94A3B8', userSelect: 'none' }}>
                          {col.label}
                        </span>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>
            )}

            {/* Top Scrollbar */}
            <div 
              ref={topScrollRef} 
              onScroll={handleTopScroll} 
              style={{ overflowX: 'auto', marginBottom: '0.25rem' }}
              className="custom-scrollbar"
            >
              <div style={{ width: tableWidth > 0 ? tableWidth : '100%', height: '1px' }}></div>
            </div>

            {/* Main Table Scroll Area */}
            <div 
              ref={bottomScrollRef} 
              onScroll={handleBottomScroll} 
              style={{ overflow: 'auto', flex: 1, paddingBottom: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px' }}
              className="custom-scrollbar"
            >
              <table ref={tableRef} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                <thead>
                  {/* Row 1: Header titles + Sort buttons */}
                  <tr style={{ textAlign: 'left' }}>
                    {columnOrder.map(colId => {
                      const col = ALL_COLUMNS.find(c => c.id === colId);
                      if (!col || !visibleColumns.includes(colId)) return null;
                      return (
                        <th 
                          key={colId} 
                          onClick={() => handleSort(colId)}
                          style={{ 
                            padding: '0.65rem 0.85rem', 
                            position: 'sticky', 
                            top: 0, 
                            background: '#F8FAFC', 
                            zIndex: 10, 
                            borderBottom: '1px solid #E2E8F0',
                            fontWeight: 800,
                            color: sortCol === colId ? 'var(--primary)' : '#475569',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          title={`Clique para ordenar por ${col.label}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span>{col.label}</span>
                            {sortCol === colId ? (
                              sortDir === 'asc' ? <ArrowUp size={13} color="var(--primary)" /> : <ArrowDown size={13} color="var(--primary)" />
                            ) : (
                              <ArrowUpDown size={11} color="#94A3B8" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>

                  {/* Row 2: Per-column Filter Input Row */}
                  <tr style={{ textAlign: 'left', background: '#F1F5F9' }}>
                    {columnOrder.map(colId => {
                      const col = ALL_COLUMNS.find(c => c.id === colId);
                      if (!col || !visibleColumns.includes(colId)) return null;
                      return (
                        <th 
                          key={`filter-${colId}`}
                          style={{ 
                            padding: '0.35rem 0.5rem', 
                            position: 'sticky', 
                            top: '36px', 
                            background: '#F1F5F9', 
                            zIndex: 10, 
                            borderBottom: '2px solid #CBD5E1'
                          }}
                        >
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="Filtrar..."
                              value={columnFilters[colId] || ''}
                              onChange={(e) => handleColumnFilterChange(colId, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                minWidth: '70px',
                                padding: '0.25rem 0.5rem',
                                paddingRight: columnFilters[colId] ? '18px' : '0.5rem',
                                border: columnFilters[colId] ? '1px solid var(--primary)' : '1px solid #CBD5E1',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                outline: 'none',
                                background: 'white',
                                color: '#1E293B',
                                fontWeight: 500
                              }}
                            />
                            {columnFilters[colId] && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleColumnFilterChange(colId, '');
                                }}
                                style={{
                                  position: 'absolute',
                                  right: '4px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#94A3B8'
                                }}
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredTableData.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                        <AlertCircle size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748B' }}>Nenhuma ocorrência encontrada</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Tente ajustar ou limpar os filtros aplicados nas colunas.</div>
                        <button
                          onClick={clearAllFilters}
                          style={{
                            marginTop: '1rem',
                            padding: '0.4rem 1rem',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                        >
                          Redefinir Filtros
                        </button>
                      </td>
                    </tr>
                  ) : groupedData ? (
                    Object.entries(groupedData).map(([groupName, items]) => (
                      <React.Fragment key={groupName}>
                        <tr style={{ background: '#F1F5F9' }}>
                          <td 
                            colSpan={visibleColumns.length} 
                            style={{ 
                              padding: '0.6rem 1rem', 
                              fontWeight: 900, 
                              color: '#334155', 
                              fontSize: '0.75rem', 
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                              {groupName} — {items.length} {items.length === 1 ? 'Ocorrência' : 'Ocorrências'}
                            </span>
                          </td>
                        </tr>
                        {items.map((a, idx) => (
                          <tr key={`${groupName}-${idx}`} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                            {columnOrder.map(colId => {
                              if (!visibleColumns.includes(colId)) return null;
                              return (
                                <td key={colId} style={{ padding: '0.65rem 0.85rem' }}>
                                  {renderCell(colId, a)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    filteredTableData.map((a, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        {columnOrder.map(colId => {
                          if (!visibleColumns.includes(colId)) return null;
                          return (
                            <td key={colId} style={{ padding: '0.65rem 0.85rem' }}>
                              {renderCell(colId, a)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
