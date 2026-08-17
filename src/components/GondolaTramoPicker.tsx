import React, { useState, useEffect } from 'react';
import { MapPin, Layers, Check, Sparkles } from 'lucide-react';

export const DEFAULT_GONDOLAS = [
  '1b',
  '1C',
  '2A',
  '2B',
  '3A',
  '3B',
  '3C',
  '4A',
  '4B',
  '5A',
  '5B',
  '6A',
  '6B',
];

export const DEFAULT_TRAMOS = ['1', '2', '3', '4', '5', '6'];

export function parseGondolaTramo(locationCode: string): { gondola: string; tramo: string } {
  if (!locationCode) return { gondola: '1b', tramo: '1' };
  const clean = locationCode.trim();

  // Pattern: "1b1", "1C2", "2A4"
  const match1 = clean.match(/^([0-9]+[a-zA-Z]+)[-_ ]*([0-9]+)$/);
  if (match1) {
    return { gondola: match1[1], tramo: match1[2] };
  }

  // Pattern: "G01-T2" or "PAS-01"
  const parts = clean.split(/[-_ ]+/);
  if (parts.length >= 2) {
    return { gondola: parts[0], tramo: parts[1] };
  }

  return { gondola: clean, tramo: '1' };
}

export function formatLocationCode(gondola: string, tramo: string): string {
  const g = (gondola || '1b').trim();
  const t = (tramo || '1').trim();
  if (/^[0-9]+[a-zA-Z]+$/i.test(g) && /^[0-9]+$/.test(t)) {
    return `${g}${t}`;
  }
  return `${g}${t ? (g.endsWith('-') ? '' : '-') + t : ''}`;
}

interface GondolaTramoPickerProps {
  value: string;
  onChange: (fullCode: string, estante?: string, tramo?: string) => void;
  availableLocations?: string[];
  label?: string;
  compact?: boolean;
}

export const GondolaTramoPicker: React.FC<GondolaTramoPickerProps> = ({
  value,
  onChange,
  availableLocations = [],
  label = 'UBICACIÓN: GÓNDOLA Y TRAMO',
  compact = false,
}) => {
  const [activeGondola, setActiveGondola] = useState<string>('1b');
  const [activeTramo, setActiveTramo] = useState<string>('1');
  const [gondolaList, setGondolaList] = useState<string[]>(DEFAULT_GONDOLAS);

  // Extract from incoming value
  useEffect(() => {
    if (value) {
      const parsed = parseGondolaTramo(value);
      setActiveGondola(parsed.gondola);
      setActiveTramo(parsed.tramo);

      if (parsed.gondola && !gondolaList.includes(parsed.gondola)) {
        setGondolaList((prev) => Array.from(new Set([...prev, parsed.gondola])));
      }
    }
  }, [value]);

  // Extract from availableLocations
  useEffect(() => {
    if (availableLocations.length > 0) {
      const extractedGondolas = availableLocations.map((loc) => parseGondolaTramo(loc).gondola);
      setGondolaList((prev) => Array.from(new Set([...prev, ...extractedGondolas])));
    }
  }, [availableLocations]);

  const handleGondolaChange = (newG: string) => {
    setActiveGondola(newG);
    const newCode = formatLocationCode(newG, activeTramo);
    onChange(newCode, newG, `Tramo ${activeTramo}`);
  };

  const handleTramoChange = (newT: string) => {
    setActiveTramo(newT);
    const newCode = formatLocationCode(activeGondola, newT);
    onChange(newCode, activeGondola, `Tramo ${newT}`);
  };

  const currentCode = formatLocationCode(activeGondola, activeTramo);

  return (
    <div className="bg-zinc-950 border-2 border-emerald-500/40 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
      {/* Header with Title and Resulting Location Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950 border-2 border-emerald-500 text-emerald-300 font-mono font-black text-sm shadow-sm">
          <span className="text-[10px] uppercase text-emerald-400 font-sans font-bold">Ubicación:</span>
          <span className="text-base font-black text-white">{currentCode}</span>
        </div>
      </div>

      {/* Grid: 2 Direct Fast Sections (Góndola + Tramo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. GÓNDOLA / ESTANTE (Manual + Chips) */}
        <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-zinc-300 uppercase tracking-wide flex items-center gap-1">
              <span>1. Góndola / Estante:</span>
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">Escribe o toca</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={activeGondola}
              onChange={(e) => handleGondolaChange(e.target.value)}
              placeholder="Ej: 1b, 1C, 2A..."
              className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-emerald-400 text-emerald-300 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-black focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-inner"
            />
          </div>

          {/* Quick Gondola Buttons */}
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
            {gondolaList.slice(0, 10).map((g) => {
              const isSelected = activeGondola.toLowerCase() === g.toLowerCase();
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGondolaChange(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-400 text-zinc-950 shadow-sm border border-emerald-300'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. TRAMO / NIVEL (Manual + Chips) */}
        <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-zinc-300 uppercase tracking-wide flex items-center gap-1">
              <span>2. Tramo / Nivel:</span>
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">Escribe o toca</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={activeTramo}
              onChange={(e) => handleTramoChange(e.target.value)}
              placeholder="Ej: 1, 2, 3, 4..."
              className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-blue-400 text-blue-300 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-black focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-inner"
            />
          </div>

          {/* Quick Tramo Buttons */}
          <div className="grid grid-cols-6 gap-1 p-1 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
            {DEFAULT_TRAMOS.map((t) => {
              const isSelected = activeTramo === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTramoChange(t)}
                  className={`py-1 rounded-lg text-xs font-mono font-black text-center transition cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-blue-400 text-zinc-950 shadow-sm border border-blue-300'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700'
                  }`}
                >
                  T{t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
