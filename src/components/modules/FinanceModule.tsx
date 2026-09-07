import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Coins, Plus, Download, Trash2, FileText, Search, Settings, Edit2, X, Folder } from 'lucide-react';
import { getFileFromIDB } from '../../utils/idbStorage';

interface CategoryTab {
  id: string;
  name: string;
  label: string;
  desc: string;
  iconName: string;
}

export const FinanceModule: React.FC = () => {
  const { services, currentUser, addSubService, updateSubService, deleteSubService, openModal, documents, uploadDocument, updateDocument, deleteDocument } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const serviceObj = services.find(s => s.code === 'FINANCE');
  const serviceTitle = serviceObj ? serviceObj.name : 'Finance, Comptabilité & Modèles';
  const serviceDesc = serviceObj ? serviceObj.description : 'Gestion des notes de frais, bons d\'approvisionnement et rubriques paramétrables.';

  const categories: CategoryTab[] = (serviceObj?.subServices && serviceObj.subServices.length > 0)
    ? serviceObj.subServices.map((sub, idx) => ({
        id: sub.id,
        name: sub.name,
        label: `${idx + 1}. ${sub.name}`,
        desc: sub.description || 'Rubrique officielle',
        iconName: 'Coins'
      }))
    : [
        { id: 'frais', name: 'Notes de Frais & Acomptes', label: '1. Notes de Frais & Acomptes', desc: 'Remboursements et avances sur frais pro', iconName: 'Coins' },
      ];

  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || 'frais');
  const [filterQuery, setFilterQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTab | null>(null);

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

  // Editing document state
  const [editingDoc, setEditingDoc] = useState<any | null>(null);

  const currentCategory = categories.find(c => c.id === activeTab) || categories[0];
  const effectiveCat = currentCategory ? currentCategory.id : categories[0].id;

  // Sub-folders state
  const [subFolders, setSubFolders] = useState<Array<{ id: string; name: string; categoryId: string }>>(() => {
    try {
      const saved = localStorage.getItem('min_finance_subfolders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'sf-fin-1', name: '2026_Budgets_Frais', categoryId: 'frais' },
    ];
  });

  const [showSubFolderModal, setShowSubFolderModal] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem('min_finance_subfolders', JSON.stringify(subFolders));
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

  const serviceKey = 'finance';
  const serviceDocs = documents.filter(doc => {
    const matchService = doc.serviceId?.toLowerCase() === serviceKey.toLowerCase() || doc.category?.toLowerCase() === serviceKey.toLowerCase();
    return matchService;
  });

  const defaultFinDocs: Record<string, Array<any>> = {
    frais: [
      { id: 'fin-1', title: 'Formulaire Note de Frais 2026 (Modifiable)', category: 'frais', date: '2026-01-15', size: '480 Ko', type: 'XLSX', ref: 'FIN-FRAIS-01', uploader: 'Direction Financière' },
    ],
    appro: [
      { id: 'fin-2', title: 'Bon de Commande & Approvisionnement Interne', category: 'appro', date: '2026-02-10', size: '650 Ko', type: 'PDF', ref: 'FIN-APPRO-02', uploader: 'Service Achats' },
    ],
    procedures: [
      { id: 'fin-3', title: 'Guide des Procédures Budgétaires et Engagements', category: 'procedures', date: '2026-01-20', size: '2.8 Mo', type: 'PDF', ref: 'FIN-BUDGET-03', uploader: 'Comptabilité' }
    ]
  };

  const globalMappedDocs = serviceDocs.map(d => ({
    id: d.id,
    title: d.title,
    category: d.subCategory || d.category || effectiveCat,
    subFolder: d.subFolder || '',
    date: d.uploadDate || new Date().toISOString().split('T')[0],
    size: d.fileSize || '1.5 Mo',
    type: d.fileType || 'PDF',
    ref: d.ref || 'REF-' + d.id.slice(-4),
    uploader: d.authorName || 'Direction Financière',
    fileUrl: d.fileUrl,
    fileName: d.fileName
  }));

  const tabSubFolders = subFolders.filter(sf => sf.categoryId === effectiveCat);
  const tabDefaults = defaultFinDocs[effectiveCat] || [];
  const allTabDocs = [...globalMappedDocs.filter(d => d.category === effectiveCat || d.category === currentCategory?.label), ...tabDefaults.filter(td => !globalMappedDocs.some(gd => gd.id === td.id))];

  const filteredDocs = allTabDocs.filter(d => {
    const matchesQ = `${d.title} ${d.ref} ${d.uploader} ${d.subFolder}`.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesSubFolder = selectedSubFolder === 'all' || d.subFolder === selectedSubFolder;
    return matchesQ && matchesSubFolder;
  });

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Veuillez saisir un titre.');
      return;
    }

    const destCat = targetCategory || effectiveCat;
    const kb = attachedFile ? Math.round(attachedFile.size / 1024) : 1500;
    const fileSize = kb > 1024 ? (kb / 1024).toFixed(1) + ' Mo' : kb + ' Ko';
    const parts = attachedFile ? attachedFile.name.split('.') : [];
    const fileType = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PDF';

    try {
      await uploadDocument({
        title: newTitle,
        category: destCat,
        subCategory: destCat,
        subFolder: newSubFolder || undefined,
        serviceId: 'finance',
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        uploadDate: newDate || new Date().toISOString().split('T')[0],
        fileSize,
        fileType,
        isPublic: true,
        ref: newRef || 'REF-' + Math.floor(100 + Math.random() * 900),
        fileName: attachedFile ? attachedFile.name : undefined
      }, attachedFile || undefined);

      resetForm();
      alert('Document financier ajouté avec succès.');
    } catch (err) {
      console.error('Error adding doc:', err);
      alert('Erreur lors de l’ajout du document.');
    }
  };

  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !newTitle.trim()) return;

    try {
      const docItem = documents.find(d => d.id === editingDoc.id);
      if (docItem) {
        await updateDocument({
          ...docItem,
          title: newTitle,
          category: targetCategory || docItem.category,
          subCategory: targetCategory || docItem.subCategory,
          subFolder: newSubFolder || undefined,
          ref: newRef || docItem.ref,
          uploadDate: newDate || docItem.uploadDate,
        }, attachedFile || undefined);
      }
      setShowEditModal(false);
      setEditingDoc(null);
      resetForm();
      alert('Document mis à jour avec succès.');
    } catch (err) {
      console.error('Error updating doc:', err);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewRef('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewSubFolder('');
    setAttachedFile(null);
    setEditingDoc(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce document ?')) {
      deleteDocument(id);
      alert('Document supprimé avec succès.');
    }
  };

  const handleConsult = async (doc: any) => {
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
                a, button { background: #f97316; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: none; cursor: pointer; }
                a:hover, button:hover { background: #ea580c; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${doc.title}</h1>
                <p>Réf: ${doc.ref} • Ajouté le ${doc.date} • ${doc.size}</p>
                <iframe src="${fileUrl}" title="${doc.title}"></iframe>
                <div class="actions">
                  <a href="${fileUrl}" download="${doc.fileName || 'document'}">Télécharger le fichier</a>
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
      alert("Aucun fichier associé ou fichier introuvable dans IndexedDB pour ce document.");
    }
  };

  const handleOpenEditCategory = (cat: CategoryTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCatLabel(cat.name || cat.label.replace(/^\d+\.\s*/, ''));
    setCatDesc(cat.desc);
    setShowCategoryModal(true);
  };

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
      message: 'Voulez-vous supprimer cette rubrique et ses documents ?',
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#f97316]"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800 border border-amber-200 mb-1">
            <Coins className="h-3.5 w-3.5 text-[#f97316]" />
            {serviceObj ? serviceObj.name : 'Direction Financière & Comptabilité'}
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
            className="flex items-center gap-2 rounded-xl bg-[#f97316] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Ajouter un document
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isActive = effectiveCat === cat.id;
          const count = allTabDocs.filter(d => d.category === cat.id).length;
          return (
            <div
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex flex-col text-left p-4 rounded-2xl border cursor-pointer transition-all relative group ${isActive ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEditCategory(cat, e)}
                    className={`p-1 rounded-lg ${isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                    className={`p-1 rounded-lg ${isActive ? 'bg-amber-500 text-white hover:bg-rose-500' : 'bg-slate-100 text-rose-600'}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-amber-600'}`}>
                  <Coins className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-500/80 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count} docs
                </span>
              </div>
              <h3 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{cat.label}</h3>
              <p className={`text-[10px] mt-1 line-clamp-2 ${isActive ? 'text-amber-100' : 'text-slate-500'}`}>{cat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Sub-Folders / Affaires bar */}
      <div className="flex flex-wrap items-center gap-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mr-2">
          <Folder className="h-4 w-4 text-amber-700" />
          <span>Sous-dossiers / Affaires :</span>
        </div>
        <button
          onClick={() => setSelectedSubFolder('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedSubFolder === 'all' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
        >
          📁 Tous les dossiers ({allTabDocs.length})
        </button>
        {tabSubFolders.map(sf => {
          const sfCount = allTabDocs.filter(d => d.subFolder === sf.name).length;
          const isSelected = selectedSubFolder === sf.name;
          return (
            <button
              key={sf.id}
              onClick={() => setSelectedSubFolder(sf.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
            >
              <span>📂 {sf.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{sfCount}</span>
            </button>
          );
        })}
        {canManage && (
          <button
            onClick={() => setShowSubFolderModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 transition-all flex items-center gap-1 ml-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau sous-dossier</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            {currentCategory?.label} ({filteredDocs.length})
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>


        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Aucun document dans cette rubrique.</div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-100 p-2.5 text-amber-800 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                      <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-700">{doc.ref}</span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">📅 Date du doc : {doc.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ajouté par {doc.uploader} • Format: {doc.type} • Poids: {doc.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleConsult(doc)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Consulter</span>
                  </button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => {
                          setEditingDoc(doc);
                          setNewTitle(doc.title);
                          setNewRef(doc.ref);
                          setNewDate(doc.date);
                          setTargetCategory(doc.category);
                          setNewSubFolder(doc.subFolder || '');
                          setAttachedFile(null);
                          setShowEditModal(true);
                        }}
                        className="rounded-xl bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Ajouter un Document Financier</h3>
            <form onSubmit={handleAddDoc} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titre</label>
                <input
                  type="text"
                  placeholder="Intitulé du document"
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
                    placeholder="FIN-01"
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
                <button type="submit" className="rounded-xl bg-[#f97316] text-white px-5 py-2 text-xs font-bold hover:bg-orange-500 shadow-md">Enregistrer</button>
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Modifier le Document Financier</h3>
            <form onSubmit={handleUpdateDoc} className="space-y-4">
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
                  {subFolders.filter(sf => sf.categoryId === targetCategory).map(sf => (
                    <option key={sf.id} value={sf.name}>📂 {sf.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titre</label>
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
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Remplacer la pièce jointe (optionnel)</label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-600">
                  <span>{attachedFile ? attachedFile.name : (editingDoc?.fileName || "Conserver ou choisir nouveau fichier...")}</span>
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
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-[#f97316] text-white px-5 py-2 text-xs font-bold hover:bg-orange-500 shadow-md">Mettre à jour</button>
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
                  placeholder="Ex: 2026_Audit_Comptable"
                  value={newSubFolderName}
                  onChange={(e) => setNewSubFolderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowSubFolderModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-amber-600 text-white px-5 py-2 text-xs font-bold hover:bg-amber-500 shadow-md">Créer</button>
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
