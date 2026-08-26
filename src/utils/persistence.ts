import type { DocumentProject, PhotoMetadata } from '../types';
import {
  createWorkspaceSnapshot,
  isDocumentProject,
  isPhotoMetadata,
  type WorkspaceSnapshot,
} from './workspace';

const DATABASE_NAME = 'setwan-dokufoto';
const DATABASE_VERSION = 1;
const STORE_NAME = 'workspace';
const CURRENT_KEY = 'current';

const LEGACY_PROJECT_KEY = 'setwan_dokufoto_project_v2';
const LEGACY_PHOTOS_KEY = 'setwan_dokufoto_photos_v2';

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB tidak dapat dibuka.'));
  });

const readLegacyWorkspace = (): WorkspaceSnapshot | null => {
  try {
    const rawProject = localStorage.getItem(LEGACY_PROJECT_KEY);
    if (!rawProject) return null;
    const project: unknown = JSON.parse(rawProject);
    if (!isDocumentProject(project)) return null;

    const rawPhotos = localStorage.getItem(LEGACY_PHOTOS_KEY);
    const parsedPhotos: unknown = rawPhotos ? JSON.parse(rawPhotos) : [];
    const photos: PhotoMetadata[] = Array.isArray(parsedPhotos)
      ? parsedPhotos.filter(isPhotoMetadata)
      : [];
    return createWorkspaceSnapshot(project, photos);
  } catch {
    return null;
  }
};

export const loadWorkspace = async (): Promise<WorkspaceSnapshot | null> => {
  const database = await openDatabase();
  try {
    const stored = await new Promise<WorkspaceSnapshot | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(CURRENT_KEY);
      request.onsuccess = () => resolve((request.result as WorkspaceSnapshot | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('Proyek lokal gagal dibaca.'));
    });
    if (stored && isDocumentProject(stored.project) && Array.isArray(stored.photos)) {
      return stored;
    }
  } finally {
    database.close();
  }

  return readLegacyWorkspace();
};

export const saveWorkspace = async (
  project: DocumentProject,
  photos: PhotoMetadata[],
): Promise<void> => {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(createWorkspaceSnapshot(project, photos), CURRENT_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Proyek lokal gagal disimpan.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Penyimpanan proyek dibatalkan.'));
    });
    try {
      localStorage.removeItem(LEGACY_PROJECT_KEY);
      localStorage.removeItem(LEGACY_PHOTOS_KEY);
    } catch {
      // IndexedDB sudah tersimpan; pembersihan data lama bukan kegagalan autosave.
    }
  } finally {
    database.close();
  }
};
