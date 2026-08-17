import React, { useState } from 'react';
import { Product, Location, Movement } from '../types';
import {
  Boxes,
  Package,
  Grid,
  AlertTriangle,
  QrCode,
  Printer,
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  Truck,
  Eye,
  Search,
  DollarSign,
  TrendingUp,
  MapPin,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Filter,
  Camera,
  Layers,
  ZoomIn
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  locations: Location[];
  movements: Movement[];
  onNavigateTab: (tab: 'products' | 'inventory' | 'gondolas' | 'scanner' | 'thermal' | 'movements') => void;
  onOpenAddModal: () => void;
  onExportCleanExcel: () => void;
  onOpenPrintLabel: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  onViewPhoto?: (product: Product) => void;
  onQuickStockChange?: (product: Product, delta: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  locations,
  onNavigateTab,
  onOpenAddModal,
  onExportCleanExcel,
  onOpenPrintLabel,
  onEditProduct,
  onDeleteProduct,
  onViewPhoto,
  onQuickStockChange
}) => {
  // Buscador Principal State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFinancialDetails, setShowFinancialDetails] = useState<boolean>(true);
  const [inventoryListFilter, setInventoryListFilter] = useState<'ALL' | 'ALERT' | 'OUT'>('ALL');

  // Financial Calculations
  const totalCostValue = products.reduce((sum, p) => sum + (p.priceCost || 0) * (p.currentStock || 0), 0);
  const totalSaleValue = products.reduce((sum, p) => sum + (p.priceSale || 0) * (p.currentStock || 0), 0);
  const totalPotentialProfit = totalSaleValue - totalCostValue;

  // General KPIs
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockProds = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStockProds = products.filter((p) => p.currentStock <= 0);

  // Filtered products for main search
  const searchLower = searchTerm.trim().toLowerCase();
  const searchResults = searchLower
    ? products.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(searchLower);
        const modelMatch = p.brandCompatibility?.toLowerCase().includes(searchLower);
        const barcodeMatch = p.barcode?.toLowerCase().includes(searchLower);
        const skuMatch = p.sku?.toLowerCase().includes(searchLower);
        const oemMatch = p.referenceOEM?.toLowerCase().includes(searchLower);
        const locationMatch = p.locationCode?.toLowerCase().includes(searchLower);
        return nameMatch || modelMatch || barcodeMatch || skuMatch || oemMatch || locationMatch;
      })
    : [];

  // Articles for full-width inventory & alert list
  const displayInventoryList = products.filter((p) => {
    // Apply search filter if typed
    if (searchLower) {
      const nameMatch = p.name.toLowerCase().includes(searchLower);
      const partBrandMatch = p.partBrand?.toLowerCase().includes(searchLower);
      const modelMatch = p.brandCompatibility?.toLowerCase().includes(searchLower);
      const barcodeMatch = p.barcode?.toLowerCase().includes(searchLower);
      const skuMatch = p.sku?.toLowerCase().includes(searchLower);
      const oemMatch = p.referenceOEM?.toLowerCase().includes(searchLower);
      const locationMatch = p.locationCode?.toLowerCase().includes(searchLower);
      if (!nameMatch && !partBrandMatch && !modelMatch && !barcodeMatch && !skuMatch && !oemMatch && !locationMatch) {
        return false;
      }
    }

    if (inventoryListFilter === 'ALERT') {
      return p.currentStock <= p.minStock;
    }
    if (inventoryListFilter === 'OUT') {
      return p.currentStock <= 0;
    }
    return true; // ALL
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* 🟢 CLOUD REAL-TIME SYNC BANNER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <p className="text-xs font-semibold text-zinc-300">
            Sincronizado en Tiempo Real • Los cambios se reflejan al instante en todos los dispositivos.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 shrink-0 hidden sm:inline-block">
          FIRESTORE CLOUD
        </span>
      </div>

      {/* 🚨 PROMINENT LOW STOCK ALERT BANNER (RETAINS ALERT COLOR) */}
      {(lowStockProds.length > 0 || outOfStockProds.length > 0) && (
        <div className="bg-rose-950/60 border-2 border-rose-600/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-rose-200 leading-tight">
                ALERTA DE POCO STOCK ({lowStockProds.length + outOfStockProds.length} ARTÍCULOS)
              </h3>
              <p className="text-xs text-rose-300">
                {outOfStockProds.length > 0 ? `${outOfStockProds.length} agotado(s) • ` : ''}
                {lowStockProds.length > 0 ? `${lowStockProds.length} con stock mínimo o bajo.` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setInventoryListFilter('ALERT')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow border border-rose-400 transition active:scale-95 shrink-0 cursor-pointer"
          >
            ⚠️ Ver Artículos con Poco Stock
          </button>
        </div>
      )}

      {/* 🔍 BUSCADOR EN LA PÁGINA PRINCIPAL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 shadow-sm shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-none">
                BÚSQUEDA DE ARTÍCULOS
              </h2>
              <p className="text-xs text-zinc-400">
                Busca por Código (Item/Barra), Nombre o Ubicación (ej: 1b1, 1C1)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs rounded-xl shadow-md border border-zinc-300 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ AGREGAR ARTÍCULO</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Escribe código de item (barras), nombre del artículo o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border-2 border-zinc-700 text-white rounded-2xl pl-12 pr-10 py-3.5 text-sm sm:text-base font-bold placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 shadow-inner"
          />
          <Search className="w-6 h-6 text-zinc-400 absolute left-3.5 top-3.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 p-1 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Display Section */}
        {searchLower && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                Resultados encontrados ({searchResults.length}):
              </span>
              <span className="text-[11px] text-zinc-500 font-bold">
                Búsqueda en tiempo real
              </span>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {searchResults.map((p) => {
                  const isLow = p.currentStock <= p.minStock;
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl bg-zinc-950 border-2 transition shadow-md space-y-2.5 ${
                        isLow ? 'border-rose-600/80 bg-rose-950/20' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-700 shadow-sm flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>UBICACIÓN: {p.locationCode || p.estante || '1b1'}</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-zinc-400">
                          COD: {p.barcode}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-white text-sm leading-tight">{p.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap">
                          {p.partBrand && (
                            <span className="text-zinc-300 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                              Marca: {p.partBrand}
                            </span>
                          )}
                          <span className="text-zinc-400 font-medium">
                            🚛 {p.brandCompatibility || 'Universal'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-xl border border-zinc-800 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 block font-bold">Stock</span>
                          <span className={`font-black text-sm ${isLow ? 'text-rose-400' : 'text-zinc-200'}`}>
                            {p.currentStock} u.
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block font-bold">Precio</span>
                          <span className="font-black text-sm text-white">${p.priceSale.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block font-bold">Costo</span>
                          <span className="font-bold text-zinc-400">${p.priceCost.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-800">
                        {onViewPhoto && (
                          <button
                            onClick={() => onViewPhoto(p)}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer transition active:scale-95"
                            title="Ver fotos y detalle del repuesto"
                          >
                            <Camera className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Fotos</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenPrintLabel(p)}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Código</span>
                        </button>

                        {onEditProduct && (
                          <button
                            onClick={() => onEditProduct(p)}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer transition active:scale-95"
                            title="Editar Repuesto (Requiere Clave 1989)"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Editar</span>
                          </button>
                        )}

                        {onDeleteProduct && (
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 bg-zinc-900 hover:bg-rose-950 text-rose-400 rounded-lg border border-zinc-800 hover:border-rose-800 transition cursor-pointer active:scale-95"
                            title="Eliminar Repuesto (Requiere Clave 1989)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-zinc-950 rounded-2xl text-center text-zinc-400 font-bold text-xs border border-zinc-800">
                No se encontraron repuestos con "{searchTerm}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* 💰 VALORES FINANCIEROS DEL INVENTARIO */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                VALORIZACIÓN TOTAL DEL INVENTARIO
              </h3>
              <p className="text-[11px] text-zinc-400">
                Suma total de costos y valor comercial de venta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFinancialDetails(!showFinancialDetails)}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-700 transition cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>{showFinancialDetails ? 'Ocultar' : 'Ver Valores'}</span>
            </button>
          </div>
        </div>

        {showFinancialDetails ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* COSTO TOTAL DE PIEZAS */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold block">COSTO TOTAL ALMACÉN</span>
                <div className="text-xl sm:text-2xl font-black text-zinc-200 font-mono mt-0.5">
                  ${totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">Inversión en Costos</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* PRECIO VENTA TOTAL */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold block">VALOR TOTAL DE VENTA</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                  ${totalSaleValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">Valor Comercial</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* GANANCIA POTENCIAL */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold block">MARGEN BRUTO ESTIMADO</span>
                <div className="text-xl sm:text-2xl font-black text-zinc-200 font-mono mt-0.5">
                  ${totalPotentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">Diferencia Venta - Costo</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-950 rounded-2xl text-center text-zinc-500 text-xs font-bold border border-zinc-800">
            Valores financieros ocultos.
          </div>
        )}
      </div>

      {/* MENÚ RÁPIDO PRINCIPAL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-white leading-none">
              Menú Rápido
            </h2>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 hidden sm:inline-block">
            Acceso Directo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* 1. BOTÓN: + AGREGAR ARTÍCULO */}
          <button
            onClick={onOpenAddModal}
            className="w-full py-2.5 px-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs sm:text-sm rounded-xl shadow-md border border-zinc-300 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ AGREGAR ARTÍCULO</span>
          </button>

          {/* 2. BOTÓN: CONTEO & INVENTARIAR */}
          <button
            onClick={() => onNavigateTab('inventory')}
            className="w-full py-2.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs sm:text-sm rounded-xl shadow-sm border border-zinc-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>INVENTARIAR (CONTEO)</span>
          </button>

          {/* 3. BOTÓN: VER INVENTARIO */}
          <button
            onClick={() => onNavigateTab('products')}
            className="w-full py-2.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs sm:text-sm rounded-xl shadow-sm border border-zinc-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>VER REPUESTOS</span>
          </button>

          {/* 4. BOTÓN: DESCARGAR EXCEL */}
          <button
            onClick={onExportCleanExcel}
            className="w-full py-2.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs sm:text-sm rounded-xl shadow-sm border border-zinc-700 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
            <span>DESCARGAR EXCEL</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Products SKU */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 shadow-md text-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-bold uppercase">Total Repuestos</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalProducts}</div>
            <span className="text-[10px] text-zinc-500 font-medium block">Artículos Creados</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 shadow-md text-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-bold uppercase">Unidades Físicas</span>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 mt-0.5">{totalUnits} u.</div>
            <span className="text-[10px] text-zinc-500 font-medium block">En Existencia</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Gondola Locations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 shadow-md text-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 font-bold uppercase">Góndolas</span>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 mt-0.5">{locations.length}</div>
            <span className="text-[10px] text-zinc-500 font-medium block">Ubicaciones</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Grid className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Alerts (COLOR RETAINED AS CRITICAL ALERT) */}
        <div className={`rounded-2xl p-3.5 shadow-md flex items-center justify-between border ${
          (lowStockProds.length + outOfStockProds.length) > 0
            ? 'bg-rose-950/40 border-rose-600/70 text-rose-200'
            : 'bg-zinc-900 border-zinc-800 text-zinc-100'
        }`}>
          <div>
            <span className="text-[11px] font-bold uppercase block opacity-80">Alertas Stock</span>
            <div className="text-xl sm:text-2xl font-black mt-0.5">
              {lowStockProds.length + outOfStockProds.length}
            </div>
            <span className="text-[10px] font-bold block opacity-90">
              {outOfStockProds.length} Agotados
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            (lowStockProds.length + outOfStockProds.length) > 0
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Operations Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigateTab('scanner')}
          className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-left transition shadow-sm group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Escáner Cámara</h4>
              <p className="text-[11px] text-zinc-400">
                Lectura con cámara móvil
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition" />
        </button>

        <button
          onClick={() => onNavigateTab('gondolas')}
          className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-left transition shadow-sm group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center shrink-0">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Góndolas & Estantes</h4>
              <p className="text-[11px] text-zinc-400">
                Ubicación física en pasillos
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition" />
        </button>

        <button
          onClick={() => onNavigateTab('thermal')}
          className="p-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-left transition shadow-sm group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Etiquetas Térmicas</h4>
              <p className="text-[11px] text-zinc-400">
                Imprimir en 58mm / 80mm
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* 📦 SECCIÓN A LO LARGO DE TODOS LOS ARTÍCULOS DEL INVENTARIO Y ALERTAS DE REPOSICIÓN */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl text-zinc-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg leading-tight">
                CATÁLOGO Y CONTROL DE INVENTARIO
              </h3>
              <p className="text-xs text-zinc-400">
                Listado completo de repuestos, stock, costos y precios
              </p>
            </div>
          </div>

          {/* Filtros de la lista completa */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setInventoryListFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                inventoryListFilter === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Todos ({products.length})</span>
            </button>

            <button
              onClick={() => setInventoryListFilter('ALERT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                inventoryListFilter === 'ALERT'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-800/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>En Alerta ({lowStockProds.length + outOfStockProds.length})</span>
            </button>

            <button
              onClick={() => setInventoryListFilter('OUT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                inventoryListFilter === 'OUT'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/60'
              }`}
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Agotados ({outOfStockProds.length})</span>
            </button>
          </div>
        </div>

        {/* Tabla / Lista Completa A Lo Largo del Inventario */}
        {displayInventoryList.length > 0 ? (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {displayInventoryList.map((p) => {
              const isOut = p.currentStock <= 0;
              const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl bg-zinc-950 border transition hover:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md ${
                    isOut
                      ? 'border-rose-600/80 bg-rose-950/20'
                      : isLow
                      ? 'border-amber-500/80 bg-amber-950/20'
                      : 'border-zinc-800'
                  }`}
                >
                  {/* Info Principal del Repuesto */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onViewPhoto && onViewPhoto(p)}
                      className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5 overflow-hidden group/photo relative cursor-pointer shadow-sm transition active:scale-95"
                      title="Haz clic para ver las fotos"
                    >
                      {p.photoFront || p.imageUrl ? (
                        <img
                          src={p.photoFront || p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover/photo:scale-110 transition duration-300"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-zinc-400 group-hover/photo:scale-110 transition" />
                      )}
                      <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </button>

                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onViewPhoto && onViewPhoto(p)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-white text-sm sm:text-base leading-tight truncate hover:text-zinc-300 transition">
                          {p.name}
                        </h4>
                        {p.isAudited && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-sm" title={`Auditado por ${p.auditedBy || 'Operador'} el ${p.auditedAt ? new Date(p.auditedAt).toLocaleString() : ''}`}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>CONTADO</span>
                          </span>
                        )}
                        <span className="text-[11px] font-mono font-bold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-700 shadow-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>UBICACIÓN: {p.locationCode || p.estante || '1b1'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                        {p.partBrand && (
                          <span className="text-zinc-300 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            Marca: {p.partBrand}
                          </span>
                        )}
                        <span className="text-zinc-400 font-medium truncate">
                          🚛 {p.brandCompatibility || 'Universal'}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400 font-mono">
                          COD: <strong className="text-zinc-200">{p.barcode}</strong>
                        </span>
                        {(p.photoFront || p.photoDetail || p.imageUrl) && (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                            📷 Foto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock Status & Precios de Costo / Venta */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                    {/* Precios: Costo & Venta */}
                    <div className="flex items-center gap-3 text-right">
                      <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block">Costo</span>
                        <span className="text-xs font-bold text-zinc-300 font-mono">
                          ${(p.priceCost || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">P. Venta</span>
                        <span className="text-xs font-black text-white font-mono">
                          ${(p.priceSale || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Stock (ALERT COLORS PRESERVED) */}
                    <div className="flex items-center gap-1.5 justify-center">
                      {onQuickStockChange && (
                        <button
                          type="button"
                          onClick={() => onQuickStockChange(p, -1)}
                          disabled={p.currentStock <= 0}
                          className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-rose-600 disabled:opacity-30 text-white font-black text-sm border border-zinc-700 flex items-center justify-center transition cursor-pointer"
                          title="Descontar 1 unidad"
                        >
                          -
                        </button>
                      )}

                      <div className="text-center min-w-[100px]">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-xs bg-rose-600 text-white shadow border border-rose-400 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>AGOTADO (0)</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-xs bg-amber-500 text-slate-950 shadow border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
                            <span>⚠️ {p.currentStock} {p.unit}s</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-xl font-bold text-xs bg-zinc-900 text-zinc-300 border border-zinc-700">
                            {p.currentStock} {p.unit}s
                          </span>
                        )}
                      </div>

                      {onQuickStockChange && (
                        <button
                          type="button"
                          onClick={() => onQuickStockChange(p, 1)}
                          className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-sm border border-zinc-700 flex items-center justify-center transition cursor-pointer"
                          title="Sumar 1 unidad"
                        >
                          +
                        </button>
                      )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-1.5">
                      {onViewPhoto && (
                        <button
                          onClick={() => onViewPhoto(p)}
                          className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Ver fotos y detalles"
                        >
                          <Camera className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Fotos</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenPrintLabel(p)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-700 transition active:scale-95 cursor-pointer"
                        title="Imprimir código de barra"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {onEditProduct && (
                        <button
                          onClick={() => onEditProduct(p)}
                          className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Editar repuesto (Requiere Clave 1989)"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                      )}

                      {onDeleteProduct && (
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-2 bg-zinc-900 hover:bg-rose-950 text-rose-400 rounded-xl border border-zinc-800 hover:border-rose-800 transition active:scale-95 cursor-pointer"
                          title="Eliminar repuesto (Requiere Clave 1989)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500 text-sm font-bold bg-zinc-950 rounded-2xl border border-zinc-800">
            No hay artículos que coincidan con el filtro seleccionado.
          </div>
        )}
      </div>
    </div>
  );
};

