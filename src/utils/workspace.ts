import type {
  CollageCell,
  DocumentPage,
  DocumentProject,
  PhotoMetadata,
} from '../types';

export const WORKSPACE_SCHEMA_VERSION = 1;

export interface WorkspaceSnapshot {
  kind: 'dokufoto-workspace';
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  savedAt: string;
  project: DocumentProject;
  photos: PhotoMetadata[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isPhotoMetadata = (value: unknown): value is PhotoMetadata => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.dataUrl === 'string' &&
    /^data:image\/(?:png|jpe?g|webp);base64,/i.test(value.dataUrl)
  );
};

const isCell = (value: unknown): value is CollageCell => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    isFiniteNumber(value.row) &&
    isFiniteNumber(value.col) &&
    (value.photo === undefined || value.photo === null || isPhotoMetadata(value.photo))
  );
};

const isPage = (value: unknown): value is DocumentPage => {
  if (!isRecord(value) || !Array.isArray(value.cells)) return false;
  if (
    typeof value.id !== 'string' ||
    !isFiniteNumber(value.pageNumber) ||
    typeof value.title !== 'string' ||
    typeof value.layoutTemplateId !== 'string'
  ) {
    return false;
  }

  if (!value.cells.every(isCell)) return false;
  if (value.grids !== undefined) {
    if (!Array.isArray(value.grids)) return false;
    const gridsValid = value.grids.every(
      (grid) =>
        isRecord(grid) &&
        typeof grid.id === 'string' &&
        isFiniteNumber(grid.x) &&
        isFiniteNumber(grid.y) &&
        isFiniteNumber(grid.widthPercent) &&
        isFiniteNumber(grid.heightPx) &&
        Array.isArray(grid.cells) &&
        grid.cells.every(isCell),
    );
    if (!gridsValid) return false;
  }

  return true;
};

export const isDocumentProject = (value: unknown): value is DocumentProject => {
  if (!isRecord(value) || !Array.isArray(value.pages) || value.pages.length === 0) {
    return false;
  }

  const validPaperSizes = ['A4', 'F4', 'Letter', 'Legal', 'Custom'];
  const validOrientations = ['portrait', 'landscape'];
  const margins = value.margins;
  const kopSurat = value.kopSurat;

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    validPaperSizes.includes(String(value.paperSize)) &&
    validOrientations.includes(String(value.orientation)) &&
    typeof value.fontFamily === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.author === 'string' &&
    typeof value.institution === 'string' &&
    isRecord(margins) &&
    ['top', 'bottom', 'left', 'right'].every((key) => isFiniteNumber(margins[key])) &&
    isRecord(kopSurat) &&
    typeof kopSurat.enabled === 'boolean' &&
    typeof kopSurat.governmentName === 'string' &&
    typeof kopSurat.agencyName === 'string' &&
    typeof kopSurat.address === 'string' &&
    typeof kopSurat.contactInfo === 'string' &&
    value.pages.every(isPage)
  );
};

const collectProjectPhotos = (project: DocumentProject): PhotoMetadata[] => {
  const photos: PhotoMetadata[] = [];
  for (const page of project.pages) {
    const cells = page.grids?.flatMap((grid) => grid.cells) ?? page.cells;
    for (const cell of cells) {
      if (cell.photo) photos.push(cell.photo);
    }
  }
  return photos;
};

export const deduplicatePhotos = (photos: PhotoMetadata[]): PhotoMetadata[] => {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  return photos.filter((photo) => {
    if (seenIds.has(photo.id) || seenUrls.has(photo.dataUrl)) return false;
    seenIds.add(photo.id);
    seenUrls.add(photo.dataUrl);
    return true;
  });
};

const removeRetiredPageSections = (project: DocumentProject): DocumentProject => ({
  ...project,
  pages: project.pages.map((page) => {
    const legacyPage = page as DocumentPage & Record<string, unknown>;
    const {
      subtitle: _subtitle,
      metaTable: _metaTable,
      signatureBlock: _signatureBlock,
      showTitle: _showTitle,
      showMetaTable: _showMetaTable,
      showSignature: _showSignature,
      ...currentPage
    } = legacyPage;
    return currentPage as DocumentPage;
  }),
});

export const createWorkspaceSnapshot = (
  project: DocumentProject,
  photos: PhotoMetadata[],
): WorkspaceSnapshot => ({
  kind: 'dokufoto-workspace',
  schemaVersion: WORKSPACE_SCHEMA_VERSION,
  savedAt: new Date().toISOString(),
  project: removeRetiredPageSections(project),
  photos: deduplicatePhotos(photos),
});

export const parseWorkspaceJson = (text: string): WorkspaceSnapshot => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Berkas bukan JSON yang valid.');
  }

  if (isRecord(parsed) && parsed.kind === 'dokufoto-workspace') {
    if (parsed.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
      throw new Error(`Versi proyek ${String(parsed.schemaVersion)} belum didukung.`);
    }
    if (!isDocumentProject(parsed.project)) {
      throw new Error('Struktur proyek di dalam berkas tidak valid.');
    }
    if (!Array.isArray(parsed.photos) || !parsed.photos.every(isPhotoMetadata)) {
      throw new Error('Daftar foto di dalam berkas tidak valid.');
    }
    return createWorkspaceSnapshot(parsed.project, parsed.photos);
  }

  // Kompatibilitas dengan ekspor lama yang hanya menyimpan DocumentProject.
  if (isDocumentProject(parsed)) {
    return createWorkspaceSnapshot(parsed, collectProjectPhotos(parsed));
  }

  throw new Error('Berkas bukan proyek DokuFoto yang valid.');
};

export const serializeWorkspace = (project: DocumentProject, photos: PhotoMetadata[]): string =>
  JSON.stringify(createWorkspaceSnapshot(project, photos), null, 2);
