import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function GET(request) {
  const user = await verificarAuth(request);
  if (!user || user.perfil !== 'admin') {
    return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const snap = await db.collection('estacoes').orderBy('criado_em', 'desc').get();
    return Response.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await verificarAuth(request);
  if (!user || user.perfil !== 'admin') {
    return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const { nome, localizacao } = await request.json();
    if (!nome) return Response.json({ erro: 'Nome é obrigatório.' }, { status: 400 });
    await db.collection('estacoes').add({
      nome,
      localizacao: localizacao || '',
      criado_em: new Date().toISOString(),
      ativo: true,
    });
    return Response.json({ mensagem: 'Estação criada com sucesso!' }, { status: 201 });
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}
