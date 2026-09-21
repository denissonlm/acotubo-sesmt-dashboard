import React, { useState } from 'react';
import { 
  AlertTriangle, Key, ExternalLink, Copy, Check, X, ShieldAlert, Info 
} from 'lucide-react';

interface TokenExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Data de expiração do token gerado no Supabase (20 de Dezembro de 2026)
export const TOKEN_EXPIRATION_DATE = new Date('2026-12-20T23:59:59');
// Início do aviso: 7 dias antes (13 de Dezembro de 2026)
export const WARNING_DAYS_BEFORE = 7;

export const checkTokenNeedsRenewal = (now: Date = new Date()): {
  isExpiringSoon: boolean;
  isExpired: boolean;
  daysRemaining: number;
} => {
  const diffMs = TOKEN_EXPIRATION_DATE.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining <= WARNING_DAYS_BEFORE;

  return { isExpiringSoon, isExpired, daysRemaining };
};

export const TokenExpirationModal: React.FC<TokenExpirationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { isExpiringSoon, isExpired, daysRemaining } = checkTokenNeedsRenewal();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleDismissToday = () => {
    // Guarda a data de dispensa para não incomodar no mesmo dia
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('token_renewal_dismissed_date', todayStr);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid ' + (isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#3b82f6'),
          borderRadius: '1.25rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: isExpired 
            ? '0 25px 50px -12px rgba(239, 68, 68, 0.35)' 
            : '0 25px 50px -12px rgba(245, 158, 11, 0.25)',
          overflow: 'hidden',
          color: '#f8fafc',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Faixa de Status */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: isExpired 
            ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)' 
            : isExpiringSoon 
            ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.1) 100%)' 
            : 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#3b82f6',
              padding: '0.6rem',
              borderRadius: '0.75rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isExpired ? <ShieldAlert size={24} /> : isExpiringSoon ? <AlertTriangle size={24} /> : <Key size={24} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {isExpired 
                  ? 'Token Supabase MCP Expirado!' 
                  : isExpiringSoon 
                  ? `Renovação de Token Supabase (${daysRemaining} dias restantes)`
                  : 'Gerenciamento de Token Supabase (MCP)'}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Data limite registrada: <strong style={{ color: '#f1f5f9' }}>20 de Dezembro de 2026</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Alerta de tranquilização: Web App vs MCP */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '0.75rem',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.8rem',
            color: '#bfdbfe',
            lineHeight: 1.45
          }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
            <div>
              <strong>Fique tranquilo:</strong> O Dashboard público e os uploads continuam funcionando normalmente (a chave da aplicação é permanente até 2036). Este aviso é para renovar o <strong>token administrativo do agente IA (MCP)</strong>, que expira a cada 90 dias.
            </div>
          </div>

          {/* Cartão de Credenciais com Botão Copiar */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
              Credenciais da Conta do Supabase
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>E-mail de Login</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', wordBreak: 'break-all' }}>sesmtecolab@gmail.com</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Senha de Acesso</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.03em' }}>Denideni6951!</span>
              </div>
            </div>

            <button
              onClick={() => handleCopy('E-mail: sesmtecolab@gmail.com\nSenha: Denideni6951!\nLink Tokens: https://supabase.com/dashboard/account/tokens', 'credentials')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: copiedField === 'credentials' ? '#059669' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid ' + (copiedField === 'credentials' ? '#10b981' : 'rgba(255, 255, 255, 0.1)'),
                color: '#f8fafc',
                padding: '0.5rem 0.8rem',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copiedField === 'credentials' ? <Check size={14} /> : <Copy size={14} />}
              {copiedField === 'credentials' ? 'Credenciais Copiadas!' : 'Copiar Login e Senha'}
            </button>
          </div>

          {/* Passo a Passo para Gerar Novo Token */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
              Como renovar em 3 passos:
            </span>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.82rem' }}>
              <span style={{ background: '#3b82f6', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>1</span>
              <span>Acesse a área de tokens no Supabase clicando no botão abaixo.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.82rem' }}>
              <span style={{ background: '#3b82f6', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>2</span>
              <span>Clique no botão verde <strong>"Generate new token"</strong>, dê o nome <code>sesmtecolab-2027</code> e confirme.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.82rem' }}>
              <span style={{ background: '#3b82f6', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>3</span>
              <span>Copie o código gerado (<code>sbp_...</code>) e envie no chat para mim: <em>"Aqui está o novo token do Supabase: [seu token]"</em>.</span>
            </div>
          </div>

        </div>

        {/* Footer com Ações */}
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(0, 0, 0, 0.25)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleDismissToday}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              padding: '0.6rem 1rem',
              borderRadius: '0.6rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Lembrar depois
          </button>

          <a
            href="https://supabase.com/dashboard/account/tokens"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.6rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Abrir Supabase Tokens
            <ExternalLink size={15} />
          </a>
        </div>

      </div>
    </div>
  );
};
