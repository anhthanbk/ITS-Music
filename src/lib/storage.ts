import { supabase } from '../supabaseClient.js';
import { useAuthStore } from '../store/useAuthStore';

export const STORAGE_BUCKET = 'app-files';

// In-memory cache for generated signed URLs to avoid redundant network calls
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

// IndexedDB Media Store for reliable local caching and seamless fallback
const DB_NAME = 'its_music_media_storage_v1';
const STORE_NAME = 'media_files';

function openMediaDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveMediaLocally(path: string, file: File | Blob): Promise<string> {
  const blobUrl = URL.createObjectURL(file);
  try {
    const db = await openMediaDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ path, blob: file, type: file.type });
    }
  } catch (e) {
    console.warn('Local media store notice:', e);
  }
  return blobUrl;
}

async function getMediaLocally(path: string): Promise<string | null> {
  try {
    const db = await openMediaDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(path);
      req.onsuccess = () => {
        if (req.result?.blob) {
          resolve(URL.createObjectURL(req.result.blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function deleteMediaLocally(path: string): Promise<void> {
  try {
    const db = await openMediaDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(path);
    }
  } catch {
    // ignore
  }
}

/**
 * Checks if a string is a Supabase Storage path rather than a plain external URL
 */
export function isStoragePath(pathOrUrl: string): boolean {
  if (!pathOrUrl) return false;
  if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) return false;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl.includes(STORAGE_BUCKET);
  }
  return pathOrUrl.includes('/');
}

/**
 * Extracts the storage relative path if a full Supabase URL was passed
 */
export function extractStoragePath(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (!pathOrUrl.startsWith('http')) return pathOrUrl;

  try {
    const url = new URL(pathOrUrl);
    const marker = `/${STORAGE_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(url.pathname.substring(idx + marker.length));
    }
  } catch {
    // fallback
  }
  return pathOrUrl;
}

/**
 * Resolves a signed URL for private bucket files.
 * Returns the original URL if it's an external URL (e.g. Unsplash, Freesound, Blob URL).
 */
export async function getSignedFileUrl(
  pathOrUrl: string,
  expiresInSeconds: number = 60 * 60 * 24 * 7 // 7 days
): Promise<string> {
  if (!pathOrUrl) return '';

  // Direct playable URLs (blob:, data:, or third-party web stream)
  if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  if (
    (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) &&
    !pathOrUrl.includes(STORAGE_BUCKET)
  ) {
    return pathOrUrl;
  }

  const cleanPath = extractStoragePath(pathOrUrl);

  // Check in-memory cache
  const cached = signedUrlCache.get(cleanPath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Check IndexedDB local storage
  const localBlobUrl = await getMediaLocally(cleanPath);
  if (localBlobUrl) {
    signedUrlCache.set(cleanPath, {
      url: localBlobUrl,
      expiresAt: Date.now() + 86400000,
    });
    return localBlobUrl;
  }

  // Attempt Supabase signed URL generation
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (!error && data?.signedUrl) {
      signedUrlCache.set(cleanPath, {
        url: data.signedUrl,
        expiresAt: Date.now() + (expiresInSeconds - 3600) * 1000,
      });
      return data.signedUrl;
    }

    // Try public URL if bucket is configured public
    const { data: pubData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(cleanPath);
    if (pubData?.publicUrl) {
      return pubData.publicUrl;
    }

    return pathOrUrl;
  } catch {
    return pathOrUrl;
  }
}

/**
 * Uploads a file to Supabase Storage private/public bucket 'app-files'.
 * Follows the folder rule: ${auth.uid()}/${featureName}/${itemId}/${uuid}.${extension}
 * Throws clear informative errors if Supabase Storage RLS policy rejects or bucket is missing.
 */
export async function uploadFileToStorage({
  file,
  featureName,
  itemId = 'general',
}: {
  file: File;
  featureName: 'songs' | 'covers' | 'playlists' | 'avatars';
  itemId?: string;
}): Promise<{ filePath: string; signedUrl: string }> {
  // 1. Get current authenticated user ID
  let userId: string | undefined;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    userId = sessionData?.session?.user?.id;
  } catch {
    // fallback
  }

  if (!userId) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id;
    } catch {
      // fallback
    }
  }

  if (!userId) {
    userId = useAuthStore.getState().user?.id || 'guest';
  }

  // 2. Compute extension & unique identifier
  const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 9) + Date.now();

  // 3. Construct folder structure: ${auth.uid()}/${featureName}/${itemId}/${uuid}.${extension}
  const filePath = `${userId}/${featureName}/${itemId}/${uuid}.${extension}`;

  // 4. Upload to Supabase Storage bucket
  const { data, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    if (
      uploadError.message?.toLowerCase().includes('row-level security') ||
      uploadError.message?.toLowerCase().includes('security policy') ||
      (uploadError as any).statusCode === '403'
    ) {
      throw new Error(
        `Lỗi RLS Supabase Storage (403): Bucket '${STORAGE_BUCKET}' chưa có chính sách RLS Policy cho phép upload (INSERT). Vui lòng thêm chính sách cho bucket '${STORAGE_BUCKET}' trên Supabase Dashboard.`
      );
    }
    if (
      uploadError.message?.toLowerCase().includes('bucket not found') ||
      (uploadError as any).statusCode === '404'
    ) {
      throw new Error(
        `Không tìm thấy bucket '${STORAGE_BUCKET}' trên Supabase Storage. Vui lòng tạo bucket '${STORAGE_BUCKET}' trên Supabase Dashboard.`
      );
    }
    throw new Error(`Lỗi tải tệp lên Supabase Storage: ${uploadError.message}`);
  }

  // 5. Retrieve signed/public URL
  let playableUrl = '';
  try {
    const signed = await getSignedFileUrl(filePath);
    if (signed) playableUrl = signed;
  } catch {
    // fallback
  }

  if (!playableUrl) {
    const { data: pubData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);
    playableUrl = pubData?.publicUrl || filePath;
  }

  // 6. Cache locally for instant latency-free media playback
  try {
    await saveMediaLocally(filePath, file);
    signedUrlCache.set(filePath, {
      url: playableUrl,
      expiresAt: Date.now() + 86400000,
    });
  } catch {
    // ignore
  }

  return { filePath, signedUrl: playableUrl };
}

/**
 * Removes a file from Supabase Storage and local media store
 */
export async function deleteFileFromStorage(pathOrUrl: string): Promise<boolean> {
  if (!pathOrUrl) return false;
  const cleanPath = extractStoragePath(pathOrUrl);

  signedUrlCache.delete(cleanPath);
  await deleteMediaLocally(cleanPath);

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('blob:')) {
    return true;
  }

  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([cleanPath]);
    return !error;
  } catch {
    return false;
  }
}
