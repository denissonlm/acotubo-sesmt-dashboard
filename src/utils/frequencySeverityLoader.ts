import * as XLSX from "xlsx";
import type { 
  Accident, 
  MonthlyRateRecord, 
  UnitRateRecord, 
  FrequencySeverityOverview, 
  OITClassification 
} from "../types";
import defaultHHTStoreRaw from "./hhtStore.json";

export interface HHTUnitEntry {
  horas: number;      // Coluna Total das planilhas (horas de ausência/desvios: faltas, atestados)
  previsto: number;   // Coluna Previsto das planilhas (escala planejada)
  hhCol?: number;     // Coluna HH das planilhas (Horas-Homem Trabalhadas efetivas)
}

export interface HHTMonthEntry {
  month: number;
  year: number;
  totalHoras: number;    // Soma da coluna Total (ausências/desvios)
  totalPrevisto: number; // Soma da coluna Previsto (escala planejada)
  totalHH?: number;      // Soma da coluna HH (Horas-Homem Trabalhadas efetivas)
  units: Record<string, HHTUnitEntry>;
}

export type MultiYearHHTStore = Record<number, Record<number, HHTMonthEntry>>;

const LOCAL_STORAGE_KEY = "acotubo_sesmt_hht_store_v4";

export const DEFAULT_HHT_STORE: MultiYearHHTStore = defaultHHTStoreRaw as unknown as MultiYearHHTStore;

// 16 Unidades oficiais da fonte (AÇOTUBO - Carbono e Matriz unificadas)
export const SOURCE_UNITS = [
  "Açocred",
  "AÇOTUBO - Canoas",
  "AÇOTUBO - Carbono",
  "AÇOTUBO - Caxias do Sul",
  "AÇOTUBO - Conexões",
  "AÇOTUBO - Curitiba",
  "AÇOTUBO - Inox",
  "AÇOTUBO - Joinville",
  "AÇOTUBO - Maringá",
  "AÇOTUBO - Minas Gerais",
  "AÇOTUBO - Piracicaba",
  "AÇOTUBO - Rio de Janeiro",
  "AÇOTUBO - Sertãozinho",
  "AÇOTUBO - Soluções Integradas",
  "Bassi",
  "Incotep"
];

const MONTH_NAMES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/**
 * Carrega a base de HHT mesclando a base nativa com o LocalStorage,
 * assegurando que qualquer ocorrência de Matriz seja unificada em Carbono.
 */
export const loadHHTStore = (): MultiYearHHTStore => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as MultiYearHHTStore;
      const merged: MultiYearHHTStore = JSON.parse(JSON.stringify(DEFAULT_HHT_STORE));
      
      Object.keys(parsed).forEach(yStr => {
        const y = Number(yStr);
        if (!merged[y]) merged[y] = {};
        
        Object.keys(parsed[y]).forEach(mStr => {
          const m = Number(mStr);
          const entry = parsed[y][m];
          if (entry && entry.units) {
            // Unificação preventiva de Matriz em Carbono caso venha de cache legado
            if (entry.units["AÇOTUBO - Matriz"]) {
              const mtz = entry.units["AÇOTUBO - Matriz"];
              delete entry.units["AÇOTUBO - Matriz"];
              if (!entry.units["AÇOTUBO - Carbono"]) {
                entry.units["AÇOTUBO - Carbono"] = mtz;
              } else {
                entry.units["AÇOTUBO - Carbono"].horas += mtz.horas;
                entry.units["AÇOTUBO - Carbono"].previsto += mtz.previsto;
                entry.units["AÇOTUBO - Carbono"].hhCol = (entry.units["AÇOTUBO - Carbono"].hhCol || 0) + (mtz.hhCol || (mtz.previsto - mtz.horas));
              }
            }
            if (entry.totalHH === undefined) {
              entry.totalHH = entry.totalPrevisto - entry.totalHoras;
            }
            Object.values(entry.units).forEach(u => {
              if (u.hhCol === undefined) {
                u.hhCol = u.previsto - u.horas;
              }
            });
          }
          merged[y][m] = entry;
        });
      });
      return merged;
    }
  } catch (err) {
    console.warn("Erro ao carregar HHT do localStorage:", err);
  }
  return DEFAULT_HHT_STORE;
};

/**
 * Salva a base completa no LocalStorage
 */
export const saveHHTStoreToLocalStorage = (store: MultiYearHHTStore): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error("Erro ao salvar HHT no localStorage:", err);
  }
};

/**
 * Reseta o LocalStorage para a base original
 */
export const resetHHTStoreLocalStorage = (): MultiYearHHTStore => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem("acotubo_sesmt_hht_store_v3");
    localStorage.removeItem("acotubo_sesmt_hht_store_v2");
  } catch (err) {
    console.warn("Erro ao limpar localStorage:", err);
  }
  return DEFAULT_HHT_STORE;
};

