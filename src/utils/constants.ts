import { CollageLayoutTemplate, PaperDimensions, PaperSizeType, DocumentProject } from '../types';

// Preset Paper Sizes (standard in Indonesian government & world)
export const PAPER_DIMENSIONS: Record<PaperSizeType, PaperDimensions> = {
  A4: {
    widthMm: 210,
    heightMm: 297,
    name: 'A4',
    description: '210 x 297 mm (Standar Internasional)',
  },
  F4: {
    widthMm: 215,
    heightMm: 330,
    name: 'F4 / Folio',
    description: '215 x 330 mm (Standar Dokumen Setwan/Pemerintahan Indonesia)',
  },
  Letter: {
    widthMm: 215.9,
    heightMm: 279.4,
    name: 'Letter (Kuarto)',
    description: '215.9 x 279.4 mm',
  },
  Legal: {
    widthMm: 215.9,
    heightMm: 355.6,
    name: 'Legal',
    description: '215.9 x 355.6 mm',
  },
  Custom: {
    widthMm: 210,
    heightMm: 297,
    name: 'Kustom',
    description: 'Ukuran Disesuaikan Manual',
  },
};

// Preset SVG Logos for Setwan Kota Bitung & Garuda / Setwan
export const BITUNG_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
  <path d="M50 5 L88 20 L88 65 C88 95 50 115 50 115 C50 115 12 95 12 65 L12 20 Z" fill="%230284c7" stroke="%23f59e0b" stroke-width="3"/>
  <path d="M50 12 L82 25 L82 65 C82 90 50 108 50 108 C50 108 18 90 18 65 L18 25 Z" fill="%23ffffff"/>
  <circle cx="50" cy="48" r="24" fill="%23e0f2fe" stroke="%230284c7" stroke-width="2"/>
  <path d="M50 28 L58 40 L42 40 Z" fill="%2316a34a"/>
  <path d="M38 42 L50 34 L62 42 L58 58 L42 58 Z" fill="%2315803d"/>
  <path d="M30 62 C40 58 60 58 70 62 C60 68 40 68 30 62 Z" fill="%230284c7"/>
  <path d="M25 72 C35 68 65 68 75 72 C65 78 35 78 25 72 Z" fill="%230369a1"/>
  <rect x="22" y="85" width="56" height="14" rx="3" fill="%23dc2626"/>
  <text x="50" y="95" font-family="Arial, sans-serif" font-size="7.5" font-weight="bold" fill="%23ffffff" text-anchor="middle">KOTA BITUNG</text>
  <circle cx="50" cy="22" r="5" fill="%23fbbf24"/>
</svg>`;

export const BITUNG_DIGITAL_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 60" width="180" height="60">
  <g transform="translate(5, 5)">
    <circle cx="25" cy="25" r="18" fill="none" stroke="%23ec4899" stroke-width="3"/>
    <circle cx="25" cy="25" r="7" fill="%23be185d"/>
    <circle cx="25" cy="7" r="3.5" fill="%23ec4899"/>
    <circle cx="25" cy="43" r="3.5" fill="%23ec4899"/>
    <circle cx="7" cy="25" r="3.5" fill="%23ec4899"/>
    <circle cx="43" cy="25" r="3.5" fill="%23ec4899"/>
  </g>
  <text x="60" y="28" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="%23831843">bitung</text>
  <text x="60" y="44" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23be185d" letter-spacing="2">KOTA DIGITAL</text>
</svg>`;

export const GARUDA_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="46" fill="%23fef3c7" stroke="%23d97706" stroke-width="2"/>
  <path d="M50 15 L55 35 L75 35 L60 48 L65 68 L50 55 L35 68 L40 48 L25 35 L45 35 Z" fill="%23d97706"/>
  <circle cx="50" cy="50" r="12" fill="%23b91c1c"/>
  <rect x="25" y="74" width="50" height="10" rx="2" fill="%23ffffff" stroke="%23d97706"/>
  <text x="50" y="81" font-family="Arial, sans-serif" font-size="5" font-weight="bold" fill="%231e293b" text-anchor="middle">BHINNEKA TUNGGAL IKA</text>
