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
  const cores = ['#4771a3', '#77779d', '#b998b3', '#3a5f8a', '#5d5d8a'];
  const cor = cores[inicial.charCodeAt(0) % cores.length];
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
      {inicial}
    </div>
  );
}

export default function Master() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios]   = useState([]);
  const [estacao, setEstacao]     = useState(null);
  const [mensagem, setMensagem]   = useState('');
  const [erro, setErro]           = useState('');
  const [filtro, setFiltro]       = useState('todos');
  const [busca, setBusca]         = useState('');
  const [carregando, setCarregando] = useState({});

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && !['master', 'admin'].includes(user.perfil)) router.push('/');
  }, [loading, user]);

  useEffect(() => {
    if (!loading && user) buscarDados();
  }, [loading, user]);

  async function buscarDados() {
    try {
      const res  = await apiFetch('/api/master/estacao');
      const data = await res.json();
      if (!res.ok) { setErro(data.erro || 'Erro ao carregar dados.'); return; }
      setEstacao(data.estacao);
      setUsuarios(data.usuarios);
    } catch (err) {
      setErro('Erro ao carregar dados: ' + err.message);
    }
  }

  async function alterarAcesso(usuario_id, acao) {
    setErro(''); setMensagem('');
    setCarregando(c => ({ ...c, [usuario_id]: true }));
    try {
      const res  = await apiFetch('/api/master/acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id, acao }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro); return; }
      setMensagem(data.mensagem);
      await buscarDados();
    } finally {
      setCarregando(c => ({ ...c, [usuario_id]: false }));
    }
  }

  /* ── loading ── */
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} className="loading-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: C5 }} />)}
        </div>
      </main>
    );
  }

  const liberados      = usuarios.filter(u => u.vinculado);
  const pendentes      = usuarios.filter(u => !u.vinculado);
  const listaBase      = filtro === 'liberados' ? liberados : filtro === 'pendentes' ? pendentes : usuarios;
  const listaFiltrada  = busca.trim()
    ? listaBase.filter(u => u.nome?.toLowerCase().includes(busca.toLowerCase()) || u.email?.toLowerCase().includes(busca.toLowerCase()))
    : listaBase;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .station-hero  { flex-direction: column !important; }
          .hero-access   { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(71,113,163,0.2) !important; padding-top: 20px !important; }
          .stats-row     { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-row     { grid-template-columns: 1fr !important; }
          .hide-xs       { display: none !important; }
        }
        .user-row:hover td { background: rgba(71,113,163,0.06) !important; }
        .action-liberar { background: rgba(22,101,52,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.25); border-radius: 7px; padding: 5px 14px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: background 0.2s; }
        .action-liberar:hover:not(:disabled) { background: rgba(22,101,52,0.35); }
        .action-revogar { background: rgba(127,29,29,0.2); color: #e7a8b1; border: 1px solid rgba(231,168,177,0.25); border-radius: 7px; padding: 5px 14px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: background 0.2s; }
        .action-revogar:hover:not(:disabled) { background: rgba(127,29,29,0.35); }
        .action-liberar:disabled, .action-revogar:disabled { opacity: 0.45; cursor: not-allowed; }
        .tab-btn { background: transparent; border: none; border-radius: 7px; padding: 6px 14px; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.18s; }
        .tab-btn.active  { background: ${C5}; color: #fff; }
        .tab-btn.inactive{ color: ${C4}; }
        .tab-btn.inactive:hover { background: rgba(119,119,157,0.12); }
        .search-input { background: rgba(10,15,30,0.7); border: 1.5px solid rgba(119,119,157,0.2); border-radius: 8px; padding: 7px 12px; color: #e2e8f0; font-size: 0.85rem; outline: none; transition: border-color 0.2s; width: 220px; }
        .search-input:focus { border-color: ${C5}; }
        .search-input::placeholder { color: rgba(119,119,157,0.45); }
        .dash-portal:hover { background: rgba(71,113,163,0.25) !important; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(71,113,163,0.25); }
        .dash-portal { transition: background 0.2s, transform 0.2s, box-shadow 0.2s; }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#0a0f1e' }}>

        {/* ── Topbar ── */}
        <header style={{ background: 'rgba(11,18,33,0.97)', borderBottom: '1px solid rgba(119,119,157,0.15)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>📡</span>
            <div>
              <span style={{ color: C1, fontWeight: 700, fontSize: '0.95rem' }}>Painel Master</span>
              <span style={{ color: C4, fontSize: '0.72rem', display: 'block', lineHeight: 1 }}>Monitor IoT</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: C1, fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>{user?.name}</p>
              <span style={{ background: 'rgba(146,64,14,0.3)', color: '#fcd34d', borderRadius: 20, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 600 }}>Master</span>
            </div>
            <button className="btn-danger" onClick={() => signOut().then(() => router.push('/'))} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              Sair
            </button>
          </div>
        </header>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 48px' }}>

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

          {/* ══════════════════════════════════════════
              HERO — Acesso ao dashboard
          ══════════════════════════════════════════ */}
          {estacao ? (
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(71,113,163,0.25)', marginBottom: 22, background: 'linear-gradient(135deg, #0d1a30 0%, #112240 60%, #0f1e3a 100%)' }}>

              {/* Faixa superior */}
              <div style={{ height: 4, background: `linear-gradient(90deg, ${C5}, ${C3}, ${C2})` }} />

              <div className="station-hero" style={{ display: 'flex', alignItems: 'stretch' }}>

                {/* Info da estação */}
                <div style={{ flex: 1, padding: '28px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(71,113,163,0.2)', border: '1px solid rgba(71,113,163,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      🏭
                    </div>
                    <div>
                      <h1 style={{ color: C1, fontWeight: 800, fontSize: '1.4rem', margin: '0 0 2px' }}>{estacao.nome}</h1>
                      <p style={{ color: C4, fontSize: '0.82rem', margin: 0 }}>📍 {estacao.localizacao || 'Sem localização definida'}</p>
                    </div>
                  </div>

                  {/* Metadados em grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'ID da Estação',    value: estacao.id?.slice(0, 12) + '...', mono: true },
                      { label: 'Criada em',        value: estacao.criado_em ? new Date(estacao.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                      { label: 'Usuários ativos',  value: `${liberados.length} de ${usuarios.length}` },
                      { label: 'Seu perfil',       value: 'Master', badge: true },
                    ].map((m, i) => (
                      <div key={i} style={{ background: 'rgba(10,15,30,0.4)', border: '1px solid rgba(119,119,157,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                        <p style={{ color: C4, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{m.label}</p>
                        {m.badge
                          ? <span style={{ background: 'rgba(146,64,14,0.3)', color: '#fcd34d', borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>⭐ {m.value}</span>
                          : <p style={{ color: m.mono ? C3 : C1, fontWeight: 600, fontSize: '0.88rem', margin: 0, fontFamily: m.mono ? 'monospace' : 'inherit' }}>{m.value}</p>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portal de acesso ao dashboard */}
                <div className="hero-access" style={{ width: 220, padding: '28px 24px', borderLeft: '1px solid rgba(71,113,163,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: C4, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Monitoramento</p>
                    <p style={{ color: C3, fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                      Visualize leituras, gráficos e alertas da estação em tempo real.
                    </p>
                  </div>

                  <button
                    className="dash-portal"
                    onClick={() => router.push(`/dashboard/${estacao.id}`)}
                    style={{ width: '100%', background: 'rgba(71,113,163,0.18)', border: '1.5px solid rgba(71,113,163,0.4)', borderRadius: 12, padding: '16px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                  >
                    <span style={{ fontSize: '2rem' }}>📊</span>
                    <span style={{ color: C1, fontWeight: 700, fontSize: '0.9rem' }}>Abrir Dashboard</span>
                    <span style={{ color: C5, fontSize: '0.75rem' }}>Ver dados ao vivo →</span>
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 22, textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>📡</p>
              <p style={{ color: C4 }}>Nenhuma estação vinculada ao seu perfil master.</p>
            </div>
          )}

          {/* ── Stats ── */}
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
            {[
              { label: 'Total de usuários', value: usuarios.length,   icon: '👥', color: C3 },
              { label: 'Acessos liberados', value: liberados.length,  icon: '✅', color: '#34d399' },
              { label: 'Aguardando acesso', value: pendentes.length,  icon: '⏳', color: '#fcd34d' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(71,113,163,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ color: s.color, fontWeight: 800, fontSize: '1.7rem', lineHeight: 1, margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ color: C4, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              TABELA DE GERENCIAMENTO
          ══════════════════════════════════════════ */}
          <div style={{ background: '#0f1829', border: '1px solid rgba(119,119,157,0.15)', borderRadius: 16, overflow: 'hidden' }}>

            {/* Cabeçalho da seção */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(119,119,157,0.12)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: C1, fontWeight: 700, fontSize: '1rem', margin: '0 0 2px' }}>Gerenciar Acessos</h2>
                <p style={{ color: C4, fontSize: '0.75rem', margin: 0 }}>Libere ou revogue o acesso dos usuários cadastrados à esta estação</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Busca */}
                <input
                  className="search-input"
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
                {/* Filtro */}
                <div style={{ display: 'flex', gap: 3, background: 'rgba(10,15,30,0.6)', borderRadius: 9, padding: 3 }}>
                  {[
                    { key: 'todos',     label: `Todos (${usuarios.length})` },
                    { key: 'liberados', label: `Liberados (${liberados.length})` },
                    { key: 'pendentes', label: `Pendentes (${pendentes.length})` },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`tab-btn ${filtro === f.key ? 'active' : 'inactive'}`}
                      onClick={() => setFiltro(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabela */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(119,119,157,0.12)' }}>
                    <th style={{ padding: '11px 20px', textAlign: 'left', color: C4, fontWeight: 600, fontSize: '0.71rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Usuário</th>
                    <th className="hide-xs" style={{ padding: '11px 16px', textAlign: 'left', color: C4, fontWeight: 600, fontSize: '0.71rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>E-mail</th>
                    <th style={{ padding: '11px 16px', textAlign: 'center', color: C4, fontWeight: 600, fontSize: '0.71rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                    <th style={{ padding: '11px 16px', textAlign: 'center', color: C4, fontWeight: 600, fontSize: '0.71rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acesso ao dashboard</th>
                    <th style={{ padding: '11px 20px', textAlign: 'right', color: C4, fontWeight: 600, fontSize: '0.71rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: C4, fontSize: '0.875rem' }}>
                        {busca ? `Nenhum resultado para "${busca}"` : 'Nenhum usuário nesta categoria.'}
                      </td>
                    </tr>
                  ) : (
                    listaFiltrada.map((u, idx) => (
                      <tr key={u.id} className="user-row" style={{ borderBottom: '1px solid rgba(119,119,157,0.07)', background: idx % 2 === 0 ? 'rgba(17,24,39,0.4)' : 'rgba(10,15,30,0.2)' }}>

                        {/* Usuário: avatar + nome */}
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar nome={u.nome} />
                            <div>
                              <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1px' }}>{u.nome}</p>
                              <p className="hide-xs" style={{ display: 'none' }} />
                              <p style={{ color: C4, fontSize: '0.75rem', margin: 0 }}>{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* E-mail (hidden on xs, shown above inline on xs) */}
                        <td className="hide-xs" style={{ padding: '13px 16px', color: C4, fontSize: '0.82rem' }}>{u.email}</td>

                        {/* Status */}
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                          {u.vinculado ? (
                            <span style={{ background: 'rgba(22,101,52,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              ● Liberado
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(146,64,14,0.2)', color: '#fcd34d', border: '1px solid rgba(252,211,77,0.2)', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              ○ Pendente
                            </span>
                          )}
                        </td>

                        {/* Acesso ao dashboard */}
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                          {u.vinculado && estacao ? (
                            <button
                              onClick={() => router.push(`/dashboard/${estacao.id}`)}
                              style={{ background: 'rgba(71,113,163,0.12)', color: C5, border: '1px solid rgba(71,113,163,0.25)', borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'background 0.2s', whiteSpace: 'nowrap' }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(71,113,163,0.25)'}
                              onMouseOut={e => e.currentTarget.style.background = 'rgba(71,113,163,0.12)'}
                            >
                              📊 Ver dashboard
                            </button>
                          ) : (
                            <span style={{ color: 'rgba(119,119,157,0.3)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>

                        {/* Ação */}
                        <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                          {u.vinculado ? (
                            <button
                              className="action-revogar"
                              disabled={!!carregando[u.id]}
                              onClick={() => alterarAcesso(u.id, 'revogar')}
                            >
                              {carregando[u.id] ? '...' : 'Revogar acesso'}
                            </button>
                          ) : (
                            <button
                              className="action-liberar"
                              disabled={!!carregando[u.id]}
                              onClick={() => alterarAcesso(u.id, 'liberar')}
                            >
                              {carregando[u.id] ? '...' : 'Liberar acesso'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé da tabela */}
            {listaFiltrada.length > 0 && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(119,119,157,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: C4, fontSize: '0.75rem' }}>
                  Exibindo <strong style={{ color: C3 }}>{listaFiltrada.length}</strong> de {usuarios.length} usuários
                  {busca && <span> · filtrado por "<strong style={{ color: C1 }}>{busca}</strong>"</span>}
                </span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: C4, fontSize: '0.75rem' }}>
                    Liberados: <strong style={{ color: '#34d399' }}>{liberados.length}</strong>
                  </span>
                  <span style={{ color: C4, fontSize: '0.75rem' }}>
                    Pendentes: <strong style={{ color: '#fcd34d' }}>{pendentes.length}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
