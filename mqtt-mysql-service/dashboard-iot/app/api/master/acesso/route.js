import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function POST(request) {
  const user = await verificarAuth(request);
  if (!user) return Response.json({ erro: 'Não autenticado.' }, { status: 401 });

  try {
    const { usuario_id, acao } = await request.json();

    const vinculoSnap = await db.collection('usuario_estacao')
      .where('usuario_id', '==', user.id)
      .where('papel', '==', 'master')
      .limit(1)
      .get();

    if (vinculoSnap.empty) return Response.json({ erro: 'Estação não encontrada.' }, { status: 404 });

    const estacao_id = vinculoSnap.docs[0].data().estacao_id;

    if (acao === 'liberar') {
      const existente = await db.collection('usuario_estacao')
        .where('usuario_id', '==', usuario_id)
        .where('estacao_id', '==', estacao_id)
        .get();
      if (existente.empty) {
        await db.collection('usuario_estacao').add({ usuario_id, estacao_id, papel: 'usuario' });
      }
      return Response.json({ mensagem: 'Acesso liberado com sucesso!' });
    }

    if (acao === 'revogar') {
      const vinculo = await db.collection('usuario_estacao')
        .where('usuario_id', '==', usuario_id)
        .where('estacao_id', '==', estacao_id)
        .where('papel', '==', 'usuario')
        .get();
      for (const doc of vinculo.docs) await doc.ref.delete();
      return Response.json({ mensagem: 'Acesso revogado com sucesso!' });
    }

    return Response.json({ erro: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}
