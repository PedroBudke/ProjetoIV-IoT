import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function PATCH(request, { params }) {
  const user = await verificarAuth(request);
  if (!user || user.perfil !== 'admin') {
    return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const upd = {};
    if (body.ativo !== undefined) upd.ativo = body.ativo;
    if (!Object.keys(upd).length) return Response.json({ erro: 'Nada para atualizar.' }, { status: 400 });
    await db.collection('usuarios').doc(id).update(upd);
    return Response.json({ mensagem: 'Usuário atualizado.' });
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}
