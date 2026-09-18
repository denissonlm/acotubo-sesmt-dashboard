import { useEffect, useState } from 'react'
import { loadAccidentData } from './utils/dataLoader'
import type { Accident } from './types'
import { Dashboard } from './components/Dashboard'
import { UploadSection } from './components/UploadSection'
import { LandscapePrintView } from './components/LandscapePrintView'
import { LandscapeFilterModal, type LandscapeFilterValues } from './components/LandscapeFilterModal'
import { Loader2 } from 'lucide-react'

function App() {
  const [accidents, setAccidents] = useState<Accident[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [isLandscapePrinting, setIsLandscapePrinting] = useState(false)
  const [isLandscapeModalOpen, setIsLandscapeModalOpen] = useState(false)
  const [landscapeFilters, setLandscapeFilters] = useState<LandscapeFilterValues>({
    years: [2024, 2025, 2026],
    division: 'ALL',
    manager: 'ALL',
    area: 'ALL'
  })
  
  // Filtros ativos no painel principal
  const [selectedYears, setSelectedYears] = useState<number[]>([2024, 2025, 2026])
  const [filterDivision, setFilterDivision] = useState('ALL')
  const [filterManager, setFilterManager] = useState('ALL')
  const [filterArea, setFilterArea] = useState('ALL')

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadAccidentData('./data.xlsx')
      if (data.length > 0) {
        setAccidents(data)
      } else {
        setShowUpload(true)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="loader-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando dados de segurança...</p>
      </div>
    )
  }

  if (showUpload) {
    return (
      <UploadSection 
        onDataLoaded={(data) => {
          setAccidents(data)
          setShowUpload(false)
        }} 
      />
    )
  }

  if (isLandscapePrinting) {
    return (
      <LandscapePrintView 
        accidents={accidents} 
        selectedYears={landscapeFilters.years} 
        filterDivision={landscapeFilters.division} 
        filterManager={landscapeFilters.manager} 
        filterArea={landscapeFilters.area} 
        onBack={() => setIsLandscapePrinting(false)} 
      />
    )
  }

  return (
    <>
      <Dashboard 
        accidents={accidents} 
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
      />

      <LandscapeFilterModal 
        isOpen={isLandscapeModalOpen}
        onClose={() => setIsLandscapeModalOpen(false)}
        accidents={accidents}
        initialFilters={{
          years: selectedYears,
          division: filterDivision,
          manager: filterManager,
          area: filterArea
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
