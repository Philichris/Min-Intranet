import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'intranet_data';

// Helper pour lire un document spécifique dans la collection
async function fetchDocData(docId: string): Promise<any> {
  try {
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Si le document contient un champ 'content', on le retourne, sinon on renvoie tout le document
      return data.content !== undefined ? data.content : data;
    }
  } catch (error) {
    console.error(`Erreur lecture ${docId}:`, error);
  }
  return null;
}

export async function fetchDataFromFirestore(): Promise<any | null> {
  try {
    // Lecture parallèle de tous tes documents
    const [
      usersData,
      servicesData,
      contractsData,
      mailsData,
      leavesData,
      cashData,
      docsData,
      tasksData,
      vaultData,
      emergencyData,
      toolLinksData,
      alertDaysData,
      labelsData
    ] = await Promise.all([
      fetchDocData('min_mmm_users'),
      fetchDocData('min_mmm_services'),
      fetchDocData('min_mmm_contracts'),
      fetchDocData('min_mmm_mails'),
      fetchDocData('min_mmm_leaves'),
      fetchDocData('min_mmm_cash'),
      fetchDocData('min_docs_v2') || fetchDocData('min_mmm_docs'),
      fetchDocData('min_mmm_tasks'),
      fetchDocData('min_mmm_vault'),
      fetchDocData('min_mmm_emergency'),
      fetchDocData('min_mmm_tool_links'),
      fetchDocData('min_mmm_alert_days'),
      fetchDocData('min_mmm_general_labels')
    ]);

    // Conversion en tableau pour les utilisateurs
    let usersList = usersData;
    if (usersList && !Array.isArray(usersList)) {
      usersList = Object.values(usersList);
    }

    console.log("Utilisateurs chargés depuis Firestore :", usersList);

    return {
      users: Array.isArray(usersList) ? usersList : [],
      services: Array.isArray(servicesData) ? servicesData : (servicesData ? Object.values(servicesData) : []),
      contracts: Array.isArray(contractsData) ? contractsData : [],
      mails: Array.isArray(mailsData) ? mailsData : [],
      leaves: Array.isArray(leavesData) ? leavesData : [],
      cashSessions: Array.isArray(cashData) ? cashData : [],
      documents: Array.isArray(docsData) ? docsData : [],
      tasks: Array.isArray(tasksData) ? tasksData : [],
      vaultItems: Array.isArray(vaultData) ? vaultData : [],
      emergencyContacts: Array.isArray(emergencyData) ? emergencyData : [],
      userToolLinks: Array.isArray(toolLinksData) ? toolLinksData : [],
      contractAlertDays: typeof alertDaysData === 'number' ? alertDaysData : 90,
      generalLabels: labelsData || null,
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
      setDoc(doc(db, COLLECTION, docId), Array.isArray(data) ? { ...data } : { content: data }, { merge: true });

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
    console.error("Erreur lors de la sauvegarde Firestore :", error);
  }
}