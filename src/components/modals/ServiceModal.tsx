import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Building } from 'lucide-react';

export const ServiceModal: React.FC = () => {
  const { closeModal, addService } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [iconName, setIconName] = useState('Building');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }
    addService({
      name,
      code: code.toUpperCase(),
      description,
      iconName
    });
    closeModal();
    alert('Nouveau service créé avec succès.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative">
        <button 
          onClick={closeModal}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Créer un Nouveau Service</h3>
            <p className="text-xs text-slate-500">Arborescence dynamique des départements et sous-services</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du service</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Logistique & Transport"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Code court (ex: LOGISTIQUE)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LOG"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Icône du service</label>
            <select
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description des missions du service..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              Créer le service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
