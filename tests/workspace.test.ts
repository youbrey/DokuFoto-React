import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../src/utils/constants';
import { createProjectDocxBlob } from '../src/utils/docxExport';
import { createPrintMarkup } from '../src/utils/printMarkup';
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

  it('exports each free text element exactly once in DOCX', async () => {
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

    const blob = await createProjectDocxBlob(project);
    const archive = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await archive.file('word/document.xml')!.async('string');

    expect(documentXml.match(new RegExp(token, 'g'))).toHaveLength(1);
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
});
