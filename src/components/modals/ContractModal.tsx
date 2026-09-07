import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldCheck } from 'lucide-react';

export const ContractModal: React.FC = () => {
  const { closeModal, addContract, services } = useApp();

  const [name, setName] = useState('');
  const [raisonSociale, setRaisonSociale] = useState('');
  const [type, setType] = useState<'Fournisseur' | 'Client'>('Fournisseur');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noticeDays, setNoticeDays] = useState(60);
  const [amount, setAmount] = useState(25000);
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [taciteReconduction, setTaciteReconduction] = useState(true);
  const [conditionResiliation, setConditionResiliation] = useState('');
  const [boxNumber, setBoxNumber] = useState('');
  const [siteName, setSiteName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !raisonSociale || !endDate) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }
    
    // Calculate status color based on end date
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let statusColor: 'vert' | 'orange' | 'rouge' = 'vert';
    if (diffDays < 30) statusColor = 'rouge';
    else if (diffDays < 90) statusColor = 'orange';

    addContract({
      name,
      raisonSociale,
      type,
      isAvenant: false,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate,
      noticeDays,
      amount,
      statusColor,
      decisionStatus: 'A_valider',
      serviceId,
      attachmentName: `${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      taciteReconduction,
      conditionResiliation: conditionResiliation || 'Préavis standard',
      numeroBox: boxNumber,
      site: siteName
    });
    closeModal();
    alert('Contrat enregistré avec succès.');
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
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Enregistrer un Contrat</h3>
            <p className="text-xs text-slate-500">Registre centralisé des tiers fournisseurs et clients</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Intitulé du contrat</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Maintenance climatisation centrale"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Raison Sociale / Tiers</label>
              <input
                type="text"
                value={raisonSociale}
                onChange={(e) => setRaisonSociale(e.target.value)}
                placeholder="ex: KlimaTech SA"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type de contrat</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="Fournisseur">Fournisseur</option>
                <option value="Client">Client</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date d'effet</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date d'échéance</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Préavis (jours)</label>
              <input
                type="number"
                value={noticeDays}
                onChange={(e) => setNoticeDays(parseInt(e.target.value) || 30)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Montant annuel (€)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Service rattaché</label>
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
              Enregistrer le contrat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
