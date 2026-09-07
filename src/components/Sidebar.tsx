import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, Users, Wrench, Calculator, FileText, ShieldCheck, 
  Briefcase, Mail, FolderKanban, Settings, ChevronLeft, ChevronRight, 
  Building, Lock, PhoneCall, Bell, Cpu
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { services, activeTab, setActiveTab, currentUser, openModal, generalLabels } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const accessibleServices = services.filter((service) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.serviceId === service.id) return true;
    if (currentUser.permissions?.includes(service.id)) return true;
    return (service.subServices || []).some(sub => currentUser.permissions?.includes(sub.id));
  });

  const toolServices = accessibleServices.filter(s => s.code === 'CAISSE' || s.code === 'SECRETARIAT');
  const docServices = accessibleServices.filter(s => s.code !== 'CAISSE' && s.code !== 'SECRETARIAT');

  const getServiceColorConfig = (code: string) => {
    switch (code) {
      case 'EXPLOITATION':
        return {
          icon: <Wrench className="h-4 w-4" />,
          colorClass: 'text-cyan-600',
          activeClass: 'bg-cyan-50 text-cyan-800 border-l-4 border-cyan-600 shadow-2xs font-bold',
          badgeClass: 'bg-cyan-100 text-cyan-800'
        };
      case 'CAISSE':
        return {
          icon: <Calculator className="h-4 w-4" />,
          colorClass: 'text-emerald-600',
          activeClass: 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-2xs font-bold',
          badgeClass: 'bg-emerald-100 text-emerald-800'
        };
      case 'RH':
        return {
          icon: <Users className="h-4 w-4" />,
          colorClass: 'text-indigo-600',
          activeClass: 'bg-indigo-50 text-indigo-800 border-l-4 border-indigo-600 shadow-2xs font-bold',
          badgeClass: 'bg-indigo-100 text-indigo-800'
        };
      case 'FINANCE':
        return {
          icon: <FileText className="h-4 w-4" />,
          colorClass: 'text-amber-600',
          activeClass: 'bg-amber-50 text-amber-800 border-l-4 border-amber-600 shadow-2xs font-bold',
          badgeClass: 'bg-amber-100 text-amber-800'
        };
      case 'CONTRATS':
        return {
          icon: <ShieldCheck className="h-4 w-4" />,
          colorClass: 'text-blue-600',
          activeClass: 'bg-blue-50 text-blue-800 border-l-4 border-blue-600 shadow-2xs font-bold',
          badgeClass: 'bg-blue-100 text-blue-800'
        };
      case 'JURIDIQUE':
        return {
          icon: <Briefcase className="h-4 w-4" />,
          colorClass: 'text-amber-800',
          activeClass: 'bg-amber-50 text-amber-900 border-l-4 border-amber-700 shadow-2xs font-bold',
          badgeClass: 'bg-amber-100 text-amber-900'
        };
      case 'COMMUNICATION':
        return {
          icon: <Bell className="h-4 w-4" />,
          colorClass: 'text-purple-600',
          activeClass: 'bg-purple-50 text-purple-800 border-l-4 border-purple-600 shadow-2xs font-bold',
          badgeClass: 'bg-purple-100 text-purple-800'
        };
      case 'SECRETARIAT':
        return {
          icon: <Mail className="h-4 w-4" />,
          colorClass: 'text-sky-600',
          activeClass: 'bg-sky-50 text-sky-800 border-l-4 border-sky-600 shadow-2xs font-bold',
          badgeClass: 'bg-sky-100 text-sky-800'
        };
      case 'IT_RGPD':
        return {
          icon: <Cpu className="h-4 w-4" />,
          colorClass: 'text-indigo-600',
          activeClass: 'bg-indigo-50 text-indigo-800 border-l-4 border-indigo-600 shadow-2xs font-bold',
          badgeClass: 'bg-indigo-100 text-indigo-800'
        };
      case 'LOCAUX':
        return {
          icon: <Building className="h-4 w-4" />,
          colorClass: 'text-emerald-600',
          activeClass: 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-2xs font-bold',
          badgeClass: 'bg-emerald-100 text-emerald-800'
        };
      case 'ETUDES':
        return {
          icon: <FolderKanban className="h-4 w-4" />,
          colorClass: 'text-violet-600',
          activeClass: 'bg-violet-50 text-violet-800 border-l-4 border-violet-600 shadow-2xs font-bold',
          badgeClass: 'bg-violet-100 text-violet-800'
        };
      default:
        return {
          icon: <Building className="h-4 w-4" />,
          colorClass: 'text-slate-600',
          activeClass: 'bg-slate-100 text-slate-900 border-l-4 border-slate-700 shadow-2xs font-bold',
          badgeClass: 'bg-slate-200 text-slate-800'
        };
    }
  };

  const handleServiceClick = (serviceId: string, code: string) => {
    if (code === 'EXPLOITATION') setActiveTab('expl');
    else if (code === 'CAISSE') setActiveTab('caisse');
    else if (code === 'RH') setActiveTab('rh');
    else if (code === 'FINANCE') setActiveTab('finance');
    else if (code === 'CONTRATS') setActiveTab('contrats');
    else if (code === 'JURIDIQUE') setActiveTab('juridique');
    else if (code === 'SECRETARIAT') setActiveTab('secretariat');
    else setActiveTab(`service-${serviceId}`);
  };

  return (
    <aside className={`relative flex flex-col border-r border-slate-200 bg-white text-slate-700 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 z-10"
        title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {/* General Section */}
        <div>
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0284c7]"></span>
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Espace Général
              </h3>
            </div>
          )}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/30' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-900'}`}
            >
              <LayoutDashboard className={`h-4 w-4 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-[#0284c7]'}`} />
              {!collapsed && <span>{generalLabels.dashboard.menuLabel}</span>}
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${activeTab === 'directory' ? 'bg-[#06b6d4] text-white shadow-md shadow-cyan-600/30' : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-900'}`}
            >
              <Users className={`h-4 w-4 shrink-0 ${activeTab === 'directory' ? 'text-white' : 'text-[#06b6d4]'}`} />
              {!collapsed && <span>{generalLabels.directory.menuLabel}</span>}
            </button>



            <button
              onClick={() => setActiveTab('emergency')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${activeTab === 'emergency' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-900'}`}
            >
              <PhoneCall className={`h-4 w-4 shrink-0 ${activeTab === 'emergency' ? 'text-white' : 'text-teal-600'}`} />
              {!collapsed && <span>{generalLabels.emergency.menuLabel}</span>}
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${activeTab === 'vault' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'}`}
            >
              <Lock className={`h-4 w-4 shrink-0 ${activeTab === 'vault' ? 'text-white' : 'text-purple-600'}`} />
              {!collapsed && <span className="truncate">{generalLabels.vault.menuLabel}</span>}
            </button>
          </nav>
        </div>

        {/* 1. APPLICATIONS & OUTILS MÉTIER (Interactifs) */}
        {toolServices.length > 0 && (
          <div>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  1. Applications & Outils Métier
                </h3>
              </div>
            )}
            <nav className="space-y-1">
              {toolServices.map((service) => {
                const isActive = activeTab === `service-${service.id}` || 
                  (service.code === 'CAISSE' && activeTab === 'caisse') ||
                  (service.code === 'SECRETARIAT' && activeTab === 'secretariat');

                const config = getServiceColorConfig(service.code);

                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service.id, service.code)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all ${
                      isActive 
                        ? config.activeClass 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'scale-110' : config.colorClass}`}>
                      {config.icon}
                    </span>
                    {!collapsed && <span className="truncate text-left">{service.name}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* 2. ESPACES DOCUMENTAIRES */}
        {docServices.length > 0 && (
          <div>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 mb-2 mt-4">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  2. Espaces documentaires
                </h3>
              </div>
            )}

            <nav className="space-y-1">
              {docServices.map((service) => {
                const isActive = activeTab === `service-${service.id}` || 
                  (service.code === 'EXPLOITATION' && activeTab === 'expl') ||
                  (service.code === 'RH' && activeTab === 'rh') ||
                  (service.code === 'FINANCE' && activeTab === 'finance') ||
                  (service.code === 'CONTRATS' && activeTab === 'contrats') ||
                  (service.code === 'JURIDIQUE' && activeTab === 'juridique') ||
                  (service.code === 'COMMUNICATION' && activeTab === 'communication');

                const config = getServiceColorConfig(service.code);

                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service.id, service.code)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all ${
                      isActive 
                        ? config.activeClass 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'scale-110' : config.colorClass}`}>
                      {config.icon}
                    </span>
                    {!collapsed && <span className="truncate text-left">{service.name}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Administration Section */}
        {currentUser.role === 'admin' && (
          <div>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]"></span>
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                  Administration
                </h3>
              </div>
            )}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('admin-users')}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${activeTab === 'admin-users' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-900'}`}
              >
                <Settings className={`h-4 w-4 shrink-0 ${activeTab === 'admin-users' ? 'text-white' : 'text-rose-500'}`} />
                {!collapsed && <span>Utilisateurs & Droits</span>}
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Footer User preview in collapsed mode */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm border border-slate-700">
            {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser.firstName} {currentUser.lastName}</p>
              <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'manager' ? 'Responsable' : 'Collaborateur'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
