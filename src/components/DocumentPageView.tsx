import React from 'react';
import type { DocumentPage, DocumentProject } from '../types';
import { CANVA_LANDSCAPE_PLACEHOLDER } from '../utils/constants';
import {
  getDocumentGeometry,
  getFloatingTextStyle,
  getPageGrids,
  getPhotoImageStyle,
} from '../utils/pageVisual';

interface DocumentPageViewProps {
  project: DocumentProject;
  page: DocumentPage;
  colorMode?: 'color' | 'mono';
  id?: string;
}

export const DocumentPageView: React.FC<DocumentPageViewProps> = ({
  project,
  page,
  colorMode = 'color',
  id,
}) => {
  const geometry = getDocumentGeometry(project);
  const pageIndex = project.pages.findIndex((candidate) => candidate.id === page.id);
  const grids = getPageGrids(page, project, Math.max(0, pageIndex));

  return (
    <div
      id={id}
      data-dokufoto-output-page={page.id}
      style={{
        width: `${geometry.baseCanvasWidth}px`,
        height: `${geometry.baseCanvasHeight}px`,
        position: 'relative',
        boxSizing: 'border-box',
        paddingTop: `${geometry.padTopPx}px`,
        paddingBottom: `${geometry.padBottomPx}px`,
        paddingLeft: `${geometry.padLeftPx}px`,
        paddingRight: `${geometry.padRightPx}px`,
        fontFamily: project.fontFamily || 'Arial',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        color: '#000000',
      }}
    >
      {page.showCollageGrid !== false &&
        grids.map((grid) => {
          const cols = grid.cols || 2;
          const rows = grid.rows || Math.max(1, Math.ceil(grid.cells.length / cols));

          return (
            <div
              key={grid.id}
              style={{
                position: 'absolute',
                zIndex: 10,
                left: `${grid.x}%`,
                top: `${grid.y}%`,
                width: `${grid.widthPercent}%`,
                height: `${grid.heightPx}px`,
                transform: `translate(-50%, -50%) rotate(${grid.rotation || 0}deg)`,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                  gap: `${grid.gapMm ?? 3}px`,
                }}
              >
                {grid.cells.map((cell, cellIndex) => (
                  <div
                    key={cell.id || cellIndex}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: `${grid.borderRadius ?? 2}px`,
                      borderWidth: `${grid.borderWidth ?? 1}px`,
                      borderColor: grid.borderColor || '#94a3b8',
                      borderStyle: 'solid',
                      gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined,
                      gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined,
                      backgroundColor: '#f1f5f9',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={cell.photo?.dataUrl || CANVA_LANDSCAPE_PLACEHOLDER}
                        alt=""
                        draggable={false}
                        style={
                          cell.photo
                            ? getPhotoImageStyle(cell)
                            : {
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: 0.8,
                              }
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {(page.floatingTexts || []).map((text) => (
        <div
          key={text.id}
          style={{
            position: 'absolute',
            zIndex: 20,
            left: `${text.x}%`,
            top: `${text.y}%`,
            width: text.width ? `${text.width}px` : 'auto',
            transform: `translate(-50%, -50%) rotate(${text.rotation || 0}deg)`,
          }}
        >
          <div
            style={{
              ...getFloatingTextStyle(text, colorMode),
              width: '100%',
              padding: '4px',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          >
            {text.text}
          </div>
        </div>
      ))}
    </div>
  );
};
