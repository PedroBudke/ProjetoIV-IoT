'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
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

function forcaSenha(s) {
  if (!s) return null;
  let pts = 0;
  if (s.length >= 8)          pts++;
  if (/[A-Z]/.test(s))        pts++;
  if (/[0-9]/.test(s))        pts++;
  if (/[^A-Za-z0-9]/.test(s)) pts++;
  if (pts <= 1) return { label: 'Fraca',   color: C2,       w: '33%' };
  if (pts === 2) return { label: 'Média',   color: '#fcd34d', w: '66%' };
  return             { label: 'Forte',   color: '#34d399', w: '100%' };
}

export default function Cadastro() {
  const router = useRouter();
  const [form, setForm]               = useState({ nome: '', email: '', senha: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro]               = useState('');
  const [erros, setErros]             = useState({});
  const [carregando, setCarregando]   = useState(false);
  const [sucesso, setSucesso]         = useState(false);

  function validar(campo, valor) {
    const e = { ...erros };
    if (campo === 'email')  e.email = emailValido(valor) ? '' : 'E-mail inválido';
    if (campo === 'senha')  e.senha = valor.length >= 6  ? '' : 'Mínimo 6 caracteres';
    if (campo === 'nome')   e.nome  = valor.trim().length >= 2 ? '' : 'Nome muito curto';
    setErros(e);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    validar(name, value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Validação final
    const ev = {
      nome:  form.nome.trim().length  >= 2  ? '' : 'Nome muito curto',
      email: emailValido(form.email)         ? '' : 'E-mail inválido',
      senha: form.senha.length        >= 6   ? '' : 'Mínimo 6 caracteres',
    };
    setErros(ev);
    if (Object.values(ev).some(Boolean)) return;

    setErro(''); setCarregando(true);
    try {
      // 1. Cria usuário no Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.senha);
      await updateProfile(cred.user, { displayName: form.nome });

      // 2. Cria doc no Firestore via API
      const token = await cred.user.getIdToken();
      const res   = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: form.nome }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.erro || 'Erro no cadastro.');
      }

      // 3. Desloga (precisa aguardar liberação de acesso)
      await signOut(auth);
      setSucesso(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'E-mail já cadastrado.'
        : err.message || 'Erro ao criar conta.';
      setErro(msg);
    } finally { setCarregando(false); }
  }

  const forca = forcaSenha(form.senha);

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
              <h2 style={{ color: C1, fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3, marginBottom: 12 }}>Comece a monitorar seu ambiente agora</h2>
              <p style={{ color: C4, fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 36 }}>Crie sua conta e aguarde o acesso ser liberado pela sua estação.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['1','Crie sua conta'],['2','Aguarde a liberação do master'],['3','Acesse o dashboard da sua estação'],['4','Acompanhe os dados em tempo real']].map(([num, label], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(71,113,163,0.3)', border: '1px solid rgba(71,113,163,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: C1, flexShrink: 0 }}>{num}</div>
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

              {sucesso ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                  <h2 style={{ color: C1, fontWeight: 700, fontSize: '1.3rem', marginBottom: 8 }}>Conta criada!</h2>
                  <p style={{ color: C4, fontSize: '0.875rem' }}>Redirecionando para o login...</p>
                </div>
              ) : (
                <>
                  <h1 style={{ color: C1, fontWeight: 700, fontSize: '1.6rem', marginBottom: 6 }}>Criar conta</h1>
                  <p style={{ color: C4, fontSize: '0.875rem', marginBottom: 28 }}>Preencha os dados abaixo para se cadastrar.</p>

                  {erro && (
                    <div style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(231,168,177,0.3)', borderRadius: 10, padding: '11px 14px', marginBottom: 20, color: C2, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      ⚠️ {erro}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={{ color: C3, fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Nome completo</label>
                      <input className={`auth-input${erros.nome ? ' erro' : ''}`} type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome" required />
                      {erros.nome && <p style={{ color: C2, fontSize: '0.75rem', marginTop: 4 }}>⚠ {erros.nome}</p>}
                    </div>
                    <div>
                      <label style={{ color: C3, fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>E-mail</label>
                      <input className={`auth-input${erros.email ? ' erro' : ''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" required />
                      {erros.email && <p style={{ color: C2, fontSize: '0.75rem', marginTop: 4 }}>⚠ {erros.email}</p>}
                    </div>
                    <div>
                      <label style={{ color: C3, fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Senha</label>
                      <div style={{ position: 'relative' }}>
                        <input className={`auth-input${erros.senha ? ' erro' : ''}`} type={mostrarSenha ? 'text' : 'password'} name="senha" value={form.senha} onChange={handleChange} placeholder="Mínimo 6 caracteres" required style={{ paddingRight: 42 }} />
                        <button type="button" className="toggle-senha" onClick={() => setMostrarSenha(v => !v)} tabIndex={-1}>{mostrarSenha ? '🙈' : '👁️'}</button>
                      </div>
                      {form.senha && forca && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: C4, fontSize: '0.72rem' }}>Força da senha</span>
                            <span style={{ color: forca.color, fontSize: '0.72rem', fontWeight: 600 }}>{forca.label}</span>
                          </div>
                          <div style={{ height: 3, background: 'rgba(119,119,157,0.15)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: forca.w, background: forca.color, borderRadius: 2, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}
                      {erros.senha && <p style={{ color: C2, fontSize: '0.75rem', marginTop: 4 }}>⚠ {erros.senha}</p>}
                    </div>
                    <button type="submit" className="auth-btn" disabled={carregando}>
                      {carregando ? 'Criando conta...' : 'Criar conta →'}
                    </button>
                  </form>

                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(119,119,157,0.12)' }}>
                    <p style={{ textAlign: 'center', color: C4, fontSize: '0.85rem', margin: 0 }}>
                      Já tem conta?{' '}
                      <Link href="/login" style={{ color: C1, textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
                    </p>
                    <p style={{ textAlign: 'center', marginTop: 10 }}>
                      <Link href="/" style={{ color: C5, textDecoration: 'none', fontSize: '0.8rem' }}>← Voltar ao início</Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
