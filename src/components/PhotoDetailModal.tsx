import React, { useState } from 'react';
import { Product } from '../types';
import {
  X,
  Camera,
  Printer,
  Edit2,
  MapPin,
  Barcode,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  DollarSign,
  Tag,
  ZoomIn
} from 'lucide-react';
import { generateBarcodeSvg } from '../utils/barcode';

interface PhotoDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintLabel?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenPrintLabel,
  onEditProduct
}) => {
  const [activePhotoTab, setActivePhotoTab] = useState<'front' | 'detail'>('front');
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const isOut = product.currentStock <= 0;
  const isLow = product.currentStock > 0 && product.currentStock <= product.minStock;

  const mainPhoto = product.photoFront || product.imageUrl;
  const detailPhoto = product.photoDetail;
  const activePhoto = activePhotoTab === 'front' ? mainPhoto : (detailPhoto || mainPhoto);

  const compatParts = (product.brandCompatibility || '').split(' / ');
  const vehicleModel = compatParts[0] || 'Universal';
  const partModel = compatParts[1] || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden my-auto relative flex flex-col max-h-[92vh]">
        {/* Modal Header Bar */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
                GALERÍA Y DETALLE DE PIEZA
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {product.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Main Photo Gallery Box */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[260px] sm:min-h-[320px] group">
            {activePhoto ? (
              <div className="relative w-full flex flex-col items-center">
                <div
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`relative cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center ${
                    isZoomed ? 'max-h-[500px] scale-105 z-20' : 'max-h-[280px] sm:max-h-[320px]'
                  }`}
                >
                  <img
                    src={activePhoto}
                    alt={product.name}
                    className="max-h-[280px] sm:max-h-[320px] w-auto object-contain rounded-xl"
                  />
                  <div className="absolute top-2 right-2 p-1.5 bg-slate-950/80 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{isZoomed ? 'Reducir' : 'Ampliar'}</span>
                  </div>
                </div>

                {/* Photo Selector Switch */}
                {(mainPhoto || detailPhoto) && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setActivePhotoTab('front')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        activePhotoTab === 'front'
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Foto 1: Vista Frontal</span>
                    </button>

                    {detailPhoto && (
                      <button
                        onClick={() => setActivePhotoTab('detail')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                          activePhotoTab === 'detail'
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Foto 2: Vista Detalle</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <Truck className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-400">
                  Sin fotografías registradas para esta pieza.
                </p>
                <p className="text-[11px] text-slate-500">
                  Puedes editar el repuesto para capturar o subir la foto con tu cámara.
                </p>
              </div>
            )}
          </div>

          {/* Key Product Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Column 1: Models & Location */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Compatibilidad de Vehículo
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {product.partBrand && (
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">MARCA DE LA PIEZA:</span>
                    <span className="text-emerald-400 font-black text-sm">🏷️ {product.partBrand}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">MODELO DE VEHÍCULO:</span>
                  <span className="text-white font-black text-sm">{vehicleModel}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">MODELO DE PIEZA:</span>
                  <span className="text-amber-300 font-bold text-xs">{partModel}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">NÚMERO OEM / REF:</span>
                  <span className="text-cyan-300 font-mono font-bold text-xs">
                    {product.referenceOEM || 'Sin Ref OEM'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">UBICACIÓN (PISO/TRAMO):</span>
                <span className="text-xs font-black font-mono text-blue-300 bg-blue-950 px-2.5 py-1 rounded-xl border border-blue-700 shadow-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{product.locationCode || '1C1'}</span>
                </span>
              </div>
            </div>

            {/* Column 2: Barcode & Stock Status */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                    CÓDIGO DE BARRA
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {product.barcode}
                </span>
              </div>

              {/* Render Barcode SVG */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-300 flex flex-col items-center justify-center">
                <div
                  className="w-full flex justify-center max-h-16 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(product.barcode) }}
                />
                <span className="text-[10px] font-mono font-bold text-slate-800 mt-1">
                  {product.barcode}
                </span>
              </div>

              {/* Stock Status Badge */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">ESTADO EN INVENTARIO:</span>
                {isOut ? (
                  <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-xl shadow border border-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>🚨 AGOTADO (0)</span>
                  </span>
                ) : isLow ? (
                  <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow border border-amber-300 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>⚠️ {product.currentStock} {product.unit}s (REPOSICIÓN)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-950 text-emerald-300 font-black text-xs rounded-xl border border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✅ {product.currentStock} {product.unit}s DISPONIBLE</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Cost Banner */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">COSTO DE COMPRA</span>
              <span className="text-base font-black text-slate-200 font-mono mt-0.5 block">
                ${(product.priceCost || 0).toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">PRECIO DE VENTA</span>
              <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                ${(product.priceSale || 0).toFixed(2)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-900/80 p-2.5 rounded-xl border border-blue-500/40">
              <span className="text-[10px] text-blue-400 font-bold uppercase block">MARGEN UNITARIO</span>
              <span className="text-base font-black text-blue-400 font-mono mt-0.5 block">
                ${((product.priceSale || 0) - (product.priceCost || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950 px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {onOpenPrintLabel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPrintLabel(product);
                }}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md border border-blue-400 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Etiqueta</span>
              </button>
            )}

            {onEditProduct && (
              <button
                onClick={() => {
                  onClose();
                  onEditProduct(product);
                }}
                className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md border border-amber-300 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar Repuesto</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
