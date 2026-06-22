import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function GET(request) {
  const user = await verificarAuth(request);
  if (!user || user.perfil !== 'admin') {
    return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const snap = await db.collection('usuarios').orderBy('nome').get();
    return Response.json(snap.docs.map(d => ({
      id:    d.id,
      nome:  d.data().nome,
      email: d.data().email,
      perfil: d.data().perfil,
      ativo:  d.data().ativo !== false,
    })));
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}
