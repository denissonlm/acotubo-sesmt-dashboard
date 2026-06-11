import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpandableChartProps {
  children: (isMaximized: boolean) => React.ReactNode;
  title?: string;
}

export const ExpandableChart: React.FC<ExpandableChartProps> = ({ children, title }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Container Normal (mantém o layout original) */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {children(false)}
        <button 
          onClick={() => setIsMaximized(true)}
          className="no-print"
          title="Expandir Gráfico"
          style={{ 
            position: 'absolute', 
            top: 5, 
            right: 5, 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid #E2E8F0', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            zIndex: 10
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Modal Tela Cheia */}
      <AnimatePresence>
        {isMaximized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100vw', 
              height: '100vh', 
              background: 'rgba(15, 23, 42, 0.95)', 
              backdropFilter: 'blur(4px)',
              zIndex: 99999, 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '2rem' 
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="panel-premium" 
              style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative',
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--text)', fontSize: '1.5rem' }}>
                  {title || 'Visualização Expandida'}
                </h2>
                <button 
                  onClick={() => setIsMaximized(false)}
                  style={{ 
                    background: '#F1F5F9', 
                    border: 'none', 
                    padding: '0.75rem', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
                >
                  <X size={24} />
                </button>
              </div>
              <div style={{ flex: 1, width: '100%', position: 'relative', overflow: 'auto' }}>
                {children(true)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
