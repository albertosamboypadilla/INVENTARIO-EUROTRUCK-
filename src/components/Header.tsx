import React from 'react';
import {
  LayoutDashboard,
  Package,
  Grid,
  QrCode,
  Printer,
  History,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  Truck,
  ArrowLeft,
  FileJson,
  Database,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'products' | 'inventory' | 'gondolas' | 'scanner' | 'thermal' | 'movements';
  setActiveTab: (tab: 'dashboard' | 'products' | 'inventory' | 'gondolas' | 'scanner' | 'thermal' | 'movements') => void;
  onExportEurotruckExcel: () => void;
  onExportGeneralExcel: () => void;
  onExportFullBackup?: () => void;
  onOpenImportExcel: () => void;
  onSeedDemo: () => void;
  totalProductsCount: number;
  lowStockCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportEurotruckExcel,
  onExportGeneralExcel,
  onExportFullBackup,
  onOpenImportExcel,
  onSeedDemo,
  totalProductsCount,
  lowStockCount = 0
}) => {
  return (
    <header className="bg-zinc-950 border-b border-zinc-800 text-zinc-100 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  EUROTRUCK SRL
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                  WMS Almacén
                </span>
                <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 shadow-sm" title="Firebase Firestore en tiempo real con persistencia IndexedDB offline">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Nube Firestore</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Control de Repuestos de Camión • Fotos Dobles • Excel Oficial
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onExportFullBackup && (
              <button
                onClick={onExportFullBackup}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition active:scale-95 cursor-pointer"
                title="Exportar copia de seguridad completa del programa en JSON"
              >
                <FileJson className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden md:inline">Backup JSON</span>
              </button>
            )}

            <button
              onClick={onOpenImportExcel}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition active:scale-95 cursor-pointer"
              title="Importar repuestos desde Excel o restaurar respaldo JSON"
            >
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span>Importar / Data</span>
            </button>

            {/* Excel Eurotruck Official Format */}
            <button
              onClick={onExportEurotruckExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 shadow-md transition active:scale-95 cursor-pointer"
              title="Descargar Excel Oficial EUROTRUCK SRL para Conteo Físico"
            >
              <FileSpreadsheet className="w-4 h-4 text-zinc-950" />
              <span>Exportar Excel</span>
            </button>

            {totalProductsCount === 0 && (
              <button
                onClick={onSeedDemo}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-sm transition active:scale-95"
                title="Cargar catálogo demo de camiones"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Demo Repuestos</span>
              </button>
            )}
          </div>
        </div>


        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-zinc-800/80 py-2">
          {activeTab !== 'dashboard' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95 shrink-0 shadow-sm cursor-pointer"
              title="Volver al Menú Principal / Resumen"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
              <span>← Atrás</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Resumen</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-colors relative cursor-pointer ${
              activeTab === 'products'
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Repuestos & Stock</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white shadow animate-pulse">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Dedicated Inventory Audit Review Window Button */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-colors relative cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            <span>Conteo & Revisión</span>
          </button>

          <button
            onClick={() => setActiveTab('gondolas')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'gondolas'
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Góndolas & Estantes</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'scanner'
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Escáner Cámara</span>
          </button>

          <button
            onClick={() => setActiveTab('thermal')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'thermal'
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Etiquetas Térmicas</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === 'movements'
                ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Kardex</span>
          </button>
        </div>
      </div>
    </header>
  );
};
