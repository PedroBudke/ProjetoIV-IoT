import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function GET(request) {
  const user = await verificarAuth(request);
  if (!user) return Response.json({ temAcesso: false }, { status: 401 });

  const snap = await db.collection('usuario_estacao')
    .where('usuario_id', '==', user.id)
    .get();

  if (snap.empty) return Response.json({ temAcesso: false, estacao_id: null });

  const estacao_id = snap.docs[0].data().estacao_id;
  return Response.json({ temAcesso: true, estacao_id });
}
