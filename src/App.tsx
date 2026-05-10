import { useEffect, useState } from 'react'
import { loadAccidentData } from './utils/dataLoader'
import type { Accident } from './types'
import { Dashboard } from './components/Dashboard'
import { UploadSection } from './components/UploadSection'
import { PrintView } from './components/PrintView'
import { Loader2 } from 'lucide-react'

function App() {
  const [accidents, setAccidents] = useState<Accident[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [selectedYears, setSelectedYears] = useState<number[]>([2024, 2025, 2026])

  useEffect(() => {
    const fetchData = async () => {
      const data = await loadAccidentData('./Dash Acidentes.xlsx')
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
        onBack={() => setIsPrinting(false)} 
      />
    )
  }

  return (
    <Dashboard 
      accidents={accidents} 
      selectedYears={selectedYears}
      onYearsChange={setSelectedYears}
      onReset={() => setShowUpload(true)}
      onPrint={() => setIsPrinting(true)}
    />
  )
}

export default App
