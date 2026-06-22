import admin from 'firebase-admin';
import db from '@/lib/firebase';

export async function POST(request) {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return Response.json({ erro: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    const { nome } = await request.json();

    // Verifica se já existe doc (evita duplicata)
    const existente = await db.collection('usuarios').doc(decoded.uid).get();
    if (existente.exists) {
      return Response.json({ mensagem: 'Usuário já registrado.' });
    }

    const nomeUsuario = nome || decoded.name || decoded.email?.split('@')[0] || 'Usuário';

    await db.collection('usuarios').doc(decoded.uid).set({
      nome:      nomeUsuario,
      email:     decoded.email || '',
      perfil:    'usuario',
      ativo:     true,
      criado_em: new Date().toISOString(),
    });

    return Response.json({ mensagem: 'Cadastro realizado com sucesso!' }, { status: 201 });
  } catch (err) {
    console.error('Erro no cadastro:', err.message);
    return Response.json({ erro: 'Erro interno no cadastro.' }, { status: 500 });
  }
}
