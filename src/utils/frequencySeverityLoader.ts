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

export interface UnitGroupingConfig {
  groupMatrizCarbono: boolean; // default: true (unifica Matriz em Carbono)
  customGroups?: Record<string, string>; // Unidade de Origem -> Unidade de Destino
}

export const DEFAULT_UNIT_GROUPING_CONFIG: UnitGroupingConfig = {
  groupMatrizCarbono: true,
  customGroups: {}
};

export const UNIT_GROUPING_CONFIG_KEY = "acotubo_sesmt_unit_grouping_config_v2";

export const loadUnitGroupingConfig = (): UnitGroupingConfig => {
  try {
    const saved = localStorage.getItem(UNIT_GROUPING_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        groupMatrizCarbono: parsed.groupMatrizCarbono !== undefined ? Boolean(parsed.groupMatrizCarbono) : true,
        customGroups: parsed.customGroups || {}
      };
    }
  } catch (e) {
    console.warn("Erro ao carregar UnitGroupingConfig do localStorage:", e);
  }
  return { ...DEFAULT_UNIT_GROUPING_CONFIG };
};

export const saveUnitGroupingConfig = (config: UnitGroupingConfig): void => {
  try {
    localStorage.setItem(UNIT_GROUPING_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Erro ao salvar UnitGroupingConfig no localStorage:", e);
  }
};

// 16 Unidades oficiais consolidadas (quando Matriz e Carbono estão agrupadas)
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

// 17 Unidades completas (quando Matriz e Carbono operam separadas)
export const ALL_POSSIBLE_UNITS = [
  "Açocred",
  "AÇOTUBO - Canoas",
  "AÇOTUBO - Carbono",
  "AÇOTUBO - Caxias do Sul",
  "AÇOTUBO - Conexões",
  "AÇOTUBO - Curitiba",
  "AÇOTUBO - Inox",
  "AÇOTUBO - Joinville",
  "AÇOTUBO - Maringá",
  "AÇOTUBO - Matriz",
  "AÇOTUBO - Minas Gerais",
  "AÇOTUBO - Piracicaba",
  "AÇOTUBO - Rio de Janeiro",
  "AÇOTUBO - Sertãozinho",
  "AÇOTUBO - Soluções Integradas",
  "Bassi",
  "Incotep"
];

/**
 * Retorna dinamicamente a lista de unidades ativas considerando as regras de agrupamento
 */
export const getUnitsList = (config: UnitGroupingConfig = DEFAULT_UNIT_GROUPING_CONFIG): string[] => {
  let list = config.groupMatrizCarbono ? [...SOURCE_UNITS] : [...ALL_POSSIBLE_UNITS];
  if (config.customGroups && Object.keys(config.customGroups).length > 0) {
    const origins = new Set(Object.keys(config.customGroups));
    list = list.filter(u => !origins.has(u));
  }
  return list;
};

const MONTH_NAMES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/**
 * Aplica as regras de agrupamento configuráveis à base de HHT de forma não destrutiva.
 */
export const applyGroupingToStore = (
  rawStore: MultiYearHHTStore,
  config: UnitGroupingConfig = DEFAULT_UNIT_GROUPING_CONFIG
): MultiYearHHTStore => {
  const cloned: MultiYearHHTStore = JSON.parse(JSON.stringify(rawStore));

  Object.keys(cloned).forEach(yStr => {
    const y = Number(yStr);
    Object.keys(cloned[y]).forEach(mStr => {
      const m = Number(mStr);
      const entry = cloned[y][m];
      if (!entry || !entry.units) return;

      // 1. Agrupamento Matriz -> Carbono
      if (config.groupMatrizCarbono) {
        if (entry.units["AÇOTUBO - Matriz"]) {
          const mtz = entry.units["AÇOTUBO - Matriz"];
          delete entry.units["AÇOTUBO - Matriz"];
          if (!entry.units["AÇOTUBO - Carbono"]) {
            entry.units["AÇOTUBO - Carbono"] = { ...mtz };
          } else {
            entry.units["AÇOTUBO - Carbono"].horas += mtz.horas;
            entry.units["AÇOTUBO - Carbono"].previsto += mtz.previsto;
            entry.units["AÇOTUBO - Carbono"].hhCol = 
              (entry.units["AÇOTUBO - Carbono"].hhCol || 0) + 
              (mtz.hhCol !== undefined ? mtz.hhCol : (mtz.previsto - mtz.horas));
          }
        }
      } else {
        // Se NÃO agrupar, mas o mês 8 veio com Matriz salva em Carbono (ex: cache legado):
        if (y === 2026 && m === 8 && !entry.units["AÇOTUBO - Matriz"] && entry.units["AÇOTUBO - Carbono"]) {
          const carb = entry.units["AÇOTUBO - Carbono"];
          entry.units["AÇOTUBO - Matriz"] = { ...carb };
          delete entry.units["AÇOTUBO - Carbono"];
        }
      }

      // 2. Agrupamentos customizados (Origem -> Destino)
      if (config.customGroups && Object.keys(config.customGroups).length > 0) {
        Object.entries(config.customGroups).forEach(([sourceUnit, targetUnit]) => {
          if (sourceUnit && targetUnit && sourceUnit !== targetUnit && entry.units[sourceUnit]) {
            const src = entry.units[sourceUnit];
            delete entry.units[sourceUnit];
            if (!entry.units[targetUnit]) {
              entry.units[targetUnit] = { ...src };
            } else {
              entry.units[targetUnit].horas += src.horas;
              entry.units[targetUnit].previsto += src.previsto;
              entry.units[targetUnit].hhCol = 
                (entry.units[targetUnit].hhCol || 0) + 
                (src.hhCol !== undefined ? src.hhCol : (src.previsto - src.horas));
            }
          }
        });
      }

      // Garantir totalHH e hhCol consistentes
      if (entry.totalHH === undefined) {
        entry.totalHH = entry.totalPrevisto - entry.totalHoras;
      }
      Object.values(entry.units).forEach(u => {
        if (u.hhCol === undefined) {
          u.hhCol = u.previsto - u.horas;
        }
      });
    });
  });

  return cloned;
};

/**
 * Carrega a base de HHT bruta (mesclando nativa com LocalStorage)
 * e aplica o agrupamento desejado.
 */
export const loadHHTStore = (config: UnitGroupingConfig = DEFAULT_UNIT_GROUPING_CONFIG): MultiYearHHTStore => {
  let base: MultiYearHHTStore = JSON.parse(JSON.stringify(DEFAULT_HHT_STORE));
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as MultiYearHHTStore;
      Object.keys(parsed).forEach(yStr => {
        const y = Number(yStr);
        if (!base[y]) base[y] = {};
        Object.keys(parsed[y]).forEach(mStr => {
          const m = Number(mStr);
          base[y][m] = parsed[y][m];
        });
      });
    }
  } catch (err) {
    console.warn("Erro ao carregar HHT do localStorage:", err);
  }

  return applyGroupingToStore(base, config);
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
export const resetHHTStoreLocalStorage = (config: UnitGroupingConfig = DEFAULT_UNIT_GROUPING_CONFIG): MultiYearHHTStore => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem("acotubo_sesmt_hht_store_v3");
    localStorage.removeItem("acotubo_sesmt_hht_store_v2");
  } catch (err) {
    console.warn("Erro ao limpar localStorage:", err);
  }
  return loadHHTStore(config);
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
 * Mapeia a divisão e área do acidente para as unidades de fonte.
 * Considera as configurações de agrupamento (Matriz vs Carbono e agrupamentos customizados).
 */
