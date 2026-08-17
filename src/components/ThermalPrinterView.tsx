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
  const [labelSize, setLabelSize] = useState<ThermalSize>('larguita');
  
  // Customization fields
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

  // Render Barcode dynamically
  useEffect(() => {
    if (canvasRef.current && selectedProduct?.barcode && showBarcode) {
      let width = 1.8;
      let height = 40;

      if (labelSize === 'larguita') {
        width = 1.4;
        height = 30;
      } else if (labelSize === 'pequena') {
        width = 1.2;
        height = 24;
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
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl text-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-bold text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm print:hidden"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
              <span>← Atrás</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 shadow-sm shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white">Diseñador e Impresora de Etiquetas</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Genera etiquetas adhesivas con código de barras en formato <strong className="text-zinc-200">Larguita (Delgada)</strong>, Pequeña o Estándar.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleTriggerPrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 font-black text-xs sm:text-sm bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl shadow-md border border-zinc-300 active:scale-95 transition self-start md:self-auto cursor-pointer print:hidden"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Etiquetas ({copies})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Controls Panel */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl text-zinc-100 space-y-4 print:hidden">
          <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-800">
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Configuración de Etiqueta</span>
          </h3>

          {/* Product Picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Seleccionar Repuesto / Artículo:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.barcode}) - Góndola {p.locationCode}
                </option>
              ))}
            </select>
          </div>

          {/* Label Size Selection Buttons */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              📏 Formato de Etiqueta:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: LARGUITA (DELGADA) */}
              <button
                type="button"
                onClick={() => setLabelSize('larguita')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'larguita'
                    ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300 shadow-md ring-2 ring-zinc-400'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">🏷️ Larguita (Cinta)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-400/50">
                    60x25 mm
                  </span>
                </div>
                <span className="text-[10px] opacity-80 mt-1">Delgada horizontal para góndola / repuesto</span>
              </button>

              {/* Option 2: PEQUEÑA */}
              <button
                type="button"
                onClick={() => setLabelSize('pequena')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'pequena'
                    ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300 shadow-md ring-2 ring-zinc-400'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">🔍 Pequeña</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-400/50">
                    40x20 mm
                  </span>
                </div>
                <span className="text-[10px] opacity-80 mt-1">Para piezas chiquitas o conectores</span>
              </button>

              {/* Option 3: ESTÁNDAR */}
              <button
                type="button"
                onClick={() => setLabelSize('estandar')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'estandar' || labelSize === '58mm' || labelSize === '80mm'
                    ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300 shadow-md ring-2 ring-zinc-400'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">📄 Estándar</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-400/50">
                    80x50 mm
                  </span>
                </div>
                <span className="text-[10px] opacity-80 mt-1">Impresora POS o cinta media</span>
              </button>

              {/* Option 4: GRANDE */}
              <button
                type="button"
                onClick={() => setLabelSize('grande')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  labelSize === 'grande' || labelSize === '4x2in'
                    ? 'bg-zinc-100 text-zinc-950 font-black border-zinc-300 shadow-md ring-2 ring-zinc-400'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">📦 Grande</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-400/50">
                    100x150 mm
                  </span>
                </div>
                <span className="text-[10px] opacity-80 mt-1">Zebra 4"x6" o bulto grande</span>
              </button>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <span className="block text-xs font-black text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-zinc-400" /> CAMPOS ACTIVOS EN LA ETIQUETA:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-200">Nombre Repuesto</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showBrandCompatibility}
                  onChange={(e) => setShowBrandCompatibility(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-300">Modelo Vehículo</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-200">Código de Barras</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) => setShowBarcodeText(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-200">Texto Números</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-200">SKU / OEM</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-200">Góndola Ubicación</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-200">Precio Venta ($)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/80">
                <input
                  type="checkbox"
                  checked={showCost}
                  onChange={(e) => setShowCost(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-500"
                />
                <span className="font-semibold text-zinc-400">Monto Costo ($)</span>
              </label>
            </div>
          </div>

          {/* Copies & Footer Text */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Número de Copias:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Texto al Pie / Encabezado:
              </label>
              <input
                type="text"
                value={customFooterText}
                onChange={(e) => setCustomFooterText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Right Live Preview Box */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl text-zinc-100 print:hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  VISTA PREVIA DE LA ETIQUETA
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                {labelSize === 'larguita' && 'FORMATO LARGUITA (60x25mm)'}
                {labelSize === 'pequena' && 'FORMATO PEQUEÑA (40x20mm)'}
                {(labelSize === 'estandar' || labelSize === '58mm' || labelSize === '80mm') && 'FORMATO ESTÁNDAR (80x50mm)'}
                {(labelSize === 'grande' || labelSize === '4x2in') && 'FORMATO GRANDE (100x150mm)'}
              </span>
            </div>

            {/* Sticker Visual Simulation Container */}
            <div className="flex justify-center items-center py-6 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner overflow-x-auto min-h-[240px]">
              {/* LARGUITA / DELGADA DISPLAY */}
              {labelSize === 'larguita' && (
                <div className="bg-white text-black p-3 rounded-lg shadow-xl border border-zinc-400 w-[380px] min-h-[110px] flex items-center justify-between gap-2">
                  <div className="flex flex-col justify-between h-full flex-1 min-w-0">
                    {showName && selectedProduct && (
                      <div className="font-black text-zinc-900 text-xs uppercase truncate leading-tight">
                        {selectedProduct.name}
                      </div>
                    )}
                    {showBrandCompatibility && selectedProduct?.brandCompatibility && (
                      <div className="text-[10px] font-bold text-zinc-800 truncate">
                        🚛 {selectedProduct.brandCompatibility}
                      </div>
                    )}
                    {showSku && selectedProduct && (
                      <div className="text-[10px] font-mono font-bold text-zinc-700">
                        OEM: {selectedProduct.referenceOEM || selectedProduct.sku}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {showLocation && selectedProduct && (
                        <span className="text-[10px] font-extrabold bg-zinc-200 px-1.5 py-0.5 rounded border border-zinc-400">
                          📍 {selectedProduct.locationCode}
                        </span>
                      )}
                      {showPrice && selectedProduct && (
                        <span className="text-xs font-black text-black ml-auto font-mono">
                          ${selectedProduct.priceSale.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barcode Right side */}
                  {showBarcode && (
                    <div className="flex flex-col items-center justify-center shrink-0 border-l border-zinc-300 pl-2">
                      <canvas ref={canvasRef} className="max-w-[150px]" />
                      {customFooterText && (
                        <span className="text-[8px] font-mono uppercase font-bold text-zinc-500 mt-0.5">
                          {customFooterText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PEQUEÑA DISPLAY */}
              {labelSize === 'pequena' && (
                <div className="bg-white text-black p-2.5 rounded shadow-xl border border-zinc-400 w-[200px] min-h-[120px] flex flex-col items-center justify-between text-center">
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
                  <div className="flex justify-between w-full text-[9px] font-bold border-t border-zinc-200 pt-0.5">
                    {showLocation && selectedProduct && <span>📍 {selectedProduct.locationCode}</span>}
                    {showPrice && selectedProduct && <span>${selectedProduct.priceSale.toFixed(2)}</span>}
                  </div>
                </div>
              )}

              {/* ESTÁNDAR DISPLAY */}
              {(labelSize === 'estandar' || labelSize === '58mm' || labelSize === '80mm') && (
                <div className="bg-white text-black p-4 rounded-xl shadow-xl border border-zinc-400 w-[280px] min-h-[220px] flex flex-col items-center justify-between text-center">
                  <div className="w-full border-b border-zinc-300 pb-1.5">
                    {showName && selectedProduct && (
                      <h4 className="font-black text-zinc-900 text-sm leading-tight uppercase line-clamp-2">
                        {selectedProduct.name}
                      </h4>
                    )}
                    {showBrandCompatibility && selectedProduct?.brandCompatibility && (
                      <span className="text-[11px] font-bold text-zinc-800 block mt-0.5">
                        🚛 {selectedProduct.brandCompatibility}
                      </span>
                    )}
                    {showSku && selectedProduct && (
                      <span className="text-[10px] font-semibold text-zinc-700 block font-mono">
                        SKU: {selectedProduct.sku}
                      </span>
                    )}
                  </div>

                  {showBarcode && (
                    <div className="my-2 flex justify-center w-full">
                      <canvas ref={canvasRef} className="max-w-full" />
                    </div>
                  )}

                  <div className="w-full pt-1.5 border-t border-zinc-300 flex items-center justify-between gap-2 mt-1">
                    {showLocation && selectedProduct && (
                      <div className="flex items-center gap-1 text-[11px] font-black text-black bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                        <MapPin className="w-3 h-3 text-zinc-800" />
                        <span>{selectedProduct.locationCode}</span>
                      </div>
                    )}

                    {showPrice && selectedProduct && (
                      <div className="text-right ml-auto">
                        <span className="text-base font-black text-black font-mono">
                          ${selectedProduct.priceSale.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {customFooterText && (
                    <div className="text-[9px] text-zinc-500 font-mono tracking-widest mt-1 uppercase text-center font-bold">
                      {customFooterText}
                    </div>
                  )}
                </div>
              )}

              {/* GRANDE DISPLAY */}
              {(labelSize === 'grande' || labelSize === '4x2in') && (
                <div className="bg-white text-black p-5 rounded-2xl shadow-xl border-2 border-black w-[360px] min-h-[300px] flex flex-col items-center justify-between text-center">
                  <div className="w-full border-b-2 border-black pb-2">
                    <span className="text-xs font-black tracking-widest text-zinc-600 block uppercase">
                      {customFooterText || 'EUROTRUCK SRL'}
                    </span>
                    {showName && selectedProduct && (
                      <h4 className="font-black text-zinc-900 text-base leading-tight uppercase mt-1">
                        {selectedProduct.name}
                      </h4>
                    )}
                    {showBrandCompatibility && selectedProduct?.brandCompatibility && (
                      <div className="text-xs font-extrabold text-zinc-800 mt-1">
                        🚛 COMPATIBILIDAD: {selectedProduct.brandCompatibility}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full text-left my-2 text-xs border-b border-zinc-300 pb-2">
                    {showSku && selectedProduct && (
                      <div>
                        <span className="text-[10px] text-zinc-500 block font-bold">SKU / OEM</span>
                        <span className="font-mono font-bold">{selectedProduct.referenceOEM || selectedProduct.sku}</span>
                      </div>
                    )}
                    {showLocation && selectedProduct && (
                      <div>
                        <span className="text-[10px] text-zinc-500 block font-bold">UBICACIÓN GÓNDOLA</span>
                        <span className="font-mono font-black text-black bg-zinc-200 px-2 py-0.5 rounded border border-zinc-400">
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
                      <span className="text-xs font-bold text-zinc-600">
                        Costo: ${selectedProduct.priceCost.toFixed(2)}
                      </span>
                    )}
                    {showPrice && selectedProduct && (
                      <span className="text-xl font-black text-black ml-auto font-mono">
                        ${selectedProduct.priceSale.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}
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
