import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || 'ai-studio-52de35cf-421b-4edb-b2f8-b38c1eca0a0e');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function loginWithEmailAndPassword(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    const friendlyError = error2FriendlyMessage(error);
    console.error('Error signing in with Email/Password:', friendlyError);
    throw friendlyError;
  }
}

export async function registerWithEmailAndPassword(email: string, pass: string, name: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  } catch (error) {
    const friendlyError = error2FriendlyMessage(error);
    console.error('Error registering with Email/Password:', friendlyError);
    throw friendlyError;
  }
}

function error2FriendlyMessage(error: any): Error {
  const code = error?.code;
  let msg = "Ocurrió un error inesperado al autenticar.";
  if (code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    msg = "Correo o contraseña incorrectos. Por favor, verifica tus credenciales.";
  } else if (code === 'auth/invalid-credential') {
    msg = "Credenciales incorrectas o inválidas. Inténtalo de nuevo.";
  } else if (code === 'auth/email-already-in-use') {
    msg = "Este correo electrónico ya está registrado. Intenta iniciar sesión.";
  } else if (code === 'auth/weak-password') {
    msg = "La contraseña debe tener al menos 6 caracteres.";
  } else if (code === 'auth/invalid-email') {
    msg = "El formato del correo electrónico no es válido.";
  } else if (code === 'auth/operation-not-allowed') {
    msg = "El acceso con Correo y Contraseña está desactivado en la consola de Firebase. Por favor, actívalo en Authentication -> Sign-in method, o ingresa usando la opción de Google.";
  } else if (code === 'auth/network-request-failed') {
    msg = "Error de red: No se pudo conectar con los servidores de autenticación. Verifica tu conexión a internet e intenta nuevamente.";
  } else if (code === 'auth/user-disabled') {
    msg = "Este usuario ha sido deshabilitado temporal o permanentemente.";
  } else if (error instanceof Error) {
    msg = error.message;
  }
  return new Error(msg);
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
