import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../src/utils/constants';
import { createProjectDocxBlob } from '../src/utils/docxExport';
import { createPrintMarkup, createRasterPagesHtml } from '../src/utils/printMarkup';
import { getDocumentGeometry } from '../src/utils/pageVisual';
import JSZip from 'jszip';
import {
  createWorkspaceSnapshot,
  deduplicatePhotos,
  parseWorkspaceJson,
  serializeWorkspace,
} from '../src/utils/workspace';

const photo = {
  id: 'photo-test',
  name: 'foto.png',
  dataUrl: 'data:image/png;base64,AA==',
};

describe('workspace files', () => {
  it('round-trips a complete workspace', () => {
    const project = createDefaultProject();
    const parsed = parseWorkspaceJson(serializeWorkspace(project, [photo]));

    expect(parsed.project.title).toBe(project.title);
    expect(parsed.photos).toEqual([photo]);
    expect(parsed.schemaVersion).toBe(1);
  });

  it('loads legacy project-only JSON', () => {
    const project = createDefaultProject();
    const parsed = parseWorkspaceJson(JSON.stringify(project));

    expect(parsed.project.id).toBe(project.id);
    expect(parsed.photos).toEqual([]);
  });

  it('rejects malformed and unsupported workspace files', () => {
    expect(() => parseWorkspaceJson('{not json')).toThrow('bukan JSON');
    expect(() =>
      parseWorkspaceJson(
        JSON.stringify({ ...createWorkspaceSnapshot(createDefaultProject(), []), schemaVersion: 99 }),
      ),
    ).toThrow('belum didukung');
    expect(() => parseWorkspaceJson(JSON.stringify({ pages: [] }))).toThrow('bukan proyek');
  });

  it('removes duplicate photos by id or data URL', () => {
    expect(
      deduplicatePhotos([
        photo,
        { ...photo, name: 'nama-lain.png' },
        { ...photo, id: 'photo-lain' },
      ]),
    ).toEqual([photo]);
  });

  it('exports each page as one flattened WYSIWYG image in DOCX', async () => {
    const project = createDefaultProject();
    const token = 'TEKS-UNIK-TIDAK-BOLEH-DUPLIKAT';
    project.pages[0].floatingTexts = [
      {
        id: 'text-unique',
        text: token,
        x: 50,
        y: 10,
        width: 400,
        fontSize: 18,
        fontFamily: 'Arial',
        textAlign: 'center',
      },
    ];

    const pagePng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';
    const blob = await createProjectDocxBlob(project, [
      {
        pageId: project.pages[0].id,
        dataUrl: pagePng,
        widthPx: 2480,
        heightPx: 3508,
      },
    ]);
    const archive = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await archive.file('word/document.xml')!.async('string');
    const mediaFiles = Object.keys(archive.files).filter(
      (path) => path.startsWith('word/media/') && !archive.files[path].dir,
    );

    expect(mediaFiles).toHaveLength(1);
    expect(documentXml).toContain('<w:drawing>');
    expect(documentXml).toContain('<wp:anchor');
    expect(documentXml).not.toContain('<w:tbl>');
    expect(documentXml).not.toContain(token);
  });

  it('does not create removed standard document sections', () => {
    const page = createDefaultProject().pages[0] as unknown as Record<string, unknown>;

    expect(page).not.toHaveProperty('showTitle');
    expect(page).not.toHaveProperty('metaTable');
    expect(page).not.toHaveProperty('signatureBlock');
  });

  it('removes retired document sections from legacy workspaces', () => {
    const project = createDefaultProject();
    Object.assign(project.pages[0] as unknown as Record<string, unknown>, {
      subtitle: 'Subjudul lama',
      metaTable: [{ label: 'Tanggal', value: '17 Agustus 2026' }],
      signatureBlock: { enabled: true },
      showTitle: true,
      showMetaTable: true,
      showSignature: true,
    });

    const parsed = parseWorkspaceJson(JSON.stringify(project));
    const page = parsed.project.pages[0] as unknown as Record<string, unknown>;

    expect(page).not.toHaveProperty('subtitle');
    expect(page).not.toHaveProperty('metaTable');
    expect(page).not.toHaveProperty('signatureBlock');
    expect(page).not.toHaveProperty('showTitle');
    expect(page).not.toHaveProperty('showMetaTable');
    expect(page).not.toHaveProperty('showSignature');
  });

  it('creates a populated print document with a valid physical page size', () => {
    const markup = createPrintMarkup({
      title: 'Dokumen & Cetak',
      fontFamily: 'Arial',
      widthMm: 215,
      heightMm: 330,
      localStyles: '.grid { display: grid; }',
      innerHtml: '<div class="print-single-page"><img src="data:image/png;base64,AA=="></div>',
    });

    expect(markup).toContain('<title>Dokumen &amp; Cetak</title>');
    expect(markup).toContain('size: 215mm 330mm;');
    expect(markup).not.toContain('330mm portrait');
    expect(markup).toContain('data:image/png;base64,AA==');
    expect(markup).toContain('.print-single-page:last-child');
  });

  it('uses complete rendered page images for print output', () => {
    const pages = createRasterPagesHtml([
      'data:image/png;base64,PAGE_ONE',
      'data:image/png;base64,PAGE_TWO',
    ]);

    expect(pages.match(/class="print-single-page"/g)).toHaveLength(2);
    expect(pages).toContain('data:image/png;base64,PAGE_ONE');
    expect(pages).toContain('data:image/png;base64,PAGE_TWO');
    expect(pages).toContain('class="print-page-image"');
  });

  it('uses custom paper geometry consistently in landscape', () => {
    const project = createDefaultProject();
    project.paperSize = 'Custom';
    project.customWidthMm = 180;
    project.customHeightMm = 260;
    project.orientation = 'landscape';

    const geometry = getDocumentGeometry(project);

    expect(geometry.widthMm).toBe(260);
    expect(geometry.heightMm).toBe(180);
    expect(geometry.baseCanvasHeight).toBe(560);
    expect(geometry.baseCanvasWidth).toBe(Math.round(560 * (260 / 180)));
  });
});
