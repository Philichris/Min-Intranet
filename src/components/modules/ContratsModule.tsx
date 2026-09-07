import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Plus, Download, Trash2, FileText, Search, Settings, Edit2, X, Folder } from 'lucide-react';
import { getFileFromIDB } from '../../utils/idbStorage';

interface CategoryTab {
  id: string;
  name: string;
  label: string;
  desc: string;
  iconName: string;
}

export const ContratsModule: React.FC = () => {
  const { services, currentUser, contractAlertDays, addSubService, updateSubService, deleteSubService, openModal, documents, uploadDocument, updateDocument, deleteDocument } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const serviceObj = services.find(s => s.code === 'CONTRATS');
  const serviceTitle = serviceObj ? serviceObj.name : 'Gestion des Contrats & Avenants';
  const serviceDesc = serviceObj ? serviceObj.description : `Alertes à ${contractAlertDays} jours, rubriques paramétrables et traçabilité historique.`;

  const categories: CategoryTab[] = (serviceObj?.subServices && serviceObj.subServices.length > 0)
    ? serviceObj.subServices.map((sub, idx) => ({
        id: sub.id,
        name: sub.name,
        label: `${idx + 1}. ${sub.name}`,
        desc: sub.description || 'Rubrique officielle',
        iconName: idx === 1 ? 'FileText' : 'ShieldCheck'
      }))
    : [
        { id: 'fournisseurs', name: 'Contrats Fournisseurs', label: '1. Contrats Fournisseurs', desc: 'Prestations, maintenance et équipements', iconName: 'ShieldCheck' },
      ];

  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || 'fournisseurs');
  const [filterQuery, setFilterQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTab | null>(null);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);

  // Category form
  const [catLabel, setCatLabel] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Document form
  const [newTitle, setNewTitle] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetCategory, setTargetCategory] = useState(activeTab);
  const [newSubFolder, setNewSubFolder] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const currentCategory = categories.find(c => c.id === activeTab) || categories[0];
  const effectiveCat = currentCategory ? currentCategory.id : categories[0].id;

  // Sub-folders state
  const [subFolders, setSubFolders] = useState<Array<{ id: string; name: string; categoryId: string }>>(() => {
    try {
      const saved = localStorage.getItem('min_contrats_subfolders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'sf-ctr-1', name: '2026_Contrats_Maintenance', categoryId: 'fournisseurs' },
    ];
  });

  const [showSubFolderModal, setShowSubFolderModal] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem('min_contrats_subfolders', JSON.stringify(subFolders));
    } catch (e) {}
  }, [subFolders]);

  const handleCreateSubFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubFolderName.trim()) return;
    const newSf = {
      id: 'sf-' + Date.now(),
      name: newSubFolderName.trim(),
      categoryId: effectiveCat
    };
    setSubFolders(prev => [...prev, newSf]);
    setNewSubFolderName('');
    setShowSubFolderModal(false);
  };

  const serviceKey = 'contrats';
  const serviceDocs = documents.filter(doc => {
    const matchService = doc.serviceId?.toLowerCase() === serviceKey.toLowerCase() || doc.category?.toLowerCase() === serviceKey.toLowerCase();
    return matchService;
  });

  const defaultContractDocs: Record<string, Array<any>> = {
    fournisseurs: [
      { id: 'con-1', title: 'Contrat Maintenance Ponts Bascule 2026', category: 'fournisseurs', date: '2026-01-10', size: '2.4 Mo', type: 'PDF', ref: 'CTR-FO-01', uploader: 'Direction Technique' }
    ],
    clients: [
      { id: 'con-2', title: 'Bail Commercial Grossiste Halle A - Box 12', category: 'clients', date: '2026-02-01', size: '1.8 Mo', type: 'PDF', ref: 'CTR-CL-12', uploader: 'Service Commercial' }
    ],
    dsp: [
      { id: 'con-3', title: 'Avenant n°2 Convention DSP Gestion MIN', category: 'dsp', date: '2026-01-28', size: '4.2 Mo', type: 'PDF', ref: 'DSP-2026-A2', uploader: 'Direction Juridique' }
    ]
  };

  const globalMappedContracts = serviceDocs.map(d => ({
    id: d.id,
    title: d.title,
    category: d.subCategory || d.category || effectiveCat,
    subFolder: d.subFolder || '',
    date: d.uploadDate || new Date().toISOString().split('T')[0],
    size: d.fileSize || '2.0 Mo',
    type: d.fileType || 'PDF',
    ref: d.ref || 'REF-' + d.id.slice(-4),
    uploader: d.authorName || 'Direction Juridique',
    fileUrl: d.fileUrl,
    fileName: d.fileName
  }));

  const tabSubFolders = subFolders.filter(sf => sf.categoryId === effectiveCat);
  const tabDefaults = defaultContractDocs[effectiveCat] || [];
  const allTabContracts = [...globalMappedContracts.filter(c => c.category === effectiveCat || c.category === currentCategory?.label), ...tabDefaults.filter(td => !globalMappedContracts.some(gd => gd.id === td.id))];

  const filteredContracts = allTabContracts.filter(c => {
    const matchesQ = `${c.title} ${c.ref} ${c.uploader} ${c.subFolder}`.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesSubFolder = selectedSubFolder === 'all' || c.subFolder === selectedSubFolder;
    return matchesQ && matchesSubFolder;
  });

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Veuillez saisir un intitulé pour le contrat.');
      return;
    }

    const destCat = targetCategory || effectiveCat;
    const kb = attachedFile ? Math.round(attachedFile.size / 1024) : 2000;
    const fileSize = kb > 1024 ? (kb / 1024).toFixed(1) + ' Mo' : kb + ' Ko';
    const parts = attachedFile ? attachedFile.name.split('.') : [];
    const fileType = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PDF';

    try {
      await uploadDocument({
        title: newTitle,
        category: destCat,
        subCategory: destCat,
        subFolder: newSubFolder || undefined,
        serviceId: 'contrats',
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        uploadDate: newDate || new Date().toISOString().split('T')[0],
        fileSize,
        fileType,
        isPublic: true,
        ref: newRef || 'REF-' + Math.floor(100 + Math.random() * 900),
        fileName: attachedFile ? attachedFile.name : undefined
      }, attachedFile || undefined);

      resetForm();
      alert('Contrat enregistré avec succès.');
    } catch (err) {
      console.error('Error adding contract:', err);
      alert('Erreur lors de l’enregistrement du contrat.');
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewRef('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewSubFolder('');
    setAttachedFile(null);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) {
      deleteDocument(id);
      alert('Contrat supprimé avec succès.');
    }
  };

  const handleConsult = async (doc: { id?: string; title: string; ref: string; date: string; size: string; type: string; fileUrl?: string; fileName?: string }) => {
    let fileUrl = doc.fileUrl;
    if (!fileUrl && doc.id) {
      fileUrl = await getFileFromIDB(doc.id);
    }
    if (fileUrl) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Consultation - ${doc.title}</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 30px; background: #0f172a; color: #f8fafc; text-align: center; }
                .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
                h1 { font-size: 18px; margin-bottom: 8px; }
                p { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
                iframe { width: 100%; height: 500px; border: none; border-radius: 8px; background: white; margin-top: 16px; }
                .actions { margin-top: 20px; display: flex; justify-content: center; gap: 12px; }
                a, button { background: #0284c7; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: none; cursor: pointer; }
                a:hover, button:hover { background: #0284c7; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${doc.title}</h1>
                <p>Réf: ${doc.ref} • Ajouté le ${doc.date} • ${doc.size}</p>
                <iframe src="${fileUrl}" title="${doc.title}"></iframe>
                <div class="actions">
                  <a href="${fileUrl}" download="${doc.fileName || 'contrat'}">Télécharger le fichier</a>
                  <button onclick="window.print()">Imprimer</button>
                </div>
              </div>
            </body>
          </html>
        `);
        win.document.close();
        return;
      }
    } else {
      alert("Aucun fichier associé ou fichier introuvable dans IndexedDB pour ce contrat.");
    }
  };

  const handleOpenEditCategory = (cat: CategoryTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCatLabel(cat.name || cat.label.replace(/^\d+\.\s*/, ''));
    setCatDesc(cat.desc);
    setShowCategoryModal(true);
  };

  // Category save
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catLabel.trim()) return;

    const cleanName = catLabel.replace(/^\d+\.\s*/, '').trim();

    if (serviceObj) {
      if (editingCategory) {
        updateSubService(serviceObj.id, {
          id: editingCategory.id,
          name: cleanName,
          code: editingCategory.id,
          description: catDesc
        });
      } else {
        addSubService(serviceObj.id, {
          name: cleanName,
          code: 'sub-' + Date.now(),
          description: catDesc
        });
      }
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (categories.length <= 1) {
      alert('Impossible de supprimer la dernière rubrique.');
      return;
    }
    openModal('confirm', {
      title: 'Supprimer la rubrique',
      message: 'Voulez-vous supprimer cette rubrique et ses contrats ?',
      onConfirm: () => {
        if (serviceObj) {
          deleteSubService(serviceObj.id, catId);
        }
      }
    });
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-blue-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#0284c7]"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-800 border border-blue-200 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0284c7]" />
            {serviceObj ? serviceObj.name : 'Registre Centralisé des Contrats & DSP'}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{serviceTitle}</h2>
          <p className="text-sm text-slate-500">{serviceDesc}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatLabel('');
                setCatDesc('');
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              <Settings className="h-4 w-4" />
              Gérer les rubriques
            </button>
          )}
          <button
            onClick={() => {
              setTargetCategory(effectiveCat);
              setNewDate(new Date().toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#0284c7] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Enregistrer un contrat
          </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isActive = effectiveCat === cat.id;
          const count = allTabContracts.filter(c => c.category === cat.id).length;
          return (
            <div
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex flex-col text-left p-4 rounded-2xl border cursor-pointer transition-all relative group ${isActive ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-600/30' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEditCategory(cat, e)}
                    className={`p-1 rounded-lg ${isActive ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                    className={`p-1 rounded-lg ${isActive ? 'bg-sky-500 text-white hover:bg-rose-500' : 'bg-slate-100 text-rose-600'}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-sky-500 text-white' : 'bg-slate-100 text-sky-600'}`}>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-sky-500/80 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count} contrats
                </span>
              </div>
              <h3 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{cat.label}</h3>
              <p className={`text-[10px] mt-1 line-clamp-2 ${isActive ? 'text-sky-100' : 'text-slate-500'}`}>{cat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Sub-Folders / Affaires bar */}
      <div className="flex flex-wrap items-center gap-2 bg-sky-50/50 p-4 rounded-2xl border border-sky-200/60">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-900 mr-2">
          <Folder className="h-4 w-4 text-sky-700" />
          <span>Sous-dossiers / Affaires :</span>
        </div>
        <button
          onClick={() => setSelectedSubFolder('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedSubFolder === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
        >
          📁 Tous les dossiers ({allTabContracts.length})
        </button>
        {tabSubFolders.map(sf => {
          const sfCount = allTabContracts.filter(d => d.subFolder === sf.name).length;
          const isSelected = selectedSubFolder === sf.name;
          return (
            <button
              key={sf.id}
              onClick={() => setSelectedSubFolder(sf.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
            >
              <span>📂 {sf.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{sfCount}</span>
            </button>
          );
        })}
        {canManage && (
          <button
            onClick={() => setShowSubFolderModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition-all flex items-center gap-1 ml-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau sous-dossier</span>
          </button>
        )}
      </div>

      {/* Contracts List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" />
            {currentCategory?.label} ({filteredContracts.length})
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un contrat..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>


        <div className="space-y-3">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Aucun contrat dans cette rubrique.</div>
          ) : (
            filteredContracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-sky-100 p-2.5 text-sky-700 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                      <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-700">{c.ref}</span>
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">📅 Date du doc : {c.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Enregistré par {c.uploader} • Format: {c.type} • Poids: {c.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleConsult(c)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Consulter</span>
                  </button>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Enregistrer un Contrat / Avenant</h3>
            <form onSubmit={handleAddContract} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rubrique</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sous-dossier / Affaire (Optionnel)</label>
                <select
                  value={newSubFolder}
                  onChange={(e) => setNewSubFolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="">-- Aucun sous-dossier (Racine) --</option>
                  {subFolders.filter(sf => sf.categoryId === effectiveCat).map(sf => (
                    <option key={sf.id} value={sf.name}>📂 {sf.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Intitulé du Contrat</label>
                <input
                  type="text"
                  placeholder="Ex: Contrat de prestation sécurité Hall B"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Référence</label>
                  <input
                    type="text"
                    placeholder="Ex: CTR-2026"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pièce jointe</label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-600">
                  <span>{attachedFile ? attachedFile.name : "Sélectionner un fichier..."}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-[#0284c7] text-white px-5 py-2 text-xs font-bold hover:bg-sky-500 shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SubFolder Modal */}
      {showSubFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowSubFolderModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Créer un nouveau sous-dossier</h3>
            <p className="text-xs text-slate-500 mb-4">Ajoutez un sous-dossier ou une affaire pour classer vos documents.</p>
            <form onSubmit={handleCreateSubFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du sous-dossier</label>
                <input
                  type="text"
                  placeholder="Ex: 2026_Contrats_Assurances"
                  value={newSubFolderName}
                  onChange={(e) => setNewSubFolderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowSubFolderModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-sky-600 text-white px-5 py-2 text-xs font-bold hover:bg-sky-500 shadow-md">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowCategoryModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{editingCategory ? 'Modifier la rubrique' : 'Nouvelle rubrique'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Libellé</label>
                <input
                  type="text"
                  value={catLabel}
                  onChange={(e) => setCatLabel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
