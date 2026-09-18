import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, X, Layers, Settings, RotateCcw, 
  Check, Plus, Trash2, ArrowRight, Info, ShieldAlert
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
        maxWidth: "720px",
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
                Controle a consolidação de unidades fabris nos cálculos de Frequência (TF) e Gravidade (TG)
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
                    Agrupamento Açotubo Matriz & Açotubo Carbono
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

          {/* Card Secundário: Agrupamentos Customizados */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "1.25rem",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Settings size={18} color="#64748B" />
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                Agrupamento e Fusão Adicional de Unidades
              </h3>
            </div>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "#64748B" }}>
              Deseja unificar outra filial em uma unidade regional existente? Defina abaixo o direcionamento das horas e acidentes.
            </p>

            {/* Linha de Adição */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              background: "#F1F5F9",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #E2E8F0"
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

            {/* Lista de agrupamentos ativos */}
            <div style={{ marginTop: "1rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Agrupamentos Adicionais Configurados:
              </span>
              
              {tempConfig.customGroups && Object.keys(tempConfig.customGroups).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
                  {Object.entries(tempConfig.customGroups).map(([src, dst]) => (
                    <div 
                      key={src}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "6px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        fontSize: "0.8rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 700, color: "#1E293B" }}>{src}</span>
                        <ArrowRight size={13} color="#94A3B8" />
                        <span style={{ fontWeight: 800, color: "var(--primary)" }}>{dst}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomGroup(src)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: "0.2rem",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Desfazer agrupamento"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: "0.35rem", fontSize: "0.78rem", color: "#94A3B8", fontStyle: "italic" }}>
                  Nenhum agrupamento adicional configurado. Todas as demais unidades estão individuais.
                </div>
              )}
            </div>
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