export const getFrequencyStatus = (f: number): OITClassification => {
  if (f <= 0) return "MUITO BOA";
  if (f <= 20) return "MUITO BOA";
  if (f <= 40) return "BOA";
  if (f <= 60) return "RUIM";
  return "PÉSSIMA";
};

export const getSeverityStatus = (g: number): OITClassification => {
  if (g <= 0) return "MUITO BOA";
  if (g <= 500) return "MUITO BOA";
  if (g <= 1000) return "BOA";
  if (g <= 2000) return "RUIM";
  return "PÉSSIMA";
};

export const getFrequencyRateColor = (f: number): string => {
  if (f <= 20) return "#10B981"; // Muito Boa (Verde)
  if (f <= 40) return "#10B981"; // Boa (Verde também)
  if (f <= 60) return "#EAB308"; // Ruim (Amarelo)
  return "#EF4444";              // Péssima (Vermelho)
};

export const getSeverityRateColor = (g: number): string => {
  if (g <= 500) return "#10B981";  // Muito Boa (Verde)
  if (g <= 1000) return "#10B981"; // Boa (Verde também)
  if (g <= 2000) return "#EAB308"; // Ruim (Amarelo)
  return "#EF4444";               // Péssima (Vermelho)
};

export const getClassificationColor = (status: OITClassification | string): string => {
  switch (status) {
    case "MUITO BOA":
    case "MUITO BOM":
      return "#10B981"; // Verde
    case "BOA":
    case "BOM":
      return "#10B981"; // Verde também
    case "RUIM":
    case "REGULAR":
      return "#EAB308"; // Amarelo
    case "PÉSSIMA":
    case "PÉSSIMO":
      return "#EF4444"; // Vermelho
    default:
      return "#64748B";
  }
};

export const getClassificationBg = (status: OITClassification | string): string => {
  switch (status) {
    case "MUITO BOA":
    case "MUITO BOM":
      return "rgba(16, 185, 129, 0.12)";
    case "BOA":
    case "BOM":
      return "rgba(16, 185, 129, 0.12)";
    case "RUIM":
    case "REGULAR":
      return "rgba(234, 179, 8, 0.15)";
    case "PÉSSIMA":
    case "PÉSSIMO":
      return "rgba(239, 68, 68, 0.15)";
    default:
      return "rgba(100, 116, 139, 0.12)";
  }
};

/**
 * TAXA DE FREQUÊNCIA (F)
 * F = (N x 1.000.000) / H
 * N = Número de acidentados
 * H = Horas-Homem de exposição ao risco
 */
export const calculateF = (n: number, h: number): number => {
  if (h <= 0) return 0;
  return Number(((n * 1_000_000) / h).toFixed(2));
};

export const calculateTF = calculateF;

/**
 * TAXA DE GRAVIDADE (G)
 * G = (T x 1.000.000) / H
 * T = Tempo computado (dias de afastamento nos acidentes com afastamento)
 * H = Horas-Homem de exposição ao risco
 */
export const calculateG = (t: number, h: number): number => {
  if (h <= 0) return 0;
  return Number(((t * 1_000_000) / h).toFixed(2));
};

export const calculateTG = calculateG;

/**
 * Mapeia a divisão e área do acidente para as 16 unidades de fonte.
 * AÇOTUBO - Carbono e Matriz são unificadas como "AÇOTUBO - Carbono".
 */
export const matchAccidentToSourceUnit = (accidentDivision: string, accidentArea?: string): string => {
  const normDiv = (accidentDivision || "").trim().toLowerCase();
  const normArea = (accidentArea || "").trim().toLowerCase();

  if (normDiv.includes("canoas")) return "AÇOTUBO - Canoas";
  if (normDiv.includes("cxs") || normDiv.includes("caxias")) return "AÇOTUBO - Caxias do Sul";
  if (normDiv.includes("joinville")) return "AÇOTUBO - Joinville";
  if (normDiv.includes("soluções") || normDiv.includes("solucoes")) return "AÇOTUBO - Soluções Integradas";
  if (normDiv.includes("bassi")) return "Bassi";
  if (normDiv.includes("incotep")) return "Incotep";

  if (normDiv.includes("artex")) {
    return "AÇOTUBO - Inox";
  }

  // Carbono e Matriz unificados em AÇOTUBO - Carbono
  if (normDiv.includes("gru") || normDiv.includes("matriz") || normDiv.includes("carbono") || normDiv.includes("tubo")) {
    if (normArea.includes("inox")) return "AÇOTUBO - Inox";
    if (normArea.includes("conexo") || normArea.includes("conexões")) return "AÇOTUBO - Conexões";
    return "AÇOTUBO - Carbono";
  }

  if (normDiv.includes("curitiba")) return "AÇOTUBO - Curitiba";
  if (normDiv.includes("minas") || normDiv.includes(" mg")) return "AÇOTUBO - Minas Gerais";
  if (normDiv.includes("rio") || normDiv.includes(" rj")) return "AÇOTUBO - Rio de Janeiro";
  if (normDiv.includes("sertãozinho") || normDiv.includes("sertaozinho")) return "AÇOTUBO - Sertãozinho";
  if (normDiv.includes("maringá") || normDiv.includes("maringa")) return "AÇOTUBO - Maringá";
  if (normDiv.includes("piracicaba")) return "AÇOTUBO - Piracicaba";
  if (normDiv.includes("açocred") || normDiv.includes("acocred")) return "Açocred";

  return "";
};

