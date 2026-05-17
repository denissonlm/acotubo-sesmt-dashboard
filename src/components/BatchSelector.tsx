import React, { useMemo, useState } from 'react';
import { X, Printer, Filter, ChevronRight, Layers } from 'lucide-react';
import type { Accident } from '../types';
import { motion } from 'framer-motion';

interface BatchSelectorProps {
  accidents: Accident[];
  onCancel: () => void;
  onGenerate: (selectedYears: number[], selectedUnits: string[], selectedAreas: string[]) => void;
}

export const BatchSelector: React.FC<BatchSelectorProps> = ({ accidents, onCancel, onGenerate }) => {
  const allYears = useMemo(() => Array.from(new Set(accidents.map(a => a.year))).sort((a, b) => b - a), [accidents]);
  const allUnits = useMemo(() => Array.from(new Set(accidents.map(a => a.division))).sort(), [accidents]);
  const allAreas = useMemo(() => Array.from(new Set(accidents.map(a => a.area))).sort(), [accidents]);

  const [selectedYears, setSelectedYears] = useState<number[]>(allYears.slice(0, 3));
  const [reportMode, setReportMode] = useState<'unit' | 'area'>('unit');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Count how many selected combos actually have accidents in the selected years
  const validReportCount = useMemo(() => {
    if (selectedItems.length === 0 || selectedYears.length === 0) return 0;
    return selectedItems.filter(item =>
      accidents.some(acc => {
        const matchesYear = selectedYears.includes(acc.year);
        const matchesFilter = reportMode === 'unit' ? acc.division === item : acc.area === item;
        return matchesYear && matchesFilter;
      })
    ).length;
  }, [selectedItems, selectedYears, reportMode, accidents]);

  const skippedCount = selectedItems.length - validReportCount;

  const toggleItem = (list: any[], setList: any, item: any) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleGenerate = () => {
    if (reportMode === 'unit') {
      onGenerate(selectedYears, selectedItems, []);
    } else {
      onGenerate(selectedYears, [], selectedItems);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '2rem'
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="panel-premium" 
        style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        <header style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)' }}>
              Emissão <span style={{ color: 'var(--primary)' }}>em Massa</span>
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Escolha entre emitir por Unidade ou por Área para evitar combinações vazias.
            </p>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </header>

        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {/* Seleção de Modo */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: '#F1F5F9', padding: '0.5rem', borderRadius: '12px' }}>
            <button 
              onClick={() => { setReportMode('unit'); setSelectedItems([]); }}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: reportMode === 'unit' ? 'white' : 'transparent', fontWeight: 800, cursor: 'pointer', boxShadow: reportMode === 'unit' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', color: reportMode === 'unit' ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              Agrupar por Unidade
            </button>
            <button 
              onClick={() => { setReportMode('area'); setSelectedItems([]); }}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: reportMode === 'area' ? 'white' : 'transparent', fontWeight: 800, cursor: 'pointer', boxShadow: reportMode === 'area' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', color: reportMode === 'area' ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              Agrupar por Área
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            {/* Coluna Anos */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                <Layers size={18} />
                <h4 style={{ margin: 0, fontWeight: 800 }}>1. Período (Anos)</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allYears.map(year => (
                  <label key={year} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', background: selectedYears.includes(year) ? 'var(--primary-light)' : 'white' }}>
                    <input type="checkbox" checked={selectedYears.includes(year)} onChange={() => toggleItem(selectedYears, setSelectedYears, year)} />
                    <span style={{ fontWeight: 700 }}>{year}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Coluna Itens (Unidades ou Áreas) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: reportMode === 'unit' ? '#3B82F6' : '#10B981' }}>
                {reportMode === 'unit' ? <Filter size={18} /> : <ChevronRight size={18} />}
                <h4 style={{ margin: 0, fontWeight: 800 }}>2. Selecionar {reportMode === 'unit' ? 'Unidades' : 'Áreas'}</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <button 
                  onClick={() => {
                    const all = reportMode === 'unit' ? allUnits : allAreas;
                    setSelectedItems(selectedItems.length === all.length ? [] : [...all]);
                  }}
                  style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: '0.5rem' }}
                >
                  {selectedItems.length === (reportMode === 'unit' ? allUnits.length : allAreas.length) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
                {(reportMode === 'unit' ? allUnits : allAreas).map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', background: selectedItems.includes(item) ? (reportMode === 'unit' ? '#EFF6FF' : '#ECFDF5') : 'white' }}>
                    <input type="checkbox" checked={selectedItems.includes(item)} onChange={() => toggleItem(selectedItems, setSelectedItems, item)} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer style={{ padding: '2rem', background: '#F8FAFC', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>{validReportCount}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>COM DADOS</div>
            </div>
            {skippedCount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#94A3B8' }}>{skippedCount}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8' }}>SEM EVENTOS</div>
              </div>
            )}
            {skippedCount > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500, maxWidth: '220px', lineHeight: 1.4, borderLeft: '3px solid #E2E8F0', paddingLeft: '0.75rem' }}>
                {skippedCount} {skippedCount === 1 ? 'relatório sem ocorrências será ignorado' : 'relatórios sem ocorrências serão ignorados'} no período selecionado.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onCancel} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', fontWeight: 700, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button 
              disabled={validReportCount === 0}
              onClick={handleGenerate}
              style={{ 
                padding: '0.8rem 2.5rem', borderRadius: '12px', border: 'none', 
                background: validReportCount === 0 ? '#CBD5E1' : 'var(--primary)', 
                color: 'white', fontWeight: 900, cursor: validReportCount === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                boxShadow: validReportCount > 0 ? '0 4px 12px rgba(185, 28, 28, 0.2)' : 'none'
              }}
            >
              <Printer size={20} />
              Gerar {validReportCount} Relatórios
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};
