'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';
import { apiFetch } from '@/lib/api-fetch';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [leituras, setLeituras] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  async function buscarDados() {
    try {
      const res = await apiFetch('/api/leituras');
      const data = await res.json();
      if (!res.ok) return;
      setLeituras(data);
    } catch (err) {
      console.error('Erro ao buscar leituras:', err.message);
    }
  }

  useEffect(() => {
    if (!loading && user) {
      buscarDados();
      const intervalo = setInterval(buscarDados, 15000);
      return () => clearInterval(intervalo);
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <main style={{ minHeight:'100vh', background:'#0a0f1e', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', gap:8 }}>
          {[0,1,2].map(i => <div key={i} className="loading-dot" style={{ width:10, height:10, borderRadius:'50%', background:'#4771a3' }} />)}
        </div>
      </main>
    );
  }

  const ultima = leituras[0];

  return (
    <main style={{ minHeight:'100vh', background:'#0a0f1e' }}>
      <header style={{ background:'rgba(17,24,39,0.95)', borderBottom:'1px solid rgba(119,119,157,0.15)', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <span style={{ color:'#fdefb0', fontWeight:700 }}>🌡️ Monitor IoT</span>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:'#77779d', fontSize:'0.85rem' }}>{user?.name}</span>
          <button className="btn-danger" onClick={() => signOut().then(() => router.push('/'))} style={{ padding:'6px 14px', fontSize:'0.8rem' }}>Sair</button>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 16px' }}>
        {ultima ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
            <div className="card"><p className="stat-label" style={{marginBottom:8}}>🌡️ Temperatura</p><p className="stat-value" style={{color:'#4771a3'}}>{ultima.temperatura?.toFixed(1)}°C</p></div>
            <div className="card"><p className="stat-label" style={{marginBottom:8}}>💧 Umidade</p><p className="stat-value" style={{color:'#b998b3'}}>{ultima.umidade?.toFixed(1)}%</p></div>
            <div className="card"><p className="stat-label" style={{marginBottom:8}}>💨 Qualidade do Ar</p><p className="stat-value" style={{color: ultima.alerta ? '#e7a8b1' : '#86efac'}}>{ultima.qualidade_ar?.toFixed(0)}</p></div>
            <div className="card"><p className="stat-label" style={{marginBottom:8}}>Status</p><div style={{marginTop:8}}>{ultima.alerta ? <span className="badge-alert">⚠️ Alerta</span> : <span className="badge-ok">✅ Normal</span>}</div></div>
          </div>
        ) : (
          <div className="card" style={{ textAlign:'center', padding:48 }}>
            <p style={{ color:'#77779d' }}>Aguardando leituras...</p>
          </div>
        )}

        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(119,119,157,0.15)' }}>
            <h2 className="section-title" style={{ margin:0 }}>Histórico de Leituras</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Temperatura</th>
                  <th>Umidade</th>
                  <th>Qualidade do Ar</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leituras.map((l) => (
                  <tr key={l.id}>
                    <td style={{ color:'#77779d', fontSize:'0.8rem' }}>{l.data_hora ? new Date(l.data_hora).toLocaleString('pt-BR') : '—'}</td>
                    <td style={{ color:'#4771a3', fontWeight:500 }}>{l.temperatura?.toFixed(1)}°C</td>
                    <td style={{ color:'#b998b3', fontWeight:500 }}>{l.umidade?.toFixed(1)}%</td>
                    <td style={{ color: l.alerta ? '#e7a8b1' : '#86efac', fontWeight:500 }}>{l.qualidade_ar?.toFixed(0)}</td>
                    <td>{l.alerta ? <span className="badge-alert">Alerta</span> : <span className="badge-ok">Normal</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
