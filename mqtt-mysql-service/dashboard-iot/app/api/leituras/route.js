import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function GET(request) {
  const user = await verificarAuth(request);
  if (!user) return Response.json({ erro: 'Não autenticado.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const estacao_id = searchParams.get('estacao_id') || '1';

  try {
    if (user.perfil !== 'admin') {
      const vinculo = await db.collection('usuario_estacao')
        .where('usuario_id', '==', user.id)
        .where('estacao_id', '==', estacao_id)
        .get();
      if (vinculo.empty) return Response.json({ erro: 'Acesso negado.' }, { status: 403 });
    }

    const snap = await db.collection('leituras')
      .where('estacao_id', '==', estacao_id)
      .orderBy('data_hora', 'desc')
      .limit(20)
      .get();

    return Response.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}
