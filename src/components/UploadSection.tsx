import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseAccidentData } from '../utils/dataLoader';
import type { Accident } from '../types';

interface UploadSectionProps {
  onDataLoaded: (data: Accident[]) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const data = parseAccidentData(arrayBuffer);
      if (data.length > 0) {
        onDataLoaded(data);
      } else {
        alert('Erro ao processar o arquivo. Verifique se a aba "BD" existe.');
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
        maxWidth: '500px', 
        width: '100%', 
        padding: '3rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '1.5rem',
        cursor: 'default'
      }}>
        <div style={{ padding: '2rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)' }}>
          <FileSpreadsheet size={64} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Upload de Dados</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Selecione o arquivo <strong>Dash Acidentes.xlsx</strong> para atualizar o dashboard trienal.
          </p>
        </div>
        
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
            fontWeight: 700,
            padding: '1rem',
            cursor: 'pointer'
          }}
        >
          <Upload size={20} />
          Selecionar Arquivo
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".xlsx, .xls" 
          style={{ display: 'none' }} 
        />
        
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          * O sistema processa os dados localmente no seu navegador.
        </p>
      </div>
    </div>
  );
};
