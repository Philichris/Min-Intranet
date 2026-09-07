import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'intranet_data';

// Extraction intelligente : gère 'content', les tableaux et les objets indexés
async function fetchDocContent(docId: string): Promise<any> {
  try {
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Si le champ 'content' existe, on le prend, sinon on prend l'objet racine
      const raw = data.content !== undefined ? data.content : data;
      
      // Si c'est un objet de type { "0": {...}, "1": {...} }, on le convertit en tableau
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return Object.values(raw);
      }
      return raw;
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${docId} :`, error);
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
      alertDays,
      labels
    ] = await Promise.all([
      fetchDocContent('min_mmm_users'),
      fetchDocContent('min_mmm_services'),
      fetchDocContent('min_mmm_contracts'),
      fetchDocContent('min_mmm_mails'),
      fetchDocContent('min_mmm_leaves'),
      fetchDocContent('min_mmm_cash'),
      fetchDocContent('min_docs_v2'),
      fetchDocContent('min_mmm_tasks'),
      fetchDocContent('min_mmm_vault'),
      fetchDocContent('min_mmm_emergency'),
      fetchDocContent('min_mmm_tool_links'),
      fetchDocContent('min_mmm_alert_days'),
      fetchDocContent('min_mmm_general_labels')
    ]);

    console.log("Utilisateurs extraits de Firestore :", users);

    return {
      users: Array.isArray(users) ? users : [],
      services: Array.isArray(services) ? services : [],
      contracts: Array.isArray(contracts) ? contracts : [],
      mails: Array.isArray(mails) ? mails : [],
      leaves: Array.isArray(leaves) ? leaves : [],
      cashSessions: Array.isArray(cashSessions) ? cashSessions : [],
      documents: Array.isArray(documents) ? documents : [],
      tasks: Array.isArray(tasks) ? tasks : [],
      vaultItems: Array.isArray(vaultItems) ? vaultItems : [],
      emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : [],
      userToolLinks: Array.isArray(userToolLinks) ? userToolLinks : [],
      contractAlertDays: typeof alertDays === 'number' ? alertDays : 90,
      generalLabels: labels || null,
    };
  } catch (error) {
    console.error("Erreur générale Firestore :", error);
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
      save('min_mmm_tool_links', state.userToolLinks || []),
      save('min_mmm_alert_days', state.contractAlertDays || 90),
      save('min_mmm_general_labels', state.generalLabels || {})
    ]);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde vers Firestore :", error);
  }
}