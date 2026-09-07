import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'intranet_data';

// Helper pour convertir un objet indexé ("0", "1", ...) ou un tableau en tableau propre
function normalizeArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    // Si c'est un objet enveloppé avec 'content'
    if (data.content && Array.isArray(data.content)) return data.content;
    if (data.content && typeof data.content === 'object') return Object.values(data.content);
    // Sinon on extrait directement les valeurs de l'objet
    return Object.values(data);
  }
  return [];
}

async function fetchDocData(docId: string): Promise<any> {
  try {
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error(`Erreur lecture ${docId}:`, error);
  }
  return null;
}

export async function fetchDataFromFirestore(): Promise<any | null> {
  try {
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

    const usersList = normalizeArray(usersData);
    console.log("Utilisateurs restaurés depuis Firebase :", usersList);

    return {
      users: usersList,
      services: normalizeArray(servicesData),
      contracts: normalizeArray(contractsData),
      mails: normalizeArray(mailsData),
      leaves: normalizeArray(leavesData),
      cashSessions: normalizeArray(cashData),
      documents: normalizeArray(docsData),
      tasks: normalizeArray(tasksData),
      vaultItems: normalizeArray(vaultData),
      emergencyContacts: normalizeArray(emergencyData),
      userToolLinks: normalizeArray(toolLinksData),
      contractAlertDays: typeof alertDaysData?.content === 'number' ? alertDaysData.content : 90,
      generalLabels: labelsData?.content || labelsData || null,
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
    console.error("Erreur sauvegarde Firestore :", error);
  }
}