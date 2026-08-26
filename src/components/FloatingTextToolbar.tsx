import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Trash2,
  Copy,
  Lock,
  Unlock,
  RotateCw,
  Sparkles,
  Plus,
  Minus,
  Palette,
  Type,
  List,
  Sliders,
  ChevronDown,
  Layers,
  Check,
  X,
  Move,
} from 'lucide-react';
import { FloatingTextElement, TextEffectType } from '../types';
import { AVAILABLE_FONTS, COLOR_PALETTES } from '../utils/constants';

interface FloatingTextToolbarProps {
  selectedText: FloatingTextElement | null;
  onUpdateText: (updated: Partial<FloatingTextElement>) => void;
  onDeleteText: (id: string) => void;
  onDuplicateText: (id: string) => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onCenterPage?: () => void;
  onClose?: () => void;
}

export const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  selectedText,
  onUpdateText,
  onDeleteText,
  onDuplicateText,
  onBringToFront,
  onSendToBack,
  onCenterPage,
  onClose,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showEffectsDropdown, setShowEffectsDropdown] = useState(false);
  const [showSpacingPopover, setShowSpacingPopover] = useState(false);
  const [showPositionPopover, setShowPositionPopover] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close sub-popovers on outside click (within toolbar context)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
        setShowFontDropdown(false);
        setShowEffectsDropdown(false);
        setShowSpacingPopover(false);
        setShowPositionPopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!selectedText) return null;

  const currentFont =
    AVAILABLE_FONTS.find((f) => f.name === selectedText.fontFamily) ||
    AVAILABLE_FONTS[0];

  const handleToggleBold = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isBold = selectedText.fontWeight === 'bold' || selectedText.fontWeight === '900';
    onUpdateText({ fontWeight: isBold ? 'normal' : 'bold' });
  };

  const handleToggleItalic = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateText({
      fontStyle: selectedText.fontStyle === 'italic' ? 'normal' : 'italic',
    });
  };

  const handleToggleUnderline = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateText({
      textDecoration:
        selectedText.textDecoration === 'underline' ? 'none' : 'underline',
    });
  };

  const handleToggleStrikethrough = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateText({
      textDecoration:
        selectedText.textDecoration === 'line-through' ? 'none' : 'line-through',
    });
  };

  const handleToggleCase = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = selectedText.textTransform || 'none';
    const next =
      current === 'none'
        ? 'uppercase'
        : current === 'uppercase'
        ? 'lowercase'
        : current === 'lowercase'
        ? 'capitalize'
        : 'none';
    onUpdateText({ textTransform: next });
  };

  const handleToggleBullet = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentLines = selectedText.text.split('\n');
    const isBulleted = currentLines.every((l) => l.startsWith('• '));

    let newText = '';
    if (isBulleted) {
      newText = currentLines.map((l) => l.replace(/^•\s*/, '')).join('\n');
      onUpdateText({ text: newText, listType: 'none' });
    } else {
      newText = currentLines.map((l) => (l.startsWith('• ') ? l : `• ${l}`)).join('\n');
      onUpdateText({ text: newText, listType: 'bullet' });
    }
  };

  const handleSetAlignment = (e: React.MouseEvent, align: 'left' | 'center' | 'right' | 'justify') => {
    e.stopPropagation();
    onUpdateText({ textAlign: align });
  };

  const handleFontSizeDelta = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSize = Math.max(6, Math.min(220, +(selectedText.fontSize + delta).toFixed(1)));
    onUpdateText({ fontSize: nextSize });
  };

  const effects: { id: TextEffectType; label: string; desc: string; previewClass: string }[] = [
    { id: 'none', label: 'Normal', desc: 'Tanpa efek tambahan', previewClass: 'text-white' },
    { id: 'shadow', label: 'Bayangan (Shadow)', desc: 'Bayangan teks lembut elegan', previewClass: 'drop-shadow-md' },
    { id: 'outline', label: 'Garis Tepi (Stroke)', desc: 'Garis luar kontras terbaca', previewClass: 'border-b border-indigo-400' },
    { id: 'neon', label: 'Neon / Menyala', desc: 'Pendaran neon cerah', previewClass: 'text-cyan-300 drop-shadow-[0_0_8px_#06b6d4]' },
    { id: 'glow', label: 'Glow Halus', desc: 'Kilau cahaya putih lembut', previewClass: 'drop-shadow-[0_0_6px_#fff]' },
    { id: 'background', label: 'Kotak Sorotan', desc: 'Latar belakang warna', previewClass: 'bg-yellow-400/30 px-1 rounded' },
  ];

  return (
    <div
      ref={containerRef}
      id="floating-text-toolbar"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="bg-slate-900/98 backdrop-blur-md text-white border border-slate-700/90 rounded-2xl shadow-2xl px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none max-w-[95vw]"
    >
      {/* Drag / Label indicator */}
      <div className="flex items-center gap-1 pl-1 pr-1.5 text-[11px] font-bold text-indigo-300 border-r border-slate-700/80">
        <Type className="w-3.5 h-3.5" />
        <span>Teks</span>
      </div>

      {/* 1. Font Family Dropdown */}
      <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFontDropdown(!showFontDropdown);
            setShowColorPicker(false);
            setShowEffectsDropdown(false);
            setShowSpacingPopover(false);
            setShowPositionPopover(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-100 border border-slate-700 min-w-[130px] max-w-[150px] justify-between transition active:scale-95 shadow-sm"
          title="Pilih Jenis Font Tipografi"
        >
          <span
            className="truncate text-xs font-medium"
            style={{ fontFamily: selectedText.fontFamily }}
          >
            {selectedText.fontFamily}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </button>

        {showFontDropdown && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 max-h-72 overflow-y-auto ring-1 ring-black/50"
          >
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 border-b border-slate-800 mb-1">
              Pilihan Font Tipografi Resmi
            </div>
            <div className="space-y-0.5">
              {AVAILABLE_FONTS.map((font) => (
                <button
                  key={font.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateText({ fontFamily: font.name });
                    setShowFontDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                    selectedText.fontFamily === font.name
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span style={{ fontFamily: font.name }} className="text-sm">
                    {font.name}
                  </span>
                  <span className="text-[9px] text-slate-400 opacity-75">
                    {font.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

      {/* 2. Font Size Controls (- [Size Input] +) */}
      <div
        className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 shadow-inner"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => handleFontSizeDelta(e, -1)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
          title="Kecilkan Font (Minus)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="number"
          step="0.5"
          min="6"
          max="220"
          value={selectedText.fontSize}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val >= 4 && val <= 250) {
              onUpdateText({ fontSize: val });
            }
          }}
          className="w-12 text-center bg-transparent text-xs font-mono font-extrabold text-white focus:outline-none focus:bg-slate-700/50 rounded"
          title="Ketik Ukuran Font Langsung"
        />

        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => handleFontSizeDelta(e, +1)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
          title="Besarkan Font (Plus)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Text Color Picker 'A' with color indicator */}
      <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
            setShowFontDropdown(false);
            setShowEffectsDropdown(false);
            setShowSpacingPopover(false);
            setShowPositionPopover(false);
          }}
          className={`flex flex-col items-center justify-center w-8 h-8 rounded-xl border transition ${
            showColorPicker
              ? 'bg-slate-700 border-indigo-500 ring-2 ring-indigo-500/30'
              : 'bg-slate-800 hover:bg-slate-750 border-slate-700 shadow-sm'
          }`}
          title="Warna Teks (A)"
        >
          <span className="text-xs font-black text-white leading-none">A</span>
          <div
            className="w-4 h-1 rounded-full mt-0.5 shadow-xs"
            style={{ backgroundColor: selectedText.color || '#000000' }}
          />
        </button>

        {showColorPicker && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 w-64 ring-1 ring-black/50"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
              Palet Warna Dokumen Resmi
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {COLOR_PALETTES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateText({ color: c });
                  }}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-transform hover:scale-110 shadow-xs ${
                    selectedText.color === c
                      ? 'ring-2 ring-indigo-400 border-white scale-105'
                      : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {selectedText.color === c && (
                    <Check className={`w-3.5 h-3.5 ${c === '#ffffff' || c === '#fef08a' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Kustom:</span>
              <input
                type="color"
                value={selectedText.color || '#000000'}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateText({ color: e.target.value });
                }}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={selectedText.color || '#000000'}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateText({ color: e.target.value });
                }}
                className="flex-1 text-xs font-mono uppercase bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

      {/* 4. Font Style Toggles (B, I, U, S, aA) */}
      <div
        className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 gap-0.5 shadow-inner"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bold */}
        <button
          type="button"
          onClick={handleToggleBold}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.fontWeight === 'bold' || selectedText.fontWeight === '900'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Tebal (Bold / Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={handleToggleItalic}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.fontStyle === 'italic'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Miring (Italic / Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={handleToggleUnderline}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.textDecoration === 'underline'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Garis Bawah (Underline / Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={handleToggleStrikethrough}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.textDecoration === 'line-through'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Coretan (Strikethrough)"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        {/* Case Switcher (aA) */}
        <button
          type="button"
          onClick={handleToggleCase}
          className={`px-1.5 py-1 rounded-lg text-[11px] font-bold font-mono transition ${
            selectedText.textTransform && selectedText.textTransform !== 'none'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title={`Ubah Huruf Besar/Kecil (Saat ini: ${selectedText.textTransform || 'asli'})`}
        >
          aA
        </button>
      </div>

      <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

      {/* 5. Alignment Controls (Left, Center, Right, Justify) */}
      <div
        className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 gap-0.5 shadow-inner"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => handleSetAlignment(e, 'left')}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.textAlign === 'left'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Rata Kiri"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => handleSetAlignment(e, 'center')}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.textAlign === 'center' || !selectedText.textAlign
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Rata Tengah"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => handleSetAlignment(e, 'right')}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.textAlign === 'right'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Rata Kanan"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => handleSetAlignment(e, 'justify')}
          className={`p-1.5 rounded-lg text-xs transition ${
            selectedText.textAlign === 'justify'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title="Rata Kiri-Kanan (Justify)"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 6. Bullets */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleToggleBullet}
        className={`p-1.5 rounded-xl border transition ${
          selectedText.listType === 'bullet'
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
            : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
        }`}
        title="Daftar Berbutir (Bullets •)"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      {/* 7. Spacing Popover (Jarak Huruf & Baris) */}
      <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowSpacingPopover(!showSpacingPopover);
            setShowFontDropdown(false);
            setShowColorPicker(false);
            setShowEffectsDropdown(false);
            setShowPositionPopover(false);
          }}
          className={`p-1.5 rounded-xl border transition ${
            showSpacingPopover
              ? 'bg-slate-700 border-indigo-500 ring-2 ring-indigo-500/30'
              : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Jarak Antar Huruf & Baris"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {showSpacingPopover && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 w-60 space-y-3 ring-1 ring-black/50"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              Pengaturan Spasi Teks
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Jarak Huruf</span>
                <span className="font-mono">{selectedText.letterSpacing || 0}px</span>
              </div>
              <input
                type="range"
                min="-2"
                max="20"
                step="0.5"
                value={selectedText.letterSpacing || 0}
                onChange={(e) =>
                  onUpdateText({ letterSpacing: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Jarak Baris</span>
                <span className="font-mono">{selectedText.lineHeight || 1.2}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={selectedText.lineHeight || 1.2}
                onChange={(e) =>
                  onUpdateText({ lineHeight: parseFloat(e.target.value) })
                }
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 8. Text Effects (Efek: Shadow, Outline, Neon, Glow, Background) */}
      <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowEffectsDropdown(!showEffectsDropdown);
            setShowFontDropdown(false);
            setShowColorPicker(false);
            setShowSpacingPopover(false);
            setShowPositionPopover(false);
          }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-semibold transition ${
            selectedText.effect && selectedText.effect !== 'none'
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
              : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Efek Teks Visual"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Efek</span>
        </button>

        {showEffectsDropdown && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 ring-1 ring-black/50 space-y-1"
          >
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 border-b border-slate-800 mb-1">
              Pilihan Efek Visual Teks
            </div>
            {effects.map((eff) => (
              <button
                key={eff.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateText({ effect: eff.id });
                  setShowEffectsDropdown(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                  selectedText.effect === eff.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-semibold">{eff.label}</div>
                  <div className="text-[10px] text-slate-400">{eff.desc}</div>
                </div>
                {selectedText.effect === eff.id && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))}

            {/* If Outline or Neon or Shadow selected, show color picker */}
            {selectedText.effect && selectedText.effect !== 'none' && (
              <div className="pt-2 mt-2 border-t border-slate-800 px-2 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Warna Efek:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedText.effectColor || '#4f46e5'}
                    onChange={(e) =>
                      onUpdateText({ effectColor: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[11px] font-mono text-slate-300">
                    {selectedText.effectColor || '#4f46e5'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

      {/* 9. Layering & Position Actions (Depan, Belakang, Tengah, Kunci) */}
      <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPositionPopover(!showPositionPopover);
            setShowFontDropdown(false);
            setShowColorPicker(false);
            setShowEffectsDropdown(false);
            setShowSpacingPopover(false);
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition shadow-sm"
          title="Posisi & Urutan Lapisan (Layer)"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Posisi</span>
        </button>

        {showPositionPopover && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 ring-1 ring-black/50 space-y-1"
          >
            {onCenterPage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCenterPage();
                  setShowPositionPopover(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Move className="w-3.5 h-3.5 text-sky-400" />
                <span>Pusatkan di Lembar</span>
              </button>
            )}
            {onBringToFront && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBringToFront();
                  setShowPositionPopover(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bawa ke Paling Depan</span>
              </button>
            )}
            {onSendToBack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendToBack();
                  setShowPositionPopover(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Kirim ke Paling Belakang</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateText({ isLocked: !selectedText.isLocked });
                setShowPositionPopover(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
            >
              {selectedText.isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Buka Kunci Posisi</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kunci Posisi Teks</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 10. Duplicate */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDuplicateText(selectedText.id);
        }}
        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
        title="Duplikasi Teks (Salin)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* 11. Delete */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteText(selectedText.id);
        }}
        className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white transition shadow-sm"
        title="Hapus Teks Ini"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* 12. Close / Deselect */}
      {onClose && (
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
          title="Tutup Bilah Teks"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
