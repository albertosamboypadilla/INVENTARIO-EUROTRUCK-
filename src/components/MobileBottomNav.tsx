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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
      <div className="grid grid-cols-5 items-center gap-1 max-w-lg mx-auto">
        {/* 1. Conteo e Inventario Rápido */}
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl min-h-[50px] transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'inventory'
              ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/30 border border-red-500'
              : 'text-zinc-400 hover:text-white active:bg-zinc-900'
          }`}
        >
          <div className="relative">
            <CheckCircle2 className={`w-5 h-5 ${activeTab === 'inventory' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {unreviewedCount > 0 && activeTab !== 'inventory' && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-amber-500 text-zinc-950 font-black text-[9px] rounded-full animate-pulse">
                {unreviewedCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold tracking-tight mt-0.5 leading-none">
            Conteo
          </span>
        </button>

        {/* 2. Escáner Cámara */}
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl min-h-[50px] transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'scanner'
              ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/30 border border-red-500'
              : 'text-zinc-400 hover:text-white active:bg-zinc-900'
          }`}
        >
          <Camera className={`w-5 h-5 ${activeTab === 'scanner' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-bold tracking-tight mt-0.5 leading-none">
            Cámara
          </span>
        </button>

        {/* 3. Repuestos & Catálogo */}
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl min-h-[50px] transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'products'
              ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/30 border border-red-500'
              : 'text-zinc-400 hover:text-white active:bg-zinc-900'
          }`}
        >
          <Package className={`w-5 h-5 ${activeTab === 'products' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-bold tracking-tight mt-0.5 leading-none">
            Repuestos
          </span>
        </button>

        {/* 4. Góndolas y Tramos */}
        <button
          type="button"
          onClick={() => setActiveTab('gondolas')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl min-h-[50px] transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'gondolas'
              ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/30 border border-red-500'
              : 'text-zinc-400 hover:text-white active:bg-zinc-900'
          }`}
        >
          <Grid className={`w-5 h-5 ${activeTab === 'gondolas' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-bold tracking-tight mt-0.5 leading-none">
            Góndolas
          </span>
        </button>

        {/* 5. Resumen / Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl min-h-[50px] transition-all duration-150 relative cursor-pointer active:scale-95 ${
            activeTab === 'dashboard'
              ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/30 border border-red-500'
              : 'text-zinc-400 hover:text-white active:bg-zinc-900'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-bold tracking-tight mt-0.5 leading-none">
            Resumen
          </span>
        </button>
      </div>
    </nav>
  );
};
