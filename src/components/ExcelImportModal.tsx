import React, { useState } from 'react';
import { Product, Location, Movement } from '../types';
import {
  importProductsFromExcel,
  importBulkProductsDoc,
  exportFullSystemBackupJSON,
  importFullSystemBackupJSON
} from '../services/wmsService';
import { getFullParsedInventoryProducts } from '../data/initialInventoryData';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  PackageCheck,
  FileText,
  Database,
  FileJson,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  locations?: Location[];
  movements?: Movement[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  products,
  locations = [],
  movements = []
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'backup' | 'preset' | 'excel' | 'text'>('backup');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResultMessage('');
      setErrorMessage('');
    }
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedJsonFile(e.target.files[0]);
      setResultMessage('');
      setErrorMessage('');
    }
  };

  const handleExportJson = () => {
    try {
      exportFullSystemBackupJSON(products, locations, movements);
      setResultMessage('✅ Backup completo exportado exitosamente en formato JSON.');
    } catch (err: any) {
      setErrorMessage(`Error al exportar respaldo: ${err.message || String(err)}`);
    }
  };

  const handleImportJson = async () => {
    if (!selectedJsonFile) return;
    setLoading(true);
    setResultMessage('');
    setErrorMessage('');

    try {
      const text = await selectedJsonFile.text();
      const jsonData = JSON.parse(text);
      const res = await importFullSystemBackupJSON(jsonData);
      setResultMessage(
        `¡Respaldo completo restaurado con éxito! Se importaron ${res.productsCount} repuestos/inventario, ${res.locationsCount} góndolas y ${res.movementsCount} registros del Kardex.`
      );
      setSelectedJsonFile(null);
    } catch (err: any) {
      setErrorMessage(`Error al importar el archivo JSON de respaldo: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetCatalogImport = async () => {
    setLoading(true);
    setResultMessage('');
    setErrorMessage('');

    try {
      const presetProducts = getFullParsedInventoryProducts();
      const count = await importBulkProductsDoc(presetProducts);
      setResultMessage(
        `¡Catálogo oficial cargado con éxito! Se han registrado y sincronizado ${count} repuestos Eurotruck con marca de pieza, referencias OEM y ubicaciones en góndola (ej. 1C1, 2C2, 3C3).`
      );
    } catch (err: any) {
      setErrorMessage(`Error al cargar el catálogo preconfigurado: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResultMessage('');
    setErrorMessage('');

    try {
      const res = await importProductsFromExcel(selectedFile, products);
      setResultMessage(
        `¡Importación completada con éxito! ${res.added} productos nuevos agregados, ${res.updated} productos existentes actualizados.`
      );
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMessage(`Error al procesar el archivo Excel: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePastedTextImport = async () => {
    if (!pastedText.trim()) return;
    setLoading(true);
    setResultMessage('');
    setErrorMessage('');

    try {
      const lines = pastedText.split('\n').filter(l => l.trim().length > 0);
      const parsedItems: Product[] = [];
      const now = new Date().toISOString();

      lines.forEach((line, idx) => {
        let parts = line.includes('|') ? line.split('|') : line.split('\t');
        if (parts.length < 2) parts = line.split(',');

        if (parts.length >= 2) {
          const barcode = parts[0]?.trim() || `ART-${String(idx + 1).padStart(6, '0')}`;
          const name = parts[1]?.trim();
          if (!name || name.toUpperCase().includes('DESCRIPCION') || name.toUpperCase().includes('DESCRIPCIÓN')) return;

          const estante = parts[2]?.trim() || '1b';
          const tramo = parts[3]?.trim() || '1';
          const countQty = parts[4] !== undefined && !isNaN(Number(parts[4])) ? Number(parts[4]) : 1;
          const refOEM = parts[5]?.trim() || '';

          const locCode = /^[0-9]+[a-zA-Z]+$/i.test(estante) && /^[0-9]+$/.test(tramo)
            ? `${estante}${tramo}`
            : `${estante}-${tramo}`;

          parsedItems.push({
            id: `pasted_${idx}_${Date.now()}`,
            sku: `SKU-${barcode}`,
            barcode,
            name,
            partBrand: 'Eurotruck / Genuine OEM',
            category: 'Repuestos General',
            brandCompatibility: 'Volvo Trucks',
            referenceOEM: refOEM,
            unit: 'Unidad',
            minStock: 2,
            currentStock: countQty,
            majorBoxQty: 1,
            warehouseCode: '01',
            estante,
            tramo,
            locationCode: locCode,
            counterName: 'Importación Manual',
            priceCost: 45.0,
            priceSale: 75.0,
            notes: `Cargado con Conteo Físico. Góndola ${estante} Tramo ${tramo}`,
            createdAt: now,
            updatedAt: now,
            isAudited: true,
            auditedCount: countQty,
            auditedAt: now,
            auditedBy: 'Importación Texto / Conteo',
            auditedLocation: locCode
          });
        }
      });

      if (parsedItems.length === 0) {
        throw new Error('No se encontraron líneas válidas. Asegúrate de pegar los datos separados por barras | o tabulaciones.');
      }

      const count = await importBulkProductsDoc(parsedItems);
      setResultMessage(`¡Se han importado exitosamente ${count} repuestos con sus conteos físicos y góndolas actualizadas en verde!`);
      setPastedText('');
    } catch (err: any) {
      setErrorMessage(`Error al procesar el texto: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleRows = [
      {
        'NO. PRODUCTO': '20398484',
        'DESCRIPCIÓN PRODUCTO': 'TAPA TANQUE COMBUSTIBLE ALUMINIO LLAVE',
        'ESTANTE': '1b',
        'TRAMO': '1',
        'CONTEO': 12,
        'ESTADO': 'CONTADO',
        'MARCA DE LA PIEZA': 'Eurotruck OEM',
        'REFERENCIA': '20398484 / 21532057',
        'COSTO': 45.0,
        'PRECIO': 75.0
      },
      {
        'NO. PRODUCTO': '21634021',
        'DESCRIPCIÓN PRODUCTO': 'VALVULA REGULADORA DE PRESION D13A',
        'ESTANTE': '1C',
        'TRAMO': '2',
        'CONTEO': 8,
        'ESTADO': 'CONTADO',
        'MARCA DE LA PIEZA': 'Bosch',
        'REFERENCIA': '21634021 / 20796740',
        'COSTO': 85.0,
        'PRECIO': 140.0
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Conteo Eurotruck');
    XLSX.writeFile(wb, 'Plantilla_Conteo_Inventario_Eurotruck.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative space-y-5 animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Gestión de Data, Respaldos & Importación</h3>
          </div>
          <p className="text-xs text-slate-400">
            Exporta e importa la data completa del programa (Inventario, Góndolas y Kardex), o carga catálogos Excel.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'backup' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-300" />
            <span>Respaldo JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'preset' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Catálogo 150+</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'excel' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'text' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-300" />
            <span>Pegar Texto</span>
          </button>
        </div>

        {/* TAB 0: COMPLETE SYSTEM BACKUP (EXPORT & IMPORT JSON) */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            {/* Export Section */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Exportar Backup Completo del Programa</h4>
                    <p className="text-xs text-slate-400">
                      Descarga un archivo JSON con todo el inventario ({products.length} repuestos), góndolas ({locations.length}) y kardex ({movements.length}).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-blue-400">📦 {products.length} Repuestos</span>
                <span>•</span>
                <span className="font-bold text-emerald-400">🏛️ {locations.length} Góndolas</span>
                <span>•</span>
                <span className="font-bold text-purple-400">📜 {movements.length} Movimientos</span>
              </div>

              <button
                onClick={handleExportJson}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <FileJson className="w-4 h-4" />
                <span>Exportar Todo el Sistema (.json)</span>
              </button>
            </div>

            {/* Import Section */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Restaurar / Importar Backup Completo (.json)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sube un archivo de respaldo previo en formato JSON para restaurar o migrar el programa completo a este dispositivo o base de datos.
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-4 text-center bg-slate-900/60 transition">
                <FileJson className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                <p className="text-xs font-bold text-white mb-1">
                  {selectedJsonFile ? selectedJsonFile.name : 'Selecciona un archivo .json de respaldo'}
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonFileChange}
                  className="hidden"
                  id="json-file-input"
                />
                <label
                  htmlFor="json-file-input"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition inline-block mt-1"
                >
                  Examinar Respaldo JSON
                </label>
              </div>

              {selectedJsonFile && (
                <button
                  disabled={loading}
                  onClick={handleImportJson}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>{loading ? 'Restaurando Respaldo...' : 'Restaurar Data Completa en Firestore'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: PRESET INVENTORY (1-CLICK SEEDING) */}
        {activeTab === 'preset' && (
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Catálogo Eurotruck SRL Preconfigurado</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carga los 150+ repuestos oficiales (filtros, válvulas, embragues, inyectores, suspensión) con sus datos completos:
                </p>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside pt-1">
                  <li><strong>Ubicación Góndola:</strong> Piso y Tramo 1C1, 2C2, 3C3</li>
                  <li><strong>Marca de la Pieza:</strong> Eurotruck / Bosch / Volvo Genuine</li>
                  <li><strong>Referencias OEM:</strong> Números de catálogo Volvo / Scania</li>
                  <li><strong>Códigos de Barra:</strong> Listos para lectura rápida</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handlePresetCatalogImport}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{loading ? 'Cargando Catálogo...' : 'Cargar 150+ Repuestos al Inventario'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: EXCEL UPLOAD */}
        {activeTab === 'excel' && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/70 rounded-xl border border-emerald-700/80 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-emerald-300 block">📊 ¡Importa con Conteo, Góndola y Tramo!</span>
                <span className="text-emerald-400/90 text-[11px]">
                  Lee columnas de Conteo/Cantidad, Góndola (ej: 1b, 1C) y Tramo (1, 2, 3), y los pone en verde automáticamente.
                </span>
              </div>
              <button
                onClick={downloadSampleTemplate}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Plantilla Conteo</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-6 text-center bg-slate-950/60 transition">
              <Upload className="w-10 h-10 mx-auto text-blue-400 mb-2" />
              <p className="text-xs font-bold text-white mb-1">
                {selectedFile ? selectedFile.name : 'Selecciona tu archivo .xlsx o .csv'}
              </p>
              <p className="text-[11px] text-slate-400 mb-4">Máximo 10 MB</p>

              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition inline-block"
              >
                Examinar Archivo
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: TEXT PASTE */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Pega directamente la lista copiada desde Excel o documento. Formato soportado: <br />
              <code className="text-blue-300 bg-slate-950 px-1 py-0.5 rounded text-[10px]">
                NO. PRODU | DESCRIPCION PRODUCTO | REFERENCIA | ESTANTE | TRAMO | CODIGO BARRAS
              </code>
            </p>

            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Ejemplo:\n1 | TAPA TANQUE COMBUSTIBLE ALUMINIO LLAVE | 20398484 / 21532057 | 1C1 | 1C1 | 20398484\n2 | VALVULA REGULADORA DE PRESION | 21634021 | 1C1 | 1C1 | 21634021`}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {resultMessage && (
          <div className="p-3 bg-emerald-950 border border-emerald-700 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-950 border border-rose-700 rounded-xl text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
          >
            Cerrar
          </button>

          {activeTab === 'excel' && (
            <button
              disabled={!selectedFile || loading}
              onClick={handleUpload}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Procesando Excel...' : 'Importar Excel'}</span>
            </button>
          )}

          {activeTab === 'text' && (
            <button
              disabled={!pastedText.trim() || loading}
              onClick={handlePastedTextImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>{loading ? 'Procesando Texto...' : 'Importar Texto'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

