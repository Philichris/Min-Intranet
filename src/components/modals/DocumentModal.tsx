import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, FolderKanban } from 'lucide-react';

export const DocumentModal: React.FC = () => {
  const { closeModal, uploadDocument, services, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Procédures Techniques');
  const [serviceId, setServiceId] = useState(currentUser.serviceId || services[0]?.id);
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Veuillez renseigner le titre du document.');
      return;
    }
    uploadDocument({
      title,
      category,
      serviceId,
      isPublic,
      fileSize: '1.4 Mo',
      fileType: 'PDF'
    });
    closeModal();
    alert('Document déposé avec succès.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={closeModal}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Déposer un Document</h3>
            <p className="text-xs text-slate-500">Ajout dans le sous-service ou la bibliothèque générale</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Titre du document</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Guide de maintenance préventive Q3"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              >
                <option value="Procédures Techniques">Procédures Techniques</option>
                <option value="Modèles Administratifs">Modèles Administratifs</option>
                <option value="Coffre-fort Légal">Coffre-fort Légal</option>
                <option value="Plans Techniques">Plans Techniques</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Service de rattachement</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isPublicCheck"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isPublicCheck" className="text-xs font-medium text-slate-700">
              Document public (accessible à tous les collaborateurs)
            </label>
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
              Déposer le fichier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
