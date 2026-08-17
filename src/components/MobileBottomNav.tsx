import React from 'react';
import {
  LayoutDashboard,
  Package,
  CheckCircle2,
  Camera,
  Grid,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'products' | 'inventory' | 'gondolas' | 'scanner' | 'thermal' | 'movements';
  setActiveTab: (tab: 'dashboard' | 'products' | 'inventory' | 'gondolas' | 'scanner' | 'thermal' | 'movements') => void;
  unreviewedCount?: number;
  totalProductsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  unreviewedCount = 0,
  totalProductsCount = 0,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
      <div className="grid grid-cols-5 items-center gap-0.5 max-w-md mx-auto">
        {/* 1. Conteo e Inventario Rápido (Highlighted Primary Tool) */}
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'inventory'
              ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-emerald-300'
          }`}
        >
          <div className="relative">
            <CheckCircle2 className={`w-5 h-5 ${activeTab === 'inventory' ? 'stroke-[3]' : 'stroke-2'}`} />
            {unreviewedCount > 0 && activeTab !== 'inventory' && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-amber-500 text-zinc-950 font-black text-[9px] rounded-full animate-pulse">
                {unreviewedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Conteo
          </span>
        </button>

        {/* 2. Escáner Cámara */}
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'scanner'
              ? 'bg-zinc-100 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Camera className={`w-5 h-5 ${activeTab === 'scanner' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Cámara
          </span>
        </button>

        {/* 3. Repuestos & Catálogo */}
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'products'
              ? 'bg-zinc-100 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Package className={`w-5 h-5 ${activeTab === 'products' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Repuestos
          </span>
        </button>

        {/* 4. Góndolas y Tramos */}
        <button
          type="button"
          onClick={() => setActiveTab('gondolas')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'gondolas'
              ? 'bg-zinc-100 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Grid className={`w-5 h-5 ${activeTab === 'gondolas' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Góndolas
          </span>
        </button>

        {/* 5. Resumen / Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'dashboard'
              ? 'bg-zinc-100 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            Resumen
          </span>
        </button>
      </div>
    </nav>
  );
};
