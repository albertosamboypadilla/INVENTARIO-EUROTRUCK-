import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductUnit, Location } from '../types';
import { generateNonRepeatingBarcode } from '../utils/barcode';
import {
  CheckCircle2,
  Barcode,
  Camera,
  Search,
  Plus,
  Minus,
  MapPin,
  Sparkles,
  Printer,
  Trash2,
  ArrowLeft,
  Truck,
  RotateCcw,
  Tag,
  AlertTriangle,
  Layers,
  ChevronRight,
  Eye,
  Sliders,
  Check,
  Compass,
  Zap,
  Clock
} from 'lucide-react';

interface InventoryAuditViewProps {
  products: Product[];
  locations: Location[];
  onAddProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onOpenPrintLabel: (product: Product) => void;
  onOpenScanner?: () => void;
  onBackToDashboard?: () => void;
  onViewPhoto?: (product: Product) => void;
}

export const InventoryAuditView: React.FC<InventoryAuditViewProps> = ({
  products,
  locations,
  onAddProduct,
  onUpdateProduct,
  onOpenPrintLabel,
  onOpenScanner,
  onBackToDashboard,
  onViewPhoto,
}) => {
  // Search & Barcode input
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');
  const [listTab, setListTab] = useState<'ALL' | 'REVIEWED' | 'PENDING'>('ALL');

  // Currently Active Item in Counter
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Active form data
  const [countQuantity, setCountQuantity] = useState<number>(1);
  const [locationCode, setLocationCode] = useState<string>('1b1');
  const [newName, setNewName] = useState<string>('');
  const [newBarcode, setNewBarcode] = useState<string>('');
  const [newPriceCost, setNewPriceCost] = useState<number>(0);
  const [newPriceSale, setNewPriceSale] = useState<number>(0);
  const [newBrand, setNewBrand] = useState<string>('');
  const [newOem, setNewOem] = useState<string>('');
  const [showMoreFields, setShowMoreFields] = useState<boolean>(false);

  // Status & notifications
  const [saving, setSaving] = useState<boolean>(false);
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const countInputRef = useRef<HTMLInputElement | null>(null);

  // Reviewed IDs stored locally
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eurotruck_reviewed_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track location audit history to inform operator if item was already counted in another gondola
  const [itemLocationHistory, setItemLocationHistory] = useState<Record<string, { location: string; count: number; timestamp: string }>>(() => {
    try {
      const saved = localStorage.getItem('eurotruck_item_loc_history');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eurotruck_reviewed_product_ids', JSON.stringify(reviewedProductIds));
    } catch (e) {
      console.warn('Could not save reviewed IDs:', e);
    }
  }, [reviewedProductIds]);

  useEffect(() => {
    try {
      localStorage.setItem('eurotruck_item_loc_history', JSON.stringify(itemLocationHistory));
    } catch (e) {
      console.warn('Could not save location history:', e);
    }
  }, [itemLocationHistory]);

  // Active product object
  const activeProduct = products.find((p) => p.id === selectedProductId) || null;

  // Auto-fill active product when selected
  useEffect(() => {
    if (activeProduct && !isCreatingNew) {
      setCountQuantity(activeProduct.currentStock ?? 1);
      setLocationCode(activeProduct.locationCode || '1b1');
      setNewName(activeProduct.name || '');
      setNewBarcode(activeProduct.barcode || '');
      setNewPriceCost(activeProduct.priceCost ?? 0);
      setNewPriceSale(activeProduct.priceSale ?? 0);
      setNewBrand(activeProduct.partBrand || '');
      setNewOem(activeProduct.referenceOEM || '');
      setValidationError('');
    }
  }, [activeProduct, isCreatingNew]);

  // Initial selection
  useEffect(() => {
    if (!selectedProductId && !isCreatingNew && products.length > 0) {
      const firstUnreviewed = products.find((p) => !reviewedProductIds.includes(p.id)) || products[0];
      setSelectedProductId(firstUnreviewed.id);
    }
  }, [products, selectedProductId, isCreatingNew, reviewedProductIds]);

  // Quick gondolas list
  const quickLocations = ['1b1', '1b2', '1b3', '1b4', '1C1', '1C2', '2A1', '2A2', '3A1', '3A2'];

  // Handle Search / Barcode Scan Enter
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query) return;

    // 1. Exact barcode match
    let match = products.find((p) => p.barcode.toLowerCase() === query);
    // 2. Exact name or SKU match
    if (!match) {
      match = products.find((p) => p.name.toLowerCase() === query || p.sku.toLowerCase() === query);
    }
    // 3. Partial barcode or name match
    if (!match) {
      match = products.find(
        (p) => p.barcode.toLowerCase().includes(query) || p.name.toLowerCase().includes(query) || (p.referenceOEM && p.referenceOEM.toLowerCase().includes(query))
      );
    }

    if (match) {
      setSelectedProductId(match.id);
      setIsCreatingNew(false);
      setFlashSuccess(`🎯 Repuesto encontrado: "${match.name}"`);
      setTimeout(() => setFlashSuccess(null), 2500);
      if (countInputRef.current) {
        countInputRef.current.focus();
        countInputRef.current.select();
      }
    } else {
      // Create new prompt
      setIsCreatingNew(true);
      setSelectedProductId('');
      setNewName(searchTerm.trim());
      setNewBarcode(generateNonRepeatingBarcode());
      setCountQuantity(1);
      setLocationCode(selectedLocationFilter !== 'ALL' ? selectedLocationFilter : '1b1');
      setFlashSuccess(`➕ No existe "${searchTerm}". Listo para registrar.`);
      setTimeout(() => setFlashSuccess(null), 3000);
    }
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setSelectedProductId('');
    setNewName('');
    setNewBarcode(generateNonRepeatingBarcode());
    setLocationCode(selectedLocationFilter !== 'ALL' ? selectedLocationFilter : '1b1');
    setCountQuantity(1);
    setNewPriceCost(0);
    setNewPriceSale(0);
    setNewBrand('');
    setNewOem('');
    setShowMoreFields(false);
    setValidationError('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Direct Save and Turn Green
  const handleConfirmCount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError('');

    const targetName = isCreatingNew ? newName.trim() : (activeProduct?.name || newName.trim());
    if (!targetName) {
      setValidationError('⚠️ El nombre del repuesto es obligatorio.');
      return;
    }

    const finalBarcode = (isCreatingNew ? newBarcode : (activeProduct?.barcode || newBarcode)).trim() || generateNonRepeatingBarcode();
    const finalLocation = locationCode.trim() || '1b1';
    const finalCount = Math.max(0, countQuantity);

    setSaving(true);
    try {
      let savedId = selectedProductId;

      if (isCreatingNew || !savedId) {
        savedId = await onAddProduct({
          name: targetName,
          partBrand: newBrand.trim(),
          sku: `SKU-${finalBarcode}`,
          barcode: finalBarcode,
          category: 'Repuestos General',
          brandCompatibility: 'Universal / General',
          referenceOEM: newOem.trim(),
          unit: 'Unidad',
          minStock: 3,
          currentStock: finalCount,
          majorBoxQty: 1,
          warehouseCode: '01',
          estante: finalLocation,
          tramo: '01',
          counterName: 'Operador Eurotruck',
          locationCode: finalLocation,
          priceCost: newPriceCost,
          priceSale: newPriceSale,
          photoFront: '',
          photoDetail: '',
          imageUrl: '',
          notes: '',
        });
        setIsCreatingNew(false);
      } else {
        await onUpdateProduct(savedId, {
          currentStock: finalCount,
          locationCode: finalLocation,
          name: targetName,
          barcode: finalBarcode,
          ...(newPriceCost > 0 ? { priceCost: newPriceCost } : {}),
          ...(newPriceSale > 0 ? { priceSale: newPriceSale } : {}),
          ...(newBrand ? { partBrand: newBrand } : {}),
          ...(newOem ? { referenceOEM: newOem } : {}),
        });
      }

      // Mark in GREEN
      if (!reviewedProductIds.includes(savedId)) {
        setReviewedProductIds((prev) => [savedId, ...prev]);
      }

      // Record location audit history
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setItemLocationHistory((prev) => ({
        ...prev,
        [finalBarcode]: { location: finalLocation, count: finalCount, timestamp: nowStr },
      }));

      // Flash Success Banner
      setFlashSuccess(`✅ ¡"${targetName}" marcado en VERDE con ${finalCount} unidades en Góndola ${finalLocation}!`);
      setTimeout(() => setFlashSuccess(null), 3500);

      // Auto Advance to Next Unreviewed item
      const nextPending = products.filter(
        (p) => p.id !== savedId && !reviewedProductIds.includes(p.id) && (selectedLocationFilter === 'ALL' || p.locationCode === selectedLocationFilter)
      );

      if (nextPending.length > 0) {
        setSelectedProductId(nextPending[0].id);
      } else {
        const anyPending = products.filter((p) => p.id !== savedId && !reviewedProductIds.includes(p.id));
        if (anyPending.length > 0) {
          setSelectedProductId(anyPending[0].id);
        }
      }

      setSearchTerm('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } catch (err) {
      console.error('Error saving count:', err);
      setValidationError('Error al guardar el conteo del inventario.');
    } finally {
      setSaving(false);
    }
  };

  // Quick instant stock adjustment from list
  const handleQuickRowStock = async (product: Product, newStock: number) => {
    try {
      const stock = Math.max(0, newStock);
      await onUpdateProduct(product.id, { currentStock: stock });
      if (!reviewedProductIds.includes(product.id)) {
        setReviewedProductIds((prev) => [product.id, ...prev]);
      }
      setFlashSuccess(`✅ "${product.name}" actualizado a ${stock} u. y puesto en VERDE.`);
      setTimeout(() => setFlashSuccess(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearReviewed = () => {
    if (confirm('¿Deseas reiniciar todos los artículos en verde para comenzar un nuevo conteo desde cero?')) {
      setReviewedProductIds([]);
      setItemLocationHistory({});
    }
  };

  // Filtered Products for List
  const filteredProducts = products.filter((p) => {
    const isRev = reviewedProductIds.includes(p.id);
    if (listTab === 'REVIEWED' && !isRev) return false;
    if (listTab === 'PENDING' && isRev) return false;

    if (selectedLocationFilter !== 'ALL' && p.locationCode !== selectedLocationFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.locationCode.toLowerCase().includes(q) ||
        (p.referenceOEM && p.referenceOEM.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const totalCount = products.length;
  const totalReviewed = products.filter((p) => reviewedProductIds.includes(p.id)).length;
  const totalPending = totalCount - totalReviewed;
  const progressPercent = totalCount > 0 ? Math.round((totalReviewed / totalCount) * 100) : 0;

  const currentItemBarcode = isCreatingNew ? newBarcode : (activeProduct?.barcode || '');
  const previousAuditForThisItem = currentItemBarcode ? itemLocationHistory[currentItemBarcode] : null;

  return (
    <div className="space-y-4 animate-fadeIn pb-14">
      {/* 🟢 TOP HEADER BAR */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl text-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-bold text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
              <span>← Menú Principal</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight flex items-center gap-2">
                <span>Conteo e Inventario Rápido</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                  Paso 1-2-3
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escanea o busca el repuesto, escribe cuántos hay y listo: <strong className="text-emerald-400">se pone en verde de inmediato</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleStartNew}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs rounded-xl shadow-md border border-zinc-300 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Registrar Nuevo</span>
          </button>

          {reviewedProductIds.length > 0 && (
            <button
              onClick={handleClearReviewed}
              className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-bold text-xs rounded-xl active:scale-95 transition flex items-center gap-1 cursor-pointer"
              title="Reiniciar lista en verde"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          )}
        </div>
      </div>

      {/* 📊 PROGRESS BAR (COMPLETED IN GREEN) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold mb-2">
          <span className="text-zinc-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Progreso del Conteo Físico:
          </span>
          <div className="flex items-center gap-3 text-zinc-400 flex-wrap">
            <span>Total: <strong className="text-white font-mono">{totalCount}</strong></span>
            <span>Pendientes: <strong className="text-amber-400 font-mono">{totalPending}</strong></span>
            <span className="text-emerald-400 font-black">
              ✅ Contados (En Verde): <strong className="font-mono">{totalReviewed} ({progressPercent}%)</strong>
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 🔔 SUCCESS BANNER FLASH */}
      {flashSuccess && (
        <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl p-3.5 text-emerald-200 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{flashSuccess}</span>
        </div>
      )}

      {/* 🔍 PASO 1: BARRA DE BÚSQUEDA / ESCANEO GIGANTE */}
      <div className="bg-zinc-900 border-2 border-zinc-700/80 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-950 font-black text-xs flex items-center justify-center">1</span>
            <span>ESCANEAR CÓDIGO O BUSCAR REPUESTO</span>
          </label>
          <span className="text-[11px] text-zinc-400 font-mono">
            Presiona <kbd className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-700 rounded text-white">Enter</kbd> para seleccionar
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Barcode className="w-6 h-6 absolute left-3.5 top-3 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Pasa el lector de código de barras o escribe el nombre / código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border-2 border-zinc-700 text-white rounded-2xl pl-12 pr-4 py-3 text-sm sm:text-base font-bold placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white text-xs font-bold bg-zinc-800 px-2 py-0.5 rounded cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs sm:text-sm rounded-2xl shadow border border-zinc-300 transition active:scale-95 cursor-pointer shrink-0"
          >
            Buscar
          </button>

          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs sm:text-sm rounded-2xl transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Abrir cámara del celular para escanear"
            >
              <Camera className="w-5 h-5 text-emerald-400" />
              <span className="hidden sm:inline">Cámara</span>
            </button>
          )}
        </form>
      </div>

      {/* 📦 PASO 2 Y 3: TARJETA PRINCIPAL DE CONTEO Y CONFIRMACIÓN */}
      <div className={`bg-zinc-900 border-2 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 transition ${
        reviewedProductIds.includes(selectedProductId)
          ? 'border-emerald-600/90 shadow-emerald-950/30'
          : 'border-zinc-700'
      }`}>
        {/* Header of Active Item */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                {isCreatingNew ? 'NUEVO ARTÍCULO' : 'ARTÍCULO SELECCIONADO PARA CONTEO'}
              </span>
              <h3 className="text-base sm:text-xl font-black text-white leading-tight">
                {isCreatingNew ? (newName || 'Ingresa el nombre del repuesto') : (activeProduct?.name || 'Selecciona un artículo')}
              </h3>
              {!isCreatingNew && activeProduct && (
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5 flex-wrap">
                  <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">
                    COD: {activeProduct.barcode}
                  </span>
                  {activeProduct.referenceOEM && (
                    <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                      OEM: {activeProduct.referenceOEM}
                    </span>
                  )}
                  {activeProduct.partBrand && (
                    <span className="text-zinc-300 font-bold">
                      🏷️ {activeProduct.partBrand}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Green Status Badge */}
          {selectedProductId && reviewedProductIds.includes(selectedProductId) && (
            <span className="px-3.5 py-1.5 bg-emerald-950 text-emerald-300 border-2 border-emerald-500 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm self-start sm:self-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>✅ YA CONTADO EN VERDE</span>
            </span>
          )}
        </div>

        {/* Previous audit warning */}
        {previousAuditForThisItem && previousAuditForThisItem.location !== locationCode && (
          <div className="bg-amber-950/40 border border-amber-600/70 rounded-2xl p-3 text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Aviso: Este repuesto fue contado previamente en la <strong className="text-white bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">Góndola {previousAuditForThisItem.location}</strong> ({previousAuditForThisItem.count} u.).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLocationCode(previousAuditForThisItem.location)}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold rounded-lg border border-zinc-700 cursor-pointer shrink-0"
            >
              Usar {previousAuditForThisItem.location}
            </button>
          </div>
        )}

        <form onSubmit={handleConfirmCount} className="space-y-4">
          {validationError && (
            <div className="bg-rose-950/90 border-2 border-rose-600 rounded-2xl p-3 text-rose-200 text-xs font-black flex items-center gap-2 shadow">
              <span>🚨 {validationError}</span>
            </div>
          )}

          {/* If creating new, show name & barcode inputs */}
          {isCreatingNew && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nombre del Repuesto <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pastilla de Freno, Filtro de Aire..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-300">Código de Barra:</label>
                  <button
                    type="button"
                    onClick={() => setNewBarcode(generateNonRepeatingBarcode())}
                    className="text-[10px] text-zinc-400 hover:text-white underline font-bold cursor-pointer"
                  >
                    Generar Nuevo
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          )}

          {/* GÓNDOLA / UBICACIÓN (SELECCIÓN RÁPIDA CON 1 TOQUE) */}
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" /> UBICACIÓN / GÓNDOLA DONDE ESTÁ:
              </label>
              <span className="text-xs font-bold text-white font-mono bg-zinc-900 px-2.5 py-0.5 rounded-xl border border-zinc-700">
                {locationCode}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {quickLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocationCode(loc)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    locationCode === loc
                      ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300 shadow-md ring-2 ring-emerald-400'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  📍 {loc}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              placeholder="O escribe otra ubicación manual..."
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* CANTIDAD CONTADA (ENORME Y SÚPER FÁCIL) */}
          <div className="bg-zinc-950 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <label className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center">3</span>
                <span>¿CUÁNTAS UNIDADES HAY EN TOTAL?</span>
              </label>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Escribe o usa los botones para colocar la cantidad física real.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCountQuantity(Math.max(0, countQuantity - 1))}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-2 border-zinc-700 flex items-center justify-center text-3xl font-black active:scale-90 transition cursor-pointer shadow-md"
                title="Restar 1"
              >
                <Minus className="w-7 h-7 stroke-[3]" />
              </button>

              <input
                ref={countInputRef}
                type="number"
                min="0"
                value={countQuantity}
                onChange={(e) => setCountQuantity(parseInt(e.target.value) || 0)}
                className="w-28 sm:w-32 bg-zinc-900 border-2 border-emerald-500 text-center text-white font-mono font-black text-3xl sm:text-4xl py-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-400/40 shadow-inner"
              />

              <button
                type="button"
                onClick={() => setCountQuantity(countQuantity + 1)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-2 border-zinc-700 flex items-center justify-center text-3xl font-black active:scale-90 transition cursor-pointer shadow-md"
                title="Sumar 1"
              >
                <Plus className="w-7 h-7 stroke-[3]" />
              </button>
            </div>

            {/* Quick Increment buttons */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {[1, 5, 10, 20, 50].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setCountQuantity((prev) => prev + inc)}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-black rounded-xl border border-zinc-700 active:scale-95 transition cursor-pointer shadow-sm"
                >
                  +{inc}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCountQuantity(0)}
                className="px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-black rounded-xl border border-rose-800 active:scale-95 transition cursor-pointer"
                title="Poner en 0 (Agotado)"
              >
                0 u.
              </button>
            </div>
          </div>

          {/* Opcional: Modificar precios o datos adicionales */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreFields(!showMoreFields)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showMoreFields ? 'Ocultar campos adicionales' : '+ Precios y Datos Adicionales (Opcional)'}</span>
            </button>
          </div>

          {showMoreFields && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Costo Compra ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPriceCost === 0 ? '' : newPriceCost}
                  onChange={(e) => setNewPriceCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Precio Venta ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPriceSale === 0 ? '' : newPriceSale}
                  onChange={(e) => setNewPriceSale(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Marca:</label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Bosch, OEM..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">OEM / Ref:</label>
                <input
                  type="text"
                  value={newOem}
                  onChange={(e) => setNewOem(e.target.value)}
                  placeholder="Ref..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
          )}

          {/* BOTÓN GIGANTE DE CONFIRMACIÓN */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              <span>
                {saving
                  ? 'GUARDANDO...'
                  : `✅ CONFIRMAR ${countQuantity} UNIDADES Y PONER EN VERDE`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* 📋 LISTA DE REPUESTOS CON TABS: TODOS | ✅ YA EN VERDE | ⏳ PENDIENTES */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          {/* List Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setListTab('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                listTab === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Todos ({products.length})
            </button>

            <button
              type="button"
              onClick={() => setListTab('REVIEWED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                listTab === 'REVIEWED'
                  ? 'bg-emerald-400 text-zinc-950 font-black border-emerald-300 shadow-sm'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✅ Contados en Verde ({totalReviewed})</span>
            </button>

            <button
              type="button"
              onClick={() => setListTab('PENDING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                listTab === 'PENDING'
                  ? 'bg-amber-400 text-zinc-950 font-black border-amber-300 shadow-sm'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏳ Pendientes ({totalPending})</span>
            </button>
          </div>

          {/* Filter by Gondola */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-zinc-400 uppercase shrink-0">Góndola:</span>
            <button
              type="button"
              onClick={() => setSelectedLocationFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition cursor-pointer shrink-0 ${
                selectedLocationFilter === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              Todas
            </button>
            {quickLocations.slice(0, 6).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocationFilter(loc)}
                className={`px-2 py-1 text-xs font-bold rounded-xl border transition cursor-pointer shrink-0 ${
                  selectedLocationFilter === loc
                    ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                📍 {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 px-4 bg-zinc-950 rounded-2xl border border-dashed border-zinc-800 text-zinc-400 space-y-1.5">
            <CheckCircle2 className="w-10 h-10 mx-auto text-zinc-600" />
            <p className="text-xs font-bold text-zinc-300">No hay repuestos en este filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const isReviewed = reviewedProductIds.includes(p.id);
              const isSelected = selectedProductId === p.id && !isCreatingNew;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-3.5 border-2 transition flex flex-col justify-between gap-2.5 shadow-md ${
                    isReviewed
                      ? 'bg-emerald-950/40 border-emerald-500/80'
                      : isSelected
                      ? 'bg-zinc-950 border-zinc-300 ring-2 ring-zinc-400'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setIsCreatingNew(false);
                      }}
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                    >
                      {p.imageUrl || p.photoFront ? (
                        <img
                          src={p.imageUrl || p.photoFront}
                          alt={p.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewPhoto) onViewPhoto(p);
                          }}
                          className="w-11 h-11 rounded-xl object-cover border border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-[9px] shrink-0">
                          SIN FOTO
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h4 className="font-black text-white text-xs truncate leading-tight">
                            {p.name}
                          </h4>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                          COD: {p.barcode}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-300 mt-0.5">
                          📍 Góndola: <strong className="text-white bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">{p.locationCode}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Badge */}
                    {isReviewed ? (
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 rounded-lg text-[10px] font-black shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>VERDE</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-lg text-[10px] font-bold shrink-0">
                        Pendiente
                      </span>
                    )}
                  </div>

                  {/* Stock counter bar inside card */}
                  <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Stock:</span>
                      <span className={`text-sm font-black font-mono ${isReviewed ? 'text-emerald-400' : 'text-white'}`}>
                        {p.currentStock} u.
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickRowStock(p, p.currentStock - 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xs font-black cursor-pointer"
                        title="Restar 1"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRowStock(p, p.currentStock + 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xs font-black cursor-pointer"
                        title="Sumar 1"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setIsCreatingNew(false);
                          if (countInputRef.current) {
                            countInputRef.current.focus();
                            countInputRef.current.select();
                          }
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg border border-zinc-700 cursor-pointer ml-1"
                      >
                        Contar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
