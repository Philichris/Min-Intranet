import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FolderKanban, Plus, Download, Trash2, FileText, Search, Settings, Edit2, X, ShieldCheck, Folder } from 'lucide-react';
import { getFileFromIDB } from '../../utils/idbStorage';

interface CategoryTab {
  id: string;
  name: string;
  label: string;
  desc: string;
  iconName: string;
}

export const DocumentsModule: React.FC = () => {
  const { services, currentUser, openModal, documents, uploadDocument, updateDocument, deleteDocument, generalLabels } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const serviceObj = services.find(s => s.code === 'DOCUMENTS') || {
    id: 'srv-docs',
    name: generalLabels?.documents?.title || 'Bibliothèque des Documents',
    code: 'DOCUMENTS',
    description: generalLabels?.documents?.description || 'Gestion centralisée des règlements, formulaires et rapports officiels.',
    subServices: [
      { id: 'reglements', serviceId: 'srv-docs', name: 'Règlements & Consignes', code: 'REG', description: 'Consignes de sécurité et règlements intérieurs' },
      { id: 'formulaires', serviceId: 'srv-docs', name: 'Formulaires & Demandes', code: 'FORM', description: 'Modèles de formulaires administratifs' },
      { id: 'rapports', serviceId: 'srv-docs', name: 'Rapports & Bilans', code: 'RAP', description: 'Rapports d’activité et bilans annuels' }
    ]
  };

  const categories: CategoryTab[] = (serviceObj?.subServices && serviceObj.subServices.length > 0)
    ? serviceObj.subServices.map((sub, idx) => ({
        id: sub.id,
        name: sub.name,
        label: `${idx + 1}. ${sub.name}`,
        desc: sub.description || 'Rubrique officielle',
        iconName: idx === 0 ? 'ShieldCheck' : idx === 1 ? 'FileText' : 'FolderKanban'
      }))
    : [
        { id: 'reglements', name: 'Règlements & Consignes', label: '1. Règlements & Consignes', desc: 'Consignes de sécurité', iconName: 'ShieldCheck' }
      ];

  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || 'reglements');
  const [filterQuery, setFilterQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryTab | null>(null);

  // Category form
  const [catLabel, setCatLabel] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('FolderKanban');

  // Document form
  const [newTitle, setNewTitle] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetCategory, setTargetCategory] = useState(activeTab);
  const [newSubFolder, setNewSubFolder] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubFolder, setEditSubFolder] = useState('');

  const currentCategory = categories.find(c => c.id === activeTab) || categories[0];
  const effectiveActiveTab = currentCategory ? currentCategory.id : (categories[0]?.id || 'reglements');

  // Sub-folders state
  const [subFolders, setSubFolders] = useState<Array<{ id: string; name: string; categoryId: string }>>(() => {
    try {
      const saved = localStorage.getItem('min_documents_subfolders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'sf-1', name: 'Dossier Général Sécurité', categoryId: 'reglements' },
      { id: 'sf-2', name: 'Demandes Congés & RH', categoryId: 'formulaires' },
      { id: 'sf-3', name: 'Bilan Annuel 2025', categoryId: 'rapports' }
    ];
  });

  const [showSubFolderModal, setShowSubFolderModal] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem('min_documents_subfolders', JSON.stringify(subFolders));
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

  const serviceKey = 'documents';
  const serviceDocs = documents.filter(doc => {
    const matchService = doc.serviceId?.toLowerCase() === serviceKey.toLowerCase() || 
                         doc.serviceId?.toLowerCase() === 'srv-docs' ||
                         doc.category?.toLowerCase() === serviceKey.toLowerCase() ||
                         doc.category?.toLowerCase() === 'documents';
    return matchService;
  });

  const defaultDocsByTab: Record<string, Array<any>> = {
    reglements: [
      { id: 'doc-reg-1', title: 'Règlement Intérieur Général du MIN', category: 'reglements', date: '2026-01-10', size: '1.8 Mo', type: 'PDF', ref: 'REG-001', uploader: 'Direction Générale' },
      { id: 'doc-reg-2', title: 'Consignes de Sécurité Incendie & Évacuation', category: 'reglements', date: '2026-01-15', size: '1.2 Mo', type: 'PDF', ref: 'SEC-02', uploader: 'Responsable Sécurité' }
    ],
    formulaires: [
      { id: 'doc-form-1', title: 'Formulaire de demande d’intervention technique', category: 'formulaires', date: '2026-02-01', size: '850 Ko', type: 'PDF', ref: 'FORM-TECH', uploader: 'Service Technique' }
    ],
    rapports: [
      { id: 'doc-rap-1', title: 'Rapport d’activité annuel 2025 - Synthèse', category: 'rapports', date: '2026-01-20', size: '4.5 Mo', type: 'PDF', ref: 'RAP-2025', uploader: 'Direction' }
    ]
  };

  const globalMappedDocs = serviceDocs.map(d => ({
    id: d.id,
    title: d.title,
    category: d.subCategory || d.category || effectiveActiveTab,
    subFolder: d.subFolder || '',
    date: d.uploadDate || new Date().toISOString().split('T')[0],
    size: d.fileSize || '1.5 Mo',
    type: d.fileType || 'PDF',
    ref: d.ref || 'REF-' + d.id.slice(-4),
    uploader: d.authorName || 'Collaborateur MIN',
    fileUrl: d.fileUrl,
    fileName: d.fileName
  }));

  const tabSubFolders = subFolders.filter(sf => sf.categoryId === effectiveActiveTab);
  const tabDefaults = defaultDocsByTab[effectiveActiveTab] || [];
  const allTabDocs = [...globalMappedDocs.filter(d => d.category === effectiveActiveTab || d.category === currentCategory?.label || categories.some(c => c.id === d.category && c.id === effectiveActiveTab)), ...tabDefaults.filter(td => !globalMappedDocs.some(gd => gd.id === td.id))];

  const filteredDocs = allTabDocs.filter(d => {
    const matchesQ = `${d.title} ${d.ref} ${d.uploader} ${d.subFolder}`.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesSubFolder = selectedSubFolder === 'all' || d.subFolder === selectedSubFolder;
    return matchesQ && matchesSubFolder;
  });

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Veuillez saisir un titre.');
      return;
    }

    const destCat = targetCategory || effectiveActiveTab;

    if (attachedFile) {
      const kb = Math.round(attachedFile.size / 1024);
      const fileSize = kb > 1024 ? (kb / 1024).toFixed(1) + ' Mo' : kb + ' Ko';
      const parts = attachedFile.name.split('.');
      const fileType = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PDF';

      try {
        await uploadDocument({
          title: newTitle,
          category: destCat,
          subCategory: destCat,
          subFolder: newSubFolder || undefined,
          serviceId: serviceObj.id || 'srv-docs',
          authorName: `${currentUser.firstName} ${currentUser.lastName}`,
          uploadDate: newDate || new Date().toISOString().split('T')[0],
          fileSize,
          fileType,
          isPublic: true,
          ref: newRef || 'REF-' + Math.floor(100 + Math.random() * 900),
          fileName: attachedFile.name
        }, attachedFile);

        resetDocForm();
        alert('Document et pièce jointe enregistrés avec succès.');
      } catch (err) {
        console.error('Error uploading document:', err);
      }
    } else {
      await uploadDocument({
        title: newTitle,
        category: destCat,
        subCategory: destCat,
        subFolder: newSubFolder || undefined,
        serviceId: serviceObj.id || 'srv-docs',
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        uploadDate: newDate || new Date().toISOString().split('T')[0],
        fileSize: '1.5 Mo',
        fileType: 'PDF',
        isPublic: true,
        ref: newRef || 'REF-' + Math.floor(100 + Math.random() * 900)
      });

      resetDocForm();
      alert('Document ajouté avec succès.');
    }
  };

  const resetDocForm = () => {
    setNewTitle('');
    setNewRef('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewSubFolder('');
    setAttachedFile(null);
    setShowAddModal(false);
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const updated = {
      ...editingDoc,
      title: editTitle,
      ref: editRef,
      uploadDate: editDate,
      category: editCategory,
      subCategory: editCategory,
      subFolder: editSubFolder
    };

    await updateDocument(updated);
    setShowEditModal(false);
    setEditingDoc(null);
    alert('Document mis à jour avec succès.');
  };

  const handleDeleteDoc = (docId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce document ?')) {
      deleteDocument(docId);
      alert('Document supprimé.');
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
                iframe { width: 100%; height: 500px; border: none; border-radius: 8px; background: white; margin-top: 16px; }
                .actions { margin-top: 20px; display: flex; justify-content: center; gap: 12px; }
                a, button { background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: none; cursor: pointer; }
                a:hover, button:hover { background: #4f46e5; }
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

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-indigo-600"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-800 border border-indigo-200 mb-1">
            <FolderKanban className="h-3.5 w-3.5 text-indigo-600" />
            Bibliothèque Officielle
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{serviceObj.name}</h2>
          <p className="text-sm text-slate-500">{serviceObj.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetCategory(effectiveActiveTab);
              setNewDate(new Date().toISOString().split('T')[0]);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Déposer un document
          </button>
        </div>
      </div>

      {/* Tabs / Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const isActive = effectiveActiveTab === cat.id;
          const tabDocs = [...globalMappedDocs.filter(d => d.category === cat.id), ...(defaultDocsByTab[cat.id] || [])];
          const count = tabDocs.length;
          return (
            <div
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id);
                setSelectedSubFolder('all');
              }}
              className={`flex flex-col text-left p-4 rounded-2xl border cursor-pointer transition-all relative group ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-indigo-600'}`}>
                  <FolderKanban className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-500/80 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count} docs
                </span>
              </div>
              <h3 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{cat.label}</h3>
              <p className={`text-[10px] mt-1 line-clamp-2 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>{cat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Sous-dossiers / Affaires bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Folder className="h-4 w-4 text-indigo-600" />
            Sous-dossiers :
          </span>
          <button
            onClick={() => setSelectedSubFolder('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedSubFolder === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            📁 Tous les dossiers ({allTabDocs.length})
          </button>
          {tabSubFolders.map(sf => {
            const count = allTabDocs.filter(d => d.subFolder === sf.name || d.subFolder === sf.id).length;
            const isSel = selectedSubFolder === sf.name;
            return (
              <div key={sf.id} className="relative group/sf inline-flex items-center">
                <button
                  onClick={() => setSelectedSubFolder(sf.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSel ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  📁 {sf.name} ({count})
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer le sous-dossier "${sf.name}" ?`)) {
                        setSubFolders(subFolders.filter(s => s.id !== sf.id));
                        if (selectedSubFolder === sf.name) setSelectedSubFolder('all');
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover/sf:opacity-100 transition-opacity text-[9px]"
                    title="Supprimer le sous-dossier"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setNewSubFolderName('');
              setShowSubFolderModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau sous-dossier
          </button>
        )}
      </div>

      {/* Filter & List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            {currentCategory?.label} ({filteredDocs.length})
          </h3>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dans cette rubrique..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Aucun document dans cette rubrique pour le moment.</div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                      <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold text-slate-700">{doc.ref}</span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">📅 Date : {doc.date}</span>
                      {doc.subFolder && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">📁 {doc.subFolder}</span>}
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
                          setEditTitle(doc.title);
                          setEditRef(doc.ref || '');
                          setEditDate(doc.date);
                          setEditCategory(doc.category);
                          setEditSubFolder(doc.subFolder || '');
                          setShowEditModal(true);
                        }}
                        className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Modifier / Déplacer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">Déposer un nouveau document</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rubrique</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sous-dossier (Optionnel)</label>
                <select
                  value={newSubFolder}
                  onChange={(e) => setNewSubFolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Aucun sous-dossier --</option>
                  {subFolders.filter(sf => sf.categoryId === targetCategory).map(sf => (
                    <option key={sf.id} value={sf.name}>{sf.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre du document</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Règlement intérieur mis à jour..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date du document</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Référence (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: REF-102"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fichier (PDF, Word, Excel...)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                      <FileText className="w-8 h-8 mb-2 text-indigo-500" />
                      <p className="text-xs text-slate-600 font-semibold">{attachedFile ? attachedFile.name : "Cliquez pour sélectionner un fichier"}</p>
                      <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, XLSX (Max 25 Mo)</p>
                    </div>
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && setAttachedFile(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">Modifier le document</h3>
              <button onClick={() => setShowEditModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rubrique</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sous-dossier</label>
                <select
                  value={editSubFolder}
                  onChange={(e) => setEditSubFolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Aucun sous-dossier --</option>
                  {subFolders.filter(sf => sf.categoryId === editCategory).map(sf => (
                    <option key={sf.id} value={sf.name}>{sf.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Référence</label>
                  <input
                    type="text"
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subfolder Modal */}
      {showSubFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">Créer un sous-dossier</h3>
              <button onClick={() => setShowSubFolderModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du sous-dossier</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dossier Audits 2026..."
                  value={newSubFolderName}
                  onChange={(e) => setNewSubFolderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubFolderModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
