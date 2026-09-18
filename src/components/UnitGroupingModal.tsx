import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, X, Layers, RotateCcw, 
  Check, Plus, Trash2, ArrowRight, Info, ShieldAlert,
  ChevronDown, ChevronUp, CheckCircle2
} from "lucide-react";
import { 
  ALL_POSSIBLE_UNITS, 
  getUnitsList, 
  DEFAULT_UNIT_GROUPING_CONFIG,
  type UnitGroupingConfig 
} from "../utils/frequencySeverityLoader";

interface UnitGroupingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UnitGroupingConfig;
  onSave: (newConfig: UnitGroupingConfig) => void;
}

export const UnitGroupingModal: React.FC<UnitGroupingModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  // Estado temporário de edição dentro do modal
  const [tempConfig, setTempConfig] = useState<UnitGroupingConfig>({
    groupMatrizCarbono: true,
    customGroups: {}
  });

  const [newSource, setNewSource] = useState<string>("");
  const [newTarget, setNewTarget] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNativeMappings, setShowNativeMappings] = useState<boolean>(false);

  // Sincroniza ao abrir
  useEffect(() => {
    if (isOpen) {
      setTempConfig({
        groupMatrizCarbono: config.groupMatrizCarbono !== undefined ? config.groupMatrizCarbono : true,
        customGroups: { ...(config.customGroups || {}) }
      });
      setNewSource("");
      setNewTarget("");
      setErrorMessage(null);
    }
  }, [isOpen, config]);

  // Lista prévia de unidades resultantes
  const previewUnits = useMemo(() => {
    return getUnitsList(tempConfig);
  }, [tempConfig]);

  if (!isOpen) return null;

  const handleToggleMatrizCarbono = () => {
    setTempConfig(prev => ({
      ...prev,
      groupMatrizCarbono: !prev.groupMatrizCarbono
    }));
  };

  const handleAddCustomGroup = () => {
    setErrorMessage(null);
    if (!newSource || !newTarget) {
      setErrorMessage("Selecione a unidade de origem e a unidade de destino.");
      return;
    }
    if (newSource === newTarget) {
      setErrorMessage("A unidade de origem não pode ser idêntica à unidade de destino.");
      return;
    }
    if (newSource === "AÇOTUBO - Carbono" && newTarget === "AÇOTUBO - Matriz" && tempConfig.groupMatrizCarbono) {
      setErrorMessage("Matriz e Carbono já estão unificadas pela regra principal.");
      return;
    }

    setTempConfig(prev => ({
      ...prev,
      customGroups: {
        ...(prev.customGroups || {}),
        [newSource]: newTarget
      }
    }));
    setNewSource("");
    setNewTarget("");
  };

  const handleRemoveCustomGroup = (sourceKey: string) => {
    setTempConfig(prev => {
      const updated = { ...(prev.customGroups || {}) };
      delete updated[sourceKey];
      return { ...prev, customGroups: updated };
    });
  };

  const handleResetToDefault = () => {
    setTempConfig({
      groupMatrizCarbono: DEFAULT_UNIT_GROUPING_CONFIG.groupMatrizCarbono,
      customGroups: {}
    });
    setErrorMessage(null);
  };

  const handleSaveAndApply = () => {
    onSave(tempConfig);
    onClose();
  };

  // Unidades disponíveis para nova fusão customizada
  const availableSources = ALL_POSSIBLE_UNITS.filter(u => {
    if (tempConfig.groupMatrizCarbono && u === "AÇOTUBO - Matriz") return false;
    return !(tempConfig.customGroups && tempConfig.customGroups[u]);
  });

  const availableTargets = ALL_POSSIBLE_UNITS.filter(u => {
    if (tempConfig.groupMatrizCarbono && u === "AÇOTUBO - Matriz") return false;
    return true;
  });

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(15, 23, 42, 0.72)",
      backdropFilter: "blur(6px)",
      padding: "1rem"
    }}>
      <div style={{
        background: "#FFFFFF",
        width: "100%",
        maxWidth: "760px",
        maxHeight: "92vh",
        borderRadius: "16px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #E2E8F0"
      }}>
        
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: "1.25rem 1.5rem",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid var(--primary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(185, 28, 28, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(185, 28, 28, 0.4)"
            }}>
              <Building2 size={22} color="#F87171" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
                Configuração de Agrupamento de Unidades Fabris
              </h2>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#94A3B8" }}>
                Gestão e transparência das regras de consolidação operacional e taxas (NBR 14280 / OIT)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "8px",
              padding: "0.4rem",
              color: "#94A3B8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Fechar janela"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div style={{
          padding: "1.5rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          background: "#F8FAFC"
        }}>

          {/* Card Principal: Matriz & Carbono */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{
                  padding: "0.5rem",
                  borderRadius: "8px",
                  background: "rgba(185, 28, 28, 0.08)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                    Agrupamento Açotubo Matriz & Açotubo Carbono (Guarulhos)
                  </h3>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#64748B", lineHeight: "1.35" }}>
                    Nas planilhas de HH, a unidade fabril e corporativa de Guarulhos ora é identificada como <strong>AÇOTUBO - Carbono</strong>, ora como <strong>AÇOTUBO - Matriz</strong>.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                <div 
                  onClick={handleToggleMatrizCarbono}
                  style={{
                    width: "50px",
                    height: "28px",
                    borderRadius: "14px",
                    background: tempConfig.groupMatrizCarbono ? "var(--primary)" : "#CBD5E1",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease"
                  }}
                  title={tempConfig.groupMatrizCarbono ? "Clique para desagrupar Matriz e Carbono" : "Clique para agrupar Matriz e Carbono"}
                >
                  <div style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    position: "absolute",
                    top: "3px",
                    left: tempConfig.groupMatrizCarbono ? "25px" : "3px",
                    transition: "left 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }} />
                </div>
                <span style={{ 
                  fontSize: "0.72rem", 
                  fontWeight: 800, 
                  color: tempConfig.groupMatrizCarbono ? "var(--primary)" : "#64748B" 
                }}>
                  {tempConfig.groupMatrizCarbono ? "AGRUPADO" : "SEPARADO"}
                </span>
              </div>
            </div>

            {/* Informações detalhadas do estado atual */}
            <div style={{
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: tempConfig.groupMatrizCarbono ? "rgba(16, 185, 129, 0.08)" : "rgba(2, 132, 199, 0.08)",
              border: `1px solid ${tempConfig.groupMatrizCarbono ? "rgba(16, 185, 129, 0.25)" : "rgba(2, 132, 199, 0.25)"}`,
              fontSize: "0.8rem",
              color: "#334155"
            }}>
              {tempConfig.groupMatrizCarbono ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ color: "#10B981", fontWeight: 800, marginTop: "1px" }}>✓</div>
                  <div>
                    <strong style={{ color: "#065F46" }}>Modo Consolidado Ativo (16 Unidades):</strong> Os dados de Horas Trabalhadas (HHT) e acidentes da Matriz e de Carbono são somados sob a unidade <strong>AÇOTUBO - Carbono</strong>, refletindo a operação integrada da matriz de Guarulhos.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ color: "#0284C7", fontWeight: 800, marginTop: "1px" }}>ℹ</div>
                  <div>
                    <strong style={{ color: "#075985" }}>Modo Individualizado Ativo (17 Unidades):</strong> <strong>AÇOTUBO - Matriz</strong> e <strong>AÇOTUBO - Carbono</strong> aparecem de forma independente nos rankings, taxas e gráficos. Os acidentes corporativos/administrativos são direcionados à Matriz e os industriais à Carbono.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO PRINCIPAL SOLICITADA: AGRUPAMENTOS CONFIGURADOS */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  padding: "0.4rem",
                  borderRadius: "6px",
                  background: "#F1F5F9",
                  color: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <CheckCircle2 size={18} color="var(--primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                  Agrupamentos Configurados
                </h3>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>
                {tempConfig.groupMatrizCarbono ? 1 + Object.keys(tempConfig.customGroups || {}).length : Object.keys(tempConfig.customGroups || {}).length} regra(s) ativa(s)
              </span>
            </div>

            <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "#64748B", lineHeight: "1.4" }}>
              Veja abaixo exatamente o que já está agrupado no sistema e o que será agrupado, com o detalhamento técnico de cada consolidação:
            </p>

            {/* Lista Unificada de Agrupamentos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              
              {/* 1. Agrupamento Padrão: Matriz -> Carbono (se ativo) */}
              {tempConfig.groupMatrizCarbono ? (
                <div style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  background: "#F8FAFC",
                  border: "1.5px solid #CBD5E1",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontWeight: 800, color: "#0F172A", fontSize: "0.85rem" }}>AÇOTUBO - Matriz</span>
                      <ArrowRight size={15} color="var(--primary)" />
                      <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.85rem" }}>AÇOTUBO - Carbono</span>
                      <span style={{
                        padding: "2px 7px",
                        borderRadius: "10px",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#047857",
                        border: "1px solid rgba(16, 185, 129, 0.3)"
                      }}>
                        Padrão do Sistema (Ativo)
                      </span>
                    </div>

                    <button
                      onClick={handleToggleMatrizCarbono}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        color: "#64748B",
                        padding: "0.3rem 0.65rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                      title="Desmembrar Matriz e Carbono em duas unidades separadas"
                    >
                      Desagrupar
                    </button>
                  </div>

                  {/* Detalhamento: O que está feito e como está feito */}
                  <div style={{
                    fontSize: "0.78rem",
                    color: "#475569",
                    background: "#FFFFFF",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    lineHeight: "1.4"
                  }}>
                    <div><strong>• O que está feito:</strong> Consolidação de Matriz (Guarulhos) dentro de AÇOTUBO - Carbono.</div>
                    <div><strong>• Como está feito:</strong> Na apuração de HHT, os 64.364,70 h do mês 08 (registrados na fonte como "AÇOTUBO - Matriz") são somados às horas de Carbono. Na apuração de ocorrências, os acidentes corporativos/administrativos de GRU (Cozinha, Manutenção Corporativa, TA Adm, Diretoria) são atribuídos a Carbono.</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  background: "#F1F5F9",
                  border: "1px dashed #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "#64748B"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700 }}>AÇOTUBO - Matriz e AÇOTUBO - Carbono:</span>
                    <span style={{ color: "#0284C7", fontWeight: 800 }}>Separadas (17 Unidades)</span>
                  </div>
                  <button
                    onClick={handleToggleMatrizCarbono}
                    style={{
                      background: "var(--primary)",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Reagrupar
                  </button>
                </div>
              )}

              {/* 2. Agrupamentos Adicionais / Personalizados */}
              {tempConfig.customGroups && Object.keys(tempConfig.customGroups).length > 0 ? (
                Object.entries(tempConfig.customGroups).map(([src, dst]) => (
                  <div 
                    key={src}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "8px",
                      background: "#F8FAFC",
                      border: "1.5px solid #CBD5E1",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontWeight: 800, color: "#0F172A", fontSize: "0.85rem" }}>{src}</span>
                        <ArrowRight size={15} color="var(--primary)" />
                        <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.85rem" }}>{dst}</span>
                        <span style={{
                          padding: "2px 7px",
                          borderRadius: "10px",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          background: "rgba(2, 132, 199, 0.12)",
                          color: "#0369A1",
                          border: "1px solid rgba(2, 132, 199, 0.3)"
                        }}>
                          Agrupamento Personalizado
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveCustomGroup(src)}
                        style={{
                          background: "#FEE2E2",
                          border: "1px solid #FCA5A5",
                          color: "#DC2626",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem"
                        }}
                        title="Remover este agrupamento"
                      >
                        <Trash2 size={13} />
                        <span>Remover</span>
                      </button>
                    </div>

                    <div style={{
                      fontSize: "0.78rem",
                      color: "#475569",
                      background: "#FFFFFF",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      lineHeight: "1.4"
                    }}>
                      <div><strong>• O que está feito:</strong> Fusão da unidade "{src}" sob "{dst}".</div>
                      <div><strong>• Como está feito:</strong> As Horas Trabalhadas (HHT), ausências e previsto da unidade de origem são incorporadas à unidade de destino, e quaisquer acidentes registrados na origem passam a pontuar na unidade de destino para o cálculo das taxas.</div>
                    </div>
                  </div>
                ))
              ) : null}

              {/* Caso não haja agrupamentos customizados e Matriz esteja separada */}
              {!tempConfig.groupMatrizCarbono && (!tempConfig.customGroups || Object.keys(tempConfig.customGroups).length === 0) && (
                <div style={{ padding: "0.85rem", textAlign: "center", color: "#64748B", fontSize: "0.82rem", background: "#F1F5F9", borderRadius: "8px" }}>
                  Nenhum agrupamento ativo. Todas as 17 unidades fabris e administrativas estão operando de forma 100% individual.
                </div>
              )}

            </div>

            {/* Caixa para Criar Novo Agrupamento */}
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid #E2E8F0", paddingTop: "1rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                + Adicionar Novo Agrupamento:
              </span>
              
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
                background: "#F8FAFC",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                marginTop: "0.5rem"
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "160px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B" }}>Unidade de Origem:</span>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    style={{
                      padding: "0.45rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#1E293B"
                    }}
                  >
                    <option value="">Selecione a origem...</option>
                    {availableSources.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: "1.1rem", color: "#94A3B8" }}>
                  <ArrowRight size={18} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "160px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B" }}>Agrupar sob (Destino):</span>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    style={{
                      padding: "0.45rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#1E293B"
                    }}
                  >
                    <option value="">Selecione o destino...</option>
                    {availableTargets.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddCustomGroup}
                  style={{
                    marginTop: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    background: "var(--primary)",
                    border: "none",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  <Plus size={14} />
                  <span>Agrupar</span>
                </button>
              </div>

              {errorMessage && (
                <div style={{ 
                  marginTop: "0.5rem", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.35rem", 
                  color: "#DC2626", 
                  fontSize: "0.78rem", 
                  fontWeight: 600 
                }}>
                  <ShieldAlert size={14} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

          </div>

          {/* Seção Explicativa: Mapeamento de Padronização SESMT */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "1rem 1.25rem",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
          }}>
            <div 
              onClick={() => setShowNativeMappings(!showNativeMappings)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Info size={17} color="#0284C7" />
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A" }}>
                  Mapeamento e Padronização de Siglas da Base de Acidentes (SESMT)
                </span>
              </div>
              <div style={{ color: "#64748B", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 700 }}>
                <span>{showNativeMappings ? "Recolher" : "Ver detalhes"}</span>
                {showNativeMappings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {showNativeMappings && (
              <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid #E2E8F0", fontSize: "0.78rem", color: "#475569" }}>
                <p style={{ margin: "0 0 0.6rem 0", lineHeight: "1.4" }}>
                  Para correlacionar as siglas operacionais dos comunicados de acidentes com as unidades oficiais das planilhas de HH, o sistema adota as seguintes padronizações nativas:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.5rem" }}>
                  <div style={{ background: "#F8FAFC", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>• Artex GRU</strong> (Inox Prod / Inox Log) → <strong>AÇOTUBO - Inox</strong>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>• Açotubo GRU</strong> (Área: TA Conex) → <strong>AÇOTUBO - Conexões</strong>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>• Soluções</strong> (Área: Sol Prod) → <strong>AÇOTUBO - Soluções Integradas</strong>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>• Açotubo CXS</strong> → <strong>AÇOTUBO - Caxias do Sul</strong>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>• Acotubo Canoas</strong> → <strong>AÇOTUBO - Canoas</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card de Preview: Unidades Resultantes */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Info size={16} color="var(--primary)" />
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0F172A" }}>
                  Unidades Resultantes no Dashboard:
                </span>
              </div>
              <span style={{
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(185, 28, 28, 0.1)",
                color: "var(--primary)",
                fontWeight: 800,
                fontSize: "0.75rem"
              }}>
                {previewUnits.length} Unidades Ativas
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxHeight: "140px", overflowY: "auto" }}>
              {previewUnits.map(u => {
                const isConsolidated = 
                  (tempConfig.groupMatrizCarbono && u === "AÇOTUBO - Carbono") ||
                  (tempConfig.customGroups && Object.values(tempConfig.customGroups).includes(u));

                return (
                  <span
                    key={u}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      background: isConsolidated ? "rgba(185, 28, 28, 0.08)" : "#F1F5F9",
                      border: `1px solid ${isConsolidated ? "rgba(185, 28, 28, 0.25)" : "#E2E8F0"}`,
                      color: isConsolidated ? "var(--primary)" : "#334155",
                      fontSize: "0.74rem",
                      fontWeight: isConsolidated ? 800 : 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span>{u}</span>
                    {isConsolidated && (
                      <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>(Consolidada)</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

        </div>

        {/* Rodapé de Ações */}
        <div style={{
          padding: "1rem 1.5rem",
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem"
        }}>
          <button
            onClick={handleResetToDefault}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.5rem 0.9rem",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              background: "#F8FAFC",
              color: "#475569",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <RotateCcw size={14} />
            <span>Restaurar Padrão</span>
          </button>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#64748B",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAndApply}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(185, 28, 28, 0.3)"
              }}
            >
              <Check size={16} />
              <span>Salvar e Aplicar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