export const matchAccidentToSourceUnit = (
  accidentDivision: string, 
  accidentArea?: string,
  config: UnitGroupingConfig = DEFAULT_UNIT_GROUPING_CONFIG
): string => {
  const normDiv = (accidentDivision || "").trim().toLowerCase();
  const normArea = (accidentArea || "").trim().toLowerCase();

  let matched = "";

  if (normDiv.includes("canoas")) matched = "AÇOTUBO - Canoas";
  else if (normDiv.includes("cxs") || normDiv.includes("caxias")) matched = "AÇOTUBO - Caxias do Sul";
  else if (normDiv.includes("joinville")) matched = "AÇOTUBO - Joinville";
  else if (normDiv.includes("soluções") || normDiv.includes("solucoes")) matched = "AÇOTUBO - Soluções Integradas";
  else if (normDiv.includes("bassi")) matched = "Bassi";
  else if (normDiv.includes("incotep")) matched = "Incotep";
  else if (normDiv.includes("artex")) matched = "AÇOTUBO - Inox";
  else if (normDiv.includes("curitiba")) matched = "AÇOTUBO - Curitiba";
  else if (normDiv.includes("minas") || normDiv.includes(" mg")) matched = "AÇOTUBO - Minas Gerais";
  else if (normDiv.includes("rio") || normDiv.includes(" rj")) matched = "AÇOTUBO - Rio de Janeiro";
  else if (normDiv.includes("sertãozinho") || normDiv.includes("sertaozinho")) matched = "AÇOTUBO - Sertãozinho";
  else if (normDiv.includes("maringá") || normDiv.includes("maringa")) matched = "AÇOTUBO - Maringá";
  else if (normDiv.includes("piracicaba")) matched = "AÇOTUBO - Piracicaba";
  else if (normDiv.includes("açocred") || normDiv.includes("acocred")) matched = "Açocred";
  else if (normDiv.includes("gru") || normDiv.includes("matriz") || normDiv.includes("carbono") || normDiv.includes("tubo")) {
    if (normArea.includes("inox")) {
      matched = "AÇOTUBO - Inox";
    } else if (normArea.includes("conexo") || normArea.includes("conexões")) {
      matched = "AÇOTUBO - Conexões";
    } else {
      // Carbono vs Matriz
      if (config.groupMatrizCarbono) {
        matched = "AÇOTUBO - Carbono";
      } else {
        // Quando Matriz e Carbono são separadas:
        // Setores corporativos/administrativos e menções a Matriz vão para Matriz
        if (
          normDiv.includes("matriz") || 
          normArea.includes("adm") || 
          normArea.includes("cozinha") || 
          normArea.includes("manut corp") || 
          normArea.includes("qualidade") ||
          normArea.includes("diretoria") ||
          normArea.includes("rh")
        ) {
          matched = "AÇOTUBO - Matriz";
        } else {
          matched = "AÇOTUBO - Carbono";
        }
      }
    }
  }

  // Agrupamento customizado adicional (se houver mapeamento direto desta unidade)
  if (matched && config.customGroups && config.customGroups[matched]) {
    matched = config.customGroups[matched];
  }

  return matched;
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
  multiYearStore?: MultiYearHHTStore,
  config: UnitGroupingConfig = DEFAULT_UNIT_GROUPING_CONFIG
): FrequencySeverityOverview => {
  const rawStore = multiYearStore || loadHHTStore(config);
  const store = applyGroupingToStore(rawStore, config);
  const yearHHT = store[year] || store[2026] || {};

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
        const matched = matchAccidentToSourceUnit(a.division, a.area, config);
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

  // Estudo por Unidade de Negócio com a lista dinâmica de unidades configuradas
  const unitRecords: UnitRateRecord[] = [];
  const activeUnitsList = getUnitsList(config);

  activeUnitsList.forEach(unitName => {
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
      const matched = matchAccidentToSourceUnit(a.division, a.area, config);
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
 * preservando a unidade autêntica da planilha.
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
        // Padronização do nome da Matriz caso venha como "AÇOTUBO - Matriz" ou similar
        if (localStr.toLowerCase().includes("matriz")) {
          localStr = "AÇOTUBO - Matriz";
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
