import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Mail } from 'lucide-react';

export const MailModal: React.FC = () => {
  const { closeModal, addMail, users, services } = useApp();

  const [sender, setSender] = useState('');
  const [recipientId, setRecipientId] = useState(users[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'Entrant' | 'Sortant'>('Entrant');
  const [assignmentType, setAssignmentType] = useState<'Action' | 'Copie/Information'>('Action');
  const [dueDate, setDueDate] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [attachmentName, setAttachmentName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender || !subject) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }
    const recipient = users.find(u => u.id === recipientId);
    const recipientName = recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Collaborateur';

    addMail({
      sender,
      recipientId,
      recipientName,
      subject,
      type,
      assignmentType,
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'En attente',
      attachmentName: attachmentName || `${subject.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      serviceId
    });
    closeModal();
    alert('Courrier enregistré et attribué avec succès.');
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
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Enregistrement Courrier</h3>
            <p className="text-xs text-slate-500">Workflow d'attribution et fixation de date limite</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type de courrier</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              >
                <option value="Entrant">Courrier Entrant</option>
                <option value="Sortant">Courrier Sortant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Attribution pour</label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              >
                <option value="Action">Action requise</option>
                <option value="Copie/Information">Copie / Information</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Expéditeur</label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="ex: Préfecture, Ministère, Tiers..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Objet du courrier</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ex: Demande d'autorisation d'aménagement"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Destinataire / Collaborateur</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date limite de traitement</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Pièce jointe (document ou scan)</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setAttachmentName(e.target.files[0].name);
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {attachmentName && (
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">Fichier sélectionné : {attachmentName}</p>
            )}
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
              Enregistrer le courrier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
