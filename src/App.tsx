/**
 * Setwan DokuFoto - Aplikasi Pembuat Dokumen Kolase Foto Resmi Sekretariat Dewan (DPRD)
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DocumentProject,
  DocumentPage,
  PhotoMetadata,
  CollageCell,
  CollageGridElement,
  FloatingTextElement,
} from './types';
import {
  createDefaultProject,
  COLLAGE_LAYOUTS,
  INITIAL_SETWAN_PHOTOS,
  PAPER_DIMENSIONS,
} from './utils/constants';
import { exportProjectToDocx } from './utils/docxExport';
import { exportProjectArchiveZip } from './utils/zipExport';
import { Navbar } from './components/Navbar';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { CollageCanvas } from './components/CollageCanvas';
import { TemplateGallery } from './components/TemplateGallery';
import { MediaTray } from './components/MediaTray';
import { TextSidebarPanel } from './components/TextSidebarPanel';
import { KopSuratPanel } from './components/KopSuratPanel';
import { PaperMarginModal } from './components/PaperMarginModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { PhotoPickerModal } from './components/PhotoPickerModal';
import { AutoCollageModal } from './components/AutoCollageModal';
import saveAs from 'file-saver';

const LOCAL_STORAGE_KEY = 'setwan_dokufoto_project_v2';
const LOCAL_PHOTOS_KEY = 'setwan_dokufoto_photos_v2';

export default function App() {
  const [project, setProject] = useState<DocumentProject>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default
      }
    }
    return createDefaultProject();
  });

  const [photos, setPhotos] = useState<PhotoMetadata[]>(() => {
    const saved = localStorage.getItem(LOCAL_PHOTOS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_SETWAN_PHOTOS;
  });

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('templates');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Modals
  const [isAutoCollageOpen, setIsAutoCollageOpen] = useState<boolean>(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [photoPickerCellId, setPhotoPickerCellId] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Autosave to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    } catch {
      // ignore storage quota error for large base64
    }
  }, [project]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(photos));
    } catch {
      // ignore
    }
  }, [photos]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleUpdateProject = (updated: Partial<DocumentProject>) => {
    setProject((prev) => ({
      ...prev,
      ...updated,
      updatedAt: new Date().toISOString(),
    }));
  };

  const activePage = project.pages[activePageIndex] || project.pages[0];

  const handleUpdateActivePage = (updated: Partial<DocumentPage>) => {
    setProject((prev) => {
      const updatedPages = prev.pages.map((page, idx) => {
        if (idx === activePageIndex) {
          return { ...page, ...updated };
        }
        return page;
      });
      return { ...prev, pages: updatedPages, updatedAt: new Date().toISOString() };
    });
  };

  // Save Project as JSON file (.dokufoto.json)
  const handleSaveProjectJson = () => {
    try {
      const blob = new Blob([JSON.stringify(project, null, 2)], {
        type: 'application/json',
      });
      saveAs(blob, `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.dokufoto.json`);
      showToast('Berkas proyek berhasil disimpan ke komputer!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan file proyek.', 'error');
    }
  };

  // Load Project JSON
  const handleLoadProjectJson = (loadedProject: DocumentProject) => {
    setProject(loadedProject);
    setActivePageIndex(0);
    showToast(`Proyek "${loadedProject.title}" berhasil dimuat!`, 'success');
  };

  // Export Archive ZIP (Project + Photos)
  const handleExportArchiveZip = async () => {
    try {
      showToast('Menyiapkan arsip ZIP proyek...', 'info');
      await exportProjectArchiveZip(project, photos);
      showToast('Arsip proyek ZIP berhasil diunduh!', 'success');
    } catch (err) {
      showToast('Gagal membuat arsip ZIP.', 'error');
    }
  };


  // Change active page's template layout while keeping existing photos
  const handleSelectTemplate = (templateId: string) => {
    const template = COLLAGE_LAYOUTS.find((l) => l.id === templateId);
    if (!template) return;

    // Collect currently assigned photos in active page
    const existingPhotos = activePage.cells
      .map((c) => ({ photo: c.photo, caption: c.caption }))
      .filter((item) => item.photo !== null);

    const newCells: CollageCell[] = template.cells.map((tc, index) => {
      const existing = existingPhotos[index];
      return {
        id: `cell-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        row: tc.row,
        col: tc.col,
        rowSpan: tc.rowSpan || 1,
        colSpan: tc.colSpan || 1,
        aspectRatio: tc.defaultAspectRatio || '4:3',
        objectFit: 'cover',
        photo: existing ? existing.photo : null,
        caption: '',
        showCaption: false,
        rotation: 0,
      };
    });

    // Dynamically compute safe grid height and position
    const paperDim = PAPER_DIMENSIONS[project.paperSize] || PAPER_DIMENSIONS.F4;
    const isLandscape = project.orientation === 'landscape';
    const totalW = isLandscape ? paperDim.heightMm : paperDim.widthMm;
    const totalH = isLandscape ? paperDim.widthMm : paperDim.heightMm;
    const pageAspectRatio = totalW / totalH;
    const canvasH = Math.round(560 / pageAspectRatio);
    const padTop = ((project.margins.top * 10) / totalH) * canvasH;
    const padBottom = ((project.margins.bottom * 10) / totalH) * canvasH;
    const headerH = project.kopSurat.enabled && activePage.showKopSurat !== false && activePageIndex === 0 ? 80 : 0;
    const titleH = activePage.showTitle && activePage.title ? 35 : 0;
    const maxSafeH = Math.max(140, canvasH - padTop - padBottom - headerH - titleH - 12);
    const optimalY = Math.round(((padTop + headerH + titleH + maxSafeH / 2) / canvasH) * 100);

    const newGrid: CollageGridElement = {
      id: `grid-${Date.now()}`,
      x: 50,
      y: optimalY,
      widthPercent: activePage.gridWidthPercent || 88,
      heightPx: Math.round(maxSafeH),
      cols: template.cols,
      rows: template.rows,
      gapMm: activePage.gridGapMm !== undefined ? activePage.gridGapMm : 3,
      borderRadius: activePage.cellBorderRadius !== undefined ? activePage.cellBorderRadius : 2,
      borderWidth: activePage.cellBorderWidth !== undefined ? activePage.cellBorderWidth : 1,
      borderColor: activePage.cellBorderColor || '#94a3b8',
      rotation: 0,
      isLocked: false,
      cells: newCells,
    };

    handleUpdateActivePage({
      layoutTemplateId: templateId,
      customGridColumns: undefined,
      customGridRows: undefined,
      grids: [newGrid],
      cells: newCells,
      gridHeightPx: Math.round(maxSafeH),
      gridWidthPercent: activePage.gridWidthPercent || 88,
      showCollageGrid: true,
    });

    showToast(`Tata letak diubah ke: ${template.name}`, 'info');
  };

  // Apply custom flexible grid layout
  const handleApplyCustomGrid = (cols: number, rows: number, slotCount: number) => {
    const existingPhotos = activePage.cells
      .map((c) => ({ photo: c.photo, caption: c.caption }))
      .filter((item) => item.photo !== null);

    const newCells: CollageCell[] = Array.from({ length: slotCount }).map((_, index) => {
      const existing = existingPhotos[index];
      return {
        id: `cell-custom-${Date.now()}-${index}`,
        row: Math.floor(index / cols),
        col: index % cols,
        rowSpan: 1,
        colSpan: 1,
        aspectRatio: '4:3',
        objectFit: 'cover',
        photo: existing ? existing.photo : null,
        caption: '',
        showCaption: false,
        rotation: 0,
      };
    });

    // Dynamically compute safe grid height and position
    const paperDim = PAPER_DIMENSIONS[project.paperSize] || PAPER_DIMENSIONS.F4;
    const isLandscape = project.orientation === 'landscape';
    const totalW = isLandscape ? paperDim.heightMm : paperDim.widthMm;
    const totalH = isLandscape ? paperDim.widthMm : paperDim.heightMm;
    const pageAspectRatio = totalW / totalH;
    const canvasH = Math.round(560 / pageAspectRatio);
    const padTop = ((project.margins.top * 10) / totalH) * canvasH;
    const padBottom = ((project.margins.bottom * 10) / totalH) * canvasH;
    const headerH = project.kopSurat.enabled && activePage.showKopSurat !== false && activePageIndex === 0 ? 80 : 0;
    const titleH = activePage.showTitle && activePage.title ? 35 : 0;
    const maxSafeH = Math.max(140, canvasH - padTop - padBottom - headerH - titleH - 12);
    const optimalY = Math.round(((padTop + headerH + titleH + maxSafeH / 2) / canvasH) * 100);

    const newGrid: CollageGridElement = {
      id: `grid-custom-${Date.now()}`,
      x: 50,
      y: optimalY,
      widthPercent: activePage.gridWidthPercent || 88,
      heightPx: Math.round(maxSafeH),
      cols: cols,
      rows: rows,
      gapMm: activePage.gridGapMm !== undefined ? activePage.gridGapMm : 3,
      borderRadius: activePage.cellBorderRadius !== undefined ? activePage.cellBorderRadius : 2,
      borderWidth: activePage.cellBorderWidth !== undefined ? activePage.cellBorderWidth : 1,
      borderColor: activePage.cellBorderColor || '#94a3b8',
      rotation: 0,
      isLocked: false,
      cells: newCells,
    };

    handleUpdateActivePage({
      customGridColumns: cols,
      customGridRows: rows,
      grids: [newGrid],
      cells: newCells,
      gridHeightPx: Math.round(maxSafeH),
      gridWidthPercent: activePage.gridWidthPercent || 88,
      showCollageGrid: true,
    });

    showToast(`Tata letak kustom diterapkan: ${cols} Kolom × ${slotCount} Slot`, 'success');
  };

  // Add new blank page
  const handleAddPage = () => {
    const defaultTemplate = COLLAGE_LAYOUTS[5]; // 2x2 grid
    const newPageNumber = project.pages.length + 1;
    const newCells: CollageCell[] = defaultTemplate.cells.map((tc, idx) => ({
      id: `cell-${Date.now()}-${idx}`,
      row: tc.row,
      col: tc.col,
      rowSpan: tc.rowSpan || 1,
      colSpan: tc.colSpan || 1,
      aspectRatio: '4:3',
      objectFit: 'cover',
      photo: null,
      caption: `Foto ${idx + 1}: Keterangan Kegiatan`,
      showCaption: true,
      rotation: 0,
    }));

    const newPage: DocumentPage = {
      id: `page-${Date.now()}`,
      pageNumber: newPageNumber,
      title: `DOKUMENTASI FOTO KEGIATAN (BAGIAN ${newPageNumber})`,
      subtitle: 'Sekretariat DPRD Kota Bitung',
      activityDate: activePage.activityDate,
      activityLocation: activePage.activityLocation,
      activityDescription: 'Lanjutan dokumentasi visual kegiatan sekretariat dewan.',
      metaTable: [...(activePage.metaTable || [])],
      layoutTemplateId: 'grid-4-2x2',
      gridGapMm: 4,
      cellBorderWidth: 1,
      cellBorderColor: '#cbd5e1',
      cellBorderRadius: 4,
      cells: newCells,
      floatingTexts: [],
      showKopSurat: false, // Second pages usually don't need Kop Surat unless requested
      showTitle: true,
      showMetaTable: true,
      showDescription: false,
      showCollageGrid: true,
      showSignature: true,
      showFooter: false,
      signatureBlock: activePage.signatureBlock
        ? { ...activePage.signatureBlock }
        : undefined,
    };

    setProject((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }));

    setActivePageIndex(project.pages.length);
    showToast(`Halaman ${newPageNumber} berhasil ditambahkan`);
  };

  // Duplicate active page
  const handleDuplicatePage = (index: number) => {
    const pageToDup = project.pages[index];
    if (!pageToDup) return;

    const duplicated: DocumentPage = {
      ...JSON.parse(JSON.stringify(pageToDup)),
      id: `page-${Date.now()}`,
      pageNumber: project.pages.length + 1,
      title: `${pageToDup.title} (Salinan)`,
    };

    setProject((prev) => ({
      ...prev,
      pages: [...prev.pages, duplicated],
    }));

    setActivePageIndex(project.pages.length);
    showToast('Halaman berhasil diduplikasi');
  };

  // Delete page
  const handleDeletePage = (index: number) => {
    if (project.pages.length <= 1) {
      showToast('Dokumen minimal harus memiliki 1 halaman!', 'error');
      return;
    }

    const updatedPages = project.pages
      .filter((_, i) => i !== index)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

    setProject((prev) => ({
      ...prev,
      pages: updatedPages,
    }));

    setActivePageIndex((prev) => Math.max(0, Math.min(prev, updatedPages.length - 1)));
    showToast('Halaman dihapus');
  };

  // Assign photo to cell via drag & drop or picker
  const handleDropPhotoToCell = (cellId: string, photo: PhotoMetadata) => {
    let updatedGrids = activePage.grids;
    if (updatedGrids && updatedGrids.length > 0) {
      updatedGrids = updatedGrids.map((grid) => {
        const hasCell = grid.cells.some((c) => c.id === cellId);
        if (hasCell) {
          const newCells = grid.cells.map((c) =>
            c.id === cellId ? { ...c, photo } : c
          );
          return { ...grid, cells: newCells };
        }
        return grid;
      });
    }

    const updatedCells = activePage.cells.map((c) => {
      if (c.id === cellId) {
        return {
          ...c,
          photo,
        };
      }
      return c;
    });

    handleUpdateActivePage({
      grids: updatedGrids,
      cells: updatedCells,
    });

    // Also add to global media photos if not already present
    if (!photos.some((p) => p.id === photo.id || p.dataUrl === photo.dataUrl)) {
      setPhotos((prev) => [photo, ...prev]);
    }
  };

  // Add photos to gallery
  const handleAddPhotos = (newPhotos: PhotoMetadata[]) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    showToast(`${newPhotos.length} foto berhasil diimpor ke galeri`);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Floating Text Management
  const handleAddFloatingText = (preset?: Partial<FloatingTextElement>) => {
    const newId = 'ft-' + Date.now();
    const newText: FloatingTextElement = {
      id: newId,
      text: 'MASUKAN TEKS',
      x: 50,
      y: 50,
      fontSize: 28,
      fontFamily: 'Open Sans',
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#000000',
      rotation: 0,
      textAlign: 'center',
      effect: 'none',
      width: 320,
      ...preset,
    };

    const currentList = activePage.floatingTexts || [];
    handleUpdateActivePage({ floatingTexts: [...currentList, newText] });
    setSelectedTextId(newId);
    showToast('Teks bebas ditambahkan. Tarik posisi atau putar langsung di lembar!');
  };

  const handleUpdateFloatingText = (id: string, updated: Partial<FloatingTextElement>) => {
    const currentList = activePage.floatingTexts || [];
    const newList = currentList.map((t) => (t.id === id ? { ...t, ...updated } : t));
    handleUpdateActivePage({ floatingTexts: newList });
  };

  const handleDeleteFloatingText = (id: string) => {
    const currentList = activePage.floatingTexts || [];
    const newList = currentList.filter((t) => t.id !== id);
    handleUpdateActivePage({ floatingTexts: newList });
    if (selectedTextId === id) setSelectedTextId(null);
  };

  // Export to Real DOCX
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      await exportProjectToDocx(project);
      showToast('Dokumen .docx berhasil diekspor dan siap dibuka di Microsoft Word!');
    } catch (err) {
      console.error('Docx export error:', err);
      showToast('Gagal mengekspor dokumen .docx. Silakan coba lagi.', 'error');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleNewProject = () => {
    if (window.confirm('Buat dokumen dokumentasi baru? Dokumen saat ini akan digantikan template bersih.')) {
      const fresh = createDefaultProject();
      setProject(fresh);
      setActivePageIndex(0);
      showToast('Dokumen baru siap diedit');
    }
  };

  const handleApplyAutoCollage = (
    grid: CollageGridElement,
    createNewPage: boolean,
    titleText?: string
  ) => {
    if (createNewPage) {
      const newPage: DocumentPage = {
        id: `page-${Date.now()}`,
        pageNumber: project.pages.length + 1,
        title: titleText || 'DOKUMENTASI FOTO KEGIATAN',
        subtitle: '',
        layoutTemplateId: 'grid-custom',
        cells: grid.cells,
        gridGapMm: grid.gapMm,
        cellBorderWidth: grid.borderWidth,
        cellBorderColor: grid.borderColor,
        cellBorderRadius: grid.borderRadius,
        gridWidthPercent: grid.widthPercent,
        gridHeightPx: grid.heightPx,
        customGridColumns: grid.cols,
        customGridRows: grid.rows,
        showCollageGrid: true,
        showKopSurat: false,
        showTitle: !!titleText,
        grids: [grid],
        floatingTexts: titleText
          ? [
              {
                id: `text-title-${Date.now()}`,
                text: titleText,
                x: 50,
                y: 8,
                fontSize: 16,
                fontWeight: '900',
                fontFamily: project.fontFamily || 'Open Sans',
                color: '#0f172a',
                textAlign: 'center',
                width: 480,
                rotation: 0,
              },
            ]
          : [],
      };
      setProject((prev) => ({
        ...prev,
        pages: [...prev.pages, newPage],
      }));
      setActivePageIndex(project.pages.length);
      showToast('⚡ Kisi kolase foto berhasil dibuat di Halaman Baru!', 'success');
    } else {
      const updatedFloatingTexts = titleText
        ? [
            ...(activePage.floatingTexts || []),
            {
              id: `text-title-${Date.now()}`,
              text: titleText,
              x: 50,
              y: 8,
              fontSize: 16,
              fontWeight: '900',
              fontFamily: project.fontFamily || 'Open Sans',
              color: '#0f172a',
              textAlign: 'center',
              width: 480,
              rotation: 0,
            },
          ]
        : activePage.floatingTexts;

      handleUpdateActivePage({
        grids: [grid],
        cells: grid.cells,
        showCollageGrid: true,
        gridGapMm: grid.gapMm,
        cellBorderWidth: grid.borderWidth,
        cellBorderColor: grid.borderColor,
        cellBorderRadius: grid.borderRadius,
        gridWidthPercent: grid.widthPercent,
        gridHeightPx: grid.heightPx,
        customGridColumns: grid.cols,
        customGridRows: grid.rows,
        floatingTexts: updatedFloatingTexts,
        showTitle: titleText ? true : activePage.showTitle,
        title: titleText || activePage.title,
      });
      showToast('⚡ Kisi kolase foto berhasil diterapkan ke halaman!', 'success');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold border transition-all animate-in slide-in-from-top-3 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-600'
              : notification.type === 'error'
              ? 'bg-red-950 text-red-200 border-red-600'
              : 'bg-sky-950 text-sky-200 border-sky-600'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        project={project}
        onUpdateProject={handleUpdateProject}
        onOpenDocxExport={handleExportDocx}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        onOpenPaperModal={() => setIsPaperModalOpen(true)}
        onNewProject={handleNewProject}
        isExportingDocx={isExportingDocx}
        onOpenAutoCollage={() => setIsAutoCollageOpen(true)}
        onSaveProjectJson={handleSaveProjectJson}
        onLoadProjectJson={handleLoadProjectJson}
        onExportArchiveZip={handleExportArchiveZip}
      />

      {/* Main Center Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeSidebarTab}
          onChangeTab={(tab) => {
            if (tab === 'margins') {
              setIsPaperModalOpen(true);
            } else {
              setActiveSidebarTab(tab);
            }
          }}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        >
          {activeSidebarTab === 'templates' && (
            <TemplateGallery
              currentTemplateId={activePage.layoutTemplateId}
              isGridVisible={activePage.showCollageGrid !== false}
              onSelectTemplate={handleSelectTemplate}
              onApplyCustomGrid={handleApplyCustomGrid}
              onToggleGridVisibility={(visible) =>
                handleUpdateActivePage({ showCollageGrid: visible })
              }
              onClearAllPhotos={() => {
                const updatedCells = activePage.cells.map((c) => ({
                  ...c,
                  photo: null,
                }));
                handleUpdateActivePage({ cells: updatedCells });
                showToast('Semua foto di halaman ini dikosongkan');
              }}
            />
          )}
          {activeSidebarTab === 'media' && (
            <MediaTray
              photos={photos}
              onAddPhotos={handleAddPhotos}
              onRemovePhoto={handleRemovePhoto}
              onOpenAutoCollage={() => setIsAutoCollageOpen(true)}
            />
          )}
          {activeSidebarTab === 'kop' && (
            <div className="p-4">
              <KopSuratPanel
                kopSurat={project.kopSurat}
                onUpdateKopSurat={(updated) =>
                  handleUpdateProject({
                    kopSurat: { ...project.kopSurat, ...updated },
                  })
                }
              />
            </div>
          )}
          {activeSidebarTab === 'text' && (
            <TextSidebarPanel
              activePage={activePage}
              project={project}
              selectedTextId={selectedTextId}
              onSelectTextId={setSelectedTextId}
              onAddFloatingText={handleAddFloatingText}
              onUpdateFloatingText={handleUpdateFloatingText}
              onDeleteFloatingText={handleDeleteFloatingText}
              onUpdateActivePage={handleUpdateActivePage}
              onUpdateProject={handleUpdateProject}
            />
          )}
        </Sidebar>

        {/* Central WYSIWYG Collage Canvas */}
        <CollageCanvas
          project={project}
          activePageIndex={activePageIndex}
          selectedTextId={selectedTextId}
          onSelectTextId={setSelectedTextId}
          onSelectPageIndex={setActivePageIndex}
          onUpdateActivePage={handleUpdateActivePage}
          onUpdateProject={handleUpdateProject}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onDropPhotoToCell={handleDropPhotoToCell}
          onOpenPhotoPickerForCell={(cellId) => setPhotoPickerCellId(cellId)}
          onAddFloatingText={handleAddFloatingText}
          onOpenTemplateGallery={() => {
            setActiveSidebarTab('templates');
            setIsSidebarOpen(true);
          }}
          onOpenAutoCollage={() => setIsAutoCollageOpen(true)}
          onOpenPaperModal={() => setIsPaperModalOpen(true)}
        />
      </div>

      {/* Modals */}
      <AutoCollageModal
        isOpen={isAutoCollageOpen}
        onClose={() => setIsAutoCollageOpen(false)}
        availablePhotos={photos}
        onAddPhotosToGallery={handleAddPhotos}
        onApplyCollage={handleApplyAutoCollage}
        activePageNumber={activePageIndex + 1}
        project={project}
      />

      <PaperMarginModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        project={project}
        onUpdateProject={handleUpdateProject}
      />

      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        project={project}
        onUpdateProject={handleUpdateProject}
      />

      <PhotoPickerModal
        isOpen={photoPickerCellId !== null}
        onClose={() => setPhotoPickerCellId(null)}
        photos={photos}
        onSelectPhoto={(photo) => {
          if (photoPickerCellId) {
            handleDropPhotoToCell(photoPickerCellId, photo);
          }
        }}
        onUploadAndSelect={(photo) => {
          if (photoPickerCellId) {
            handleDropPhotoToCell(photoPickerCellId, photo);
          }
        }}
      />
    </div>
  );
}