/**
 * Processamento principal de Frequência e Gravidade (NBR 14280 / OIT)
 * F = (N x 1.000.000) / H
 * G = (T x 1.000.000) / H
 * H = Horas-Homem Trabalhadas líquidas de exposição ao risco (coluna HH das planilhas: 1.269.610,59 h)
 * NUNCA soma taxas! Fórmulas ponderadas em todos os acumulados.
 */
export const processFrequencyAndSeverity = (
  accidents: Accident[],
  year: number = 2026,
  selectedMonths: number[] = [1, 2, 3, 4, 5, 6, 7, 8],
  filterUnit: string = "ALL",
  multiYearStore?: MultiYearHHTStore
): FrequencySeverityOverview => {
  const store = multiYearStore || loadHHTStore();
  const yearHHT = store[year] || {};

  const yearAccidents = accidents.filter(a => a.year === year && selectedMonths.includes(a.month));

  let totalAccidents = 0;     // N total
  let totalLostDays = 0;      // T total
  let totalHHT = 0;           // H total (Horas-Homem Trabalhadas efetivas - coluna HH)
  let totalPrevisto = 0;      // Horas previstas da escala (coluna Previsto)
  let totalHorasAusencia = 0; // Horas de ausência/desvios (coluna Total)

  const monthlyRecords: MonthlyRateRecord[] = [];

  const sortedMonths = [...selectedMonths].sort((a, b) => a - b);
  sortedMonths.forEach(m => {
    const monthAccidentsList = yearAccidents.filter(a => a.month === m);
    
    let accListFiltered = monthAccidentsList;
    if (filterUnit !== "ALL") {
      accListFiltered = monthAccidentsList.filter(a => {
        const matched = matchAccidentToSourceUnit(a.division, a.area);
        return matched === filterUnit;
      });
    }

    const mN = accListFiltered.length;
    const mT = accListFiltered.reduce((sum, a) => sum + (a.lostDays || 0), 0);

    const monthEntry = yearHHT[m];
    let mH = 0;           // H = Horas Trabalhadas efetivas (coluna HH)
    let mPrevisto = 0;    // Horas da escala (coluna Previsto)
    let mAusencia = 0;    // Horas de ausências/desvios (coluna Total)

    if (monthEntry) {
      if (filterUnit === "ALL") {
        mPrevisto = monthEntry.totalPrevisto || 0;
        mAusencia = monthEntry.totalHoras || 0;
        mH = monthEntry.totalHH !== undefined ? monthEntry.totalHH : (mPrevisto - mAusencia);
      } else {
        const u = monthEntry.units[filterUnit];
        mPrevisto = u?.previsto || 0;
        mAusencia = u?.horas || 0;
        mH = (u?.hhCol !== undefined) ? u.hhCol : (mPrevisto - mAusencia);
      }
    }

    const freqRate = calculateF(mN, mH);
    const sevRate = calculateG(mT, mH);

    monthlyRecords.push({
      month: m,
      monthName: MONTH_NAMES_FULL[m - 1],
      year,
      accidents: mN,
      lostDays: mT,
      hht: mH,
      previsto: mPrevisto,
      horasAusencia: mAusencia,
      frequencyRate: freqRate,
      frequencyStatus: getFrequencyStatus(freqRate),
      severityRate: sevRate,
      severityStatus: getSeverityStatus(sevRate)
    });

    totalAccidents += mN;
    totalLostDays += mT;
    totalHHT += mH;
    totalPrevisto += mPrevisto;
    totalHorasAusencia += mAusencia;
  });

  const overallFrequencyRate = calculateF(totalAccidents, totalHHT);
  const overallSeverityRate = calculateG(totalLostDays, totalHHT);

  // Estudo por Unidade de Negócio (16 unidades de fonte)
  const unitRecords: UnitRateRecord[] = [];

  SOURCE_UNITS.forEach(unitName => {
    let unitH = 0;
    let unitPrevisto = 0;
    let unitAusencia = 0;
    sortedMonths.forEach(m => {
      const u = yearHHT[m]?.units[unitName];
      if (u) {
        unitPrevisto += u.previsto || 0;
        unitAusencia += u.horas || 0;
        unitH += (u.hhCol !== undefined) ? u.hhCol : ((u.previsto || 0) - (u.horas || 0));
      }
    });

    const unitAccidents = yearAccidents.filter(a => {
      const matched = matchAccidentToSourceUnit(a.division, a.area);
      return matched === unitName;
    });

    const uN = unitAccidents.length;
    const uT = unitAccidents.reduce((sum, a) => sum + (a.lostDays || 0), 0);
    const uFreq = calculateF(uN, unitH);
    const uSev = calculateG(uT, unitH);

    unitRecords.push({
      unitName,
      hht: unitH,
      previsto: unitPrevisto,
      horasAusencia: unitAusencia,
      accidents: uN,
      lostDays: uT,
      frequencyRate: uFreq,
      frequencyStatus: getFrequencyStatus(uFreq),
      severityRate: uSev,
      severityStatus: getSeverityStatus(uSev)
    });
  });

  return {
    totalAccidents,
    totalLostDays,
    totalHHT,
    totalPrevisto,
    totalHorasAusencia,
    overallFrequencyRate,
    overallFrequencyStatus: getFrequencyStatus(overallFrequencyRate),
    overallSeverityRate,
    overallSeverityStatus: getSeverityStatus(overallSeverityRate),
    monthlyRecords,
    unitRecords
  };
};

