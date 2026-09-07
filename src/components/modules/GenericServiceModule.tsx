import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Building, Briefcase, FileText, Download, Plus, Trash2, Edit2, X, Upload, Search, ShieldCheck, Settings, Folder } from 'lucide-react';
import { getFileFromIDB } from '../../utils/idbStorage';

interface GenericServiceModuleProps {
  serviceId: string;
}

export const GenericServiceModule: React.FC<GenericServiceModuleProps> = ({ serviceId }) => {
  const { services, currentUser, addSubService, updateSubService, deleteSubService, documents, uploadDocument, updateDocument, deleteDocument, openModal } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const serviceObj = services.find(s => s.id === serviceId);
  const serviceTitle = serviceObj ? serviceObj.name : 'Espace Service';
  const serviceDesc = serviceObj ? serviceObj.description : 'Gestion des rubriques, métiers et documents officiels du service.';

  const subServices = serviceObj?.subServices || [];
  const categories = subServices.length > 0 ? subServices : [
    { id: 'sub-1', name: 'Général', code: 'GEN', description: 'Rubrique principale' }
  ];

  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || '');
  
  // Modal states for adding/editing sub-service (métier)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catLabel, setCatLabel] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Modal for adding document
  const [showDocModal, setShowDocModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docRef, setDocRef] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSubFolder, setNewSubFolder] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-folders state
  const [subFolders, setSubFolders] = useState<Array<{ id: string; name: string; categoryId: string }>>(() => {
    try {
      const saved = localStorage.getItem(`min_generic_${serviceId}_subfolders`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'sf-gen-1', name: '2026_Dossiers_Generaux', categoryId: categories[0]?.id || 'sub-1' },
    ];
  });

  const [showSubFolderModal, setShowSubFolderModal] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem(`min_generic_${serviceId}_subfolders`, JSON.stringify(subFolders));
    } catch (e) {}
  }, [subFolders, serviceId]);

  const handleCreateSubFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubFolderName.trim()) return;
    const currentCatId = currentCategory?.id || categories[0]?.id;
    const newSf = {
      id: 'sf-' + Date.now(),
      name: newSubFolderName.trim(),
      categoryId: currentCatId
    };
    setSubFolders(prev => [...prev, newSf]);
    setNewSubFolderName('');
    setShowSubFolderModal(false);
  };

  const normalize = (str: string = '') => str.toLowerCase().trim();

  const currentCategory = categories.find(c => c.id === activeTab) || categories[0];
  const currentService = serviceObj || { id: serviceId, name: serviceTitle };

  // 2. Filtrage universel des documents rattachés à ce service
  const serviceDocs = documents.filter(doc => {
    const docService = normalize(doc.serviceId || doc.category);
    const srvId = normalize(currentService.id);
    const srvCode = normalize(currentService.code);
    const srvName = normalize(currentService.name);

    // Le document appartient au service si son serviceId correspond à l'ID, au Code ou au Nom du service
    const belongsToService = 
      docService === srvId || 
      (srvCode && docService === srvCode) ||
      (srvName && docService.includes(srvName)) ||
      (srvName.includes('exploitation') && docService.includes('exploitation')) ||
      (srvName.includes('juridique') && docService.includes('juridique')) ||
      (srvName.includes('ressources') && docService.includes('rh')) ||
      (srvName.includes('finances') && docService.includes('finances')) ||
      (srvName.includes('sécurité') && docService.includes('securite'));

    return belongsToService;
  });

  // 3. Filtrage par rubrique / sous-catégorie sélectionnée
  const activeSubCategoryName = currentCategory?.name || currentService.subServices?.[0]?.name;
  
  const tabSubFolders = subFolders.filter(sf => sf.categoryId === (currentCategory?.id || categories[0]?.id));

  const filteredDocs = serviceDocs.filter(doc => {
    const matchesQ = `${doc.title} ${doc.ref || ''} ${doc.authorName || ''} ${doc.subFolder || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQ) return false;

    const matchesSubFolder = selectedSubFolder === 'all' || doc.subFolder === selectedSubFolder;
    if (!matchesSubFolder) return false;

    if (!activeSubCategoryName) return true;
    const docSub = normalize(doc.subCategory);
    const docCat = normalize(doc.category);
    const activeSub = normalize(activeSubCategoryName);

    return docSub.includes(activeSub) ||
           activeSub.includes(docSub) ||
           docCat.includes(activeSub) ||
           activeSub.includes(docCat) ||
           !doc.subCategory;
  });

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatLabel('');
    setCatDesc('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCatLabel(cat.name);
    setCatDesc(cat.description || '');
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (catId: string, catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (categories.length <= 1) {
      alert('Le service doit conserver au moins une rubrique / métier.');
      return;
    }
    openModal('confirm', {
      title: 'Supprimer la rubrique',
      message: `Voulez-vous vraiment supprimer la rubrique ${catName} ?`,
      onConfirm: () => {
        if (serviceObj) {
          deleteSubService(serviceObj.id, catId);
          if (activeTab === catId) {
            const remaining = categories.filter(c => c.id !== catId);
            if (remaining.length > 0) setActiveTab(remaining[0].id);
          }
        }
      }
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catLabel.trim()) return;

    if (serviceObj) {
      if (editingCategory) {
        updateSubService(serviceObj.id, {
          id: editingCategory.id,
          name: catLabel,
          code: editingCategory.code || 'SUB',
          description: catDesc
        });
      } else {
        addSubService(serviceObj.id, {
          name: catLabel,
          code: 'SUB-' + Date.now(),
          description: catDesc
        });
      }
    }
    setShowCategoryModal(false);
    setCatLabel('');
    setCatDesc('');
    setEditingCategory(null);
  };

  const handleUploadDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const kb = docFile ? Math.round(docFile.size / 1024) : 1500;
    const fileSize = kb > 1024 ? (kb / 1024).toFixed(1) + ' Mo' : kb + ' Ko';
    const parts = docFile ? docFile.name.split('.') : [];
    const fileType = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PDF';

    try {
      await uploadDocument({
        title: docTitle,
        category: currentCategory?.name || serviceTitle,
        subCategory: currentCategory?.name || serviceTitle,
        subFolder: newSubFolder || undefined,
        serviceId: serviceId,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        uploadDate: docDate || new Date().toISOString().split('T')[0],
        fileSize,
        fileType,
        isPublic: true,
        ref: docRef || 'REF-' + Math.floor(100 + Math.random() * 900),
        fileName: docFile ? docFile.name : undefined
      }, docFile || undefined);

      setShowDocModal(false);
      setDocTitle('');
      setDocRef('');
      setNewSubFolder('');
      setDocFile(null);
      alert('Document ajouté avec succès.');
    } catch (err) {
      console.error('Error adding doc:', err);
      alert('Erreur lors de l’ajout du document.');
    }
  };

  const handleUpdateDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !docTitle.trim()) return;

    try {
      const docItem = documents.find(d => d.id === editingDoc.id);
      if (docItem) {
        await updateDocument({
          ...docItem,
          title: docTitle,
          subCategory: currentCategory?.name || docItem.subCategory,
          subFolder: newSubFolder || undefined,
          ref: docRef || docItem.ref,
          uploadDate: docDate || docItem.uploadDate,
        }, docFile || undefined);
      }
      setShowEditModal(false);
      setEditingDoc(null);
      setDocTitle('');
      setDocRef('');
      setNewSubFolder('');
      setDocFile(null);
      alert('Document mis à jour avec succès.');
    } catch (err) {
      console.error('Error updating doc:', err);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const handleConsultDocument = async (doc: any) => {
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
                .actions { margin-top: 20px; display: flex; justify-content: center; gap: 12px; }
                a, button { background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: none; cursor: pointer; }
                a:hover, button:hover { background: #2563eb; }
                iframe { width: 100%; height: 500px; border: none; border-radius: 8px; background: white; margin-top: 16px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${doc.title}</h1>
                <p>Réf: ${doc.ref || 'OFFICIEL'} • Ajouté le ${doc.uploadDate} • ${doc.fileSize}</p>
                <iframe src="${fileUrl}" title="${doc.title}"></iframe>
                <div class="actions">
                  <a href="${fileUrl}" download="${doc.fileName || 'document.pdf'}">Télécharger le fichier</a>
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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-indigo-600"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-800 border border-indigo-200 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            {serviceObj ? serviceObj.code : 'SERVICE'}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{serviceTitle}</h2>
          <p className="text-sm text-slate-500">{serviceDesc}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Settings className="h-4 w-4 text-indigo-600" />
              Gérer les rubriques
            </button>
          )}
          <button
            onClick={() => setShowDocModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <Upload className="h-4 w-4" />
            Déposer un document
          </button>
        </div>
      </div>

      {/* Rubriques / Métiers Grid Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => {
          const isActive = (activeTab === cat.id) || (!activeTab && idx === 0);
          const count = serviceDocs.filter(d => d.category === cat.name).length;
          return (
            <div
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex flex-col text-left p-4 rounded-2xl border cursor-pointer transition-all relative group ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEditCategory(cat, e)}
                    className={`p-1 rounded-lg ${isActive ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    title="Modifier la rubrique"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCategory(cat.id, cat.name, e)}
                    className={`p-1 rounded-lg ${isActive ? 'bg-indigo-500 text-white hover:bg-rose-500' : 'bg-slate-100 text-rose-600 hover:bg-rose-100'}`}
                    title="Supprimer la rubrique"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-indigo-600'}`}>
                  <Briefcase className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count} docs
                </span>
              </div>
              <h3 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{idx + 1}. {cat.name}</h3>
              <p className={`text-[10px] mt-1 line-clamp-2 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>{cat.description || 'Rubrique officielle'}</p>
            </div>
          );
        })}
      </div>

      {/* Sub-Folders / Affaires bar */}
      <div className="flex flex-wrap items-center gap-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/60">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mr-2">
          <Folder className="h-4 w-4 text-indigo-700" />
          <span>Sous-dossiers / Affaires :</span>
        </div>
        <button
          onClick={() => setSelectedSubFolder('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedSubFolder === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
        >
          📁 Tous les dossiers ({serviceDocs.length})
        </button>
        {tabSubFolders.map(sf => {
          const sfCount = serviceDocs.filter(d => d.subFolder === sf.name).length;
          const isSelected = selectedSubFolder === sf.name;
          return (
            <button
              key={sf.id}
              onClick={() => setSelectedSubFolder(sf.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
            >
              <span>📂 {sf.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{sfCount}</span>
            </button>
          );
        })}
        {canManage && (
          <button
            onClick={() => setShowSubFolderModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-1 ml-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau sous-dossier</span>
          </button>
        )}
      </div>

      {/* Main Documents List Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            {categories.findIndex(c => c.id === activeTab) >= 0 ? `${categories.findIndex(c => c.id === activeTab) + 1}. ` : ''}{currentCategory?.name || 'Documents'} ({filteredDocs.length})
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>


        <div className="divide-y divide-slate-100">
          {filteredDocs.length > 0 ? (
            filteredDocs.map(doc => (
              <div key={doc.id} className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-3 rounded-2xl transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs">
                    {doc.fileType || 'PDF'}
                  </div>
                  <div>
                    <h4 
                      onClick={() => handleConsultDocument(doc)}
                      className="text-xs font-extrabold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {doc.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span>Réf: {doc.ref || 'OFFICIEL'}</span>
                      <span>•</span>
                      <span>Ajouté le {doc.uploadDate}</span>
                      <span>•</span>
                      <span>{doc.fileSize}</span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-600">{doc.authorName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConsultDocument(doc)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Consulter</span>
                  </button>
                  <button
                    onClick={() => {
                      if (doc.fileUrl) {
                        const a = document.createElement('a');
                        a.href = doc.fileUrl;
                        a.download = doc.fileName || 'document.pdf';
                        a.click();
                      } else {
                        alert(`Téléchargement de ${doc.title}`);
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (window.confirm('Voulez-vous vraiment supprimer ce document ?')) {
                          deleteDocument(doc.id);
                          alert('Document supprimé avec succès.');
                        }
                      }}
                      className="rounded-xl border border-rose-100 bg-rose-50/50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Aucun document dans cette rubrique</p>
              <p className="text-xs text-slate-400 mt-1">Utilisez le bouton "Déposer un document" pour en ajouter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Edit Sub-Service / Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative">
            <button onClick={() => setShowCategoryModal(false)} className="absolute right-5 top-5 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">{editingCategory ? 'Modifier la rubrique / métier' : 'Ajouter une rubrique / métier'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom de la rubrique</label>
                <input
                  type="text"
                  value={catLabel}
                  onChange={(e) => setCatLabel(e.target.value)}
                  placeholder="ex: Rapports d'activité"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Description..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md"
                >
                  Enregistrer
                </button>
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
                  placeholder="Ex: 2026_Dossier_Specifique"
                  value={newSubFolderName}
                  onChange={(e) => setNewSubFolderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowSubFolderModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-indigo-600 text-white px-5 py-2 text-xs font-bold hover:bg-indigo-500 shadow-md">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Document */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative">
            <button onClick={() => setShowDocModal(false)} className="absolute right-5 top-5 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">Déposer un document officiel</h3>
            <form onSubmit={handleUploadDocSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sous-dossier / Affaire (Optionnel)</label>
                <select
                  value={newSubFolder}
                  onChange={(e) => setNewSubFolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="">-- Aucun sous-dossier (Racine) --</option>
                  {tabSubFolders.map(sf => (
                    <option key={sf.id} value={sf.name}>📂 {sf.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titre du document</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="ex: Plan stratégique 2026"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Référence</label>
                <input
                  type="text"
                  value={docRef}
                  onChange={(e) => setDocRef(e.target.value)}
                  placeholder="ex: REF-PROJ-01"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fichier joint (PDF, Scan)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setDocFile(e.target.files[0]);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md"
                >
                  Téléverser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
