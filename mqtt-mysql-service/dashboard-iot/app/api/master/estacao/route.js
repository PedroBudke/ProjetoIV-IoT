import { verificarAuth } from '@/lib/auth-server';
import db from '@/lib/firebase';

export async function GET(request) {
  const user = await verificarAuth(request);
  if (!user) return Response.json({ erro: 'Não autenticado.' }, { status: 401 });

  try {
    const vinculoSnap = await db.collection('usuario_estacao')
      .where('usuario_id', '==', user.id)
      .where('papel', '==', 'master')
      .limit(1)
      .get();

    if (vinculoSnap.empty) return Response.json({ estacao: null, usuarios: [] });

    const estacao_id  = vinculoSnap.docs[0].data().estacao_id;
    const estacaoDoc  = await db.collection('estacoes').doc(estacao_id).get();
    const estacao     = { id: estacaoDoc.id, ...estacaoDoc.data() };

    const usuariosSnap = await db.collection('usuarios').where('perfil', '==', 'usuario').get();
    const vinculosSnap = await db.collection('usuario_estacao').where('estacao_id', '==', estacao_id).get();
    const vinculados   = new Set(vinculosSnap.docs.map(d => d.data().usuario_id));

    const usuarios = usuariosSnap.docs
      .map(d => ({ id: d.id, nome: d.data().nome, email: d.data().email, vinculado: vinculados.has(d.id) }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    return Response.json({ estacao, usuarios });
  } catch (err) {
    return Response.json({ erro: err.message }, { status: 500 });
  }
}
