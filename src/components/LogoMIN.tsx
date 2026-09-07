import React, { useState } from 'react';

export const LogoMIN: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const imgHeights = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!imgError ? (
        <img 
          src="/logo-min.png" 
          alt="Marché Marseille Méditerranée" 
          className={`${imgHeights[size]} w-auto object-contain select-none`}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-1 h-9 px-2 py-1 bg-slate-900 rounded-xl shadow-inner">
            <div className="w-1.5 h-full bg-[#84cc16] rounded-xs" />
            <div className="w-1.5 h-3/4 bg-[#0284c7] rounded-xs" />
            <div className="w-1.5 h-full bg-[#a3e635] rounded-xs" />
            <div className="w-1.5 h-5/6 bg-[#ef4444] rounded-xs" />
            <div className="w-1.5 h-4/5 bg-[#f97316] rounded-xs" />
            <div className="w-1.5 h-full bg-[#eab308] rounded-xs" />
            <div className="w-1.5 h-2/3 bg-[#06b6d4] rounded-xs" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">MARCHÉ MARSEILLE</span>
            <span className="text-[10px] font-bold tracking-widest text-[#0284c7] uppercase">MÉDITERRANÉE</span>
          </div>
        </div>
      )}
    </div>
  );
};
