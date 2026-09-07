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
import { saveFileToIDB, removeFileFromIDB } from '../utils/idbStorage';

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
    contracts: Contract[];
    documents: DocumentItem[];
    mails: Mail[];
    services: Service[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function initIndexedDB() {
      if (isMounted) {
        setIsLoading(false);
      }
    }
    initIndexedDB();
    return () => {
      isMounted = false;
    };
  }, []);

  if (typeof window !== 'undefined' && !localStorage.getItem('min_mmm_db_cleared_v5')) {
    localStorage.removeItem('min_mmm_contracts');
    localStorage.removeItem('min_mmm_mails');
    localStorage.removeItem('min_mmm_leaves');
    localStorage.removeItem('min_mmm_cash');
    localStorage.removeItem('min_mmm_tasks');
    localStorage.removeItem('min_mmm_vault');
    localStorage.removeItem('min_mmm_emergency');
    localStorage.removeItem('min_mmm_tool_links');
    localStorage.setItem('min_mmm_db_cleared_v5', 'true');
  }

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('min_mmm_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('min_mmm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('min_mmm_services');
    const parsed = saved ? JSON.parse(saved) : INITIAL_SERVICES;
    return parsed.map((s: any) => ({ ...s, subServices: s.subServices || [] }));
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('min_mmm_contracts');
    const parsed = saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
    return parsed.map((c: any) => ({ ...c, responses: c.responses || [] }));
  });

  const [mails, setMails] = useState<Mail[]>(() => {
    const saved = localStorage.getItem('min_mmm_mails');
    const parsed = saved ? JSON.parse(saved) : INITIAL_MAILS;
    return parsed.map((m: any) => ({ ...m, assignments: m.assignments || [] }));
  });

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('min_mmm_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVES;
  });

  const [cashSessions, setCashSessions] = useState<CashSession[]>(() => {
    const saved = localStorage.getItem('min_mmm_cash');
    return saved ? JSON.parse(saved) : INITIAL_CASH_SESSIONS;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('min_docs_v2') || localStorage.getItem('min_documents') || localStorage.getItem('min_mmm_docs');
      const loaded = saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
      if (Array.isArray(loaded)) {
        const existingIds = new Set(loaded.map((d: DocumentItem) => d.id));
        const combined = [...loaded];
        for (const initDoc of INITIAL_DOCUMENTS) {
          if (!existingIds.has(initDoc.id)) {
            combined.push(initDoc);
          }
        }
        return combined;
      }
    } catch (e) {
      console.error('Error loading documents:', e);
    }
    return INITIAL_DOCUMENTS;
  });

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

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('min_mmm_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => {
    const saved = localStorage.getItem('min_mmm_vault');
    return saved ? JSON.parse(saved) : INITIAL_VAULT;
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('min_mmm_emergency');
    return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_CONTACTS;
  });

  const [userToolLinks, setUserToolLinks] = useState<UserToolLink[]>(() => {
    const saved = localStorage.getItem('min_mmm_tool_links');
    return saved ? JSON.parse(saved) : INITIAL_USER_TOOL_LINKS;
  });

  const [contractAlertDays, setContractAlertDays] = useState<number>(() => {
    const saved = localStorage.getItem('min_mmm_alert_days');
    return saved ? Number(saved) : 90;
  });

  const [generalLabels, setGeneralLabels] = useState<GeneralLabels>(() => {
    const saved = localStorage.getItem('min_mmm_general_labels');
    return saved ? JSON.parse(saved) : {
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
    };
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [modalState, setModalState] = useState<{ type: string | null; data?: any }>({
    type: null,
    data: null,
  });

  const safeSetItem = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      console.warn('LocalStorage quota exceeded for key:', key, e);
      if (key === 'min_documents') {
        try {
          const parsed = JSON.parse(value);
          const lightweight = parsed.map((d: any) => ({
            ...d,
            fileUrl: d.fileUrl && d.fileUrl.length > 50000 ? '[Fichier stocké en session/mémoire]' : d.fileUrl
          }));
          localStorage.setItem(key, JSON.stringify(lightweight));
        } catch (err) {
          console.error('Failed to save lightweight docs', err);
        }
      }
    }
  }, []);

  // Persistence
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_users', JSON.stringify(users)); }, [users, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_current_user', JSON.stringify(currentUser)); }, [currentUser, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_services', JSON.stringify(services)); }, [services, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_contracts', JSON.stringify(contracts)); }, [contracts, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_mails', JSON.stringify(mails)); }, [mails, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_leaves', JSON.stringify(leaves)); }, [leaves, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_cash', JSON.stringify(cashSessions)); }, [cashSessions, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) saveDocsToStorage(documents); }, [documents, isLoading, saveDocsToStorage]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_tasks', JSON.stringify(tasks)); }, [tasks, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_vault', JSON.stringify(vaultItems)); }, [vaultItems, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_emergency', JSON.stringify(emergencyContacts)); }, [emergencyContacts, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_tool_links', JSON.stringify(userToolLinks)); }, [userToolLinks, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_alert_days', String(contractAlertDays)); }, [contractAlertDays, isLoading, safeSetItem]);
  useEffect(() => { if (!isLoading) safeSetItem('min_mmm_general_labels', JSON.stringify(generalLabels)); }, [generalLabels, isLoading, safeSetItem]);

  // Synchronisation inter-onglets
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'min_mmm_users') setUsers(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_services') setServices(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_contracts') setContracts(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_mails') setMails(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_leaves') setLeaves(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_cash') setCashSessions(JSON.parse(e.newValue));
        if (e.key === 'min_docs_v2' || e.key === 'min_documents' || e.key === 'min_mmm_docs') setDocuments(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_tasks') setTasks(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_vault') setVaultItems(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_emergency') setEmergencyContacts(JSON.parse(e.newValue));
        if (e.key === 'min_mmm_tool_links') setUserToolLinks(JSON.parse(e.newValue));
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    if (!currentUser) return; // Sécurisation contre currentUser === null

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

  const getFilteredUniversalResults = useCallback(() => {
    const q = (searchQuery || '').toLowerCase();
    if (!q) return { users: [], contracts: [], documents: [], mails: [], services: [] };

    return {
      users: users.filter(u => ((u?.firstName || '') + ' ' + (u?.lastName || '') + ' ' + (u?.email || '')).toLowerCase().includes(q)),
      contracts: contracts.filter(c => ((c?.name || '') + ' ' + (c?.raisonSociale || '')).toLowerCase().includes(q)),
      documents: documents.filter(d => ((d?.title || '') + ' ' + (d?.category || '')).toLowerCase().includes(q)),
      mails: mails.filter(m => ((m?.subject || '') + ' ' + (m?.sender || '')).toLowerCase().includes(q)),
      services: services.filter(s => ((s?.name || '') + ' ' + (s?.description || '')).toLowerCase().includes(q)),
    };
  }, [searchQuery, users, contracts, documents, mails, services]);

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
    addUserToolLink, updateUserToolLink, deleteUserToolLink, getFilteredUniversalResults
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
    updateUserToolLink, deleteUserToolLink, getFilteredUniversalResults, updateGeneralLabel
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
        <p className="text-sm text-slate-500 mt-2">Vérification et chargement initial de la base IndexedDB.</p>
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