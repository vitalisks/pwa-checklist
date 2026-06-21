import { useState, useEffect, useRef } from 'react';
import type { StoragePort } from '@/shared/api';

export function usePhotoThumbs(
  photoIds: string[],
  storage: StoragePort,
): { thumbs: Record<string, string>; loading: boolean } {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const idsKey = photoIds.join(',');

  useEffect(() => {
    if (photoIds.length === 0) return;
    cancelledRef.current = false;
    const load = async () => {
      setLoading(true);
      const map: Record<string, string> = {};
      for (const pid of photoIds) {
        try {
          const photo = await storage.getPhoto(pid);
          if (photo && !cancelledRef.current) map[pid] = photo.dataUrl;
        } catch {
          // ignore
        }
      }
      if (!cancelledRef.current) {
        setThumbs(map);
        setLoading(false);
      }
    };
    load();
    return () => { cancelledRef.current = true; };
  }, [idsKey, storage]); // eslint-disable-line react-hooks/exhaustive-deps

  return { thumbs, loading };
}
