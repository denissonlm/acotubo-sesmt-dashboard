import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Monitor, Calendar, Building2, UserCheck, 
  Briefcase, RotateCcw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Accident } from '../types';

export interface LandscapeFilterValues {
  years: number[];
  division: string;
  manager: string;
  area: string;
}

interface LandscapeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  accidents: Accident[];
  initialFilters: LandscapeFilterValues;
  onConfirm: (filters: LandscapeFilterValues) => void;
}

export const LandscapeFilterModal: React.FC<LandscapeFilterModalProps> = ({
  isOpen,
  onClose,
  accidents,
  initialFilters,
  onConfirm
}) => {
  const allYears = useMemo(() => {
    return Array.from(new Set(accidents.map(a => a.year))).sort((a, b) => b - a);
  }, [accidents]);

  const allDivisions = useMemo(() => {
    return Array.from(new Set(accidents.map(a => a.division).filter(Boolean))).sort();
  }, [accidents]);

  const allManagers = useMemo(() => {
    return Array.from(new Set(accidents.map(a => a.manager).filter(Boolean))).sort();
  }, [accidents]);

  const allAreas = useMemo(() => {
    return Array.from(new Set(accidents.map(a => a.area).filter(Boolean))).sort();
  }, [accidents]);

  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedManager, setSelectedManager] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      const validYears = initialFilters.years && initialFilters.years.length > 0 
        ? initialFilters.years 
        : allYears;
      setSelectedYears(validYears);
      setSelectedDivision(initialFilters.division || 'ALL');
      setSelectedManager(initialFilters.manager || 'ALL');
      setSelectedArea(initialFilters.area || 'ALL');
    }
  }, [isOpen, initialFilters, allYears]);

  // Cálculo em tempo real dos acidentes correspondentes
  const matchingAccidents = useMemo(() => {
    return accidents.filter(a => {
      const matchYear = selectedYears.includes(a.year);
      const matchDiv = selectedDivision === 'ALL' || a.division === selectedDivision;
      const matchMgr = selectedManager === 'ALL' || a.manager === selectedManager;
      const matchArea = selectedArea === 'ALL' || a.area === selectedArea;
      return matchYear && matchDiv && matchMgr && matchArea;
    });
  }, [accidents, selectedYears, selectedDivision, selectedManager, selectedArea]);

  const totalMatching = matchingAccidents.length;
  const totalLostDays = useMemo(() => matchingAccidents.reduce((s, a) => s + (a.lostDays || 0), 0), [matchingAccidents]);
  const withLeaveCount = useMemo(() => matchingAccidents.filter(a => (a.lostDays || 0) > 0).length, [matchingAccidents]);

  const handleToggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        setSelectedYears(selectedYears.filter(y => y !== year));
      }
    } else {
      setSelectedYears([...selectedYears, year].sort((a, b) => a - b));
    }
  };

  const handleSelectAllYears = () => {
    setSelectedYears([...allYears].sort((a, b) => a - b));
  };

  const handleResetFilters = () => {
    setSelectedYears([...allYears].sort((a, b) => a - b));
    setSelectedDivision('ALL');
    setSelectedManager('ALL');
    setSelectedArea('ALL');
  };

  const handleConfirm = () => {
    onConfirm({
      years: selectedYears.length > 0 ? selectedYears : allYears,
      division: selectedDivision,
      manager: selectedManager,
      area: selectedArea
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2500,
        padding: '1.5rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              padding: '0.65rem',
              borderRadius: '12px',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Monitor size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                Quadro de Gestão à Vista
              </h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
                Selecione os filtros para a emissão em A4 Paisagem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '10px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.35rem', maxHeight: '72vh', overflowY: 'auto' }}>
          
          {/* 1. Anos / Período */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>
                <Calendar size={16} color="#10B981" />
                Período de Análise (Anos)
              </label>
              <button
                type="button"
                onClick={handleSelectAllYears}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#10B981',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textDecoration: 'underline'
                }}
              >
                Selecionar Todos
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {allYears.map(year => {
                const isSelected = selectedYears.includes(year);
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleToggleYear(year)}
                    style={{
                      padding: '0.55rem 1.25rem',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid #10B981' : '1.5px solid #CBD5E1',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                        : '#F8FAFC',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                  >
                    {isSelected && <CheckCircle2 size={15} color="#FFFFFF" />}
                    {year}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Filtros em 3 Linhas Elegantes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Unidade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>
                <Building2 size={16} color="#3B82F6" />
                Unidade Fabril
              </label>
              <select
                value={selectedDivision}
                onChange={e => setSelectedDivision(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <option value="ALL">Todas as Unidades (Consolidado Grupo Açotubo)</option>
                {allDivisions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Superior Direto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>
                <UserCheck size={16} color="#10B981" />
                Superior Direto (Liderança)
              </label>
              <select
                value={selectedManager}
                onChange={e => setSelectedManager(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <option value="ALL">Todos os Superiores Diretos (Geral)</option>
                {allManagers.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Área / Setor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>
                <Briefcase size={16} color="#F59E0B" />
                Área / Setor Operacional
              </label>
              <select
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <option value="ALL">Todas as Áreas / Setores</option>
                {allAreas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Card de Resumo em Tempo Real */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Resumo do Recorte em Tempo Real
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                title="Restaurar para todos os registros"
              >
                <RotateCcw size={12} />
                Limpar Filtros
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                padding: '0.6rem 0.8rem',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #10B981'
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Acidentes
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>
                  {totalMatching}
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                padding: '0.6rem 0.8rem',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #F59E0B'
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Dias Perdidos
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>
                  {totalLostDays}
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                padding: '0.6rem 0.8rem',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #EF4444'
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                  Com Afastamento
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, marginTop: '2px' }}>
                  {withLeaveCount}
                </div>
              </div>
            </div>

            {totalMatching === 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>Nenhum acidente encontrado para este cruzamento de filtros. O quadro exibirá indicadores zerados.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedYears.length === 0}
            style={{
              padding: '0.65rem 1.6rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 900,
              cursor: selectedYears.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedYears.length === 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              if (selectedYears.length > 0) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(16, 185, 129, 0.45)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.35)';
            }}
          >
            <Monitor size={18} />
            <span>Gerar Quadro de Gestão à Vista</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
