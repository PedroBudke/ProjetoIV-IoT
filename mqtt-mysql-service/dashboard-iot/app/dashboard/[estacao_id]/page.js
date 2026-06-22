'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine,
} from 'recharts';

const C1 = '#fdefb0';
const C2 = '#e7a8b1';
const C3 = '#b998b3';
const C4 = '#77779d';
const C5 = '#4771a3';
const GRID = 'rgba(119,119,157,0.1)';
const TICK = { fill: C4, fontSize: 11 };

/* ─── Tooltip reutilizável ─── */
function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1829', border: '1px solid rgba(119,119,157,0.25)', borderRadius: 8, padding: '9px 13px', fontSize: '0.8rem' }}>
      <p style={{ color: C4, margin: '0 0 5px', fontSize: '0.75rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{unit || ''}
        </p>
      ))}
    </div>
  );
}

/* ─── Cabeçalho de cada gráfico ─── */
function ChartHeader({ title, subtitle, color }) {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <h3 style={{ color: C1, fontWeight: 600, fontSize: '0.95rem', margin: '0 0 2px' }}>{title}</h3>
        <p style={{ color: C4, fontSize: '0.75rem', margin: 0 }}>{subtitle}</p>
      </div>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', marginTop: 4, flexShrink: 0 }} />
    </div>
  );
}

/* ─── Helpers estatísticos ─── */
function calcStats(leituras, campo) {
  const vals = leituras.map(l => l[campo]).filter(v => typeof v === 'number');
  if (!vals.length) return { media: '—', max: '—', min: '—' };
  const soma = vals.reduce((a, b) => a + b, 0);
  return {
    media: (soma / vals.length).toFixed(1),
    max:   Math.max(...vals).toFixed(1),
    min:   Math.min(...vals).toFixed(1),
  };
}

function tendencia(atual, anterior) {
  if (atual == null || anterior == null) return null;
  const diff = atual - anterior;
  if (Math.abs(diff) < 0.2) return { icon: '→', color: C4 };
  return diff > 0 ? { icon: '↑', color: '#f87171' } : { icon: '↓', color: '#34d399' };
}

