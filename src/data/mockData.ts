import { User, Service, Contract, Mail, LeaveRequest, CashSession, DocumentItem, Task, VaultItem, EmergencyContact, UserToolLink } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    email: 'cpayen@min-mmm.fr',
    password: 'admin',
    firstName: 'Christophe',
    lastName: 'Payen',
    fixedPhone: '04 93 00 11 22',
    mobilePhone: '06 12 34 56 78',
    serviceId: 'srv-admin',
    role: 'admin',
    fonction: 'Directeur Général & Administrateur Système',
    permissions: [
      'sub-gmao', 'sub-gtc', 'sub-plans', 'sub-chantier',
      'sub-comptage', 'sub-ventil', 'sub-histo_caisse',
      'sub-acompte', 'sub-cet', 'sub-attestations', 'sub-plan_rh',
      'sub-budgets', 'sub-tb_fin', 'sub-frais', 'sub-bons',
      'sub-reg_fourn', 'sub-reg_client', 'sub-alert_cont',
      'sub-corporate', 'sub-ca', 'sub-discipline', 'sub-dsp', 'sub-actionnaires',
      'sub-courrier_reg', 'sub-relances'
    ],
  },
  {
    id: 'u-2',
    email: 'm.dupont@min-mmm.fr',
    password: 'password',
    firstName: 'Marc',
    lastName: 'Dupont',
    fixedPhone: '04 93 00 11 33',
    mobilePhone: '06 98 76 54 32',
    serviceId: 'srv-expl',
    role: 'manager',
    fonction: 'Responsable Technique & Exploitation',
    permissions: ['sub-gmao', 'sub-gtc', 'sub-plans', 'sub-reg_fourn', 'sub-alert_cont'],
  },
  {
    id: 'u-3',
    email: 'a.martin@min-mmm.fr',
    password: 'password',
    firstName: 'Alice',
    lastName: 'Martin',
    fixedPhone: '04 93 00 11 44',
    mobilePhone: '06 45 67 89 01',
    serviceId: 'srv-caisse',
    role: 'collaborator',
    fonction: 'Agent de Recettes & Comptage Caisse',
    permissions: ['sub-comptage', 'sub-ventil', 'sub-courrier_reg'],
  },
  {
    id: 'u-4',
    email: 's.bernard@min-mmm.fr',
    password: 'password',
    firstName: 'Sophie',
    lastName: 'Bernard',
    fixedPhone: '04 93 00 11 55',
    mobilePhone: '06 11 22 33 44',
    serviceId: 'srv-secr',
    role: 'collaborator',
    fonction: 'Secrétaire de Direction & Courriers',
    permissions: ['sub-courrier_reg', 'sub-relances', 'sub-corporate'],
  },
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-expl',
    name: 'Exploitation, Travaux & Bâtiments',
    code: 'EXPLOITATION',
    description: 'Gestion des infrastructures, GMAO, GTC/GTB, plans et chantiers',
    iconName: 'Wrench',
    subServices: [
      { id: 'sub-gmao', serviceId: 'srv-expl', name: 'GMAO (Maintenance Assistée)', code: 'GMAO', description: 'Logiciel de gestion de maintenance' },
      { id: 'sub-gtc', serviceId: 'srv-expl', name: 'GTC / GTB (Technique Bâtiment)', code: 'GTC', description: 'Gestion technique centralisée' },
      { id: 'sub-plans', serviceId: 'srv-expl', name: 'Plans & Maintenances Préventives', code: 'PLANS', description: 'Plans des structures et fiches techniques' },
      { id: 'sub-chantier', serviceId: 'srv-expl', name: 'Suivi Chantier & Travaux Neufs', code: 'CHANTIER', description: 'Suivi des chantiers en cours' }
    ]
  },
  {
    id: 'srv-caisse',
    name: 'Saisie & Gestion de Caisse',
    code: 'CAISSE',
    description: 'Module financier, comptage caisse, ventilation et clôtures',
    iconName: 'Calculator',
    subServices: [
      { id: 'sub-comptage', serviceId: 'srv-caisse', name: 'Comptage & Clôture de Caisse', code: 'COMPTAGE', description: 'Saisie coupures et calcul d\'écarts' },
      { id: 'sub-ventilation', serviceId: 'srv-caisse', name: 'Ventilation des Recettes', code: 'VENTIL', description: 'Répartition par types de recettes' },
      { id: 'sub-histo_caisse', serviceId: 'srv-caisse', name: 'Historique & Exports', code: 'HISTO_CAISSE', description: 'Suivi hebdomadaire et mensuel' }
    ]
  },
  {
    id: 'srv-rh',
    name: 'Ressources Humaines & Absences',
    code: 'RH',
    description: 'Gestion des acomptes, CET, attestations et dossiers individuels',
    iconName: 'Users',
    subServices: [
      { id: 'sub-acompte', serviceId: 'srv-rh', name: 'Demandes d’Acompte', code: 'ACOMPTE', description: 'Formulaires d\'acomptes sur salaire' },
      { id: 'sub-cet', serviceId: 'srv-rh', name: 'Demande d’Approvisionnement CET', code: 'CET', description: 'Compte Épargne Temps' },
      { id: 'sub-attestations', serviceId: 'srv-rh', name: 'Attestations & Dossiers', code: 'ATTEST', description: 'Documents administratifs RH' },
      { id: 'sub-plan_rh', serviceId: 'srv-rh', name: 'Planification & Présences', code: 'PLAN_RH', description: 'Gestion des plannings' }
    ]
  },
  {
    id: 'srv-fin',
    name: 'Finance, Comptabilité & Modèles',
    code: 'FINANCE',
    description: 'Budgets, tableaux de bord financiers, notes de frais et bons',
    iconName: 'FileText',
    subServices: [
      { id: 'sub-budgets', serviceId: 'srv-fin', name: 'Budgets & Suivi Analytique', code: 'BUDGETS', description: 'Suivi budgétaire annuel' },
      { id: 'sub-tb_fin', serviceId: 'srv-fin', name: 'Tableaux de Bord Financiers', code: 'TB_FIN', description: 'Indicateurs de gestion et ratios' },
      { id: 'sub-frais', serviceId: 'srv-fin', name: 'Notes de Frais & Acomptes', code: 'FRAIS', description: 'Remboursements de frais' },
      { id: 'sub-bons', serviceId: 'srv-fin', name: 'Bons d’Approvisionnement', code: 'BONS', description: 'Commandes internes et bons de commande' }
    ]
  },
  {
    id: 'srv-cont',
    name: 'Gestion des Contrats (Fournisseurs &...)',
    code: 'CONTRATS',
    description: 'Registre centralisé fournisseurs et clients, avenants et alertes',
    iconName: 'ShieldCheck',
    subServices: [
      { id: 'sub-reg_fourn', serviceId: 'srv-cont', name: 'Registre Contrats Fournisseurs', code: 'REG_FOURN', description: 'Contrats et avenants fournisseurs' },
      { id: 'sub-reg_client', serviceId: 'srv-cont', name: 'Registre Contrats Clients', code: 'REG_CLIENT', description: 'Baux, concessions et redevances clients' },
      { id: 'sub-alert_cont', serviceId: 'srv-cont', name: 'Alertes & Échéances', code: 'ALERT_CONT', description: 'Suivi des préavis et renouvellements' }
    ]
  },
  {
    id: 'srv-jur',
    name: 'Espace Juridique & Institutionnel',
    code: 'JURIDIQUE',
    description: 'Corporate, Conseils d\'Administration, Discipline, DSP et Actionnaires',
    iconName: 'Briefcase',
    subServices: [
      { id: 'sub-corporate', serviceId: 'srv-jur', name: 'Documents Corporate', code: 'CORP', description: 'Statuts, Kbis et actes fondateurs' },
      { id: 'sub-ca', serviceId: 'srv-jur', name: 'Conseils d’Administration (CA)', code: 'CA', description: 'Ordres du jour, PV et délibérations' },
      { id: 'sub-discipline', serviceId: 'srv-jur', name: 'Conseil de Discipline', code: 'DISC', description: 'Dossiers et procédures disciplinaires' },
      { id: 'sub-dsp', serviceId: 'srv-jur', name: 'Contrats DSP & Avenants', code: 'DSP', description: 'Délégations de service public' },
      { id: 'sub-actionnaires', serviceId: 'srv-jur', name: 'Échanges Actionnaires', code: 'ACT', description: 'Correspondances et rapports actionnariaux' }
    ]
  },
  {
    id: 'srv-comm',
    name: 'Communication & Événements',
    code: 'COMMUNICATION',
    description: 'Actualités, communiqués, supports de communication et événements du MIN',
    iconName: 'Bell',
    subServices: [
      { id: 'sub-comm_actu', serviceId: 'srv-comm', name: 'Actualités & Communiqués', code: 'ACTU', description: 'Notes d\'information et communiqués internes' },
      { id: 'sub-comm_events', serviceId: 'srv-comm', name: 'Événements & Manifestations', code: 'EVENTS', description: 'Organisation et supports d\'événements' }
    ]
  },
  {
    id: 'srv-secr',
    name: 'Gestion du Courrier (Arrivée/Départ)',
    code: 'SECRETARIAT',
    description: 'Courrier entrant et sortant, attributions multi-collaborateurs',
    iconName: 'Mail',
    subServices: [
      { id: 'sub-courrier_reg', serviceId: 'srv-secr', name: 'Enregistrement Courrier Entrant / Sortant', code: 'COURRIER_REG', description: 'Flux physiques et numériques' },
      { id: 'sub-relances', serviceId: 'srv-secr', name: 'Attributions & Suivi des Délais', code: 'ATTRIBS', description: 'Suivi des actions et relances' }
    ]
  }
];

