import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../src/utils/constants';
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
});
