import React from 'react';
import { Type, Calendar, MapPin, Users, FileSignature, AlignLeft, HelpCircle } from 'lucide-react';
import { DocumentPage, DocumentProject, MetaTableItem } from '../types';

interface TextEditorPanelProps {
  project: DocumentProject;
  activePage: DocumentPage;
  onUpdateActivePage: (updated: Partial<DocumentPage>) => void;
  onUpdateProject: (updated: Partial<DocumentProject>) => void;
}

export const TextEditorPanel: React.FC<TextEditorPanelProps> = ({
  project,
  activePage,
  onUpdateActivePage,
  onUpdateProject,
}) => {
  const metaTable = activePage.metaTable || [];

  const handleMetaChange = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...metaTable];
    updated[index] = { ...updated[index], [field]: val };
    onUpdateActivePage({ metaTable: updated });
  };

  const handleAddMetaRow = () => {
    const updated = [...metaTable, { label: 'Keterangan Lain', value: '-' }];
    onUpdateActivePage({ metaTable: updated });
  };

  const handleRemoveMetaRow = (index: number) => {
    const updated = metaTable.filter((_, i) => i !== index);
    onUpdateActivePage({ metaTable: updated });
  };

  const signature = activePage.signatureBlock || {
    enabled: true,
    cityAndDate: 'Bitung, 17 Agustus 2026',
    roleTitle: 'Kepala Bagian Persidangan dan Risalah',
    officerName: 'SEKRETARIAT DPRD KOTA BITUNG',
    nip: 'NIP. 19800512 200501 1 008',
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
      <div>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Type className="w-4 h-4 text-sky-600" />
          Teks & Informasi Dokumen
        </h3>
        <p className="text-xs text-slate-500">
          Atur judul laporan, jadwal kegiatan, dan tanda tangan resmi Setwan
        </p>
      </div>

      {/* Font Selection */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <label className="text-xs font-bold text-slate-700 block">Jenis Font Dokumen</label>
        <div className="grid grid-cols-3 gap-2">
          {['Arial', 'Times New Roman', 'Calibri'].map((font) => (
            <button
              key={font}
              onClick={() => onUpdateProject({ fontFamily: font })}
              className={`p-2 text-xs rounded-lg border text-center transition ${
                project.fontFamily === font
                  ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Judul Laporan */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">
          Judul Laporan Dokumentasi
        </label>
        <textarea
          rows={2}
          value={activePage.title}
          onChange={(e) => onUpdateActivePage({ title: e.target.value })}
          placeholder="LAPORAN DOKUMENTASI KEGIATAN..."
          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 uppercase"
        />
      </div>

      {/* Subjudul */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">
          Subjudul / Masa Sidang (Opsional)
        </label>
        <input
          type="text"
          value={activePage.subtitle || ''}
          onChange={(e) => onUpdateActivePage({ subtitle: e.target.value })}
          placeholder="Contoh: Masa Persidangan Ketiga Tahun Sidang 2025/2026"
          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 italic"
        />
      </div>

      {/* Meta Table Items (Hari, Tanggal, Tempat, Peserta) */}
      <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">Tabel Informasi Jadwal & Tempat</label>
          <button
            onClick={handleAddMetaRow}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-700"
          >
            + Tambah Baris
          </button>
        </div>

        <div className="space-y-2">
          {metaTable.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleMetaChange(idx, 'label', e.target.value)}
                className="w-1/3 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              />
              <span className="text-xs text-slate-400">:</span>
              <input
                type="text"
                value={item.value}
                onChange={(e) => handleMetaChange(idx, 'value', e.target.value)}
                className="w-2/3 p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
              />
              <button
                onClick={() => handleRemoveMetaRow(idx)}
                className="text-slate-400 hover:text-red-500 p-1 text-xs"
                title="Hapus baris"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Deskripsi Kegiatan */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">
          Uraian Ringkas Kegiatan
        </label>
        <textarea
          rows={3}
          value={activePage.activityDescription || ''}
          onChange={(e) => onUpdateActivePage({ activityDescription: e.target.value })}
          placeholder="Tuliskan uraian ringkas mengenai jalannya kegiatan sekretariat dewan..."
          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Tanda Tangan Resmi */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileSignature className="w-4 h-4 text-sky-600" />
            Blok Tanda Tangan Resmi
          </label>
          <input
            type="checkbox"
            checked={signature.enabled}
            onChange={(e) =>
              onUpdateActivePage({
                signatureBlock: { ...signature, enabled: e.target.checked },
              })
            }
            className="w-4 h-4 rounded text-sky-600"
          />
        </div>

        {signature.enabled && (
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <div>
              <label className="text-[11px] text-slate-500">Tempat & Tanggal Surat</label>
              <input
                type="text"
                value={signature.cityAndDate}
                onChange={(e) =>
                  onUpdateActivePage({
                    signatureBlock: { ...signature, cityAndDate: e.target.value },
                  })
                }
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Jabatan Penandatangan</label>
              <input
                type="text"
                value={signature.roleTitle}
                onChange={(e) =>
                  onUpdateActivePage({
                    signatureBlock: { ...signature, roleTitle: e.target.value },
                  })
                }
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Nama Pejabat / Lembaga</label>
              <input
                type="text"
                value={signature.officerName}
                onChange={(e) =>
                  onUpdateActivePage({
                    signatureBlock: { ...signature, officerName: e.target.value },
                  })
                }
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500">NIP (Nomor Induk Pegawai)</label>
              <input
                type="text"
                value={signature.nip}
                onChange={(e) =>
                  onUpdateActivePage({
                    signatureBlock: { ...signature, nip: e.target.value },
                  })
                }
                className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
