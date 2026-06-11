import { useEffect, useState } from 'react'
import { loadAccidentData } from './utils/dataLoader'
import type { Accident } from './types'
import { Dashboard } from './components/Dashboard'
import { UploadSection } from './components/UploadSection'
import { PrintView } from './components/PrintView'
import { LandscapePrintView } from './components/LandscapePrintView'
import { BatchSelector } from './components/BatchSelector'
import { BatchPrintView } from './components/BatchPrintView'
import { Loader2 } from 'lucide-react'

function App() {
  const [accidents, setAccidents] = useState<Accident[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isLandscapePrinting, setIsLandscapePrinting] = useState(false)
  const [isBatchSelecting, setIsBatchSelecting] = useState(false)
  const [batchConfigs, setBatchConfigs] = useState<{ years: number[], unit: string, area: string }[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([2024, 2025, 2026])
  const [filterDivision, setFilterDivision] = useState('ALL')
  const [filterManager, setFilterManager] = useState('ALL')
  const [filterArea, setFilterArea] = useState<string[]>([])
  const [safetyGroupBy, setSafetyGroupBy] = useState<'area' | 'division'>('area')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedData = localStorage.getItem('savedAccidentsData')
        if (savedData) {
          const parsedData = JSON.parse(savedData) as Accident[]
          parsedData.forEach(d => {
            d.date = new Date(d.date)
          })
          if (parsedData.length > 0) {
            setAccidents(parsedData)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.error('Failed to load saved data from localStorage:', e)
      }

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

  if (isPrinting) {
    return (
      <PrintView 
        accidents={accidents} 
        selectedYears={selectedYears} 
        filterDivision={filterDivision}
        filterManager={filterManager}
        filterArea={filterArea}
        safetyGroupBy={safetyGroupBy}
        onBack={() => setIsPrinting(false)} 
      />
    )
  }

  if (isLandscapePrinting) {
    return (
      <LandscapePrintView 
        accidents={accidents} 
        selectedYears={selectedYears} 
        filterDivision={filterDivision}
        filterManager={filterManager}
        filterArea={filterArea}
        safetyGroupBy={safetyGroupBy}
        onBack={() => setIsLandscapePrinting(false)} 
      />
    )
  }

  if (batchConfigs.length > 0) {
    return (
      <BatchPrintView 
        accidents={accidents} 
        configs={batchConfigs} 
        safetyGroupBy={safetyGroupBy}
        onBack={() => setBatchConfigs([])} 
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
        safetyGroupBy={safetyGroupBy}
        onSafetyGroupByChange={setSafetyGroupBy}
        onReset={() => setShowUpload(true)}
        onPrint={() => setIsPrinting(true)}
        onLandscapePrint={() => setIsLandscapePrinting(true)}
        onBatchPrint={() => setIsBatchSelecting(true)}
      />
      {isBatchSelecting && (
        <BatchSelector 
          accidents={accidents}
          onCancel={() => setIsBatchSelecting(false)}
          onGenerate={(years, units, areas) => {
            const configs: { years: number[], unit: string, area: string }[] = [];
            
            // If no units/areas selected, generate for 'ALL'
            const targetUnits = units.length > 0 ? units : ['ALL'];
            const targetAreas = areas.length > 0 ? areas : ['ALL'];

            targetUnits.forEach(u => {
              targetAreas.forEach(a => {
                // Only add config if there are actual accidents in this combination
                const hasData = accidents.some(acc => {
                  const matchesYear = years.includes(acc.year);
                  const matchesUnit = u === 'ALL' || acc.division === u;
                  const matchesArea = a === 'ALL' || acc.area === a;
                  return matchesYear && matchesUnit && matchesArea;
                });

                if (hasData) {
                  configs.push({ years, unit: u, area: a });
                }
              });
            });

            setBatchConfigs(configs);
            setIsBatchSelecting(false);
          }}
        />
      )}
    </>
  )
}

export default App
