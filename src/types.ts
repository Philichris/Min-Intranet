export type Role = 'admin' | 'manager' | 'collaborator';

export interface GeneralModuleLabel {
  menuLabel: string;
  badge: string;
  title: string;
  description: string;
}

export interface GeneralLabels {
  dashboard: GeneralModuleLabel;
  directory: GeneralModuleLabel;
  documents: GeneralModuleLabel;
  vault: GeneralModuleLabel;
  emergency: GeneralModuleLabel;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  fixedPhone: string;
  mobilePhone: string;
  serviceId: string;
  role: Role;
  fonction: string; // Job function/title in directory
  permissions: string[]; // module or subservice IDs user has access to
}

export interface SubService {
  id: string;
  serviceId: string;
  name: string;
  code: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
  subServices: SubService[];
}

export interface VaultItem {
  id: string;
  userId?: string;
  title: string;
  username: string;
  password: string;
  category: string;
  notes: string;
  url: string;
  serviceId: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  mobile: string;
  schedule: string;
  serviceName: string;
}

export interface UserToolLink {
  id: string;
  userIds: string[];
  userId?: string; // backward compatibility
  title: string;
  url: string;
  icon: string;
}

export type ContractDecisionStatus = 
  | 'A_valider' 
  | 'Renouvellement validé' 
  | 'Résiliation / Pas de nouveau contrat' 
  | 'En négociation' 
  | 'Avenant nécessaire';

export interface ContractResponse {
  id: string;
  contractId: string;
  userId: string;
  userName: string;
  status: ContractDecisionStatus;
  comment?: string;
  date: string;
}

export interface Contract {
  id: string;
  name: string;
  raisonSociale: string; // replaces thirdParty
  type: 'Fournisseur' | 'Client';
  isAvenant: boolean; // Contrat or Avenant
  startDate: string;
  endDate: string; // replaces expiration date
  noticeDays: number;
  amount: number;
  statusColor: 'vert' | 'orange' | 'rouge';
  decisionStatus: ContractDecisionStatus;
  serviceId: string;
  attachmentName: string;
  taciteReconduction: boolean; // Oui / Non
  conditionResiliation: string;
  numeroBox?: string; // for clients
  site?: string; // for clients
  responses: ContractResponse[];
}

export type MailStatus = 'À faire' | 'Traité' | 'En retard';

export interface MailAssignment {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  actionRequired: string;
  dueDate: string;
  status: MailStatus;
  isInfoOnly?: boolean; // if true, no due date and no reminder action
}

export interface Mail {
  id: string;
  date: string;
  sender: string; // Expéditeur if Entrant, Émetteur if Sortant
  recipient?: string; // Destinataire if Sortant
  reference: string;
  subject: string;
  type: 'Entrant' | 'Sortant';
  attachmentName: string;
  fileUrl?: string;
  fileName?: string;
  serviceId: string;
  assignments: MailAssignment[];
}

export type LeaveType = 'CP' | 'RTT' | 'Arrêt Maladie' | 'Autorisation d\'absence';
export type LeaveStatus = 'En attente' | 'Validé' | 'Refusé';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  comment: string;
  serviceId: string;
}

export interface CashDenominations {
  b500: number;
  b200: number;
  b100: number;
  b50: number;
  b20: number;
  b10: number;
  b5: number;
  p2: number;
  p1: number;
  p050: number;
  p020: number;
  p010: number;
  p05: number;
  p02: number;
  p01: number;
  cheques: number;
  tpe: number;
}

export interface CashMovementRecord {
  id: string;
  type: 'Recette' | 'Sortie' | 'Régularisation';
  category: string;
  amount: number;
  comment: string;
}

export interface CashSession {
  id: string;
  date: string;
  fondDeCaisse: number;
  denominations: CashDenominations;
  totalReal: number;
  totalTheoretical: number;
  discrepancy: number;
  explanation?: string;
  movements?: CashMovementRecord[];
  revenueBreakdown: {
    droitsEntree: number;
    redevances: number;
    ventesAnnexes: number;
    prestations: number;
  };
  status: 'Brouillon' | 'Clôturé & Validé';
  validatedBy?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  serviceId: string;
  subServiceId?: string;
  subFolder?: string;
  authorName: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
  isPublic: boolean;
  ref?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToUserId: string;
  dueDate: string;
  status: 'A_faire' | 'En_cours' | 'Termine';
  priority: 'Basse' | 'Moyenne' | 'Haute';
}