/* ─── Gradiente SVG inline (defs compartilhados) ─── */
function Gradientes() {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C5}  stopOpacity={0.3} />
          <stop offset="100%" stopColor={C5}  stopOpacity={0}   />
        </linearGradient>
        <linearGradient id="gradUmid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C3}  stopOpacity={0.3} />
          <stop offset="100%" stopColor={C3}  stopOpacity={0}   />
        </linearGradient>
        <linearGradient id="gradQar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C2}  stopOpacity={0.35} />
          <stop offset="100%" stopColor={C2}  stopOpacity={0}    />
        </linearGradient>
        <linearGradient id="gradTempNorm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C5}  stopOpacity={0.15} />
          <stop offset="100%" stopColor={C5}  stopOpacity={0}    />
        </linearGradient>
        <linearGradient id="gradUmidNorm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C3}  stopOpacity={0.15} />
          <stop offset="100%" stopColor={C3}  stopOpacity={0}    />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DashboardEstacao() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { estacao_id } = useParams();

  const [leituras, setLeituras]               = useState([]);
  const [estacao, setEstacao]                 = useState(null);
  const [acesso, setAcesso]                   = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [countdown, setCountdown]             = useState(15);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    buscarDados();
    const intervalo = setInterval(() => {
      buscarDados();
      setCountdown(15);
    }, 15000);
    const tick = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 15)), 1000);
    return () => { clearInterval(intervalo); clearInterval(tick); };
  }, [loading, user]);

  async function buscarDados() {
    try {
      const [lr, er] = await Promise.all([
        apiFetch(`/api/leituras?estacao_id=${estacao_id}`),
        apiFetch(`/api/admin/estacoes/${estacao_id}`),
      ]);
      if (lr.status === 403 || er.status === 403) { setAcesso(false); return; }
      const [ld, ed] = await Promise.all([lr.json(), er.json()]);
      setLeituras(ld);
      setEstacao(ed);
      setUltimaAtualizacao(new Date());
    } catch (err) {
      console.error('Erro ao buscar dados:', err.message);
    }
  }

  function voltarPainel() {
    const p = user?.perfil;
    if (p === 'admin') router.push('/admin');
    else if (p === 'master') router.push('/master');
    else router.push('/');
  }

  /* ── Estados de carregamento / acesso ── */
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} className="loading-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: C5 }} />)}
        </div>
      </main>
    );
  }

  if (!acesso) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="glass" style={{ maxWidth: 420, width: '100%', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <h1 style={{ color: C1, fontWeight: 700, fontSize: '1.3rem', marginBottom: 8 }}>Acesso negado</h1>
          <p style={{ color: C4, fontSize: '0.875rem', marginBottom: 28 }}>Você não tem permissão para acessar esta estação.</p>
          <button onClick={voltarPainel} className="btn-primary" style={{ width: '100%' }}>Voltar ao painel</button>
        </div>
      </main>
    );
  }

  /* ── Dados derivados ── */
  const ultima   = leituras[0];
  const penult   = leituras[1];
  const temAlerta = ultima?.alerta;

  const statTemp = calcStats(leituras, 'temperatura');
  const statUmid = calcStats(leituras, 'umidade');
  const statQar  = calcStats(leituras, 'qualidade_ar');

  // Ordem cronológica para gráficos
  const cronologico = [...leituras].reverse().map(l => ({
    hora:         l.data_hora ? new Date(l.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
    temperatura:  typeof l.temperatura  === 'number' ? +l.temperatura.toFixed(1)  : null,
    umidade:      typeof l.umidade      === 'number' ? +l.umidade.toFixed(1)      : null,
    qualidade_ar: typeof l.qualidade_ar === 'number' ? +l.qualidade_ar.toFixed(0) : null,
    alerta:       l.alerta,
  }));

  // Dados normalizados para correlação (0-100)
  const norm = (v, min, max) => (max === min || v == null) ? 50 : +((v - min) / (max - min) * 100).toFixed(1);
  const allT  = leituras.map(l => l.temperatura).filter(Number.isFinite);
  const allU  = leituras.map(l => l.umidade).filter(Number.isFinite);
  const allQ  = leituras.map(l => l.qualidade_ar).filter(Number.isFinite);
  const [minT, maxT] = [Math.min(...allT), Math.max(...allT)];
  const [minU, maxU] = [Math.min(...allU), Math.max(...allU)];
  const [minQ, maxQ] = [Math.min(...allQ), Math.max(...allQ)];

  const correlacao = cronologico.map(l => ({
    hora:          l.hora,
    temperatura:   norm(l.temperatura,  minT, maxT),
    umidade:       norm(l.umidade,      minU, maxU),
    qualidade_ar:  norm(l.qualidade_ar, minQ, maxQ),
  }));

  const semDados = leituras.length === 0;

  return (
    <>
      <style>{`
        @media (max-width: 900px) { .charts-trio { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .stat-grid { grid-template-columns: 1fr 1fr !important; } .hide-mobile { display:none !important; } }
        .row-even { background: rgba(17,24,39,0.6); }
        .row-odd  { background: rgba(10,15,30,0.4); }
        .tr-hover:hover td { background: rgba(71,113,163,0.07) !important; }
        .sort-th { cursor: default; user-select: none; }
      `}</style>

      <Gradientes />

      <main style={{ minHeight: '100vh', background: '#0a0f1e' }}>

        {/* ── Topbar ── */}
        <header style={{ background: 'rgba(11,18,33,0.97)', borderBottom: '1px solid rgba(119,119,157,0.15)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={voltarPainel} style={{ background: 'rgba(119,119,157,0.12)', border: '1px solid rgba(119,119,157,0.2)', color: C4, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}>←</button>
            <div>
              <span style={{ color: C1, fontWeight: 700, fontSize: '0.95rem' }}>{estacao?.nome || 'Dashboard'}</span>
              {estacao?.localizacao && <span style={{ color: C4, fontSize: '0.72rem', display: 'block', lineHeight: 1, marginTop: 1 }}>📍 {estacao.localizacao}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Countdown */}
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(71,113,163,0.1)', border: '1px solid rgba(71,113,163,0.2)', borderRadius: 20, padding: '4px 10px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ color: C4, fontSize: '0.75rem' }}>Atualiza em {countdown}s</span>
            </div>
            <span style={{ color: C3, fontSize: '0.82rem' }}>{user?.name}</span>
            <button className="btn-danger" onClick={() => signOut().then(() => router.push('/'))} style={{ padding: '5px 12px', fontSize: '0.78rem' }}>Sair</button>
          </div>
        </header>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px 40px' }}>

          {/* ── Alerta ── */}
          {temAlerta && (
            <div style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(231,168,177,0.35)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <strong style={{ color: C2 }}>Alerta de qualidade do ar</strong>
                <span style={{ color: C4, fontSize: '0.82rem', marginLeft: 10 }}>Valor atual: <strong style={{ color: C2 }}>{ultima?.qualidade_ar}</strong> — acima do limite seguro</span>
              </div>
            </div>
          )}

          {semDados ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📡</p>
              <p style={{ color: C4, fontSize: '0.95rem' }}>Sem leituras disponíveis para esta estação ainda.</p>
            </div>
          ) : (
            <>
              {/* ── Cards de leitura atual ── */}
              <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>

                {/* Temperatura */}
                <div className="card" style={{ background: 'linear-gradient(135deg,rgba(71,113,163,0.18),rgba(71,113,163,0.04))', borderColor: 'rgba(71,113,163,0.35)', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: C4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temperatura</span>
                    <span style={{ fontSize: '1.1rem' }}>🌡️</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                    <span style={{ color: C5, fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>{ultima?.temperatura?.toFixed(1) ?? '—'}</span>
                    <span style={{ color: C4, fontSize: '0.85rem' }}>°C</span>
                    {tendencia(ultima?.temperatura, penult?.temperatura) && (
                      <span style={{ color: tendencia(ultima?.temperatura, penult?.temperatura).color, fontSize: '1rem', marginLeft: 4 }}>
                        {tendencia(ultima?.temperatura, penult?.temperatura).icon}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Mín <strong style={{ color: C3 }}>{statTemp.min}°</strong></span>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Média <strong style={{ color: C3 }}>{statTemp.media}°</strong></span>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Máx <strong style={{ color: C3 }}>{statTemp.max}°</strong></span>
                  </div>
                </div>

                {/* Umidade */}
                <div className="card" style={{ background: 'linear-gradient(135deg,rgba(185,152,179,0.15),rgba(185,152,179,0.03))', borderColor: 'rgba(185,152,179,0.3)', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: C4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Umidade</span>
                    <span style={{ fontSize: '1.1rem' }}>💧</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                    <span style={{ color: C3, fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>{ultima?.umidade?.toFixed(1) ?? '—'}</span>
                    <span style={{ color: C4, fontSize: '0.85rem' }}>%</span>
                    {tendencia(ultima?.umidade, penult?.umidade) && (
                      <span style={{ color: tendencia(ultima?.umidade, penult?.umidade).color, fontSize: '1rem', marginLeft: 4 }}>
                        {tendencia(ultima?.umidade, penult?.umidade).icon}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Mín <strong style={{ color: C3 }}>{statUmid.min}%</strong></span>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Média <strong style={{ color: C3 }}>{statUmid.media}%</strong></span>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Máx <strong style={{ color: C3 }}>{statUmid.max}%</strong></span>
                  </div>
                </div>

                {/* Qualidade do ar */}
                <div className="card" style={{ background: temAlerta ? 'rgba(127,29,29,0.2)' : 'linear-gradient(135deg,rgba(22,101,52,0.14),rgba(22,101,52,0.03))', borderColor: temAlerta ? 'rgba(231,168,177,0.3)' : 'rgba(134,239,172,0.2)', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: C4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qualidade do Ar</span>
                    <span style={{ fontSize: '1.1rem' }}>💨</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                    <span style={{ color: temAlerta ? C2 : '#34d399', fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>{ultima?.qualidade_ar?.toFixed(0) ?? '—'}</span>
                    {tendencia(ultima?.qualidade_ar, penult?.qualidade_ar) && (
                      <span style={{ color: tendencia(ultima?.qualidade_ar, penult?.qualidade_ar).color, fontSize: '1rem', marginLeft: 4 }}>
                        {tendencia(ultima?.qualidade_ar, penult?.qualidade_ar).icon}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Mín <strong style={{ color: C3 }}>{statQar.min}</strong></span>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Média <strong style={{ color: C3 }}>{statQar.media}</strong></span>
                    <span style={{ color: C4, fontSize: '0.72rem' }}>Máx <strong style={{ color: C3 }}>{statQar.max}</strong></span>
                  </div>
                </div>

                {/* Última leitura */}
                <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: C4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última leitura</span>
                    <span style={{ fontSize: '1.1rem' }}>🕐</span>
                  </div>
                  <div>
                    <p style={{ color: C1, fontWeight: 700, fontSize: '1.4rem', margin: '10px 0 2px' }}>
                      {ultima?.data_hora ? new Date(ultima.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </p>
                    <p style={{ color: C4, fontSize: '0.78rem', margin: 0 }}>
                      {ultima?.data_hora ? new Date(ultima.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    <span style={{ color: C4, fontSize: '0.73rem' }}>{leituras.length} leituras · atualiza a cada 15s</span>
                  </div>
                </div>
              </div>

              {/* ── Separador de seção ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px' }}>
                <span style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Gráficos individuais</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
              </div>

              {/* ── 3 gráficos individuais ── */}
              <div className="charts-trio" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

                {/* Temperatura */}
                <div className="card" style={{ padding: 18 }}>
                  <ChartHeader title="Temperatura" subtitle={`${statTemp.min}° – ${statTemp.max}°C  ·  média ${statTemp.media}°C`} color={C5} />
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart data={cronologico} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={C5} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C5} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="hora" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={TICK} axisLine={false} tickLine={false} domain={['auto','auto']} />
                      <Tooltip content={<ChartTooltip unit="°C" />} />
                      <Area type="monotone" dataKey="temperatura" name="Temperatura" stroke={C5} strokeWidth={2} fill="url(#gT)" dot={false} activeDot={{ r: 4, fill: C5, stroke: '#0a0f1e', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Umidade */}
                <div className="card" style={{ padding: 18 }}>
                  <ChartHeader title="Umidade" subtitle={`${statUmid.min}% – ${statUmid.max}%  ·  média ${statUmid.media}%`} color={C3} />
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart data={cronologico} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={C3} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C3} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="hora" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={TICK} axisLine={false} tickLine={false} domain={['auto','auto']} />
                      <Tooltip content={<ChartTooltip unit="%" />} />
                      <Area type="monotone" dataKey="umidade" name="Umidade" stroke={C3} strokeWidth={2} fill="url(#gU)" dot={false} activeDot={{ r: 4, fill: C3, stroke: '#0a0f1e', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Qualidade do Ar */}
                <div className="card" style={{ padding: 18 }}>
                  <ChartHeader title="Qualidade do Ar" subtitle={`${statQar.min} – ${statQar.max}  ·  média ${statQar.media}`} color={C2} />
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart data={cronologico} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={C2} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C2} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="hora" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={TICK} axisLine={false} tickLine={false} domain={['auto','auto']} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={300} stroke="rgba(231,168,177,0.4)" strokeDasharray="4 3" label={{ value: 'Limite', fill: C2, fontSize: 10, position: 'insideTopRight' }} />
                      <Area type="monotone" dataKey="qualidade_ar" name="Qualidade do Ar" stroke={C2} strokeWidth={2} fill="url(#gQ)" dot={false} activeDot={{ r: 4, fill: C2, stroke: '#0a0f1e', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Separador de correlação ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px' }}>
                <span style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Correlação entre sensores</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
              </div>

              {/* ── Gráfico de correlação ── */}
              <div className="card" style={{ marginBottom: 20, padding: 22 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ color: C1, fontWeight: 600, fontSize: '0.95rem', margin: '0 0 4px' }}>Visão Correlacionada</h3>
                    <p style={{ color: C4, fontSize: '0.75rem', margin: 0 }}>
                      Todos os sensores normalizados em escala 0–100% para comparação de tendências simultâneas
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { color: C5,  label: 'Temperatura' },
                      { color: C3,  label: 'Umidade' },
                      { color: C2,  label: 'Qualidade do Ar' },
                    ].map((l, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: C4 }}>
                        <span style={{ width: 20, height: 2, background: l.color, display: 'inline-block', borderRadius: 1 }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={correlacao} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={C2} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={C2} stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis dataKey="hora" tick={TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<ChartTooltip unit="%" />} />
                    {/* Qualidade do ar como área de fundo */}
                    <Area type="monotone" dataKey="qualidade_ar" name="Qualidade do Ar" stroke="none" fill="url(#gCq)" dot={false} />
                    {/* Temperatura como linha sólida */}
                    <Line type="monotone" dataKey="temperatura" name="Temperatura" stroke={C5} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: C5 }} />
                    {/* Umidade como linha tracejada */}
                    <Line type="monotone" dataKey="umidade" name="Umidade" stroke={C3} strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4, fill: C3 }} />
                  </ComposedChart>
                </ResponsiveContainer>

                <p style={{ color: C4, fontSize: '0.72rem', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(119,119,157,0.1)', margin: '14px 0 0' }}>
                  💡 Área sombreada representa a qualidade do ar (normalizada). Quando temperatura sobe e umidade desce (ou vice-versa), a correlação inversa fica evidente nas linhas.
                </p>
              </div>

              {/* ── Separador tabela ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px' }}>
                <span style={{ color: C3, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Histórico de registros</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
                <span style={{ color: C4, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{leituras.length} registros</span>
              </div>

              {/* ── Tabela ── */}
              <div style={{ background: '#0f1829', border: '1px solid rgba(119,119,157,0.15)', borderRadius: 14, overflow: 'hidden' }}>

                {/* Cabeçalho da tabela */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(71,113,163,0.1)', borderBottom: '1px solid rgba(119,119,157,0.2)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: C4, fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>#</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: C4, fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Data / Hora</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: C5,  fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>🌡️ Temp.</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: C3,  fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>💧 Umidade</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: C2,  fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>💨 Qualidade do Ar</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: C4,  fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Tendência</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: C4,  fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leituras.map((l, idx) => {
                        const prev = leituras[idx + 1];
                        const tTend = tendencia(l.temperatura,  prev?.temperatura);
                        const uTend = tendencia(l.umidade,      prev?.umidade);
                        const qTend = tendencia(l.qualidade_ar, prev?.qualidade_ar);
                        const isEven = idx % 2 === 0;

                        return (
                          <tr key={l.id} className="tr-hover" style={{ borderBottom: '1px solid rgba(119,119,157,0.07)', background: isEven ? 'rgba(17,24,39,0.5)' : 'rgba(10,15,30,0.3)' }}>

                            {/* # */}
                            <td style={{ padding: '11px 16px', color: 'rgba(119,119,157,0.4)', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
                              {leituras.length - idx}
                            </td>

                            {/* Data / hora */}
                            <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                              {l.data_hora ? (
                                <div>
                                  <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.82rem' }}>
                                    {new Date(l.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                  <span style={{ color: C4, fontSize: '0.72rem', display: 'block', lineHeight: 1.2 }}>
                                    {new Date(l.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              ) : '—'}
                            </td>

                            {/* Temperatura */}
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                              <span style={{ background: 'rgba(71,113,163,0.15)', color: C5, borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: '0.85rem', display: 'inline-block' }}>
                                {l.temperatura?.toFixed(1) ?? '—'}°C
                              </span>
                            </td>

                            {/* Umidade */}
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                              <span style={{ background: 'rgba(185,152,179,0.15)', color: C3, borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: '0.85rem', display: 'inline-block' }}>
                                {l.umidade?.toFixed(1) ?? '—'}%
                              </span>
                            </td>

                            {/* Qualidade do ar */}
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                              <span style={{ background: l.alerta ? 'rgba(127,29,29,0.25)' : 'rgba(22,101,52,0.15)', color: l.alerta ? C2 : '#34d399', borderRadius: 6, padding: '3px 10px', fontWeight: 600, fontSize: '0.85rem', display: 'inline-block' }}>
                                {l.qualidade_ar?.toFixed(0) ?? '—'}
                              </span>
                            </td>

                            {/* Tendência */}
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                              {idx < leituras.length - 1 ? (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                  <span title="Temperatura" style={{ color: tTend?.color, fontSize: '0.85rem', fontWeight: 700 }}>{tTend?.icon ?? '—'}</span>
                                  <span title="Umidade"     style={{ color: uTend?.color, fontSize: '0.85rem', fontWeight: 700 }}>{uTend?.icon ?? '—'}</span>
                                  <span title="Qualidade"   style={{ color: qTend?.color, fontSize: '0.85rem', fontWeight: 700 }}>{qTend?.icon ?? '—'}</span>
                                </div>
                              ) : (
                                <span style={{ color: 'rgba(119,119,157,0.3)', fontSize: '0.75rem' }}>—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                              {l.alerta
                                ? <span style={{ background: 'rgba(127,29,29,0.3)', color: C2, border: '1px solid rgba(231,168,177,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: '0.73rem', fontWeight: 600, whiteSpace: 'nowrap' }}>⚠️ Alerta</span>
                                : <span style={{ background: 'rgba(22,101,52,0.25)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.73rem', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Normal</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé da tabela */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(119,119,157,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: C4, fontSize: '0.75rem' }}>
                    Exibindo os últimos <strong style={{ color: C3 }}>{leituras.length}</strong> registros
                  </span>
                  <span style={{ color: C4, fontSize: '0.75rem' }}>
                    Alertas: <strong style={{ color: C2 }}>{leituras.filter(l => l.alerta).length}</strong> de {leituras.length}
                  </span>
                </div>
              </div>

            </>
          )}
        </div>
      </main>
    </>
  );
}