export const generateFrequencySeverityStory = (overview: FrequencySeverityOverview, year: number = 2026): string => {
  const hFormatted = overview.totalHHT.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fFormatted = overview.overallFrequencyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const gFormatted = overview.overallSeverityRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `[Exercício de ${year}]. Com ${hFormatted} Horas Trabalhadas (campo HH), foram registrados ${overview.totalAccidents} acidentado(s) (N) e ${overview.totalLostDays} dia(s) computado(s) de afastamento (T). Segundo a NBR 14280 / OIT, apura-se a Frequência F = ${fFormatted} (${overview.overallFrequencyStatus}) e a Gravidade G = ${gFormatted} (${overview.overallSeverityStatus}).`;
};

/**
 * Lê e analisa arquivos mensais de HHT (.xlsx),
 * unificando automaticamente Matriz em AÇOTUBO - Carbono.
 */
export const parseHHTSpreadsheet = (data: ArrayBuffer, fileName: string): HHTMonthEntry | null => {
  try {
    const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
    const sheetName = workbook.SheetNames.includes("Export") ? "Export" : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return null;

    const rows = XLSX.utils.sheet_to_json(sheet) as any[];
    
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    const parts = cleanName.split(/[._-]/);
    const month = parseInt(parts[0], 10) || 1;
    const year = parseInt(parts[1], 10) || new Date().getFullYear();

    const units: Record<string, HHTUnitEntry> = {};
    let totalPrevisto = 0;
    let totalHoras = 0;
    let totalHH = 0;

    rows.forEach(r => {
      const local = r["Local HH"];
      if (!local || String(local).toLowerCase().includes("filtros")) return;

      let localStr = String(local).trim();
      const previsto = Number(r["Previsto"] || 0);
      const totalCol = Number(r["Total"] || 0);
      const hhCol = Number(r["HH"] !== undefined ? r["HH"] : (previsto - totalCol));

      if (localStr.toLowerCase() === "total") {
        totalPrevisto = previsto;
        totalHoras = totalCol;
        totalHH = hhCol;
      } else {
        // Unificação: Matriz e Carbono são a mesma coisa
        if (localStr.toLowerCase().includes("matriz")) {
          localStr = "AÇOTUBO - Carbono";
        }

        if (!units[localStr]) {
          units[localStr] = {
            horas: totalCol,
            previsto: previsto,
            hhCol: hhCol
          };
        } else {
          units[localStr].horas += totalCol;
          units[localStr].previsto += previsto;
          units[localStr].hhCol = (units[localStr].hhCol || 0) + hhCol;
        }
      }
    });

    if (totalHoras <= 0) {
      totalHoras = Object.values(units).reduce((sum, u) => sum + u.horas, 0);
    }
    if (totalPrevisto <= 0) {
      totalPrevisto = Object.values(units).reduce((sum, u) => sum + u.previsto, 0);
    }
    if (totalHH <= 0) {
      totalHH = Object.values(units).reduce((sum, u) => sum + (u.hhCol || (u.previsto - u.horas)), 0);
    }

    return { month, year, totalHoras, totalPrevisto, totalHH, units };
  } catch (error) {
    console.error("Erro ao processar planilha de HHT:", error);
    return null;
  }
};
