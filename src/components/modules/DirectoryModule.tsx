import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Search, Phone, Mail, Building, Shield, Edit2, Trash2, Plus, X } from 'lucide-react';
import { User } from '../../types';

export const DirectoryModule: React.FC = () => {
  const { users, currentUser, updateUser, deleteUser, addUser, openModal, generalLabels } = useApp();
  const [filterQuery, setFilterQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [fixedPhone, setFixedPhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [fonction, setFonction] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'collaborator'>('collaborator');
  const [password, setPassword] = useState('password123');

  const filteredUsers = users.filter(u => {
    const matchesQuery = `${u?.firstName || ''} ${u?.lastName || ''} ${u?.email || ''} ${u?.fonction || ''} ${u?.fixedPhone || ''} ${u?.mobilePhone || ''}`.toLowerCase().includes((filterQuery || '').toLowerCase());
    return matchesQuery;
  }).sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '', 'fr', { sensitivity: 'base' }));

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    addUser({
      firstName,
      lastName,
      email,
      fixedPhone: fixedPhone || '01 42 00 00 00',
      mobilePhone: mobilePhone || '06 00 00 00 00',
      serviceId: 'srv-admin',
      role,
      fonction: fonction || 'Collaborateur',
      password
    });

    resetForm();
    alert('Collaborateur ajouté avec succès.');
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !firstName || !lastName || !email) return;

    updateUser({
      ...editingUser,
      firstName,
      lastName,
      email,
      fixedPhone,
      mobilePhone,
      fonction,
      role
    });

    resetForm();
    alert('Fiche collaborateur mise à jour avec succès.');
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setFixedPhone('');
    setMobilePhone('');
    setFonction('');
    setRole('collaborator');
    setPassword('password123');
    setEditingUser(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-cyan-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#06b6d4]"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-800 border border-cyan-200 mb-1">
            <Users className="h-3.5 w-3.5 text-[#06b6d4]" />
            {generalLabels.directory.badge}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{generalLabels.directory.title}</h2>
          <p className="text-sm text-slate-500">{generalLabels.directory.description}</p>
        </div>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#0284c7] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all"
          >
            <Users className="h-4 w-4" />
            Ajouter un collaborateur
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer par nom, prénom, email ou téléphone..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </div>
      </div>

      {/* Users grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => {
          const canEditUser = currentUser.role === 'admin' || currentUser.id === user.id;
          return (
            <div key={user.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-base font-bold text-white shadow-md shadow-cyan-600/20">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{user.firstName} {user.lastName}</h3>
                      <span className="inline-block mt-0.5 rounded-full bg-cyan-50 text-cyan-700 px-2.5 py-0.5 text-[10px] font-bold">
                        {user.fonction || 'Collaborateur'}
                      </span>
                    </div>
                  </div>

                  {canEditUser && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setFirstName(user.firstName);
                          setLastName(user.lastName);
                          setEmail(user.email);
                          setFixedPhone(user.fixedPhone);
                          setMobilePhone(user.mobilePhone);
                          setFonction(user.fonction || '');
                          setRole(user.role);
                          setShowEditModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                        title="Modifier la fiche"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {currentUser.role === 'admin' && currentUser.id !== user.id && (
                        <button
                          onClick={() => {
                            openModal('confirm', {
                              title: 'Supprimer la fiche',
                              message: `Voulez-vous vraiment supprimer la fiche de ${user.firstName} ${user.lastName} ?`,
                              onConfirm: () => deleteUser(user.id)
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <a href={`mailto:${user.email}`} className="text-cyan-600 hover:underline truncate">{user.email}</a>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Fixe: <strong className="text-slate-800">{user.fixedPhone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Mobile: <strong className="text-slate-800">{user.mobilePhone}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400">ID: {user.id}</span>
                <a
                  href={`mailto:${user.email}`}
                  className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Envoyer un email
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ajouter un Collaborateur</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email professionnel</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone fixe</label>
                  <input type="text" value={fixedPhone} onChange={e => setFixedPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone mobile</label>
                  <input type="text" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fonction / Poste (ex: Comptable, Agent d'accueil...)</label>
                <input type="text" value={fonction} onChange={e => setFonction(e.target.value)} placeholder="ex: Comptable, Responsable..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle</label>
                <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <option value="collaborator">Collaborateur</option>
                  <option value="manager">Responsable</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-[#0284c7] text-white px-5 py-2 text-xs font-bold hover:bg-sky-500 shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowEditModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Modifier la Fiche Collaborateur</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email professionnel</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone fixe</label>
                  <input type="text" value={fixedPhone} onChange={e => setFixedPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone mobile</label>
                  <input type="text" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fonction / Poste (ex: Comptable, Agent d'accueil...)</label>
                <input type="text" value={fonction} onChange={e => setFonction(e.target.value)} placeholder="ex: Comptable, Responsable..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              </div>
              <div>
                {currentUser.role === 'admin' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle</label>
                    <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <option value="collaborator">Collaborateur</option>
                      <option value="manager">Responsable</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle</label>
                    <input type="text" disabled value={role} className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500" />
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-[#0284c7] text-white px-5 py-2 text-xs font-bold hover:bg-sky-500 shadow-md">Mettre à jour</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
