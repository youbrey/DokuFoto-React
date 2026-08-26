import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  Eye,
  Download,
  Settings,
  Plus,
  Save,
  FolderOpen,
  Archive,
  Sparkles,
  Layers,
} from 'lucide-react';
import { DocumentProject } from '../types';

interface NavbarProps {
  project: DocumentProject;
  onUpdateProject: (updated: Partial<DocumentProject>) => void;
  onOpenDocxExport: () => void;
  onOpenPrintPreview: () => void;
  onOpenPaperModal: () => void;
  onNewProject: () => void;
  isExportingDocx: boolean;
  onOpenAutoCollage?: () => void;
  onSaveProjectJson?: () => void;
  onLoadProjectJson?: (project: DocumentProject) => void;
  onExportArchiveZip?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  onUpdateProject,
  onOpenDocxExport,
  onOpenPrintPreview,
  onOpenPaperModal,
  onNewProject,
  isExportingDocx,
  onOpenAutoCollage,
  onSaveProjectJson,
  onLoadProjectJson,
  onExportArchiveZip,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.pages && onLoadProjectJson) {
          onLoadProjectJson(json);
        }
      } catch (err) {
        console.error('Gagal membaca file proyek:', err);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white select-none z-30 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-sky-950/50 border border-sky-400/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                Setwan <span className="text-sky-400">DokuFoto</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/80">
                DPRD Kota Bitung
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Pembuat Kolase Foto Resmi & Laporan Dokumentasi (.docx)
            </p>
          </div>
        </div>

        {/* Center: Title & Paper Specs */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner max-w-sm w-full">
          <input
            type="text"
            value={project.title}
            onChange={(e) => onUpdateProject({ title: e.target.value })}
            placeholder="Judul Dokumen Dokumentasi..."
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none focus:text-white w-full truncate"
            title="Klik untuk mengubah nama dokumen"
          />
          <button
            onClick={onOpenPaperModal}
            className="flex-shrink-0 text-[11px] font-medium text-slate-400 hover:text-sky-300 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 border border-slate-700/50"
            title="Ubah Ukuran Kertas & Margin"
          >
            <span>{project.paperSize}</span>
            <span className="text-slate-500">|</span>
            <span className="capitalize">{project.orientation}</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* File Operations: New, Open, Save */}
          <button
            onClick={onNewProject}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
            title="Buat Dokumen Baru"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.dokufoto.json"
            className="hidden"
            onChange={handleOpenFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
            title="Buka File Proyek (.dokufoto.json)"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {onSaveProjectJson && (
            <button
              onClick={onSaveProjectJson}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
              title="Simpan Proyek (.dokufoto.json)"
            >
              <Save className="w-4 h-4 text-sky-400" />
            </button>
          )}

          {onExportArchiveZip && (
            <button
              onClick={onExportArchiveZip}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition hidden sm:inline-flex"
              title="Unduh Arsip Cadangan Proyek (.zip)"
            >
              <Archive className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Auto Kolase */}
          {onOpenAutoCollage && (
            <button
              onClick={onOpenAutoCollage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 shadow-md shadow-sky-900/40 border border-sky-400/40 transition active:scale-95"
              title="Studio Auto Kisi Kolase Foto Otomatis"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Auto Kolase</span>
            </button>
          )}

          {/* Paper Settings */}
          <button
            onClick={onOpenPaperModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
            title="Atur Kertas & Margin"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Kertas</span>
          </button>

          {/* Pratinjau Cetak */}
          <button
            onClick={onOpenPrintPreview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600/70 transition shadow-sm"
            title="Pratinjau sebelum mencetak"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cetak</span>
          </button>

          {/* Export to .DOCX */}
          <button
            onClick={onOpenDocxExport}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-md shadow-sky-900/40 border border-sky-400/30 transition disabled:opacity-50"
            title="Ekspor langsung ke format Microsoft Word .docx asli"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>{isExportingDocx ? 'Membuat...' : 'Ekspor .DOCX'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

