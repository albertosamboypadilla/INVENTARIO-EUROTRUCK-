import React, { useState, useEffect } from 'react';
import { Product, ProductUnit, Location } from '../types';
import { generateNonRepeatingBarcode } from '../utils/barcode';
import {
  X,
  Sparkles,
  Save,
  Barcode,
  Camera,
  Trash2,
  Truck,
  Layers,
  MapPin,
  Plus,
  Minus,
  Edit3
} from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  productToEdit?: Product | null;
  locations: Location[];
  existingProductCount?: number;
  onOpenScanner?: () => void;
  onAddLocation?: (data: Omit<Location, 'id' | 'createdAt'>) => Promise<string>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  locations,
  existingProductCount = 0,
  onOpenScanner,
  onAddLocation
}) => {
  if (!isOpen) return null;

  // 1. Nombre de la Pieza / Repuesto
  const [name, setName] = useState<string>(productToEdit?.name || '');
  const [partBrand, setPartBrand] = useState<string>(productToEdit?.partBrand || '');

  // 2. Modelo de Vehículo y Modelo de Pieza (en blanco por defecto al crear)
  const initialCompat = productToEdit?.brandCompatibility || '';
  const compatParts = initialCompat.split(' / ');
  const [vehicleModel1, setVehicleModel1] = useState<string>(compatParts[0] || '');
  const [vehicleModel2, setVehicleModel2] = useState<string>(compatParts[1] || '');

  // Error de validación de campos obligatorios
  const [validationError, setValidationError] = useState<string>('');

  // Lista dinámica de Góndolas (Piso, Tramo, ej. 1b1, 1b2, 1b3, 1b4, 1C1)
  const initialGondolas = [
    '1b1',
    '1b2',
    '1b3',
    '1b4',
    '1C1',
    '1C2',
    '1C3',
    '2A1',
    '2A2',
    '2B1',
    '3A1',
    '3C1',
    '4A1'
  ];

  const [gondolaList, setGondolaList] = useState<string[]>(() => {
    const locCodes = locations.map((l) => l.code);
    return Array.from(new Set([...locCodes, ...initialGondolas]));
  });

  // Código de Barra único no repetitivo
  const [barcode, setBarcode] = useState<string>(
    productToEdit?.barcode || generateNonRepeatingBarcode()
  );

  const [category, setCategory] = useState<string>(productToEdit?.category || 'Repuestos General');
  const [referenceOEM, setReferenceOEM] = useState<string>(productToEdit?.referenceOEM || '');
  const [unit, setUnit] = useState<ProductUnit>(productToEdit?.unit || 'Unidad');
  const [minStock, setMinStock] = useState<number>(productToEdit?.minStock ?? 3);
  const [currentStock, setCurrentStock] = useState<number>(productToEdit?.currentStock ?? 1);

  // Ubicación Seleccionable + Opción de Agregar / Quitar góndola (ej. 1C1)
  const defaultLocationCode = productToEdit?.locationCode || (gondolaList.length > 0 ? gondolaList[0] : '1C1');
  const [selectedLocation, setSelectedLocation] = useState<string>(defaultLocationCode);
  const [isCustomLocationMode, setIsCustomLocationMode] = useState<boolean>(false);
  const [customLocationText, setCustomLocationText] = useState<string>('');

  const [priceCost, setPriceCost] = useState<number>(productToEdit?.priceCost ?? 0);
  const [priceSale, setPriceSale] = useState<number>(productToEdit?.priceSale ?? 0);
  const [photoFront, setPhotoFront] = useState<string>(productToEdit?.photoFront || '');
  const [photoDetail, setPhotoDetail] = useState<string>(productToEdit?.photoDetail || '');
  const [notes, setNotes] = useState<string>(productToEdit?.notes || '');

  const [saving, setSaving] = useState<boolean>(false);

  // Sync state when productToEdit changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setValidationError('');
      setName(productToEdit?.name || '');
      setPartBrand(productToEdit?.partBrand || '');
      const compat = productToEdit?.brandCompatibility || '';
      const parts = compat.split(' / ');
      setVehicleModel1(parts[0] || '');
      setVehicleModel2(parts[1] || '');
      setBarcode(productToEdit?.barcode || generateNonRepeatingBarcode());
      setCategory(productToEdit?.category || 'Repuestos General');
      setReferenceOEM(productToEdit?.referenceOEM || '');
      setUnit(productToEdit?.unit || 'Unidad');
      setMinStock(productToEdit?.minStock ?? 3);
      setCurrentStock(productToEdit?.currentStock ?? 1);
      
      const locCodes = locations.map((l) => l.code);
      const mergedGondolas = Array.from(new Set([...locCodes, ...initialGondolas]));
      setGondolaList(mergedGondolas);

      const loc = productToEdit?.locationCode || (mergedGondolas.length > 0 ? mergedGondolas[0] : 'Góndola 1');
      setSelectedLocation(loc);
      setIsCustomLocationMode(false);
      setCustomLocationText('');

      setPriceCost(productToEdit?.priceCost ?? 0);
      setPriceSale(productToEdit?.priceSale ?? 0);
      setPhotoFront(productToEdit?.photoFront || '');
      setPhotoDetail(productToEdit?.photoDetail || '');
      setNotes(productToEdit?.notes || '');
    }
  }, [productToEdit, isOpen]);

  // Auto-generar código de barra único y no repetitivo
  const handleGenerateNewUniqueBarcode = () => {
    setBarcode(generateNonRepeatingBarcode());
  };

  const handleAddGondolaToList = (gName: string) => {
    const trimmed = gName.trim();
    if (!trimmed) return;
    if (!gondolaList.includes(trimmed)) {
      setGondolaList((prev) => [...prev, trimmed]);
    }
    setSelectedLocation(trimmed);
    setCustomLocationText('');
    setIsCustomLocationMode(false);
  };

  const handleRemoveGondolaFromList = (gName: string) => {
    setGondolaList((prev) => prev.filter((g) => g !== gName));
    if (selectedLocation === gName) {
      const remaining = gondolaList.filter((g) => g !== gName);
      if (remaining.length > 0) setSelectedLocation(remaining[0]);
    }
  };

  // Helper reader for camera captures & uploads
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('⚠️ OBLIGATORIO: Debe ingresar el Nombre del Artículo para guardar.');
      return;
    }

    const finalBarcode = barcode.trim() || generateNonRepeatingBarcode();
    const finalLocation = isCustomLocationMode
      ? (customLocationText.trim() || '1C1')
      : selectedLocation;

    // If custom location was entered and onAddLocation is available, record it
    if (isCustomLocationMode && customLocationText.trim() && onAddLocation) {
      try {
        await onAddLocation({
          code: customLocationText.trim(),
          aisle: 'Pasillo General',
          gondola: customLocationText.trim(),
          level: 'E-1',
          position: 'P-1',
          description: `Góndola creada desde registro de repuesto`,
          maxCapacity: 100,
          status: 'active'
        });
      } catch (err) {
        console.warn('Could not register new location object:', err);
      }
    }

    // Unir Modelo 1 y Modelo 2 de vehículo / pieza con fallback suave
    const vm1 = vehicleModel1.trim() || 'Universal';
    const vm2 = vehicleModel2.trim() || 'General';
    const finalBrandCompat = `${vm1} / ${vm2}`;

    setSaving(true);
    try {
      await onSave({
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
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Ventana modal ajustada para caber perfectamente en pantallas de celulares y tablets */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-xl w-full p-3.5 sm:p-5 text-slate-100 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto animate-scaleUp">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 sticky top-0 bg-slate-900 z-10 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {productToEdit ? 'Editar Artículo' : '+ AGREGAR ARTÍCULO'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Formulario táctil para teléfono, tablet o PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700 active:scale-95 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* BANNER DE ERROR DE VALIDACIÓN */}
          {validationError && (
            <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-3.5 text-rose-200 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg animate-shake">
              <span className="text-xl">🚨</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. CÓDIGO DE BARRA AUTOMÁTICO Y ÚNICO */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-slate-300" /> CÓDIGO DE BARRA AUTOMÁTICO
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/80">
                Único e irrepetible
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Botón Escanear Cámara */}
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 ESCANEAR</span>
                </button>
              )}

              {/* Botón Nuevo Código Único */}
              <button
                type="button"
                onClick={handleGenerateNewUniqueBarcode}
                className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>⚡ Generar Código Único</span>
              </button>
            </div>

            <input
              type="text"
              required
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-mono font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 2. UBICACIÓN EN GÓNDOLA (PISO / TRAMO - EJEMPLO: 1C1) */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" /> UBICACIÓN EN GÓNDOLA (PISO / TRAMO - EJ: 1C1)
              </label>

              <button
                type="button"
                onClick={() => setIsCustomLocationMode(!isCustomLocationMode)}
                className="text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-blue-400" />
                <span>{isCustomLocationMode ? 'Ver Lista' : '+ Escribir Piso/Tramo'}</span>
              </button>
            </div>

            {/* Accesos rápidos fáciles para Ubicaciones 1b1, 1b2, 1b3, 1b4, 1C1, etc. */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 block">
                  📍 Selecciona Ubicación (Opciones Rápidas):
                </span>
                <div className="flex items-center gap-1">
                  {['1b1', '1b2', '1b3', '1b4'].map((locCode) => (
                    <button
                      key={locCode}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(locCode);
                        setCustomLocationText(locCode);
                        setIsCustomLocationMode(false);
                      }}
                      className={`px-2 py-0.5 text-[11px] font-black rounded-md border transition cursor-pointer ${
                        (!isCustomLocationMode && selectedLocation === locCode) || customLocationText === locCode
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                      }`}
                    >
                      {locCode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                {gondolaList.map((gName) => {
                  const isActive = !isCustomLocationMode ? selectedLocation === gName : customLocationText === gName;
                  return (
                    <div
                      key={gName}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-400 font-black shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLocation(gName);
                          setCustomLocationText(gName);
                          setIsCustomLocationMode(false);
                        }}
                        className="cursor-pointer font-mono font-bold"
                      >
                        📍 {gName}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGondolaFromList(gName);
                        }}
                        title={`Quitar ${gName}`}
                        className="ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950 p-0.5 rounded cursor-pointer transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {!isCustomLocationMode ? (
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-blue-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {gondolaList.map((g, idx) => (
                  <option key={idx} value={g} className="bg-slate-900 text-white font-mono font-bold">
                    📍 {g}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe la ubicación exactas (Ejemplo: 1C1, 2A2, 3B1)"
                  value={customLocationText}
                  onChange={(e) => setCustomLocationText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-blue-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddGondolaToList(customLocationText)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow cursor-pointer shrink-0"
                >
                  + AGREGAR
                </button>
              </div>
            )}
          </div>

          {/* 3. DATOS DEL ARTÍCULO: NOMBRE DE PIEZA, MODELO DE VEHÍCULO Y MODELO DE PIEZA */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-300" /> DATOS DEL ARTÍCULO / PIEZA
            </label>

            {/* A. NOMBRE DE LA PIEZA Y MARCA DE LA PIEZA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre de la Pieza / Repuesto <span className="text-rose-400 font-extrabold">* (OBLIGATORIO)</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Escribe el nombre de la pieza..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-slate-900 text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 ${
                    validationError && !name.trim()
                      ? 'border-2 border-rose-500 focus:ring-rose-500'
                      : 'border border-slate-700 focus:ring-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Marca de la Pieza:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Bosch, Donaldson, OEM..."
                  value={partBrand}
                  onChange={(e) => setPartBrand(e.target.value)}
                  className="w-full bg-slate-900 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-bold border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* B. MODELO DE VEHÍCULO & MODELO DE PIEZA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Modelo de Vehículo <span className="text-rose-400 font-extrabold">* (OBLIGATORIO)</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Escribe el modelo del vehículo..."
                  value={vehicleModel1}
                  onChange={(e) => setVehicleModel1(e.target.value)}
                  className={`w-full bg-slate-900 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 ${
                    validationError && !vehicleModel1.trim()
                      ? 'border-2 border-rose-500 focus:ring-rose-500'
                      : 'border border-slate-700 focus:ring-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Modelo de Pieza <span className="text-rose-400 font-extrabold">* (OBLIGATORIO)</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Escribe el modelo de la pieza..."
                  value={vehicleModel2}
                  onChange={(e) => setVehicleModel2(e.target.value)}
                  className={`w-full bg-slate-900 text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 ${
                    validationError && !vehicleModel2.trim()
                      ? 'border-2 border-rose-500 focus:ring-rose-500'
                      : 'border border-slate-700 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* C. CANTIDAD EN EXISTENCIA CON BOTONES GRANDES + Y - */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 text-center">
                Cantidad en Existencia:
              </label>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStock(Math.max(0, currentStock - 1))}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 border-2 border-rose-600/50 flex items-center justify-center text-2xl font-black active:scale-90 transition cursor-pointer shadow-md"
                  title="Restar 1"
                >
                  <Minus className="w-6 h-6 stroke-[3]" />
                </button>

                <div className="bg-slate-950 border-2 border-emerald-500 rounded-xl px-5 py-1.5 text-center min-w-[90px]">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {currentStock}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStock(currentStock + 1)}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 border-2 border-emerald-600/50 flex items-center justify-center text-2xl font-black active:scale-90 transition cursor-pointer shadow-md"
                  title="Sumar 1"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* D. COSTO, PRECIO VENTA FINAL Y MÍNIMO DE ALERTA DE REPOSICIÓN */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                💰 Precios & Alerta de Reposición
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
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
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-7 pr-3 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">
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
                      className="w-full bg-slate-950 border border-emerald-600/70 text-emerald-300 rounded-xl pl-7 pr-3 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1">
                    Alerta Reposición (Mín):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-amber-600/70 text-amber-300 rounded-xl px-3 py-2 text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. FOTOS DEL PRODUCTO */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <label className="text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" /> FOTOS DEL REPUESTO
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Cuadro Grande: TIRAR FOTO 1 */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-2 flex flex-col items-center justify-center text-center min-h-[110px] relative">
                {photoFront ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-500 bg-slate-950">
                    <img src={photoFront} alt="Foto 1" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoFront('')}
                      className="absolute top-1 right-1 p-1.5 bg-rose-600 text-white rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full min-h-[95px] border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-emerald-950/20 transition p-2">
                    <Camera className="w-7 h-7 text-emerald-400 mb-0.5" />
                    <span className="text-xs font-black text-emerald-300">📷 TIRAR FOTO 1</span>
                    <span className="text-[9px] text-slate-400">Abrir cámara</span>
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

              {/* Cuadro Grande: TIRAR FOTO 2 */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-2 flex flex-col items-center justify-center text-center min-h-[110px] relative">
                {photoDetail ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-blue-500 bg-slate-950">
                    <img src={photoDetail} alt="Foto 2" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoDetail('')}
                      className="absolute top-1 right-1 p-1.5 bg-rose-600 text-white rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full min-h-[95px] border-2 border-dashed border-blue-500/60 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-blue-950/20 transition p-2">
                    <Camera className="w-7 h-7 text-blue-400 mb-0.5" />
                    <span className="text-xs font-black text-blue-300">🔍 TIRAR FOTO 2</span>
                    <span className="text-[9px] text-slate-400">Abrir cámara</span>
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

          {/* 5. BOTÓN FINAL: GUARDA ARTÍCULO */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg border border-blue-400/80 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-6 h-6 stroke-[2.5]" />
              <span>{saving ? 'GUARDANDO...' : '💾 GUARDAR ARTÍCULO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
