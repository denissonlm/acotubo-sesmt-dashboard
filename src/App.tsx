import { useEffect, useState, useMemo } from 'react'
import { loadAccidentData } from './utils/dataLoader'
import { fetchAccidentsFromSupabase, upsertAccidentsToSupabase } from './utils/supabase'
import type { Accident } from './types'
import { Dashboard } from './components/Dashboard'
import { UploadSection } from './components/UploadSection'
import { LandscapePrintView } from './components/LandscapePrintView'
import { MonthDrilldownPrintView } from './components/MonthDrilldownPrintView'
import { LandscapeFilterModal, type LandscapeFilterValues } from './components/LandscapeFilterModal'
import { Loader2 } from 'lucide-react'

function App() {
  const [accidents, setAccidents] = useState<Accident[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [isLandscapePrinting, setIsLandscapePrinting] = useState(false)
  const [monthPrintData, setMonthPrintData] = useState<{ year: number; month: number; metric: 'accidents' | 'lostDays' } | null>(null)
  const [isLandscapeModalOpen, setIsLandscapeModalOpen] = useState(false)
  const [catOnly, setCatOnly] = useState(false)
  const [dataSource, setDataSource] = useState<'supabase' | 'local' | 'none'>('none')
  const [isSyncingInitial, setIsSyncingInitial] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)
  const [supabaseTableMissing, setSupabaseTableMissing] = useState(false)

  const [landscapeFilters, setLandscapeFilters] = useState<LandscapeFilterValues>({
    years: [2024, 2025, 2026],
    division: 'ALL',
    manager: 'ALL',
    areas: ['ALL']
  })
  
  // Filtros ativos no painel principal
  const [selectedYears, setSelectedYears] = useState<number[]>([2024, 2025, 2026])
  const [filterDivision, setFilterDivision] = useState('ALL')
  const [filterManager, setFilterManager] = useState('ALL')
  const [filterArea, setFilterArea] = useState('ALL')

  const effectiveAccidents = useMemo(() => {
    if (!catOnly) return accidents;
    return accidents.filter(a => a.hasCat);
  }, [accidents, catOnly]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Tentar buscar primeiro do Supabase
      const supabaseRes = await fetchAccidentsFromSupabase();

      if (supabaseRes.data && supabaseRes.data.length > 0) {
        setAccidents(supabaseRes.data);
        setDataSource('supabase');
        setLoading(false);
        return;
      }

      if (supabaseRes.error && supabaseRes.error.includes('PGRST205')) {
        setSupabaseTableMissing(true);
      }

      // 2. Fallback para planilha local inicial
      const localData = await loadAccidentData('./data.xlsx');
      if (localData.length > 0) {
        setAccidents(localData);
        setDataSource('local');
      } else {
        setShowUpload(true);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSyncLocalToSupabase = async () => {
    if (accidents.length === 0) return;
    setIsSyncingInitial(true);
    setSyncFeedback('Sincronizando base com o Supabase...');

    const res = await upsertAccidentsToSupabase(accidents);
    if (res.success) {
      setDataSource('supabase');
      setSupabaseTableMissing(false);
      setSyncFeedback(`✅ ${res.count} acidentes salvos com sucesso no Supabase!`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } else {
      setSyncFeedback(`⚠️ Falha ao sincronizar: ${res.error}`);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
    setIsSyncingInitial(false);
  };

  if (loading) {
    return (
      <div className="loader-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Conectando ao banco de dados Supabase e carregando dados...</p>
      </div>
    );
  }

  if (showUpload) {
    return (
      <UploadSection 
        onDataLoaded={(data) => {
          setAccidents(data);
          setDataSource('supabase');
          setShowUpload(false);
        }}
        onCancel={accidents.length > 0 ? () => setShowUpload(false) : undefined}
      />
    );
  }

  if (monthPrintData) {
    return (
      <MonthDrilldownPrintView 
        accidents={effectiveAccidents}
        year={monthPrintData.year}
        month={monthPrintData.month}
        metric={monthPrintData.metric}
        filterDivision={filterDivision}
        filterManager={filterManager}
        filterArea={filterArea}
        filterAreas={landscapeFilters.areas}
        onBack={() => setMonthPrintData(null)}
      />
    );
  }

  if (isLandscapePrinting) {
    return (
      <LandscapePrintView 
        accidents={effectiveAccidents} 
        selectedYears={landscapeFilters.years} 
        filterDivision={landscapeFilters.division} 
        filterManager={landscapeFilters.manager} 
        filterAreas={landscapeFilters.areas} 
        onBack={() => setIsLandscapePrinting(false)} 
      />
    );
  }

  return (
    <>
      {/* Banner de Feedback da Sincronização */}
      {syncFeedback && (
        <div style={{
          background: syncFeedback.startsWith('✅') ? '#ECFDF5' : '#FEF2F2',
          color: syncFeedback.startsWith('✅') ? '#065F46' : '#991B1B',
          borderBottom: '1px solid ' + (syncFeedback.startsWith('✅') ? '#A7F3D0' : '#FECACA'),
          padding: '0.5rem 1.5rem',
          fontSize: '0.8rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <span>{syncFeedback}</span>
          <button 
            onClick={() => setSyncFeedback(null)} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 900, color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Aviso informativo quando operando em base local */}
      {dataSource === 'local' && !syncFeedback && (
        <div style={{
          background: '#EFF6FF',
          color: '#1E40AF',
          borderBottom: '1px solid #BFDBFE',
          padding: '0.45rem 1.5rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📁 <strong>Base Local Carregada</strong> ({accidents.length} registros).</span>
            {supabaseTableMissing ? (
              <span style={{ color: '#DC2626', fontWeight: 800 }}>
                ⚠️ Execute o script SQL no Supabase para criar a tabela <code>accidents</code>.
              </span>
            ) : (
              <span style={{ color: '#059669', fontWeight: 700 }}>
                ☁️ Supabase conectado (pronto para receber dados).
              </span>
            )}
          </div>

          {!supabaseTableMissing && (
            <button
              type="button"
              onClick={handleSyncLocalToSupabase}
              disabled={isSyncingInitial}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: isSyncingInitial ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {isSyncingInitial ? 'Sincronizando...' : '☁️ Sincronizar Base Local com Supabase'}
            </button>
          )}
        </div>
      )}

      <Dashboard 
        accidents={effectiveAccidents} 
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        filterDivision={filterDivision}
        onDivisionChange={setFilterDivision}
        filterManager={filterManager}
        onManagerChange={setFilterManager}
        filterArea={filterArea}
        onAreaChange={setFilterArea}
        onReset={() => setShowUpload(true)}
        onLandscapePrint={() => setIsLandscapeModalOpen(true)}
        catOnly={catOnly}
        onToggleCatOnly={() => setCatOnly(prev => !prev)}
        dataSource={dataSource}
        onPrintMonthDrilldown={setMonthPrintData}
      />

      <LandscapeFilterModal 
        isOpen={isLandscapeModalOpen}
        onClose={() => setIsLandscapeModalOpen(false)}
        accidents={effectiveAccidents}
        initialFilters={{
          years: selectedYears,
          division: filterDivision,
          manager: filterManager,
          areas: filterArea !== 'ALL' ? [filterArea] : ['ALL']
        }}
        onConfirm={(filters) => {
          setLandscapeFilters(filters);
          setIsLandscapeModalOpen(false);
          setIsLandscapePrinting(true);
        }}
      />
    </>
  )
}

export default App
