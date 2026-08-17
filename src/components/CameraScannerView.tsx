import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, Location, MovementType } from '../types';
import {
  Camera,
  CameraOff,
  Search,
  PackageCheck,
  PackageMinus,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Barcode,
  Volume2,
  VolumeX,
  X,
  ArrowLeft
} from 'lucide-react';

interface CameraScannerViewProps {
  products: Product[];
  locations: Location[];
  onExecuteMovement: (params: {
    product: Product;
    type: MovementType;
    quantity: number;
    newLocationCode?: string;
    operator: string;
    notes?: string;
  }) => Promise<void>;
  onOpenPrintLabel: (product: Product) => void;
  onRequestPin?: (action: 'edit' | 'delete', product: Product, onAuthorized: () => void) => void;
  onBackToDashboard?: () => void;
}

type ScanMode = 'LOOKUP' | 'IN' | 'OUT' | 'RELOCATION';

export const CameraScannerView: React.FC<CameraScannerViewProps> = ({
  products,
  locations,
  onExecuteMovement,
  onOpenPrintLabel,
  onRequestPin,
  onBackToDashboard
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<ScanMode>('LOOKUP');
  const [scannedCode, setScannedCode] = useState<string>('');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [targetLocationCode, setTargetLocationCode] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('Operador Almacén');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'wms-html5-camera-reader';

  // Beep Audio Synthesizer
  const playBeep = () => {
    if (!audioFeedback) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio feedback error:', e);
    }
  };

  const handleBarcodeFound = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playBeep();
    setScannedCode(cleanCode);
    setErrorMessage('');
    setSuccessMessage('');

    // Match product by Barcode or SKU
    const match = products.find(
      (p) => p.barcode === cleanCode || p.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (match) {
      setSelectedProduct(match);
      setTargetLocationCode(match.locationCode);
      setQuantityInput(1);
    } else {
      setSelectedProduct(null);
      setErrorMessage(`No se encontró ningún producto con el código: "${cleanCode}"`);
    }
  };

  const startScanner = async () => {
    try {
      setErrorMessage('');
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Rear camera
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
        },
        (decodedText) => {
          handleBarcodeFound(decodedText);
        },
        () => {
          // Frame error (scanning)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera Scanner start error:', err);
      setErrorMessage(
        'No se pudo acceder a la cámara. Revisa los permisos en tu navegador o ingresa el código manualmente.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping camera:', e);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleBarcodeFound(manualCodeInput.trim());
  };

  const doExecuteMovement = async () => {
    if (!selectedProduct) return;
    setProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let movType: MovementType = 'IN';
      if (scanMode === 'IN') movType = 'IN';
      else if (scanMode === 'OUT') movType = 'OUT';
      else if (scanMode === 'RELOCATION') movType = 'RELOCATION';

      await onExecuteMovement({
        product: selectedProduct,
        type: movType,
        quantity: quantityInput,
        newLocationCode: scanMode === 'RELOCATION' ? targetLocationCode : undefined,
        operator: operatorName,
        notes: actionNotes,
      });

      setSuccessMessage(
        `¡Operación registrada con éxito! Nuevo stock de ${selectedProduct.name}: ${
          scanMode === 'IN'
            ? selectedProduct.currentStock + quantityInput
            : scanMode === 'OUT'
            ? Math.max(0, selectedProduct.currentStock - quantityInput)
            : selectedProduct.currentStock
        } u.`
      );

      // Reset form
      setActionNotes('');
      setQuantityInput(1);
    } catch (err: any) {
      setErrorMessage(`Error registrando movimiento: ${err.message || String(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedProduct) return;
    if (scanMode !== 'LOOKUP' && onRequestPin) {
      onRequestPin('edit', selectedProduct, () => {
        doExecuteMovement();
      });
    } else {
      doExecuteMovement();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-2 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 rounded-xl font-black text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Volver al Menú Principal"
              >
                <ArrowLeft className="w-4 h-4 text-blue-300" />
                <span>← Atrás</span>
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <Barcode className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Escáner de Código de Barras por Cámara</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Escanea desde tu celular, tablet o PC para consultar precios, registrar entradas, salidas o reubicar góndolas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAudioFeedback(!audioFeedback)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                audioFeedback
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'bg-slate-800 text-slate-500 border border-slate-800'
              }`}
              title="Sonido de pitido al escanear"
            >
              {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">Sonido</span>
            </button>

            {!isScanning ? (
              <button
                onClick={startScanner}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Activar Cámara</span>
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition"
              >
                <CameraOff className="w-4 h-4" />
                <span>Detener Cámara</span>
              </button>
            )}
          </div>
        </div>

        {/* Operating Modes Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setScanMode('LOOKUP')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
              scanMode === 'LOOKUP'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Consulta Rápida</span>
          </button>

          <button
            onClick={() => setScanMode('IN')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
              scanMode === 'IN'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Recepción (Entrada)</span>
          </button>

          <button
            onClick={() => setScanMode('OUT')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
              scanMode === 'OUT'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <PackageMinus className="w-4 h-4" />
            <span>Despacho (Picking)</span>
          </button>

          <button
            onClick={() => setScanMode('RELOCATION')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
              scanMode === 'RELOCATION'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reubicar Góndola</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Video Viewfinder & Manual Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden relative min-h-[260px] flex flex-col justify-center items-center text-center">
            {/* HTML5 QR Camera Container */}
            <div
              id={readerElementId}
              className={`w-full rounded-xl overflow-hidden bg-black ${!isScanning ? 'hidden' : 'block'}`}
            ></div>

            {!isScanning && (
              <div className="py-8 px-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Cámara Inactiva</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Haz clic en "Activar Cámara" para encender el visor de escaneo en vivo.
                </p>
                <button
                  onClick={startScanner}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md"
                >
                  Abrir Escáner de Cámara
                </button>
              </div>
            )}
          </div>

          {/* Manual Keyboard Input for Barcode or SKU */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Ingreso Manual o Escáner Laser USB / Bluetooth:
            </label>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe o escanea código EAN / SKU..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </button>
            </form>

            {/* Quick Demo Scan Chips */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                Prueba rápida con productos de muestra:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleBarcodeFound(p.barcode)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300 font-mono transition"
                  >
                    {p.barcode} ({p.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Product Info & Stock Action Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Notifications */}
          {successMessage && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-2xl flex items-start gap-3 text-emerald-200 text-xs sm:text-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
              <button
                onClick={() => setSuccessMessage('')}
                className="text-emerald-400 hover:text-emerald-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-950/80 border border-rose-700/60 rounded-2xl flex items-start gap-3 text-rose-200 text-xs sm:text-sm animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-rose-400 hover:text-rose-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scanned Result Card */}
          {selectedProduct ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      SKU: {selectedProduct.sku}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 font-mono border border-slate-700">
                      EAN: {selectedProduct.barcode}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Categoría: {selectedProduct.category}</p>
                </div>

                <button
                  onClick={() => onOpenPrintLabel(selectedProduct)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>Imprimir Etiqueta</span>
                </button>
              </div>

              {/* Product Info Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Stock Actual</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-extrabold text-white">
                      {selectedProduct.currentStock}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedProduct.unit}s
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Ubicación Góndola</span>
                  <div className="flex items-center gap-1 mt-1 text-emerald-400 font-bold text-sm">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{selectedProduct.locationCode}</span>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 block">Precio Venta</span>
                  <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                    ${selectedProduct.priceSale.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Form depending on ScanMode */}
              {scanMode !== 'LOOKUP' ? (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {scanMode === 'IN' && '📥 Registrar Recepción de Mercancía (+ Stock)'}
                    {scanMode === 'OUT' && '📤 Registrar Despacho / Picking (- Stock)'}
                    {scanMode === 'RELOCATION' && '🔄 Registrar Reubicación en Otra Góndola'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {scanMode !== 'RELOCATION' ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Cantidad de Unidades:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))}
                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-white text-lg flex items-center justify-center border border-slate-700"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantityInput}
                            onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantityInput(quantityInput + 1)}
                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-white text-lg flex items-center justify-center border border-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Nueva Ubicación en Góndola:
                        </label>
                        <select
                          value={targetLocationCode}
                          onChange={(e) => setTargetLocationCode(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.code}>
                              {loc.code} - {loc.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Operador Responsable:
                      </label>
                      <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nombre de operario"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Observaciones / Referencia (Opcional):
                    </label>
                    <input
                      type="text"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Ej. Número de factura, orden de despacho o estado..."
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    disabled={processing}
                    onClick={handleConfirmAction}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
                      scanMode === 'IN'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : scanMode === 'OUT'
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                        : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                    }`}
                  >
                    {processing ? (
                      <span>Registrando en tiempo real...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirmar Movimiento en WMS</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-blue-200 text-xs">
                  💡 <strong>Modo Consulta Activo:</strong> Selecciona "Recepción", "Despacho" o "Reubicar" en la parte superior si deseas modificar el stock de este producto.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center text-slate-400">
              <Barcode className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-200">Esperando Escaneo de Producto</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Apunta la cámara al código de barras EAN/13 o QR de cualquier producto, o ingresa su código manualmente a la izquierda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
