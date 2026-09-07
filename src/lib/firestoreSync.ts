import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'intranet_data';

// Helper universel : extrait un tableau, qu'il soit dans `content` ou à la racine
async function fetchAndNormalize(docId: string): Promise<any[]> {
  try {
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDocFromServer(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // 1. Si le champ 'content' existe
      let target = data.content !== undefined ? data.content : data;
      
      // 2. Si c'est déjà un tableau
      if (Array.isArray(target)) return target;
      
      // 3. Si c'est un objet (indexé ou non), on extrait ses valeurs
      if (target && typeof target === 'object') {
        return Object.values(target);
      }
    }
  } catch (error) {
    console.warn(`Erreur de lecture sur ${docId}:`, error);
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
      userToolLinks,
      docCategories,
      docSubfolders
    ] = await Promise.all([
      fetchAndNormalize('min_mmm_users'),
      fetchAndNormalize('min_mmm_services'),
      fetchAndNormalize('min_mmm_contracts'),
      fetchAndNormalize('min_mmm_mails'),
      fetchAndNormalize('min_mmm_leaves'),
      fetchAndNormalize('min_mmm_cash'),
      fetchAndNormalize('min_docs_v2').then(res => res.length ? res : fetchAndNormalize('min_mmm_docs')),
      fetchAndNormalize('min_mmm_tasks'),
      fetchAndNormalize('min_mmm_vault'),
      fetchAndNormalize('min_mmm_emergency'),
      fetchAndNormalize('min_mmm_tool_links'),
      fetchAndNormalize('document_categories'),
      fetchAndNormalize('document_subfolders')
    ]);

    console.log("=== CHARGEMENT FIRESTORE RÉUSSI ===");
    console.log("Utilisateurs :", users.length);
    console.log("Documents :", documents.length);

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
      documentCategories: docCategories,
      documentSubfolders: docSubfolders,
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
    const save = (docId: string, data: any) => 
      setDoc(doc(db, COLLECTION, docId), { content: data }, { merge: true });

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