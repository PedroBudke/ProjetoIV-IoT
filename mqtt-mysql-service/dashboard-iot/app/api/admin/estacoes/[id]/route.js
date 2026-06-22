import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function GET(request, { params }) {
  const user = await verificarAuth(request);
  if (!user) return Response.json({ erro: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;

  if (user.perfil !== 'admin') {
    const vinculo = await db.collection('usuario_estacao')
      .where('usuario_id', '==', user.id)
      .where('estacao_id', '==', id)
      .get();
    if (vinculo.empty) return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
  }

  const doc = await db.collection('estacoes').doc(id).get();
  if (!doc.exists) return Response.json({ erro: 'Estação não encontrada.' }, { status: 404 });
  return Response.json({ id: doc.id, ...doc.data() });
}

export async function PATCH(request, { params }) {
  const user = await verificarAuth(request);
  if (!user || user.perfil !== 'admin') {
    return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const upd = {};
    if (body.nome        !== undefined) upd.nome        = body.nome;
    if (body.localizacao !== undefined) upd.localizacao = body.localizacao;
    if (body.ativo       !== undefined) upd.ativo       = body.ativo;
    if (!Object.keys(upd).length) return Response.json({ erro: 'Nada para atualizar.' }, { status: 400 });
    await db.collection('estacoes').doc(id).update(upd);
    return Response.json({ mensagem: 'Estação atualizada.' });
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}