export const INITIAL_VAULT: VaultItem[] = [];

export const INITIAL_EMERGENCY_CONTACTS: EmergencyContact[] = [];

export const INITIAL_USER_TOOL_LINKS: UserToolLink[] = [];

export const INITIAL_CONTRACTS: Contract[] = [];

export const INITIAL_MAILS: Mail[] = [];

export const INITIAL_LEAVES: LeaveRequest[] = [];

export const INITIAL_CASH_SESSIONS: CashSession[] = [];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  // --- JURIDIQUE ---
  {
    id: 'doc-leg-1',
    title: 'Convention de DSP 2024-2030',
    description: 'Contrat cadre de délégation de service public.',
    serviceId: 'juridique',
    category: 'juridique',
    subCategory: '1. Contrats DSP & Avenants',
    uploadDate: '2026-01-10',
    authorName: 'Direction Générale',
    fileSize: '2.4 MB',
    fileType: 'pdf',
    isPublic: true
  },
  // --- EXPLOITATION ---
  {
    id: 'doc-exp-1',
    title: 'Manuel utilisateur Carl Source GMAO',
    description: 'Procédure de création des tickets de maintenance.',
    serviceId: 'exploitation',
    category: 'exploitation',
    subCategory: '1. GMAO (Maintenance Assistée)',
    uploadDate: '2026-02-15',
    authorName: 'Service Technique',
    fileSize: '1.8 MB',
    fileType: 'pdf',
    isPublic: true
  },
  {
    id: 'doc-exp-2',
    title: 'Paramétrage des consignes GTC/GTB',
    description: 'Guide des réglages thermiques et d\'éclairage.',
    serviceId: 'exploitation',
    category: 'exploitation',
    subCategory: '2. GTC / GTB (Technique)',
    uploadDate: '2026-01-20',
    authorName: 'Responsable GTB',
    fileSize: '950 KB',
    fileType: 'pdf',
    isPublic: true
  },
  // --- TOUT AUTRE SERVICE PRÉSENT OU FUTUR ---
  {
    id: 'doc-rh-1',
    title: 'Formulaire de demande de congés',
    description: 'Trame de demande d\'absence.',
    serviceId: 'rh',
    category: 'rh',
    subCategory: '1. Demandes de Congés',
    uploadDate: '2026-01-05',
    authorName: 'Ressources Humaines',
    fileSize: '320 KB',
    fileType: 'pdf',
    isPublic: true
  },
  {
    id: 'doc-fin-1',
    title: 'Formulaire Note de Frais 2026',
    description: 'Remboursements et avances sur frais pro.',
    serviceId: 'finance',
    category: 'finance',
    subCategory: '1. Notes de Frais & Acomptes',
    uploadDate: '2026-01-15',
    authorName: 'Direction Financière',
    fileSize: '480 KB',
    fileType: 'xlsx',
    isPublic: true
  },
  {
    id: 'doc-con-1',
    title: 'Contrat Maintenance Ponts Bascule 2026',
    description: 'Prestations, maintenance et équipements.',
    serviceId: 'contrats',
    category: 'contrats',
    subCategory: '1. Contrats Fournisseurs',
    uploadDate: '2026-01-10',
    authorName: 'Direction Technique',
    fileSize: '2.4 MB',
    fileType: 'pdf',
    isPublic: true
  }
];

export const INITIAL_TASKS: Task[] = [];

