export type PaperSizeType = 'A4' | 'F4' | 'Letter' | 'Legal' | 'Custom';
export type OrientationType = 'portrait' | 'landscape';

export interface PageMargin {
  top: number; // in cm
  bottom: number; // in cm
  left: number; // in cm
  right: number; // in cm
}

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
  name: string;
  description: string;
}

export interface PhotoMetadata {
  id: string;
  name: string;
  dataUrl: string; // Base64 data or blob URL
  width?: number;
  height?: number;
  sizeBytes?: number;
  capturedDate?: string;
  category?: string;
}

export interface CropRect {
  x: number; // 0 to 1 (left offset percentage)
  y: number; // 0 to 1 (top offset percentage)
  width: number; // 0 to 1 (width percentage)
  height: number; // 0 to 1 (height percentage)
}

export interface CollageCell {
  id: string;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  photo?: PhotoMetadata | null;
  caption?: string;
  showCaption?: boolean;
  aspectRatio?: 'original' | '1:1' | '4:3' | '16:9' | '3:4';
  objectFit?: 'cover' | 'contain' | 'fill';
  rotation?: number; // 0, 90, 180, 270
  cropRect?: CropRect;
}

export interface CollageGridElement {
  id: string;
  x: number; // percentage (0 - 100) center of paper
  y: number; // percentage (0 - 100) center of paper
  widthPercent: number; // percentage of paper width (20 - 100)
  heightPx: number; // height in px (80 - 1000)
  cols: number; // column count (1 - 6)
  rows: number; // row count (1 - 6)
  gapMm: number; // gap in mm (0 - 24)
  borderRadius: number; // in px (0 - 32)
  borderWidth: number; // in px (0 - 8)
  borderColor: string; // hex color
  rotation?: number; // 0 - 360
  isLocked?: boolean;
  cells: CollageCell[];
}

export interface CollageLayoutTemplate {
  id: string;
  name: string;
  description: string;
  category: '1-foto' | '2-foto' | '3-foto' | '4-foto' | '5-foto' | '6-foto' | '8-foto' | 'kustom';
  rows: number;
  cols: number;
  cells: {
    row: number;
    col: number;
    rowSpan?: number;
    colSpan?: number;
    defaultAspectRatio?: 'original' | '1:1' | '4:3' | '16:9' | '3:4';
  }[];
  previewSvg?: string;
}

export interface KopSuratData {
  enabled: boolean;
  logoLeftUrl?: string;
  logoRightUrl?: string;
  governmentName: string; // e.g. PEMERINTAH KOTA BITUNG
  agencyName: string; // e.g. DEWAN PERWAKILAN RAKYAT DAERAH
  subAgencyName?: string; // e.g. SEKRETARIAT DEWAN
  address: string; // e.g. Jl. Sam Ratulangi No. 45, Bitung, Sulawesi Utara
  contactInfo: string; // e.g. Telp: (0438) 21115 | Email: setwan@bitungkota.go.id
  postalCode?: string;
  borderStyle: 'double' | 'single' | 'bold' | 'none';
}

export type TextEffectType = 'none' | 'shadow' | 'outline' | 'neon' | 'glow' | 'background';

export interface FloatingTextElement {
  id: string;
  text: string;
  x: number; // percentage (0 - 100) or pixels from left of paper
  y: number; // percentage (0 - 100) or pixels from top of paper
  width?: number; // width in px
  fontSize: number; // in pt/px (e.g. 14, 24, 36, 48, 72)
  fontFamily: string; // e.g. 'Open Sans', 'Poppins', 'Montserrat', 'Arial', 'Times New Roman'
  fontWeight?: 'normal' | 'bold' | '300' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string; // Hex color, e.g. '#000000'
  backgroundColor?: string; // Optional background color
  rotation?: number; // in degrees (0 - 360)
  letterSpacing?: number; // in px
  lineHeight?: number; // multiplier e.g. 1.2
  opacity?: number; // 0 - 1
  effect?: TextEffectType;
  effectColor?: string; // shadow or outline color
  strokeWidth?: number; // for outline effect
  listType?: 'none' | 'bullet' | 'number';
  isLocked?: boolean;
}

export interface FooterConfig {
  enabled: boolean;
  textLeft?: string;
  textRight?: string;
  showPageNumber?: boolean;
}

export interface DocumentPage {
  id: string;
  pageNumber: number;
  title: string;
  activityDate?: string;
  activityLocation?: string;
  activityDescription?: string;
  layoutTemplateId: string;
  cells: CollageCell[];
  gridGapMm: number; // gap between photos in mm
  cellBorderWidth: number; // 0 for no border, 1-2 for border
  cellBorderColor: string;
  cellBorderRadius: number; // in px
  gridHeightPx?: number; // Flexible customizable grid height in px (e.g. 150 - 800)
  gridWidthPercent?: number; // Flexible customizable grid width in percent (40 - 100)
  customGridColumns?: number; // Dynamic custom grid column count (1 - 6)
  customGridRows?: number; // Dynamic custom grid row count (1 - 6)
  customNotes?: string;
  showKopSurat?: boolean;
  showDescription?: boolean;
  showCollageGrid?: boolean;
  showFooter?: boolean;
  footerConfig?: FooterConfig;
  // Freeform Floating Rich Text Elements
  floatingTexts?: FloatingTextElement[];
  // Freeform Floating Grid Elements
  grids?: CollageGridElement[];
}

export interface DocumentProject {
  id: string;
  title: string;
  documentNumber?: string;
  paperSize: PaperSizeType;
  customWidthMm?: number;
  customHeightMm?: number;
  orientation: OrientationType;
  margins: PageMargin;
  fontFamily: string;
  kopSurat: KopSuratData;
  pages: DocumentPage[];
  createdAt: string;
  updatedAt: string;
  author: string;
  institution: string;
}
