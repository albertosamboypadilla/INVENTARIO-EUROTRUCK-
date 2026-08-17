import React, { useEffect, useRef, useState } from 'react';
import { Product, ThermalSize } from '../types';
import { renderBarcodeToCanvas } from '../utils/barcode';
import {
  Printer,
  Settings,
  Tag,
  Eye,
  MapPin,
  Sparkles,
  Truck,
  CheckCircle2,
  Sliders,
  ArrowLeft
} from 'lucide-react';

interface ThermalPrinterViewProps {
  products: Product[];
  initialSelectedProduct?: Product | null;
  onBackToDashboard?: () => void;
}

export const ThermalPrinterView: React.FC<ThermalPrinterViewProps> = ({
  products,
  initialSelectedProduct,
  onBackToDashboard,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialSelectedProduct?.id || (products.length > 0 ? products[0].id : '')
  );
  const [copies, setCopies] = useState<number>(1);
  // Default to "larguita" as explicitly requested by user
  const [labelSize, setLabelSize] = useState<ThermalSize>('larguita');
  
  // Customization fields (que se puede poner y que no)
  const [showName, setShowName] = useState<boolean>(true);
  const [showBrandCompatibility, setShowBrandCompatibility] = useState<boolean>(true);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showLocation, setShowLocation] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showCost, setShowCost] = useState<boolean>(false);
  const [customFooterText, setCustomFooterText] = useState<string>('EUROTRUCK SRL');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Render Barcode dynamically whenever options change
  useEffect(() => {
    if (canvasRef.current && selectedProduct?.barcode && showBarcode) {
      let width = 1.8;
      let height = 40;

      if (labelSize === 'larguita') {
        width = 1.4;
        height = 30;
      } else if (labelSize === 'pequena') {
        width = 1.2;
        height = 25;
      } else if (labelSize === 'estandar' || labelSize === '80mm') {
        width = 2.0;
        height = 50;
      } else if (labelSize === 'grande' || labelSize === '4x2in') {
        width = 2.4;
        height = 70;
      }

      renderBarcodeToCanvas(canvasRef.current, selectedProduct.barcode, {
        format: 'CODE128',
        width,
        height,
        displayValue: showBarcodeText,
        fontSize: 11,
      });
    }
  }, [selectedProduct, labelSize, showBarcodeText, showBarcode]);

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 rounded-xl font-black text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md print:hidden"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="w-4 h-4 text-blue-300" />
              <span>← Atrás</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Diseñador e Impresora de Etiquetas Térmicas</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Genera etiquetas adhesivas con código de barras en formato <strong className="text-amber-400">Larguita (Delgada)</strong>, Pequeña, Estándar o Grande.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleTriggerPrint}
          className="inline-flex items-center gap-2 px-6 py-3.5 font-black text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/30 active:scale-95 transition self-start md:self-auto cursor-pointer print:hidden"
        >
          <Printer className="w-5 h-5" />
          <span>Imprimir Etiquetas ({copies})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-slate-100 space-y-5 print:hidden">
          <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Configuración de Etiqueta</span>
          </h3>

          {/* Product Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Seleccionar Repuesto / Artículo del Almacén:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.barcode}) - {p.locationCode}
                </option>
              ))}
            </select>
          </div>

          {/* Label Size Selection Buttons */}
          <div>
            <label className="block text-xs font-bold text-amber-300 mb-2">
              📏 Selecciona el Tamaño de Etiqueta:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: LARGUITA (DELGADA) - Primary choice requested */}
              <button
                type="button"
                onClick={() => setLabelSize('larguita')}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'larguita'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-xs text-amber-300">🏷️ Larguita (Cinta)</span>
                  <span className="text-[10px] font-bold bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800">
                    50x25 mm
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Delgada horizontal para góndola / repuesto</span>
              </button>

              {/* Option 2: PEQUEÑA */}
              <button
                type="button"
                onClick={() => setLabelSize('pequena')}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'pequena'
                    ? 'bg-blue-600/20 border-blue-400 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-xs text-blue-300">🔍 Pequeña</span>
                  <span className="text-[10px] font-bold bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">
                    40x20 mm
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Para piezas chiquitas o conectores</span>
              </button>

              {/* Option 3: ESTÁNDAR */}
              <button
                type="button"
                onClick={() => setLabelSize('estandar')}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'estandar' || labelSize === '58mm' || labelSize === '80mm'
                    ? 'bg-emerald-600/20 border-emerald-400 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-xs text-emerald-300">📄 Estándar</span>
                  <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                    80x50 mm
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Impresora POS o cinta media</span>
              </button>

              {/* Option 4: GRANDE */}
              <button
                type="button"
                onClick={() => setLabelSize('grande')}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'grande' || labelSize === '4x2in'
                    ? 'bg-purple-600/20 border-purple-400 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-xs text-purple-300">📦 Grande</span>
                  <span className="text-[10px] font-bold bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800">
                    100x150 mm
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Zebra 4"x6" o bulto grande</span>
              </button>
            </div>
          </div>

          {/* Toggle Options (Campos que se pueden agregar o quitar de la etiqueta) */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <span className="block text-xs font-black text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" /> CAMPOS ACTIVOS EN LA ETIQUETA:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-slate-200">Nombre Repuesto</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showBrandCompatibility}
                  onChange={(e) => setShowBrandCompatibility(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-amber-300">Modelo Vehículo / Pieza</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-slate-200">Código de Barras</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) => setShowBarcodeText(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-slate-200">Texto Números</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-slate-200">SKU / OEM</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-cyan-300">Góndola Ubicación</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-emerald-400">Precio Venta ($)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={showCost}
                  onChange={(e) => setShowCost(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold text-slate-400">Monto Costo ($)</span>
              </label>
            </div>
          </div>

          {/* Copies & Footer Text */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Número de Copias:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Texto al Pie / Encabezado:
              </label>
              <input
                type="text"
                value={customFooterText}
                onChange={(e) => setCustomFooterText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Live Preview Box */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 print:hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  VISTA PREVIA DE LA ETIQUETA SELECCIONADA
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800">
                {labelSize === 'larguita' && 'FORMATO LARGUITA / DELGADA (60x25mm)'}
                {labelSize === 'pequena' && 'FORMATO PEQUEÑA (40x20mm)'}
                {(labelSize === 'estandar' || labelSize === '58mm' || labelSize === '80mm') && 'FORMATO ESTÁNDAR (80x50mm)'}
                {(labelSize === 'grande' || labelSize === '4x2in') && 'FORMATO GRANDE (100x150mm)'}
              </span>
            </div>

            {/* Sticker Visual Simulation Container */}
            <div className="flex justify-center items-center py-8 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto min-h-[260px]">
              
              {/* LARGUITA / DELGADA DISPLAY */}
              {labelSize === 'larguita' && (
                <div className="bg-white text-black p-3 rounded-lg shadow-2xl border-2 border-slate-400 w-[380px] min-h-[110px] flex items-center justify-between gap-2">
                  <div className="flex flex-col justify-between h-full flex-1 min-w-0">
                    {showName && selectedProduct && (
                      <div className="font-black text-slate-900 text-xs uppercase truncate leading-tight">
                        {selectedProduct.name}
                      </div>
                    )}
                    {showBrandCompatibility && selectedProduct?.brandCompatibility && (
                      <div className="text-[10px] font-bold text-blue-900 truncate">
                        🚛 {selectedProduct.brandCompatibility}
                      </div>
                    )}
                    {showSku && selectedProduct && (
                      <div className="text-[10px] font-mono font-bold text-slate-700">
                        OEM: {selectedProduct.referenceOEM || selectedProduct.sku}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {showLocation && selectedProduct && (
                        <span className="text-[10px] font-extrabold bg-slate-200 px-1.5 py-0.5 rounded border border-slate-400">
                          📍 {selectedProduct.locationCode}
                        </span>
                      )}
                      {showPrice && selectedProduct && (
                        <span className="text-xs font-black text-black ml-auto">
                          ${selectedProduct.priceSale.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barcode Right side */}
                  {showBarcode && (
                    <div className="flex flex-col items-center justify-center shrink-0 border-l border-slate-300 pl-2">
                      <canvas ref={canvasRef} className="max-w-[150px]" />
                      {customFooterText && (
                        <span className="text-[8px] font-mono uppercase font-bold text-slate-500 mt-0.5">
                          {customFooterText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PEQUEÑA DISPLAY */}
              {labelSize === 'pequena' && (
                <div className="bg-white text-black p-2.5 rounded shadow-2xl border border-slate-400 w-[200px] min-h-[120px] flex flex-col items-center justify-between text-center">
                  {showName && selectedProduct && (
                    <div className="font-black text-[11px] leading-tight truncate w-full uppercase">
                      {selectedProduct.name}
                    </div>
                  )}
                  {showBarcode && (
                    <div className="my-0.5 flex justify-center w-full">
                      <canvas ref={canvasRef} className="max-w-full" />
                    </div>
                  )}
                  <div className="flex justify-between w-full text-[9px] font-bold border-t border-slate-200 pt-0.5">
                    {showLocation && selectedProduct && <span>📍 {selectedProduct.locationCode}</span>}
                    {showPrice && selectedProduct && <span>${selectedProduct.priceSale.toFixed(2)}</span>}
                  </div>
                </div>
              )}

              {/* ESTÁNDAR DISPLAY */}
              {(labelSize === 'estandar' || labelSize === '58mm' || labelSize === '80mm') && (
                <div className="bg-white text-black p-4 rounded-xl shadow-2xl border-2 border-slate-400 w-[280px] min-h-[220px] flex flex-col items-center justify-between text-center">
                  <div className="w-full border-b border-slate-300 pb-1.5">
                    {showName && selectedProduct && (
                      <h4 className="font-black text-slate-900 text-sm leading-tight uppercase line-clamp-2">
                        {selectedProduct.name}
                      </h4>
                    )}
                    {showBrandCompatibility && selectedProduct?.brandCompatibility && (
                      <span className="text-[11px] font-bold text-blue-900 block mt-0.5">
                        🚛 {selectedProduct.brandCompatibility}
                      </span>
                    )}
                    {showSku && selectedProduct && (
                      <span className="text-[10px] font-semibold text-slate-700 block font-mono">
                        SKU: {selectedProduct.sku}
                      </span>
                    )}
                  </div>

                  {showBarcode && (
                    <div className="my-2 flex justify-center w-full">
                      <canvas ref={canvasRef} className="max-w-full" />
                    </div>
                  )}

                  <div className="w-full pt-1.5 border-t border-slate-300 flex items-center justify-between gap-2 mt-1">
                    {showLocation && selectedProduct && (
                      <div className="flex items-center gap-1 text-[11px] font-black text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        <MapPin className="w-3 h-3 text-slate-800" />
                        <span>{selectedProduct.locationCode}</span>
                      </div>
                    )}

                    {showPrice && selectedProduct && (
                      <div className="text-right ml-auto">
                        <span className="text-base font-black text-black">
                          ${selectedProduct.priceSale.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {customFooterText && (
                    <div className="text-[9px] text-slate-500 font-mono tracking-widest mt-1 uppercase text-center font-bold">
                      {customFooterText}
                    </div>
                  )}
                </div>
              )}

              {/* GRANDE DISPLAY */}
              {(labelSize === 'grande' || labelSize === '4x2in') && (
                <div className="bg-white text-black p-5 rounded-2xl shadow-2xl border-2 border-slate-400 w-[360px] min-h-[300px] flex flex-col items-center justify-between text-center">
                  <div className="w-full border-b-2 border-black pb-2">
                    <span className="text-xs font-black tracking-widest text-slate-600 block uppercase">
                      {customFooterText || 'EUROTRUCK SRL'}
                    </span>
                    {showName && selectedProduct && (
                      <h4 className="font-black text-slate-900 text-base leading-tight uppercase mt-1">
                        {selectedProduct.name}
                      </h4>
                    )}
                    {showBrandCompatibility && selectedProduct?.brandCompatibility && (
                      <div className="text-xs font-extrabold text-blue-900 mt-1">
                        🚛 COMPATIBILIDAD: {selectedProduct.brandCompatibility}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full text-left my-2 text-xs border-b border-slate-300 pb-2">
                    {showSku && selectedProduct && (
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">SKU / OEM</span>
                        <span className="font-mono font-bold">{selectedProduct.referenceOEM || selectedProduct.sku}</span>
                      </div>
                    )}
                    {showLocation && selectedProduct && (
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">UBICACIÓN GÓNDOLA</span>
                        <span className="font-mono font-black text-black bg-slate-200 px-2 py-0.5 rounded border border-slate-400">
                          {selectedProduct.locationCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {showBarcode && (
                    <div className="my-2 flex justify-center w-full">
                      <canvas ref={canvasRef} className="max-w-full" />
                    </div>
                  )}

                  <div className="w-full pt-2 border-t-2 border-black flex items-center justify-between">
                    {showCost && selectedProduct && (
                      <span className="text-xs font-bold text-slate-600">
                        Costo: ${selectedProduct.priceCost.toFixed(2)}
                      </span>
                    )}
                    {showPrice && selectedProduct && (
                      <span className="text-xl font-black text-black ml-auto">
                        ${selectedProduct.priceSale.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-slate-800/80 rounded-2xl text-slate-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Listo para imprimir. La etiqueta <strong className="text-amber-300">Larguita</strong> está ajustada para cintas térmicas alargadas de góndola.
              </span>
            </div>
          </div>

          {/* Actual Print Area Hidden on Screen, Rendered Only During window.print() */}
          <div className="hidden print:block font-sans">
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                className="page-break-after p-2 bg-white text-black border-b border-black flex flex-col items-center justify-center my-2"
                style={{
                  width: labelSize === 'larguita' ? '60mm' : labelSize === 'pequena' ? '40mm' : labelSize === 'grande' ? '100mm' : '80mm',
                  margin: '0 auto',
                }}
              >
                {showName && selectedProduct && (
                  <div className="font-bold text-xs uppercase mb-0.5 text-center">{selectedProduct.name}</div>
                )}
                {showBrandCompatibility && selectedProduct?.brandCompatibility && (
                  <div className="text-[9px] font-bold text-center">🚛 {selectedProduct.brandCompatibility}</div>
                )}
                {showSku && selectedProduct && (
                  <div className="text-[9px] font-mono text-center">SKU: {selectedProduct.sku}</div>
                )}

                <div className="my-1 text-center font-mono font-bold text-sm">
                  {selectedProduct?.barcode}
                </div>

                <div className="flex justify-between w-full text-xs font-bold mt-1">
                  {showLocation && selectedProduct && <div>UBIC: {selectedProduct.locationCode}</div>}
                  {showPrice && selectedProduct && <div>${selectedProduct.priceSale.toFixed(2)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
