import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PhoneCall, ShieldAlert, Clock, Plus, Edit2, Trash2, X } from 'lucide-react';
import { EmergencyContact } from '../../types';

export const EmergencyModule: React.FC = () => {
  const { emergencyContacts, currentUser, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact, generalLabels } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Form states
  const [serviceName, setServiceName] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [schedule, setSchedule] = useState('24/7 - Astreinte permanente');

  const isAdmin = currentUser.role === 'admin';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !name || !mobile) {
      alert('Veuillez remplir les champs obligatoires (Service, Nom, Mobile).');
      return;
    }
    addEmergencyContact({
      serviceName,
      name,
      role: role || 'Responsable d\'astreinte',
      phone: phone || '04 92 00 00 00',
      mobile,
      schedule
    });
    setServiceName('');
    setName('');
    setRole('');
    setPhone('');
    setMobile('');
    setShowAddModal(false);
    alert('Fiche d\'astreinte ajoutée avec succès.');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    updateEmergencyContact(editingContact);
    setEditingContact(null);
    alert('Fiche d\'astreinte mise à jour avec succès.');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche d\'astreinte ?')) {
      deleteEmergencyContact(id);
      alert('Fiche supprimée avec succès.');
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header Banner with MIN Red/Emergency Theme */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-rose-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#ef4444]"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-800 border border-rose-200 mb-1">
            <ShieldAlert className="h-3.5 w-3.5 text-[#ef4444]" />
            {generalLabels.emergency.badge}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{generalLabels.emergency.title}</h2>
          <p className="text-sm text-slate-500">{generalLabels.emergency.description}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Ajouter une fiche d'astreinte
          </button>
        )}
      </div>



      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emergencyContacts.map(contact => (
          <div key={contact.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{contact.serviceName}</span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{contact.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Actif
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setEditingContact(contact)}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                        title="Modifier cette fiche"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        title="Supprimer cette fiche"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">{contact.role}</p>

              <div className="mt-4 space-y-2 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-500">Fixe bureau:</span>
                  <strong className="text-slate-800 font-mono">{contact.phone}</strong>
                </div>
                <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 font-semibold">Mobile Astreinte:</span>
                  <strong className="text-emerald-900 font-mono font-bold">{contact.mobile}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 mt-2">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{contact.schedule}</span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${contact.mobile}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
              <span>Appeler l'astreinte</span>
            </a>
          </div>
        ))}
      </div>

      {/* Add Emergency Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ajouter une fiche d’urgence & astreinte</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du service / pôle</label>
                <input
                  type="text"
                  placeholder="ex: Maintenance Électrique"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du responsable</label>
                  <input
                    type="text"
                    placeholder="Prénom Nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fonction / Rôle</label>
                  <input
                    type="text"
                    placeholder="ex: Responsable Astreinte"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone fixe bureau</label>
                  <input
                    type="text"
                    placeholder="04 92 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile d'astreinte (24/7)</label>
                  <input
                    type="text"
                    placeholder="06 00 ..."
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Horaires / Permanence</label>
                <input
                  type="text"
                  placeholder="ex: 24/7 - Semaine 12"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
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
                  className="rounded-xl bg-rose-600 text-white px-5 py-2 text-xs font-bold hover:bg-rose-500 shadow-lg shadow-rose-600/30"
                >
                  Créer la fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Emergency Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setEditingContact(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Modifier la fiche d’astreinte</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du service / pôle</label>
                <input
                  type="text"
                  value={editingContact.serviceName}
                  onChange={(e) => setEditingContact({ ...editingContact, serviceName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du responsable</label>
                  <input
                    type="text"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fonction / Rôle</label>
                  <input
                    type="text"
                    value={editingContact.role}
                    onChange={(e) => setEditingContact({ ...editingContact, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone fixe bureau</label>
                  <input
                    type="text"
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile d'astreinte (24/7)</label>
                  <input
                    type="text"
                    value={editingContact.mobile}
                    onChange={(e) => setEditingContact({ ...editingContact, mobile: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Horaires / Permanence</label>
                <input
                  type="text"
                  value={editingContact.schedule}
                  onChange={(e) => setEditingContact({ ...editingContact, schedule: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 text-white px-5 py-2 text-xs font-bold hover:bg-rose-500 shadow-lg shadow-rose-600/30"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
