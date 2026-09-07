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
  const { services, currentUser, contractAlertDays, addSubService, updateSubService, deleteSubService, openModal, documents, uploadDocument, updateDocument, deleteDocument, consultingItem, setConsultingItem, consultDocument } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

  const serviceObj = services.find(s => s.code === 'CONTRATS');
  const serviceTitle = serviceObj ? serviceObj.name : 'Gestion des Contrats';
  const serviceDesc = serviceObj ? serviceObj.description : `Fournisseurs, Clients et Marchés publics.`;

  const categories: CategoryTab[] = (serviceObj?.subServices && serviceObj.subServices.length > 0)
    ? serviceObj.subServices.map((sub, idx) => ({
        id: sub.id,
        name: sub.name,
        label: `${idx + 1}. ${sub.name}`,
        desc: sub.description || 'Rubrique officielle',
        iconName: idx === 1 ? 'FileText' : 'ShieldCheck'
      }))
    : [
        { id: 'fournisseurs', name: 'Fournisseurs', label: '1. Fournisseurs', desc: 'Prestations, maintenance et équipements', iconName: 'ShieldCheck' },
        { id: 'clients', name: 'Clients', label: '2. Clients', desc: 'Baux, concessions et redevances clients', iconName: 'FileText' },
        { id: 'marches_publics', name: 'Marchés publics', label: '3. Marchés publics', desc: 'Marchés publics et appels d’offres', iconName: 'ShieldCheck' }
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

  // Specific fields for métiers
  const [fournisseurName, setFournisseurName] = useState('');
  const [objetContrat, setObjetContrat] = useState('');
  const [clientName, setClientName] = useState('');
  const [numeroBox, setNumeroBox] = useState('');
  const [site, setSite] = useState('');
  const [dateMarche, setDateMarche] = useState(new Date().toISOString().split('T')[0]);
  const [nomMarche, setNomMarche] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    const matchService = doc.serviceId?.toLowerCase() === serviceKey.toLowerCase() || doc.category?.toLowerCase() === serviceKey.toLowerCase() || doc.serviceId?.toLowerCase() === 'srv-cont';
    return matchService;
  });

  const defaultContractDocs: Record<string, Array<any>> = {
    fournisseurs: [
      { id: 'con-1', title: 'Maintenance ponts bascule', category: 'fournisseurs', date: '2026-01-10', size: '2.4 Mo', type: 'PDF', ref: 'CTR-FO-01', uploader: 'Direction Technique', fournisseurName: 'Sermeca SAS', objetContrat: 'Maintenance ponts bascule', startDate: '2026-01-01', endDate: '2026-12-31' }
    ],
    clients: [
      { id: 'con-2', title: 'Bail Commercial - Grossiste Halle A', category: 'clients', date: '2026-02-01', size: '1.8 Mo', type: 'PDF', ref: 'CTR-CL-12', uploader: 'Service Commercial', clientName: 'SARL Primeurs du Sud', numeroBox: 'Box 12', site: 'Halle A - Gros', startDate: '2026-02-01', endDate: '2029-01-31' }
    ],
    marches_publics: [
      { id: 'con-3', title: 'Dossier Marché Nettoyage Voierie', category: 'marches_publics', date: '2026-01-28', size: '4.2 Mo', type: 'PDF', ref: 'MP-2026-01', uploader: 'Direction Juridique', dateMarche: '2026-01-28', nomMarche: 'Nettoyage et propreté des voiries du MIN', endDate: '2028-12-31' }
    ]
  };

  const globalMappedContracts = serviceDocs.map(d => ({
    id: d.id,
    title: d.title,
    category: d.subCategory || d.category || effectiveCat,
    subFolder: d.subFolder || '',
    date: d.uploadDate || (d as any).dateMarche || new Date().toISOString().split('T')[0],
    size: d.fileSize || '2.0 Mo',
    type: d.fileType || 'PDF',
    ref: d.ref || 'REF-' + d.id.slice(-4),
    uploader: d.authorName || 'Direction Juridique',
    fileUrl: d.fileUrl,
    fileName: d.fileName,
    fournisseurName: (d as any).fournisseurName,
    objetContrat: (d as any).objetContrat,
    clientName: (d as any).clientName,
    numeroBox: (d as any).numeroBox,
    site: (d as any).site,
    dateMarche: (d as any).dateMarche,
    nomMarche: (d as any).nomMarche,
    startDate: (d as any).startDate,
    endDate: (d as any).endDate
  }));

  const tabSubFolders = subFolders.filter(sf => sf.categoryId === effectiveCat);
  const tabDefaults = defaultContractDocs[effectiveCat] || [];
  const allTabContracts = [...globalMappedContracts.filter(c => c.category === effectiveCat || c.category === currentCategory?.label), ...tabDefaults.filter(td => !globalMappedContracts.some(gd => gd.id === td.id))];

  useEffect(() => {
    if (consultingItem && consultingItem.type === 'contract') {
      const allDocs = documents.filter(d => d.serviceId?.toLowerCase() === 'contrats' || d.serviceId?.toLowerCase() === 'srv-cont' || d.category === 'fournisseurs' || d.category === 'clients' || d.category === 'marches_publics');
      const found = allDocs.find(item => item.id === consultingItem.id);
      if (found) {
        const cat = found.category || 'fournisseurs';
        if (cat !== activeTab) {
          setActiveTab(cat);
        } else {
          const mapped = {
            id: found.id,
            title: found.title,
            category: found.subCategory || found.category || cat,
            subFolder: found.subFolder || '',
            date: found.uploadDate || (found as any).dateMarche || new Date().toISOString().split('T')[0],
            size: found.fileSize || '2.0 Mo',
            type: found.fileType || 'PDF',
            ref: found.ref || 'REF-' + found.id.slice(-4),
            uploader: found.authorName || 'Direction Juridique',
            fileUrl: found.fileUrl,
            fileName: found.fileName
          };
          handleConsult(mapped);
          setConsultingItem(null);
        }
      }
    }
  }, [consultingItem, documents, activeTab]);

  const filteredContracts = allTabContracts.filter(c => {
    const matchesQ = `${c.title} ${c.ref} ${c.uploader} ${c.subFolder} ${(c as any).fournisseurName || ''} ${(c as any).clientName || ''} ${(c as any).nomMarche || ''}`.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesSubFolder = selectedSubFolder === 'all' || c.subFolder === selectedSubFolder;
    return matchesQ && matchesSubFolder;
  });

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const destCat = targetCategory || effectiveCat;
    
    let titleToSave = newTitle;
    if (destCat === 'fournisseurs') titleToSave = objetContrat || fournisseurName || 'Contrat Fournisseur';
    if (destCat === 'clients') titleToSave = `Bail / Contrat - ${clientName || 'Client'} (${site || 'Box ' + numeroBox})`;
    if (destCat === 'marches_publics') titleToSave = newTitle || nomMarche || 'Marché public';

    if (!titleToSave.trim()) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    const kb = attachedFile ? Math.round(attachedFile.size / 1024) : 2000;
    const fileSize = kb > 1024 ? (kb / 1024).toFixed(1) + ' Mo' : kb + ' Ko';
    const parts = attachedFile ? attachedFile.name.split('.') : [];
    const fileType = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'PDF';

    try {
      await uploadDocument({
        title: titleToSave,
        category: destCat,
        subCategory: destCat,
        subFolder: newSubFolder || undefined,
        serviceId: 'contrats',
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        uploadDate: newDate || dateMarche || new Date().toISOString().split('T')[0],
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        fournisseurName: destCat === 'fournisseurs' ? fournisseurName : undefined,
        objetContrat: destCat === 'fournisseurs' ? objetContrat : undefined,
        clientName: destCat === 'clients' ? clientName : undefined,
        numeroBox: destCat === 'clients' ? numeroBox : undefined,
        site: destCat === 'clients' ? site : undefined,
        dateMarche: destCat === 'marches_publics' ? dateMarche : undefined,
        nomMarche: destCat === 'marches_publics' ? nomMarche : undefined,
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

  const handleOpenEditContract = (c: any) => {
    setEditingDoc(c);
    setTargetCategory(c.category || effectiveCat);
    setNewTitle(c.title || '');
    setNewRef(c.ref || '');
    setNewDate(c.date || new Date().toISOString().split('T')[0]);
    setNewSubFolder(c.subFolder || '');
    setFournisseurName(c.fournisseurName || '');
    setObjetContrat(c.objetContrat || '');
    setClientName(c.clientName || '');
    setNumeroBox(c.numeroBox || '');
    setSite(c.site || '');
    setDateMarche(c.dateMarche || c.date || new Date().toISOString().split('T')[0]);
    setNomMarche(c.nomMarche || '');
    setStartDate(c.startDate || '');
    setEndDate(c.endDate || '');
    setAttachedFile(null);
    setShowEditModal(true);
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    const destCat = targetCategory || effectiveCat;
    
    let titleToSave = newTitle;
    if (destCat === 'fournisseurs') titleToSave = objetContrat || fournisseurName || 'Contrat Fournisseur';
    if (destCat === 'clients') titleToSave = `Bail / Contrat - ${clientName || 'Client'} (${site || 'Box ' + numeroBox})`;
    if (destCat === 'marches_publics') titleToSave = newTitle || nomMarche || 'Marché public';

    try {
      await updateDocument({
        ...editingDoc,
        title: titleToSave,
        category: destCat,
        subCategory: destCat,
        subFolder: newSubFolder || undefined,
        uploadDate: newDate || dateMarche || editingDoc.date,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        fournisseurName: destCat === 'fournisseurs' ? fournisseurName : undefined,
        objetContrat: destCat === 'fournisseurs' ? objetContrat : undefined,
        clientName: destCat === 'clients' ? clientName : undefined,
        numeroBox: destCat === 'clients' ? numeroBox : undefined,
        site: destCat === 'clients' ? site : undefined,
        dateMarche: destCat === 'marches_publics' ? dateMarche : undefined,
        nomMarche: destCat === 'marches_publics' ? nomMarche : undefined,
        ref: newRef || editingDoc.ref,
        fileName: attachedFile ? attachedFile.name : editingDoc.fileName
      }, attachedFile || undefined);

      setShowEditModal(false);
      setEditingDoc(null);
      resetForm();
      alert('Contrat mis à jour avec succès.');
    } catch (err) {
      console.error('Error updating contract:', err);
      alert('Erreur lors de la mise à jour du contrat.');
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewRef('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setFournisseurName('');
    setObjetContrat('');
    setClientName('');
    setNumeroBox('');
    setSite('');
    setDateMarche(new Date().toISOString().split('T')[0]);
    setNomMarche('');
    setStartDate('');
    setEndDate('');
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

  const handleConsult = async (doc: any) => {
    await consultDocument(doc);
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
                    <>
                      <button
                        onClick={() => handleOpenEditContract(c)}
                        className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
              {/* Fournisseurs Fields */}
              {targetCategory === 'fournisseurs' && (
                <>
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom Fournisseur</label>
                    <input
                      type="text"
                      placeholder="Ex: Sermeca SAS"
                      value={fournisseurName}
                      onChange={(e) => setFournisseurName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Objet du Contrat</label>
                    <input
                      type="text"
                      placeholder="Ex: Maintenance ponts bascule"
                      value={objetContrat}
                      onChange={(e) => setObjetContrat(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date Début</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date de Fin</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Clients Fields */}
              {targetCategory === 'clients' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom Client</label>
                    <input
                      type="text"
                      placeholder="Ex: SARL Primeurs du Sud"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Numéro de Box</label>
                      <input
                        type="text"
                        placeholder="Ex: Box 12"
                        value={numeroBox}
                        onChange={(e) => setNumeroBox(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Site / Halle</label>
                      <input
                        type="text"
                        placeholder="Ex: Halle A - Gros"
                        value={site}
                        onChange={(e) => setSite(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date Début Contrat</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date de Fin Contrat</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Marchés Publics Fields */}
              {targetCategory === 'marches_publics' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date du Marché</label>
                    <input
                      type="date"
                      value={dateMarche}
                      onChange={(e) => setDateMarche(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du Document</label>
                    <input
                      type="text"
                      placeholder="Ex: Acte d'engagement / Cahier des charges"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du Marché</label>
                    <input
                      type="text"
                      placeholder="Ex: Nettoyage et propreté des voiries du MIN"
                      value={nomMarche}
                      onChange={(e) => setNomMarche(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date de Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pièce jointe (Consultable)</label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-600">
                  <span>{attachedFile ? attachedFile.name : "Sélectionner un fichier (PDF, Word)..."}</span>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowEditModal(false)} className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Modifier le Contrat / Document</h3>
            <form onSubmit={handleUpdateContract} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sous-dossier / Affaire</label>
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

              {/* Fournisseurs Fields */}
              {targetCategory === 'fournisseurs' && (
                <>
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom Fournisseur</label>
                    <input
                      type="text"
                      value={fournisseurName}
                      onChange={(e) => setFournisseurName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Objet du Contrat</label>
                    <input
                      type="text"
                      value={objetContrat}
                      onChange={(e) => setObjetContrat(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date Début</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date de Fin</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Clients Fields */}
              {targetCategory === 'clients' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom Client</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Numéro de Box</label>
                      <input
                        type="text"
                        value={numeroBox}
                        onChange={(e) => setNumeroBox(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Site / Halle</label>
                      <input
                        type="text"
                        value={site}
                        onChange={(e) => setSite(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date Début</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date de Fin</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Marchés Publics Fields */}
              {targetCategory === 'marches_publics' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date du Marché</label>
                    <input
                      type="date"
                      value={dateMarche}
                      onChange={(e) => setDateMarche(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du Document</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du Marché</label>
                    <input
                      type="text"
                      value={nomMarche}
                      onChange={(e) => setNomMarche(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date de Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Remplacer la Pièce Jointe (Optionnel)</label>
                <input
                  type="file"
                  onChange={(e) => setAttachedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold">Annuler</button>
                <button type="submit" className="rounded-xl bg-sky-600 text-white px-5 py-2 text-xs font-bold hover:bg-sky-500 shadow-md">Enregistrer les modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
