import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentProject,
  DocumentPage,
  FloatingTextElement,
  CollageCell,
  CollageGridElement,
  PhotoMetadata,
  CropRect,
} from '../types';
import {
  CANVA_LANDSCAPE_PLACEHOLDER,
  COLOR_PALETTES,
} from '../utils/constants';
import {
  getDocumentGeometry,
  getFloatingTextStyle,
  getPageGrids,
  getPhotoImageStyle,
} from '../utils/pageVisual';
import { FloatingTextToolbar } from './FloatingTextToolbar';
import { GridFrameToolbar } from './GridFrameToolbar';
import { CanvaPhotoCropper } from './CanvaPhotoCropper';
import {
  Upload,
  Plus,
  Minus,
  Trash2,
  Copy,
  RotateCw,
  Maximize2,
  Image as ImageIcon,
  Move,
  Lock,
  Unlock,
  Type,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Check,
  Building,
  RefreshCw,
  MoreHorizontal,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Layers,
  Crop,
  ZoomIn,
  ZoomOut,
  Eye,
  FileText,
  Sliders,
} from 'lucide-react';

interface CollageCanvasProps {
  project: DocumentProject;
  activePageIndex: number;
  selectedTextId: string | null;
  onSelectPageIndex: (index: number) => void;
  onSelectTextId: (id: string | null) => void;
  onUpdateActivePage: (updated: Partial<DocumentPage>) => void;
  onUpdateProject: (updated: Partial<DocumentProject>) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  onDropPhotoToCell: (cellId: string, photo: PhotoMetadata) => void;
  onOpenPhotoPickerForCell: (cellId: string) => void;
  onAddFloatingText: (preset?: Partial<FloatingTextElement>) => void;
  onOpenTemplateGallery?: () => void;
  onOpenAutoCollage?: () => void;
  onOpenPaperModal?: () => void;
}

