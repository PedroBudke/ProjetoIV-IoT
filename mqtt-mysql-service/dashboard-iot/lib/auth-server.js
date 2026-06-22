import admin from 'firebase-admin';
import db from './firebase'; // garante que admin.initializeApp() já rodou

export async function verificarAuth(request) {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    const snap    = await db.collection('usuarios').doc(decoded.uid).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (data.ativo === false) return null;
    return { uid: decoded.uid, id: decoded.uid, ...data };
  } catch {
    return null;
  }
}
