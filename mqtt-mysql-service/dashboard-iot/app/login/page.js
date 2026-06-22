'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

const C1 = '#fdefb0';
const C2 = '#e7a8b1';
const C3 = '#b998b3';
const C4 = '#77779d';
const C5 = '#4771a3';

function emailValido(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function redirecionar(router, token) {
  const res  = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  if (res.status === 403 || data.inativo) {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    router.push('/sem-acesso?motivo=inativo');
    return;
  }
  if (!res.ok) throw new Error(data.erro || 'Erro ao buscar perfil.');

  if (data.perfil === 'admin')  { router.push('/admin');  return; }
  if (data.perfil === 'master') { router.push('/master'); return; }

  const vRes   = await fetch('/api/usuario/vinculo', { headers: { Authorization: `Bearer ${token}` } });
  const vinculo = await vRes.json();
  if (vinculo.temAcesso && vinculo.estacao_id) {
    router.push(`/dashboard/${vinculo.estacao_id}`);
  } else {
    router.push('/sem-acesso');
  }
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [senha, setSenha]           = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro]             = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erroEmail, setErroEmail]   = useState('');

  function validarEmail(v) {
    setEmail(v);
    setErroEmail(v && !emailValido(v) ? 'E-mail inválido' : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailValido(email)) { setErroEmail('E-mail inválido'); return; }
    setErro(''); setCarregando(true);
    try {
      const cred  = await signInWithEmailAndPassword(auth, email, senha);
      const token = await cred.user.getIdToken();
      await redirecionar(router, token);
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'E-mail ou senha inválidos.'
        : err.message || 'Erro ao entrar.';
      setErro(msg);
    } finally { setCarregando(false); }
  }

  async function handleOAuth(Provider) {
    setErro(''); setCarregando(true);
    try {
      const cred  = await signInWithPopup(auth, new Provider());
      const token = await cred.user.getIdToken();
      await redirecionar(router, token);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErro(err.message || 'Erro ao entrar com provedor externo.');
      }
    } finally { setCarregando(false); }
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) { .auth-left { display: none !important; } }
        .auth-input {
          width: 100%; background: #0d1526;
          border: 1.5px solid rgba(119,119,157,0.25); border-radius: 10px;
          padding: 12px 14px; color: #e2e8f0; font-size: 0.9rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .auth-input:focus { border-color: ${C5}; box-shadow: 0 0 0 3px rgba(71,113,163,0.18); }
        .auth-input.erro  { border-color: ${C2}; }
        .auth-input::placeholder { color: rgba(119,119,157,0.5); }
        .auth-btn {
          width: 100%; padding: 13px; background: ${C5}; color: white; border: none;
          border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer;
          transition: background 0.2s; margin-top: 4px;
        }
        .auth-btn:hover:not(:disabled) { background: #3a5f8a; }
        .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .oauth-btn {
          width: 100%; padding: 11px; background: rgba(119,119,157,0.08);
          border: 1.5px solid rgba(119,119,157,0.2); border-radius: 10px;
          color: #e2e8f0; font-size: 0.875rem; font-weight: 500; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background 0.2s, border-color 0.2s;
        }
        .oauth-btn:hover:not(:disabled) { background: rgba(119,119,157,0.16); border-color: rgba(119,119,157,0.35); }
        .oauth-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .toggle-senha { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: ${C4}; cursor: pointer; font-size: 1rem; padding: 0; }
      `}</style>

      <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1829 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 860, display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(119,119,157,0.15)' }}>

          {/* Painel esquerdo */}
          <div className="auth-left" style={{ flex: '0 0 340px', background: 'linear-gradient(160deg, #0f1e3a 0%, #152d52 60%, #1a3660 100%)', padding: '48px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(71,113,163,0.2)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
                <span style={{ fontSize: '1.8rem' }}>🌡️</span>
                <span style={{ color: C1, fontWeight: 700, fontSize: '1.1rem' }}>Monitor IoT</span>
              </div>
              <h2 style={{ color: C1, fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3, marginBottom: 12 }}>Monitoramento ambiental em tempo real</h2>
              <p style={{ color: C4, fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 36 }}>Acesse seu painel e acompanhe os dados dos sensores da sua estação.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[['🌡️','Temperatura em tempo real'],['💧','Umidade do ambiente'],['💨','Qualidade do ar com alertas'],['📊','Gráficos históricos']].map(([icon, label], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(71,113,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{icon}</div>
                    <span style={{ color: C3, fontSize: '0.85rem' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ color: 'rgba(119,119,157,0.4)', fontSize: '0.75rem' }}>Monitor IoT — Projeto de Monitoramento Ambiental</p>
          </div>

          {/* Painel direito */}
          <div style={{ flex: 1, background: '#111827', padding: 'clamp(32px, 6vw, 56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}>

              <h1 style={{ color: C1, fontWeight: 700, fontSize: '1.6rem', marginBottom: 6 }}>Bem-vindo de volta</h1>
              <p style={{ color: C4, fontSize: '0.875rem', marginBottom: 28 }}>Entre com suas credenciais para acessar o painel.</p>

              {erro && (
                <div style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(231,168,177,0.3)', borderRadius: 10, padding: '11px 14px', marginBottom: 20, color: C2, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠️ {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ color: C3, fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>E-mail</label>
                  <input className={`auth-input${erroEmail ? ' erro' : ''}`} type="email" value={email} onChange={e => validarEmail(e.target.value)} placeholder="seu@email.com" required />
                  {erroEmail && <p style={{ color: C2, fontSize: '0.75rem', marginTop: 4 }}>⚠ {erroEmail}</p>}
                </div>
                <div>
                  <label style={{ color: C3, fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input className="auth-input" type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 42 }} />
                    <button type="button" className="toggle-senha" onClick={() => setMostrarSenha(v => !v)} tabIndex={-1}>{mostrarSenha ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={carregando || !!erroEmail}>
                  {carregando ? 'Entrando...' : 'Entrar →'}
                </button>
              </form>

              {/* Divisor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
                <span style={{ color: C4, fontSize: '0.75rem' }}>ou entre com</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(119,119,157,0.15)' }} />
              </div>

              {/* OAuth */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="oauth-btn" disabled={carregando} onClick={() => handleOAuth(GoogleAuthProvider)}>
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continuar com Google
                </button>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(119,119,157,0.12)' }}>
                <p style={{ textAlign: 'center', color: C4, fontSize: '0.85rem', margin: 0 }}>
                  Não tem conta?{' '}
                  <Link href="/cadastro" style={{ color: C1, textDecoration: 'none', fontWeight: 600 }}>Cadastrar-se</Link>
                </p>
                <p style={{ textAlign: 'center', marginTop: 10 }}>
                  <Link href="/" style={{ color: C5, textDecoration: 'none', fontSize: '0.8rem' }}>← Voltar ao início</Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
