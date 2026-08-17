import React, { useState } from 'react';
import { Product, Location, MovementType } from '../types';
import { ProductModal } from './ProductModal';
import { exportEurotruckConteoExcel, exportGeneralInventoryToExcel } from '../services/wmsService';
import {
  Package,
  Plus,
  Search,
  MapPin,
  Printer,
  Edit2,
  Trash2,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  Truck,
  Image as ImageIcon,
  Camera,
  Layers,
  ChevronRight,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  locations: Location[];
  onAddProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onExecuteMovement: (params: {
    product: Product;
    type: MovementType;
    quantity: number;
    newLocationCode?: string;
    operator: string;
    notes?: string;
  }) => Promise<void>;
  onOpenPrintLabel: (product: Product) => void;
  onOpenScanner?: () => void;
  onRequestPin?: (action: 'edit' | 'delete', product: Product, onAuthorized: () => void) => void;
  onBackToDashboard?: () => void;
  onViewPhoto?: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  locations,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onExecuteMovement,
  onOpenPrintLabel,
  onOpenScanner,
  onRequestPin,
  onBackToDashboard,
  onViewPhoto
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'AUDITED' | 'PENDING' | 'LOW' | 'OUT'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [quickAdjustingId, setQuickAdjustingId] = useState<string | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.partBrand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brandCompatibility || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.referenceOEM || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.locationCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'AUDITED') {
      matchesStock = !!p.isAudited;
    } else if (stockFilter === 'PENDING') {
      matchesStock = !p.isAudited;
    } else if (stockFilter === 'LOW') {
      matchesStock = p.currentStock > 0 && p.currentStock <= p.minStock;
    } else if (stockFilter === 'OUT') {
      matchesStock = p.currentStock <= 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    if (onRequestPin) {
      onRequestPin('edit', product, () => {
        setProductToEdit(product);
        setIsModalOpen(true);
      });
    } else {
      setProductToEdit(product);
      setIsModalOpen(true);
    }
  };

  const handleDeleteWithAuth = (product: Product) => {
    if (onRequestPin) {
      onRequestPin('delete', product, () => {
        if (confirm(`¿Eliminar "${product.name}" del catálogo Eurotruck?`)) {
          onDeleteProduct(product.id);
        }
      });
    } else {
      if (confirm(`¿Eliminar "${product.name}" del catálogo Eurotruck?`)) {
        onDeleteProduct(product.id);
      }
    }
  };

  const handleQuickAdjust = async (product: Product, delta: number) => {
    const actionType = delta > 0 ? 'AGREGAR (+1)' : 'QUITAR (-1)';
    if (onRequestPin) {
      onRequestPin('edit', product, async () => {
        setQuickAdjustingId(product.id);
        try {
          const type: MovementType = delta > 0 ? 'IN' : 'OUT';
          await onExecuteMovement({
            product,
            type,
            quantity: Math.abs(delta),
            operator: 'Operador Eurotruck WMS',
            notes: `Ajuste de stock (${actionType})`,
          });
        } catch (e) {
          console.error('Error quick adjusting stock:', e);
        } finally {
          setQuickAdjustingId(null);
        }
      });
    } else {
      setQuickAdjustingId(product.id);
      try {
        const type: MovementType = delta > 0 ? 'IN' : 'OUT';
        await onExecuteMovement({
          product,
          type,
          quantity: Math.abs(delta),
          operator: 'Operador Eurotruck WMS',
          notes: `Ajuste de stock (${actionType})`,
        });
      } catch (e) {
        console.error('Error quick adjusting stock:', e);
      } finally {
        setQuickAdjustingId(null);
      }
    }
  };

  const handleSaveProduct = async (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (productToEdit) {
      await onUpdateProduct(productToEdit.id, data);
    } else {
      await onAddProduct(data);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 rounded-xl font-black text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="w-4 h-4 text-blue-300" />
              <span>← Atrás</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Catálogo & Control de Repuestos
              </h2>
              <p className="text-xs text-slate-400">
                Control de inventarios Eurotruck SRL • Góndolas, Estantes, Compatibilidad y Alertas
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Excel Export Buttons */}
          <button
            onClick={() => exportEurotruckConteoExcel(products)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 active:scale-95"
            title="Formato Oficial EUROTRUCK SRL con Encabezado Azul y Banners"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel EUROTRUCK</span>
          </button>

          <button
            onClick={() => exportGeneralInventoryToExcel(products, locations)}
            className="px-3.5 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/60 font-bold text-xs rounded-xl transition flex items-center gap-1.5 active:scale-95"
            title="Reporte Completo con Links de Fotos y Detalle de Góndolas"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>Excel General + Fotos</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Repuesto</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar Repuesto, Código ART-001, OEM, Marca de Camión, Góndola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas las Categorías ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Alert & Audit Filter Chips */}
          <div className="sm:col-span-12 flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Filtros Rápidos:</span>
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos ({products.length})
            </button>

            <button
              onClick={() => setStockFilter('AUDITED')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
                stockFilter === 'AUDITED'
                  ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                  : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/60'
              }`}
            >
              <span>✅ Contados en Verde ({products.filter((p) => !!p.isAudited).length})</span>
            </button>

            <button
              onClick={() => setStockFilter('PENDING')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
                stockFilter === 'PENDING'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                  : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/60 border border-amber-800/60'
              }`}
            >
              <span>⏳ Pendientes ({products.filter((p) => !p.isAudited).length})</span>
            </button>

            <button
              onClick={() => setStockFilter('LOW')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                stockFilter === 'LOW'
                  ? 'bg-amber-600 text-white font-black'
                  : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
              }`}
              title="Stock bajo"
            >
              ⚠️ Poco Stock ({products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length})
            </button>

            <button
              onClick={() => setStockFilter('OUT')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                stockFilter === 'OUT'
                  ? 'bg-rose-600 text-white font-black'
                  : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
              }`}
              title="Agotados"
            >
              🚨 Agotados ({products.filter((p) => p.currentStock <= 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden hidden md:block text-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fotos</th>
                <th className="py-3.5 px-4">Código / Repuesto</th>
                <th className="py-3.5 px-4">Marca / OEM</th>
                <th className="py-3.5 px-4">Góndola / Estante</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-right">Costo / Precio</th>
                <th className="py-3.5 px-4 text-center">Ajuste Rápido</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
                const isOut = p.currentStock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    {/* Dual Photos Thumbnails */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {p.photoFront ? (
                          <img
                            src={p.photoFront}
                            alt="Vista 1"
                            onClick={() => onViewPhoto ? onViewPhoto(p) : setPreviewImage(p.photoFront || null)}
                            className="w-10 h-10 rounded-lg object-cover border-2 border-emerald-500/80 cursor-pointer hover:scale-110 shadow transition"
                            title="Haz clic para ver galería completa"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onViewPhoto && onViewPhoto(p)}
                            className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 flex items-center justify-center text-slate-500 hover:text-blue-400 text-[9px] font-bold cursor-pointer transition"
                            title="Ver detalle de repuesto"
                          >
                            📷 Foto 1
                          </button>
                        )}

                        {p.photoDetail ? (
                          <img
                            src={p.photoDetail}
                            alt="Vista 2"
                            onClick={() => onViewPhoto ? onViewPhoto(p) : setPreviewImage(p.photoDetail || null)}
                            className="w-10 h-10 rounded-lg object-cover border-2 border-blue-500/80 cursor-pointer hover:scale-110 shadow transition"
                            title="Haz clic para ver galería completa"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onViewPhoto && onViewPhoto(p)}
                            className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 flex items-center justify-center text-slate-500 hover:text-blue-400 text-[9px] font-bold cursor-pointer transition"
                            title="Ver detalle de repuesto"
                          >
                            📷 Foto 2
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Product Name & Barcode */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => onViewPhoto && onViewPhoto(p)}
                        className="font-black text-white text-sm hover:text-blue-400 transition cursor-pointer flex items-center gap-1.5 flex-wrap"
                      >
                        <span>{p.name}</span>
                        {p.isAudited && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm">
                            <span>✅ CONTADO</span>
                          </span>
                        )}
                        <span className="text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded font-bold">
                          📸 Fotos
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 font-bold">
                          {p.barcode}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">SKU: {p.sku}</span>
                      </div>
                    </td>

                    {/* Truck Brand Compatibility & OEM Reference */}
                    <td className="py-3 px-4">
                      {p.partBrand && (
                        <div className="font-bold text-emerald-400 text-xs">
                          🏷️ Marca: {p.partBrand}
                        </div>
                      )}
                      <div className="font-bold text-amber-400 text-xs">
                        {p.brandCompatibility || 'Universal'}
                      </div>
                      {p.referenceOEM && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          OEM: <span className="text-slate-200 font-bold">{p.referenceOEM}</span>
                        </div>
                      )}
                    </td>

                    {/* Warehouse Location Code */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{p.locationCode}</span>
                      </span>
                      {p.estante && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Estante: <strong className="text-white">{p.estante}</strong> | Tramo: <strong className="text-white">{p.tramo || '01'}</strong>
                        </div>
                      )}
                    </td>

                    {/* Stock Level Badge */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        {isOut ? (
                          <span className="px-3 py-1 rounded-xl font-black text-xs bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>🚨 AGOTADO (0)</span>
                          </span>
                        ) : isLow ? (
                          <span className="px-3 py-1 rounded-xl font-black text-xs bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
                            <span>⚠️ {p.currentStock} {p.unit}s (REPOSICIÓN)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl font-black text-xs bg-slate-800 text-emerald-400 border border-slate-700">
                            ✅ {p.currentStock} {p.unit}s
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price & Cost */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-black text-white text-sm">${p.priceSale.toFixed(2)}</div>
                      {p.priceCost > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Costo: ${p.priceCost.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Quick Stock Controls */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
                        <button
                          disabled={quickAdjustingId === p.id}
                          onClick={() => handleQuickAdjust(p, -1)}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition"
                          title="Restar 1 unidad"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1.5">{p.currentStock}</span>
                        <button
                          disabled={quickAdjustingId === p.id}
                          onClick={() => handleQuickAdjust(p, 1)}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                          title="Sumar 1 unidad"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onOpenPrintLabel(p)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition"
                          title="Imprimir Etiqueta Térmica"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                          title="Editar Repuesto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWithAuth(p)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                          title="Eliminar Repuesto (Clave 1989)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Products Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const isLowOrOut = p.currentStock <= p.minStock || p.currentStock <= 0;

          return (
            <div
              key={p.id}
              className={`bg-slate-900 rounded-3xl p-4 sm:p-5 text-slate-100 flex flex-col justify-between space-y-3.5 transition shadow-2xl relative ${
                isLowOrOut
                  ? 'alert-mamei-rojo border-2 text-white'
                  : 'border-2 border-slate-800'
              }`}
            >
              <div>
                {/* 1. UBICACIÓN / GÓNDOLA - DESTACADO EN GRANDE */}
                <div className="bg-slate-950/90 border-2 border-cyan-500/60 rounded-2xl p-2.5 flex items-center justify-between mb-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block leading-none">
                        Góndola / Ubicación
                      </span>
                      <span className="text-sm sm:text-base font-black text-cyan-300 font-mono">
                        {p.locationCode || (p.estante ? `Góndola ${p.estante}, Est. ${p.tramo || '01'}` : 'Góndola A - Estante 1')}
                      </span>
                    </div>
                  </div>

                  {isLowOrOut && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white border border-rose-400 animate-bounce shadow-lg">
                      {p.currentStock <= 0 ? '⚠️ AGOTADO' : '⚠️ REPOSICIÓN'}
                    </span>
                  )}
                </div>

                {/* 2. NOMBRE DE LA PIEZA */}
                <h3 className="font-black text-white text-base sm:text-lg leading-snug mb-2">
                  {p.name}
                </h3>

                {/* 3. CÓDIGO DE BARRA + BOTÓN "🖨️ IMPRIMIR CÓDIGO" AL LADO */}
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Código Barra</span>
                    <span className="font-mono text-xs sm:text-sm font-black text-amber-300">
                      {p.barcode || p.sku}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenPrintLabel(p)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Imprimir código de barras"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>🖨️ IMPRIMIR CÓDIGO</span>
                  </button>
                </div>

                {/* Photos Thumbnails Row */}
                <div className="flex items-center gap-2 mb-3">
                  {p.photoFront ? (
                    <img
                      src={p.photoFront}
                      alt="Foto 1"
                      onClick={() => setPreviewImage(p.photoFront || null)}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500/60 cursor-pointer hover:scale-105 transition"
                      title="Toca para ampliar"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold">
                      Sin Foto 1
                    </div>
                  )}

                  {p.photoDetail ? (
                    <img
                      src={p.photoDetail}
                      alt="Foto 2"
                      onClick={() => setPreviewImage(p.photoDetail || null)}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500/60 cursor-pointer hover:scale-105 transition"
                      title="Toca para ampliar"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold">
                      Sin Foto 2
                    </div>
                  )}

                  <div className="flex-1 text-xs">
                    <div className="text-slate-400">Compatibilidad:</div>
                    <div className="font-bold text-amber-400">{p.brandCompatibility || 'Universal'}</div>
                  </div>
                </div>

                {/* 4. CANTIDAD ACTUAL (NÚMERO GRANDE + Y -) */}
                <div className="bg-slate-950 p-3 rounded-2xl border-2 border-slate-800 mb-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 text-center mb-1">
                    CANTIDAD EN EXISTENCIA
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      disabled={quickAdjustingId === p.id}
                      onClick={() => handleQuickAdjust(p, -1)}
                      className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 border-2 border-rose-600/50 flex items-center justify-center text-2xl font-black active:scale-90 transition cursor-pointer"
                      title="Restar 1"
                    >
                      -
                    </button>

                    <div className="px-4 py-1.5 bg-slate-900 border border-emerald-500/50 rounded-xl min-w-[70px] text-center">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                        {p.currentStock}
                      </span>
                    </div>

                    <button
                      disabled={quickAdjustingId === p.id}
                      onClick={() => handleQuickAdjust(p, 1)}
                      className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 border-2 border-emerald-600/50 flex items-center justify-center text-2xl font-black active:scale-90 transition cursor-pointer"
                      title="Sumar 1"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 5. COSTO & 6. PRECIO DE VENTA */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <div className="text-center border-r border-slate-800 pr-2">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">5. COSTO</span>
                    <span className="text-sm font-black text-slate-200">
                      ${p.priceCost ? p.priceCost.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div className="text-center pl-2">
                    <span className="text-[10px] text-emerald-400 block uppercase font-bold">6. PRECIO VENTA</span>
                    <span className="text-sm font-black text-emerald-400">
                      ${p.priceSale ? p.priceSale.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1 active:scale-95 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => handleDeleteWithAuth(p)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1 active:scale-95 transition cursor-pointer"
                  title="Eliminar Repuesto (Clave 1989)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Zoom Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl w-full p-2">
            <img src={previewImage} alt="Vista Ampliada" className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-700" />
            <p className="text-center text-xs text-slate-300 mt-2 font-bold">
              Toca en cualquier lugar para cerrar
            </p>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        locations={locations}
        existingProductCount={products.length}
        onOpenScanner={onOpenScanner}
      />
    </div>
  );
};
