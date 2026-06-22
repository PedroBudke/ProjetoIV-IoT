import admin from 'firebase-admin';
import db from '@/lib/firebase';

export async function GET(request) {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    const snap    = await db.collection('usuarios').doc(decoded.uid).get();

    if (snap.exists) {
      const data = snap.data();
      if (data.ativo === false) {
        return Response.json({ erro: 'Conta inativa.', inativo: true }, { status: 403 });
      }
      return Response.json({
        nome:   data.nome,
        email:  data.email,
        perfil: data.perfil,
        ativo:  true,
      });
    }

    // Usuário Firebase existe mas não tem doc no Firestore
    // → Primeiro acesso via OAuth: cria automaticamente
    const provider = decoded.firebase?.sign_in_provider;
    if (provider && provider !== 'password') {
      const novoUsuario = {
        nome:       decoded.name  || decoded.email?.split('@')[0] || 'Usuário',
        email:      decoded.email || '',
        perfil:     'usuario',
        ativo:      true,
        criado_em:  new Date().toISOString(),
        provider,
      };
      await db.collection('usuarios').doc(decoded.uid).set(novoUsuario);
      return Response.json({ ...novoUsuario });
    }

    // Email/senha sem doc no Firestore (cadastro incompleto)
    return Response.json({ erro: 'Usuário não encontrado.', nao_registrado: true }, { status: 404 });
  } catch (err) {
    console.error('Erro em /api/auth/me:', err.message);
    return Response.json({ erro: 'Token inválido.' }, { status: 401 });
  }
}
