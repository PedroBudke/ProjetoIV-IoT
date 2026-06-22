import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function POST(request) {
  const user = await verificarAuth(request);
  if (!user || user.perfil !== 'admin') {
    return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
  }

  const { usuario_id, estacao_id, papel } = await request.json();
  if (!usuario_id || !estacao_id || !papel) {
    return Response.json({ erro: 'Preencha todos os campos.' }, { status: 400 });
  }

  const existente = await db.collection('usuario_estacao')
    .where('usuario_id', '==', usuario_id)
    .where('estacao_id', '==', estacao_id)
    .get();
  if (!existente.empty) {
    return Response.json({ erro: 'Usuário já vinculado a esta estação.' }, { status: 409 });
  }

  await db.collection('usuario_estacao').add({ usuario_id, estacao_id, papel });

  if (papel === 'master') {
    await db.collection('usuarios').doc(usuario_id).update({ perfil: 'master' });
  }

  return Response.json({ mensagem: 'Usuário vinculado com sucesso!' }, { status: 201 });
}
