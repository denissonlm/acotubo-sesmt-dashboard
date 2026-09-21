import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, ArrowLeft } from 'lucide-react';
import { parseAccidentData } from '../utils/dataLoader';
import { upsertAccidentsToSupabase } from '../utils/supabase';
import type { Accident } from '../types';

interface UploadSectionProps {
  onDataLoaded: (data: Accident[]) => void;
  onCancel?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onDataLoaded, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState<number>(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSyncStatus('Lendo e estruturando dados da planilha...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const data = parseAccidentData(arrayBuffer);
        
        if (!data || data.length === 0) {
          alert('Erro ao processar o arquivo. Verifique se a aba "BD" existe.');
          setIsProcessing(false);
          return;
        }

        setSyncStatus(`Conectando ao Supabase (${data.length} ocorrências identificadas)...`);
        
        // Persistir no Supabase em lotes
        const res = await upsertAccidentsToSupabase(data, (current, total) => {
          setSyncProgress(Math.round((current / total) * 100));
          setSyncStatus(`Salvando no Supabase: ${current} de ${total} registros...`);
        });

        if (res.success) {
          setSyncStatus(`✅ Sucesso! ${res.count} registros sincronizados no banco de dados.`);
        } else {
          console.warn('Aviso ao sincronizar com Supabase:', res.error);
          setSyncStatus('⚠️ Carregado localmente (para persistir, certifique-se de executar o SQL da tabela no Supabase).');
        }

        setTimeout(() => {
          onDataLoaded(data);
          setIsProcessing(false);
        }, 800);

      } catch (err: any) {
        console.error('Erro no upload:', err);
        alert('Erro ao processar o arquivo: ' + (err.message || 'Erro desconhecido'));
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg)',
      padding: '2rem'
    }}>
      <div className="year-card" style={{ 
        maxWidth: '520px', 
        width: '100%', 
        padding: '2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '1.25rem',
        cursor: 'default',
        boxShadow: '0 12px 30px rgba(0,0,0,0.08)'
      }}>
        <div style={{ padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)' }}>
          <FileSpreadsheet size={56} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.4rem', color: 'var(--text)' }}>
            Upload & Persistência em Nuvem
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
            Selecione a planilha <strong>Dash Acidentes.xlsx</strong>. Os dados serão interpretados com inteligência e sincronizados automaticamente com o <strong>Supabase</strong>.
          </p>
        </div>

        {isProcessing ? (
          <div style={{ width: '100%', padding: '1.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
              {syncStatus}
            </div>
            {syncProgress > 0 && (
              <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ width: `${syncProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease' }} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button 
              className="year-card" 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                width: '100%', 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)'
              }}
            >
              <Upload size={18} />
              Selecionar Planilha Excel (.xlsx)
            </button>

            {onCancel && (
              <button 
                type="button"
                onClick={onCancel}
                style={{ 
                  width: '100%', 
                  background: 'transparent', 
                  color: '#64748B', 
                  border: '1px solid #E2E8F0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} />
                Voltar ao Dashboard
              </button>
            )}
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".xlsx, .xls" 
          style={{ display: 'none' }} 
        />
        
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
          * Conexão ativa com o banco de dados Supabase (Projeto: <code>qpvdwrrfqpqgcpsawlrw</code>).
        </p>
      </div>
    </div>
  );
};