</svg>`;

// Preset Collage Layouts
export const COLLAGE_LAYOUTS: CollageLayoutTemplate[] = [
  {
    id: 'grid-1',
    name: '1 Foto Utama (Utuh)',
    description: '1 foto besar memenuhi halaman, ideal untuk foto bersama paripurna atau peresmian',
    category: '1-foto',
    rows: 1,
    cols: 1,
    cells: [{ row: 0, col: 0, defaultAspectRatio: '16:9' }],
  },
  {
    id: 'grid-2-vert',
    name: '2 Foto (Atas-Bawah)',
    description: '2 foto bertumpuk vertikal dengan proporsi seimbang',
    category: '2-foto',
    rows: 2,
    cols: 1,
    cells: [
      { row: 0, col: 0, defaultAspectRatio: '16:9' },
      { row: 1, col: 0, defaultAspectRatio: '16:9' },
    ],
  },
  {
    id: 'grid-2-horiz',
    name: '2 Foto (Kiri-Kanan)',
    description: '2 foto bersandingan horizontal (portrait/landscape)',
    category: '2-foto',
    rows: 1,
    cols: 2,
    cells: [
      { row: 0, col: 0, defaultAspectRatio: '4:3' },
      { row: 0, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-3-top1-bot2',
    name: '3 Foto (1 Atas, 2 Bawah)',
    description: '1 foto utama di atas, 2 foto pendukung di bawah',
    category: '3-foto',
    rows: 2,
    cols: 2,
    cells: [
      { row: 0, col: 0, colSpan: 2, defaultAspectRatio: '16:9' },
      { row: 1, col: 0, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-3-left1-right2',
    name: '3 Foto (1 Kiri Besar, 2 Kanan)',
    description: '1 foto vertikal di kiri, 2 foto bertumpuk di kanan',
    category: '3-foto',
    rows: 2,
    cols: 2,
    cells: [
      { row: 0, col: 0, rowSpan: 2, defaultAspectRatio: '3:4' },
      { row: 0, col: 1, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-4-1top-1left-2right',
    name: '4 Foto Asimetris (1 Banner Atas, 1 Kiri Tinggi, 2 Kanan)',
    description: 'Template asimetris resmi: 1 banner atas lebar, 1 foto portrait tinggi di kiri, dan 2 foto bertumpuk di kanan',
    category: '4-foto',
    rows: 3,
    cols: 2,
    cells: [
      { row: 0, col: 0, colSpan: 2, defaultAspectRatio: '16:9' },
      { row: 1, col: 0, rowSpan: 2, defaultAspectRatio: '3:4' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
      { row: 2, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-4-2x2',
    name: '4 Foto (Kisi 2x2 Standar)',
    description: 'Layout terpopuler Setwan: 4 foto simetris dengan stempel keterangan',
    category: '4-foto',
    rows: 2,
    cols: 2,
    cells: [
      { row: 0, col: 0, defaultAspectRatio: '4:3' },
      { row: 0, col: 1, defaultAspectRatio: '4:3' },
      { row: 1, col: 0, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-5-1-2-2',
    name: '5 Foto (1 Banner Atas, 2 Tengah, 2 Bawah)',
    description: 'Template 5 foto resmi: 1 banner utama di atas diikuti 4 foto simetris 2x2 di bawahnya',
    category: '5-foto',
    rows: 3,
    cols: 2,
    cells: [
      { row: 0, col: 0, colSpan: 2, defaultAspectRatio: '16:9' },
      { row: 1, col: 0, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
      { row: 2, col: 0, defaultAspectRatio: '4:3' },
      { row: 2, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-6-1-2-2-1',
    name: '6 Foto (1 Banner Atas, 4 Tengah, 1 Banner Bawah)',
    description: 'Template 6 foto resmi: 1 banner atas lebar, 4 foto berpasangan di tengah, dan 1 banner penutup di bawah',
    category: '6-foto',
    rows: 4,
    cols: 2,
    cells: [
      { row: 0, col: 0, colSpan: 2, defaultAspectRatio: '16:9' },
      { row: 1, col: 0, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
      { row: 2, col: 0, defaultAspectRatio: '4:3' },
      { row: 2, col: 1, defaultAspectRatio: '4:3' },
      { row: 3, col: 0, colSpan: 2, defaultAspectRatio: '16:9' },
    ],
  },
  {
    id: 'grid-6-2x3',
    name: '6 Foto (Kisi 3 Baris x 2 Kolom)',
    description: '6 foto vertikal berjejer rapi untuk dokumentasi langkah demi langkah',
    category: '6-foto',
    rows: 3,
    cols: 2,
    cells: [
      { row: 0, col: 0, defaultAspectRatio: '4:3' },
      { row: 0, col: 1, defaultAspectRatio: '4:3' },
      { row: 1, col: 0, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
      { row: 2, col: 0, defaultAspectRatio: '4:3' },
      { row: 2, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-6-3x2',
    name: '6 Foto (Kisi 2 Baris x 3 Kolom)',
    description: '6 foto horizontal sangat cocok untuk kertas orientasi Landscape / F4',
    category: '6-foto',
    rows: 2,
    cols: 3,
    cells: [
      { row: 0, col: 0, defaultAspectRatio: '4:3' },
      { row: 0, col: 1, defaultAspectRatio: '4:3' },
      { row: 0, col: 2, defaultAspectRatio: '4:3' },
      { row: 1, col: 0, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
      { row: 1, col: 2, defaultAspectRatio: '4:3' },
    ],
  },
  {
    id: 'grid-8-4x2',
    name: '8 Foto (Kisi 4 Baris x 2 Kolom)',
    description: '8 foto ringkas untuk rekapitulasi dokumentasi kegiatan harian/reses',
    category: '8-foto',
    rows: 4,
    cols: 2,
    cells: [
      { row: 0, col: 0, defaultAspectRatio: '4:3' },
      { row: 0, col: 1, defaultAspectRatio: '4:3' },
      { row: 1, col: 0, defaultAspectRatio: '4:3' },
      { row: 1, col: 1, defaultAspectRatio: '4:3' },
      { row: 2, col: 0, defaultAspectRatio: '4:3' },
      { row: 2, col: 1, defaultAspectRatio: '4:3' },
      { row: 3, col: 0, defaultAspectRatio: '4:3' },
      { row: 3, col: 1, defaultAspectRatio: '4:3' },
    ],
  },
];

// Sample authentic activity photos for Setwan Kota Bitung
export const INITIAL_SETWAN_PHOTOS = [
  {
    id: 'photo-1',
    name: 'Sidang_Paripurna_DPRD.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    category: 'Sidang Paripurna',
    capturedDate: '15 Agustus 2026',
  },
  {
    id: 'photo-2',
    name: 'Peninjauan_Lapangan_Jalan_Protokol.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    category: 'Pengawasan Lapangan',
    capturedDate: '16 Agustus 2026',
  },
  {
    id: 'photo-3',
    name: 'Rapat_Dengar_Pendapat_Komisi_II.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    category: 'Rapat Komisi',
    capturedDate: '17 Agustus 2026',
  },
  {
    id: 'photo-4',
    name: 'Pemeriksaan_Fasilitas_Umum.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    category: 'Pengawasan Lapangan',
    capturedDate: '17 Agustus 2026',
  },
  {
    id: 'photo-5',
    name: 'Reses_Masa_Persidangan_Ketiga.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=80',
    category: 'Kegiatan Reses',
    capturedDate: '18 Agustus 2026',
  },
  {
    id: 'photo-6',
    name: 'Kunjungan_Kerja_Luar_Daerah.jpg',
    dataUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80',
    category: 'Kunjungan Kerja',
    capturedDate: '18 Agustus 2026',
  },
];

// Popular typography fonts supported (matching Canva and standard documents)
export const AVAILABLE_FONTS = [
  { name: 'Open Sans', category: 'Modern Sans' },
  { name: 'Poppins', category: 'Geometric Sans' },
  { name: 'DM Sans', category: 'Clean Sans' },
  { name: 'Montserrat', category: 'Bold Sans' },
  { name: 'Inter', category: 'Interface Sans' },
  { name: 'Roboto', category: 'Neutral Sans' },
  { name: 'Playfair Display', category: 'Elegant Serif' },
  { name: 'Times New Roman', category: 'Formal Serif' },
  { name: 'Georgia', category: 'Editorial Serif' },
  { name: 'Cinzel', category: 'Monumental Serif' },
  { name: 'Oswald', category: 'Condensed Display' },
  { name: 'Anton', category: 'Heavy Display' },
  { name: 'Caveat', category: 'Handwritten Script' },
  { name: 'Arial', category: 'Standard Sans' },
  { name: 'Courier New', category: 'Monospace' },
];

export const COLOR_PALETTES = [
  '#000000',
  '#1e293b',
  '#0f172a',
  '#0284c7',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#be185d',
  '#dc2626',
  '#d97706',
  '#16a34a',
  '#059669',
  '#ffffff',
];

export const CANVA_LANDSCAPE_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="none"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23dbeafe"/><stop offset="100%" stop-color="%23eff6ff"/></linearGradient><linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2384cc16"/><stop offset="100%" stop-color="%2365a30d"/></linearGradient><linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23a3e635"/><stop offset="100%" stop-color="%2384cc16"/></linearGradient></defs><rect width="400" height="300" fill="url(%23sky)"/><path d="M 120 70 Q 130 50 150 50 Q 170 50 180 70 Q 200 70 200 90 Q 200 110 180 110 L 120 110 Q 100 110 100 90 Q 100 70 120 70 Z" fill="%23ffffff" opacity="0.9"/><path d="M 0 220 Q 120 170 240 230 Q 340 270 400 240 L 400 300 L 0 300 Z" fill="url(%23hill1)"/><path d="M 0 250 Q 160 200 320 260 Q 370 275 400 270 L 400 300 L 0 300 Z" fill="url(%23hill2)"/></svg>`;

