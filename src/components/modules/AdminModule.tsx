import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Building, Plus, Trash2, Edit2, Shield, Check, X, Briefcase, Bell, Wrench, ArrowUp, ArrowDown, Download, Upload, Cloud, RefreshCw } from 'lucide-react';
import { User, Service, Role, SubService, GeneralLabels, UserToolLink } from '../../types';
import { getFileFromIDB, saveFileToIDB, testIndexedDB } from '../../utils/idbStorage';
import { syncDataToFirestore, fetchDatapromFirestore } from '../../lib/firestoreSync';

export const AdminModule: React.FC = () => {
  const { 
    users, services, contracts, mails, leaves, cashSessions, documents, tasks, vaultItems, emergencyContacts,
    deleteUser, openModal, currentUser, 
    updateUser, deleteService, deleteSubService, addSubService, updateService, updateSubService, moveSubService,
    contractAlertDays, setContractAlertDays, generalLabels, updateGeneralLabel,
    userToolLinks, addUserToolLink, updateUserToolLink, deleteUserToolLink 
  } = useApp();

  const [syncingCloud, setSyncingCloud] = useState(false);

  const handleSyncToFirebase = async () => {
    try {
      setSyncingCloud(true);
      await syncDataToFirestore({
        users, services, contracts, mails, leaves, cashSessions, documents, tasks, vaultItems, emergencyContacts, userToolLinks, contractAlertDays, generalLabels
      });
      alert('Toutes les modifications ont été enregistrées et synchronisées avec succès sur Firebase Firestore !');
    } catch (err: any) {
      alert('Erreur lors de la synchronisation Firebase : ' + (err.message || 'Erreur inconnue'));
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleFetchFromFirebase = async () => {
    if (!confirm('Voulez-vous récupérer les données stockées sur Firebase Firestore et remplacer l’état local ?')) return;
    try {
      setSyncingCloud(true);
      const data = await fetchDatapromFirestore();
      if (data) {
        if (data.users) localStorage.setItem('min_mmm_users', JSON.stringify(data.users));
        if (data.services) localStorage.setItem('min_mmm_services', JSON.stringify(data.services));
        if (data.contracts) localStorage.setItem('min_mmm_contracts', JSON.stringify(data.contracts));
        if (data.mails) localStorage.setItem('min_mmm_mails', JSON.stringify(data.mails));
        if (data.leaves) localStorage.setItem('min_mmm_leaves', JSON.stringify(data.leaves));
        if (data.cashSessions) localStorage.setItem('min_mmm_cash', JSON.stringify(data.cashSessions));
        if (data.documents) localStorage.setItem('min_docs_v2', JSON.stringify(data.documents));
        if (data.tasks) localStorage.setItem('min_mmm_tasks', JSON.stringify(data.tasks));
        if (data.vaultItems) localStorage.setItem('min_mmm_vault', JSON.stringify(data.vaultItems));
        if (data.emergencyContacts) localStorage.setItem('min_mmm_emergency', JSON.stringify(data.emergencyContacts));
        if (data.userToolLinks) localStorage.setItem('min_mmm_tool_links', JSON.stringify(data.userToolLinks));
        if (data.contractAlertDays) localStorage.setItem('min_mmm_alert_days', String(data.contractAlertDays));
        if (data.generalLabels) localStorage.setItem('min_mmm_general_labels', JSON.stringify(data.generalLabels));

        alert('Données récupérées avec succès depuis Firebase ! Rechargement de la page...');
        window.location.reload();
      } else {
        alert('Aucune donnée trouvée sur Firestore.');
      }
    } catch (err: any) {
      alert('Erreur lors de la récupération depuis Firebase : ' + (err.message || 'Erreur inconnue'));
    } finally {
      setSyncingCloud(false);
    }
  };

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingSubService, setEditingSubService] = useState<{ serviceId: string; sub: SubService } | null>(null);
  const [newSubServiceName, setNewSubServiceName] = useState('');
  const [newSubServiceCode, setNewSubServiceCode] = useState('');
  const [activeServiceForSub, setActiveServiceForSub] = useState<string | null>(null);
  const [alertDaysInput, setAlertDaysInput] = useState(String(contractAlertDays));
  const [generalLabelsInput, setGeneralLabelsInput] = useState({ ...generalLabels });

  const [editingToolLink, setEditingToolLink] = useState<UserToolLink | null>(null);
  const [showToolModal, setShowToolModal] = useState(false);
  const [toolTitle, setToolTitle] = useState('');
  const [toolUrl, setToolUrl] = useState('');
  const [toolIcon, setToolIcon] = useState('Wrench');
  const [toolUserIds, setToolUserIds] = useState<string[]>(['global']);

  const handleOpenNewTool = () => {
    setEditingToolLink(null);
    setToolTitle('');
    setToolUrl('https://');
    setToolIcon('Wrench');
    setToolUserIds(['global']);
    setShowToolModal(true);
  };

  const handleOpenEditTool = (link: UserToolLink) => {
    setEditingToolLink(link);
    setToolTitle(link.title);
    setToolUrl(link.url);
    setToolIcon(link.icon || 'Wrench');
    setToolUserIds(link.userIds || [(link as any).userId || 'global']);
    setShowToolModal(true);
  };

  const handleSaveTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolTitle.trim() || !toolUrl.trim()) return;
    if (toolUserIds.length === 0) {
      alert('Veuillez sélectionner au moins un utilisateur ou l\'option Globale.');
      return;
    }
    if (editingToolLink) {
      updateUserToolLink({
        id: editingToolLink.id,
        title: toolTitle,
        url: toolUrl,
        icon: toolIcon,
        userIds: toolUserIds
      });
      alert('Raccourci logiciel mis à jour avec succès.');
    } else {
      addUserToolLink({
        title: toolTitle,
        url: toolUrl,
        icon: toolIcon,
        userIds: toolUserIds
      });
      alert('Nouveau raccourci logiciel créé avec succès.');
    }
    setShowToolModal(false);
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-rose-600">Accès Restreint</h2>
        <p className="text-slate-500 mt-2">Cette section est réservée exclusivement aux administrateurs du système.</p>
      </div>
    );
  }

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser);
    setEditingUser(null);
    alert('Modifications et droits utilisateur enregistrés avec succès.');
  };

  const handleSaveServiceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    updateService(editingService);
    setEditingService(null);
    alert('Service mis à jour avec succès.');
  };

  const handleAddSubServiceSubmit = (serviceId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubServiceName || !newSubServiceCode) {
      alert('Veuillez remplir le nom et le code du métier / sous-service.');
      return;
    }
    addSubService(serviceId, {
      name: newSubServiceName,
      code: newSubServiceCode.toUpperCase(),
      description: 'Métier rattaché'
    });
    setNewSubServiceName('');
    setNewSubServiceCode('');
    setActiveServiceForSub(null);
    alert('Métier / sous-service ajouté avec succès.');
  };

  const handleSaveAlertDays = (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(alertDaysInput, 10);
    if (isNaN(days) || days <= 0) {
      alert('Veuillez entrer un nombre de jours valide.');
      return;
    }
    setContractAlertDays(days);
    alert(`Paramètre d'alerte contrats mis à jour: notification ${days} jours avant échéance.`);
  };

  const handleSaveGeneralLabels = (e: React.FormEvent) => {
    e.preventDefault();
    (Object.keys(generalLabelsInput) as Array<keyof GeneralLabels>).forEach((key) => {
      const mod = generalLabelsInput[key];
      updateGeneralLabel(key, 'menuLabel', mod.menuLabel);
      updateGeneralLabel(key, 'badge', mod.badge);
      updateGeneralLabel(key, 'title', mod.title);
      updateGeneralLabel(key, 'description', mod.description);
    });
    alert("Titres, menus et en-têtes de l'Espace Général mis à jour avec succès.");
  };

  const handleAutoFillLabels = () => {
    setGeneralLabelsInput({
      dashboard: {
        menuLabel: generalLabelsInput.dashboard.menuLabel || 'Tableau de Bord',
        badge: generalLabelsInput.dashboard.badge || 'Marché Marseille Méditerranée • Espace Intranet de Pilotage',
        title: generalLabelsInput.dashboard.title || 'Tableau de Bord & Supervision des Flux',
        description: generalLabelsInput.dashboard.description || "Vue d'ensemble consolidée des flux opérationnels, alertes contractuelles, courriers et tâches prioritaires du MIN."
      },
      directory: {
        menuLabel: generalLabelsInput.directory.menuLabel || 'Annuaire Collaborateurs',
        badge: generalLabelsInput.directory.badge || 'Annuaire Professionnel & Équipes du MIN',
        title: generalLabelsInput.directory.title || 'Répertoire des Équipes & Contacts',
        description: generalLabelsInput.directory.description || "Recherchez, contactez et gérez l'organigramme, les permanents et les affectations des services du MIN."
      },
      documents: {
        menuLabel: generalLabelsInput.documents.menuLabel || 'Bibliothèque Documents',
        badge: generalLabelsInput.documents.badge || 'Bibliothèque & Registre Documentaire Partagé',
        title: generalLabelsInput.documents.title || 'Documents Officiels & Règlements Intérieurs',
        description: generalLabelsInput.documents.description || "Accès centralisé aux procédures opérationnelles, notes de service, formulaires administratifs et chartes."
      },
      vault: {
        menuLabel: generalLabelsInput.vault.menuLabel || 'Coffre-Fort (Mots de passe)',
        badge: generalLabelsInput.vault.badge || 'Coffre-Fort Sécurisé & Accès Systèmes',
        title: generalLabelsInput.vault.title || 'Coffre-Fort Numérique & Identifiants Métiers',
        description: generalLabelsInput.vault.description || "Gestion chiffrée, sécurisée et personnelle des accès aux logiciels d'exploitation, GMAO et consoles techniques."
      },
      emergency: {
        menuLabel: generalLabelsInput.emergency.menuLabel || 'Urgences & Astreintes',
        badge: generalLabelsInput.emergency.badge || 'Poste Central de Sécurité (PCS) • Astreintes 24/7',
        title: generalLabelsInput.emergency.title || 'Contacts d’Urgence & Permanences Techniques',
        description: generalLabelsInput.emergency.description || "Annuaire opérationnel des astreintes, sécurité incendie, maintenance d'urgence et permanents du MIN."
      }
    });
  };

  const toggleUserPermission = (subServiceId: string) => {
    if (!editingUser) return;
    const currentPerms = editingUser.permissions || [];
    const hasIt = currentPerms.includes(subServiceId);
    const updatedPerms = hasIt 
      ? currentPerms.filter(p => p !== subServiceId)
      : [...currentPerms, subServiceId];
    setEditingUser({ ...editingUser, permissions: updatedPerms });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async () => {
    const hydratedDocs = await Promise.all(documents.map(async (d) => {
      let fileUrl = d.fileUrl;
      if (!fileUrl) fileUrl = await getFileFromIDB(d.id);
      return { ...d, fileUrl };
    }));

    const hydratedMails = await Promise.all(mails.map(async (m) => {
      let fileUrl = m.fileUrl;
      if (!fileUrl) fileUrl = await getFileFromIDB(m.id);
      return { ...m, fileUrl };
    }));

    const hydratedContracts = await Promise.all(contracts.map(async (c) => {
      let fileUrl = (c as any).fileUrl;
      if (!fileUrl) fileUrl = await getFileFromIDB(c.id);
      return { ...c, fileUrl };
    }));

    const backupData = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      appName: 'Marché d’Intérêt National Marseille Méditerranée - Intranet',
      data: {
        users,
        services,
        contracts: hydratedContracts,
        mails: hydratedMails,
        leaves,
        cashSessions,
        documents: hydratedDocs,
        tasks,
        vaultItems,
        emergencyContacts,
        userToolLinks,
        contractAlertDays,
        generalLabels
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `min_marseille_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert('Sauvegarde complète (fichiers inclus via IndexedDB) téléchargée avec succès.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.data) {
          const d = json.data;
          if (d.documents) {
            for (const doc of d.documents) {
              if (doc.fileUrl) {
                await saveFileToIDB(doc.id, doc.fileUrl);
              }
            }
            localStorage.setItem('min_documents', JSON.stringify(d.documents.map((doc: any) => ({ ...doc, fileUrl: undefined }))));
          }
          if (d.mails) {
            for (const mail of d.mails) {
              if (mail.fileUrl) {
                await saveFileToIDB(mail.id, mail.fileUrl);
              }
            }
            localStorage.setItem('min_mmm_mails', JSON.stringify(d.mails.map((m: any) => ({ ...m, fileUrl: undefined }))));
          }
          if (d.contracts) {
            for (const contract of d.contracts) {
              if (contract.fileUrl) {
                await saveFileToIDB(contract.id, contract.fileUrl);
              }
            }
            localStorage.setItem('min_mmm_contracts', JSON.stringify(d.contracts.map((c: any) => ({ ...c, fileUrl: undefined }))));
          }
          if (d.users) localStorage.setItem('min_mmm_users', JSON.stringify(d.users));
          if (d.services) localStorage.setItem('min_mmm_services', JSON.stringify(d.services));
          if (d.leaves) localStorage.setItem('min_mmm_leaves', JSON.stringify(d.leaves));
          if (d.cashSessions) localStorage.setItem('min_mmm_cash', JSON.stringify(d.cashSessions));
          if (d.tasks) localStorage.setItem('min_mmm_tasks', JSON.stringify(d.tasks));
          if (d.vaultItems) localStorage.setItem('min_mmm_vault', JSON.stringify(d.vaultItems));
          if (d.emergencyContacts) localStorage.setItem('min_mmm_emergency', JSON.stringify(d.emergencyContacts));
          if (d.userToolLinks) localStorage.setItem('min_mmm_tool_links', JSON.stringify(d.userToolLinks));
          if (d.contractAlertDays) localStorage.setItem('min_mmm_alert_days', String(d.contractAlertDays));
          if (d.generalLabels) localStorage.setItem('min_mmm_general_labels', JSON.stringify(d.generalLabels));

          alert('Restauration réussie ! Rechargez la page.');
          window.location.reload();
        } else {
          alert('Format de sauvegarde invalide.');
        }
      } catch (err) {
        console.error('Import backup error:', err);
        alert('Erreur lors de l’importation du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-extrabold text-rose-700">Super-Admin</span>
            <span className="text-xs text-slate-500">• Contrôle Total et Centralisé</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Administration Générale, Services & Droits Métiers</h2>
          <p className="text-sm text-slate-500 mt-1">Gestion des comptes, des droits multi-services et de l'arborescence des métiers de l'intranet.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('service')}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all"
          >
            <Building className="h-4 w-4" />
            Créer un service
          </button>
          <button
            onClick={() => openModal('add_user')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <Users className="h-4 w-4" />
            Ajouter un collaborateur
          </button>
        </div>
      </div>

      {/* Mode de Stockage & Synchronisation Firebase */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/30 p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-slate-900">Mode de Stockage & Synchronisation Cloud Firebase</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vos informations sont stockées de manière sécurisée sur <strong>Firebase Firestore</strong> (base de données cloud NoSQL), ce qui permet de synchroniser en temps réel toutes vos opérations, contrats, courriers et collaborateurs entre tous vos appareils.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60">
          <button
            type="button"
            onClick={handleSyncToFirebase}
            disabled={syncingCloud}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <Cloud className="h-4 w-4" />
            <span>{syncingCloud ? 'Synchronisation...' : 'Enregistrer / Synchroniser sur Firebase'}</span>
          </button>
          <button
            type="button"
            onClick={handleFetchFromFirebase}
            disabled={syncingCloud}
            className="flex items-center gap-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 px-4 py-2.5 text-xs font-bold hover:bg-emerald-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncingCloud ? 'animate-spin' : ''}`} />
            <span>Récupérer les données depuis Firebase</span>
          </button>
        </div>
      </div>

      {/* Sauvegarde & Export de l'Application (JSON) */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/30 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sauvegarde & Export Complet des Données (JSON)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Téléchargez une copie intégrale de l'état de l'application (utilisateurs, services, contrats, documents, tâches, courriers) sous forme de fichier de sauvegarde JSON.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => testIndexedDB()}
              className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-xs font-bold hover:bg-amber-100 transition-all shadow-sm whitespace-nowrap"
            >
              Tester IndexedDB
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-2xl bg-white border border-indigo-200 text-indigo-700 px-4 py-3 text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm whitespace-nowrap"
            >
              <Upload className="h-4 w-4" />
              Restaurer (JSON)
            </button>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 text-white px-5 py-3 text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              Télécharger la sauvegarde (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* Contrat Alert Days Parameterization */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Paramétrage des Alertes de Contrats & Échéances</h3>
              <p className="text-xs text-slate-500">Délai en jours avant échéance pour déclencher les notifications aux responsables</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveAlertDays} className="flex items-center gap-4 max-w-md">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de jours avant alerte</label>
            <input
              type="number"
              min={1}
              max={365}
              value={alertDaysInput}
              onChange={(e) => setAlertDaysInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-5 rounded-xl bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            Enregistrer le délai
          </button>
        </form>
      </div>

      {/* Gestion des Raccourcis Logiciels Métiers */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gestion des Raccourcis & Logiciels Métiers</h3>
              <p className="text-xs text-slate-500">Créez et affectez des raccourcis logiciels aux utilisateurs ou à tout le personnel</p>
            </div>
          </div>
          <button
            onClick={handleOpenNewTool}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nouveau Raccourci
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userToolLinks.map(link => {
            const ids = link.userIds || [(link as any).userId || 'global'];
            const assignedUser = ids.includes('global')
              ? '🌐 Tous les utilisateurs (Global)'
              : ids.map(id => {
                  const u = users.find(user => user.id === id);
                  return u ? `${u.firstName} ${u.lastName}` : id;
                }).join(', ');
            return (
              <div key={link.id} className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-emerald-300 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      {assignedUser}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTool(link)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Voulez-vous supprimer ce raccourci ?')) {
                            deleteUserToolLink(link.id);
                          }
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{link.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{link.url}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Icône: {link.icon || 'Globe'}</span>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-semibold">Tester le lien ↗</a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Space Customization */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Personnalisation des Menus, Titres, Badges & Descriptions (Espace Général)</h3>
              <p className="text-xs text-slate-500">Modifiez en détail le contenu et les libellés affichés dans le menu latéral et dans les en-têtes de chaque page générale</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveGeneralLabels} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(generalLabelsInput) as Array<keyof GeneralLabels>).map((key) => {
              const titles: Record<keyof GeneralLabels, string> = {
                dashboard: 'Tableau de Bord',
                directory: 'Annuaire Collaborateurs',
                documents: 'Bibliothèque Documents',
                vault: 'Coffre-Fort (Mots de passe)',
                emergency: 'Urgences & Astreintes'
              };
              const mod = generalLabelsInput[key];
              return (
                <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wide text-indigo-600">
                    {titles[key]}
                  </h4>
                    <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nom dans le Menu Latéral</label>
                    <input
                      type="text"
                      value={mod.menuLabel || ''}
                      onChange={(e) => setGeneralLabelsInput({
                        ...generalLabelsInput,
                        [key]: { ...mod, menuLabel: e.target.value }
                      })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge / Sous-titre en-tête</label>
                    <input
                      type="text"
                      value={mod.badge || ''}
                      onChange={(e) => setGeneralLabelsInput({
                        ...generalLabelsInput,
                        [key]: { ...mod, badge: e.target.value }
                      })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Titre principal de la page</label>
                    <input
                      type="text"
                      value={mod.title || ''}
                      onChange={(e) => setGeneralLabelsInput({
                        ...generalLabelsInput,
                        [key]: { ...mod, title: e.target.value }
                      })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description / Introduction</label>
                    <textarea
                      rows={2}
                      value={mod.description || ''}
                      onChange={(e) => setGeneralLabelsInput({
                        ...generalLabelsInput,
                        [key]: { ...mod, description: e.target.value }
                      })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleAutoFillLabels}
              className="rounded-xl bg-slate-100 text-slate-700 px-4 py-2.5 text-xs font-bold hover:bg-slate-200 transition-colors border border-slate-200"
            >
              ✨ Alimenter automatiquement (Propositions pertinentes)
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 text-white px-6 py-2.5 text-xs font-bold hover:bg-indigo-500 transition-colors shadow-sm"
            >
              Enregistrer toutes les modifications générales
            </button>
          </div>
        </form>
      </div>

      {/* Services & Métiers Arborescence Management */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            Arborescence des Services & Métiers (Rubriques)
          </h3>
          <span className="text-xs font-semibold text-slate-500">{services.length} départements actifs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(srv => (
            <div key={srv.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{srv.code}</span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{srv.name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingService(srv)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 transition-colors"
                      title="Modifier le service"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (services.length <= 1) {
                          alert('Impossible de supprimer le dernier service.');
                          return;
                        }
                        openModal('confirm', {
                          title: 'Supprimer le service',
                          message: `Voulez-vous vraiment supprimer le service ${srv.name} ainsi que tous ses métiers et documents ?`,
                          onConfirm: () => deleteService(srv.id)
                        });
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition-colors"
                      title="Supprimer le service"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">{srv.description}</p>
                
                {/* Métiers / Sub-services */}
                <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                      Métiers ({(srv.subServices || []).length}):
                    </span>
                    <button
                      onClick={() => setActiveServiceForSub(activeServiceForSub === srv.id ? null : srv.id)}
                      className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Ajouter
                    </button>
                  </div>

                  {activeServiceForSub === srv.id && (
                    <form onSubmit={(e) => handleAddSubServiceSubmit(srv.id, e)} className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2 mt-2 shadow-sm">
                      <input
                        type="text"
                        placeholder="Nom du métier (ex: Conseil CA)"
                        value={newSubServiceName}
                        onChange={(e) => setNewSubServiceName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Code court (ex: CA)"
                        value={newSubServiceCode}
                        onChange={(e) => setNewSubServiceCode(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
                        required
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveServiceForSub(null)}
                          className="px-2.5 py-1 text-[11px] text-slate-500"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                        >
                          Créer
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-1.5 mt-2">
                    {(srv.subServices || []).map((sub, idx, arr) => (
                      <div key={sub.id} className="text-xs font-medium text-slate-700 flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                        {editingSubService && editingSubService.sub.id === sub.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editingSubService.sub.name}
                              onChange={(e) => setEditingSubService({
                                ...editingSubService,
                                sub: { ...editingSubService.sub, name: e.target.value }
                              })}
                              className="flex-1 rounded-lg border border-indigo-300 px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              value={editingSubService.sub.code}
                              onChange={(e) => setEditingSubService({
                                ...editingSubService,
                                sub: { ...editingSubService.sub, code: e.target.value.toUpperCase() }
                              })}
                              className="w-20 rounded-lg border border-indigo-300 px-2 py-1 text-xs uppercase"
                            />
                            <button
                              onClick={() => {
                                updateSubService(srv.id, editingSubService.sub);
                                setEditingSubService(null);
                                alert('Rubrique / métier mis à jour.');
                              }}
                              className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingSubService(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px]"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-400 text-[11px] w-5">{idx + 1}.</span>
                              <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                              <span>{sub.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({sub.code})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveSubService(srv.id, sub.id, 'up')}
                                disabled={idx === 0}
                                className={`p-1 rounded ${idx === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                                title="Monter ce métier"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => moveSubService(srv.id, sub.id, 'down')}
                                disabled={idx === arr.length - 1}
                                className={`p-1 rounded ${idx === arr.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                                title="Descendre ce métier"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingSubService({ serviceId: srv.id, sub: { ...sub } })}
                                className="text-slate-400 hover:text-indigo-600 p-1"
                                title="Modifier ce métier / rubrique"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if ((srv.subServices || []).length <= 1) {
                                    alert('Le service doit conserver au moins un sous-service / métier.');
                                    return;
                                  }
                                  openModal('confirm', {
                                    title: 'Supprimer le métier',
                                    message: `Voulez-vous vraiment supprimer le métier ${sub.name} ?`,
                                    onConfirm: () => deleteSubService(srv.id, sub.id)
                                  });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Supprimer ce métier"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collaborators & Multi-Service Rights Management */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Gestion des Utilisateurs & Droits par Métier
          </h3>
          <span className="text-xs font-semibold text-slate-500">{users.length} comptes enregistrés</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Collaborateur</th>
                <th className="py-3 px-4">Service Principal</th>
                <th className="py-3 px-4">Métiers & Accès Autorisés</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const userSrv = services.find(s => s.id === u.serviceId);
                const permittedSubsCount = u.permissions ? u.permissions.length : 0;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                          {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {userSrv ? userSrv.name : 'Service Général'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
                        <Shield className="h-3 w-3" />
                        {permittedSubsCount} métiers autorisés (multiservices)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : u.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {u.role === 'admin' ? 'Administrateur' : u.role === 'manager' ? 'Responsable Service' : 'Collaborateur'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="rounded-lg bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="Modifier l'utilisateur & droits"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (u.id === currentUser.id) {
                            alert('Vous ne pouvez pas supprimer votre propre compte administrateur.');
                            return;
                          }
                          openModal('confirm', {
                            title: "Supprimer l'utilisateur",
                            message: `Voulez-vous vraiment supprimer l'utilisateur ${u.firstName} ${u.lastName} ?`,
                            onConfirm: () => deleteUser(u.id)
                          });
                        }}
                        className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal with Multi-Service Metier Permissions */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl relative my-8">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Modifier le Collaborateur & Attribuer les Droits Métiers</h3>
            <p className="text-xs text-slate-500 mb-6">Un collaborateur peut accéder à plusieurs métiers issus de services différents.</p>
            
            <form onSubmit={handleSaveUserEdit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Service de rattachement</label>
                  <select
                    value={editingUser.serviceId}
                    onChange={(e) => setEditingUser({ ...editingUser, serviceId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle global</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <option value="collaborator">Collaborateur</option>
                    <option value="manager">Responsable Service</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe du compte</label>
                  <input
                    type="text"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    placeholder="Modifier le mot de passe"
                  />
                </div>
              </div>

              {/* Rights selection by Service & Sub-Service (Metier) */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                  Sélection des Métiers par Service (Droits d'accès)
                </label>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {services.map(srv => (
                    <div key={srv.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-xs font-extrabold text-indigo-900 mb-2">{srv.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(srv.subServices || []).map(sub => {
                          const isChecked = (editingUser.permissions || []).includes(sub.id);
                          return (
                            <label key={sub.id} className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleUserPermission(sub.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                              />
                              <span className="text-xs font-medium text-slate-800">{sub.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 text-white px-5 py-2 text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setEditingService(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Modifier le Service</h3>
            <form onSubmit={handleSaveServiceEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du service</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Code court</label>
                <input
                  type="text"
                  value={editingService.code}
                  onChange={(e) => setEditingService({ ...editingService, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Icône du service</label>
                <select
                  value={editingService.iconName || 'Building'}
                  onChange={(e) => setEditingService({ ...editingService, iconName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                >
                  <option value="Building">Bâtiment / Siège (Building)</option>
                  <option value="Wrench">Technique / Maintenance (Wrench)</option>
                  <option value="Calculator">Finances / Caisse (Calculator)</option>
                  <option value="Users">Ressources Humaines (Users)</option>
                  <option value="FileText">Secrétariat / Courriers (FileText)</option>
                  <option value="ShieldAlert">Urgences / Sécurité (ShieldAlert)</option>
                  <option value="DollarSign">Budget / Trésorerie (DollarSign)</option>
                  <option value="Briefcase">Juridique / Affaires (Briefcase)</option>
                  <option value="Truck">Exploitation / Logistique (Truck)</option>
                  <option value="Lock">Sécurité / Accès (Lock)</option>
                  <option value="Mail">Courrier (Mail)</option>
                  <option value="PhoneCall">Téléphone / Astreintes (PhoneCall)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 text-white px-5 py-2 text-xs font-bold hover:bg-indigo-500"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tool Link Create/Edit Modal */}
      {showToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowToolModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingToolLink ? 'Modifier le Raccourci' : 'Créer un Raccourci Logiciel'}</h3>
            <form onSubmit={handleSaveTool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du logiciel / raccourci</label>
                <input
                  type="text"
                  value={toolTitle}
                  onChange={(e) => setToolTitle(e.target.value)}
                  placeholder="ex: Portail GMAO Bâtiments"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lien internet (URL)</label>
                <input
                  type="url"
                  value={toolUrl}
                  onChange={(e) => setToolUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Icône</label>
                <select
                  value={toolIcon}
                  onChange={(e) => setToolIcon(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                >
                  <option value="Wrench">Maintenance / Technique (Wrench)</option>
                  <option value="Calculator">Finance / Caisse (Calculator)</option>
                  <option value="Users">Ressources Humaines (Users)</option>
                  <option value="ShieldCheck">Contrats / Sécurité (ShieldCheck)</option>
                  <option value="Building">Bâtiment / Siège (Building)</option>
                  <option value="FileText">Documents / Secrétariat (FileText)</option>
                  <option value="Server">Système / Serveur (Server)</option>
                  <option value="Database">Données / Base (Database)</option>
                  <option value="Mail">Courrier / Messagerie (Mail)</option>
                  <option value="Globe">Web / Général (Globe)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Affectation des utilisateurs (plusieurs choix possibles)</label>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                    <input
                      type="checkbox"
                      checked={toolUserIds.includes('global')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setToolUserIds(['global']);
                        } else {
                          setToolUserIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>🌐 Tous les utilisateurs (Global)</span>
                  </label>
                  {users.map(u => {
                    const isChecked = !toolUserIds.includes('global') && toolUserIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={toolUserIds.includes('global') || isChecked}
                          disabled={toolUserIds.includes('global')}
                          onChange={(e) => {
                            if (toolUserIds.includes('global')) return;
                            if (e.target.checked) {
                              setToolUserIds([...toolUserIds.filter(id => id !== 'global'), u.id]);
                            } else {
                              setToolUserIds(toolUserIds.filter(id => id !== u.id));
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <span className={toolUserIds.includes('global') ? 'opacity-50' : ''}>👤 {u.firstName} {u.lastName} ({u.role})</span>
                      </label>
                    );
                  })}
                </div>
                {toolUserIds.includes('global') ? (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Ce raccourci est visible par l'ensemble du personnel.</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">{toolUserIds.length} utilisateur(s) sélectionné(s).</p>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowToolModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 text-white px-5 py-2 text-xs font-bold hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
