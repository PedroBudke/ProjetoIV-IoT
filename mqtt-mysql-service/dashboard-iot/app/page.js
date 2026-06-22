import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0f1e 0%, #0f1829 50%, #111f38 100%)' }}>

      {/* Nav */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 32px', borderBottom:'1px solid rgba(119,119,157,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'1.4rem' }}>🌡️</span>
          <span style={{ color:'#fdefb0', fontWeight:700, fontSize:'1.1rem', letterSpacing:'0.02em' }}>Monitor IoT</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <Link href="/login" style={{ background:'rgba(71,113,163,0.2)', color:'#fdefb0', border:'1px solid rgba(71,113,163,0.4)', borderRadius:8, padding:'8px 20px', fontWeight:500, fontSize:'0.875rem', textDecoration:'none', transition:'background 0.2s' }}>
            Entrar
          </Link>
          <Link href="/cadastro" style={{ background:'#4771a3', color:'white', borderRadius:8, padding:'8px 20px', fontWeight:600, fontSize:'0.875rem', textDecoration:'none' }}>
            Cadastrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'80px 32px 60px', gap:24 }}>
        <div style={{ background:'rgba(71,113,163,0.12)', border:'1px solid rgba(71,113,163,0.25)', borderRadius:20, padding:'6px 16px', marginBottom:8 }}>
          <span style={{ color:'#b998b3', fontSize:'0.8rem', fontWeight:500 }}>Monitoramento em tempo real</span>
        </div>
        <h1 style={{ color:'#fdefb0', fontSize:'clamp(2rem,5vw,3.5rem)', fontWeight:800, lineHeight:1.15, maxWidth:700, margin:0 }}>
          Controle ambiental<br />
          <span style={{ background:'linear-gradient(90deg,#4771a3,#b998b3)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            em tempo real
          </span>
        </h1>
        <p style={{ color:'#77779d', fontSize:'1.05rem', maxWidth:520, lineHeight:1.7, margin:0 }}>
          Acompanhe temperatura, umidade e qualidade do ar coletados por sensores ESP32
          e visualize tudo em dashboards interativos e gráficos históricos.
        </p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <Link href="/cadastro" style={{ background:'#4771a3', color:'white', borderRadius:10, padding:'12px 32px', fontWeight:700, fontSize:'1rem', textDecoration:'none', boxShadow:'0 4px 20px rgba(71,113,163,0.4)' }}>
            Começar agora →
          </Link>
          <Link href="/login" style={{ background:'rgba(119,119,157,0.12)', color:'#b998b3', border:'1px solid rgba(119,119,157,0.2)', borderRadius:10, padding:'12px 32px', fontWeight:500, fontSize:'1rem', textDecoration:'none' }}>
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Stats banner */}
      <section style={{ display:'flex', justifyContent:'center', gap:0, padding:'0 32px 60px', flexWrap:'wrap' }}>
        {[
          { value:'Real-time', label:'Atualização automática a cada 15s' },
          { value:'3 Sensores', label:'Temperatura · Umidade · Qualidade do Ar' },
          { value:'Histórico', label:'Últimas 20 leituras por estação' },
        ].map((s, i) => (
          <div key={i} style={{ flex:'1 1 200px', textAlign:'center', padding:'24px 32px', borderRight: i < 2 ? '1px solid rgba(119,119,157,0.12)' : 'none' }}>
            <p style={{ color:'#fdefb0', fontWeight:700, fontSize:'1.3rem', margin:'0 0 4px' }}>{s.value}</p>
            <p style={{ color:'#77779d', fontSize:'0.8rem', margin:0 }}>{s.label}</p>
          </div>
        ))}
      </section>

      {/* Feature Cards */}
      <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20, padding:'0 32px 80px', maxWidth:1100, margin:'0 auto' }}>
        {[
          { icon:'🌡️', title:'Temperatura & Umidade', desc:'Dados do sensor DHT22 com precisão, enviados em tempo real via MQTT para o servidor.', color:'#e7a8b1' },
          { icon:'💨', title:'Qualidade do Ar', desc:'Monitoramento de gases pelo sensor MQ135 com alertas automáticos quando o limite é excedido.', color:'#b998b3' },
          { icon:'📊', title:'Gráficos históricos', desc:'Visualize a evolução das leituras ao longo do tempo com gráficos de linha e área interativos.', color:'#4771a3' },
          { icon:'🔗', title:'Multi-estação', desc:'Admins criam estações, masters gerenciam acessos, usuários visualizam os dados de sua estação.', color:'#fdefb0' },
        ].map((f, i) => (
          <div key={i} className="card card-hover" style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ width:44, height:44, background:'rgba(71,113,163,0.12)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>{f.icon}</div>
            <h3 style={{ color:'#fdefb0', fontWeight:600, fontSize:'1rem', margin:0 }}>{f.title}</h3>
            <p style={{ color:'#77779d', fontSize:'0.85rem', lineHeight:1.6, margin:0 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(119,119,157,0.12)', padding:'24px 32px', display:'flex', justifyContent:'center', alignItems:'center' }}>
        <p style={{ color:'#77779d', fontSize:'0.8rem', margin:0 }}>Monitor IoT — Projeto de Monitoramento Ambiental</p>
      </footer>
    </main>
  );
}
