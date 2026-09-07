import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckSquare, Wrench, Calculator, Users, AlertTriangle, FileText, 
  ArrowRight, Clock, Mail, CheckCircle2, AlertCircle, ShieldCheck, Download,
  Building, Briefcase, FolderKanban, ExternalLink, Globe, Server, Database
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    currentUser, tasks, mails, leaves, contracts, services, userToolLinks, setActiveTab, openModal, generalLabels, contractAlertDays 
  } = useApp();

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager' || isAdmin;
  const canContrats = isAdmin || isManager || currentUser.permissions?.some(p => p.includes('cont') || p.includes('dsp') || p.includes('sub-alert_cont'));

  const userHasAccessToService = (serviceId: string) => {
    if (isAdmin) return true;
    if (currentUser.serviceId === serviceId) return true;
    const srv = services.find(s => s.id === serviceId);
    if (!srv) return false;
    if (currentUser.permissions?.includes(srv.id)) return true;
    return (srv.subServices || []).some(sub => currentUser.permissions?.includes(sub.id));
  };

  const myTasks = tasks.filter(t => t.assignedToUserId === currentUser.id || isAdmin);
  const pendingMails = mails.filter(m => m.status !== 'Traité' && (isAdmin || m.serviceId === currentUser.serviceId || m.assignments.some(a => a.collaboratorId === currentUser.id)));
  const pendingLeaves = isManager ? leaves.filter(l => l.status === 'En attente' && (isAdmin || l.serviceId === currentUser.serviceId)) : [];
  
  const now = new Date().getTime();
  const imminentContracts = canContrats ? contracts.filter(c => {
    if (!userHasAccessToService(c.serviceId)) return false;
    const endTimestamp = new Date(c.endDate).getTime();
    const daysRemaining = Math.ceil((endTimestamp - now) / (1000 * 3600 * 24));
    return daysRemaining <= contractAlertDays && c.decisionStatus !== 'Renouvellement validé' && c.decisionStatus !== 'Résiliation / Pas de nouveau contrat';
  }) : [];

  const myToolLinks = userToolLinks.filter(l => {
    const ids = l.userIds || [(l as any).userId || 'global'];
    return ids.includes('global') || ids.includes(currentUser.id);
  });

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench': return <Wrench className="h-5 w-5" />;
      case 'Calculator': return <Calculator className="h-5 w-5" />;
      case 'Users': return <Users className="h-5 w-5" />;
      case 'ShieldCheck': return <ShieldCheck className="h-5 w-5" />;
      case 'Building': return <Building className="h-5 w-5" />;
      case 'FileText': return <FileText className="h-5 w-5" />;
      case 'Server': return <Server className="h-5 w-5" />;
      case 'Database': return <Database className="h-5 w-5" />;
      case 'Mail': return <Mail className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Welcome banner with Mediterranean theme & MIN spectrum stripe */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-indigo-50/60 to-blue-50 p-8 text-slate-900 shadow-sm border border-sky-200/80">
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="flex-1 bg-[#84cc16]" />
          <div className="flex-1 bg-[#0284c7]" />
          <div className="flex-1 bg-[#a3e635]" />
          <div className="flex-1 bg-[#ef4444]" />
          <div className="flex-1 bg-[#f97316]" />
          <div className="flex-1 bg-[#eab308]" />
          <div className="flex-1 bg-[#06b6d4]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800 border border-sky-200 mb-3">
              <span className="h-2 w-2 rounded-full bg-sky-600"></span>
              {generalLabels.dashboard.badge}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              {generalLabels.dashboard.title} • {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {generalLabels.dashboard.description} ({currentUser.fonction})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveTab('directory')}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
            >
              <Users className="h-4 w-4 text-[#0284c7]" />
              Annuaire des équipes
            </button>
            <button 
              onClick={() => openModal('add_mail')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              <Mail className="h-4 w-4" />
              Enregistrer un courrier
            </button>
          </div>
        </div>
      </div>

      {/* 1. Raccourcis & Logiciels Métiers (Moved to Top) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#84cc16]">
              <Wrench className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Raccourcis & Logiciels Métiers</h3>
              <p className="text-xs text-slate-500">Accès directs configurés pour votre profil par l'administration</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
            {myToolLinks.length} lien(s) actif(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {myToolLinks.length === 0 ? (
            <p className="text-xs text-slate-500 col-span-full py-4 text-center">Aucun raccourci logiciel configuré pour votre profil.</p>
          ) : (
            myToolLinks.map(link => {
              const icon = getToolIcon(link.icon);
              return (
                <button
                  key={link.id}
                  onClick={() => window.open(link.url, '_blank')}
                  className="flex flex-col items-start rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-md group w-full"
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform text-emerald-600">
                      {icon}
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">{link.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 truncate w-full">{link.url}</p>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 w-full flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                    <span>Ouvrir l'application</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Tâches & Alertes Contrats Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Block 1: Tâches, Courriers & Congés */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-[#0284c7]">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tâches, Courriers & Validations</h3>
                  <p className="text-xs text-slate-500">Actions en attente de votre intervention</p>
                </div>
              </div>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-extrabold text-sky-800">
                {myTasks.length + pendingMails.length + pendingLeaves.length} en attente
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {myTasks.slice(0, 2).map(task => (
                <div key={task.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-sky-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-amber-100 p-1.5 text-amber-700">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                      <p className="text-[11px] text-slate-500">{task.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('secretariat')}
                    className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
                  >
                    Traiter
                  </button>
                </div>
              ))}

              {pendingMails.slice(0, 1).map(mail => (
                <div key={mail.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-sky-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-[#0284c7]/10 p-1.5 text-[#0284c7]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Courrier: {mail.subject}</h4>
                      <p className="text-[11px] text-slate-500">Expéditeur: {mail.sender} • Échéance: {mail.dueDate}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('secretariat')}
                    className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
                  >
                    Voir
                  </button>
                </div>
              ))}

              {pendingLeaves.map(leave => (
                <div key={leave.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-sky-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Demande {leave.type}: {leave.userName}</h4>
                      <p className="text-[11px] text-slate-500">Du {leave.startDate} au {leave.endDate}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('rh')}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Valider
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => setActiveTab('secretariat')}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0284c7] hover:text-sky-800"
            >
              <span>Voir tous les courriers & tâches</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Block 2: Alertes Contrats Imminents (Only if authorized) */}
        {canContrats && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-[#ef4444]">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Alertes Contrats Imminents</h3>
                    <p className="text-xs text-slate-500">Échéances à moins de {contractAlertDays} jours nécessitant une action</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-extrabold text-rose-700">
                  {imminentContracts.length} alertes
                </span>
              </div>

              <div className="space-y-3 mt-4">
                {imminentContracts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Aucun contrat imminent dans le délai paramétré pour vos services.</p>
                ) : (
                  imminentContracts.map(contract => {
                    const isRed = contract.statusColor === 'rouge';
                    return (
                      <div key={contract.id} className={`flex items-center justify-between rounded-2xl border p-3.5 transition-colors ${isRed ? 'border-rose-200 bg-rose-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-lg p-1.5 ${isRed ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{contract.name}</h4>
                            <p className="text-[11px] text-slate-600">{contract.raisonSociale} • Échéance: {contract.endDate}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('contrats')}
                          className={`rounded-lg px-3 py-1 text-[11px] font-semibold shadow-sm text-white ${isRed ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                        >
                          Décider
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setActiveTab('contrats')}
                className="flex items-center gap-1.5 text-xs font-bold text-[#0284c7] hover:text-sky-800"
              >
                <span>Gérer tous les contrats</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
