import { 
  collection, 
  getDocs, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Editorial, Ficha } from '../types';

const COLLECTION_NAME = 'editorials';
const FICHAS_COLLECTION = 'fichas';

export const subscribeToEditorials = (callback: (editorials: Editorial[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const editorials = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Editorial[];
    callback(editorials);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const subscribeToFichas = (callback: (fichas: Ficha[]) => void) => {
  const q = query(collection(db, FICHAS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const fichas = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Ficha[];
    callback(fichas);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, FICHAS_COLLECTION);
  });
};

export const saveFicha = async (ficha: Omit<Ficha, 'id' | 'authorId' | 'createdAt'> & { id?: string }) => {
  try {
    const data: any = {
      ...ficha,
      authorId: auth.currentUser?.uid || 'anonymous',
      createdAt: serverTimestamp(),
    };
    
    // Create custom unique ID or use passed optional
    const docId = ficha.id || 'ficha_' + Math.random().toString(36).substr(2, 9);
    const docRef = doc(db, FICHAS_COLLECTION, docId);
    
    await setDoc(docRef, data);
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, FICHAS_COLLECTION);
  }
};

export const saveEditorial = async (editorial: Partial<Editorial> & { id?: string }, actionLabel?: string) => {
  try {
    const isUpdate = !!editorial.id;
    const data: any = {
      ...editorial,
      authorId: auth.currentUser?.uid || 'anonymous',
      updatedAt: serverTimestamp(),
    };

    let finalId = editorial.id || '';

    if (isUpdate) {
      const docRef = doc(db, COLLECTION_NAME, editorial.id!);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        data.createdAt = serverTimestamp();
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...saveData } = data;
      await setDoc(docRef, saveData, { merge: true });
      finalId = editorial.id!;
    } else {
      data.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
      finalId = docRef.id;
    }

    // Automatically create a historic generation ficha
    const defaultAction = isUpdate ? 'Actualización de Artículo' : 'Generación Inicial';
    await saveFicha({
      editorialId: finalId,
      title: editorial.title || 'Sin Título',
      summary: editorial.summary || 'Análisis jurídico de SOLJURE.',
      contentSnapshot: editorial.content || '',
      area: editorial.area || ('Civil' as any),
      author: editorial.author || 'Asesor Jurídico SOLJURE',
      generationDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      readTime: editorial.readTime || '5 min',
      action: actionLabel || defaultAction,
    });

    return finalId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
};

export const deleteEditorialFromDb = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
  }
};

export const deleteFichaFromDb = async (id: string) => {
  try {
    const docRef = doc(db, FICHAS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, FICHAS_COLLECTION);
  }
};
