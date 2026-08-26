import React, { useRef } from 'react';
import { Landmark, Shield, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { KopSuratData } from '../types';
import { BITUNG_LOGO_SVG, BITUNG_DIGITAL_LOGO_SVG, GARUDA_LOGO_SVG } from '../utils/constants';
import { readImageFile } from '../utils/imageFiles';

interface KopSuratPanelProps {
  kopSurat: KopSuratData;
  onUpdateKopSurat: (updated: Partial<KopSuratData>) => void;
  onImportError?: (message: string) => void;
}

export const KopSuratPanel: React.FC<KopSuratPanelProps> = ({
  kopSurat,
  onUpdateKopSurat,
  onImportError,
}) => {
  const leftLogoInputRef = useRef<HTMLInputElement>(null);
  const rightLogoInputRef = useRef<HTMLInputElement>(null);

  const handleCustomLogo = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'left' | 'right'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImageFile(file, 'Logo Kop Surat')
      .then((photo) => {
        if (side === 'left') {
          onUpdateKopSurat({ logoLeftUrl: photo.dataUrl });
        } else {
          onUpdateKopSurat({ logoRightUrl: photo.dataUrl });
        }
      })
      .catch((error) => {
        onImportError?.(error instanceof Error ? error.message : 'Logo gagal dibaca.');
      });
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-sky-600" />
            Kop Surat Resmi Sekretariat
          </h3>
          <p className="text-xs text-slate-500">
            Kop surat formal dengan logo daerah dan garis ganda standar
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={kopSurat.enabled}
            onChange={(e) => onUpdateKopSurat({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
        </label>
      </div>

      {kopSurat.enabled && (
        <div className="space-y-4">
          {/* Logo Selection Section */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Logo Lambang Daerah (Kiri & Kanan)
            </label>

            {/* Left Logo Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Logo Sisi Kiri (Lambang Kota)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateKopSurat({ logoLeftUrl: BITUNG_LOGO_SVG })}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${
                    kopSurat.logoLeftUrl === BITUNG_LOGO_SVG
                      ? 'bg-sky-50 border-sky-500 font-bold text-sky-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <img src={BITUNG_LOGO_SVG} alt="Bitung" className="w-5 h-6 object-contain" />
                  <span>Lambang Bitung</span>
                </button>

                <button
                  onClick={() => onUpdateKopSurat({ logoLeftUrl: GARUDA_LOGO_SVG })}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${
                    kopSurat.logoLeftUrl === GARUDA_LOGO_SVG
                      ? 'bg-sky-50 border-sky-500 font-bold text-sky-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <img src={GARUDA_LOGO_SVG} alt="Garuda" className="w-5 h-5 object-contain" />
                  <span>Garuda</span>
                </button>

                <input
                  ref={leftLogoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCustomLogo(e, 'left')}
                />
                <button
                  onClick={() => leftLogoInputRef.current?.click()}
                  className="p-1.5 rounded-lg border border-dashed border-slate-300 hover:border-sky-500 text-xs text-slate-600 flex items-center gap-1 bg-white"
                  title="Unggah logo dari file sendiri"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Unggah</span>
                </button>
              </div>
            </div>

            {/* Right Logo Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600">Logo Sisi Kanan (Opsional)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateKopSurat({ logoRightUrl: BITUNG_DIGITAL_LOGO_SVG })}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${
                    kopSurat.logoRightUrl === BITUNG_DIGITAL_LOGO_SVG
                      ? 'bg-sky-50 border-sky-500 font-bold text-sky-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <img src={BITUNG_DIGITAL_LOGO_SVG} alt="Bitung Digital" className="w-10 h-5 object-contain" />
                  <span>Bitung Digital</span>
                </button>

                <button
                  onClick={() => onUpdateKopSurat({ logoRightUrl: undefined })}
                  className={`p-1.5 rounded-lg border text-xs ${
                    !kopSurat.logoRightUrl
                      ? 'bg-sky-50 border-sky-500 font-bold text-sky-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <span>Tanpa Logo Kanan</span>
                </button>

                <input
                  ref={rightLogoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCustomLogo(e, 'right')}
                />
                <button
                  onClick={() => rightLogoInputRef.current?.click()}
                  className="p-1.5 rounded-lg border border-dashed border-slate-300 hover:border-sky-500 text-xs text-slate-600 flex items-center gap-1 bg-white"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Unggah</span>
                </button>
              </div>
            </div>
          </div>

          {/* Text Information for Header */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block">Pemerintah Daerah</label>
              <input
                type="text"
                value={kopSurat.governmentName}
                onChange={(e) => onUpdateKopSurat({ governmentName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block">Nama Lembaga</label>
              <input
                type="text"
                value={kopSurat.agencyName}
                onChange={(e) => onUpdateKopSurat({ agencyName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block">Nama Bagian / Sekretariat</label>
              <input
                type="text"
                value={kopSurat.subAgencyName || ''}
                onChange={(e) => onUpdateKopSurat({ subAgencyName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block">Alamat Kantor</label>
              <input
                type="text"
                value={kopSurat.address}
                onChange={(e) => onUpdateKopSurat({ address: e.target.value })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block">Kontak, Website & Email</label>
              <input
                type="text"
                value={kopSurat.contactInfo}
                onChange={(e) => onUpdateKopSurat({ contactInfo: e.target.value })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
