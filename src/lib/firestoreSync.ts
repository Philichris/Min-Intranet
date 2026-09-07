import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const DOCUMENT_ID = 'intranet_data';

export async function fetchDataFromFirestore(): Promise<any | null> {
  try {
    const docRef = doc(db, 'intranet_data', DOCUMENT_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // On extrait la liste des utilisateurs enregistrés dans Firestore
      // ou dans le document min_mmm_users si stocké sous forme de sous-clé
      const usersData = data.min_mmm_users || data.users || [];

      return {
        users: Array.isArray(usersData) ? usersData : Object.values(usersData),
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
      console.warn("Aucun document 'intranet_data' trouvé sur Firestore.");
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
    
    // Conservation de la structure exacte mappée avec les clés Firebase
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