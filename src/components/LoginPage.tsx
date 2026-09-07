import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogoMIN } from './LogoMIN';
import { Shield, Lock, Mail, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, users } = useApp();
  
  const lastEmail = localStorage.getItem('min_mmm_last_email') || users[0]?.email || '';
  const [email, setEmail] = useState(lastEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (!success) {
      setError('Identifiant ou mot de passe incorrect. Veuillez vérifier vos accès.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header / Logo branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl mb-4">
            <LogoMIN className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MIN-MMM Intranet</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Marché d'Intérêt National Marseille Méditerranée
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-slate-950">Connexion Sécurisée</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifiez-vous pour accéder à votre espace de pilotage et vos services métiers.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Professionnel</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@min-mmm.fr"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mot de Passe</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                (Compte Admin par défaut: cpayen@min-mmm.fr / mot de passe: admin)
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-[0.98] transition-all"
            >
              <span>Se connecter à l'intranet</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              Sécurité Chiffrée TLS
            </span>
            <span>Support SI MIN-MMM</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Plateforme Intranet Officielle • Réservée au personnel habilité
        </div>
      </div>
    </div>
  );
};
