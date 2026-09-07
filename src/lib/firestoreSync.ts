import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'intranet_data';

// Lit un document Firestore et convertit ses clés ("0", "1"...) en tableau JavaScript
async function fetchDocArray(docId: string): Promise<any[]> {
  try {
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Si les données sont enveloppées dans content, on prend content, sinon l'objet racine
      const raw = data.content !== undefined ? data.content : data;
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === 'object') return Object.values(raw);
    }
  } catch (error) {
    console.error(`Erreur lecture ${docId}:`, error);
  }
  return [];
}

export async function fetchDataFromFirestore(): Promise<any | null> {
  try {
    const [
      users,
      services,
      contracts,
      mails,
      leaves,
      cashSessions,
      documents,
      tasks,
      vaultItems,
      emergencyContacts,
      userToolLinks
    ] = await Promise.all([
      fetchDocArray('min_mmm_users'),
      fetchDocArray('min_mmm_services'),
      fetchDocArray('min_mmm_contracts'),
      fetchDocArray('min_mmm_mails'),
      fetchDocArray('min_mmm_leaves'),
      fetchDocArray('min_mmm_cash'),
      fetchDocArray('min_docs_v2'),
      fetchDocArray('min_mmm_tasks'),
      fetchDocArray('min_mmm_vault'),
      fetchDocArray('min_mmm_emergency'),
      fetchDocArray('min_mmm_tool_links')
    ]);

    console.log("Utilisateurs réels chargés depuis Firestore :", users);

    return {
      users,
      services,
      contracts,
      mails,
      leaves,
      cashSessions,
      documents,
      tasks,
      vaultItems,
      emergencyContacts,
      userToolLinks,
      contractAlertDays: 90,
      generalLabels: null,
    };
  } catch (error) {
    console.error("Erreur globale Firestore :", error);
    return null;
  }
}

export async function fetchDatapromFirestore(): Promise<any | null> {
  return fetchDataFromFirestore();
}

export async function syncDataToFirestore(state: any): Promise<void> {
  try {
    // Enregistre sous forme d'objet indexé { "0": {...}, "1": {...} } pour rester 100% compatible avec Firestore
    const save = (docId: string, data: any) => 
      setDoc(doc(db, COLLECTION, docId), Array.isArray(data) ? { ...data } : data);

    await Promise.all([
      save('min_mmm_users', state.users || []),
      save('min_mmm_services', state.services || []),
      save('min_mmm_contracts', state.contracts || []),
      save('min_mmm_mails', state.mails || []),
      save('min_mmm_leaves', state.leaves || []),
      save('min_mmm_cash', state.cashSessions || []),
      save('min_docs_v2', state.documents || []),
      save('min_mmm_tasks', state.tasks || []),
      save('min_mmm_vault', state.vaultItems || []),
      save('min_mmm_emergency', state.emergencyContacts || []),
      save('min_mmm_tool_links', state.userToolLinks || [])
    ]);
  } catch (error) {
    console.error("Erreur sauvegarde Firestore :", error);
  }
}