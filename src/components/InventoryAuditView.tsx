import React, { useState, useEffect } from 'react';
import { Product, ProductUnit, Location } from '../types';
import { generateNonRepeatingBarcode } from '../utils/barcode';
import {
  CheckCircle2,
  Barcode,
  Camera,
  Search,
  Plus,
  Minus,
  Save,
  MapPin,
  Sparkles,
  Printer,
  Trash2,
  ArrowLeft,
  Truck,
  Layers,
  Filter,
  RotateCcw,
  Tag,
  Check
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
  onViewPhoto
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Mode: 'existing' or 'new'
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Active form state for reviewing/editing an item
  const [name, setName] = useState<string>('');
  const [partBrand, setPartBrand] = useState<string>('');
  const [vehicleModel1, setVehicleModel1] = useState<string>('');
  const [vehicleModel2, setVehicleModel2] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [category, setCategory] = useState<string>('Repuestos General');
  const [referenceOEM, setReferenceOEM] = useState<string>('');
  const [unit, setUnit] = useState<ProductUnit>('Unidad');
  const [minStock, setMinStock] = useState<number>(3);
  const [currentStock, setCurrentStock] = useState<number>(1);
  const [selectedLocation, setSelectedLocation] = useState<string>('1b1');
  const [priceCost, setPriceCost] = useState<number>(0);
  const [priceSale, setPriceSale] = useState<number>(0);
  const [photoFront, setPhotoFront] = useState<string>('');
  const [photoDetail, setPhotoDetail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [notification, setNotification] = useState<string>('');

  // Local state for items reviewed in green
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eurotruck_reviewed_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save reviewed IDs to localStorage so state persists during the session
  useEffect(() => {
    try {
      localStorage.setItem('eurotruck_reviewed_product_ids', JSON.stringify(reviewedProductIds));
    } catch (e) {
      console.warn('Could not save reviewed IDs:', e);
    }
  }, [reviewedProductIds]);

  // When selected product changes or tab opens, load product data into active form
  const activeProduct = products.find((p) => p.id === selectedProductId) || null;

  useEffect(() => {
    if (activeProduct && !isCreatingNew) {
      setName(activeProduct.name || '');
      setPartBrand(activeProduct.partBrand || '');
      const parts = (activeProduct.brandCompatibility || '').split(' / ');
      setVehicleModel1(parts[0] || '');
      setVehicleModel2(parts[1] || '');
      setBarcode(activeProduct.barcode || generateNonRepeatingBarcode());
      setCategory(activeProduct.category || 'Repuestos General');
      setReferenceOEM(activeProduct.referenceOEM || '');
      setUnit(activeProduct.unit || 'Unidad');
      setMinStock(activeProduct.minStock ?? 3);
      setCurrentStock(activeProduct.currentStock ?? 1);
      setSelectedLocation(activeProduct.locationCode || '1b1');
      setPriceCost(activeProduct.priceCost ?? 0);
      setPriceSale(activeProduct.priceSale ?? 0);
      setPhotoFront(activeProduct.photoFront || '');
      setPhotoDetail(activeProduct.photoDetail || '');
      setNotes(activeProduct.notes || '');
      setValidationError('');
    }
  }, [activeProduct, isCreatingNew]);

  const handleSelectProduct = (product: Product) => {
    setIsCreatingNew(false);
    setSelectedProductId(product.id);
  };

  const handleStartNewProduct = () => {
    setIsCreatingNew(true);
    setSelectedProductId('');
    setName('');
    setPartBrand('');
    setVehicleModel1('Universal');
    setVehicleModel2('General');
    setBarcode(generateNonRepeatingBarcode());
    setCategory('Repuestos General');
    setReferenceOEM('');
    setUnit('Unidad');
    setMinStock(3);
    setCurrentStock(1);
    setSelectedLocation('1b1');
    setPriceCost(0);
    setPriceSale(0);
    setPhotoFront('');
    setPhotoDetail('');
    setNotes('');
    setValidationError('');
  };

  const handleGenerateBarcode = () => {
    setBarcode(generateNonRepeatingBarcode());
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setPhotoState: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) setPhotoState(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit & Mark as Reviewed in Green
  const handleSaveAndMarkReviewed = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('⚠️ OBLIGATORIO: Debe ingresar el Nombre del Artículo.');
      return;
    }

    const finalBarcode = barcode.trim() || generateNonRepeatingBarcode();
    const finalLocation = selectedLocation.trim() || '1b1';
    const vm1 = vehicleModel1.trim() || 'Universal';
    const vm2 = vehicleModel2.trim() || 'General';
    const finalBrandCompat = `${vm1} / ${vm2}`;

    setSaving(true);
    try {
      let productId = selectedProductId;

      if (isCreatingNew || !productId) {
        // Create new item
        productId = await onAddProduct({
          name: name.trim(),
          partBrand: partBrand.trim(),
          sku: `SKU-${finalBarcode}`,
          barcode: finalBarcode,
          category: category.trim(),
          brandCompatibility: finalBrandCompat,
          referenceOEM: referenceOEM.trim(),
          unit,
          minStock,
          currentStock,
          majorBoxQty: 1,
          warehouseCode: '01',
          estante: finalLocation,
          tramo: '01',
          counterName: 'Operador Eurotruck',
          locationCode: finalLocation,
          priceCost,
          priceSale,
          photoFront,
          photoDetail,
          imageUrl: photoFront || photoDetail || '',
          notes: notes.trim(),
        });
        setIsCreatingNew(false);
      } else {
        // Update existing item
        await onUpdateProduct(productId, {
          name: name.trim(),
          partBrand: partBrand.trim(),
          barcode: finalBarcode,
          category: category.trim(),
          brandCompatibility: finalBrandCompat,
          referenceOEM: referenceOEM.trim(),
          unit,
          minStock,
          currentStock,
          locationCode: finalLocation,
          priceCost,
          priceSale,
          photoFront,
          photoDetail,
          imageUrl: photoFront || photoDetail || '',
          notes: notes.trim(),
        });
      }

      // Add to reviewed list (place below in GREEN)
      if (!reviewedProductIds.includes(productId)) {
        setReviewedProductIds((prev) => [productId, ...prev]);
      }

      setNotification(`✅ "${name}" guardado y colocado debajo en VERDE como REVISADO.`);
      setTimeout(() => setNotification(''), 4000);

      // Reset or select next
      const remainingUnreviewed = products.filter((p) => p.id !== productId && !reviewedProductIds.includes(p.id));
      if (remainingUnreviewed.length > 0) {
        setSelectedProductId(remainingUnreviewed[0].id);
      }
    } catch (err) {
      console.error('Error saving reviewed product:', err);
      setValidationError('Error al guardar el artículo revisado.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromReviewed = (id: string) => {
    setReviewedProductIds((prev) => prev.filter((pId) => pId !== id));
  };

  const handleClearAllReviewed = () => {
    if (confirm('¿Desea reiniciar la lista de artículos revisados en verde?')) {
      setReviewedProductIds([]);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.locationCode.toLowerCase().includes(q) ||
      (p.referenceOEM && p.referenceOEM.toLowerCase().includes(q))
    );
  });

  const reviewedProductsList = products.filter((p) => reviewedProductIds.includes(p.id));
  const pendingProductsList = products.filter((p) => !reviewedProductIds.includes(p.id));

  const totalReviewedCount = reviewedProductsList.length;
  const totalCount = products.length;
  const progressPercent = totalCount > 0 ? Math.round((totalReviewedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 rounded-xl font-black text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md print:hidden"
            >
              <ArrowLeft className="w-4 h-4 text-blue-300" />
              <span>← Atrás</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black text-white">
                  Ventana de Conteo y Revisión de Inventario
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                  Poder Completo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Revisa, asigna precios, códigos de barra y foto a cada artículo. Se irán colocando <strong className="text-emerald-400">debajo en verde</strong> al confirmar.
              </p>
            </div>
          </div>
        </div>

        {/* Action Top Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartNewProduct}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg border border-blue-400/60 active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Agregar Nuevo Artículo</span>
          </button>

          {reviewedProductIds.length > 0 && (
            <button
              onClick={handleClearAllReviewed}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-2xl active:scale-95 transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Reiniciar lista de marcados en verde"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Limpiar Verificados</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Progress Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold mb-2">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Progreso del Conteo Físico:
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Total Catálogo: <strong className="text-white">{totalCount}</strong></span>
            <span>Pendientes: <strong className="text-amber-400">{pendingProductsList.length}</strong></span>
            <span className="text-emerald-400 font-extrabold">
              Revisados (Verde): <strong>{totalReviewedCount} ({progressPercent}%)</strong>
            </span>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 rounded-full shadow-lg shadow-emerald-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div className="bg-emerald-950 border-2 border-emerald-500 rounded-2xl p-4 text-emerald-200 text-sm font-black flex items-center gap-2 shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* SECTION 1: SEARCH & ITEM SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400" />
            1. Seleccionar o Buscar Repuesto a Revisar:
          </label>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Escribe para filtrar repuestos por nombre, código o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Horizontal Quick Picker Cards */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={handleStartNewProduct}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black shrink-0 transition border flex items-center gap-1.5 cursor-pointer ${
              isCreatingNew
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg'
                : 'bg-slate-950 text-blue-300 border-blue-900/60 hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>+ Crear Nuevo Artículo</span>
          </button>

          {filteredProducts.slice(0, 20).map((prod) => {
            const isReviewed = reviewedProductIds.includes(prod.id);
            const isSelected = selectedProductId === prod.id && !isCreatingNew;

            return (
              <button
                key={prod.id}
                onClick={() => handleSelectProduct(prod)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold shrink-0 transition border text-left flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-300 shadow-md font-black'
                    : isReviewed
                    ? 'bg-emerald-950/80 text-emerald-200 border-emerald-600/60 hover:bg-emerald-900/80'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isReviewed && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />}
                <div className="truncate max-w-[140px]">
                  <div className="font-bold truncate">{prod.name}</div>
                  <div className="text-[10px] opacity-80 font-mono">📍 {prod.locationCode} • {prod.currentStock} u.</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: FORMULARIO DE EDICIÓN Y REVISIÓN CON TODAS LAS OPCIONES */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isCreatingNew
                  ? '➕ Creando Nuevo Artículo desde Revisión'
                  : activeProduct
                  ? `✏️ Revisando / Editando: "${activeProduct.name}"`
                  : 'Seleccione un Artículo para Revisar'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Ajusta montos, fotos, códigos de barra y ubicación. Luego presiona "Guardar y Marcar como Revisado".
              </p>
            </div>
          </div>

          {reviewedProductIds.includes(selectedProductId) && (
            <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500 rounded-full text-xs font-black flex items-center gap-1 shadow animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>REVISADO Y EN VERDE</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveAndMarkReviewed} className="space-y-4">
          {validationError && (
            <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-3 text-rose-200 text-xs font-black flex items-center gap-2 shadow-lg">
              <span>🚨 {validationError}</span>
            </div>
          )}

          {/* Barcode & Escáner */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-blue-400" /> CÓDIGO DE BARRA
              </label>

              <div className="flex items-center gap-2">
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow active:scale-95 transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Escanear Cámara</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl active:scale-95 transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Colocar Código Único</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              required
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Asigna un código de barras..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nombre y Marca Repuesto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nombre del Repuesto <span className="text-rose-400 font-extrabold">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="Nombre o descripción corta..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Marca de la Pieza / Fabricante:
              </label>
              <input
                type="text"
                placeholder="Bosch, Donaldson, OEM..."
                value={partBrand}
                onChange={(e) => setPartBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Modelos Vehículo & Pieza */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Modelo de Vehículo:
              </label>
              <input
                type="text"
                placeholder="Volvo FH, Scania R, Freightliner..."
                value={vehicleModel1}
                onChange={(e) => setVehicleModel1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Modelo de Pieza / Referencia OEM:
              </label>
              <input
                type="text"
                placeholder="OEM Ref. / Modelo..."
                value={referenceOEM}
                onChange={(e) => setReferenceOEM(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Ubicación con Accesos Rápidos (1b1, 1b2, 1b3, 1b4) */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" /> UBICACIÓN / GÓNDOLA (1b1, 1b2, 1b3, 1b4...)
              </label>
            </div>

            {/* Direct Quick Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['1b1', '1b2', '1b3', '1b4', '1C1', '1C2', '2A1', '2A2', '3A1'].map((locCode) => (
                <button
                  key={locCode}
                  type="button"
                  onClick={() => setSelectedLocation(locCode)}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl border transition cursor-pointer ${
                    selectedLocation === locCode
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md scale-105'
                      : 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  📍 {locCode}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              placeholder="O escribe ubicación personal..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CANTIDAD CONTADA + PRECIOS + ALERTA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Cantidad Física Contada */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/60 flex flex-col items-center justify-between text-center">
              <label className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">
                Cantidad Contada:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStock(Math.max(0, currentStock - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 border border-rose-600/50 flex items-center justify-center text-xl font-black active:scale-90 transition cursor-pointer"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>

                <input
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                  className="w-20 bg-slate-900 border-2 border-emerald-500 text-center text-emerald-400 font-mono font-black text-2xl py-1 rounded-xl focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setCurrentStock(currentStock + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 border border-emerald-600/50 flex items-center justify-center text-xl font-black active:scale-90 transition cursor-pointer"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Monto Costo ($) */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Monto Costo ($):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={priceCost === 0 ? '' : priceCost}
                  onChange={(e) => setPriceCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-7 pr-3 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Monto Precio Venta ($) */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/60">
              <label className="block text-xs font-bold text-emerald-400 mb-1">
                Precio Venta Final ($):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-emerald-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={priceSale === 0 ? '' : priceSale}
                  onChange={(e) => setPriceSale(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-emerald-600/70 text-emerald-300 rounded-xl pl-7 pr-3 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* FOTOS DEL PRODUCTO (FOTO 1 Y FOTO 2) */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" /> FOTOS DEL REPUESTO (FOTO 1 Y FOTO 2)
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Foto 1 */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-2 flex flex-col items-center justify-center text-center min-h-[100px] relative">
                {photoFront ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-500 bg-slate-950">
                    <img src={photoFront} alt="Foto 1" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoFront('')}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full min-h-[85px] border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-emerald-950/20 transition p-2">
                    <Camera className="w-6 h-6 text-emerald-400 mb-0.5" />
                    <span className="text-xs font-black text-emerald-300">📷 TIRAR FOTO 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, setPhotoFront)}
                    />
                  </label>
                )}
              </div>

              {/* Foto 2 */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-2 flex flex-col items-center justify-center text-center min-h-[100px] relative">
                {photoDetail ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-blue-500 bg-slate-950">
                    <img src={photoDetail} alt="Foto 2" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoDetail('')}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full min-h-[85px] border-2 border-dashed border-blue-500/60 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-blue-950/20 transition p-2">
                    <Camera className="w-6 h-6 text-blue-400 mb-0.5" />
                    <span className="text-xs font-black text-blue-300">🔍 TIRAR FOTO 2</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, setPhotoDetail)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL: GUARDAR Y COLOCAR DEBAJO EN VERDE */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-600/30 active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              <span>{saving ? 'GUARDANDO...' : '✅ GUARDAR Y COLOCAR DEBAJO EN VERDE'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: LISTA DE ARTÍCULOS REVISADOS EN VERDE (DEBAJO) */}
      <div className="bg-emerald-950/80 border-2 border-emerald-500/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-md">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-emerald-200">
                Artículos Revisados y Confirmados (Lista en Verde)
              </h3>
              <p className="text-xs text-emerald-300/80">
                Total en Verde: <strong>{reviewedProductsList.length} repuestos verificados</strong>
              </p>
            </div>
          </div>

          {reviewedProductsList.length > 0 && (
            <span className="px-3 py-1 bg-emerald-900/90 text-emerald-200 font-extrabold text-xs rounded-xl border border-emerald-600">
              ✅ Verificación en Tiempo Real
            </span>
          )}
        </div>

        {reviewedProductsList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-emerald-950/40 rounded-2xl border border-dashed border-emerald-700/60 text-emerald-300 space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-60" />
            <p className="text-sm font-extrabold">Aún no hay artículos colocados en verde debajo.</p>
            <p className="text-xs text-emerald-400/80">
              Completa la revisión de un repuesto arriba y presiona "Guardar y Colocar Debajo en Verde".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {reviewedProductsList.map((product) => (
              <div
                key={product.id}
                className="bg-emerald-950/90 border-2 border-emerald-500 text-emerald-100 rounded-2xl p-4 shadow-lg hover:shadow-emerald-500/20 transition flex flex-col justify-between gap-3 relative group"
              >
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {product.imageUrl || product.photoFront ? (
                      <img
                        src={product.imageUrl || product.photoFront}
                        alt={product.name}
                        onClick={() => onViewPhoto && onViewPhoto(product)}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shrink-0 cursor-pointer hover:opacity-90"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-900 border border-emerald-600 flex items-center justify-center text-emerald-300 font-black text-xs shrink-0">
                        SIN FOTO
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-black text-white text-sm truncate uppercase leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-[11px] font-mono text-emerald-300 truncate">
                        🏷️ {product.barcode}
                      </p>
                      <p className="text-[10px] font-bold text-amber-300">
                        📍 Ubicación: <strong className="text-white bg-emerald-900 px-1.5 py-0.5 rounded border border-emerald-700">{product.locationCode}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFromReviewed(product.id)}
                    className="p-1 text-emerald-400 hover:text-rose-300 hover:bg-rose-950/80 rounded-lg transition cursor-pointer"
                    title="Quitar de verificados en verde"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock & Prices Row */}
                <div className="grid grid-cols-3 gap-1.5 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/80 text-center text-xs font-bold">
                  <div>
                    <span className="text-[9px] text-emerald-300 block uppercase">Stock</span>
                    <span className="text-sm font-black text-white font-mono">{product.currentStock} u.</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-300 block uppercase">Costo</span>
                    <span className="text-xs font-extrabold text-emerald-200 font-mono">${product.priceCost.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-300 block uppercase">Precio</span>
                    <span className="text-xs font-black text-white font-mono">${product.priceSale.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-800">
                  <span className="text-[10px] font-extrabold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    REVISADO ✅
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenPrintLabel(product)}
                      className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition flex items-center gap-1 cursor-pointer border border-emerald-600"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Etiqueta</span>
                    </button>

                    <button
                      onClick={() => handleSelectProduct(product)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-extrabold transition cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
