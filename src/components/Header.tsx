import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogoMIN } from './LogoMIN';
import { 
  Search, Bell, User as UserIcon, LogOut, Shield, ChevronDown, Building2, ExternalLink, X, Sparkles 
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, logout, openModal, searchQuery, setSearchQuery, 
    getFilteredUniversalResults, setActiveTab, setSelectedServiceId 
  } = useApp();
  
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchResults = getFilteredUniversalResults();
  const hasResults = Object.values(searchResults).some((arr: any) => arr.length > 0);

  const roleLabels = {
    admin: 'Administrateur',
    manager: 'Responsable de Service',
    collaborator: 'Collaborateur',
  };

  const roleColors = {
    admin: 'bg-rose-100 text-rose-700 border-rose-200',
    manager: 'bg-amber-100 text-amber-700 border-amber-200',
    collaborator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md relative">
      {/* Discreet MIN color spectrum bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[#84cc16]" />
        <div className="flex-1 bg-[#0284c7]" />
        <div className="flex-1 bg-[#a3e635]" />
        <div className="flex-1 bg-[#ef4444]" />
        <div className="flex-1 bg-[#f97316]" />
        <div className="flex-1 bg-[#eab308]" />
        <div className="flex-1 bg-[#06b6d4]" />
      </div>

      {/* Brand / Logo */}
      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
        <LogoMIN size="sm" />
      </div>

      {/* Universal Search Bar */}
      <div className="relative mx-6 flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un collaborateur, un contrat, un document, un courrier..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pr-10 pl-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
              className="absolute right-3 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Dropdown */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Résultats de recherche</span>
              <button 
                onClick={() => setShowSearchDropdown(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Fermer
              </button>
            </div>

            {!hasResults ? (
              <div className="py-6 text-center text-sm text-slate-500">
                Aucun résultat trouvé pour &laquo;&nbsp;{searchQuery}&nbsp;&raquo;
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.users.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-bold text-slate-500 uppercase">Collaborateurs ({searchResults.users.length})</h4>
                    <div className="space-y-1">
                      {searchResults.users.map(u => (
                        <div 
                          key={u.id}
                          onClick={() => { setActiveTab('directory'); setSearchQuery(''); setShowSearchDropdown(false); }}
                          className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 text-sm"
                        >
                          <span className="font-medium text-slate-800">{u.firstName} {u.lastName}</span>
                          <span className="text-xs text-slate-500">{u.mobilePhone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.contracts.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-bold text-slate-500 uppercase">Contrats ({searchResults.contracts.length})</h4>
                    <div className="space-y-1">
                      {searchResults.contracts.map(c => (
                        <div 
                          key={c.id}
                          onClick={() => { setActiveTab('contrats'); setSearchQuery(''); setShowSearchDropdown(false); }}
                          className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 text-sm"
                        >
                          <span className="font-medium text-slate-800">{c.name} ({c.raisonSociale})</span>
                          <span className="text-xs font-medium text-slate-500">Échéance: {c.endDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.documents.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-bold text-slate-500 uppercase">Documents ({searchResults.documents.length})</h4>
                    <div className="space-y-1">
                      {searchResults.documents.map(d => (
                        <div 
                          key={d.id}
                          onClick={() => { setActiveTab('documents'); setSearchQuery(''); setShowSearchDropdown(false); }}
                          className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 text-sm"
                        >
                          <span className="font-medium text-slate-800">{d.title}</span>
                          <span className="text-xs rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{d.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.mails.length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-bold text-slate-500 uppercase">Courriers ({searchResults.mails.length})</h4>
                    <div className="space-y-1">
                      {searchResults.mails.map(m => (
                        <div 
                          key={m.id}
                          onClick={() => { setActiveTab('secretariat'); setSearchQuery(''); setShowSearchDropdown(false); }}
                          className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 text-sm"
                        >
                          <span className="font-medium text-slate-800">{m.subject}</span>
                          <span className="text-xs text-slate-500">{m.sender}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Gemini AI Assistant Button */}
        <button 
          onClick={() => openModal('gemini_ai')}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:opacity-90 transition-all"
          title="Assistant IA Gemini (JSON Structuré)"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Assistant IA</span>
        </button>

        {/* Quick notification button */}
        <button 
          onClick={() => alert('Aucune nouvelle notification critique.')}
          className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            2
          </span>
        </button>

        {/* User Profile Menu / Switcher */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-2.5 text-left transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-semibold text-white">
              {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-900">{currentUser.firstName} {currentUser.lastName}</div>
              <div className={`inline-block rounded-full px-1.5 py-0.2 text-[10px] font-semibold border ${roleColors[currentUser.role]}`}>
                {roleLabels[currentUser.role]}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="border-b border-slate-100 p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Connecté en tant que</p>
                <p className="text-sm font-bold text-slate-900">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <div className="mt-2">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium border ${roleColors[currentUser.role]}`}>
                    {roleLabels[currentUser.role]}
                  </span>
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={() => { setShowUserMenu(false); openModal('auth_switch'); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Shield className="h-4 w-4 text-slate-500" />
                  Changer de compte / rôle (Test)
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  Réinitialiser / Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
