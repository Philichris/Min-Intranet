import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Key, Copy, Plus, Eye, EyeOff, Search, Shield, Trash2, ExternalLink, Edit2, X } from 'lucide-react';
import { VaultItem } from '../../types';

export const VaultModule: React.FC = () => {
  const { vaultItems, addVaultItem, updateVaultItem, deleteVaultItem, currentUser, openModal, generalLabels } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const [newTitle, setNewTitle] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCategory, setNewCategory] = useState('Logiciel Intranet');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords({ ...visiblePasswords, [id]: !visiblePasswords[id] });
  };

  const handleCreateVaultItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPassword) {
      alert('Veuillez remplir le titre et le mot de passe.');
      return;
    }

    addVaultItem({
      userId: currentUser.id,
      title: newTitle,
      username: newUsername || currentUser.email,
      password: newPassword,
      category: newCategory,
      url: newUrl || 'https://',
      notes: newNotes,
      serviceId: currentUser.serviceId
    });

    resetForm();
    alert('Identifiant sécurisé enregistré dans le coffre-fort.');
  };

  const handleUpdateVaultItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !newTitle || !newPassword) return;

    updateVaultItem({
      ...editingItem,
      title: newTitle,
      username: newUsername,
      password: newPassword,
      category: newCategory,
      url: newUrl,
      notes: newNotes
    });

    resetForm();
    alert('Identifiant sécurisé mis à jour avec succès.');
  };

  const resetForm = () => {
    setNewTitle('');
    setNewUsername('');
    setNewPassword('');
    setNewCategory('Logiciel Intranet');
    setNewUrl('');
    setNewNotes('');
    setEditingItem(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const filteredItems = vaultItems.filter(item => {
    const belongsToUser = item.userId === currentUser.id || (!item.userId && currentUser.role === 'admin');
    if (!belongsToUser) return false;
    return (
      (item?.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (item?.category || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (item?.username || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  });

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header Banner with Purple Vault Theme */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-purple-600"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-extrabold text-purple-800 border border-purple-200 mb-1">
            <Lock className="h-3.5 w-3.5 text-purple-600" />
            {generalLabels.vault.badge}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{generalLabels.vault.title}</h2>
          <p className="text-sm text-slate-500">{generalLabels.vault.description}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Ajouter un accès
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par service, logiciel ou identifiant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-xs font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
        />
      </div>

      {/* Vault Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const isVisible = visiblePasswords[item.id];
          return (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{item.category}</span>
                      <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
                    </div>
                  </div>
                  {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setNewTitle(item.title);
                          setNewUsername(item.username);
                          setNewPassword(item.password);
                          setNewCategory(item.category);
                          setNewUrl(item.url || '');
                          setNewNotes(item.notes || '');
                          setShowEditModal(true);
                        }}
                        className="text-slate-400 hover:text-purple-600 p-1 rounded-lg hover:bg-purple-50"
                        title="Modifier l'accès"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          openModal('confirm', {
                            title: "Supprimer l'accès",
                            message: `Voulez-vous vraiment supprimer l'accès ${item.title} ?`,
                            onConfirm: () => deleteVaultItem(item.id)
                          });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50"
                        title="Supprimer l'accès"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Identifiant / Compte</span>
                    <p className="text-xs font-bold text-slate-800 font-mono select-all">{item.username}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mot de passe</span>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 font-mono">
                        {isVisible ? item.password : '••••••••••••'}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="p-1 rounded-lg text-slate-500 hover:bg-white"
                          title={isVisible ? 'Masquer' : 'Afficher'}
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.password);
                            alert('Mot de passe copié dans le presse-papier.');
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:bg-white"
                          title="Copier"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-500 mt-3 italic">{item.notes}</p>
                )}
              </div>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <span>Accéder à l'outil</span>
                  <ExternalLink className="h-3.5 w-3.5 text-purple-600" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ajouter un Identifiant Sécurisé</h3>
            
            <form onSubmit={handleCreateVaultItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Intitulé / Service</label>
                <input
                  type="text"
                  placeholder="Ex: Accès Administrateur GMAO"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Identifiant / Login</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    placeholder="admin@min-mmm.fr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe sécurisé</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL de connexion</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 text-white px-5 py-2 text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowEditModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Modifier l'Accès Sécurisé</h3>
            
            <form onSubmit={handleUpdateVaultItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Intitulé / Service</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Identifiant / Login</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe sécurisé</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL de connexion</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 text-white px-5 py-2 text-xs font-bold hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