// Initial Default Project for Setwan DokuFoto
export const createDefaultProject = (): DocumentProject => ({
  id: 'dok-setwan-' + Date.now(),
  title: 'DOKUMENTASI FOTO KEGIATAN SEKRETARIAT DPRD KOTA BITUNG',
  documentNumber: '175/SETWAN-DPRD/DOK-FOTO/VIII/2026',
  paperSize: 'F4', // F4 / Folio (215 x 330 mm) Standar Setwan
  orientation: 'portrait',
  margins: {
    top: 2.0, // cm
    bottom: 2.0, // cm
    left: 2.5, // cm (for filing)
    right: 2.0, // cm
  },
  fontFamily: 'Open Sans',
  author: 'Bagian Risalah, Dokumentasi dan Persidangan',
  institution: 'Sekretariat DPRD Kota Bitung',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  kopSurat: {
    enabled: false, // Optional & modular
    logoLeftUrl: BITUNG_LOGO_SVG,
    logoRightUrl: BITUNG_DIGITAL_LOGO_SVG,
    governmentName: 'PEMERINTAH KOTA BITUNG',
    agencyName: 'DEWAN PERWAKILAN RAKYAT DAERAH',
    subAgencyName: 'SEKRETARIAT DEWAN',
    address: 'Jl. Sam Ratulangi No. 45, Kel. Bitung Barat Satu, Kec. Maesa, Kota Bitung',
    contactInfo: 'Telp: (0438) 21115 / 21120 | Website: dprd.bitungkota.go.id | Email: setwan@bitungkota.go.id',
    postalCode: '95512',
    borderStyle: 'double',
  },
  pages: [
    {
      id: 'page-1',
      pageNumber: 1,
      title: 'DOKUMENTASI FOTO KEGIATAN',
      subtitle: 'Sekretariat DPRD Kota Bitung',
      activityDate: 'Senin, 17 Agustus 2026',
      activityLocation: 'Ruang Sidang Paripurna & Lapangan Pemkot Bitung',
      activityDescription: 'Dokumentasi visual rangkaian kegiatan pengawasan lapangan pembangunan infrastruktur.',
      metaTable: [],
      layoutTemplateId: 'grid-4-2x2',
      gridGapMm: 3,
      cellBorderWidth: 1,
      cellBorderColor: '#cbd5e1',
      cellBorderRadius: 2,
      showKopSurat: false,
      showTitle: false,
      showMetaTable: false,
      showDescription: false,
      showCollageGrid: true,
      showSignature: false,
      showFooter: false,
      footerConfig: {
        enabled: false,
      },
      floatingTexts: [
        {
          id: 'ft-1',
          text: 'MASUKAN TEKS',
          x: 50,
          y: 12,
          width: 440,
          fontSize: 34,
          fontFamily: 'Open Sans',
          fontWeight: '900',
          fontStyle: 'normal',
          textDecoration: 'underline',
          textTransform: 'uppercase',
          textAlign: 'center',
          color: '#e11d48',
          rotation: 0,
          opacity: 1,
          effect: 'none',
        },
      ],
      grids: [
        {
          id: 'grid-1',
          x: 50,
          y: 48,
          widthPercent: 78,
          heightPx: 320,
          cols: 2,
          rows: 2,
          gapMm: 3,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#94a3b8',
          rotation: 0,
          isLocked: false,
          cells: [
            {
              id: 'c-1',
              row: 0,
              col: 0,
              photo: null,
              caption: '',
              showCaption: false,
              aspectRatio: '4:3',
              objectFit: 'cover',
              rotation: 0,
            },
            {
              id: 'c-2',
              row: 0,
              col: 1,
              photo: null,
              caption: '',
              showCaption: false,
              aspectRatio: '4:3',
              objectFit: 'cover',
              rotation: 0,
            },
            {
              id: 'c-3',
              row: 1,
              col: 0,
              photo: INITIAL_SETWAN_PHOTOS[0],
              caption: '',
              showCaption: false,
              aspectRatio: '4:3',
              objectFit: 'cover',
              rotation: 0,
            },
            {
              id: 'c-4',
              row: 1,
              col: 1,
              photo: null,
              caption: '',
              showCaption: false,
              aspectRatio: '4:3',
              objectFit: 'cover',
              rotation: 0,
            },
          ],
        },
      ],
      cells: [
        {
          id: 'c-1',
          row: 0,
          col: 0,
          photo: null,
          caption: '',
          showCaption: false,
          aspectRatio: '4:3',
          objectFit: 'cover',
          rotation: 0,
        },
        {
          id: 'c-2',
          row: 0,
          col: 1,
          photo: null,
          caption: '',
          showCaption: false,
          aspectRatio: '4:3',
          objectFit: 'cover',
          rotation: 0,
        },
        {
          id: 'c-3',
          row: 1,
          col: 0,
          photo: INITIAL_SETWAN_PHOTOS[0],
          caption: '',
          showCaption: false,
          aspectRatio: '4:3',
          objectFit: 'cover',
          rotation: 0,
        },
        {
          id: 'c-4',
          row: 1,
          col: 1,
          photo: null,
          caption: '',
          showCaption: false,
          aspectRatio: '4:3',
          objectFit: 'cover',
          rotation: 0,
        },
      ],
      signatureBlock: {
        enabled: false,
        cityAndDate: 'Bitung, 17 Agustus 2026',
        roleTitle: 'Kepala Bagian Persidangan, Risalah dan Humas',
        officerName: 'SEKRETARIAT DPRD KOTA BITUNG',
        nip: 'NIP. 19800512 200501 1 008',
      },
    },
  ],
});
