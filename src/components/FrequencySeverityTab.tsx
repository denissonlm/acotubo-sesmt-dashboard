import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell
} from "recharts";
import { 
  Activity, Gauge, Clock, ShieldCheck, 
  TrendingUp, Filter, Upload, RotateCcw, Calendar, CheckCircle2,
  Building2, Target, SlidersHorizontal, AlertCircle
} from "lucide-react";
import type { Accident, OITClassification } from "../types";
import { 
  processFrequencyAndSeverity, 
  generateFrequencySeverityStory,
  parseHHTSpreadsheet,
  loadHHTStore,
  saveHHTStoreToLocalStorage,
  resetHHTStoreLocalStorage,
  getFrequencyRateColor,
  getSeverityRateColor,
  getUnitsList,
  loadUnitGroupingConfig,
  saveUnitGroupingConfig,
  type UnitGroupingConfig,
  type MultiYearHHTStore
} from "../utils/frequencySeverityLoader";
import { UnitGroupingModal } from "./UnitGroupingModal";
import { motion } from "framer-motion";

interface FrequencySeverityTabProps {
  accidents: Accident[];
  availableYears?: number[];
}

const getStatusColor = (status: OITClassification): string => {
  switch (status) {
    case "MUITO BOA": return "#10B981"; // Muito boa = Verde
    case "BOA": return "#10B981";       // Boa = Verde também
    case "RUIM":
    case "REGULAR": return "#D97706";   // Ruim = Amarelo (Dourado de alto contraste)
    case "PÉSSIMA": return "#EF4444";   // Péssimo = Vermelho
    case "SEM DADOS": return "#94A3B8"; // Sem HHT
    default: return "#64748B";
  }
};

const getStatusBg = (status: OITClassification): string => {
  switch (status) {
    case "MUITO BOA": return "rgba(16, 185, 129, 0.12)";
    case "BOA": return "rgba(16, 185, 129, 0.12)";
    case "RUIM":
    case "REGULAR": return "rgba(234, 179, 8, 0.15)";
    case "PÉSSIMA": return "rgba(239, 68, 68, 0.12)";
    case "SEM DADOS": return "rgba(148, 163, 184, 0.15)";
    default: return "rgba(100, 116, 139, 0.12)";
  }
};

const MONTHS_MAP = [
  { num: 1, name: "Jan" },
  { num: 2, name: "Fev" },
  { num: 3, name: "Mar" },
  { num: 4, name: "Abr" },
  { num: 5, name: "Mai" },
  { num: 6, name: "Jun" },
  { num: 7, name: "Jul" },
  { num: 8, name: "Ago" },
  { num: 9, name: "Set" },
  { num: 10, name: "Out" },
  { num: 11, name: "Nov" },
  { num: 12, name: "Dez" }
];

const FrequencyCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fFormatted = Number(data.frequencyRate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const hhFormatted = Number(data.hht).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    return (
      <div style={{
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        color: "#FFFFFF",
        fontSize: "0.8rem",
        minWidth: "175px"
      }}>
        <div style={{ fontWeight: 800, color: "#94A3B8", marginBottom: "6px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Mês: {data.monthName}/{data.year}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ color: "#F8FAFC", fontWeight: 700 }}>Frequência (F):</span>
          <span style={{ fontWeight: 900, color: "#38BDF8", fontSize: "1.05rem" }}>{fFormatted}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ color: "#94A3B8", fontSize: "0.75rem" }}>Classificação:</span>
          <span style={{ 
            padding: "2px 6px", 
            borderRadius: "4px", 
            fontSize: "0.72rem", 
            fontWeight: 800,
            color: getStatusColor(data.frequencyStatus),
            background: getStatusBg(data.frequencyStatus)
          }}>
            {data.frequencyStatus}
          </span>
        </div>
        <div style={{ borderTop: "1px solid #334155", paddingTop: "6px", fontSize: "0.72rem", color: "#94A3B8", display: "flex", justifyContent: "space-between" }}>
          <span>Acidentados: <strong style={{ color: "#FFFFFF" }}>{data.accidents}</strong></span>
          <span>HH: <strong style={{ color: "#FFFFFF" }}>{hhFormatted} h</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

const SeverityCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const gFormatted = Number(data.severityRate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const hhFormatted = Number(data.hht).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    return (
      <div style={{
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        color: "#FFFFFF",
        fontSize: "0.8rem",
        minWidth: "175px"
      }}>
        <div style={{ fontWeight: 800, color: "#94A3B8", marginBottom: "6px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Mês: {data.monthName}/{data.year}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ color: "#F8FAFC", fontWeight: 700 }}>Gravidade (G):</span>
          <span style={{ fontWeight: 900, color: "#38BDF8", fontSize: "1.05rem" }}>{gFormatted}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ color: "#94A3B8", fontSize: "0.75rem" }}>Classificação:</span>
          <span style={{ 
            padding: "2px 6px", 
            borderRadius: "4px", 
            fontSize: "0.72rem", 
            fontWeight: 800,
            color: getStatusColor(data.severityStatus),
            background: getStatusBg(data.severityStatus)
          }}>
            {data.severityStatus}
          </span>
        </div>
        <div style={{ borderTop: "1px solid #334155", paddingTop: "6px", fontSize: "0.72rem", color: "#94A3B8", display: "flex", justifyContent: "space-between" }}>
          <span>Dias Perdidos: <strong style={{ color: "#FFFFFF" }}>{data.lostDays}</strong></span>
          <span>HH: <strong style={{ color: "#FFFFFF" }}>{hhFormatted} h</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

const UnitFrequencyCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fFormatted = Number(data.frequencyRate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const hhFormatted = Number(data.hht).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    return (
      <div style={{
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        color: "#FFFFFF",
        fontSize: "0.8rem",
        minWidth: "210px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderBottom: "1px solid #334155", paddingBottom: "6px" }}>
          <span style={{ fontWeight: 800, color: "#94A3B8", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            #{data.rank} no Ranking
          </span>
          <span style={{ 
            padding: "2px 6px", 
            borderRadius: "4px", 
            fontSize: "0.7rem", 
            fontWeight: 800,
            color: getStatusColor(data.frequencyStatus),
            background: getStatusBg(data.frequencyStatus)
          }}>
            {data.frequencyStatus}
          </span>
        </div>
        <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.88rem", marginBottom: "6px" }}>
          {data.unitName}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ color: "#F8FAFC", fontWeight: 700 }}>Frequência (F):</span>
          <span style={{ fontWeight: 900, color: "#38BDF8", fontSize: "1.05rem" }}>{fFormatted}</span>
        </div>
        <div style={{ borderTop: "1px solid #334155", paddingTop: "6px", fontSize: "0.72rem", color: "#94A3B8", display: "flex", justifyContent: "space-between" }}>
          <span>Acidentados (N): <strong style={{ color: "#FFFFFF" }}>{data.accidents}</strong></span>
          <span>HH: <strong style={{ color: "#FFFFFF" }}>{hhFormatted} h</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

const UnitSeverityCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const gFormatted = Number(data.severityRate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const hhFormatted = Number(data.hht).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    return (
      <div style={{
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        color: "#FFFFFF",
        fontSize: "0.8rem",
        minWidth: "210px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderBottom: "1px solid #334155", paddingBottom: "6px" }}>
          <span style={{ fontWeight: 800, color: "#94A3B8", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            #{data.rank} no Ranking
          </span>
          <span style={{ 
            padding: "2px 6px", 
            borderRadius: "4px", 
            fontSize: "0.7rem", 
            fontWeight: 800,
            color: getStatusColor(data.severityStatus),
            background: getStatusBg(data.severityStatus)
          }}>
            {data.severityStatus}
          </span>
        </div>
        <div style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.88rem", marginBottom: "6px" }}>
          {data.unitName}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ color: "#F8FAFC", fontWeight: 700 }}>Gravidade (G):</span>
          <span style={{ fontWeight: 900, color: "#38BDF8", fontSize: "1.05rem" }}>{gFormatted}</span>
        </div>
        <div style={{ borderTop: "1px solid #334155", paddingTop: "6px", fontSize: "0.72rem", color: "#94A3B8", display: "flex", justifyContent: "space-between" }}>
          <span>Dias Perdidos (T): <strong style={{ color: "#FFFFFF" }}>{data.lostDays}</strong></span>
          <span>HH: <strong style={{ color: "#FFFFFF" }}>{hhFormatted} h</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

export const FrequencySeverityTab: React.FC<FrequencySeverityTabProps> = ({ 
  accidents, 
  availableYears = [2024, 2025, 2026] 
}) => {
  // Estado da base multi-ano de HHT persistida no LocalStorage
  const [hhtStore, setHhtStore] = useState<MultiYearHHTStore>(() => loadHHTStore());
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [fViewMode, setFViewMode] = useState<"monthly" | "ranking">("monthly");
  const [gViewMode, setGViewMode] = useState<"monthly" | "ranking">("monthly");
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuração de agrupamento de unidades fabris
  const [groupingConfig, setGroupingConfig] = useState<UnitGroupingConfig>(() => loadUnitGroupingConfig());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Lista dinâmica de unidades ativas segundo a configuração de agrupamento
  const activeUnitsList = useMemo(() => {
    return getUnitsList(groupingConfig);
  }, [groupingConfig]);

  // Se a unidade selecionada não estiver mais na lista ativa, redefinir para "ALL"
  useEffect(() => {
    if (selectedUnit !== "ALL" && !activeUnitsList.includes(selectedUnit)) {
      setSelectedUnit("ALL");
    }
  }, [activeUnitsList, selectedUnit]);

  const handleSaveGroupingConfig = (newConfig: UnitGroupingConfig) => {
    setGroupingConfig(newConfig);
    saveUnitGroupingConfig(newConfig);
  };

  // Lista consolidada de anos disponíveis (anos dos acidentes + anos no HHTStore)
  const allYears = useMemo(() => {
    const yearsSet = new Set<number>(availableYears);
    Object.keys(hhtStore).forEach(y => yearsSet.add(Number(y)));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [availableYears, hhtStore]);

  // Meses disponíveis para o ano selecionado (HHT + ocorrências registradas)
  const availableMonthsForYear = useMemo(() => {
    const yearData = hhtStore[selectedYear];
    const hhtMonths = yearData && Object.keys(yearData).length > 0
      ? Object.keys(yearData).map(Number)
      : [];
    const accidentMonths = accidents
      .filter(a => a.year === selectedYear)
      .map(a => a.month);
    const allMonths = Array.from(new Set([...hhtMonths, ...accidentMonths])).sort((a, b) => a - b);
    return allMonths.length > 0 ? allMonths : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [hhtStore, selectedYear, accidents]);

  // Ajustar meses selecionados ao trocar de ano
  useEffect(() => {
    setSelectedMonths([...availableMonthsForYear]);
  }, [selectedYear, availableMonthsForYear]);

  // Toggle de mês individual no filtro
  const toggleMonth = (m: number) => {
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter(x => x !== m));
      }
    } else {
      setSelectedMonths([...selectedMonths, m].sort((a, b) => a - b));
    }
  };

  const selectAllMonths = () => {
    setSelectedMonths([...availableMonthsForYear]);
  };

  // Processamento com as Horas Totais (coluna Total) como divisor e agrupamento configurado
  const overview = useMemo(() => {
    return processFrequencyAndSeverity(
      accidents,
      selectedYear,
      selectedMonths,
      selectedUnit,
      hhtStore,
      groupingConfig
    );
  }, [accidents, selectedYear, selectedMonths, selectedUnit, hhtStore, groupingConfig]);

  const storyText = useMemo(() => {
    return generateFrequencySeverityStory(overview, selectedYear);
  }, [overview, selectedYear]);

  const fUnitRanking = useMemo(() => {
    return [...overview.unitRecords]
      .sort((a, b) => b.frequencyRate - a.frequencyRate)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        shortName: item.unitName.replace(/^AÇOTUBO\s*-\s*/i, "")
      }));
  }, [overview.unitRecords]);

  const gUnitRanking = useMemo(() => {
    return [...overview.unitRecords]
      .sort((a, b) => b.severityRate - a.severityRate)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        shortName: item.unitName.replace(/^AÇOTUBO\s*-\s*/i, "")
      }));
  }, [overview.unitRecords]);

  const fmtNumber = (n: number, decimals: number = 2) => {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Upload múltiplo inteligente com gravação persistente no LocalStorage
  const handleMultipleHHTUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let processedCount = 0;
    const updatedStore: MultiYearHHTStore = { ...hhtStore };
    const uploadedInfo: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseHHTSpreadsheet(buffer, file.name);
        if (parsed) {
          const y = parsed.year;
          const m = parsed.month;
          if (!updatedStore[y]) updatedStore[y] = {};
          updatedStore[y][m] = parsed;
          processedCount++;
          uploadedInfo.push(`${String(m).padStart(2, "0")}/${y}`);
        }
      } catch (err) {
        console.error(`Erro ao processar ${file.name}:`, err);
      }
    }

    if (processedCount > 0) {
      setHhtStore(updatedStore);
      saveHHTStoreToLocalStorage(updatedStore);
      setUploadFeedback(`${processedCount} arquivo(s) importado(s) com sucesso no LocalStorage! Meses: ${uploadedInfo.join(", ")}`);
      setTimeout(() => setUploadFeedback(null), 6000);
    } else {
      alert("Nenhum arquivo pôde ser processado. Verifique o formato das planilhas.");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetLocalStorage = () => {
    if (confirm("Deseja restaurar as bases de HHT para os dados originais? As planilhas importadas manualmente serão limpas.")) {
      const restored = resetHHTStoreLocalStorage();
      setHhtStore(restored);
      setUploadFeedback("Bases restauradas com sucesso.");
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
    >
      {/* Top Filter Bar: Multi-Ano, Meses e Unidade */}
      <div className="panel-premium" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.25rem", padding: "1.25rem 1.75rem" }}>
        
        {/* Esquerda: Seletor de Ano e Meses */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          
          {/* Seletor de Ano */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 800, fontSize: "0.85rem", color: "var(--text)" }}>
              <Calendar size={18} color="var(--primary)" />
              <span>Exercício:</span>
            </div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {allYears.map(y => {
                const active = y === selectedYear;
                const yearHasHHT = Boolean(hhtStore[y] && Object.keys(hhtStore[y]).length > 0);
                return (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: "8px",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: active ? "var(--primary)" : "var(--surface)",
                      color: active ? "white" : "var(--text)",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      boxShadow: active ? "0 2px 6px rgba(185, 28, 28, 0.25)" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    title={yearHasHHT ? `Exercício ${y} (com base de HHT cadastrada)` : `Exercício ${y} (sem base de HHT cadastrada)`}
                  >
                    <span>{y}</span>
                    {!yearHasHHT && (
                      <span style={{
                        fontSize: "0.6rem",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        background: active ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                        color: active ? "white" : "#94A3B8",
                        fontWeight: 700
                      }}>
                        Sem HHT
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Meses */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 800, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <Filter size={16} />
              <span>Meses:</span>
            </div>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              <button
                onClick={selectAllMonths}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: selectedMonths.length === availableMonthsForYear.length ? "var(--text)" : "var(--surface)",
                  color: selectedMonths.length === availableMonthsForYear.length ? "white" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer"
                }}
              >
                Todos
              </button>
              {availableMonthsForYear.map(mNum => {
                const mObj = MONTHS_MAP.find(x => x.num === mNum) || { num: mNum, name: `M${mNum}` };
                const active = selectedMonths.includes(mNum);
                return (
                  <button
                    key={mNum}
                    onClick={() => toggleMonth(mNum)}
                    style={{
                      padding: "0.35rem 0.6rem",
                      borderRadius: "6px",
                      border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: active ? "var(--primary-light)" : "var(--surface)",
                      color: active ? "var(--primary)" : "var(--text-muted)",
                      fontWeight: active ? 800 : 600,
                      fontSize: "0.75rem",
                      cursor: "pointer"
                    }}
                  >
                    {mObj.name}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Direita: Seletor de Unidade e Upload Múltiplo */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Unidade (Fonte):</span>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="ALL">Geral (Todas as Unidades)</option>
              {activeUnitsList.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Botão de Configuração de Agrupamento */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            title="Configurar agrupamento de unidades fabris (Matriz, Carbono e fusões customizadas)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--primary)",
              background: groupingConfig.groupMatrizCarbono ? "rgba(185, 28, 28, 0.08)" : "#F8FAFC",
              color: groupingConfig.groupMatrizCarbono ? "var(--primary)" : "#334155",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <SlidersHorizontal size={15} />
            <span>Agrupar Unidades</span>
            <span style={{
              fontSize: "0.68rem",
              padding: "2px 6px",
              borderRadius: "999px",
              background: groupingConfig.groupMatrizCarbono ? "var(--primary)" : "#64748B",
              color: "white",
              fontWeight: 800,
              letterSpacing: "0.3px"
            }}>
              {activeUnitsList.length} Unid.
            </span>
          </button>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importar uma ou múltiplas planilhas mensais de HHT (ex: 09.2026.xlsx, 10.2026.xlsx, etc.)"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.9rem",
                borderRadius: "8px",
                border: "1px dashed var(--primary)",
                background: "white",
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              <Upload size={14} />
              <span>+ Upload Mensal (XLSX)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx, .xls"
              onChange={handleMultipleHHTUpload}
              style={{ display: "none" }}
            />

            <button
              onClick={handleResetLocalStorage}
              title="Restaurar base nativa de HHT"
              style={{
                padding: "0.45rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* Feedback de Upload Persistente */}
      {uploadFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{uploadFeedback}</span>
        </motion.div>
      )}

      {/* Banner de Aviso quando não houver HHT cadastrado */}
      {overview.totalHHT === 0 && (
        <div style={{
          background: "#FFFBEB",
          border: "1.5px solid #FDE68A",
          borderRadius: "12px",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          boxShadow: "0 2px 8px rgba(217, 119, 6, 0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "#FEF3C7", color: "#D97706", padding: "0.5rem", borderRadius: "10px", flexShrink: 0 }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 900, color: "#92400E" }}>
                Sem dados de Horas-Homem Trabalhadas (HHT) para o exercício de {selectedYear}
              </h4>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#B45309", fontWeight: 600 }}>
                O banco de dados oficial possui registros de HHT exclusivamente para o ano de 2026. As taxas oficiais de Frequência (F) e Gravidade (G) só são apuradas mediante importação das planilhas de HHT correspondentes.
              </p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "#D97706",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              fontWeight: 800,
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(217, 119, 6, 0.25)"
            }}
          >
            <Upload size={14} /> Importar HHT {selectedYear}
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
        
        {/* F Card */}
        <div className="panel-premium" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
              <div style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "0.4rem", borderRadius: "8px", flexShrink: 0 }}>
                <Gauge size={20} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                Frequência
              </span>
            </div>
            <span style={{ 
              padding: "0.2rem 0.6rem", 
              borderRadius: "6px", 
              fontSize: "0.75rem", 
              fontWeight: 800,
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: getStatusColor(overview.overallFrequencyStatus),
              background: getStatusBg(overview.overallFrequencyStatus)
            }}>
              {overview.overallFrequencyStatus}
            </span>
          </div>
          
          <div style={{ fontSize: "2.8rem", fontWeight: 900, lineHeight: 1, color: "var(--text)" }}>
            {overview.totalHHT > 0 ? fmtNumber(overview.overallFrequencyRate) : "—"}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            <span>N: <strong>{overview.totalAccidents} acidentados</strong></span>
            <span>{overview.totalHHT > 0 ? "Meta OIT: F ≤ 20,00" : "HHT não cadastrado"}</span>
          </div>
        </div>

        {/* G Card */}
        <div className="panel-premium" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
              <div style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0284C7", padding: "0.4rem", borderRadius: "8px", flexShrink: 0 }}>
                <Activity size={20} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                Gravidade
              </span>
            </div>
            <span style={{ 
              padding: "0.2rem 0.6rem", 
              borderRadius: "6px", 
              fontSize: "0.75rem", 
              fontWeight: 800,
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: getStatusColor(overview.overallSeverityStatus),
              background: getStatusBg(overview.overallSeverityStatus)
            }}>
              {overview.overallSeverityStatus}
            </span>
          </div>
          
          <div style={{ fontSize: "2.8rem", fontWeight: 900, lineHeight: 1, color: "var(--text)" }}>
            {overview.totalHHT > 0 ? fmtNumber(overview.overallSeverityRate) : "—"}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            <span>T: <strong>{overview.totalLostDays} dias computados</strong></span>
            <span>{overview.totalHHT > 0 ? "Meta OIT: G ≤ 500,00" : "HHT não cadastrado"}</span>
          </div>
        </div>

        {/* Horas Trabalhadas (HHT) */}
        <div className="panel-premium" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white", border: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{ background: "rgba(255,255,255,0.15)", padding: "0.4rem", borderRadius: "8px", color: "white", flexShrink: 0 }}>
              <Clock size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.85rem", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              Horas Trabalhadas
            </span>
          </div>
          
          <div style={{ fontSize: "2.2rem", fontWeight: 900, lineHeight: 1.1 }}>
            {overview.totalHHT > 0 ? `${fmtNumber(overview.totalHHT)} h` : "0,00 h"}
          </div>
          
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem", opacity: 0.85, display: "flex", justifyContent: "space-between", whiteSpace: "nowrap" }}>
            <span>{overview.totalHHT > 0 ? "Horas Trabalhadas (HH)" : "Nenhum registro de HHT"}</span>
            <span>Exercício {selectedYear}</span>
          </div>
        </div>

        {/* Severidade / Dias por Acidente */}
        <div className="panel-premium">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{ background: "rgba(245, 158, 11, 0.15)", color: "#D97706", padding: "0.4rem", borderRadius: "8px", flexShrink: 0 }}>
              <TrendingUp size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              Média Afastamento
            </span>
          </div>
          
          <div style={{ fontSize: "2.8rem", fontWeight: 900, lineHeight: 1, color: "var(--text)" }}>
            {overview.totalAccidents > 0 ? fmtNumber(overview.totalLostDays / overview.totalAccidents, 1) : "0,0"}
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)", marginLeft: "0.3rem" }}>dias/acd</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            <span>Período: <strong>{overview.monthlyRecords.length} meses</strong></span>
            <span>Severidade Média</span>
          </div>
        </div>

      </div>

      {/* Síntese Executiva de Segurança do Trabalho - Banner Premium Ilustrado */}
      <div 
        className="panel-premium" 
        style={{ 
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 55%, #FEF2F2 100%)", 
          borderLeft: "6px solid var(--primary)",
          borderTop: "1px solid #F1F5F9",
          borderRight: "1px solid #E2E8F0",
          borderBottom: "1px solid #E2E8F0",
          padding: "1.5rem 2rem",
          borderRadius: "16px",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.02)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Marca d'água decorativa ilustrada de engenharia */}
        <div style={{
          position: "absolute",
          right: "-20px",
          bottom: "-30px",
          opacity: 0.035,
          pointerEvents: "none",
          transform: "rotate(-10deg)"
        }}>
          <ShieldCheck size={220} color="var(--primary)" />
        </div>

        {/* Cabeçalho do Banner com Ícone 3D e Tags */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ 
              background: "linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)", 
              color: "white", 
              padding: "0.75rem", 
              borderRadius: "14px", 
              boxShadow: "0 6px 16px rgba(185, 28, 28, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldCheck size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                <span style={{ 
                  fontSize: "0.68rem", 
                  fontWeight: 900, 
                  letterSpacing: "0.8px", 
                  color: "#B91C1C", 
                  textTransform: "uppercase",
                  background: "rgba(185, 28, 28, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "4px"
                }}>
                  PARECER TÉCNICO REGULAMENTAR
                </span>
                <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>•</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>NBR 14280 / OIT</span>
              </div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", letterSpacing: "-0.3px" }}>
                Síntese Executiva de Segurança do Trabalho
              </h2>
            </div>
          </div>

          {/* Badges de Status Executivo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <span style={{ 
              background: "#0F172A", 
              color: "white", 
              padding: "0.35rem 0.85rem", 
              borderRadius: "9999px", 
              fontSize: "0.75rem", 
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)"
            }}>
              <Calendar size={13} />
              Exercício {selectedYear}
            </span>

            {overview.totalHHT <= 0 ? (
              <span style={{ 
                background: "rgba(100, 116, 139, 0.12)", 
                color: "#64748B", 
                border: "1px solid rgba(100, 116, 139, 0.25)", 
                padding: "0.35rem 0.85rem", 
                borderRadius: "9999px", 
                fontSize: "0.75rem", 
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <AlertCircle size={14} />
                Base de HHT Não Cadastrada
              </span>
            ) : overview.overallFrequencyRate <= 20 && overview.overallSeverityRate <= 500 ? (
              <span style={{ 
                background: "rgba(16, 185, 129, 0.12)", 
                color: "#059669", 
                border: "1px solid rgba(16, 185, 129, 0.3)", 
                padding: "0.35rem 0.85rem", 
                borderRadius: "9999px", 
                fontSize: "0.75rem", 
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <CheckCircle2 size={14} />
                Metas OIT em Conformidade
              </span>
            ) : (
              <span style={{ 
                background: "rgba(245, 158, 11, 0.12)", 
                color: "#D97706", 
                border: "1px solid rgba(245, 158, 11, 0.3)", 
                padding: "0.35rem 0.85rem", 
                borderRadius: "9999px", 
                fontSize: "0.75rem", 
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Target size={14} />
                Foco em Mitigação de Riscos
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo: Narrativa Técnica + Cards de Destaque Rápido */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.75rem", alignItems: "center", position: "relative", zIndex: 1 }}>
          
          {/* Lado Esquerdo: Texto da Síntese com Chaves Ilustradas */}
          <div>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.65, color: "#334155", margin: "0 0 1rem 0" }}>
              {storyText}
            </p>
            
            {/* Chips de Destaque dos Parâmetros Regulamentares */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                background: "white", 
                border: "1px solid #E2E8F0", 
                padding: "0.35rem 0.75rem", 
                borderRadius: "8px", 
                fontSize: "0.78rem", 
                color: "#475569",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}>
                <Clock size={14} color="#0F172A" />
                <span>Base HH: <strong style={{ color: "#0F172A" }}>{fmtNumber(overview.totalHHT)} h</strong></span>
              </div>

              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                background: "white", 
                border: "1px solid #E2E8F0", 
                padding: "0.35rem 0.75rem", 
                borderRadius: "8px", 
                fontSize: "0.78rem", 
                color: "#475569",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}>
                <Gauge size={14} color="var(--primary)" />
                <span>Acidentados (N): <strong style={{ color: "var(--primary)" }}>{overview.totalAccidents}</strong></span>
              </div>

              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                background: "white", 
                border: "1px solid #E2E8F0", 
                padding: "0.35rem 0.75rem", 
                borderRadius: "8px", 
                fontSize: "0.78rem", 
                color: "#475569",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}>
                <Activity size={14} color="#0284C7" />
                <span>Dias Perdidos (T): <strong style={{ color: "#0284C7" }}>{overview.totalLostDays}</strong></span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Dois Mini-Cards Executivos de Performance OIT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            
            {/* Box Frequência */}
            <div style={{ 
              background: "white", 
              border: "1.5px solid #E2E8F0", 
              borderRadius: "12px", 
              padding: "0.85rem 1rem", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              position: "relative"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Frequência (F)</span>
                <span style={{ 
                  fontSize: "0.68rem", 
                  fontWeight: 900, 
                  padding: "1px 6px", 
                  borderRadius: "4px",
                  color: getStatusColor(overview.overallFrequencyStatus),
                  background: getStatusBg(overview.overallFrequencyStatus)
                }}>
                  {overview.overallFrequencyStatus}
                </span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                {overview.totalHHT > 0 ? fmtNumber(overview.overallFrequencyRate) : "—"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "0.35rem", fontWeight: 600 }}>
                {overview.totalHHT > 0 ? "Meta OIT: F ≤ 20,00" : "HHT não cadastrado"}
              </div>
            </div>

            {/* Box Gravidade */}
            <div style={{ 
              background: "white", 
              border: "1.5px solid #E2E8F0", 
              borderRadius: "12px", 
              padding: "0.85rem 1rem", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              position: "relative"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Gravidade (G)</span>
                <span style={{ 
                  fontSize: "0.68rem", 
                  fontWeight: 900, 
                  padding: "1px 6px", 
                  borderRadius: "4px", 
                  color: getStatusColor(overview.overallSeverityStatus),
                  background: getStatusBg(overview.overallSeverityStatus)
                }}>
                  {overview.overallSeverityStatus}
                </span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                {overview.totalHHT > 0 ? fmtNumber(overview.overallSeverityRate) : "—"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "0.35rem", fontWeight: 600 }}>
                {overview.totalHHT > 0 ? "Meta OIT: G ≤ 500,00" : "HHT não cadastrado"}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Charts Section: Monthly F and G - Perfect Symmetry and Alignment */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "stretch" }}>
        
        {/* F Chart Card */}
        <div className="panel-premium" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          
          {/* Header F: 2 linhas alinhadas sem quebra indevida */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1.25rem", minHeight: "68px" }}>
            {/* Linha 1: Título e Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", margin: 0, whiteSpace: "nowrap" }}>
                {fViewMode === "monthly" ? "Frequência Mensal (F)" : "Ranking de Frequência"}
              </h3>

              {/* Toggle Switch */}
              <div style={{ 
                display: "flex", 
                background: "#F1F5F9", 
                padding: "3px", 
                borderRadius: "8px", 
                border: "1px solid #E2E8F0",
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => setFViewMode("monthly")}
                  style={{
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: fViewMode === "monthly" ? "white" : "transparent",
                    color: fViewMode === "monthly" ? "var(--primary)" : "#64748B",
                    boxShadow: fViewMode === "monthly" ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Calendar size={13} />
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setFViewMode("ranking")}
                  style={{
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: fViewMode === "ranking" ? "var(--primary)" : "transparent",
                    color: fViewMode === "ranking" ? "white" : "#64748B",
                    boxShadow: fViewMode === "ranking" ? "0 2px 4px rgba(185,28,28,0.25)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Building2 size={13} />
                  Ranking Empresas
                </button>
              </div>
            </div>

            {/* Linha 2: Subtítulo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fViewMode === "monthly" 
                  ? `Acidentados por milhão de horas trabalhadas (${selectedYear})` 
                  : `Unidades com maior frequência acumulada (${selectedYear})`}
              </p>
            </div>
          </div>

          {/* Área do Gráfico: Altura Rigorosamente Fixa (285px) em Ambos os Modos */}
          <div style={{ height: "285px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {overview.totalHHT === 0 ? (
              <div style={{ height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8FAFC", borderRadius: "10px", border: "1px dashed #CBD5E1", padding: "1.5rem", textAlign: "center" }}>
                <AlertCircle size={32} color="#94A3B8" style={{ marginBottom: "0.5rem" }} />
                <span style={{ fontWeight: 800, color: "#475569", fontSize: "0.9rem" }}>Sem Horas Trabalhadas (HHT) em {selectedYear}</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B", maxWidth: "340px", marginTop: "4px" }}>
                  A NBR 14280 exige o registro de HHT para calcular a Taxa de Frequência. Cadastre a base de HHT de {selectedYear} para visualizar este gráfico.
                </span>
              </div>
            ) : fViewMode === "monthly" ? (
              <div style={{ height: 260, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.monthlyRecords} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<FrequencyCustomTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.6)" }} />
                    <Bar dataKey="frequencyRate" radius={[6, 6, 0, 0]}>
                      {overview.monthlyRecords.map((entry, index) => (
                        <Cell key={`f-cell-${index}`} fill={getFrequencyRateColor(entry.frequencyRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden", paddingBottom: "6px" }}>
                <div style={{ minWidth: "960px", height: 260 }}>
                  <BarChart width={960} height={260} data={fUnitRanking} margin={{ top: 20, right: 15, left: -20, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#475569" }} 
                      axisLine={{ stroke: "#E2E8F0" }} 
                      tickLine={false} 
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<UnitFrequencyCustomTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.6)" }} />
                    <Bar dataKey="frequencyRate" radius={[6, 6, 0, 0]} barSize={28}>
                      {fUnitRanking.map((entry, index) => (
                        <Cell key={`f-rank-cell-${index}`} fill={getFrequencyRateColor(entry.frequencyRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
            )}

            {/* Linha de rodapé do gráfico com altura fixa garantida para manter paridade */}
            <div style={{ height: "20px", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "#64748B", marginTop: "0.25rem" }}>
              {fViewMode === "monthly" ? (
                <span>📅 Distribuição cronológica mensal ({selectedYear})</span>
              ) : (
                <>
                  <span>↔️ Role horizontalmente para ver todas as 16 empresas</span>
                  <span>•</span>
                  <span>Ordenado da maior taxa para a menor</span>
                </>
              )}
            </div>
          </div>

          {/* Caixa Explicativa NBR 14280 / OIT - Frequência */}
          <div style={{ 
            marginTop: "1.25rem", 
            padding: "1.15rem 1.25rem", 
            background: "#F8FAFC", 
            borderRadius: "12px", 
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #10B981",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 900, fontSize: "0.85rem", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TAXA DE FREQUÊNCIA (TF) • NBR 14280
                </span>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#059669", background: "#ECFDF5", padding: "2px 8px", borderRadius: "6px", border: "1px solid #A7F3D0" }}>
                  Fórmula NBR 14280
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#475569", lineHeight: 1.4 }}>
                Número de acidentados por milhão de horas trabalhadas de exposição ao risco (HHT):
              </p>
            </div>

            {/* Fórmula em destaque */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "0.45rem 1rem", 
              background: "white", 
              border: "1px solid #CBD5E1", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
            }}>
              <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "0.92rem", color: "#0F172A" }}>
                TF = (Nº acidentes × 1.000.000) / HHT
              </span>
              <span style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                HHT = Coluna HH
              </span>
            </div>

            {/* Parâmetros e Gradações */}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", marginBottom: "0.35rem", letterSpacing: "0.3px" }}>
                Parâmetros e Limites de Graduação:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.72rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>Até 20,00</span>
                  <span style={{ fontWeight: 800, color: "#10B981", background: "#ECFDF5", padding: "1px 6px", borderRadius: "4px" }}>Muito bom (Verde)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>20,1 a 40,0</span>
                  <span style={{ fontWeight: 800, color: "#10B981", background: "#ECFDF5", padding: "1px 6px", borderRadius: "4px" }}>Bom (Verde)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>40,1 a 60,0</span>
                  <span style={{ fontWeight: 800, color: "#D97706", background: "#FEFCE8", padding: "1px 6px", borderRadius: "4px" }}>Ruim (Amarelo)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>Acima de 60,0</span>
                  <span style={{ fontWeight: 800, color: "#EF4444", background: "#FEF2F2", padding: "1px 6px", borderRadius: "4px" }}>Péssima (Vermelho)</span>
                </div>
              </div>
            </div>

            {/* Nota Técnica NBR 14280 */}
            <div style={{ fontSize: "0.7rem", color: "#64748B", lineHeight: 1.4, borderTop: "1px solid #E2E8F0", paddingTop: "0.45rem" }}>
              <strong>Nota Técnica NBR 14280:</strong> Recomenda que os acidentes de trabalho com e sem afastamento não sejam calculados juntos. Em caso de cálculo agregado com dias sem afastamento: <em>TF = (Nº c/ afastamento + Nº s/ afastamento) × 1.000.000 / HHT</em>.
            </div>
          </div>
        </div>

        {/* G Chart Card */}
        <div className="panel-premium" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          
          {/* Header G: 2 linhas alinhadas sem quebra indevida */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1.25rem", minHeight: "68px" }}>
            {/* Linha 1: Título e Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", margin: 0, whiteSpace: "nowrap" }}>
                {gViewMode === "monthly" ? "Gravidade Mensal (G)" : "Ranking de Gravidade"}
              </h3>

              {/* Toggle Switch */}
              <div style={{ 
                display: "flex", 
                background: "#F1F5F9", 
                padding: "3px", 
                borderRadius: "8px", 
                border: "1px solid #E2E8F0",
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => setGViewMode("monthly")}
                  style={{
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: gViewMode === "monthly" ? "white" : "transparent",
                    color: gViewMode === "monthly" ? "#0284C7" : "#64748B",
                    boxShadow: gViewMode === "monthly" ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Calendar size={13} />
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setGViewMode("ranking")}
                  style={{
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: gViewMode === "ranking" ? "#0284C7" : "transparent",
                    color: gViewMode === "ranking" ? "white" : "#64748B",
                    boxShadow: gViewMode === "ranking" ? "0 2px 4px rgba(2,132,199,0.25)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Building2 size={13} />
                  Ranking Empresas
                </button>
              </div>
            </div>

            {/* Linha 2: Subtítulo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {gViewMode === "monthly" 
                  ? `Dias computados por milhão de horas trabalhadas (${selectedYear})` 
                  : `Unidades com maior gravidade acumulada (${selectedYear})`}
              </p>
            </div>
          </div>

          {/* Área do Gráfico: Altura Rigorosamente Fixa (285px) em Ambos os Modos */}
          <div style={{ height: "285px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {overview.totalHHT === 0 ? (
              <div style={{ height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8FAFC", borderRadius: "10px", border: "1px dashed #CBD5E1", padding: "1.5rem", textAlign: "center" }}>
                <AlertCircle size={32} color="#94A3B8" style={{ marginBottom: "0.5rem" }} />
                <span style={{ fontWeight: 800, color: "#475569", fontSize: "0.9rem" }}>Sem Horas Trabalhadas (HHT) em {selectedYear}</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B", maxWidth: "340px", marginTop: "4px" }}>
                  A NBR 14280 exige o registro de HHT para calcular a Taxa de Gravidade. Cadastre a base de HHT de {selectedYear} para visualizar este gráfico.
                </span>
              </div>
            ) : gViewMode === "monthly" ? (
              <div style={{ height: 260, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.monthlyRecords} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<SeverityCustomTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.6)" }} />
                    <Bar dataKey="severityRate" radius={[6, 6, 0, 0]}>
                      {overview.monthlyRecords.map((entry, index) => (
                        <Cell key={`g-cell-${index}`} fill={getSeverityRateColor(entry.severityRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden", paddingBottom: "6px" }}>
                <div style={{ minWidth: "960px", height: 260 }}>
                  <BarChart width={960} height={260} data={gUnitRanking} margin={{ top: 20, right: 15, left: -10, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#475569" }} 
                      axisLine={{ stroke: "#E2E8F0" }} 
                      tickLine={false} 
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<UnitSeverityCustomTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.6)" }} />
                    <Bar dataKey="severityRate" radius={[6, 6, 0, 0]} barSize={28}>
                      {gUnitRanking.map((entry, index) => (
                        <Cell key={`g-rank-cell-${index}`} fill={getSeverityRateColor(entry.severityRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
            )}

            {/* Linha de rodapé do gráfico com altura fixa garantida para manter paridade */}
            <div style={{ height: "20px", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "#64748B", marginTop: "0.25rem" }}>
              {gViewMode === "monthly" ? (
                <span>📅 Distribuição cronológica mensal ({selectedYear})</span>
              ) : (
                <>
                  <span>↔️ Role horizontalmente para ver todas as 16 empresas</span>
                  <span>•</span>
                  <span>Ordenado da maior gravidade para a menor</span>
                </>
              )}
            </div>
          </div>

          {/* Caixa Explicativa NBR 14280 / OIT - Gravidade */}
          <div style={{ 
            marginTop: "1.25rem", 
            padding: "1.15rem 1.25rem", 
            background: "#F8FAFC", 
            borderRadius: "12px", 
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #0284C7",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 900, fontSize: "0.85rem", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TAXA DE GRAVIDADE (TG) • NBR 14280
                </span>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#0369A1", background: "#F0F9FF", padding: "2px 8px", borderRadius: "6px", border: "1px solid #BAE6FD" }}>
                  Fórmula NBR 14280
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#475569", lineHeight: 1.4 }}>
                Tempo computado (dias perdidos + dias debitados) por milhão de horas de exposição (HHT):
              </p>
            </div>

            {/* Fórmula em destaque */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "0.45rem 1rem", 
              background: "white", 
              border: "1px solid #CBD5E1", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
            }}>
              <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "0.92rem", color: "#0F172A" }}>
                TG = (Nº dias perdidos + dias debitados) × 1.000.000 / HHT
              </span>
              <span style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                HHT = Coluna HH
              </span>
            </div>

            {/* Parâmetros e Gradações */}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", marginBottom: "0.35rem", letterSpacing: "0.3px" }}>
                Parâmetros e Limites de Graduação:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.72rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>Até 500,00</span>
                  <span style={{ fontWeight: 800, color: "#10B981", background: "#ECFDF5", padding: "1px 6px", borderRadius: "4px" }}>Muito bom (Verde)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>500,1 a 1.000,0</span>
                  <span style={{ fontWeight: 800, color: "#10B981", background: "#ECFDF5", padding: "1px 6px", borderRadius: "4px" }}>Bom (Verde)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>1.000,1 a 2.000,0</span>
                  <span style={{ fontWeight: 800, color: "#D97706", background: "#FEFCE8", padding: "1px 6px", borderRadius: "4px" }}>Ruim (Amarelo)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#475569" }}>Acima de 2.000,0</span>
                  <span style={{ fontWeight: 800, color: "#EF4444", background: "#FEF2F2", padding: "1px 6px", borderRadius: "4px" }}>Péssima (Vermelho)</span>
                </div>
              </div>
            </div>

            {/* Nota Técnica NBR 14280 */}
            <div style={{ fontSize: "0.7rem", color: "#64748B", lineHeight: 1.4, borderTop: "1px solid #E2E8F0", paddingTop: "0.45rem" }}>
              <strong>Nota Técnica NBR 14280:</strong> Cada incapacidade permanente ou óbito gera débito normativo de dias (ex: morte = 6.000 dias, perda da mão = 3.000 dias).
            </div>
          </div>
        </div>

      </div>

      {/* Monthly Detailed Table */}
      <div className="panel-premium" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)" }}>Estudo por Mês ({selectedYear} • NBR 14280 / OIT)</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Fórmulas ponderadas oficiais: F = (N × 1.000.000) / HH e G = (T × 1.000.000) / HH
            </p>
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0284C7", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "0.3rem 0.75rem", borderRadius: "6px" }}>
            * Base oficial: Campo "HH" das planilhas mensais
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0", color: "#475569", fontWeight: 800 }}>
                <th style={{ padding: "0.75rem 1rem" }}>Mês / {selectedYear}</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Acidentados (N)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Horas Trabalhadas - HH (h)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Dias Computados (T)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Frequência (F)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Classif. F</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Gravidade (G)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Classif. G</th>
              </tr>
            </thead>
            <tbody>
              {overview.monthlyRecords.map((row, idx) => (
                <tr 
                  key={row.month} 
                  style={{ 
                    borderBottom: "1px solid #F1F5F9",
                    background: idx % 2 === 0 ? "white" : "#FAFAFA"
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--text)" }}>{row.monthName}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 700 }}>{row.accidents}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: row.hht > 0 ? "#0284C7" : "var(--text-muted)" }}>
                    {row.hht > 0 ? fmtNumber(row.hht) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 700 }}>{row.lostDays}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 800, color: row.hht > 0 ? getStatusColor(row.frequencyStatus) : "var(--text-muted)" }}>
                    {row.hht > 0 ? fmtNumber(row.frequencyRate) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <span style={{ 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "4px", 
                      fontSize: "0.75rem", 
                      fontWeight: 800,
                      color: getStatusColor(row.frequencyStatus),
                      background: getStatusBg(row.frequencyStatus)
                    }}>
                      {row.frequencyStatus}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 800, color: row.hht > 0 ? getStatusColor(row.severityStatus) : "var(--text-muted)" }}>
                    {row.hht > 0 ? fmtNumber(row.severityRate) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <span style={{ 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "4px", 
                      fontSize: "0.75rem", 
                      fontWeight: 800,
                      color: getStatusColor(row.severityStatus),
                      background: getStatusBg(row.severityStatus)
                    }}>
                      {row.severityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#0F172A", color: "white", fontWeight: 900, borderTop: "2px solid #334155" }}>
                <td style={{ padding: "0.85rem 1rem", letterSpacing: "0.5px" }}>TOTAL ACUMULADO (NBR 14280)</td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>{overview.totalAccidents}</td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontFamily: "monospace", color: overview.totalHHT > 0 ? "#38BDF8" : "#94A3B8" }}>
                  {overview.totalHHT > 0 ? fmtNumber(overview.totalHHT) : "—"}
                </td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>{overview.totalLostDays}</td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "right", color: overview.totalHHT > 0 ? "#38BDF8" : "#94A3B8" }}>
                  {overview.totalHHT > 0 ? fmtNumber(overview.overallFrequencyRate) : "—"}
                </td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                  <span style={{ 
                    padding: "0.2rem 0.6rem", 
                    borderRadius: "4px", 
                    fontSize: "0.75rem", 
                    fontWeight: 900,
                    color: getStatusColor(overview.overallFrequencyStatus),
                    background: "rgba(255,255,255,0.15)"
                  }}>
                    {overview.overallFrequencyStatus}
                  </span>
                </td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "right", color: overview.totalHHT > 0 ? "#38BDF8" : "#94A3B8" }}>
                  {overview.totalHHT > 0 ? fmtNumber(overview.overallSeverityRate) : "—"}
                </td>
                <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                  <span style={{ 
                    padding: "0.2rem 0.6rem", 
                    borderRadius: "4px", 
                    fontSize: "0.75rem", 
                    fontWeight: 900,
                    color: getStatusColor(overview.overallSeverityStatus),
                    background: "rgba(255,255,255,0.15)"
                  }}>
                    {overview.overallSeverityStatus}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Unit Breakdown Table */}
      <div className="panel-premium" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)" }}>Estudo por Unidade de Negócio ({selectedYear})</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Acompanhamento detalhado por Unidade ({activeUnitsList.length} unidades ativas{groupingConfig.groupMatrizCarbono ? ", com AÇOTUBO - Carbono e Matriz agrupadas" : ", com Matriz e Carbono independentes"})
            </p>
          </div>
          <div style={{ fontSize: "0.8rem", color: overview.totalHHT > 0 ? "#0284C7" : "#64748B", fontWeight: 800, background: overview.totalHHT > 0 ? "#F0F9FF" : "#F8FAFC", border: `1px solid ${overview.totalHHT > 0 ? "#BAE6FD" : "#E2E8F0"}`, padding: "0.3rem 0.75rem", borderRadius: "6px" }}>
            Horas Trabalhadas (HH): {overview.totalHHT > 0 ? `${fmtNumber(overview.totalHHT)} h` : "Sem HHT cadastrado"}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--surface)" }}>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "var(--text)" }}>Unidade de Negócio</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 800, color: "var(--text)" }}>Acidentados (N)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 800, color: "#0284C7" }}>Horas Trabalhadas - HH (h)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 800, color: "var(--text)" }}>Dias Perdidos (T)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 800, color: "var(--text)" }}>Frequência (F)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 800, color: "var(--text)" }}>Classificação F</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 800, color: "var(--text)" }}>Gravidade (G)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 800, color: "var(--text)" }}>Classificação G</th>
              </tr>
            </thead>
            <tbody>
              {overview.unitRecords.map(unit => (
                <tr 
                  key={unit.unitName}
                  style={{ 
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.15s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--text)" }}>{unit.unitName}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 700 }}>{unit.accidents}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: unit.hht > 0 ? "#0284C7" : "var(--text-muted)" }}>
                    {unit.hht > 0 ? fmtNumber(unit.hht) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 700 }}>{unit.lostDays}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 800, color: unit.hht > 0 ? getStatusColor(unit.frequencyStatus) : "var(--text-muted)" }}>
                    {unit.hht > 0 ? fmtNumber(unit.frequencyRate) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <span style={{ 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "4px", 
                      fontSize: "0.75rem", 
                      fontWeight: 800,
                      color: getStatusColor(unit.frequencyStatus),
                      background: getStatusBg(unit.frequencyStatus)
                    }}>
                      {unit.frequencyStatus}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 800, color: unit.hht > 0 ? getStatusColor(unit.severityStatus) : "var(--text-muted)" }}>
                    {unit.hht > 0 ? fmtNumber(unit.severityRate) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <span style={{ 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "4px", 
                      fontSize: "0.75rem", 
                      fontWeight: 800,
                      color: getStatusColor(unit.severityStatus),
                      background: getStatusBg(unit.severityStatus)
                    }}>
                      {unit.severityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Configuração de Agrupamento de Unidades */}
      <UnitGroupingModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={groupingConfig}
        onSave={handleSaveGroupingConfig}
      />

    </motion.div>
  );
};
