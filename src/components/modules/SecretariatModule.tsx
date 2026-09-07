import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail as MailIcon, Plus, Clock, CheckCircle2, AlertTriangle, Send, RefreshCw, FileText, X, Edit2, Filter, Download } from 'lucide-react';
import { MailStatus, MailAssignment, Mail } from '../../types';
import { getFileFromIDB } from '../../utils/idbStorage';

export const SecretariatModule: React.FC = () => {
  const { services, mails, users, currentUser, updateMailAssignmentStatus, addMail, updateMail } = useApp();
  const serviceObj = services.find(s => s.code === 'SECRETARIAT');
  const serviceTitle = serviceObj ? serviceObj.name : 'Flux Courriers Entrants & Sortants';
  const serviceDesc = serviceObj ? serviceObj.description : 'Enregistrement, attributions, pièces jointes et gestion des courriers pour information sans échéance.';
  const [filterType, setFilterType] = useState<'all' | 'Entrant' | 'Sortant'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMail, setEditingMail] = useState<Mail | null>(null);

  // Form state for new mail
  const [newType, setNewType] = useState<'Entrant' | 'Sortant'>('Entrant');
  const [newSender, setNewSender] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newReference, setNewReference] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [newAssignments, setNewAssignments] = useState<Array<{ collaboratorId: string; actionRequired: string; dueDate: string; isInfoOnly: boolean }>>([
    { collaboratorId: users[0]?.id || '', actionRequired: 'Traiter et répondre', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], isInfoOnly: false }
  ]);

  const handleAddAssignmentRow = () => {
    setNewAssignments([
      ...newAssignments,
      { collaboratorId: users[0]?.id || '', actionRequired: 'Pour information / Copie', dueDate: '', isInfoOnly: true }
    ]);
  };

  const handleRemoveAssignmentRow = (index: number) => {
    if (newAssignments.length <= 1) return;
    setNewAssignments(newAssignments.filter((_, i) => i !== index));
  };

  const handleCreateMailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || (newType === 'Entrant' && !newSender) || (newType === 'Sortant' && !newRecipient)) {
      alert('Veuillez remplir les champs obligatoires (Objet et Expéditeur/Destinataire).');
      return;
    }

    const assignments: MailAssignment[] = newAssignments.map((asg, idx) => {
      const u = users.find(user => user.id === asg.collaboratorId);
      return {
        id: 'asg-' + Date.now() + '-' + idx,
        collaboratorId: asg.collaboratorId,
        collaboratorName: u ? `${u.firstName} ${u.lastName}` : 'Collaborateur',
        actionRequired: asg.isInfoOnly ? 'Pour information (Copie)' : asg.actionRequired,
        dueDate: asg.isInfoOnly ? '' : asg.dueDate,
        status: 'À faire',
        isInfoOnly: asg.isInfoOnly
      };
    });

    if (attachmentFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = reader.result as string;
        addMail({
          sender: newType === 'Entrant' ? newSender : (currentUser.firstName + ' ' + currentUser.lastName + ' (MIN-MMM)'),
          recipient: newType === 'Sortant' ? newRecipient : undefined,
          reference: newReference || `${newType.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
          subject: newSubject,
          type: newType,
          attachmentName: attachmentFile.name,
          fileName: attachmentFile.name,
          fileUrl: fileUrl,
          serviceId: 'srv-secr',
          assignments
        });
        resetForm();
        alert('Courrier et pièce jointe enregistrés avec succès.');
      };
      reader.readAsDataURL(attachmentFile);
    } else {
      addMail({
        sender: newType === 'Entrant' ? newSender : (currentUser.firstName + ' ' + currentUser.lastName + ' (MIN-MMM)'),
        recipient: newType === 'Sortant' ? newRecipient : undefined,
        reference: newReference || `${newType.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
        subject: newSubject,
        type: newType,
        attachmentName: 'courrier_scan.pdf',
        serviceId: 'srv-secr',
        assignments
      });
      resetForm();
      alert('Courrier enregistré avec succès.');
    }
  };

  const resetForm = () => {
    setNewSender('');
    setNewRecipient('');
    setNewReference('');
    setNewSubject('');
    setAttachmentFile(null);
    setShowAddModal(false);
  };

  const handleEditMailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMail) return;

    if (attachmentFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = reader.result as string;
        updateMail({
          ...editingMail,
          fileUrl: fileUrl,
          fileName: attachmentFile.name,
          attachmentName: attachmentFile.name
        });
        setShowEditModal(false);
        setEditingMail(null);
        setAttachmentFile(null);
        alert('Courrier mis à jour avec succès.');
      };
      reader.readAsDataURL(attachmentFile);
    } else {
      updateMail(editingMail);
      setShowEditModal(false);
      setEditingMail(null);
      alert('Courrier mis à jour avec succès.');
    }
  };

  const handleConsultMail = async (mail: Mail) => {
    let fileUrl = mail.fileUrl;
    if (!fileUrl && mail.id) {
      fileUrl = await getFileFromIDB(mail.id);
    }
    if (fileUrl) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Consultation Courrier - ${mail.reference}</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 30px; background: #0f172a; color: #f8fafc; text-align: center; }
                .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
                h1 { font-size: 18px; margin-bottom: 8px; }
                p { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
                .actions { margin-top: 20px; display: flex; justify-content: center; gap: 12px; }
                a, button { background: #0284c7; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: none; cursor: pointer; }
                a:hover, button:hover { background: #0369a1; }
                iframe { width: 100%; height: 500px; border: none; border-radius: 8px; background: white; margin-top: 16px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${mail.subject}</h1>
                <p>Réf: ${mail.reference} • Type: ${mail.type} • ${mail.date}</p>
                <iframe src="${fileUrl}" title="${mail.subject}"></iframe>
                <div class="actions">
                  <a href="${fileUrl}" download="${mail.fileName || 'courrier.pdf'}">Télécharger le fichier</a>
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
      alert("Aucun fichier associé ou fichier introuvable dans IndexedDB pour ce courrier.");
    }
  };

  const statusBadgeColors: Record<MailStatus, string> = {
    'À faire': 'bg-amber-100 text-amber-800 border-amber-200',
    'Traité': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'En retard': 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const canModifyCourrier = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      {/* Header Banner with MIN Sky Blue Theme & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-3xl border border-sky-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#0284c7]"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-800 border border-sky-200 mb-1">
            <MailIcon className="h-3.5 w-3.5 text-[#0284c7]" />
            {serviceObj ? serviceObj.name : 'Secrétariat Général & Courrier'}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{serviceTitle}</h2>
          <p className="text-sm text-slate-500">{serviceDesc}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher par objet, réf, expéditeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 shadow-2xs"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0284c7] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Ajouter un courrier
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type :</span>
          {(['all', 'Entrant', 'Sortant'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${filterType === t ? 'bg-[#0284c7] text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              {t === 'all' ? 'Tous' : `Courriers ${t}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Statut :</span>
          {['all', 'À faire', 'Traité', 'En retard'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${filterStatus === st ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              {st === 'all' ? 'Tous' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Mails List */}
      <div className="space-y-6">
        {mails.map(mail => {
          if (filterType !== 'all' && mail.type !== filterType) return null;
          const matchesStatus = filterStatus === 'all' || mail.assignments.some(a => a.status === filterStatus);
          if (!matchesStatus) return null;
          const matchesSearch = !searchTerm ||
            mail.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mail.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mail.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mail.recipient && mail.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
            mail.assignments.some(a => a.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase()) || a.actionRequired.toLowerCase().includes(searchTerm.toLowerCase()));
          if (!matchesSearch) return null;

          return (
            <div key={mail.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${mail.type === 'Entrant' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                    <MailIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">{mail.reference}</span>
                      <h3 
                        onClick={() => handleConsultMail(mail)}
                        className="text-base font-bold text-slate-900 hover:text-sky-600 cursor-pointer transition-colors"
                      >
                        {mail.subject}
                      </h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${mail.type === 'Entrant' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                        {mail.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {mail.type === 'Entrant' ? `Expéditeur: ${mail.sender}` : `Destinataire: ${mail.recipient || 'Partenaire Extérieur'}`} • Enregistré le: {mail.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConsultMail(mail)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                    title="Consulter le courrier"
                  >
                    <FileText className="h-4 w-4 text-[#0284c7]" />
                    <span>Consulter ({mail.attachmentName})</span>
                  </button>
                  {canModifyCourrier && (
                    <button
                      onClick={() => {
                        setEditingMail(mail);
                        setShowEditModal(true);
                      }}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                      title="Modifier ce courrier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Assignments */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attributions & Suivi :</h4>
                <div className="grid grid-cols-1 gap-3">
                  {mail.assignments.map(asg => (
                    <div key={asg.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{asg.collaboratorName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${statusBadgeColors[asg.status]}`}>
                            {asg.status}
                          </span>
                          {asg.isInfoOnly && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800">
                              Pour info (Copie)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 mt-1">Action: <span className="font-medium">{asg.actionRequired}</span></p>
                        {!asg.isInfoOnly && asg.dueDate && (
                          <p className="text-[11px] text-slate-500 mt-0.5">Échéance: {asg.dueDate}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {asg.isInfoOnly ? (
                          <span className="text-[11px] text-slate-400 italic">Pas d'échéance ni de relance (Pour info)</span>
                        ) : (
                          <select
                            value={asg.status}
                            onChange={(e) => updateMailAssignmentStatus(mail.id, asg.id, e.target.value as MailStatus)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            <option value="À faire">À faire</option>
                            <option value="Traité">Traité</option>
                            <option value="En retard">En retard</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Mail Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl relative my-8">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Enregistrer un Courrier Entrant ou Sortant</h3>
            
            <form onSubmit={handleCreateMailSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type de flux</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'Entrant' | 'Sortant')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Entrant">Courrier Entrant</option>
                    <option value="Sortant">Courrier Sortant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Référence / Numéro</label>
                  <input
                    type="text"
                    placeholder="Ex: REF-2026-104"
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {newType === 'Entrant' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expéditeur</label>
                  <input
                    type="text"
                    placeholder="Nom de l'expéditeur externe"
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Destinataire</label>
                  <input
                    type="text"
                    placeholder="Nom du destinataire du courrier sortant"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Objet du courrier</label>
                <input
                  type="text"
                  placeholder="Objet synthétique"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pièce jointe (PDF, Scan)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setAttachmentFile(e.target.files[0]);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                {attachmentFile && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Fichier sélectionné : {attachmentFile.name}</p>
                )}
              </div>

              {/* Attributions multiple */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Attributions & Destinataires</span>
                  <button
                    type="button"
                    onClick={handleAddAssignmentRow}
                    className="text-xs font-bold text-sky-600 hover:underline"
                  >
                    + Ajouter une attribution
                  </button>
                </div>

                {newAssignments.map((asg, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Collaborateur</label>
                        <select
                          value={asg.collaboratorId}
                          onChange={(e) => {
                            const updated = [...newAssignments];
                            updated[index].collaboratorId = e.target.value;
                            setNewAssignments(updated);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Type d'envoi</label>
                        <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={asg.isInfoOnly}
                            onChange={(e) => {
                              const updated = [...newAssignments];
                              updated[index].isInfoOnly = e.target.checked;
                              if (e.target.checked) {
                                updated[index].actionRequired = 'Pour information (Copie)';
                                updated[index].dueDate = '';
                              } else {
                                updated[index].actionRequired = 'Traiter et répondre';
                              }
                              setNewAssignments(updated);
                            }}
                            className="rounded text-sky-600 h-4 w-4"
                          />
                          <span className="text-xs font-semibold text-blue-700">Pour info / Copie (sans échéance)</span>
                        </label>
                      </div>
                    </div>

                    {!asg.isInfoOnly && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Action requise</label>
                          <input
                            type="text"
                            value={asg.actionRequired}
                            onChange={(e) => {
                              const updated = [...newAssignments];
                              updated[index].actionRequired = e.target.value;
                              setNewAssignments(updated);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Date d'échéance</label>
                          <input
                            type="date"
                            value={asg.dueDate}
                            onChange={(e) => {
                              const updated = [...newAssignments];
                              updated[index].dueDate = e.target.value;
                              setNewAssignments(updated);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {newAssignments.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignmentRow(index)}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          Supprimer cette attribution
                        </button>
                      </div>
                    )}
                  </div>
                ))}
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
                  className="rounded-xl bg-[#0284c7] text-white px-5 py-2 text-xs font-bold hover:bg-sky-500 shadow-lg shadow-sky-600/30"
                >
                  Enregistrer le courrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mail Modal */}
      {showEditModal && editingMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl relative my-8">
            <button 
              onClick={() => { setShowEditModal(false); setEditingMail(null); }}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Modifier le courrier ({editingMail.reference})</h3>
            
            <form onSubmit={handleEditMailSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type de flux</label>
                  <select
                    value={editingMail.type}
                    onChange={(e) => setEditingMail({ ...editingMail, type: e.target.value as 'Entrant' | 'Sortant' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Entrant">Courrier Entrant</option>
                    <option value="Sortant">Courrier Sortant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Référence / Numéro</label>
                  <input
                    type="text"
                    value={editingMail.reference}
                    onChange={(e) => setEditingMail({ ...editingMail, reference: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              </div>

              {editingMail.type === 'Entrant' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expéditeur</label>
                  <input
                    type="text"
                    value={editingMail.sender}
                    onChange={(e) => setEditingMail({ ...editingMail, sender: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Destinataire</label>
                  <input
                    type="text"
                    value={editingMail.recipient || ''}
                    onChange={(e) => setEditingMail({ ...editingMail, recipient: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Objet du courrier</label>
                <input
                  type="text"
                  value={editingMail.subject}
                  onChange={(e) => setEditingMail({ ...editingMail, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Remplacer la pièce jointe (optionnel)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setAttachmentFile(e.target.files[0]);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                <p className="text-[11px] text-slate-500 mt-1">Actuel : {editingMail.attachmentName}</p>
              </div>

              {/* Assignments editing in edit modal */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Attributions & Destinataires</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newAsg: MailAssignment = {
                        id: 'asg-' + Date.now(),
                        collaboratorId: users[0]?.id || '',
                        collaboratorName: `${users[0]?.firstName || ''} ${users[0]?.lastName || ''}`,
                        actionRequired: 'Traiter et répondre',
                        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                        status: 'À faire',
                        isInfoOnly: false
                      };
                      setEditingMail({
                        ...editingMail,
                        assignments: [...editingMail.assignments, newAsg]
                      });
                    }}
                    className="text-xs font-bold text-sky-600 hover:underline"
                  >
                    + Ajouter une attribution
                  </button>
                </div>

                {editingMail.assignments.map((asg, index) => (
                  <div key={asg.id || index} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Collaborateur</label>
                        <select
                          value={asg.collaboratorId}
                          onChange={(e) => {
                            const u = users.find(user => user.id === e.target.value);
                            const updated = [...editingMail.assignments];
                            updated[index] = {
                              ...updated[index],
                              collaboratorId: e.target.value,
                              collaboratorName: u ? `${u.firstName} ${u.lastName}` : 'Collaborateur'
                            };
                            setEditingMail({ ...editingMail, assignments: updated });
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Type d'envoi</label>
                        <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={asg.isInfoOnly}
                            onChange={(e) => {
                              const updated = [...editingMail.assignments];
                              updated[index] = {
                                ...updated[index],
                                isInfoOnly: e.target.checked,
                                actionRequired: e.target.checked ? 'Pour information (Copie)' : 'Traiter et répondre',
                                dueDate: e.target.checked ? '' : updated[index].dueDate
                              };
                              setEditingMail({ ...editingMail, assignments: updated });
                            }}
                            className="rounded text-sky-600 h-4 w-4"
                          />
                          <span className="text-xs font-semibold text-blue-700">Pour info (Copie)</span>
                        </label>
                      </div>
                    </div>

                    {!asg.isInfoOnly && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Action requise</label>
                          <input
                            type="text"
                            value={asg.actionRequired}
                            onChange={(e) => {
                              const updated = [...editingMail.assignments];
                              updated[index] = { ...updated[index], actionRequired: e.target.value };
                              setEditingMail({ ...editingMail, assignments: updated });
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Échéance</label>
                          <input
                            type="date"
                            value={asg.dueDate}
                            onChange={(e) => {
                              const updated = [...editingMail.assignments];
                              updated[index] = { ...updated[index], dueDate: e.target.value };
                              setEditingMail({ ...editingMail, assignments: updated });
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {editingMail.assignments.length > 1 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingMail.assignments.filter((_, i) => i !== index);
                            setEditingMail({ ...editingMail, assignments: updated });
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          Supprimer cette attribution
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingMail(null); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0284c7] text-white px-5 py-2 text-xs font-bold hover:bg-sky-500 shadow-lg shadow-sky-600/30"
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
