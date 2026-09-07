import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, ShieldCheck, FileText, Download, Lock, Building, Scale, Plus, Trash2, X, Edit2, Settings, Search, Folder } from 'lucide-react';
import { getFileFromIDB } from '../../utils/idbStorage';

interface CategoryTab {
  id: string;
  name: string;
  label: string;
  desc: string;
  iconName: string;
}

export const JuridiqueModule: React.FC = () => {
  const { services, currentUser, addSubService, updateSubService, deleteSubService, openModal, documents, uploadDocument, updateDocument, deleteDocument } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const serviceObj = services.find(s => s.code === 'JURIDIQUE');
  const serviceTitle = serviceObj ? serviceObj.name : 'Espace Juridique, CA & Délégations (DSP)';
  const serviceDesc = serviceObj ? serviceObj.description : 'Accès direct aux rubriques officielles paramétrables. Dépôt sécurisé et traçabilité.';

  const categories: CategoryTab[] = (serviceObj?.subServices && serviceObj.subServices.length > 0)
    ? serviceObj.subServices.map((sub, idx) => ({
        id: sub.id,
        name: sub.name,
        label: `${idx + 1}. ${sub.name}`,
        desc: sub.description || 'Rubrique officielle',
        iconName: idx === 0 ? 'Lock' : idx === 1 ? 'Briefcase' : idx === 2 ? 'Scale' : idx === 3 ? 'ShieldCheck' : 'Building'
      }))
    : [
        { id: 'corporate', name: 'Documents Corporate', label: '1. Documents Corporate', desc: 'Statuts, Kbis et actes fondateurs', iconName: 'Lock' },
      ];

  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || 'corporate');
  const [filterQuery, setFilterQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTab | null>(null);

  // Ensure activeTab is valid
  const currentCategory = categories.find(c => c.id === activeTab) || categories[0];
  const effectiveActiveTab = currentCategory ? currentCategory.id : (categories[0]?.id || 'corporate');

  // Category form state
  const [catLabel, setCatLabel] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Briefcase');

  const selectedModuleKey = 'juridique';
  const legalDocs = documents.filter(doc => {
    const matchCategory = doc.category?.toLowerCase() === selectedModuleKey.toLowerCase() || 
      ['corporate', 'ca', 'discipline', 'dsp', 'actionnaires'].includes(doc.category?.toLowerCase() || '');
    const matchService = doc.serviceId?.toLowerCase() === selectedModuleKey.toLowerCase();
    const matchSubCategory = !effectiveActiveTab || doc.subCategory === effectiveActiveTab || doc.category === effectiveActiveTab;
    return (matchCategory || matchService) && matchSubCategory;
  });

  const defaultDocsByTab: Record<string, Array<any>> = {
    corporate: [
      { id: 'c1', title: 'Statuts coordonnés de la SA MIN-MMM (Janvier 2026)', category: 'corporate', date: '2026-01-10', size: '2.4 Mo', type: 'PDF', ref: 'STATUTS-2026', uploader: 'Direction Juridique' },
      { id: 'c2', title: 'Extrait Kbis original mis à jour', category: 'corporate', date: '2026-02-01', size: '980 Ko', type: 'PDF', ref: 'KBIS-2026', uploader: 'Direction Juridique' },
      { id: 'c3', title: 'PV de l’Assemblée Générale Ordinaire Annuelle', category: 'corporate', date: '2025-06-20', size: '3.1 Mo', type: 'PDF', ref: 'AGO-2025', uploader: 'Secrétariat Général' },
      { id: 'c4', title: 'Pacte d’actionnaires et règlements intérieurs', category: 'corporate', date: '2024-11-15', size: '4.5 Mo', type: 'PDF', ref: 'PACTE-01', uploader: 'Conseil' }
    ],
    ca: [
      { id: 'ca1', title: 'Ordre du jour du Conseil d’Administration du 15/09/2026', category: 'ca', date: '2026-08-30', size: '1.1 Mo', type: 'PDF', ref: 'ODJ-CA-0926', uploader: 'Présidence' },
      { id: 'ca2', title: 'Procès-verbal du CA du 12 Juin 2026 - Validé et signé', category: 'ca', date: '2026-06-25', size: '3.8 Mo', type: 'PDF', ref: 'PV-CA-0626', uploader: 'Présidence' },
      { id: 'ca3', title: 'Rapport financier semestriel soumis au CA', category: 'ca', date: '2026-07-10', size: '5.2 Mo', type: 'PDF', ref: 'RAP-FIN-S1', uploader: 'Direction Financière' }
    ],
    discipline: [
      { id: 'd1', title: 'Règlement Intérieur du Conseil de Discipline des Marchés', category: 'discipline', date: '2023-01-10', size: '1.5 Mo', type: 'PDF', ref: 'RI-DISC-01', uploader: 'Commission' },
      { id: 'd2', title: 'Dossier d’instruction - Incident Quai Marchandises #4', category: 'discipline', date: '2026-05-14', size: '2.2 Mo', type: 'PDF', ref: 'DISC-2026-02', uploader: 'Commission' }
    ],
    dsp: [
      { id: 'dsp1', title: 'Contrat Principal de Délégation de Service Public (DSP)', category: 'dsp', date: '2018-01-01', size: '14.2 Mo', type: 'PDF', ref: 'DSP-2018-001', uploader: 'Direction Générale' },
      { id: 'dsp2', title: 'Avenant n°1 - Extension des quais frigorifiques', category: 'dsp', date: '2021-06-15', size: '4.1 Mo', type: 'PDF', ref: 'AVENANT-01', uploader: 'Direction Technique' }
    ],
    actionnaires: [
      { id: 'a1', title: 'Note d’information trimestrielle aux actionnaires - Q2 2026', category: 'actionnaires', date: '2026-07-20', size: '3.4 Mo', type: 'PDF', ref: 'INFO-Q2-2026', uploader: 'Relations Actionnaires' }
    ]
  };

  // Sub-folders state
  const [subFolders, setSubFolders] = useState<Array<{ id: string; name: string; categoryId: string }>>(() => {
    try {
      const saved = localStorage.getItem('min_juridique_subfolders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'sf-1', name: '2026_TransLogistics_ImpayesQuaiB', categoryId: 'discipline' },
      { id: 'sf-2', name: '2026-09-15_CA_Ordinaire', categoryId: 'ca' },
      { id: 'sf-3', name: 'DSP_Gestion_MIN_2018', categoryId: 'dsp' }
    ];
  });

  const [showSubFolderModal, setShowSubFolderModal] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem('min_juridique_subfolders', JSON.stringify(subFolders));
    } catch (e) {}
  }, [subFolders]);

  const handleCreateSubFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubFolderName.trim()) return;
    const newSf = {
      id: 'sf-' + Date.now(),
      name: newSubFolderName.trim(),
      categoryId: effectiveActiveTab
    };
    setSubFolders(prev => [...prev, newSf]);
    setNewSubFolderName('');
    setShowSubFolderModal(false);
  };

  // Document add form state
  const [newTitle, setNewTitle] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newSize, setNewSize] = useState('1.5 Mo');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetCategory, setTargetCategory] = useState(activeTab);
  const [newSubFolder, setNewSubFolder] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const globalMappedDocs = legalDocs.map(d => ({
    id: d.id,
    title: d.title,
    category: d.category || effectiveActiveTab,
    subFolder: d.subFolder || '',
    date: d.uploadDate || new Date().toISOString().split('T')[0],
    size: d.fileSize || '1.5 Mo',
    type: d.fileType || 'PDF',
    ref: d.ref || 'REF-' + d.id.slice(-4),
    uploader: d.authorName || 'Direction Juridique',
    fileUrl: d.fileUrl,
    fileName: d.fileName
  }));

  const tabSubFolders = subFolders.filter(sf => sf.categoryId === effectiveActiveTab);

  const tabDefaults = defaultDocsByTab[effectiveActiveTab] || [];
  const allTabDocs = [...globalMappedDocs.filter(d => d.category === effectiveActiveTab), ...tabDefaults.filter(td => !globalMappedDocs.some(gd => gd.id === td.id))];

  const currentDocs = allTabDocs.filter(d => {
    const matchesQuery = `${d.title} ${d.ref} ${d.uploader} ${d.subFolder}`.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesSubFolder = selectedSubFolder === 'all' || d.subFolder === selectedSubFolder;
    return matchesQuery && matchesSubFolder;
  });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Lock': return Lock;
      case 'Briefcase': return Briefcase;
      case 'Scale': return Scale;
      case 'ShieldCheck': return ShieldCheck;
      case 'Building': return Building;
      default: return FileText;
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Veuillez saisir le titre du document.');
      return;
    }

    const destCat = targetCategory || effectiveActiveTab;
    const kb = attachedFile ? Math.round(attachedFile.size / 1024) : 1500;
    const fileSize = kb > 1024 ? (kb / 1024).toFixed(1) + ' Mo' : kb + ' Ko';
    const parts = attachedFile ? attachedFile.name.split('.') : [];
    const fileType = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PDF';

    try {
      await uploadDocument({
        title: newTitle,
        category: destCat,
        subFolder: newSubFolder || undefined,
        serviceId: 'juridique',
        subCategory: destCat === 'dsp' ? 'DSP' : undefined,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        uploadDate: newDate || new Date().toISOString().split('T')[0],
        fileSize,
        fileType,
        isPublic: true,
        ref: newRef || 'REF-' + Math.floor(100 + Math.random() * 900),
        fileName: attachedFile ? attachedFile.name : undefined
      }, attachedFile || undefined);

      setNewTitle('');
      setNewRef('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setAttachedFile(null);
      setShowAddModal(false);
      alert('Document ajouté avec succès.');
    } catch (err) {
      console.error('Error adding document:', err);
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
    setAttachedFile(null);
    setEditingDoc(null);
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleConsultDocument = async (doc: { id: string; title: string; ref: string; type: string; size: string; date: string; fileUrl?: string; fileName?: string }) => {
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

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce document ?')) {
      deleteDocument(docId);
      alert('Document supprimé avec succès.');
    }
  };

  // Category management handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatLabel('');
    setCatDesc('');
    setCatIcon('Briefcase');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: CategoryTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCatLabel(cat.name || cat.label.replace(/^\d+\.\s*/, ''));
    setCatDesc(cat.desc);
    setCatIcon(cat.iconName);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (categories.length <= 1) {
      alert('Impossible de supprimer la dernière rubrique restante.');
      return;
    }
    openModal('confirm', {
      title: 'Supprimer la rubrique',
      message: 'Voulez-vous vraiment supprimer cette rubrique ?',
      onConfirm: () => {
        if (serviceObj) {
          deleteSubService(serviceObj.id, catId);
        }
      }
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catLabel.trim()) {
      alert('Veuillez saisir un libellé pour la rubrique.');
      return;
    }

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

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header Banner with MIN Amber/Corporate Theme */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#d97706]"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-200 mb-1">
            <Briefcase className="h-3.5 w-3.5 text-[#d97706]" />
            {serviceObj ? serviceObj.name : 'Direction Juridique & Affaires Institutionnelles'}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{serviceTitle}</h2>
          <p className="text-sm text-slate-500">{serviceDesc}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              <Settings className="h-4 w-4" />
              Gérer les rubriques
            </button>
          )}
          <button
            onClick={() => {
              setTargetCategory(effectiveActiveTab);
              setNewDate(new Date().toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-700/30 hover:bg-amber-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            Ajouter un document
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const Icon = getIconComponent(cat.iconName);
          const isActive = effectiveActiveTab === cat.id;
          const catTabDocs = [...globalMappedDocs.filter(d => d.category === cat.id), ...(defaultDocsByTab[cat.id] || []).filter(td => !globalMappedDocs.some(gd => gd.id === td.id))];
          const count = catTabDocs.length;
          return (
            <div
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex flex-col text-left p-4 rounded-2xl border cursor-pointer transition-all relative group ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
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
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                    className={`p-1 rounded-lg ${isActive ? 'bg-indigo-500 text-white hover:bg-rose-500' : 'bg-slate-100 text-rose-600 hover:bg-rose-100'}`}
                    title="Supprimer la rubrique"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-indigo-600'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count} docs
                </span>
              </div>
              <h3 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{cat.label}</h3>
              <p className={`text-[10px] mt-1 line-clamp-2 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>{cat.desc}</p>
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
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedSubFolder === 'all' ? 'bg-amber-700 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-amber-700 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
            >
              <span>📂 {sf.name}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-600'}`}>{sfCount}</span>
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

      {/* Documents List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            {currentCategory?.label} ({currentDocs.length})
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="space-y-3">
          {currentDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Aucun document dans cette rubrique pour le moment.</div>
          ) : (
            currentDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                      <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-700">{doc.ref}</span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">📅 Date du doc : {doc.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ajouté par {doc.uploader} • Format: {doc.type} • Poids: {doc.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleConsultDocument(doc)}
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
                          setNewSubFolder(doc.subFolder || '');
                          setTargetCategory(doc.category);
                          setAttachedFile(null);
                          setShowEditModal(true);
                        }}
                        className="rounded-xl bg-indigo-50 p-2 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        title="Modifier le document"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Supprimer le document"
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

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Ajouter un Document Officiel</h3>
            <p className="text-xs text-slate-500 mb-4">Sélectionnez la rubrique de classement et renseignez la date du document.</p>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rubrique de classement</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Aucun sous-dossier (Racine) --</option>
                  {subFolders.filter(sf => sf.categoryId === (targetCategory || effectiveActiveTab)).map(sf => (
                    <option key={sf.id} value={sf.name}>📂 {sf.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titre du document</label>
                <input
                  type="text"
                  placeholder="Ex: Avenant n°3 - Sécurité Quai C"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date du document</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Référence / Numéro</label>
                  <input
                    type="text"
                    placeholder="Ex: REF-2026-JUR"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pièce jointe (PDF, Word, etc.)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-600 transition-all">
                    <span>{attachedFile ? attachedFile.name : "Sélectionner un fichier..."}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {attachedFile && (
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="Retirer le fichier"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
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
                  className="rounded-xl bg-indigo-600 text-white px-5 py-2 text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
                >
                  Ajouter le document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal (Admin only) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowCategoryModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {editingCategory ? 'Modifier la rubrique' : 'Ajouter une nouvelle rubrique'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Paramétrez le titre, la description et l'icône de la rubrique métier.</p>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom de la rubrique</label>
                <input
                  type="text"
                  placeholder="Ex: 6. Rapports Environnementaux"
                  value={catLabel}
                  onChange={(e) => setCatLabel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description courte</label>
                <input
                  type="text"
                  placeholder="Ex: Audits et conformité ISO 14001"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Icône associée</label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="Briefcase">Cartable / Direction (Briefcase)</option>
                  <option value="Lock">Sécurité / Cadenas (Lock)</option>
                  <option value="Scale">Balance / Justice (Scale)</option>
                  <option value="ShieldCheck">Bouclier / Conformité (ShieldCheck)</option>
                  <option value="Building">Bâtiment / Actionnaires (Building)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 shadow-md"
                >
                  {editingCategory ? 'Enregistrer les modifications' : 'Créer la rubrique'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Modifier le document</h3>
            <p className="text-xs text-slate-500 mb-4">Mettez à jour le titre, la référence, la date ou remplacez le fichier.</p>

            <form onSubmit={handleUpdateDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titre du document</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sous-dossier / Affaire (Optionnel)</label>
                <select
                  value={newSubFolder}
                  onChange={(e) => setNewSubFolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Aucun sous-dossier (Racine) --</option>
                  {subFolders.filter(sf => sf.categoryId === effectiveActiveTab).map(sf => (
                    <option key={sf.id} value={sf.name}>📂 {sf.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date du document</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Référence / Réf</label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Remplacer le fichier (Optionnel)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-600 transition-all">
                    <span>{attachedFile ? attachedFile.name : "Nouveau fichier (laisser vide pour conserver l'actuel)"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {attachedFile && (
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
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
                  className="rounded-xl bg-indigo-600 text-white px-5 py-2 text-xs font-bold hover:bg-indigo-500 shadow-lg"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Sub-Folder Modal */}
      {showSubFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowSubFolderModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Créer un Sous-Dossier / Affaire</h3>
            <p className="text-xs text-slate-500 mb-4">
              Respectez la convention de nommage (ex: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-800">2026_NomEntreprise_Objet</code>).
            </p>

            <form onSubmit={handleCreateSubFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du sous-dossier</label>
                <input
                  type="text"
                  placeholder="Ex: 2026_TransLogistics_ContentieuxQuaiB"
                  value={newSubFolderName}
                  onChange={(e) => setNewSubFolderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubFolderModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 text-white px-5 py-2 text-xs font-bold hover:bg-amber-500 shadow-lg shadow-amber-600/30"
                >
                  Créer le sous-dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



