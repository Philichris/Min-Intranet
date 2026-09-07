import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase'; // ou './lib/firebase' selon où est situé firebase.ts

const STATE_DOC_REF = doc(db, 'intranet_data', 'main_state');

export async function syncDataToFirestore(appState: any): Promise<void> {
  try {
    // Strip heavy file blobs if any
    const cleanState = {
      ...appState,
      updatedAt: new Date().toISOString(),
      documents: (appState.documents || []).map((d: any) => ({ ...d, fileUrl: undefined })),
      mails: (appState.mails || []).map((m: any) => ({ ...m, fileUrl: undefined })),
      contracts: (appState.contracts || []).map((c: any) => ({ ...c, fileUrl: undefined }))
    };
    await setDoc(STATE_DOC_REF, cleanState, { merge: true });
    console.log('Données synchronisées avec succès sur Firebase Firestore.');
  } catch (err) {
    console.error('Erreur lors de la synchronisation vers Firestore:', err);
    throw err;
  }
}

export async function fetchDatapromFirestore(): Promise<any | null> {
  try {
    const snap = await getDoc(STATE_DOC_REF);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error('Erreur lors de la récupération depuis Firestore:', err);
    throw err;
  }
}

export async function fetchDataFromFirestore(): Promise<any | null> {
  return fetchDatapromFirestore();
}
