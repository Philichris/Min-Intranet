import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Nom exact du document principal stocké dans Firestore
const DOCUMENT_ID = 'intranet_data';

export async function fetchDataFromFirestore(): Promise<any | null> {
  try {
    // 1. Essai de lecture directe au niveau racine ou dans la collection intranet_data
    let docRef = doc(db, 'intranet_data', DOCUMENT_ID);
    let docSnap = await getDoc(docRef);

    // Si non trouvé, on tente la lecture si intranet_data est une collection avec le doc (default)
    if (!docSnap.exists()) {
      docRef = doc(db, 'intranet_data', '(default)');
      docSnap = await getDoc(docRef);
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Données brutes Firestore récupérées :", data);
      
      // Extraction des utilisateurs (supporte tableau ou objet de clés)
      const rawUsers = data.min_mmm_users || data.users || [];
      const usersList = Array.isArray(rawUsers) ? rawUsers : Object.values(rawUsers);

      return {
        users: usersList,
        services: data.min_mmm_services || data.services || [],
        contracts: data.min_mmm_contracts || data.contracts || [],
        mails: data.min_mmm_mails || data.mails || [],
        leaves: data.min_mmm_leaves || data.leaves || [],
        cashSessions: data.min_mmm_cash || data.cashSessions || [],
        documents: data.min_docs_v2 || data.min_documents || data.documents || [],
        tasks: data.min_mmm_tasks || data.tasks || [],
        vaultItems: data.min_mmm_vault || data.vaultItems || [],
        emergencyContacts: data.min_mmm_emergency || data.emergencyContacts || [],
        userToolLinks: data.min_mmm_tool_links || data.userToolLinks || [],
        contractAlertDays: data.min_mmm_alert_days || 90,
        generalLabels: data.min_mmm_general_labels || null,
      };
    } else {
      console.warn("Aucun document trouvé sur Firestore aux emplacements 'intranet_data/intranet_data'.");
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données Firestore:", error);
    return null;
  }
}

export async function fetchDatapromFirestore(): Promise<any | null> {
  return fetchDataFromFirestore();
}

export async function syncDataToFirestore(state: any): Promise<void> {
  try {
    const docRef = doc(db, 'intranet_data', DOCUMENT_ID);
    
    const dataToSave = {
      min_mmm_users: state.users || [],
      min_mmm_services: state.services || [],
      min_mmm_contracts: state.contracts || [],
      min_mmm_mails: state.mails || [],
      min_mmm_leaves: state.leaves || [],
      min_mmm_cash: state.cashSessions || [],
      min_docs_v2: state.documents || [],
      min_mmm_tasks: state.tasks || [],
      min_mmm_vault: state.vaultItems || [],
      min_mmm_emergency: state.emergencyContacts || [],
      min_mmm_tool_links: state.userToolLinks || [],
      min_mmm_alert_days: state.contractAlertDays || 90,
      min_mmm_general_labels: state.generalLabels || {},
      lastUpdated: new Date().toISOString()
    };

    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Erreur lors de la synchronisation vers Firestore:", error);
  }
}