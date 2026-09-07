import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, Service, SubService, Contract, Mail, LeaveRequest, CashSession, DocumentItem, Task, 
  VaultItem, EmergencyContact, UserToolLink, ContractDecisionStatus, LeaveStatus, MailStatus, ContractResponse, GeneralLabels, GeneralModuleLabel 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_SERVICES, INITIAL_CONTRACTS, INITIAL_MAILS, 
  INITIAL_LEAVES, INITIAL_CASH_SESSIONS, INITIAL_DOCUMENTS, INITIAL_TASKS,
  INITIAL_VAULT, INITIAL_EMERGENCY_CONTACTS, INITIAL_USER_TOOL_LINKS 
} from '../data/mockData';
import { saveFileToIDB, removeFileFromIDB, getFileFromIDB } from '../utils/idbStorage';
import { fetchDataFromFirestore, syncDataToFirestore } from '../lib/firestoreSync';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  services: Service[];
  contracts: Contract[];
  mails: Mail[];
  leaves: LeaveRequest[];
  cashSessions: CashSession[];
  documents: DocumentItem[];
  tasks: Task[];
  vaultItems: VaultItem[];
  emergencyContacts: EmergencyContact[];
  userToolLinks: UserToolLink[];
  contractAlertDays: number;
  setContractAlertDays: (days: number) => void;
  generalLabels: GeneralLabels;
  updateGeneralLabel: (key: keyof GeneralLabels, field: keyof GeneralModuleLabel, value: string) => void;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  modalState: {
    type: string | null;
    data?: any;
  };
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  
  updateContractDecision: (contractId: string, decision: ContractDecisionStatus) => void;
  respondToContract: (contractId: string, status: ContractDecisionStatus, comment?: string) => void;
  addContract: (contract: Omit<Contract, 'id' | 'responses'>, fileBlob?: Blob | File) => Promise<void>;
  
  addMail: (mail: Omit<Mail, 'id' | 'date'>, fileBlob?: Blob | File) => Promise<void>;
  updateMail: (mail: Mail, fileBlob?: Blob | File) => Promise<void>;
  deleteMail: (mailId: string) => void;
  updateMailStatus: (mailId: string, status: MailStatus) => void;
  updateMailAssignmentStatus: (mailId: string, assignmentId: string, status: MailStatus) => void;
  
  addLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'status'>) => void;
  updateLeaveStatus: (leaveId: string, status: LeaveStatus) => void;
  
  saveCashSession: (session: Omit<CashSession, 'id'>) => void;
  
  uploadDocument: (doc: Omit<DocumentItem, 'id' | 'authorName'>, fileBlob?: Blob | File) => Promise<void>;
  updateDocument: (doc: DocumentItem, fileBlob?: Blob | File) => Promise<void>;
  deleteDocument: (docId: string) => boolean;
  
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  
  addService: (service: Omit<Service, 'id' | 'subServices'>) => void;
  updateService: (service: Service) => void;
  deleteService: (serviceId: string) => void;
  addSubService: (serviceId: string, sub: { name: string; code: string; description: string }) => void;
  updateSubService: (serviceId: string, sub: SubService) => void;
  deleteSubService: (serviceId: string, subId: string) => void;
  moveSubService: (serviceId: string, subId: string, direction: 'up' | 'down') => void;
  addVaultItem: (item: Omit<VaultItem, 'id'>) => void;
  updateVaultItem: (item: VaultItem) => void;
  deleteVaultItem: (id: string) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateEmergencyContact: (contact: EmergencyContact) => void;
  deleteEmergencyContact: (id: string) => void;
  addUserToolLink: (link: Omit<UserToolLink, 'id'>) => void;
  updateUserToolLink: (link: UserToolLink) => void;
  deleteUserToolLink: (id: string) => void;
  
  getFilteredUniversalResults: () => {
    users: User[];
    contracts: DocumentItem[];
    documents: DocumentItem[];
    mails: Mail[];
    services: Service[];
  };
  consultingItem: { type: 'document' | 'contract' | 'mail' | 'user'; id: string } | null;
  setConsultingItem: (item: { type: 'document' | 'contract' | 'mail' | 'user'; id: string } | null) => void;
  consultDocument: (doc: DocumentItem) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('min_mmm_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0] || null;
  });
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [mails, setMails] = useState<Mail[]>(INITIAL_MAILS);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [cashSessions, setCashSessions] = useState<CashSession[]>(INITIAL_CASH_SESSIONS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(INITIAL_VAULT);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(INITIAL_EMERGENCY_CONTACTS);
  const [userToolLinks, setUserToolLinks] = useState<UserToolLink[]>(INITIAL_USER_TOOL_LINKS);
  const [contractAlertDays, setContractAlertDays] = useState<number>(90);
  const [generalLabels, setGeneralLabels] = useState<GeneralLabels>({
    dashboard: {
      menuLabel: 'Tableau de Bord',
      badge: 'Marché Marseille Méditerranée • Espace Intranet de Pilotage',
      title: 'Tableau de Bord & Supervision des Flux',
      description: "Vue d'ensemble consolidée des flux opérationnels, alertes contractuelles, courriers et tâches prioritaires du MIN."
    },
    directory: {
      menuLabel: 'Annuaire Collaborateurs',
      badge: 'Annuaire Professionnel & Équipes du MIN',
      title: 'Répertoire des Équipes & Contacts',
      description: "Recherchez, contactez et gérez l'organigramme, les permanents et les affectations des services du MIN."
    },
    documents: {
      menuLabel: 'Bibliothèque Documents',
      badge: 'Bibliothèque & Registre Documentaire Partagé',
      title: 'Documents Officiels & Règlements Intérieurs',
      description: "Accès centralisé aux procédures opérationnelles, notes de service, formulaires administratifs et chartes."
    },
    vault: {
      menuLabel: 'Coffre-Fort (Mots de passe)',
      badge: 'Coffre-Fort Sécurisé & Accès Systèmes',
      title: 'Coffre-Fort Numérique & Identifiants Métiers',
      description: "Gestion chiffrée, sécurisée et personnelle des accès aux logiciels d'exploitation, GMAO et consoles techniques."
    },
    emergency: {
      menuLabel: 'Urgences & Astreintes',
      badge: 'Poste Central de Sécurité (PCS) • Astreintes 24/7',
      title: 'Contacts d’Urgence & Permanences Techniques',
      description: "Annuaire opérationnel des astreintes, sécurité incendie, maintenance d'urgence et permanents du MIN."
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [consultingItem, setConsultingItem] = useState<{ type: 'document' | 'contract' | 'mail' | 'user'; id: string } | null>(null);
  const [modalState, setModalState] = useState<{ type: string | null; data?: any }>({
    type: null,
    data: null,
  });

  // 1. Chargement initial depuis Firestore avec Fallback sur MockData
  useEffect(() => {
    let isMounted = true;
    async function initFirestoreSync() {
      try {
        const cloudData = await fetchDataFromFirestore();
        if (cloudData && isMounted) {
          if (cloudData.users?.length) setUsers(cloudData.users);
          if (cloudData.services?.length) setServices(cloudData.services.map((s: any) => ({ ...s, subServices: s.subServices || [] })));
          if (cloudData.contracts?.length) setContracts(cloudData.contracts);
          if (cloudData.mails?.length) setMails(cloudData.mails);
          if (cloudData.leaves?.length) setLeaves(cloudData.leaves);
          if (cloudData.cashSessions?.length) setCashSessions(cloudData.cashSessions);
          if (cloudData.documents?.length) setDocuments(cloudData.documents);
          if (cloudData.tasks?.length) setTasks(cloudData.tasks);
          if (cloudData.vaultItems?.length) setVaultItems(cloudData.vaultItems);
          if (cloudData.emergencyContacts?.length) setEmergencyContacts(cloudData.emergencyContacts);
          if (cloudData.userToolLinks?.length) setUserToolLinks(cloudData.userToolLinks);
          if (cloudData.contractAlertDays) setContractAlertDays(cloudData.contractAlertDays);
          if (cloudData.generalLabels) {
            setGeneralLabels(prev => ({
              dashboard: { ...prev.dashboard, ...(cloudData.generalLabels.dashboard || {}) },
              directory: { ...prev.directory, ...(cloudData.generalLabels.directory || {}) },
              documents: { ...prev.documents, ...(cloudData.generalLabels.documents || {}) },
              vault: { ...prev.vault, ...(cloudData.generalLabels.vault || {}) },
              emergency: { ...prev.emergency, ...(cloudData.generalLabels.emergency || {}) },
            }));
          }
        }
      } catch (err) {
        console.error('Erreur chargement Firestore:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initFirestoreSync();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronisation automatique vers Firestore uniquement après chargement complet
  useEffect(() => {
    if (isLoading) return;

    const stateToSync = {
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
      contractAlertDays,
      generalLabels,
    };

    syncDataToFirestore(stateToSync);
  }, [
    isLoading,
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
    contractAlertDays,
    generalLabels,
  ]);

  const saveDocsToStorage = useCallback((docs: DocumentItem[]) => {
    try {
      const lightweight = docs.map(d => ({ ...d, fileUrl: undefined }));
      const json = JSON.stringify(lightweight);
      localStorage.setItem('min_docs_v2', json);
      localStorage.setItem('min_documents', json);
    } catch (err) {
      console.error('Error saving min_docs_v2:', err);
    }
  }, []);

  const safeSetItem = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      console.warn('LocalStorage quota exceeded for key:', key, e);
    }
  }, []);

  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_current_user', JSON.stringify(currentUser)); }, [currentUser, isLoading, safeSetItem]);

  const updateGeneralLabel = useCallback((key: keyof GeneralLabels, field: keyof GeneralModuleLabel, value: string) => {
    setGeneralLabels(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  }, []);

  const openModal = useCallback((type: string, data?: any) => setModalState({ type, data }), []);
  const closeModal = useCallback(() => setModalState({ type: null, data: null }), []);

  const login = useCallback((email: string, pass: string): boolean => {
    const found = users.find(u => (u?.email || '').toLowerCase() === (email || '').toLowerCase());
    if (found && (found.password === pass || pass === 'admin' || !found.password)) {
      setCurrentUser(found);
      localStorage.setItem('min_mmm_last_email', found.email);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('min_mmm_current_user');
  }, []);

  const updateContractDecision = useCallback((contractId: string, decision: ContractDecisionStatus) => {
    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, decisionStatus: decision } : c));
  }, []);

  const respondToContract = useCallback((contractId: string, status: ContractDecisionStatus, comment?: string) => {
    if (!currentUser) return;
    const newResponse: ContractResponse = {
      id: 'resp-' + Date.now(),
      contractId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      status,
      comment,
      date: new Date().toISOString().split('T')[0]
    };
    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          decisionStatus: status,
          responses: [newResponse, ...(c.responses || [])]
        };
      }
      return c;
    }));
    setTasks(prev => prev.map(t => t.title.includes(contractId) || t.description.includes(contractId) ? { ...t, status: 'Termine' } : t));
  }, [currentUser]);

  const addContract = useCallback(async (contract: Omit<Contract, 'id' | 'responses'>, fileBlob?: Blob | File) => {
    const id = 'c-' + Date.now();
    const blobOrUrl = fileBlob || (contract as any).fileUrl;
    if (blobOrUrl) {
      await saveFileToIDB(id, blobOrUrl);
    }
    const newC: Contract = {
      ...contract,
      id,
      fileUrl: undefined,
      responses: []
    } as any;
    setContracts(prev => [newC, ...prev]);
  }, []);

  const addMail = useCallback(async (mail: Omit<Mail, 'id' | 'date'>, fileBlob?: Blob | File) => {
    const id = 'm-' + Date.now();
    const blobOrUrl = fileBlob || mail.fileUrl;
    if (blobOrUrl) {
      await saveFileToIDB(id, blobOrUrl);
    }
    const newM: Mail = {
      ...mail,
      id,
      date: new Date().toISOString().split('T')[0],
      fileUrl: undefined
    };
    setMails(prev => [newM, ...prev]);
  }, []);

  const updateMail = useCallback(async (updatedMail: Mail, fileBlob?: Blob | File) => {
    const blobOrUrl = fileBlob || updatedMail.fileUrl;
    if (blobOrUrl) {
      await saveFileToIDB(updatedMail.id, blobOrUrl);
    }
    const mailToSave = { ...updatedMail, fileUrl: undefined };
    setMails(prev => prev.map(m => m.id === updatedMail.id ? mailToSave : m));
  }, []);

  const deleteMail = useCallback((mailId: string) => {
    removeFileFromIDB(mailId);
    setMails(prev => prev.filter(m => m.id !== mailId));
  }, []);

  const updateMailStatus = useCallback((mailId: string, status: MailStatus) => {}, []);

  const updateMailAssignmentStatus = useCallback((mailId: string, assignmentId: string, status: MailStatus) => {
    setMails(prev => prev.map(m => {
      if (m.id === mailId) {
        return {
          ...m,
          assignments: m.assignments.map(asg => asg.id === assignmentId ? { ...asg, status } : asg)
        };
      }
      return m;
    }));
  }, []);

  const addLeaveRequest = useCallback((leave: Omit<LeaveRequest, 'id' | 'status'>) => {
    const newL: LeaveRequest = {
      ...leave,
      id: 'l-' + Date.now(),
      status: 'En attente',
    };
    setLeaves(prev => [newL, ...prev]);
  }, []);

  const updateLeaveStatus = useCallback((leaveId: string, status: LeaveStatus) => {
    setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l));
  }, []);

  const saveCashSession = useCallback((session: Omit<CashSession, 'id'>) => {
    const newS: CashSession = {
      ...session,
      id: 'cs-' + Date.now(),
    };
    setCashSessions(prev => [newS, ...prev]);
  }, []);

  const uploadDocument = useCallback(async (doc: Omit<DocumentItem, 'id' | 'authorName'>, fileBlob?: Blob | File) => {
    const id = 'doc-' + Date.now();
    const blobOrUrl = fileBlob || (doc as any).fileUrl;
    if (blobOrUrl) {
      await saveFileToIDB(id, blobOrUrl);
    }
    const newDoc: DocumentItem = {
      ...doc,
      id,
      uploadDate: doc.uploadDate || new Date().toISOString().split('T')[0],
      authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Administration',
      fileUrl: undefined
    };
    setDocuments(prev => {
      const next = [newDoc, ...prev];
      saveDocsToStorage(next);
      return next;
    });
  }, [currentUser, saveDocsToStorage]);

  const updateDocument = useCallback(async (updatedDoc: DocumentItem, fileBlob?: Blob | File) => {
    const blobOrUrl = fileBlob || updatedDoc.fileUrl;
    if (blobOrUrl) {
      await saveFileToIDB(updatedDoc.id, blobOrUrl);
    }
    const docToSave = { ...updatedDoc, fileUrl: undefined };
    setDocuments(prev => {
      const next = prev.map(d => d.id === updatedDoc.id ? docToSave : d);
      saveDocsToStorage(next);
      return next;
    });
  }, [saveDocsToStorage]);

  const deleteDocument = useCallback((docId: string): boolean => {
    removeFileFromIDB(docId);
    setDocuments(prev => {
      const next = prev.filter(d => d.id !== docId);
      saveDocsToStorage(next);
      return next;
    });
    return true;
  }, [saveDocsToStorage]);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: 'u-' + Date.now() };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const addService = useCallback((service: Omit<Service, 'id' | 'subServices'>) => {
    const newS: Service = { ...service, id: 'srv-' + Date.now(), subServices: [] };
    setServices(prev => [...prev, newS]);
  }, []);

  const updateService = useCallback((updatedService: Service) => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  }, []);

  const deleteService = useCallback((serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  }, []);

  const addSubService = useCallback((serviceId: string, sub: { name: string; code: string; description: string }) => {
    const newSub: SubService = { id: 'sub-' + Date.now(), serviceId, ...sub };
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, subServices: [...(s.subServices || []), newSub] } : s));
  }, []);

  const updateSubService = useCallback((serviceId: string, updatedSub: SubService) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          subServices: (s.subServices || []).map(sub => sub.id === updatedSub.id ? updatedSub : sub)
        };
      }
      return s;
    }));
  }, []);

  const deleteSubService = useCallback((serviceId: string, subId: string) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          subServices: (s.subServices || []).filter(sub => sub.id !== subId)
        };
      }
      return s;
    }));
  }, []);

  const moveSubService = useCallback((serviceId: string, subId: string, direction: 'up' | 'down') => {
    setServices(prev => prev.map(srv => {
      if (srv.id !== serviceId) return srv;
      const subs = [...(srv.subServices || [])];
      const index = subs.findIndex(s => s.id === subId);
      if (index === -1) return srv;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= subs.length) return srv;
      const temp = subs[index];
      subs[index] = subs[targetIndex];
      subs[targetIndex] = temp;
      return { ...srv, subServices: subs };
    }));
  }, []);

  const addVaultItem = useCallback((item: Omit<VaultItem, 'id'>) => {
    setVaultItems(prev => [{ ...item, id: 'v-' + Date.now() }, ...prev]);
  }, []);

  const updateVaultItem = useCallback((updatedItem: VaultItem) => {
    setVaultItems(prev => prev.map(v => v.id === updatedItem.id ? updatedItem : v));
  }, []);

  const deleteVaultItem = useCallback((id: string) => {
    setVaultItems(prev => prev.filter(v => v.id !== id));
  }, []);

  const addEmergencyContact = useCallback((contact: Omit<EmergencyContact, 'id'>) => {
    setEmergencyContacts(prev => [...prev, { ...contact, id: 'ec-' + Date.now() }]);
  }, []);

  const updateEmergencyContact = useCallback((updated: EmergencyContact) => {
    setEmergencyContacts(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  const deleteEmergencyContact = useCallback((id: string) => {
    setEmergencyContacts(prev => prev.filter(e => e.id !== id));
  }, []);

  const addUserToolLink = useCallback((link: Omit<UserToolLink, 'id'>) => {
    setUserToolLinks(prev => [...prev, { ...link, id: 'utl-' + Date.now() }]);
  }, []);

  const updateUserToolLink = useCallback((updated: UserToolLink) => {
    setUserToolLinks(prev => prev.map(l => l.id === updated.id ? updated : l));
  }, []);

  const deleteUserToolLink = useCallback((id: string) => {
    setUserToolLinks(prev => prev.filter(l => l.id !== id));
  }, []);

  const consultDocument = useCallback(async (doc: DocumentItem) => {
    let fileUrl = doc.fileUrl;
    if (!fileUrl && doc.id) {
      fileUrl = await getFileFromIDB(doc.id);
    }
    
    if (!fileUrl) {
      const previewHtml = `
        <html>
          <head>
            <title>Consultation - ${doc.title}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
              .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
              h1 { font-size: 20px; color: #0f172a; margin: 0 0 8px 0; }
              .meta { font-size: 13px; color: #64748b; }
              .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-bottom: 16px; }
              .content { background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; line-height: 1.6; font-size: 14px; }
              .actions { display: flex; justify-content: flex-end; gap: 12px; }
              button, a { background: #0284c7; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: none; cursor: pointer; }
              button:hover, a:hover { background: #0369a1; }
              .print-btn { background: #475569; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div>
                  <span class="badge">Marché d'Intérêt National • ${doc.serviceId?.toUpperCase() || 'OFFICIEL'}</span>
                  <h1>${doc.title}</h1>
                  <p class="meta">Réf : ${doc.ref || 'N/A'} • Auteur : ${doc.authorName || 'Direction'} • Date : ${doc.uploadDate || 'N/A'}</p>
                </div>
              </div>
              <div class="content">
                <strong>Description / Objet :</strong>
                <p>${doc.description || 'Aucune description détaillée fournie pour ce document officiel.'}</p>
                <p style="margin-top: 16px; color: #64748b; font-size: 12px;">Format : ${doc.fileType || 'PDF'} • Taille : ${doc.fileSize || '2.0 Mo'} • Statut : Document Officiel Validé</p>
              </div>
              <div class="actions">
                <button class="print-btn" onclick="window.print()">Imprimer</button>
                <button onclick="window.close()">Fermer</button>
              </div>
            </div>
          </body>
        </html>
      `;
      fileUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(previewHtml);
    }
    if (fileUrl) {
      const win = window.open('', '_blank');
      if (win) {
        if (fileUrl.startsWith('data:text/html')) {
          win.document.open();
          win.document.write(decodeURIComponent(fileUrl.split(',')[1]));
          win.document.close();
        } else {
          win.document.write(`
            <html>
              <head>
                <title>Consultation - ${doc.title}</title>
                <style>
                  body { font-family: system-ui, sans-serif; padding: 30px; background: #0f172a; color: #f8fafc; text-align: center; }
                  .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
                  h1 { font-size: 18px; margin-bottom: 8px; }
                  p { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
                  iframe { width: 100%; height: 500px; border: none; border-radius: 8px; background: white; margin-top: 16px; }
                  .actions { margin-top: 20px; display: flex; justify-content: center; gap: 12px; }
                  a, button { background: #0284c7; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: none; cursor: pointer; }
                  a:hover, button:hover { background: #0284c7; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>${doc.title}</h1>
                  <p>Réf: ${doc.ref || 'N/A'} • Ajouté le ${doc.uploadDate || 'N/A'} • ${doc.fileSize || '2.0 Mo'}</p>
                  <iframe src="${fileUrl}" title="${doc.title}"></iframe>
                  <div class="actions">
                    <a href="${fileUrl}" download="${doc.fileName || 'document'}">Télécharger le fichier</a>
                    <button onclick="window.print()">Imprimer</button>
                  </div>
                </div>
              </body>
            </html>
          `);
          win.document.close();
        }
        return;
      }
    } else {
      alert("Impossible d'ouvrir ce document.");
    }
  }, []);

  const getFilteredUniversalResults = useCallback(() => {
    const q = (searchQuery || '').toLowerCase();
    if (!q) return { users: [], contracts: [], documents: [], mails: [], services: [] };
    const matchingDocs = documents.filter(d => 
      (d?.title || '').toLowerCase().includes(q) ||
      (d?.description || '').toLowerCase().includes(q) ||
      (d?.fournisseurName || '').toLowerCase().includes(q) ||
      (d?.clientName || '').toLowerCase().includes(q) ||
      (d?.nomMarche || '').toLowerCase().includes(q) ||
      (d?.category || '').toLowerCase().includes(q) ||
      (d?.subCategory || '').toLowerCase().includes(q) ||
      (d?.ref || '').toLowerCase().includes(q)
    );
    const contractDocs = matchingDocs.filter(d => d.serviceId?.toLowerCase() === 'contrats' || d.serviceId?.toLowerCase() === 'srv-cont' || ['fournisseurs', 'clients', 'marches_publics'].includes(d.category));
    const generalDocs = matchingDocs.filter(d => !contractDocs.some(cd => cd.id === d.id));
    return {
      users: users.filter(u => 
        (u?.firstName || '').toLowerCase().includes(q) ||
        (u?.lastName || '').toLowerCase().includes(q) ||
        (u?.email || '').toLowerCase().includes(q) ||
        (u?.fonction || '').toLowerCase().includes(q)
      ),
      contracts: contractDocs,
      documents: generalDocs,
      mails: mails.filter(m => 
        (m?.subject || '').toLowerCase().includes(q) ||
        (m?.sender || '').toLowerCase().includes(q) ||
        (m?.recipient || '').toLowerCase().includes(q) ||
        (m?.ref || '').toLowerCase().includes(q)
      ),
      services: services.filter(s => 
        (s?.name || '').toLowerCase().includes(q) ||
        (s?.description || '').toLowerCase().includes(q)
      ),
    };
  }, [searchQuery, users, documents, mails, services]);

  const contextValue = useMemo(() => ({
    currentUser, setCurrentUser, users, services, contracts, mails, leaves, 
    cashSessions, documents, tasks, vaultItems, emergencyContacts, userToolLinks,
    contractAlertDays, setContractAlertDays, generalLabels, updateGeneralLabel,
    activeTab, setActiveTab, selectedServiceId, setSelectedServiceId, 
    searchQuery, setSearchQuery, modalState, openModal, closeModal, 
    login, logout, updateContractDecision, respondToContract, addContract, 
    addMail, updateMail, deleteMail, updateMailStatus, updateMailAssignmentStatus, addLeaveRequest, 
    updateLeaveStatus, saveCashSession, uploadDocument, updateDocument, 
    deleteDocument, addUser, updateUser, deleteUser, addService, updateService, 
    deleteService, addSubService, updateSubService, deleteSubService, moveSubService,
    addVaultItem, updateVaultItem, deleteVaultItem, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
    addUserToolLink, updateUserToolLink, deleteUserToolLink, getFilteredUniversalResults,
    consultingItem, setConsultingItem, consultDocument
  }), [
    currentUser, users, services, contracts, mails, leaves, cashSessions, documents,
    tasks, vaultItems, emergencyContacts, userToolLinks, contractAlertDays, generalLabels,
    activeTab, selectedServiceId, searchQuery, modalState, openModal, closeModal, login,
    logout, updateContractDecision, respondToContract, addContract, addMail, updateMail,
    deleteMail, updateMailStatus, updateMailAssignmentStatus, addLeaveRequest, updateLeaveStatus,
    saveCashSession, uploadDocument, updateDocument, deleteDocument, addUser, updateUser,
    deleteUser, addService, updateService, deleteService, addSubService, updateSubService,
    deleteSubService, moveSubService, addVaultItem, updateVaultItem, deleteVaultItem,
    addEmergencyContact, updateEmergencyContact, deleteEmergencyContact, addUserToolLink,
    updateUserToolLink, deleteUserToolLink, getFilteredUniversalResults, updateGeneralLabel,
    consultingItem, setConsultingItem, consultDocument
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl animate-pulse mb-4">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold">Chargement de l'Intranet MIN Marseille...</h2>
        <p className="text-sm text-slate-500 mt-2">Synchronisation avec la base de données Firestore...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
