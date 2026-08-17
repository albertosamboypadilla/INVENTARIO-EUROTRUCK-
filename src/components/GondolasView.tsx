import React, { useState } from 'react';
import { Location, Product } from '../types';
import {
  Grid,
  Plus,
  MapPin,
  Package,
  Layers,
  Sparkles,
  Search,
  Printer,
  ChevronRight,
  Boxes,
  X,
  PlusCircle,
  ArrowLeft
} from 'lucide-react';

interface GondolasViewProps {
  locations: Location[];
  products: Product[];
  onAddLocation: (data: Omit<Location, 'id' | 'createdAt'>) => Promise<string>;
  onOpenPrintLabel?: (product: Product) => void;
  onBackToDashboard?: () => void;
}

export const GondolasView: React.FC<GondolasViewProps> = ({
  locations,
  products,
  onAddLocation,
  onOpenPrintLabel,
  onBackToDashboard,
}) => {
  const [selectedAisle, setSelectedAisle] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Location Form State
  const [newCode, setNewCode] = useState<string>('');
  const [newAisle, setNewAisle] = useState<string>('PAS-01');
  const [newGondola, setNewGondola] = useState<string>('G01');
  const [newLevel, setNewLevel] = useState<string>('N1');
  const [newPosition, setNewPosition] = useState<string>('P01');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCapacity, setNewCapacity] = useState<number>(100);

  // Get distinct Aisles list
  const aisles = Array.from(new Set(locations.map((l) => l.aisle))).sort();

  // Filter locations
  const filteredLocations = locations.filter((loc) => {
    const matchesAisle = selectedAisle === 'ALL' || loc.aisle === selectedAisle;
    const matchesSearch =
      loc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAisle && matchesSearch;
  });

  // Group locations by Gondola (e.g. G01, G02) within the aisle
  const groupedByGondola: Record<string, Location[]> = filteredLocations.reduce((acc: Record<string, Location[]>, loc) => {
    const key = `${loc.aisle}-${loc.gondola}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(loc);
    return acc;
  }, {});

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const autoCode = newCode.trim() || newGondola || 'Góndola 1';
    await onAddLocation({
      code: autoCode,
      aisle: newAisle || 'Pasillo General',
      gondola: autoCode,
      level: newLevel,
      position: newPosition,
      description: newDescription || `Ubicación ${autoCode}`,
      maxCapacity: newCapacity,
      status: 'active',
    });

    setIsAddModalOpen(false);
    setNewCode('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <div>
            <div className="flex items-center gap-2">
              <Grid className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Mapa de Ubicaciones en Góndola</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualiza la disposición física de estantes, góndolas y pasillos del almacén WMS.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Ubicación de Góndola</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedAisle('ALL')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              selectedAisle === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todos los Pasillos
          </button>
          {aisles.map((aisle) => (
            <button
              key={aisle}
              onClick={() => setSelectedAisle(aisle)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                selectedAisle === aisle
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {aisle}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ubicación (ej. PAS-01)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Interactive Gondola Racks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedByGondola).map(([gondolaKey, locList]) => {
          const [aisleName, gondolaName] = gondolaKey.split('-');
          return (
            <div
              key={gondolaKey}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        {aisleName} • Góndola {gondolaName}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {locList.length} niveles/casillas disponibles
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold">
                    {aisleName}-{gondolaName}
                  </span>
                </div>

                {/* Shelf Levels Visual Rack Simulation */}
                <div className="space-y-2.5">
                  {locList.map((loc) => {
                    const assignedProds = products.filter((p) => p.locationCode === loc.code);
                    const totalUnitsInLoc = assignedProds.reduce(
                      (sum, p) => sum + p.currentStock,
                      0
                    );
                    const capacityPercent = Math.min(
                      100,
                      Math.round((totalUnitsInLoc / (loc.maxCapacity || 100)) * 100)
                    );

                    return (
                      <div
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc)}
                        className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 rounded-xl p-3 cursor-pointer transition shadow-sm group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs font-bold text-white group-hover:text-blue-300 transition">
                              {loc.code}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-400">
                            {assignedProds.length} prod. ({totalUnitsInLoc} u.)
                          </span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full transition-all duration-300 ${
                              capacityPercent > 85
                                ? 'bg-rose-500'
                                : capacityPercent > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>{loc.description}</span>
                          <span>Cap: {loc.maxCapacity} u.</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Location Drawer / Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative space-y-5 animate-scaleUp">
            <button
              onClick={() => setSelectedLocation(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Ubicación WMS
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedLocation.code}</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {selectedLocation.description}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block">Pasillo</span>
                <span className="text-sm font-bold text-white">{selectedLocation.aisle}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Góndola</span>
                <span className="text-sm font-bold text-white">{selectedLocation.gondola}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Nivel / Pos</span>
                <span className="text-sm font-bold text-emerald-400">
                  {selectedLocation.level} - {selectedLocation.position}
                </span>
              </div>
            </div>

            {/* List of products sitting on this shelf location */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Productos Almacenados en esta Ubicación:
              </h4>

              {products.filter((p) => p.locationCode === selectedLocation.code).length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {products
                    .filter((p) => p.locationCode === selectedLocation.code)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-sm text-white">{p.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            EAN: {p.barcode} • SKU: {p.sku}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 font-bold text-xs rounded-lg border border-emerald-800/50">
                            {p.currentStock} {p.unit}s
                          </span>

                          {onOpenPrintLabel && (
                            <button
                              onClick={() => {
                                setSelectedLocation(null);
                                onOpenPrintLabel(p);
                              }}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-lg"
                              title="Imprimir etiqueta térmica"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-800/40 rounded-xl text-center text-slate-400 text-xs">
                  <Boxes className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <span>Esta casilla de góndola está actualmente vacía.</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Alta de Ubicación en Góndola</h3>
              <p className="text-xs text-slate-400 mt-1">
                Define pasillo, número de góndola, nivel y casilla para la nomenclatura estándar WMS.
              </p>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pasillo:</label>
                  <select
                    value={newAisle}
                    onChange={(e) => setNewAisle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="PAS-01">PAS-01 (Pasillo 1)</option>
                    <option value="PAS-02">PAS-02 (Pasillo 2)</option>
                    <option value="PAS-03">PAS-03 (Pasillo 3)</option>
                    <option value="PAS-04">PAS-04 (Pasillo 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Góndola / Estante:</label>
                  <select
                    value={newGondola}
                    onChange={(e) => setNewGondola(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="Góndola 1">Góndola 1</option>
                    <option value="Góndola 2">Góndola 2</option>
                    <option value="Góndola 3">Góndola 3</option>
                    <option value="Góndola 4">Góndola 4</option>
                    <option value="Góndola 5">Góndola 5</option>
                    <option value="Góndola 6">Góndola 6</option>
                    <option value="Estante 1">Estante 1</option>
                    <option value="Estante 2">Estante 2</option>
                    <option value="Piso">Piso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nivel:</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="N1">N1 (Nivel 1 - Base)</option>
                    <option value="N2">N2 (Nivel 2 - Medio)</option>
                    <option value="N3">N3 (Nivel 3 - Alto)</option>
                    <option value="N4">N4 (Nivel 4 - Top)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Posición / Casilla:</label>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="P01">P01</option>
                    <option value="P02">P02</option>
                    <option value="P03">P03</option>
                    <option value="P04">P04</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descripción o Referencia de Góndola:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Góndola de Galletas - Nivel Medio"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Capacidad Máxima de Unidades:
                </label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value) || 100)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Guardar Ubicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
