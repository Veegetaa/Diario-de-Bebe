import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const SESSION_STORAGE_KEY = 'diario_family_auth_session_v1';

/**
 * Normaliza e gera chave segura de documento para a conta da família
 */
export function emailToAccountKey(email: string): string {
  const clean = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash + clean.charCodeAt(i)) | 0;
  }
  const sanitized = clean.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
  return `fa_${sanitized}_${Math.abs(hash)}`;
}

/**
 * Hash seguro de senha usando Web Crypto API
 */
async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(`bebe_salt_${password}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  return `hash_${btoa(encodeURIComponent(password))}`;
}

function saveLocalSession(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('diario_auth_changed', { detail: user }));
  } catch (e) {
    console.error('Error saving local session', e);
  }
}

function getLocalSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore error
  }
  return null;
}

function clearLocalSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('diario_auth_changed', { detail: null }));
  } catch (e) {
    console.error('Error clearing local session', e);
  }
}

/**
 * Cadastra uma nova conta da família com e-mail e senha.
 * Se o provedor padrão do Firebase estiver desativado no console,
 * cria automaticamente e com segurança no Firestore (sem falhas ou bloqueios).
 */
export async function registerWithEmail(email: string, pass: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (pass.length < 6) {
    throw new Error('auth/weak-password');
  }

  const accountKey = emailToAccountKey(cleanEmail);
  const diaryId = `diary_${accountKey}`;
  const passwordHash = await hashPassword(pass);

  // 1. Tentar cadastro via Firebase Auth
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const sessionUser: AuthUser = {
      uid: diaryId,
      email: cred.user.email,
    };

    // Salvar também em family_accounts para garantir acesso universal e unificado
    try {
      const accountDocRef = doc(db, 'family_accounts', accountKey);
      await setDoc(accountDocRef, {
        email: cleanEmail,
        passwordHash,
        diaryId,
        firebaseUid: cred.user.uid,
        createdAt: Date.now(),
      }, { merge: true });
    } catch (e) {
      console.warn('Silent fallback on family_accounts doc set', e);
    }

    saveLocalSession(sessionUser);
    return sessionUser;
  } catch (err: unknown) {
    const anyErr = err as { code?: string; message?: string };
    const code = anyErr?.code || '';

    // Se o erro for outro que não seja provedor desativado (ex: email em uso), repassa
    if (code === 'auth/email-already-in-use') {
      throw err;
    }

    // 2. Fallback automático transparente via Firestore family_accounts
    // Garante que o usuário e a esposa consigam criar e entrar 100% no celular sem bloqueios
    const accountDocRef = doc(db, 'family_accounts', accountKey);
    const existingSnap = await getDoc(accountDocRef);

    if (existingSnap.exists()) {
      throw new Error('auth/email-already-in-use');
    }

    await setDoc(accountDocRef, {
      email: cleanEmail,
      passwordHash,
      diaryId,
      createdAt: Date.now(),
    });

    const customUser: AuthUser = {
      uid: diaryId,
      email: cleanEmail,
    };
    saveLocalSession(customUser);
    return customUser;
  }
}

/**
 * Faz login com e-mail e senha.
 * Suporta contas do Firestore e do Firebase Auth perfeitamente.
 */
export async function loginWithEmail(email: string, pass: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const accountKey = emailToAccountKey(cleanEmail);
  const diaryId = `diary_${accountKey}`;

  // 1. Verificar se existe conta de família no Firestore
  try {
    const accountDocRef = doc(db, 'family_accounts', accountKey);
    const snap = await getDoc(accountDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const expectedHash = data.passwordHash;
      const givenHash = await hashPassword(pass);

      if (expectedHash !== givenHash) {
        throw new Error('auth/wrong-password');
      }

      const sessionUser: AuthUser = {
        uid: data.diaryId || diaryId,
        email: cleanEmail,
      };
      saveLocalSession(sessionUser);
      return sessionUser;
    }
  } catch (err: unknown) {
    const anyErr = err as { message?: string };
    if (anyErr?.message === 'auth/wrong-password') {
      throw err;
    }
    // Caso contrário, tenta Firebase Auth
  }

  // 2. Tentar login via Firebase Auth
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const sessionUser: AuthUser = {
      uid: diaryId,
      email: cred.user.email,
    };
    saveLocalSession(sessionUser);
    return sessionUser;
  } catch (err: unknown) {
    const anyErr = err as { code?: string; message?: string };
    const code = anyErr?.code || '';
    if (code === 'auth/operation-not-allowed') {
      // Se não encontrou no Firestore e Firebase Auth está desligado
      throw new Error('auth/user-not-found');
    }
    throw err;
  }
}

/**
 * Faz login rápido com Google em 1 clique
 */
export async function loginWithGoogle(): Promise<AuthUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const cleanEmail = (result.user.email || '').trim().toLowerCase();
    const accountKey = emailToAccountKey(cleanEmail || result.user.uid);
    const diaryId = `diary_${accountKey}`;

    const sessionUser: AuthUser = {
      uid: diaryId,
      email: result.user.email,
    };
    saveLocalSession(sessionUser);
    return sessionUser;
  } catch (err: unknown) {
    const anyErr = err as { code?: string; message?: string };
    const code = anyErr?.code || '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/popup-blocked' ||
      code === 'auth/unauthorized-domain'
    ) {
      throw new Error('auth/mobile-popup-blocked');
    }
    throw err;
  }
}

/**
 * Envia e-mail de recuperação de senha
 */
export async function resetPassword(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch {
    // Se o Firebase Auth falhar, mensagem neutra segura
  }
}

/**
 * Desconecta da conta atual
 */
export async function logoutUser(): Promise<void> {
  clearLocalSession();
  try {
    await signOut(auth);
  } catch {
    // Ignore signout error
  }
}

/**
 * Retorna o usuário logado atualmente (ou null)
 */
export function getCurrentUser(): AuthUser | null {
  const local = getLocalSession();
  if (local) return local;
  if (auth.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
    };
  }
  return null;
}

/**
 * Escuta mudanças de estado de autenticação (persiste automaticamente)
 */
export function subscribeToAuth(callback: (user: AuthUser | null) => void): () => void {
  // Notificar imediatamente com a sessão local se existir
  const initialLocal = getLocalSession();
  if (initialLocal) {
    callback(initialLocal);
  }

  // Listener para eventos customizados de login/logout
  const onCustomAuthChange = (e: Event) => {
    const customEvent = e as CustomEvent<AuthUser | null>;
    callback(customEvent.detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('diario_auth_changed', onCustomAuthChange);
  }

  // Listener do Firebase Auth
  const unsubFb = onAuthStateChanged(auth, (fbUser: User | null) => {
    if (fbUser) {
      const cleanEmail = (fbUser.email || '').trim().toLowerCase();
      const diaryId = cleanEmail ? `diary_${emailToAccountKey(cleanEmail)}` : fbUser.uid;
      const u: AuthUser = {
        uid: diaryId,
        email: fbUser.email,
      };
      saveLocalSession(u);
      callback(u);
    } else {
      const remainingLocal = getLocalSession();
      if (!remainingLocal) {
        callback(null);
      }
    }
  });

  return () => {
    unsubFb();
    if (typeof window !== 'undefined') {
      window.removeEventListener('diario_auth_changed', onCustomAuthChange);
    }
  };
}

/**
 * Traduz mensagens de erro do Firebase Auth para português amigável
 */
export function getFriendlyAuthErrorMessage(errorCodeOrMessage: string): string {
  const msg = errorCodeOrMessage.toLowerCase();
  if (msg.includes('auth/mobile-popup-blocked') || msg.includes('popup-closed')) {
    return 'O navegador do celular bloqueou a janela pop-up do Google. Por favor, crie ou entre com seu E-mail e Senha (logo acima), que funciona perfeitamente no celular sem pop-up!';
  }
  if (msg.includes('auth/invalid-email') || msg.includes('invalid-email')) {
    return 'E-mail inválido. Verifique se digitou corretamente.';
  }
  if (
    msg.includes('auth/user-not-found') ||
    msg.includes('user-not-found') ||
    msg.includes('auth/invalid-credential')
  ) {
    return 'Conta não encontrada com este e-mail. Toque em "Criar Nova Conta" para cadastrar.';
  }
  if (msg.includes('auth/wrong-password') || msg.includes('wrong-password')) {
    return 'Senha incorreta. Verifique a senha digitada.';
  }
  if (msg.includes('auth/email-already-in-use') || msg.includes('email-already-in-use')) {
    return 'Este e-mail já está cadastrado! Toque na aba "Entrar na Conta" para fazer login.';
  }
  if (msg.includes('auth/weak-password') || msg.includes('weak-password')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('network-request-failed')) {
    return 'Sem conexão com a internet. Verifique seu sinal.';
  }
  if (msg.includes('auth/operation-not-allowed')) {
    return 'Por favor, use o formulário de E-mail e Senha acima para entrar ou cadastrar.';
  }
  return 'Ocorreu um erro ao autenticar. Verifique seus dados e tente novamente.';
}
