import React from 'react';
import {
  Type,
  Plus,
  Sparkles,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  Layout,
} from 'lucide-react';
import { DocumentPage, FloatingTextElement } from '../types';

interface TextSidebarPanelProps {
  activePage: DocumentPage;
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
  onAddFloatingText: (preset?: Partial<FloatingTextElement>) => void;
  onUpdateFloatingText: (id: string, updated: Partial<FloatingTextElement>) => void;
  onDeleteFloatingText: (id: string) => void;
  onUpdateActivePage: (updated: Partial<DocumentPage>) => void;
}

export const TextSidebarPanel: React.FC<TextSidebarPanelProps> = ({
  activePage,
  selectedTextId,
  onSelectTextId,
  onAddFloatingText,
  onUpdateFloatingText,
  onDeleteFloatingText,
  onUpdateActivePage,
}) => {
  const floatingTexts = activePage.floatingTexts || [];

  return (
    <div className="p-4 space-y-6 text-slate-200">
      {/* 1. Add New Text Presets (Canva-style) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-sky-400" />
            <span>Tambahkan Teks Bebas</span>
          </label>
          <span className="text-[10px] text-slate-500">Bisa ditarik & diputar</span>
        </div>

        <div className="space-y-2">
          {/* Big Heading Preset */}
          <button
            onClick={() =>
              onAddFloatingText({
                text: 'MASUKAN TEKS',
                fontSize: 36,
                fontWeight: '900',
                fontFamily: 'Arial',
                color: '#000000',
                textAlign: 'center',
                rotation: 0,
                width: 380,
              })
            }
            className="w-full text-left p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 hover:border-sky-500/50 transition group flex items-center justify-between shadow-sm"
          >
            <div>
              <div className="text-base font-black text-white group-hover:text-sky-300 transition">
                MASUKAN TEKS JUDUL
              </div>
              <div className="text-[10px] text-slate-400">
                Teks tebal berukuran besar (Heading 36pt)
              </div>
            </div>
            <Plus className="w-4 h-4 text-sky-400 group-hover:scale-125 transition-transform" />
          </button>

          {/* Subheading Preset */}
          <button
            onClick={() =>
              onAddFloatingText({
                text: 'Tambahkan Subjudul',
                fontSize: 22,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                color: '#1e293b',
                textAlign: 'center',
                rotation: 0,
                width: 320,
              })
            }
            className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 hover:border-sky-500/50 transition group flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-bold text-slate-200 group-hover:text-sky-300">
                Tambahkan Subjudul
              </div>
              <div className="text-[10px] text-slate-400">
                Teks sedang untuk subbagian (22pt)
              </div>
            </div>
            <Plus className="w-4 h-4 text-sky-400 group-hover:scale-125 transition-transform" />
          </button>

          {/* Body Paragraph Preset */}
          <button
            onClick={() =>
              onAddFloatingText({
                text: 'Ketik teks isi deskripsi atau catatan tambahan di sini...',
                fontSize: 14,
                fontWeight: 'normal',
                fontFamily: 'Arial',
                color: '#334155',
                textAlign: 'left',
                rotation: 0,
                width: 300,
              })
            }
            className="w-full text-left p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/50 hover:border-sky-500/50 transition group flex items-center justify-between"
          >
            <div>
              <div className="text-xs text-slate-300 group-hover:text-white">
                Tambahkan sedikit teks isi
              </div>
              <div className="text-[10px] text-slate-500">Teks paragraf (14pt)</div>
            </div>
            <Plus className="w-4 h-4 text-sky-400 group-hover:scale-125 transition-transform" />
          </button>

          {/* Rotated & Styled Text Preset (matching user's screenshot) */}
          <button
            onClick={() =>
              onAddFloatingText({
                text: 'MASUKAN TEKS',
                fontSize: 28,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                color: '#000000',
                rotation: -14,
                textAlign: 'center',
                effect: 'outline',
                effectColor: '#6366f1',
                width: 320,
              })
            }
            className="w-full text-left p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-700/50 hover:border-indigo-500 transition group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-black text-indigo-300 group-hover:text-indigo-200 transform -rotate-2 origin-left inline-block">
                MASUKAN TEKS (Miring -14°)
              </div>
              <div className="text-[10px] text-indigo-400/80">
                Gaya teks dengan rotasi dan outline
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-125 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2. List of Active Floating Text Elements on This Page */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Elemen Teks Aktif ({floatingTexts.length})</span>
          </span>
        </label>

        {floatingTexts.length === 0 ? (
          <div className="p-3 bg-slate-900/80 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
            Belum ada teks bebas. Klik salah satu tombol di atas untuk menambahkan.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {floatingTexts.map((ft, idx) => (
              <div
                key={ft.id}
                onClick={() => onSelectTextId(ft.id)}
                className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                  selectedTextId === ft.id
                    ? 'bg-sky-950 border-sky-500 text-white'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                  <span
                    className="text-xs font-semibold truncate block"
                    style={{ fontFamily: ft.fontFamily }}
                  >
                    {ft.text || '(Teks Kosong)'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400 px-1 py-0.5 rounded bg-slate-800">
                    {Math.round(ft.rotation || 0)}°
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFloatingText(ft.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                    title="Hapus Teks"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Photo-grid visibility */}
      <div className="pt-4 border-t border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-sky-400" />
          <span>Pengaturan Lembar</span>
        </label>
        <p className="text-[10px] text-slate-500 mb-3">
          Tampilkan atau sembunyikan kisi foto pada halaman aktif.
        </p>

        <div className="space-y-2">
          {/* Grid Kolase Foto */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-300">Kisi Kolase Foto</span>
            <button
              onClick={() =>
                onUpdateActivePage({
                  showCollageGrid: activePage.showCollageGrid === false ? true : false,
                })
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                activePage.showCollageGrid !== false
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {activePage.showCollageGrid !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{activePage.showCollageGrid !== false ? 'Tampil' : 'Sembunyi'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
