import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Shield, Mail, Lock, UserCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { closeModal, login, users, setCurrentUser } = useApp();
  const [email, setEmail] = useState('cpayen@min-mmm.fr');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      closeModal();
    } else {
      setError('Identifiants incorrects. Essayez cpayen@min-mmm.fr / admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
        <button 
          onClick={closeModal}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-3">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Sélection de Compte / Connexion</h3>
          <p className="text-xs text-slate-500 mt-1">Testez instantanément les différents rôles et habilitations du portail</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email professionnel</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Comptes de démonstration rapides :</p>
          <div className="space-y-2">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => { setCurrentUser(u); closeModal(); }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{u.firstName} {u.lastName}</span>
                  <span className="text-slate-500 ml-2">({u.email})</span>
                </div>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
