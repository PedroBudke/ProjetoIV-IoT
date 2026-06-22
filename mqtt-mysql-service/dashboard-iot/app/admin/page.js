'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/AuthContext';
import { apiFetch } from '@/lib/api-fetch';

const C1 = '#fdefb0';
const C2 = '#e7a8b1';
const C3 = '#b998b3';
const C4 = '#77779d';
const C5 = '#4771a3';

function Avatar({ nome }) {
  const inicial = nome?.charAt(0)?.toUpperCase() ?? '?';
  const cores   = [C5, C4, '#3a5f8a', '#5d5d8a', '#7a6a9a'];
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: cores[inicial.charCodeAt(0) % cores.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
      {inicial}
    </div>
  );
}

const PERFIL_BADGE = {
  admin:   { bg: 'rgba(127,29,29,0.25)',   color: C2,        label: '🛡️ Admin'   },
  master:  { bg: 'rgba(146,64,14,0.25)',   color: '#fcd34d', label: '⭐ Master'  },
  usuario: { bg: 'rgba(22,101,52,0.2)',    color: '#34d399', label: '👤 Usuário' },
};

function PerfilBadge({ perfil }) {
  const b = PERFIL_BADGE[perfil] ?? { bg: 'rgba(119,119,157,0.2)', color: C4, label: perfil };
  return (
    <span style={{ background: b.bg, color: b.color, border: `1px solid ${b.color}30`, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {b.label}
    </span>
  );
}

function SectionDivider({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px' }}>
      <span style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
      {right}
    </div>
  );
}

export default function Admin() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [estacoes, setEstacoes]         = useState([]);
  const [usuarios, setUsuarios]         = useState([]);
  const [novaEstacao, setNovaEstacao]   = useState({ nome: '', localizacao: '' });
  const [vinculo, setVinculo]           = useState({ usuario_id: '', estacao_id: '', papel: 'master' });
  const [mensagem, setMensagem]         = useState('');
  const [erro, setErro]                 = useState('');
  const [criando, setCriando]           = useState(false);
  const [salvando, setSalvando]         = useState(false);
  const [vinculando, setVinculando]     = useState(false);
  const [buscaEst, setBuscaEst]         = useState('');
  const [buscaUsr, setBuscaUsr]         = useState('');
  const [filtroUsr, setFiltroUsr]       = useState('todos');

  /* ── Edit / inativar ── */
  const [editando, setEditando]         = useState(null); // { id, nome, localizacao }
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [inativandoEst, setInativandoEst] = useState({}); // { [id]: true }
  const [inativandoUsr, setInativandoUsr] = useState({}); // { [id]: true }

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.perfil !== 'admin') router.push('/');
  }, [loading, user]);

  useEffect(() => {
    if (!loading && user) { buscarEstacoes(); buscarUsuarios(); }
  }, [loading, user]);

  async function buscarEstacoes() {
    try {
      const res = await apiFetch('/api/admin/estacoes');
      const d   = await res.json();
      if (!res.ok) { setErro(d.erro || 'Erro ao buscar estações.'); return; }
      setEstacoes(d);
    } catch (e) { setErro('Erro ao buscar estações: ' + e.message); }
  }

  async function buscarUsuarios() {
    try {
      const res = await apiFetch('/api/admin/usuarios');
      const d   = await res.json();
      if (!res.ok) { setErro(d.erro || 'Erro ao buscar usuários.'); return; }
      setUsuarios(d);
    } catch (e) { setErro('Erro ao buscar usuários: ' + e.message); }
  }

  async function criarEstacao(e) {
    e.preventDefault();
    setErro(''); setMensagem(''); setSalvando(true);
    try {
      const res = await apiFetch('/api/admin/estacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaEstacao),
      });
      const d = await res.json();
      if (!res.ok) { setErro(d.erro); return; }
      setMensagem('Estação criada com sucesso!');
      setNovaEstacao({ nome: '', localizacao: '' });
      setCriando(false);
      buscarEstacoes();
    } finally { setSalvando(false); }
  }

  async function salvarEdicaoEstacao(e) {
    e.preventDefault();
    setErro(''); setMensagem(''); setSalvandoEdit(true);
    try {
      const res = await apiFetch(`/api/admin/estacoes/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editando.nome, localizacao: editando.localizacao }),
      });
      const d = await res.json();
      if (!res.ok) { setErro(d.erro); return; }
      setMensagem('Estação atualizada com sucesso!');
      setEditando(null);
      buscarEstacoes();
    } finally { setSalvandoEdit(false); }
  }

  async function toggleAtivoEstacao(est) {
    setErro(''); setMensagem('');
    setInativandoEst(prev => ({ ...prev, [est.id]: true }));
    try {
      const novoAtivo = est.ativo === false ? true : false;
      const res = await apiFetch(`/api/admin/estacoes/${est.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoAtivo }),
      });
      const d = await res.json();
      if (!res.ok) { setErro(d.erro); return; }
      setMensagem(novoAtivo ? 'Estação reativada.' : 'Estação inativada.');
      buscarEstacoes();
    } finally { setInativandoEst(prev => ({ ...prev, [est.id]: false })); }
  }

  async function toggleAtivoUsuario(usr) {
    setErro(''); setMensagem('');
    setInativandoUsr(prev => ({ ...prev, [usr.id]: true }));
    try {
      const novoAtivo = usr.ativo === false ? true : false;
      const res = await apiFetch(`/api/admin/usuarios/${usr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoAtivo }),
      });
      const d = await res.json();
      if (!res.ok) { setErro(d.erro); return; }
      setMensagem(novoAtivo ? 'Usuário reativado.' : 'Usuário inativado.');
      buscarUsuarios();
    } finally { setInativandoUsr(prev => ({ ...prev, [usr.id]: false })); }
  }

  async function vincularUsuario(e) {
    e.preventDefault();
    setErro(''); setMensagem(''); setVinculando(true);
    try {
      const res = await apiFetch('/api/admin/vinculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vinculo),
      });
      const d = await res.json();
      if (!res.ok) { setErro(d.erro); return; }
      setMensagem('Usuário vinculado com sucesso!');
      setVinculo({ usuario_id: '', estacao_id: '', papel: 'master' });
      buscarUsuarios();
    } finally { setVinculando(false); }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} className="loading-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: C5 }} />)}
        </div>
      </main>
    );
  }

  /* ── Contadores ── */
  const estacoesAtivas   = estacoes.filter(e => e.ativo !== false);
  const estacoesInativas = estacoes.filter(e => e.ativo === false);
  const usuariosAtivos   = usuarios.filter(u => u.ativo !== false);

  /* ── Listas filtradas ── */
  const estacoesFiltradas = buscaEst.trim()
    ? estacoes.filter(e => e.nome?.toLowerCase().includes(buscaEst.toLowerCase()) || e.localizacao?.toLowerCase().includes(buscaEst.toLowerCase()))
    : estacoes;

  const usuariosBase = filtroUsr === 'todos'    ? usuarios
    : filtroUsr === 'ativos'   ? usuariosAtivos
    : filtroUsr === 'inativos' ? usuarios.filter(u => u.ativo === false)
    : usuarios.filter(u => u.perfil === filtroUsr);

  const usuariosFiltrados = buscaUsr.trim()
    ? usuariosBase.filter(u => u.nome?.toLowerCase().includes(buscaUsr.toLowerCase()) || u.email?.toLowerCase().includes(buscaUsr.toLowerCase()))
    : usuariosBase;

  const vinculoUsuario = usuarios.find(u => u.id === vinculo.usuario_id);
  const vinculoEstacao = estacoes.find(e => e.id === vinculo.estacao_id);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .stats-grid4 { grid-template-columns: 1fr 1fr !important; }
          .form-nova    { grid-template-columns: 1fr !important; }
          .hide-sm      { display: none !important; }
          .vinculo-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid4 { grid-template-columns: 1fr !important; }
        }
        .tab-btn          { background: transparent; border: none; border-radius: 7px; padding: 5px 13px; cursor: pointer; font-size: 0.78rem; font-weight: 500; transition: all 0.18s; }
        .tab-btn.active   { background: ${C5}; color: #fff; font-weight: 600; }
        .tab-btn.inactive { color: ${C4}; }
        .tab-btn.inactive:hover { background: rgba(119,119,157,0.12); }
        .search-input { background: rgba(10,15,30,0.7); border: 1.5px solid rgba(119,119,157,0.2); border-radius: 8px; padding: 7px 12px; color: #e2e8f0; font-size: 0.82rem; outline: none; transition: border-color 0.2s; width: 200px; }
        .search-input:focus { border-color: ${C5}; }
        .search-input::placeholder { color: rgba(119,119,157,0.45); }
        .trow:hover td { background: rgba(71,113,163,0.06) !important; }
        .trow-inativo td { opacity: 0.55; }
        .trow-inativo:hover td { opacity: 0.75 !important; }
        .dash-btn { background: rgba(71,113,163,0.12); color: ${C5}; border: 1px solid rgba(71,113,163,0.28); border-radius: 7px; padding: 5px 11px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: background 0.18s; white-space: nowrap; }
        .dash-btn:hover { background: rgba(71,113,163,0.25); }
        .edit-btn { background: rgba(185,152,179,0.1); color: ${C3}; border: 1px solid rgba(185,152,179,0.25); border-radius: 7px; padding: 5px 11px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: background 0.18s; white-space: nowrap; }
        .edit-btn:hover { background: rgba(185,152,179,0.2); }
        .off-btn { background: rgba(127,29,29,0.15); color: ${C2}; border: 1px solid rgba(231,168,177,0.25); border-radius: 7px; padding: 5px 11px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: background 0.18s; white-space: nowrap; }
        .off-btn:hover { background: rgba(127,29,29,0.28); }
        .off-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .on-btn { background: rgba(22,101,52,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.25); border-radius: 7px; padding: 5px 11px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: background 0.18s; white-space: nowrap; }
        .on-btn:hover { background: rgba(22,101,52,0.28); }
        .on-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .form-select { background: #0d1526; border: 1.5px solid rgba(119,119,157,0.25); border-radius: 9px; padding: 10px 12px; color: #e2e8f0; font-size: 0.875rem; outline: none; transition: border-color 0.2s; width: 100%; }
        .form-select:focus { border-color: ${C5}; }
        .form-input { background: #0d1526; border: 1.5px solid rgba(119,119,157,0.25); border-radius: 9px; padding: 10px 12px; color: #e2e8f0; font-size: 0.875rem; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
        .form-input:focus { border-color: ${C5}; }
        .form-input::placeholder { color: rgba(119,119,157,0.45); }
        .edit-input { background: rgba(10,15,30,0.8); border: 1.5px solid ${C5}; border-radius: 7px; padding: 6px 10px; color: #e2e8f0; font-size: 0.82rem; outline: none; width: 100%; box-sizing: border-box; }
        .edit-input:focus { border-color: ${C1}; box-shadow: 0 0 0 2px rgba(253,239,176,0.1); }
        .create-btn { background: ${C5}; color: white; border: none; border-radius: 9px; padding: 10px 20px; font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: background 0.18s; white-space: nowrap; }
        .create-btn:hover:not(:disabled) { background: #3a5f8a; }
        .create-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .save-btn { background: rgba(71,113,163,0.15); color: ${C5}; border: 1px solid rgba(71,113,163,0.35); border-radius: 7px; padding: 5px 12px; cursor: pointer; font-size: 0.78rem; font-weight: 600; white-space: nowrap; transition: background 0.18s; }
        .save-btn:hover:not(:disabled) { background: rgba(71,113,163,0.3); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cancel-btn { background: transparent; color: ${C4}; border: 1px solid rgba(119,119,157,0.2); border-radius: 7px; padding: 5px 12px; cursor: pointer; font-size: 0.78rem; font-weight: 500; white-space: nowrap; transition: background 0.18s; }
        .cancel-btn:hover { background: rgba(119,119,157,0.1); }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#0a0f1e' }}>

        {/* ── Topbar ── */}
        <header style={{ background: 'rgba(11,18,33,0.97)', borderBottom: '1px solid rgba(119,119,157,0.15)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
            <div>
              <span style={{ color: C1, fontWeight: 700, fontSize: '0.95rem' }}>Painel Admin</span>
              <span style={{ color: C4, fontSize: '0.72rem', display: 'block', lineHeight: 1 }}>Monitor IoT</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C1, fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>{user?.name}</p>
              <span style={{ background: 'rgba(127,29,29,0.3)', color: C2, borderRadius: 20, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 600 }}>🛡️ Admin</span>
            </div>
            <button className="btn-danger" onClick={() => signOut().then(() => router.push('/'))} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              Sair
            </button>
          </div>
        </header>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 48px' }}>

          {/* ── Feedback ── */}
          {mensagem && (
            <div style={{ background: 'rgba(22,101,52,0.2)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '11px 16px', marginBottom: 18, color: '#34d399', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ {mensagem}
            </div>
          )}
          {erro && (
            <div style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(231,168,177,0.25)', borderRadius: 10, padding: '11px 16px', marginBottom: 18, color: C2, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ {erro}
            </div>
          )}

          {/* ── Stats ── */}
          <div className="stats-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Estações ativas',   value: estacoesAtivas.length,                                   icon: '📡', color: C5,       sub: estacoesInativas.length ? `${estacoesInativas.length} inativa${estacoesInativas.length > 1 ? 's' : ''}` : null },
              { label: 'Usuários ativos',   value: usuariosAtivos.length,                                   icon: '👥', color: C3,       sub: usuarios.length - usuariosAtivos.length ? `${usuarios.length - usuariosAtivos.length} inativo${usuarios.length - usuariosAtivos.length > 1 ? 's' : ''}` : null },
              { label: 'Masters',           value: usuarios.filter(u => u.perfil === 'master').length,      icon: '⭐', color: '#fcd34d', sub: null },
              { label: 'Admins',            value: usuarios.filter(u => u.perfil === 'admin').length,       icon: '🛡️', color: C2,       sub: null },
            ].map((s, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(71,113,163,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ color: s.color, fontWeight: 800, fontSize: '1.7rem', lineHeight: 1, margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ color: C4, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{s.label}</p>
                  {s.sub && <p style={{ color: 'rgba(231,168,177,0.6)', fontSize: '0.68rem', margin: '2px 0 0' }}>{s.sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              SEÇÃO 1 — ESTAÇÕES
          ══════════════════════════════════════════ */}
          <SectionDivider
            title="Estações de monitoramento"
            right={
              <button
                onClick={() => { setCriando(v => !v); setErro(''); setMensagem(''); setEditando(null); }}
                style={{ background: criando ? 'rgba(119,119,157,0.15)' : C5, color: criando ? C4 : 'white', border: `1px solid ${criando ? 'rgba(119,119,157,0.25)' : C5}`, borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                {criando ? '✕ Cancelar' : '+ Nova estação'}
              </button>
            }
          />

          {/* Formulário de nova estação */}
          {criando && (
            <div style={{ background: 'rgba(71,113,163,0.06)', border: '1px solid rgba(71,113,163,0.2)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ color: C1, fontWeight: 600, fontSize: '0.9rem', margin: '0 0 14px' }}>Nova estação</p>
              <form onSubmit={criarEstacao}>
                <div className="form-nova" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Nome da estação *</label>
                    <input className="form-input" type="text" value={novaEstacao.nome} onChange={e => setNovaEstacao({ ...novaEstacao, nome: e.target.value })} placeholder="Ex: Sala A1, Lab de Química..." required />
                  </div>
                  <div>
                    <label style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Localização</label>
                    <input className="form-input" type="text" value={novaEstacao.localizacao} onChange={e => setNovaEstacao({ ...novaEstacao, localizacao: e.target.value })} placeholder="Ex: Bloco B, 2º andar" />
                  </div>
                  <button type="submit" className="create-btn" disabled={salvando}>
                    {salvando ? 'Criando...' : '✓ Criar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabela de estações */}
          <div style={{ background: '#0f1829', border: '1px solid rgba(119,119,157,0.15)', borderRadius: 16, overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(119,119,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: C4, fontSize: '0.75rem' }}>
                <strong style={{ color: C3 }}>{estacoesFiltradas.length}</strong> de {estacoes.length} estações
                {estacoesInativas.length > 0 && <span style={{ color: C2, marginLeft: 8 }}>· {estacoesInativas.length} inativa{estacoesInativas.length > 1 ? 's' : ''}</span>}
              </span>
              <input className="search-input" type="text" placeholder="Buscar estação..." value={buscaEst} onChange={e => setBuscaEst(e.target.value)} />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(119,119,157,0.12)' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left',   color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estação</th>
                    <th className="hide-sm" style={{ padding: '10px 16px', textAlign: 'left',   color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Localização</th>
                    <th className="hide-sm" style={{ padding: '10px 16px', textAlign: 'center', color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Criada em</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right',  color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {estacoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: C4 }}>
                        {buscaEst ? `Nenhuma estação para "${buscaEst}"` : 'Nenhuma estação cadastrada ainda.'}
                      </td>
                    </tr>
                  ) : estacoesFiltradas.map((e, idx) => {
                    const ativa    = e.ativo !== false;
                    const isEditing = editando?.id === e.id;

                    if (isEditing) {
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid rgba(71,113,163,0.2)', background: 'rgba(71,113,163,0.07)' }}>
                          <td colSpan={5} style={{ padding: '16px 20px' }}>
                            <form onSubmit={salvarEdicaoEstacao}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(71,113,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>✏️</div>
                                <input
                                  className="edit-input"
                                  style={{ flex: '1 1 160px', minWidth: 120 }}
                                  value={editando.nome}
                                  onChange={ev => setEditando({ ...editando, nome: ev.target.value })}
                                  placeholder="Nome da estação"
                                  required
                                />
                                <input
                                  className="edit-input"
                                  style={{ flex: '1 1 160px', minWidth: 120 }}
                                  value={editando.localizacao}
                                  onChange={ev => setEditando({ ...editando, localizacao: ev.target.value })}
                                  placeholder="Localização (opcional)"
                                />
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                  <button type="submit" className="save-btn" disabled={salvandoEdit}>
                                    {salvandoEdit ? 'Salvando...' : '✓ Salvar'}
                                  </button>
                                  <button type="button" className="cancel-btn" onClick={() => setEditando(null)}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </form>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={e.id} className={`trow${ativa ? '' : ' trow-inativo'}`} style={{ borderBottom: '1px solid rgba(119,119,157,0.07)', background: idx % 2 === 0 ? 'rgba(17,24,39,0.4)' : 'rgba(10,15,30,0.2)' }}>
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: ativa ? 'rgba(71,113,163,0.15)' : 'rgba(119,119,157,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                              {ativa ? '📡' : '📴'}
                            </div>
                            <div>
                              <p style={{ color: ativa ? C1 : C4, fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1px' }}>{e.nome}</p>
                              <p style={{ color: C4, fontSize: '0.72rem', margin: 0, fontFamily: 'monospace' }}>{e.id?.slice(0, 14)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="hide-sm" style={{ padding: '13px 16px', color: C4, fontSize: '0.82rem' }}>
                          {e.localizacao || <span style={{ color: 'rgba(119,119,157,0.35)' }}>—</span>}
                        </td>
                        <td className="hide-sm" style={{ padding: '13px 16px', textAlign: 'center', color: C4, fontSize: '0.8rem' }}>
                          {e.criado_em ? new Date(e.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                          {ativa ? (
                            <span style={{ background: 'rgba(71,113,163,0.2)', color: C5, border: `1px solid ${C5}30`, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>● Ativa</span>
                          ) : (
                            <span style={{ background: 'rgba(119,119,157,0.12)', color: C4, border: '1px solid rgba(119,119,157,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>○ Inativa</span>
                          )}
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {ativa && (
                              <button className="dash-btn" onClick={() => router.push(`/dashboard/${e.id}`)}>
                                📊 Dashboard
                              </button>
                            )}
                            <button
                              className="edit-btn"
                              onClick={() => { setEditando({ id: e.id, nome: e.nome, localizacao: e.localizacao || '' }); setCriando(false); }}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className={ativa ? 'off-btn' : 'on-btn'}
                              disabled={!!inativandoEst[e.id]}
                              onClick={() => toggleAtivoEstacao(e)}
                            >
                              {inativandoEst[e.id] ? '...' : ativa ? '⊘ Inativar' : '↺ Reativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SEÇÃO 2 — USUÁRIOS
          ══════════════════════════════════════════ */}
          <SectionDivider title="Usuários cadastrados" />

          <div style={{ background: '#0f1829', border: '1px solid rgba(119,119,157,0.15)', borderRadius: 16, overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(119,119,157,0.1)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 3, background: 'rgba(10,15,30,0.6)', borderRadius: 9, padding: 3 }}>
                {[
                  { key: 'todos',    label: `Todos (${usuarios.length})` },
                  { key: 'ativos',   label: `Ativos (${usuariosAtivos.length})` },
                  { key: 'inativos', label: `Inativos (${usuarios.length - usuariosAtivos.length})` },
                  { key: 'master',   label: `Masters (${usuarios.filter(u => u.perfil === 'master').length})` },
                  { key: 'usuario',  label: `Usuários (${usuarios.filter(u => u.perfil === 'usuario').length})` },
                ].map(f => (
                  <button key={f.key} className={`tab-btn ${filtroUsr === f.key ? 'active' : 'inactive'}`} onClick={() => setFiltroUsr(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <input className="search-input" type="text" placeholder="Buscar usuário..." value={buscaUsr} onChange={e => setBuscaUsr(e.target.value)} />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(119,119,157,0.12)' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left',   color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Usuário</th>
                    <th className="hide-sm" style={{ padding: '10px 16px', textAlign: 'left',   color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>E-mail</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Perfil</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right',  color: C4, fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: C4 }}>
                        {buscaUsr ? `Nenhum resultado para "${buscaUsr}"` : 'Nenhum usuário nesta categoria.'}
                      </td>
                    </tr>
                  ) : usuariosFiltrados.map((u, idx) => {
                    const ativo = u.ativo !== false;
                    return (
                      <tr key={u.id} className={`trow${ativo ? '' : ' trow-inativo'}`} style={{ borderBottom: '1px solid rgba(119,119,157,0.07)', background: idx % 2 === 0 ? 'rgba(17,24,39,0.4)' : 'rgba(10,15,30,0.2)' }}>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar nome={u.nome} />
                            <div>
                              <p style={{ color: ativo ? '#e2e8f0' : C4, fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1px' }}>{u.nome}</p>
                              <p style={{ color: C4, fontSize: '0.73rem', margin: 0 }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hide-sm" style={{ padding: '12px 16px', color: C4, fontSize: '0.82rem' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <PerfilBadge perfil={u.perfil} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {ativo ? (
                            <span style={{ background: 'rgba(22,101,52,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>● Ativo</span>
                          ) : (
                            <span style={{ background: 'rgba(119,119,157,0.12)', color: C4, border: '1px solid rgba(119,119,157,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>○ Inativo</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                          <button
                            className={ativo ? 'off-btn' : 'on-btn'}
                            disabled={!!inativandoUsr[u.id]}
                            onClick={() => toggleAtivoUsuario(u)}
                          >
                            {inativandoUsr[u.id] ? '...' : ativo ? '⊘ Inativar' : '↺ Reativar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(119,119,157,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ color: C4, fontSize: '0.75rem' }}>
                Exibindo <strong style={{ color: C3 }}>{usuariosFiltrados.length}</strong> de {usuarios.length} usuários
              </span>
              <div style={{ display: 'flex', gap: 14 }}>
                {[
                  { label: 'Ativos',   value: usuariosAtivos.length,                                  color: '#34d399' },
                  { label: 'Masters',  value: usuarios.filter(u => u.perfil === 'master').length,      color: '#fcd34d' },
                  { label: 'Usuários', value: usuarios.filter(u => u.perfil === 'usuario').length,     color: C3 },
                ].map((s, i) => (
                  <span key={i} style={{ color: C4, fontSize: '0.75rem' }}>
                    {s.label}: <strong style={{ color: s.color }}>{s.value}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SEÇÃO 3 — VINCULAR USUÁRIO
          ══════════════════════════════════════════ */}
          <SectionDivider title="Vincular usuário a estação" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }} className="vinculo-grid">

            {/* Formulário */}
            <div style={{ background: '#0f1829', border: '1px solid rgba(119,119,157,0.15)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(119,119,157,0.1)' }}>
                <h3 style={{ color: C1, fontWeight: 600, fontSize: '0.9rem', margin: '0 0 2px' }}>Novo vínculo</h3>
                <p style={{ color: C4, fontSize: '0.75rem', margin: 0 }}>Associe um usuário a uma estação e defina seu papel</p>
              </div>
              <form onSubmit={vincularUsuario} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Usuário *</label>
                    <select className="form-select" value={vinculo.usuario_id} onChange={e => setVinculo({ ...vinculo, usuario_id: e.target.value })} required>
                      <option value="">Selecione um usuário...</option>
                      {usuariosAtivos.map(u => (
                        <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Estação *</label>
                    <select className="form-select" value={vinculo.estacao_id} onChange={e => setVinculo({ ...vinculo, estacao_id: e.target.value })} required>
                      <option value="">Selecione uma estação...</option>
                      {estacoesAtivas.map(e => (
                        <option key={e.id} value={e.id}>{e.nome}{e.localizacao ? ` — ${e.localizacao}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Papel *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { value: 'master',  label: '⭐ Master',  desc: 'Gerencia acessos',   color: '#fcd34d', bg: 'rgba(146,64,14,0.15)' },
                        { value: 'usuario', label: '👤 Usuário', desc: 'Visualiza dashboard', color: '#34d399', bg: 'rgba(22,101,52,0.12)' },
                      ].map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setVinculo({ ...vinculo, papel: p.value })}
                          style={{ background: vinculo.papel === p.value ? p.bg : 'rgba(10,15,30,0.5)', border: `1.5px solid ${vinculo.papel === p.value ? p.color + '50' : 'rgba(119,119,157,0.2)'}`, borderRadius: 9, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }}
                        >
                          <p style={{ color: vinculo.papel === p.value ? p.color : C3, fontWeight: 700, fontSize: '0.82rem', margin: '0 0 2px' }}>{p.label}</p>
                          <p style={{ color: C4, fontSize: '0.72rem', margin: 0 }}>{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="create-btn" disabled={vinculando} style={{ marginTop: 4 }}>
                    {vinculando ? 'Vinculando...' : '🔗 Confirmar vínculo'}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview do vínculo */}
            <div style={{ width: 240, background: '#0f1829', border: '1px solid rgba(119,119,157,0.15)', borderRadius: 16, overflow: 'hidden', alignSelf: 'start' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(119,119,157,0.1)' }}>
                <p style={{ color: C4, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Prévia do vínculo</p>
              </div>
              <div style={{ padding: '18px' }}>
                {vinculoUsuario || vinculoEstacao ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {vinculoUsuario && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar nome={vinculoUsuario.nome} />
                        <div>
                          <p style={{ color: C1, fontWeight: 600, fontSize: '0.82rem', margin: '0 0 1px' }}>{vinculoUsuario.nome}</p>
                          <p style={{ color: C4, fontSize: '0.72rem', margin: 0 }}>{vinculoUsuario.email}</p>
                        </div>
                      </div>
                    )}
                    {vinculoUsuario && vinculoEstacao && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
                        <span style={{ color: vinculo.papel === 'master' ? '#fcd34d' : '#34d399', fontSize: '0.78rem', fontWeight: 600 }}>
                          {vinculo.papel === 'master' ? '⭐' : '👤'} como {vinculo.papel}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
                      </div>
                    )}
                    {vinculoEstacao && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(71,113,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>📡</div>
                        <div>
                          <p style={{ color: C1, fontWeight: 600, fontSize: '0.82rem', margin: '0 0 1px' }}>{vinculoEstacao.nome}</p>
                          <p style={{ color: C4, fontSize: '0.72rem', margin: 0 }}>{vinculoEstacao.localizacao || 'Sem localização'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: 6 }}>🔗</p>
                    <p style={{ color: 'rgba(119,119,157,0.4)', fontSize: '0.78rem' }}>Selecione usuário e estação para ver a prévia</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}
