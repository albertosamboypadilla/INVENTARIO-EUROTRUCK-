import React, { useState, useEffect } from 'react';
import { Lock, X, CheckCircle2, KeyRound } from 'lucide-react';

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
  itemTitle?: string;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Autorizar Acción',
  itemTitle,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        validatePin(newPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const validatePin = (inputPin: string) => {
    if (inputPin === '1989') {
      setError('');
      onSuccess();
    } else {
      setError('Clave de seguridad incorrecta. Por favor intente de nuevo.');
      setPin('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    validatePin(pin);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-white">{actionTitle}</h3>
          {itemTitle && (
            <p className="text-xs font-bold text-slate-300 bg-slate-800 py-1 px-3 rounded-xl border border-slate-700 inline-block">
              {itemTitle}
            </p>
          )}
          <p className="text-xs text-slate-400">
            Ingresa tu PIN de seguridad de 4 dígitos para autorizar esta operación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PIN Indicators */}
          <div className="flex justify-center gap-3 my-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-12 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black transition-all ${
                  pin.length > idx
                    ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow-md shadow-blue-500/10 scale-105'
                    : 'border-slate-800 bg-slate-950 text-slate-600'
                }`}
              >
                {pin.length > idx ? '•' : ''}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-700 rounded-xl text-center text-rose-300 text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="py-3 bg-slate-800/90 hover:bg-slate-700 active:bg-blue-600 text-white font-black text-lg rounded-2xl border border-slate-700 active:scale-95 transition cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-2xl border border-slate-700 cursor-pointer"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-3 bg-slate-800/90 hover:bg-slate-700 active:bg-blue-600 text-white font-black text-lg rounded-2xl border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDeleteDigit}
              className="py-3 bg-slate-800/60 hover:bg-slate-800 text-rose-400 font-bold text-xs rounded-2xl border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              ⌫ Borrar
            </button>
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-lg border border-blue-400/50 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar Clave</span>
          </button>
        </form>
      </div>
    </div>
  );
};
