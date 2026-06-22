'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useAuth } from '@/app/AuthContext';

const C1 = '#fdefb0';
const C2 = '#e7a8b1';
const C3 = '#b998b3';
const C4 = '#77779d';
const C5 = '#4771a3';

const MODOS = {
  pendente: {
    icon:    '🔒',
    iconBg:  'rgba(71,113,163,0.12)',
    iconBorder: 'rgba(71,113,163,0.25)',
    accentColor: C5,
    accentBg:    'rgba(71,113,163,0.08)',
    accentBorder:'rgba(71,113,163,0.2)',
    titulo: 'Acesso pendente',
    subtitulo: (nome) => `Olá, ${nome || 'usuário'}! Seu cadastro foi registrado com sucesso.`,
    descricao: 'Você ainda não possui vínculo com nenhuma estação de monitoramento. Aguarde o responsável pela sua estação liberar seu acesso.',
    dica: 'ℹ️ Quando seu acesso for liberado, basta fazer login novamente para acessar o dashboard.',
    dicaCor: C5,
  },
  inativo: {
    icon:    '⊘',
    iconBg:  'rgba(127,29,29,0.15)',
    iconBorder: 'rgba(231,168,177,0.25)',
    accentColor: C2,
    accentBg:    'rgba(127,29,29,0.1)',
    accentBorder:'rgba(231,168,177,0.2)',
    titulo: 'Conta desativada',
    subtitulo: (nome) => `Olá, ${nome || 'usuário'}.`,
    descricao: 'Sua conta foi desativada pelo administrador do sistema. Você não pode acessar o painel enquanto sua conta estiver inativa.',
    dica: '⚠️ Entre em contato com o administrador para solicitar a reativação da sua conta.',
    dicaCor: C2,
  },
};

function SemAcessoConteudo() {
  const { user, loading, signOut } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const motivo       = searchParams.get('motivo') === 'inativo' ? 'inativo' : 'pendente';
  const modo         = MODOS[motivo];

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="loading-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: C5 }} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0f1e 0%, #0f1829 60%, #111f38 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Topbar mínima */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>🌡️</span>
            <span style={{ color: C1, fontWeight: 700, fontSize: '0.9rem' }}>Monitor IoT</span>
          </div>
          <button
            onClick={() => signOut().then(() => router.push('/'))}
            style={{ background: 'transparent', border: `1px solid rgba(119,119,157,0.2)`, borderRadius: 8, padding: '5px 12px', color: C4, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.18s' }}
          >
            Sair
          </button>
        </div>

        {/* Card principal */}
        <div style={{ background: '#0f1829', border: `1px solid ${modo.accentBorder}`, borderRadius: 20, overflow: 'hidden', boxShadow: `0 0 40px ${modo.accentColor}10` }}>

          {/* Faixa de cor no topo */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${modo.accentColor}80, ${modo.accentColor}20)` }} />

          <div style={{ padding: '40px 40px 36px', textAlign: 'center' }}>

            {/* Ícone */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: modo.iconBg, border: `1px solid ${modo.iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 28px' }}>
              {modo.icon}
            </div>

            {/* Título */}
            <h1 style={{ color: C1, fontWeight: 700, fontSize: '1.5rem', margin: '0 0 10px' }}>
              {modo.titulo}
            </h1>

            {/* Subtítulo com nome */}
            <p style={{ color: C3, fontSize: '0.9rem', fontWeight: 500, margin: '0 0 12px' }}>
              {modo.subtitulo(user?.name)}
            </p>

            {/* Descrição */}
            <p style={{ color: C4, fontSize: '0.875rem', lineHeight: 1.75, margin: '0 0 28px' }}>
              {modo.descricao}
            </p>

            {/* Dica */}
            <div style={{ background: modo.accentBg, border: `1px solid ${modo.accentBorder}`, borderRadius: 12, padding: '14px 18px', marginBottom: 32, fontSize: '0.82rem', color: modo.dicaCor, lineHeight: 1.6, textAlign: 'left' }}>
              {modo.dica}
            </div>

            {/* Linha de separação com info do usuário */}
            {user && (
              <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(119,119,157,0.1)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(71,113,163,0.15)', border: '1px solid rgba(71,113,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C1, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: C1, fontWeight: 600, fontSize: '0.85rem', margin: '0 0 1px' }}>{user.name}</p>
                  <p style={{ color: C4, fontSize: '0.75rem', margin: 0 }}>{user.email}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ background: motivo === 'inativo' ? 'rgba(127,29,29,0.2)' : 'rgba(119,119,157,0.12)', color: motivo === 'inativo' ? C2 : C4, border: `1px solid ${motivo === 'inativo' ? 'rgba(231,168,177,0.2)' : 'rgba(119,119,157,0.15)'}`, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                    {motivo === 'inativo' ? '○ Inativo' : '○ Pendente'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => signOut().then(() => router.push('/'))}
              style={{ width: '100%', padding: '12px', background: 'rgba(127,29,29,0.2)', color: C2, border: '1px solid rgba(231,168,177,0.2)', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              Sair da conta
            </button>

          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(119,119,157,0.3)', fontSize: '0.72rem', marginTop: 20 }}>
          Monitor IoT — Projeto de Monitoramento Ambiental
        </p>

      </div>
    </main>
  );
}

export default function SemAcesso() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} className="loading-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#4771a3' }} />)}
        </div>
      </main>
    }>
      <SemAcessoConteudo />
    </Suspense>
  );
}