export const CollageCanvas: React.FC<CollageCanvasProps> = ({
  project,
  activePageIndex,
  selectedTextId,
  onSelectPageIndex,
  onSelectTextId,
  onUpdateActivePage,
  onUpdateProject,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onDropPhotoToCell,
  onOpenPhotoPickerForCell,
  onAddFloatingText,
  onOpenTemplateGallery,
  onOpenAutoCollage,
  onOpenPaperModal,
}) => {
  const activePage = project.pages[activePageIndex] || project.pages[0];
  const paperRef = useRef<HTMLDivElement>(null);

  // Active Grid Selection & Active Cell
  const [selectedGridIds, setSelectedGridIds] = useState<string[]>([]);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [dragOverCellId, setDragOverCellId] = useState<string | null>(null);
  const [openGridMenuId, setOpenGridMenuId] = useState<string | null>(null);
  const [openTrashDropdownId, setOpenTrashDropdownId] = useState<string | null>(null);
  const [croppingData, setCroppingData] = useState<{ gridId: string; cell: CollageCell } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; gridId?: string } | null>(null);

  // Marquee Drag Selection State
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Zoom Level
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);

  // Auto calculate optimal zoom to fit canvas within screen viewport (Fit Page)
  const handleFitToScreen = () => {
    const scrollContainer = document.getElementById('canvas-scroll-container');
    const availableW = scrollContainer ? scrollContainer.clientWidth - 64 : window.innerWidth - 380;
    const availableH = scrollContainer ? scrollContainer.clientHeight - 100 : window.innerHeight - 220;

    const zoomW = (Math.max(300, availableW) / baseCanvasWidth) * 100;
    const zoomH = (Math.max(300, availableH) / baseCanvasHeight) * 100;

    // Fit entire page in view comfortably
    const fitZoom = Math.min(zoomW, zoomH);
    const calculatedZoom = Math.min(220, Math.max(35, Math.floor(fitZoom)));
    setZoomLevel(calculatedZoom);
  };

  // Zoom to fit comfortable workspace width (Fit Width)
  const handleFitWidth = () => {
    const scrollContainer = document.getElementById('canvas-scroll-container');
    const availableW = scrollContainer ? scrollContainer.clientWidth - 96 : window.innerWidth - 420;
    const zoomW = (Math.max(300, availableW) / baseCanvasWidth) * 100;
    const calculatedZoom = Math.min(220, Math.max(40, Math.floor(zoomW * 0.9)));
    setZoomLevel(calculatedZoom);
  };

  // Auto-fit document on initial mount or when paper size / orientation changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 120);
    return () => clearTimeout(timer);
  }, [project.paperSize, project.orientation]);

  // Clipboard for Grid & Text
  const [copiedGrid, setCopiedGrid] = useState<CollageGridElement | null>(null);

  // Drag & Transform States for Floating Text
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
    textX: number;
    textY: number;
  } | null>(null);

  const [isRotatingText, setIsRotatingText] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState<{
    startAngle: number;
    initialRotation: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const [isResizingText, setIsResizingText] = useState(false);
  const [resizeData, setResizeData] = useState<{
    textId: string;
    corner: 'tl' | 'tr' | 'bl' | 'br';
    centerX: number;
    centerY: number;
    initialDistance: number;
    startFontSize: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [resizeWidthData, setResizeWidthData] = useState<{
    textId: string;
    side: 'left' | 'right';
    startX: number;
    startWidth: number;
  } | null>(null);

  // Drag & Move States for Freeform Grid Elements (Support Single and Multi-Grid Move)
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const [gridDragStart, setGridDragStart] = useState<{
    startX: number;
    startY: number;
    initialPositions: { id: string; x: number; y: number }[];
    gridId: string;
    hasMoved?: boolean;
  } | null>(null);

  // Resizing Grid States (8 Handles: 4 Corners + 4 Sides)
  const [isResizingGrid, setIsResizingGrid] = useState(false);
  const [gridResizeData, setGridResizeData] = useState<{
    gridId: string;
    handle: 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right';
    startX: number;
    startY: number;
    initialWidthPercent: number;
    initialHeightPx: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Rotating Grid State
  const [isRotatingGrid, setIsRotatingGrid] = useState(false);
  const [gridRotateStart, setGridRotateStart] = useState<{
    gridId: string;
    startAngle: number;
    initialRotation: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  // Live Dimension Tooltip (Canva-style badge)
  const [resizeTooltip, setResizeTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    widthCm: string;
    heightCm: string;
  } | null>(null);

  // Smart Snap Guidelines
  const [snapVertical, setSnapVertical] = useState(false);
  const [snapHorizontal, setSnapHorizontal] = useState(false);

  const {
    widthMm,
    heightMm,
    baseCanvasWidth,
    baseCanvasHeight,
    padTopPx,
    padBottomPx,
    padLeftPx,
    padRightPx,
  } = getDocumentGeometry(project);

  // Normalize Grids Array for active page
  const pageGrids: CollageGridElement[] = React.useMemo(
    () => getPageGrids(activePage, project, activePageIndex),
    [activePage, activePageIndex, project],
  );

  const activeGrid =
    pageGrids.find((g) => g.id === selectedGridId) ||
    (selectedGridIds.length > 0 ? pageGrids.find((g) => selectedGridIds.includes(g.id)) || null : null);

  const floatingTexts = activePage.floatingTexts || [];
  const selectedText = floatingTexts.find((t) => t.id === selectedTextId) || null;

  // Helper to calculate unified multi-selection bounding box in %
  const multiSelectionBounds = React.useMemo(() => {
    if (selectedGridIds.length <= 1) return null;
    const selectedGrids = pageGrids.filter((g) => selectedGridIds.includes(g.id));
    if (selectedGrids.length === 0) return null;

    const minX = Math.min(...selectedGrids.map((g) => g.x - g.widthPercent / 2));
    const maxX = Math.max(...selectedGrids.map((g) => g.x + g.widthPercent / 2));
    const minY = Math.min(...selectedGrids.map((g) => g.y - (g.heightPx / 800) * 50));
    const maxY = Math.max(...selectedGrids.map((g) => g.y + (g.heightPx / 800) * 50));

    return {
      minX: Math.max(0, minX),
      maxX: Math.min(100, maxX),
      minY: Math.max(0, minY),
      maxY: Math.min(100, maxY),
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, [selectedGridIds, pageGrids]);

  // Helper to update grids on active page
  const handleUpdateGrids = (newGrids: CollageGridElement[]) => {
    // Keep primary grid cells in sync with activePage.cells for backward compatibility
    const primaryCells = newGrids.length > 0 ? newGrids[0].cells : [];
    onUpdateActivePage({
      grids: newGrids,
      cells: primaryCells,
      showCollageGrid: newGrids.length > 0,
    });
  };

  const handleUpdateSingleGrid = (gridId: string, updated: Partial<CollageGridElement>) => {
    const newGrids = pageGrids.map((g) => (g.id === gridId ? { ...g, ...updated } : g));
    handleUpdateGrids(newGrids);
  };

  const handleDeleteGrid = (gridId: string) => {
    const newGrids = pageGrids.filter((g) => g.id !== gridId);
    handleUpdateGrids(newGrids);
    setSelectedGridIds((prev) => prev.filter((id) => id !== gridId));
    if (selectedGridId === gridId) {
      setSelectedGridId(newGrids.length > 0 ? newGrids[0].id : null);
    }
  };

  // Delete all selected grids
  const handleDeleteSelectedGrids = () => {
    if (selectedGridIds.length === 0) return;
    const newGrids = pageGrids.filter((g) => !selectedGridIds.includes(g.id));
    handleUpdateGrids(newGrids);
    setSelectedGridIds([]);
    setSelectedGridId(null);
  };

  // Lock / Unlock all selected grids
  const handleLockSelectedGrids = () => {
    if (selectedGridIds.length === 0) return;
    const someUnlocked = pageGrids
      .filter((g) => selectedGridIds.includes(g.id))
      .some((g) => !g.isLocked);
    const newGrids = pageGrids.map((g) =>
      selectedGridIds.includes(g.id) ? { ...g, isLocked: someUnlocked } : g
    );
    handleUpdateGrids(newGrids);
  };

  // Duplicate all selected grids
  const handleDuplicateSelectedGrids = () => {
    if (selectedGridIds.length === 0) return;
    const targets = pageGrids.filter((g) => selectedGridIds.includes(g.id));
    const newGridsAdded: CollageGridElement[] = [];

    targets.forEach((target, gIdx) => {
      const newGridId = `grid-${Date.now()}-${gIdx}`;
      const duplicatedCells: CollageCell[] = target.cells.map((c, idx) => ({
        ...c,
        id: `cell-${Date.now()}-${gIdx}-${idx}`,
        photo: c.photo ? { ...c.photo } : null,
      }));

      newGridsAdded.push({
        ...target,
        id: newGridId,
        x: Math.min(90, target.x + 4),
        y: Math.min(90, target.y + 4),
        cells: duplicatedCells,
      });
    });

    const updated = [...pageGrids, ...newGridsAdded];
    handleUpdateGrids(updated);
    setSelectedGridIds(newGridsAdded.map((g) => g.id));
    setSelectedGridId(newGridsAdded[0].id);
  };

  // COMBINE / KELOMPOKKAN (GROUP SELECTED GRIDS INTO A SINGLE UNIFIED GRID)
  const handleCombineSelectedGrids = () => {
    const targetGrids = pageGrids.filter((g) => selectedGridIds.includes(g.id));
    if (targetGrids.length <= 1) return;

    // Sort target grids by position (top-to-bottom, left-to-right)
    const sortedGrids = [...targetGrids].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 12) return a.y - b.y;
      return a.x - b.x;
    });

    const minX = Math.min(...sortedGrids.map((g) => g.x - g.widthPercent / 2));
    const maxX = Math.max(...sortedGrids.map((g) => g.x + g.widthPercent / 2));
    const minY = Math.min(...sortedGrids.map((g) => g.y - (g.heightPx / 800) * 50));
    const maxY = Math.max(...sortedGrids.map((g) => g.y + (g.heightPx / 800) * 50));

    const combinedWidthPercent = Math.min(98, Math.max(30, Math.round(maxX - minX)));
    const combinedHeightPx = Math.max(...sortedGrids.map((g) => g.heightPx));
    const combinedCenterX = Math.round((minX + maxX) / 2);
    const combinedCenterY = Math.round((minY + maxY) / 2);

    // Combine all cells
    const allCells: CollageCell[] = [];
    let colCounter = 0;
    sortedGrids.forEach((g) => {
      g.cells.forEach((c) => {
        allCells.push({
          ...c,
          id: `cell-${Date.now()}-${allCells.length}-${Math.random().toString(36).substr(2, 4)}`,
          col: colCounter,
          row: 0,
          rowSpan: 1,
          colSpan: 1,
        });
        colCounter++;
      });
    });

    const newCombinedGrid: CollageGridElement = {
      id: `grid-combined-${Date.now()}`,
      x: Math.max(10, Math.min(90, combinedCenterX)),
      y: Math.max(10, Math.min(90, combinedCenterY)),
      widthPercent: combinedWidthPercent,
      heightPx: combinedHeightPx,
      cols: Math.max(1, allCells.length),
      rows: 1,
      gapMm: sortedGrids[0].gapMm ?? 3,
      borderRadius: sortedGrids[0].borderRadius ?? 4,
      borderWidth: sortedGrids[0].borderWidth ?? 1,
      borderColor: sortedGrids[0].borderColor ?? '#94a3b8',
      rotation: 0,
      isLocked: false,
      cells: allCells,
    };

    const remainingGrids = pageGrids.filter((g) => !selectedGridIds.includes(g.id));
    const updatedGrids = [...remainingGrids, newCombinedGrid];
    handleUpdateGrids(updatedGrids);
    setSelectedGridIds([newCombinedGrid.id]);
    setSelectedGridId(newCombinedGrid.id);
  };

  // PISAHKAN KISI (UNGROUP / SPLIT MULTI-CELL GRID INTO INDIVIDUAL SEPARATE GRIDS)
  const handleUngroupGrid = (gridId: string) => {
    const targetGrid = pageGrids.find((g) => g.id === gridId);
    if (!targetGrid || targetGrid.cells.length <= 1) return;

    const cols = targetGrid.cols || targetGrid.cells.length;
    const rows = targetGrid.rows || 1;
    const cellWidthPercent = targetGrid.widthPercent / cols;
    const cellHeightPx = Math.round(targetGrid.heightPx / rows);

    const newGrids: CollageGridElement[] = targetGrid.cells.map((cell, idx) => {
      const colIdx = cell.col !== undefined ? cell.col : idx % cols;
      const rowIdx = cell.row !== undefined ? cell.row : Math.floor(idx / cols);

      const leftOffset = targetGrid.x - targetGrid.widthPercent / 2;
      const cellCenterX = leftOffset + (colIdx + 0.5) * cellWidthPercent;
      const topOffset = targetGrid.y - (targetGrid.heightPx / 800) * 50;
      const cellCenterY = rows > 1 ? topOffset + (rowIdx + 0.5) * ((targetGrid.heightPx / 800) * 100 / rows) : targetGrid.y;

      return {
        id: `grid-split-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        x: Math.max(5, Math.min(95, Math.round(cellCenterX))),
        y: Math.max(5, Math.min(95, Math.round(cellCenterY))),
        widthPercent: Math.max(15, Math.round(cellWidthPercent * 0.94)),
        heightPx: cellHeightPx,
        cols: 1,
        rows: 1,
        gapMm: targetGrid.gapMm,
        borderRadius: targetGrid.borderRadius,
        borderWidth: targetGrid.borderWidth,
        borderColor: targetGrid.borderColor,
        rotation: targetGrid.rotation || 0,
        isLocked: false,
        cells: [
          {
            ...cell,
            id: `cell-split-${Date.now()}-${idx}`,
            col: 0,
            row: 0,
            colSpan: 1,
            rowSpan: 1,
          },
        ],
      };
    });

    const remainingGrids = pageGrids.filter((g) => g.id !== gridId);
    const updatedGrids = [...remainingGrids, ...newGrids];
    handleUpdateGrids(updatedGrids);
    setSelectedGridIds(newGrids.map((g) => g.id));
    setSelectedGridId(newGrids[0].id);
  };

  const handleDuplicateGrid = (gridId: string) => {
    const target = pageGrids.find((g) => g.id === gridId);
    if (!target) return;

    const newGridId = `grid-${Date.now()}`;
    const duplicatedCells: CollageCell[] = target.cells.map((c, idx) => ({
      ...c,
      id: `cell-${Date.now()}-${idx}`,
      photo: c.photo ? { ...c.photo } : null,
    }));

    const newGrid: CollageGridElement = {
      ...target,
      id: newGridId,
      y: Math.min(88, target.y + 16),
      cells: duplicatedCells,
    };

    const newGrids = [...pageGrids, newGrid];
    handleUpdateGrids(newGrids);
    setSelectedGridIds([newGridId]);
    setSelectedGridId(newGridId);
  };

  const handleClearGridPhotos = (gridId: string) => {
    const target = pageGrids.find((g) => g.id === gridId);
    if (!target) return;

    const clearedCells = target.cells.map((c) => ({
      ...c,
      photo: null,
    }));

    handleUpdateSingleGrid(gridId, { cells: clearedCells });
  };

  // Auto-fit grids intelligently to safe printable margin boundaries
  const handleAutoFitGridsToPage = () => {
    const headerH =
      project.kopSurat.enabled && activePage.showKopSurat !== false && activePageIndex === 0
        ? 80
        : 0;
    const topUsed = padTopPx + headerH;
    const maxAvailableH = Math.max(140, baseCanvasHeight - topUsed - padBottomPx - 10);
    const optimalY = topUsed + maxAvailableH / 2;
    const optimalYPercent = Math.round((optimalY / baseCanvasHeight) * 100);
    const optimalWidthPercent = Math.min(
      94,
      Math.max(60, Math.round(100 - ((padLeftPx + padRightPx + 16) / baseCanvasWidth) * 100))
    );

    if (pageGrids.length === 1) {
      handleUpdateSingleGrid(pageGrids[0].id, {
        heightPx: Math.round(maxAvailableH),
        y: optimalYPercent,
        x: 50,
        widthPercent: optimalWidthPercent,
      });
      onUpdateActivePage({
        gridHeightPx: Math.round(maxAvailableH),
        gridWidthPercent: optimalWidthPercent,
      });
    } else if (pageGrids.length > 1) {
      const totalCurrentH = pageGrids.reduce((sum, g) => sum + g.heightPx, 0);
      const spacing = 12 * (pageGrids.length - 1);
      const scaleFactor = Math.min(1, (maxAvailableH - spacing) / totalCurrentH);

      let currentTop = topUsed + 4;
      const updated = pageGrids.map((g) => {
        const newH = Math.max(70, Math.round(g.heightPx * scaleFactor));
        const gridCenterY = currentTop + newH / 2;
        currentTop += newH + 12;
        return {
          ...g,
          heightPx: newH,
          y: Math.round((gridCenterY / baseCanvasHeight) * 100),
          widthPercent: Math.min(g.widthPercent, optimalWidthPercent),
        };
      });
      handleUpdateGrids(updated);
    }
  };

  // Check if any grid or element extends past the bottom margin boundary
  const isAnyGridOverflowing = React.useMemo(() => {
    const headerH =
      project.kopSurat.enabled && activePage.showKopSurat !== false && activePageIndex === 0
        ? 80
        : 0;
    const safeTop = padTopPx + headerH;
    const safeBottom = baseCanvasHeight - padBottomPx;
    return pageGrids.some((g) => {
      const gridTop = (g.y / 100) * baseCanvasHeight - g.heightPx / 2;
      const gridBottom = (g.y / 100) * baseCanvasHeight + g.heightPx / 2;
      return gridBottom > safeBottom + 6 || gridTop < safeTop - 6;
    });
  }, [
    pageGrids,
    baseCanvasHeight,
    padTopPx,
    padBottomPx,
    project.kopSurat.enabled,
    activePage.showKopSurat,
    activePageIndex,
  ]);

  const handleAddSlotToGrid = (gridId: string) => {
    const target = pageGrids.find((g) => g.id === gridId);
    if (!target) return;

    const newIdx = target.cells.length;
    const cols = target.cols || 2;
    const newCell: CollageCell = {
      id: `cell-${Date.now()}-${newIdx}`,
      row: Math.floor(newIdx / cols),
      col: newIdx % cols,
      aspectRatio: '4:3',
      objectFit: 'cover',
      photo: null,
      caption: '',
      showCaption: false,
      rotation: 0,
    };

    handleUpdateSingleGrid(gridId, {
      cells: [...target.cells, newCell],
    });
  };

  const handleRemoveSlotFromGrid = (gridId: string) => {
    const target = pageGrids.find((g) => g.id === gridId);
    if (!target || target.cells.length <= 1) return;

    handleUpdateSingleGrid(gridId, {
      cells: target.cells.slice(0, -1),
    });
  };

  // Floating text updater
  const handleUpdateFloatingText = (id: string, updated: Partial<FloatingTextElement>) => {
    const list = activePage.floatingTexts || [];
    const newList = list.map((t) => (t.id === id ? { ...t, ...updated } : t));
    onUpdateActivePage({ floatingTexts: newList });
  };

  const handleDeleteFloatingText = (id: string) => {
    const list = activePage.floatingTexts || [];
    const newList = list.filter((t) => t.id !== id);
    onUpdateActivePage({ floatingTexts: newList });
    if (selectedTextId === id) onSelectTextId(null);
  };

  // Mouse move and up global handlers for smooth dragging & resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!paperRef.current) return;
      const paperRect = paperRef.current.getBoundingClientRect();

      // 0. MARQUEE SELECTION DRAG
      if (isMarqueeSelecting && marqueeBox) {
        const curX = Math.max(0, Math.min(100, ((e.clientX - paperRect.left) / paperRect.width) * 100));
        const curY = Math.max(0, Math.min(100, ((e.clientY - paperRect.top) / paperRect.height) * 100));

        setMarqueeBox((prev) => (prev ? { ...prev, currentX: curX, currentY: curY } : null));

        const boxMinX = Math.min(marqueeBox.startX, curX);
        const boxMaxX = Math.max(marqueeBox.startX, curX);
        const boxMinY = Math.min(marqueeBox.startY, curY);
        const boxMaxY = Math.max(marqueeBox.startY, curY);

        const hitGridIds = pageGrids
          .filter((g) => {
            const gMinX = g.x - g.widthPercent / 2;
            const gMaxX = g.x + g.widthPercent / 2;
            const gHeightPercent = (g.heightPx / paperRect.height) * 100;
            const gMinY = g.y - gHeightPercent / 2;
            const gMaxY = g.y + gHeightPercent / 2;

            return !(gMaxX < boxMinX || gMinX > boxMaxX || gMaxY < boxMinY || gMinY > boxMaxY);
          })
          .map((g) => g.id);

        setSelectedGridIds(hitGridIds);
        if (hitGridIds.length > 0) {
          setSelectedGridId(hitGridIds[hitGridIds.length - 1]);
        }
      }

      // 1. FREEFORM GRID MOVE DRAGGING (SINGLE OR MULTI-GRID)
      if (isDraggingGrid && gridDragStart) {
        const deltaX = e.clientX - gridDragStart.startX;
        const deltaY = e.clientY - gridDragStart.startY;

        const deltaXPercent = (deltaX / paperRect.width) * 100;
        const deltaYPercent = (deltaY / paperRect.height) * 100;

        if (Math.hypot(deltaX, deltaY) > 3) {
          gridDragStart.hasMoved = true;
        }

        let snapV = false;
        let snapH = false;

        const updatedGrids = pageGrids.map((g) => {
          const initPos = gridDragStart.initialPositions.find((p) => p.id === g.id);
          if (!initPos) return g;

          let newX = Math.max(5, Math.min(95, initPos.x + deltaXPercent));
          let newY = Math.max(5, Math.min(95, initPos.y + deltaYPercent));

          // Center magnetic snap for primary or moving grid
          if (Math.abs(newX - 50) < 1.6) {
            newX = 50;
            snapV = true;
          }
          if (Math.abs(newY - 50) < 1.6) {
            newY = 50;
            snapH = true;
          }

          return { ...g, x: newX, y: newY };
        });

        setSnapVertical(snapV);
        setSnapHorizontal(snapH);
        handleUpdateGrids(updatedGrids);
      }

      // 2. FREEFORM GRID RESIZING (8 HANDLES)
      if (isResizingGrid && gridResizeData) {
        const deltaX = e.clientX - gridResizeData.startX;
        const deltaY = e.clientY - gridResizeData.startY;
        const deltaXPercent = (deltaX / paperRect.width) * 100;

        let newWidth = gridResizeData.initialWidthPercent;
        let newHeight = gridResizeData.initialHeightPx;
        let newX = gridResizeData.initialX;
        let newY = gridResizeData.initialY;

        switch (gridResizeData.handle) {
          case 'bottom':
            newHeight = Math.max(100, Math.min(850, gridResizeData.initialHeightPx + deltaY));
            break;
          case 'top':
            newHeight = Math.max(100, Math.min(850, gridResizeData.initialHeightPx - deltaY));
            newY = gridResizeData.initialY + ((deltaY / 2) / paperRect.height) * 100;
            break;
          case 'right':
            newWidth = Math.max(20, Math.min(100, gridResizeData.initialWidthPercent + deltaXPercent * 2));
            break;
          case 'left':
            newWidth = Math.max(20, Math.min(100, gridResizeData.initialWidthPercent - deltaXPercent * 2));
            break;
          case 'br': {
            const scale = Math.max(0.2, 1 + deltaX / 200);
            newWidth = Math.max(20, Math.min(100, gridResizeData.initialWidthPercent * scale));
            newHeight = Math.max(100, Math.min(850, Math.round(gridResizeData.initialHeightPx * scale)));
            break;
          }
          case 'bl': {
            const scale = Math.max(0.2, 1 - deltaX / 200);
            newWidth = Math.max(20, Math.min(100, gridResizeData.initialWidthPercent * scale));
            newHeight = Math.max(100, Math.min(850, Math.round(gridResizeData.initialHeightPx * scale)));
            break;
          }
          case 'tr': {
            const scale = Math.max(0.2, 1 + deltaX / 200);
            newWidth = Math.max(20, Math.min(100, gridResizeData.initialWidthPercent * scale));
            newHeight = Math.max(100, Math.min(850, Math.round(gridResizeData.initialHeightPx * scale)));
            break;
          }
          case 'tl': {
            const scale = Math.max(0.2, 1 - deltaX / 200);
            newWidth = Math.max(20, Math.min(100, gridResizeData.initialWidthPercent * scale));
            newHeight = Math.max(100, Math.min(850, Math.round(gridResizeData.initialHeightPx * scale)));
            break;
          }
        }

        handleUpdateSingleGrid(gridResizeData.gridId, {
          widthPercent: Math.round(newWidth),
          heightPx: Math.round(newHeight),
          x: newX,
          y: newY,
        });

        // Compute physical cm for live Canva badge
        const widthCm = ((newWidth / 100) * (widthMm / 10)).toFixed(1).replace('.', ',');
        const heightCm = ((newHeight / 37.795) * 1).toFixed(1).replace('.', ',');

        setResizeTooltip({
          x: e.clientX + 16,
          y: e.clientY + 16,
          label: 'Kisi',
          widthCm: `l: ${widthCm}`,
          heightCm: `t: ${heightCm}`,
        });
      }

      // 3. GRID ROTATION
      if (isRotatingGrid && gridRotateStart) {
        const currentAngle =
          Math.atan2(e.clientY - gridRotateStart.centerY, e.clientX - gridRotateStart.centerX) *
          (180 / Math.PI);

        let deltaAngle = currentAngle - gridRotateStart.startAngle;
        let newRotation = (gridRotateStart.initialRotation + deltaAngle) % 360;
        if (newRotation < 0) newRotation += 360;

        if (Math.abs(newRotation) < 3 || Math.abs(newRotation - 360) < 3) newRotation = 0;
        else if (Math.abs(newRotation - 90) < 3) newRotation = 90;
        else if (Math.abs(newRotation - 180) < 3) newRotation = 180;
        else if (Math.abs(newRotation - 270) < 3) newRotation = 270;

        handleUpdateSingleGrid(gridRotateStart.gridId, { rotation: Math.round(newRotation) });
      }

      // 4. FLOATING TEXT MOVE DRAGGING
      if (isDraggingText && dragStartPos && selectedTextId) {
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;

        const deltaXPercent = (deltaX / paperRect.width) * 100;
        const deltaYPercent = (deltaY / paperRect.height) * 100;

        let newX = Math.max(3, Math.min(97, dragStartPos.textX + deltaXPercent));
        let newY = Math.max(3, Math.min(97, dragStartPos.textY + deltaYPercent));

        if (Math.abs(newX - 50) < 1.4) {
          newX = 50;
          setSnapVertical(true);
        } else {
          setSnapVertical(false);
        }

        if (Math.abs(newY - 50) < 1.4) {
          newY = 50;
          setSnapHorizontal(true);
        } else {
          setSnapHorizontal(false);
        }

        handleUpdateFloatingText(selectedTextId, { x: newX, y: newY });
      }

      // 5. TEXT CORNER RESIZING
      if (isResizingText && resizeData) {
        const currentDist = Math.hypot(
          e.clientX - resizeData.centerX,
          e.clientY - resizeData.centerY
        );
        const scale = Math.max(0.15, currentDist / resizeData.initialDistance);

        const newFontSize = Math.max(
          6,
          Math.min(220, +(resizeData.startFontSize * scale).toFixed(1))
        );
        const newWidth = Math.max(
          60,
          Math.min(1400, Math.round(resizeData.startWidth * scale))
        );

        handleUpdateFloatingText(resizeData.textId, {
          fontSize: newFontSize,
          width: newWidth,
        });
      }

      // 6. TEXT SIDE WIDTH RESIZING
      if (isResizingWidth && resizeWidthData) {
        const deltaX =
          resizeWidthData.side === 'right'
            ? e.clientX - resizeWidthData.startX
            : resizeWidthData.startX - e.clientX;

        const newWidth = Math.max(
          80,
          Math.min(paperRect.width * 0.95, resizeWidthData.startWidth + deltaX * 2)
        );

        handleUpdateFloatingText(resizeWidthData.textId, { width: newWidth });
      }

      // 7. TEXT ROTATION
      if (isRotatingText && rotateStartAngle && selectedTextId) {
        const currentAngle =
          Math.atan2(
            e.clientY - rotateStartAngle.centerY,
            e.clientX - rotateStartAngle.centerX
          ) *
          (180 / Math.PI);

        let deltaAngle = currentAngle - rotateStartAngle.startAngle;
        let newRotation = (rotateStartAngle.initialRotation + deltaAngle) % 360;
        if (newRotation < 0) newRotation += 360;

        if (Math.abs(newRotation) < 3 || Math.abs(newRotation - 360) < 3) newRotation = 0;
        else if (Math.abs(newRotation - 90) < 3) newRotation = 90;
        else if (Math.abs(newRotation - 180) < 3) newRotation = 180;
        else if (Math.abs(newRotation - 270) < 3) newRotation = 270;

        handleUpdateFloatingText(selectedTextId, { rotation: Math.round(newRotation) });
      }
    };

    const handleMouseUp = () => {
      setIsMarqueeSelecting(false);
      setMarqueeBox(null);

      setIsDraggingGrid(false);
      setIsResizingGrid(false);
      setIsRotatingGrid(false);
      setGridDragStart(null);
      setGridResizeData(null);
      setGridRotateStart(null);

      setIsDraggingText(false);
      setIsResizingText(false);
      setIsResizingWidth(false);
      setIsRotatingText(false);
      setDragStartPos(null);
      setResizeData(null);
      setResizeWidthData(null);
      setRotateStartAngle(null);

      setResizeTooltip(null);
      setSnapVertical(false);
      setSnapHorizontal(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isMarqueeSelecting,
    marqueeBox,
    isDraggingGrid,
    gridDragStart,
    isResizingGrid,
    gridResizeData,
    isRotatingGrid,
    gridRotateStart,
    isDraggingText,
    dragStartPos,
    isResizingText,
    resizeData,
    isResizingWidth,
    resizeWidthData,
    isRotatingText,
    rotateStartAngle,
    selectedTextId,
    widthMm,
    pageGrids,
  ]);

  // Keyboard Shortcuts (Ctrl+G, Ctrl+Shift+G, Delete, Ctrl+D, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+G: Pisahkan Kisi
          if (selectedGridId) {
            handleUngroupGrid(selectedGridId);
          }
        } else {
          // Ctrl+G: Kelompokkan / Gabung Kisi
          if (selectedGridIds.length > 1) {
            handleCombineSelectedGrids();
          }
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedGridIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedGrids();
        } else if (selectedTextId) {
          e.preventDefault();
          handleDeleteFloatingText(selectedTextId);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedGridIds.length > 1) {
          handleDuplicateSelectedGrids();
        } else if (selectedGridId) {
          handleDuplicateGrid(selectedGridId);
        }
      }

      if (e.key === 'Escape') {
        setSelectedGridIds([]);
        setSelectedGridId(null);
        onSelectTextId(null);
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGridIds, selectedGridId, selectedTextId, pageGrids]);

  // Drop photo to cell handler
  const handleDrop = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCellId(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const photo: PhotoMetadata = JSON.parse(dataStr);
        onDropPhotoToCell(cellId, photo);
        return;
      }
    } catch {
      // ignore
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          if (loadEvt.target?.result) {
            const newPhoto: PhotoMetadata = {
              id: 'photo-' + Date.now(),
              name: file.name,
              dataUrl: loadEvt.target.result as string,
              sizeBytes: file.size,
            };
            onDropPhotoToCell(cellId, newPhoto);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div
      className="flex-1 bg-slate-950 flex flex-col items-center justify-start relative overflow-hidden select-none"
      onClick={() => {
        onSelectTextId(null);
        setSelectedGridId(null);
        setActiveCellId(null);
        setOpenGridMenuId(null);
        setOpenTrashDropdownId(null);
      }}
    >
      {/* Top Floating Action Toolbars */}
      <div className="absolute top-3 z-40 flex flex-col items-center gap-2 max-w-[95vw] pointer-events-auto">
        {selectedText ? (
          <FloatingTextToolbar
            selectedText={selectedText}
            onUpdateText={(updated) => handleUpdateFloatingText(selectedText.id, updated)}
            onDeleteText={() => handleDeleteFloatingText(selectedText.id)}
            onDuplicateText={() => {
              onAddFloatingText({
                ...selectedText,
                x: Math.min(90, selectedText.x + 4),
                y: Math.min(90, selectedText.y + 4),
              });
            }}
            onClose={() => onSelectTextId(null)}
          />
        ) : activeGrid && selectedGridId === activeGrid.id ? (
          <GridFrameToolbar
            selectedGrid={activeGrid}
            activePage={activePage}
            onUpdateGrid={(updated) => handleUpdateSingleGrid(activeGrid.id, updated)}
            onDuplicateGrid={() => handleDuplicateGrid(activeGrid.id)}
            onDeleteGrid={() => handleDeleteGrid(activeGrid.id)}
            onAutoFitToPage={handleAutoFitGridsToPage}
            onUpdateActivePage={onUpdateActivePage}
            onAddCell={() => handleAddSlotToGrid(activeGrid.id)}
            onRemoveLastCell={() => handleRemoveSlotFromGrid(activeGrid.id)}
            onClearAllPhotos={() => handleClearGridPhotos(activeGrid.id)}
            onOpenTemplateGallery={onOpenTemplateGallery}
            onClose={() => setSelectedGridId(null)}
          />
        ) : null}
      </div>

      {/* Overflow Warning Banner */}
      {isAnyGridOverflowing && (
        <div className="absolute top-16 z-30 bg-amber-500/95 backdrop-blur-md text-slate-950 font-bold px-3 py-1.5 rounded-xl shadow-lg border border-amber-300 text-xs flex items-center gap-2 animate-bounce select-none pointer-events-auto">
          <span>⚠️ Kisi foto melebihi batas margin bawah kertas cetak</span>
          <button
            type="button"
            onClick={handleAutoFitGridsToPage}
            className="px-2 py-0.5 bg-slate-900 text-amber-300 hover:bg-black rounded-lg text-[11px] font-extrabold transition shadow"
          >
            Pas-kan ke Kertas
          </button>
        </div>
      )}

      {/* Center Canvas Area with Scroll */}
      <div
        id="canvas-scroll-container"
        className="flex-1 w-full overflow-auto flex flex-col items-center justify-start p-4 sm:p-8 pt-8 pb-32 relative bg-slate-950/70"
      >
        {/* Scaling Sizer to guarantee correct layout footprint and prevent flexbox squashing */}
        <div
          className="flex-shrink-0 flex items-start justify-center transition-all duration-75 my-auto"
          style={{
            width: `${baseCanvasWidth * (zoomLevel / 100)}px`,
            height: `${baseCanvasHeight * (zoomLevel / 100)}px`,
            minWidth: `${baseCanvasWidth * (zoomLevel / 100)}px`,
            minHeight: `${baseCanvasHeight * (zoomLevel / 100)}px`,
          }}
        >
          {/* Paper Container Replica (1:1 Exact Ratio scaled via Transform) */}
          <div
            ref={paperRef}
            id="document-paper-sheet"
            className={`bg-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] relative ${
              croppingData ? 'overflow-visible' : 'overflow-hidden'
            } flex-shrink-0 ring-1 ring-slate-300/90 cursor-crosshair select-none`}
            style={{
              width: `${baseCanvasWidth}px`,
              height: `${baseCanvasHeight}px`,
              minWidth: `${baseCanvasWidth}px`,
              minHeight: `${baseCanvasHeight}px`,
              maxWidth: `${baseCanvasWidth}px`,
              maxHeight: `${baseCanvasHeight}px`,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              fontFamily: project.fontFamily || 'Arial',
            }}
          onMouseDown={(e) => {
            // Initiate marquee drag selection if left click on paper background
            if (e.button !== 0) return;
            if (!paperRef.current) return;
            const rect = paperRef.current.getBoundingClientRect();
            const startX = ((e.clientX - rect.left) / rect.width) * 100;
            const startY = ((e.clientY - rect.top) / rect.height) * 100;

            setIsMarqueeSelecting(true);
            setMarqueeBox({
              startX,
              startY,
              currentX: startX,
              currentY: startY,
            });

            if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
              setSelectedGridIds([]);
              setSelectedGridId(null);
              onSelectTextId(null);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {/* Marquee Drag Selection Box Visualizer */}
          {isMarqueeSelecting && marqueeBox && (
            <div
              className="absolute bg-purple-500/20 border-2 border-purple-500 border-dashed rounded z-50 pointer-events-none transition-none"
              style={{
                left: `${Math.min(marqueeBox.startX, marqueeBox.currentX)}%`,
                top: `${Math.min(marqueeBox.startY, marqueeBox.currentY)}%`,
                width: `${Math.abs(marqueeBox.currentX - marqueeBox.startX)}%`,
                height: `${Math.abs(marqueeBox.currentY - marqueeBox.startY)}%`,
              }}
            />
          )}

          {/* Unified Multi-Selection Bounding Box & Group Toolbar */}
          {selectedGridIds.length > 1 && multiSelectionBounds && (
            <div
              className="absolute pointer-events-none border-2 border-purple-600 border-dashed rounded-lg z-40 transition-none"
              style={{
                left: `${multiSelectionBounds.minX}%`,
                top: `${multiSelectionBounds.minY}%`,
                width: `${multiSelectionBounds.maxX - multiSelectionBounds.minX}%`,
                height: `${multiSelectionBounds.maxY - multiSelectionBounds.minY}%`,
              }}
            >
              {/* Floating Multi-Selection Action Toolbar */}
              <div
                className="absolute -top-11 left-1/2 -translate-x-1/2 pointer-events-auto bg-white text-slate-800 rounded-xl shadow-2xl border border-purple-200 px-2 py-1.5 flex items-center gap-1.5 z-50 animate-in fade-in zoom-in-95 font-semibold text-xs select-none"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleCombineSelectedGrids}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition"
                  title="Gabungkan kisi terpilih menjadi satu kesatuan (Ctrl+G)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kelompokkan ({selectedGridIds.length})</span>
                </button>

                <div className="w-px h-4 bg-slate-200 my-auto" />

                <button
                  type="button"
                  onClick={handleDuplicateSelectedGrids}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-purple-700 transition"
                  title="Duplikat Semua Terpilih (Ctrl+D)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleLockSelectedGrids}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-amber-600 transition"
                  title="Kunci / Buka Kunci Semua Terpilih"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelectedGrids}
                  className="p-1.5 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg transition"
                  title="Hapus Semua Terpilih (Delete)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Smart Magnetic Snap Guidelines */}
          {snapVertical && (
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500 z-50 pointer-events-none -translate-x-1/2 shadow-xs" />
          )}
          {snapHorizontal && (
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-rose-500 z-50 pointer-events-none -translate-y-1/2 shadow-xs" />
          )}

          {/* Visible Physical Margin Guideline Box */}
          {showMarginGuides && (
            <div
              className="absolute pointer-events-none border border-dashed border-sky-400/60 z-30 transition-all rounded-xs select-none"
              style={{
                top: `${padTopPx}px`,
                bottom: `${padBottomPx}px`,
                left: `${padLeftPx}px`,
                right: `${padRightPx}px`,
              }}
            >
              <div className="absolute -top-3.5 left-0 text-[8.5px] font-mono font-bold text-sky-700 bg-sky-100/90 px-1.5 py-0.5 rounded shadow-xs">
                Margin Aman: T:{project.margins.top} B:{project.margins.bottom} L:{project.margins.left} R:{project.margins.right} cm
              </div>
            </div>
          )}

          {/* Paper Margins Visual Padding Guide */}
          <div
            className="w-full h-full relative pointer-events-auto cursor-default"
            style={{
              paddingTop: `${padTopPx}px`,
              paddingBottom: `${padBottomPx}px`,
              paddingLeft: `${padLeftPx}px`,
              paddingRight: `${padRightPx}px`,
            }}
          >
            {/* ========================================================= */}
            {/* FREEFORM DRAGGABLE & RESIZABLE PHOTO GRIDS */}
            {/* ========================================================= */}
            {activePage.showCollageGrid !== false &&
              pageGrids.map((grid) => {
                const isSelected = selectedGridIds.includes(grid.id) || selectedGridId === grid.id;
                const isCroppingThisGrid = croppingData?.gridId === grid.id;
                const cols = grid.cols || 2;
                const gridGap = grid.gapMm !== undefined ? grid.gapMm : 3;

                return (
                  <div
                    key={grid.id}
                    id={grid.id}
                    className={`absolute select-none transition-shadow ${
                      isCroppingThisGrid
                        ? 'z-50 overflow-visible'
                        : isSelected
                        ? 'ring-2 ring-purple-600 shadow-xl z-30'
                        : 'hover:ring-1 hover:ring-purple-400/60 z-10'
                    }`}
                    style={{
                      left: `${grid.x}%`,
                      top: `${grid.y}%`,
                      width: `${grid.widthPercent}%`,
                      height: `${grid.heightPx}px`,
                      transform: `translate(-50%, -50%) rotate(${grid.rotation || 0}deg)`,
                      cursor: isSelected ? 'move' : 'pointer',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (e.button !== 0) return; // only left click

                      let activeSelected = selectedGridIds;
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        if (selectedGridIds.includes(grid.id)) {
                          activeSelected = selectedGridIds.filter((id) => id !== grid.id);
                        } else {
                          activeSelected = [...selectedGridIds, grid.id];
                        }
                      } else {
                        if (!selectedGridIds.includes(grid.id)) {
                          activeSelected = [grid.id];
                        }
                      }

                      setSelectedGridIds(activeSelected);
                      setSelectedGridId(grid.id);
                      onSelectTextId(null);

                      if (!grid.isLocked) {
                        setIsDraggingGrid(true);
                        const movingTargets = activeSelected.length > 0 ? activeSelected : [grid.id];
                        const initPositions = movingTargets
                          .map((tId) => pageGrids.find((g) => g.id === tId))
                          .filter((g): g is CollageGridElement => !!g)
                          .map((g) => ({ id: g.id, x: g.x, y: g.y }));

                        setGridDragStart({
                          startX: e.clientX,
                          startY: e.clientY,
                          initialPositions: initPositions,
                          gridId: grid.id,
                          hasMoved: false,
                        });
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Only update selection, do NOT open photo modal
                      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                        if (selectedGridIds.length <= 1) {
                          setSelectedGridIds([grid.id]);
                          setSelectedGridId(grid.id);
                        }
                      }
                      onSelectTextId(null);
                    }}
                  >
                    {/* --------------------------------------------------- */}
                    {/* CANVA-STYLE MINI ACTION BAR (ABOVE SELECTED GRID)   */}
                    {/* --------------------------------------------------- */}
                    {isSelected && selectedGridIds.length <= 1 && (
                      <div
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200 px-1.5 py-1 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 select-none"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Pisahkan (Ungroup/Split) Button if grid has multiple slots */}
                        {grid.cells.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleUngroupGrid(grid.id)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-bold text-xs flex items-center gap-1 transition"
                            title="Pisahkan kisi ini menjadi slot terpisah (Ctrl+Shift+G)"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
                            <span>Pisahkan</span>
                          </button>
                        )}

                        {/* Duplicate Button */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateGrid(grid.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-700 hover:text-purple-700 transition"
                          title="Duplikat Kisi (Ctrl+D)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Lock/Unlock Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSingleGrid(grid.id, { isLocked: !grid.isLocked })
                          }
                          className={`p-1 rounded transition ${
                            grid.isLocked
                              ? 'bg-amber-100 text-amber-700'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                          title={grid.isLocked ? 'Buka Kunci' : 'Kunci Posisi'}
                        >
                          {grid.isLocked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Trash Button with Dropdown (Hapus gambar / Hapus kisi) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenTrashDropdownId(
                                openTrashDropdownId === grid.id ? null : grid.id
                              )
                            }
                            className="p-1 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded transition"
                            title="Hapus gambar atau kisi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {openTrashDropdownId === grid.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 w-36 z-50 text-xs font-semibold text-slate-700 animate-in fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  handleClearGridPhotos(grid.id);
                                  setOpenTrashDropdownId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>Hapus gambar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteGrid(grid.id);
                                  setOpenTrashDropdownId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                              >
                                <LayoutGrid className="w-3.5 h-3.5 text-rose-500" />
                                <span>Hapus kisi</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* More Menu (...) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenGridMenuId(
                                openGridMenuId === grid.id ? null : grid.id
                              )
                            }
                            className="p-1 hover:bg-slate-100 rounded text-slate-700 transition"
                            title="Opsi lainnya"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {openGridMenuId === grid.id && (
                            <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-44 z-50 text-xs font-medium text-slate-800 animate-in fade-in space-y-0.5">
                              {grid.cells.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUngroupGrid(grid.id);
                                    setOpenGridMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-purple-50 text-purple-700 flex items-center justify-between font-semibold"
                                >
                                  <span>Pisahkan Kisi</span>
                                  <span className="text-[10px] text-purple-500 font-mono">Ctrl+Shift+G</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setCopiedGrid(grid);
                                  setOpenGridMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center justify-between"
                              >
                                <span>Salin</span>
                                <span className="text-[10px] text-slate-400 font-mono">Ctrl+C</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleDuplicateGrid(grid.id);
                                  setOpenGridMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center justify-between"
                              >
                                <span>Duplikat</span>
                                <span className="text-[10px] text-slate-400 font-mono">Ctrl+D</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteGrid(grid.id);
                                  setOpenGridMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 flex items-center justify-between"
                              >
                                <span>Hapus kisi</span>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="h-px bg-slate-200 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateSingleGrid(grid.id, { x: 50, y: 50 });
                                  setOpenGridMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2"
                              >
                                <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-slate-500" />
                                <span>Pusatkan ke Lembar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleClearGridPhotos(grid.id);
                                  setOpenGridMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>Kosongkan gambar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* --------------------------------------------------- */}
                    {/* PHOTO CELLS GRID CONTAINER (NO UNINTENDED AUTO-CLICK)*/}
                    {/* --------------------------------------------------- */}
                    <div
                      className="w-full h-full grid"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${grid.rows || Math.max(1, Math.ceil(grid.cells.length / cols))}, minmax(0, 1fr))`,
                        gap: `${gridGap}px`,
                      }}
                    >
                      {grid.cells.map((cell, cIdx) => {
                        const isDragOver = dragOverCellId === cell.id;
                        const isCroppingThisCell = croppingData?.cell.id === cell.id;

                        return (
                          <div
                            key={cell.id}
                            id={`cell-${cell.id}`}
                            className={`relative group ${
                              isCroppingThisCell ? 'overflow-visible z-50' : 'overflow-hidden'
                            } transition-all flex flex-col justify-between ${
                              isDragOver ? 'ring-2 ring-emerald-500 scale-[1.01]' : ''
                            }`}
                            style={{
                              borderRadius: `${grid.borderRadius ?? 2}px`,
                              borderWidth: `${grid.borderWidth !== undefined ? grid.borderWidth : 1}px`,
                              borderColor: grid.borderColor || '#94a3b8',
                              borderStyle: 'solid',
                              gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined,
                              gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined,
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverCellId(cell.id);
                            }}
                            onDragLeave={() => setDragOverCellId(null)}
                            onDrop={(e) => handleDrop(e, cell.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Selection only, no unintended modal popup
                              if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                if (selectedGridIds.includes(grid.id)) {
                                  setSelectedGridIds(prev => prev.filter(id => id !== grid.id));
                                } else {
                                  setSelectedGridIds(prev => [...prev, grid.id]);
                                }
                              } else {
                                setSelectedGridIds([grid.id]);
                                setSelectedGridId(grid.id);
                              }
                              setActiveCellId(cell.id);
                              onSelectTextId(null);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              // In Canva: double click photo opens cropper directly!
                              if (cell.photo) {
                                setCroppingData({ gridId: grid.id, cell });
                              } else {
                                onOpenPhotoPickerForCell(cell.id);
                              }
                            }}
                          >
                            {/* Photo or Canva-style Landscape Placeholder */}
                            <div className={`w-full h-full relative ${isCroppingThisCell ? 'overflow-visible' : 'overflow-hidden'} bg-slate-100 flex items-center justify-center`}>
                              {cell.photo ? (
                                <img
                                  src={cell.photo.dataUrl}
                                  alt=""
                                  className={`select-none pointer-events-none transition-transform ${
                                    isCroppingThisCell ? 'opacity-0' : 'opacity-100'
                                  }`}
                                  style={getPhotoImageStyle(cell)}
                                />
                              ) : (
                                <div className="w-full h-full relative flex items-center justify-center">
                                  <img
                                    src={CANVA_LANDSCAPE_PLACEHOLDER}
                                    alt=""
                                    className="w-full h-full object-cover select-none pointer-events-none opacity-80"
                                  />
                                  {/* Centered Add Photo Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenPhotoPickerForCell(cell.id);
                                    }}
                                    className="absolute p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center gap-1.5 text-xs font-bold border border-slate-200 transition opacity-80 hover:opacity-100 hover:scale-105"
                                    title="Pilih atau Unggah Foto"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Pilih Foto</span>
                                  </button>
                                </div>
                              )}

                              {/* Hover Overlay for Instant Replace, Rotate, Crop, or Clear (Hidden while cropping this cell) */}
                              {(!croppingData || croppingData.cell.id !== cell.id) && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2 text-white">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenPhotoPickerForCell(cell.id);
                                    }}
                                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition text-xs font-bold flex items-center gap-1 shadow"
                                    title="Ganti / Pilih Foto"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                  </button>

                                  {cell.photo && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCroppingData({ gridId: grid.id, cell });
                                        }}
                                        className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition text-xs shadow flex items-center gap-1"
                                        title="Pangkas & Putar Foto (Gaya Canva)"
                                      >
                                        <Crop className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextRot = ((cell.rotation || 0) + 90) % 360;
                                          const updatedCells = grid.cells.map((c) =>
                                            c.id === cell.id ? { ...c, rotation: nextRot } : c
                                          );
                                          handleUpdateSingleGrid(grid.id, { cells: updatedCells });
                                        }}
                                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition text-xs font-bold shadow"
                                        title="Putar Foto 90°"
                                      >
                                        <RotateCw className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updatedCells = grid.cells.map((c) =>
                                            c.id === cell.id ? { ...c, photo: null, cropRect: undefined } : c
                                          );
                                          handleUpdateSingleGrid(grid.id, { cells: updatedCells });
                                        }}
                                        className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-700 text-white transition text-xs font-bold shadow"
                                        title="Hapus Foto dari Slot Ini"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Canva-Style In-Place Photo Cropper */}
                              {croppingData && croppingData.cell.id === cell.id && cell.photo && (
                                <CanvaPhotoCropper
                                  photoUrl={cell.photo.dataUrl}
                                  initialCropRect={cell.cropRect}
                                  initialRotation={cell.rotation || 0}
                                  onApply={(cropRect, rotation) => {
                                    const currentGrids = activePage.grids || [];
                                    const updatedGrids = currentGrids.map((g) => {
                                      if (g.id === grid.id) {
                                        const updatedCells = g.cells.map((c) =>
                                          c.id === cell.id ? { ...c, cropRect, rotation } : c
                                        );
                                        return { ...g, cells: updatedCells };
                                      }
                                      return g;
                                    });
                                    handleUpdateGrids(updatedGrids);
                                    setCroppingData(null);
                                  }}
                                  onCancel={() => setCroppingData(null)}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* --------------------------------------------------- */}
                    {/* RESIZE HANDLES (8 DIRECTION HANDLES + ROTATE)       */}
                    {/* --------------------------------------------------- */}
                    {isSelected && !grid.isLocked && (
                      <>
                        {/* 4 Corner Handles (tl, tr, bl, br) */}
                        {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
                          const posClasses = {
                            tl: '-top-1.5 -left-1.5 cursor-nwse-resize',
                            tr: '-top-1.5 -right-1.5 cursor-nesw-resize',
                            bl: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
                            br: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
                          }[corner];

                          return (
                            <div
                              key={corner}
                              className={`absolute w-3.5 h-3.5 bg-white border-2 border-purple-600 rounded-full shadow-md z-40 ${posClasses}`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsResizingGrid(true);
                                setGridResizeData({
                                  gridId: grid.id,
                                  handle: corner,
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  initialWidthPercent: grid.widthPercent,
                                  initialHeightPx: grid.heightPx,
                                  initialX: grid.x,
                                  initialY: grid.y,
                                });
                              }}
                            />
                          );
                        })}

                        {/* Top Side Handle (Stretch Height from Top) */}
                        <div
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-purple-600 rounded-full cursor-ns-resize shadow-md z-40 hover:scale-110 transition"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsResizingGrid(true);
                            setGridResizeData({
                              gridId: grid.id,
                              handle: 'top',
                              startX: e.clientX,
                              startY: e.clientY,
                              initialWidthPercent: grid.widthPercent,
                              initialHeightPx: grid.heightPx,
                              initialX: grid.x,
                              initialY: grid.y,
                            });
                          }}
                        />

                        {/* Bottom Side Handle (Stretch Height from Bottom) */}
                        <div
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-purple-600 rounded-full cursor-ns-resize shadow-md z-40 hover:scale-110 transition"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsResizingGrid(true);
                            setGridResizeData({
                              gridId: grid.id,
                              handle: 'bottom',
                              startX: e.clientX,
                              startY: e.clientY,
                              initialWidthPercent: grid.widthPercent,
                              initialHeightPx: grid.heightPx,
                              initialX: grid.x,
                              initialY: grid.y,
                            });
                          }}
                        />

                        {/* Left Side Handle (Stretch Width from Left) */}
                        <div
                          className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-8 bg-purple-600 rounded-full cursor-ew-resize shadow-md z-40 hover:scale-110 transition"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsResizingGrid(true);
                            setGridResizeData({
                              gridId: grid.id,
                              handle: 'left',
                              startX: e.clientX,
                              startY: e.clientY,
                              initialWidthPercent: grid.widthPercent,
                              initialHeightPx: grid.heightPx,
                              initialX: grid.x,
                              initialY: grid.y,
                            });
                          }}
                        />

                        {/* Right Side Handle (Stretch Width from Right) */}
                        <div
                          className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-8 bg-purple-600 rounded-full cursor-ew-resize shadow-md z-40 hover:scale-110 transition"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsResizingGrid(true);
                            setGridResizeData({
                              gridId: grid.id,
                              handle: 'right',
                              startX: e.clientX,
                              startY: e.clientY,
                              initialWidthPercent: grid.widthPercent,
                              initialHeightPx: grid.heightPx,
                              initialX: grid.x,
                              initialY: grid.y,
                            });
                          }}
                        />

                        {/* Rotation Handle at Bottom */}
                        <div
                          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition z-40 text-slate-700"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const gridEl = document.getElementById(grid.id);
                            if (gridEl) {
                              const rect = gridEl.getBoundingClientRect();
                              const centerX = rect.left + rect.width / 2;
                              const centerY = rect.top + rect.height / 2;
                              const startAngle =
                                Math.atan2(e.clientY - centerY, e.clientX - centerX) *
                                (180 / Math.PI);

                              setIsRotatingGrid(true);
                              setGridRotateStart({
                                gridId: grid.id,
                                startAngle,
                                initialRotation: grid.rotation || 0,
                                centerX,
                                centerY,
                              });
                            }
                          }}
                          title="Putar Kisi"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            {/* ========================================================= */}
            {/* FREEFORM FLOATING TEXT ELEMENTS                           */}
            {/* ========================================================= */}
            {floatingTexts.map((ft) => {
              const isSelected = selectedTextId === ft.id;

              return (
                <div
                  key={ft.id}
                  id={ft.id}
                  className={`absolute transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-sky-500 shadow-xl z-40'
                      : 'hover:ring-1 hover:ring-sky-300/80 z-20 cursor-move select-none'
                  }`}
                  style={{
                    left: `${ft.x}%`,
                    top: `${ft.y}%`,
                    width: ft.width ? `${ft.width}px` : 'auto',
                    transform: `translate(-50%, -50%) rotate(${ft.rotation || 0}deg)`,
                  }}
                  onMouseDown={(e) => {
                    // If not already selected, clicking selects and prepares drag
                    if (!isSelected) {
                      e.stopPropagation();
                      onSelectTextId(ft.id);
                      setSelectedGridId(null);
                      if (!ft.isLocked) {
                        setIsDraggingText(true);
                        setDragStartPos({
                          x: e.clientX,
                          y: e.clientY,
                          textX: ft.x,
                          textY: ft.y,
                        });
                      }
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTextId(ft.id);
                    setSelectedGridId(null);
                  }}
                >
                  {/* Top Move / Drag Handle Badge when Selected */}
                  {isSelected && !ft.isLocked && (
                    <div
                      className="absolute -top-7 left-0 bg-sky-600 hover:bg-sky-500 text-white rounded-md px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-md cursor-move select-none z-50 transition"
                      title="Tarik untuk memindahkan posisi kotak teks"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDraggingText(true);
                        setDragStartPos({
                          x: e.clientX,
                          y: e.clientY,
                          textX: ft.x,
                          textY: ft.y,
                        });
                      }}
                    >
                      <Move className="w-3 h-3" />
                      <span>Pindah</span>
                    </div>
                  )}

                  {/* Text Content with Full Cursor Caret & Mouse Selection Support */}
                  <div
                    contentEditable={isSelected}
                    suppressContentEditableWarning
                    className={`w-full h-full p-1 rounded transition-colors ${
                      isSelected
                        ? 'cursor-text select-text pointer-events-auto'
                        : 'select-none pointer-events-none'
                    }`}
                    onMouseDown={(e) => {
                      if (isSelected) {
                        // Stop propagation so parent won't trigger canvas drag or box drag,
                        // enabling natural mouse text selection, double-click word selection,
                        // and precise cursor caret placement
                        e.stopPropagation();
                      }
                    }}
                    onBlur={(e) => {
                      handleUpdateFloatingText(ft.id, {
                        text: e.currentTarget.innerText || e.currentTarget.textContent || 'MASUKAN TEKS',
                      });
                    }}
                    style={{
                      ...getFloatingTextStyle(ft),
                      userSelect: isSelected ? 'text' : 'none',
                      WebkitUserSelect: isSelected ? 'text' : 'none',
                      outline: 'none',
                    }}
                  >
                    {ft.text}
                  </div>

                  {/* Text Transform Handles */}
                  {isSelected && !ft.isLocked && (
                    <>
                      {/* Corner Handles for Font Scaling */}
                      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
                        <div
                          key={corner}
                          className={`absolute w-3 h-3 bg-white border-2 border-sky-500 rounded-full shadow-md z-50 ${
                            corner === 'tl'
                              ? '-top-1.5 -left-1.5 cursor-nwse-resize'
                              : corner === 'tr'
                              ? '-top-1.5 -right-1.5 cursor-nesw-resize'
                              : corner === 'bl'
                              ? '-bottom-1.5 -left-1.5 cursor-nesw-resize'
                              : '-bottom-1.5 -right-1.5 cursor-nwse-resize'
                          }`}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(ft.id);
                            if (el) {
                              const rect = el.getBoundingClientRect();
                              const centerX = rect.left + rect.width / 2;
                              const centerY = rect.top + rect.height / 2;
                              const initialDistance = Math.hypot(
                                e.clientX - centerX,
                                e.clientY - centerY
                              );

                              setIsResizingText(true);
                              setResizeData({
                                textId: ft.id,
                                corner,
                                centerX,
                                centerY,
                                initialDistance,
                                startFontSize: ft.fontSize,
                                startWidth: ft.width || rect.width,
                                startHeight: rect.height,
                              });
                            }
                          }}
                        />
                      ))}

                      {/* Side Handles for Text Box Width */}
                      <div
                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-6 bg-sky-500 rounded-full cursor-ew-resize shadow-md z-50"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizingWidth(true);
                          setResizeWidthData({
                            textId: ft.id,
                            side: 'left',
                            startX: e.clientX,
                            startWidth: ft.width || 200,
                          });
                        }}
                      />
                      <div
                        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-6 bg-sky-500 rounded-full cursor-ew-resize shadow-md z-50"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizingWidth(true);
                          setResizeWidthData({
                            textId: ft.id,
                            side: 'right',
                            startX: e.clientX,
                            startWidth: ft.width || 200,
                          });
                        }}
                      />

                      {/* Rotation Handle */}
                      <div
                        className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition z-50 text-slate-700"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const el = document.getElementById(ft.id);
                          if (el) {
                            const rect = el.getBoundingClientRect();
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;
                            const startAngle =
                              Math.atan2(e.clientY - centerY, e.clientX - centerX) *
                              (180 / Math.PI);

                            setIsRotatingText(true);
                            setRotateStartAngle({
                              startAngle,
                              initialRotation: ft.rotation || 0,
                              centerX,
                              centerY,
                            });
                          }
                        }}
                      >
                        <RotateCw className="w-3 h-3" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

        {/* Live Canva Dimension Tooltip Badge */}
        {resizeTooltip && (
          <div
            className="fixed pointer-events-none z-50 bg-slate-900/95 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700 shadow-2xl flex items-center gap-1.5"
            style={{
              left: `${resizeTooltip.x}px`,
              top: `${resizeTooltip.y}px`,
            }}
          >
            <span>{resizeTooltip.widthCm}</span>
            <span className="text-slate-500">;</span>
            <span>{resizeTooltip.heightCm}</span>
          </div>
        )}

        {/* Bottom Page Navigation & Canvas Zoom/Margin Controls */}
        <div className="mt-6 flex flex-col items-center gap-3 z-30 justify-center">
          {/* Canvas View Tools Bar */}
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-2xl shadow-xl flex-wrap justify-center">
            {/* Paper Size & Real Dimensions Tag */}
            <button
              type="button"
              onClick={onOpenPaperModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/60 text-[11px] font-bold transition group"
              title="Klik untuk mengubah ukuran kertas & margin"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-white font-extrabold">{project.paperSize}</span>
              <span className="text-slate-400 font-mono text-[10px]">
                ({widthMm} × {heightMm} mm)
              </span>
              <span className="text-[10px] uppercase font-semibold px-1 py-0.2 rounded bg-slate-700/80 text-slate-300">
                {project.orientation}
              </span>
            </button>

            <div className="w-px h-4 bg-slate-700" />

            {/* Toggle Margin Guidelines */}
            <button
              type="button"
              onClick={() => setShowMarginGuides((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                showMarginGuides
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Tampilkan / Sembunyikan Garis Batas Margin Cetak"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Garis Margin: {showMarginGuides ? 'ON' : 'OFF'}</span>
            </button>

            <div className="w-px h-4 bg-slate-700" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(30, prev - 10))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                title="Perkecil Tampilan (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="text-[11px] font-mono font-bold text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
                title="Reset Zoom ke 100%"
              >
                {zoomLevel}%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(200, prev + 10))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                title="Perbesar Tampilan (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleFitToScreen}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300 text-[10.5px] font-bold border border-slate-700/50 transition"
                title="Sesuaikan ukuran lembar kertas agar pas dengan tinggi layar (Fit Page)"
              >
                Pas Layar
              </button>

              <button
                type="button"
                onClick={handleFitWidth}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-400 hover:text-amber-300 text-[10.5px] font-bold border border-slate-700/50 transition"
                title="Sesuaikan lebar lembar kertas agar nyaman dibaca (Fit Width)"
              >
                Pas Lebar
              </button>
            </div>
          </div>

          {/* Bottom Page Navigation & Add Page Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {onOpenAutoCollage && (
              <button
                type="button"
                onClick={onOpenAutoCollage}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white border border-sky-400/40 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-sky-950/50 transition active:scale-95"
                title="Otomatis susun foto ke dalam kisi"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>⚡ Auto Kolase Foto</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddPage}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Tambah Halaman Baru</span>
            </button>

            {/* Quick Page Navigators */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-lg">
              <button
                type="button"
                onClick={() => onSelectPageIndex(Math.max(0, activePageIndex - 1))}
                disabled={activePageIndex === 0}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-slate-300 px-2 font-mono">
                Halaman {activePageIndex + 1} dari {project.pages.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  onSelectPageIndex(Math.min(project.pages.length - 1, activePageIndex + 1))
                }
                disabled={activePageIndex === project.pages.length - 1}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
